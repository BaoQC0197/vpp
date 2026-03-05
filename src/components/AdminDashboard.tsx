// src/components/AdminDashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import type { Product, ProductInput } from '../types/product';
import type { Order, OrderStatus } from '../types/order';
import type { Category } from '../types/category';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../types/order';
import { getOrders, updateOrderStatus, deleteOrder, markOrderAsRead } from '../api/orders';
import { addProductImages } from '../api/products';
import MultiImageUpload from './MultiImageUpload';
import CategoryManager from './CategoryManager';
import PromotionManager from './PromotionManager';
import styles from './AdminDashboard.module.css';

interface AdminDashboardProps {
    onAdd: (product: ProductInput) => Promise<number>;
    categories: Category[];
    onRefreshCategories: () => void;
    productCategoryCounts: Record<string, number>;
    products: Product[];
}

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'delivering', 'delivered', 'cancelled'];

interface FormErrors { name?: string; price?: string; image?: string; }

// ===================== ADD PRODUCT FORM =====================
const CUSTOM_KEY = '__custom__';

function AddProductForm({ onAdd, categories }: { onAdd: (product: ProductInput) => Promise<number>; categories: Category[] }) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');   // raw digits, e.g. "2000000"
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [selectValue, setSelectValue] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (categories.length > 0 && !selectValue) setSelectValue(categories[0].key);
    }, [categories, selectValue]);

    const effectiveCategory = selectValue === CUSTOM_KEY ? customCategory.trim() : selectValue;

    const validate = (): boolean => {
        const e: FormErrors = {};
        if (!name.trim()) e.name = 'Vui lòng nhập tên sản phẩm';
        if (!price) e.price = 'Vui lòng nhập giá';
        else if (parseInt(price) <= 0) e.price = 'Giá không hợp lệ';
        if (!imageUrls.length) e.image = 'Vui lòng upload ít nhất 1 ảnh sản phẩm';
        if (selectValue === CUSTOM_KEY && !customCategory.trim()) e.name = (e.name ? e.name + ' | ' : '') + 'Vui lòng nhập tên danh mục mới';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const resetForm = () => {
        setName(''); setPrice(''); setImageUrls([]);
        setDescription(''); setCustomCategory('');
        setErrors({});
    };

    const handleAdd = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const primaryImage = imageUrls[0];
            const newId = await onAdd({ name: name.trim(), price: parseInt(price), image: primaryImage, description, category: effectiveCategory });
            // Save gallery images (position 0..n)
            await addProductImages(newId, imageUrls);
            resetForm(); setShowSuccess(true);
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
            <div className={styles.addProductForm}>
                <input placeholder="Tên sản phẩm *" value={name}
                    onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
                    className={errors.name ? 'input-error' : ''} />
                {errors.name && <p className="field-error">{errors.name}</p>}

                <input
                    placeholder="Giá (VNĐ) *"
                    type="text"
                    inputMode="numeric"
                    value={price ? price.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                    onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        setPrice(digits);
                        setErrors(p => ({ ...p, price: undefined }));
                    }}
                    className={errors.price ? 'input-error' : ''}
                />
                {errors.price && <p className="field-error">{errors.price}</p>}

                <label className="field-label">Ảnh sản phẩm * (ảnh đầu = ảnh chính)</label>
                <MultiImageUpload urls={imageUrls} onChange={(urls) => { setImageUrls(urls); setErrors(p => ({ ...p, image: undefined })); }} />
                {errors.image && <p className="field-error">{errors.image}</p>}

                <textarea placeholder="Mô tả (không bắt buộc)" value={description} onChange={(e) => setDescription(e.target.value)} />

                <label className="field-label">Danh mục</label>
                <select value={selectValue} onChange={(e) => { setSelectValue(e.target.value); setCustomCategory(''); }}>
                    {categories.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                    <option value={CUSTOM_KEY}>➕ Thêm danh mục mới...</option>
                </select>

                {selectValue === CUSTOM_KEY && (
                    <input placeholder="Nhập tên danh mục mới *" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} autoFocus />
                )}

                <div className={styles.btnWrapper}>
                    <button onClick={handleAdd} className={styles.btnAdd} disabled={loading}>
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
    const [phoneFilter, setPhoneFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        const data = await getOrders();
        setOrders(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    const handleExpandToggle = async (order: Order) => {
        if (expandedId !== order.id) {
            setExpandedId(order.id);
            // Mark as read if it's unread
            if (!order.is_read) {
                try {
                    await markOrderAsRead(order.id);
                    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, is_read: true } : o));
                } catch (err) {
                    console.error('Failed to mark order as read:', err);
                }
            }
        } else {
            setExpandedId(null);
        }
    };

    const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
        setUpdatingId(orderId);
        try {
            await updateOrderStatus(orderId, newStatus);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (newStatus === 'cancelled') setExpandedId(null);
        } catch { alert('Cập nhật thất bại, thử lại nhé!'); }
        finally { setUpdatingId(null); }
    };

    const handleDelete = async (orderId: number) => {
        if (!confirm(`Xoá đơn hàng #${orderId}? Hành động này không thể hoàn tác.`)) return;
        setDeletingId(orderId);
        try {
            await deleteOrder(orderId);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            const newFiltered = orders.filter(o => o.id !== orderId && (filterStatus === 'all' || o.status === filterStatus));
            const maxPage = Math.max(1, Math.ceil(newFiltered.length / PAGE_SIZE));
            if (currentPage > maxPage) setCurrentPage(maxPage);
        } catch { alert('Xoá thất bại, thử lại nhé!'); }
        finally { setDeletingId(null); }
    };

    const filteredOrders = orders
        .filter(o => filterStatus === 'all' || o.status === filterStatus)
        .filter(o => {
            const q = phoneFilter.replace(/\s/g, '');
            return !q || o.customer_phone.replace(/\s/g, '').includes(q);
        });
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    const pagedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleFilterChange = (status: OrderStatus | 'all') => {
        setFilterStatus(status);
        setCurrentPage(1);
        setExpandedId(null);
    };
    const handlePhoneFilter = (value: string) => {
        setPhoneFilter(value);
        setCurrentPage(1);
        setExpandedId(null);
    };
    const formatDate = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

    if (loading) return <div className={styles.orderLoading}>⏳ Đang tải đơn hàng...</div>;

    return (
        <div className={styles.orderHistory}>
            {/* Phone search */}
            <div className={styles.phoneSearchRow}>
                <span className={styles.phoneSearchIcon}>🔍</span>
                <input
                    type="tel"
                    className={styles.phoneSearchInput}
                    placeholder="Tìm theo số điện thoại..."
                    value={phoneFilter}
                    onChange={e => handlePhoneFilter(e.target.value)}
                />
                {phoneFilter && (
                    <button className={styles.phoneSearchClear} onClick={() => handlePhoneFilter('')}>✕</button>
                )}
            </div>

            <div className={styles.orderFilterBar}>
                <button className={`${styles.orderFilterBtn}${filterStatus === 'all' ? ' ' + styles.active : ''}`} onClick={() => handleFilterChange('all')}>
                    Tất cả ({orders.length})
                </button>
                {ALL_STATUSES.map(s => (
                    <button key={s} className={`${styles.orderFilterBtn}${filterStatus === s ? ' ' + styles.active : ''}`} onClick={() => handleFilterChange(s)}>
                        {ORDER_STATUS_LABELS[s]} ({orders.filter(o => o.status === s).length})
                    </button>
                ))}
            </div>

            {filteredOrders.length === 0 ? (
                <div className={styles.orderEmptyState}><span>📭</span><p>Không có đơn hàng nào.</p></div>
            ) : (
                <>
                    <p className={styles.orderListSummary}>
                        Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} / {filteredOrders.length} đơn hàng
                    </p>

                    <div className={styles.orderTableWrapper}>
                        {pagedOrders.map(order => (
                            <div key={order.id} className={`${styles.orderCard}${order.status === 'cancelled' ? ' ' + styles.cancelled : ''}${!order.is_read ? ' ' + styles.unread : ''}`}>
                                <div className={styles.orderCardHeader} onClick={() => handleExpandToggle(order)}>
                                    <div className={styles.orderCardLeft}>
                                        <span className={styles.orderId}>#{order.id}</span>
                                        {!order.is_read && <span className={styles.newLabel}>MỚI</span>}
                                        <div>
                                            <p className={styles.orderCustomer}>{order.customer_name}</p>
                                            <p className={styles.orderPhone}>{order.customer_phone}</p>
                                        </div>
                                    </div>
                                    <div className={styles.orderCardRight}>
                                        <span className={styles.orderStatusBadge} style={{ backgroundColor: ORDER_STATUS_COLORS[order.status] + '20', color: ORDER_STATUS_COLORS[order.status], borderColor: ORDER_STATUS_COLORS[order.status] + '40' }}>
                                            {ORDER_STATUS_LABELS[order.status]}
                                        </span>
                                        <span className={styles.orderTotal}>{order.total_price.toLocaleString('vi-VN')} đ</span>
                                        <span className={styles.orderDate}>{formatDate(order.created_at)}</span>

                                        {order.status === 'cancelled' && (
                                            <button className={styles.orderDeleteBtn} onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }} disabled={deletingId === order.id} title="Xoá đơn đã huỷ">
                                                {deletingId === order.id ? '...' : '🗑'}
                                            </button>
                                        )}
                                        <span className={styles.orderExpand}>{expandedId === order.id ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {expandedId === order.id && (
                                    <div className={styles.orderCardDetail}>
                                        <div className={styles.orderDetailInfo}>
                                            <p><strong>📍 Địa chỉ:</strong> {order.address}</p>
                                            {order.note && <p><strong>📝 Ghi chú:</strong> {order.note}</p>}
                                        </div>

                                        <table className={styles.orderItemsTable}>
                                            <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th></tr></thead>
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

                                        {order.status !== 'cancelled' && (
                                            <div className={styles.orderStatusChanger}>
                                                <span>Đổi trạng thái:</span>
                                                <div className={styles.orderStatusBtns}>
                                                    {ALL_STATUSES.filter(s => s !== 'cancelled').map(s => (
                                                        <button key={s}
                                                            className={`${styles.orderStatusBtn}${order.status === s ? ' ' + styles.current : ''}`}
                                                            style={order.status === s ? { backgroundColor: ORDER_STATUS_COLORS[s], color: 'white', borderColor: ORDER_STATUS_COLORS[s] } : {}}
                                                            onClick={() => handleStatusChange(order.id, s)}
                                                            disabled={order.status === s || updatingId === order.id}
                                                        >
                                                            {updatingId === order.id && order.status !== s ? '...' : ORDER_STATUS_LABELS[s]}
                                                        </button>
                                                    ))}
                                                    <button className={`${styles.orderStatusBtn} ${styles.cancelBtn}`} onClick={() => handleStatusChange(order.id, 'cancelled')} disabled={updatingId === order.id}>
                                                        Huỷ đơn
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {order.status === 'cancelled' && (
                                            <div className={styles.orderCancelledActions}>
                                                <p className={styles.orderCancelledNote}>⚠️ Đơn đã huỷ — không thể thay đổi trạng thái</p>
                                                <button className={styles.orderDeleteFullBtn} onClick={() => handleDelete(order.id)} disabled={deletingId === order.id}>
                                                    {deletingId === order.id ? 'Đang xoá...' : '🗑 Xoá đơn hàng này'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>← Trước</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                <button key={pg} className={`${styles.pageBtn}${currentPage === pg ? ' ' + styles.pageBtnActive : ''}`} onClick={() => setCurrentPage(pg)}>{pg}</button>
                            ))}
                            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Sau →</button>
                        </div>
                    )}
                </>
            )}

            <button className={styles.orderRefreshBtn} onClick={loadOrders}>🔄 Làm mới</button>
        </div>
    );
}

// ===================== ADMIN DASHBOARD (Main) =====================
type Tab = 'products' | 'orders' | 'categories' | 'promotions';

export default function AdminDashboard({ onAdd, categories, onRefreshCategories, productCategoryCounts, products }: AdminDashboardProps) {
    const [activeTab, setActiveTab] = useState<Tab>('products');
    const [unreadCount, setUnreadCount] = useState(0);

    // Sync unread count from OrderHistory or Poll roughly
    // For simplicity, we can just load orders here or pass a callback
    useEffect(() => {
        const fetchUnread = async () => {
            const orders = await getOrders();
            const unread = orders.filter(o => !o.is_read).length;
            setUnreadCount(unread);
        };
        fetchUnread();
        // Poll every 30s for new orders
        const timer = setInterval(fetchUnread, 30000);
        return () => clearInterval(timer);
    }, []);

    // Also update unread count if we're in 'orders' tab and things change
    // This is a bit decoupled but polling + initial load should work.

    return (
        <div className={styles.adminDashboard} id="admin-dashboard">
            <div className={styles.dashboardTabs}>
                <button className={`${styles.dashboardTab}${activeTab === 'products' ? ' ' + styles.active : ''}`} onClick={() => setActiveTab('products')}>📦 Quản lý sản phẩm</button>
                <button className={`${styles.dashboardTab}${activeTab === 'categories' ? ' ' + styles.active : ''}`} onClick={() => setActiveTab('categories')}>🏷️ Danh mục</button>
                <button className={`${styles.dashboardTab}${activeTab === 'promotions' ? ' ' + styles.active : ''}`} onClick={() => setActiveTab('promotions')}>🔥 Khuyến mãi</button>
                <button className={`${styles.dashboardTab}${activeTab === 'orders' ? ' ' + styles.active : ''}`} onClick={() => setActiveTab('orders')}>
                    📋 Đơn hàng
                    {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>}
                </button>
            </div>

            <div className={styles.dashboardContent}>
                {activeTab === 'products' && <AddProductForm onAdd={onAdd} categories={categories} />}
                {activeTab === 'categories' && (
                    <CategoryManager categories={categories} productCategoryCounts={productCategoryCounts} onRefresh={onRefreshCategories} />
                )}
                {activeTab === 'promotions' && <PromotionManager products={products} />}
                {activeTab === 'orders' && <OrderHistory />}
            </div>
        </div>
    );
}
