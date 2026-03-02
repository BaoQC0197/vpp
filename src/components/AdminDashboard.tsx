// src/components/AdminDashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import type { ProductInput } from '../types/product';
import type { Order, OrderStatus } from '../types/order';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../types/order';
import { getOrders, updateOrderStatus, deleteOrder } from '../api/orders';
import ImageUpload from './ImageUpload';
import { FIXED_CATEGORIES } from '../constants/categories';

interface AdminDashboardProps {
    onAdd: (product: ProductInput) => Promise<void>;
}

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'delivering', 'delivered', 'cancelled'];

interface FormErrors { name?: string; price?: string; image?: string; }

// ===================== ADD PRODUCT FORM =====================
const CUSTOM_KEY = '__custom__'; // sentinel value for "custom category" option

function AddProductForm({ onAdd }: { onAdd: (product: ProductInput) => Promise<void> }) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState('');
    const [description, setDescription] = useState('');
    const [selectValue, setSelectValue] = useState('but'); // selected option in <select>
    const [customCategory, setCustomCategory] = useState('');  // free-text khi chọn "Thêm mới"
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [showSuccess, setShowSuccess] = useState(false);
    const [imageKey, setImageKey] = useState(0);

    // Danh mục thực tế sẽ được lưu (bỏ 'khac' nếu không phải custom)
    const effectiveCategory = selectValue === CUSTOM_KEY ? customCategory.trim() : selectValue;

    const validate = (): boolean => {
        const e: FormErrors = {};
        if (!name.trim()) e.name = 'Vui lòng nhập tên sản phẩm';
        if (!price) e.price = 'Vui lòng nhập giá';
        else if (isNaN(parseInt(price)) || parseInt(price) <= 0) e.price = 'Giá không hợp lệ';
        if (!image) e.image = 'Vui lòng upload ảnh sản phẩm';
        if (selectValue === CUSTOM_KEY && !customCategory.trim()) e.name = (e.name ? e.name + ' | ' : '') + 'Vui lòng nhập tên danh mục mới';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const resetForm = () => {
        setName(''); setPrice(''); setImage('');
        setDescription(''); setSelectValue('but'); setCustomCategory('');
        setErrors({}); setImageKey((k) => k + 1);
    };

    const handleAdd = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await onAdd({ name: name.trim(), price: parseInt(price), image, description, category: effectiveCategory });
            resetForm();
            setShowSuccess(true);
        } catch {
            setErrors((p) => ({ ...p, name: 'Lỗi khi thêm sản phẩm, thử lại nhé!' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {showSuccess && (
                <div className="popup-overlay" onClick={() => setShowSuccess(false)}>
                    <div className="popup-card" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-icon">✅</div>
                        <h3 className="popup-title">Thêm thành công!</h3>
                        <p className="popup-msg">Sản phẩm đã được thêm vào danh sách.</p>
                        <button className="popup-btn" onClick={() => setShowSuccess(false)}>OK</button>
                    </div>
                </div>
            )}
            <div className="add-product-form">
                <input
                    placeholder="Tên sản phẩm *"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                    className={errors.name ? 'input-error' : ''}
                />
                {errors.name && <p className="field-error">{errors.name}</p>}

                <input
                    placeholder="Giá (VNĐ) *"
                    type="number"
                    value={price}
                    onChange={(e) => { setPrice(e.target.value); setErrors((p) => ({ ...p, price: undefined })); }}
                    className={errors.price ? 'input-error' : ''}
                />
                {errors.price && <p className="field-error">{errors.price}</p>}

                <label className="field-label">Ảnh sản phẩm *</label>
                <ImageUpload
                    key={imageKey}
                    onUploaded={(url) => { setImage(url); setErrors((p) => ({ ...p, image: undefined })); }}
                />
                {errors.image && <p className="field-error">{errors.image}</p>}

                <textarea
                    placeholder="Mô tả (không bắt buộc)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                {/* Category selector */}
                <label className="field-label">Danh mục</label>
                <select
                    value={selectValue}
                    onChange={(e) => { setSelectValue(e.target.value); setCustomCategory(''); }}
                >
                    {FIXED_CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
                    ))}
                    <option value={CUSTOM_KEY}>➕ Thêm danh mục mới...</option>
                </select>

                {/* Free-text input khi chọn "Thêm danh mục mới" */}
                {selectValue === CUSTOM_KEY && (
                    <input
                        placeholder="Nhập tên danh mục mới *"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        autoFocus
                        className="custom-category-input"
                    />
                )}

                <div className="btn-wrapper">
                    <button onClick={handleAdd} className="btn-add" disabled={loading}>
                        {loading ? 'Đang thêm...' : '+ Thêm sản phẩm'}
                    </button>
                </div>
            </div>
        </>
    );
}

// ===================== ORDER HISTORY =====================
const PAGE_SIZE = 10;

function OrderHistory() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
    const [currentPage, setCurrentPage] = useState(1);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        const data = await getOrders();
        setOrders(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
        setUpdatingId(orderId);
        try {
            await updateOrderStatus(orderId, newStatus);
            setOrders((prev) =>
                prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
            );
            // Collapse if changing to cancelled
            if (newStatus === 'cancelled') setExpandedId(null);
        } catch {
            alert('Cập nhật thất bại, thử lại nhé!');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (orderId: number) => {
        if (!confirm(`Xoá đơn hàng #${orderId}? Hành động này không thể hoàn tác.`)) return;
        setDeletingId(orderId);
        try {
            await deleteOrder(orderId);
            setOrders((prev) => prev.filter((o) => o.id !== orderId));
            // Adjust page if last item on page was deleted
            const newFiltered = orders.filter((o) =>
                o.id !== orderId && (filterStatus === 'all' || o.status === filterStatus)
            );
            const maxPage = Math.max(1, Math.ceil(newFiltered.length / PAGE_SIZE));
            if (currentPage > maxPage) setCurrentPage(maxPage);
        } catch {
            alert('Xoá thất bại, thử lại nhé!');
        } finally {
            setDeletingId(null);
        }
    };

    // Filter + paginate
    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter((o) => o.status === filterStatus);

    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    const pagedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleFilterChange = (status: OrderStatus | 'all') => {
        setFilterStatus(status);
        setCurrentPage(1);
        setExpandedId(null);
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

    if (loading) return <div className="order-loading">⏳ Đang tải đơn hàng...</div>;

    return (
        <div className="order-history">
            {/* Filter bar */}
            <div className="order-filter-bar">
                <button
                    className={`order-filter-btn${filterStatus === 'all' ? ' active' : ''}`}
                    onClick={() => handleFilterChange('all')}
                >
                    Tất cả ({orders.length})
                </button>
                {ALL_STATUSES.map((s) => (
                    <button
                        key={s}
                        className={`order-filter-btn${filterStatus === s ? ' active' : ''}`}
                        onClick={() => handleFilterChange(s)}
                    >
                        {ORDER_STATUS_LABELS[s]} ({orders.filter((o) => o.status === s).length})
                    </button>
                ))}
            </div>

            {filteredOrders.length === 0 ? (
                <div className="order-empty-state">
                    <span>📭</span>
                    <p>Không có đơn hàng nào.</p>
                </div>
            ) : (
                <>
                    {/* Summary */}
                    <p className="order-list-summary">
                        Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} / {filteredOrders.length} đơn hàng
                    </p>

                    <div className="order-table-wrapper">
                        {pagedOrders.map((order) => (
                            <div key={order.id} className={`order-card${order.status === 'cancelled' ? ' cancelled' : ''}`}>
                                {/* Order header row */}
                                <div
                                    className="order-card-header"
                                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                                >
                                    <div className="order-card-left">
                                        <span className="order-id">#{order.id}</span>
                                        <div>
                                            <p className="order-customer">{order.customer_name}</p>
                                            <p className="order-phone">{order.customer_phone}</p>
                                        </div>
                                    </div>
                                    <div className="order-card-right">
                                        <span
                                            className="order-status-badge"
                                            style={{
                                                backgroundColor: ORDER_STATUS_COLORS[order.status] + '20',
                                                color: ORDER_STATUS_COLORS[order.status],
                                                borderColor: ORDER_STATUS_COLORS[order.status] + '40'
                                            }}
                                        >
                                            {ORDER_STATUS_LABELS[order.status]}
                                        </span>
                                        <span className="order-total">{order.total_price.toLocaleString('vi-VN')} đ</span>
                                        <span className="order-date">{formatDate(order.created_at)}</span>

                                        {/* Nút xoá chỉ hiện khi đơn đã huỷ */}
                                        {order.status === 'cancelled' && (
                                            <button
                                                className="order-delete-btn"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }}
                                                disabled={deletingId === order.id}
                                                title="Xoá đơn đã huỷ"
                                            >
                                                {deletingId === order.id ? '...' : '🗑'}
                                            </button>
                                        )}

                                        <span className="order-expand">{expandedId === order.id ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                {expandedId === order.id && (
                                    <div className="order-card-detail">
                                        <div className="order-detail-info">
                                            <p><strong>📍 Địa chỉ:</strong> {order.address}</p>
                                            {order.note && <p><strong>📝 Ghi chú:</strong> {order.note}</p>}
                                        </div>

                                        {/* Items */}
                                        <table className="order-items-table">
                                            <thead>
                                                <tr>
                                                    <th>Sản phẩm</th>
                                                    <th>Đơn giá</th>
                                                    <th>SL</th>
                                                    <th>Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.order_items?.map((item, i) => (
                                                    <tr key={i}>
                                                        <td>{item.product_name}</td>
                                                        <td>{item.price.toLocaleString('vi-VN')} đ</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{(item.price * item.quantity).toLocaleString('vi-VN')} đ</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {/* Status changer — ẩn nếu đã huỷ */}
                                        {order.status !== 'cancelled' && (
                                            <div className="order-status-changer">
                                                <span>Đổi trạng thái:</span>
                                                <div className="order-status-btns">
                                                    {ALL_STATUSES.filter(s => s !== 'cancelled').map((s) => (
                                                        <button
                                                            key={s}
                                                            className={`order-status-btn${order.status === s ? ' current' : ''}`}
                                                            style={order.status === s ? { backgroundColor: ORDER_STATUS_COLORS[s], color: 'white', borderColor: ORDER_STATUS_COLORS[s] } : {}}
                                                            onClick={() => handleStatusChange(order.id, s)}
                                                            disabled={order.status === s || updatingId === order.id}
                                                        >
                                                            {updatingId === order.id && order.status !== s ? '...' : ORDER_STATUS_LABELS[s]}
                                                        </button>
                                                    ))}
                                                    {/* Nút Huỷ riêng — màu đỏ */}
                                                    <button
                                                        className="order-status-btn cancel-btn"
                                                        onClick={() => handleStatusChange(order.id, 'cancelled')}
                                                        disabled={updatingId === order.id}
                                                    >
                                                        Huỷ đơn
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Đơn đã huỷ — chỉ có nút xoá */}
                                        {order.status === 'cancelled' && (
                                            <div className="order-cancelled-actions">
                                                <p className="order-cancelled-note">⚠️ Đơn đã huỷ — không thể thay đổi trạng thái</p>
                                                <button
                                                    className="order-delete-full-btn"
                                                    onClick={() => handleDelete(order.id)}
                                                    disabled={deletingId === order.id}
                                                >
                                                    {deletingId === order.id ? 'Đang xoá...' : '🗑 Xoá đơn hàng này'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="order-pagination">
                            <button
                                className="page-btn"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                ← Trước
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    className={`page-btn${currentPage === page ? ' active' : ''}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                className="page-btn"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Sau →
                            </button>
                        </div>
                    )}
                </>
            )}

            <button className="order-refresh-btn" onClick={loadOrders}>🔄 Làm mới</button>
        </div>
    );
}



// ===================== ADMIN DASHBOARD (Main) =====================
type Tab = 'products' | 'orders';

export default function AdminDashboard({ onAdd }: AdminDashboardProps) {
    const [activeTab, setActiveTab] = useState<Tab>('products');

    return (
        <div className="admin-dashboard" id="admin-dashboard">
            {/* Tab bar */}
            <div className="dashboard-tabs">
                <button
                    className={`dashboard-tab${activeTab === 'products' ? ' active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    📦 Quản lý sản phẩm
                </button>
                <button
                    className={`dashboard-tab${activeTab === 'orders' ? ' active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    📋 Đơn hàng
                </button>
            </div>

            {/* Tab content */}
            <div className="dashboard-content">
                {activeTab === 'products' && <AddProductForm onAdd={onAdd} />}
                {activeTab === 'orders' && <OrderHistory />}
            </div>
        </div>
    );
}
