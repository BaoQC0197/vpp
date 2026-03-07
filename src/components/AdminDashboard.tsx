/**
 * src/components/AdminDashboard.tsx
 * 
 * BẢNG ĐIỀU KHIỂN QUẢN TRỊ (Admin Dashboard)
 * ------------------------------------------
 * Bím ví file này như "Phòng điều hành" của chủ shop. Tại đây, bro 
 * có thể thêm hàng mới, xem ai vừa đặt hàng, và quản lý khuyến mãi.
 */
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
import ProductSortManager from './ProductSortManager';
import styles from './AdminDashboard.module.css';

interface AdminDashboardProps {
    open: boolean; // Trạng thái đóng/mở Sidebar
    onClose: () => void; // Hàm để đóng Sidebar
    onAdd: (product: ProductInput) => Promise<number>; // Hàm thêm SP
    categories: Category[]; // Danh sách các ngăn kệ (danh mục)
    onRefreshCategories: () => void;
    productCategoryCounts: Record<string, number>;
    products: Product[];
    onUpdateProductOrders: (updates: { id: number; sort_order: number }[]) => Promise<void>;
    onUpdateGlobalProductOrders: (updates: { id: number; global_sort_order: number | null }[]) => Promise<void>;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'delivering', 'delivered', 'cancelled'];

interface FormErrors { name?: string; price?: string; image?: string; }

// ===================== BIỂU MẪU THÊM SẢN PHẨM =====================
const CUSTOM_KEY = '__custom__';

function AddProductForm({ onAdd, categories }: { onAdd: (product: ProductInput) => Promise<number>; categories: Category[] }) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');   // Giá dạng chuỗi để dễ nhập liệu
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [selectValue, setSelectValue] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({}); // Chứa các thông báo lỗi khi nhập sai
    const [showSuccess, setShowSuccess] = useState(false); // Hiện thông báo khi thêm thành công

    useEffect(() => {
        if (categories.length > 0 && !selectValue) setSelectValue(categories[0].key);
    }, [categories, selectValue]);

    const effectiveCategory = selectValue === CUSTOM_KEY ? customCategory.trim() : selectValue;

    // Hàm kiểm tra xem Admin đã nhập đủ thông tin chưa
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
            // 1. Lưu thông tin cơ bản của SP
            const newId = await onAdd({ name: name.trim(), price: parseInt(price), image: primaryImage, description, category: effectiveCategory });
            // 2. Lưu bộ sưu tập ảnh (nếu có nhiều ảnh)
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
            {/* Thông báo THÊM THÀNH CÔNG */}
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
            {/* Form nhập liệu */}
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
                <select className="vpp-select" value={selectValue} onChange={(e) => { setSelectValue(e.target.value); setCustomCategory(''); }}>
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

// ===================== QUẢN LÝ ĐƠN HÀNG =====================
const PAGE_SIZE = 10;

function OrderHistory() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null); // Mở rộng xem chi tiết đơn nào
    const [updatingId, setUpdatingId] = useState<number | null>(null); // Đang cập nhật trạng thái đơn nào
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all'); // Lọc theo trạng thái
    const [phoneFilter, setPhoneFilter] = useState(''); // Tìm theo SĐT
    const [currentPage, setCurrentPage] = useState(1);

    // Tải danh sách đơn hàng từ Database
    const loadOrders = useCallback(async () => {
        setLoading(true);
        const data = await getOrders();
        setOrders(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    // Bấm vào đơn hàng để xem chi tiết
    const handleExpandToggle = async (order: Order) => {
        if (expandedId !== order.id) {
            setExpandedId(order.id);
            // Nếu đơn này chưa đọc -> Đánh dấu là đã xem trong Database
            if (!order.is_read) {
                try {
                    await markOrderAsRead(order.id);
                    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, is_read: true } : o));
                } catch (err) {
                    console.error('Lỗi đánh dấu đã đọc:', err);
                }
            }
        } else {
            setExpandedId(null);
        }
    };

    // Đổi trạng thái đơn hàng (Xác nhận, Đang giao...)
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
        } catch { alert('Xoá thất bại, thử lại nhé!'); }
        finally { setDeletingId(null); }
    };

    // LOGIC LỌC VÀ TÌM KIẾM
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
    const formatDate = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

    if (loading) return <div className={styles.orderLoading}>⏳ Đang tải đơn hàng...</div>;

    return (
        <div className={styles.orderHistory}>
            {/* Thanh tìm kiếm theo SĐT */}
            <div className={styles.phoneSearchRow}>
                <span className={styles.phoneSearchIcon}>🔍</span>
                <input
                    type="tel"
                    className={styles.phoneSearchInput}
                    placeholder="Tìm theo số điện thoại..."
                    value={phoneFilter}
                    onChange={e => setPhoneFilter(e.target.value)}
                />
            </div>

            {/* Bộ lọc trạng thái đơn hàng */}
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
                    <div className={styles.orderTableWrapper}>
                        {pagedOrders.map(order => (
                            /* Một 'Card' đơn hàng */
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

                                        {/* Nút xóa đơn đã hủy */}
                                        {order.status === 'cancelled' && (
                                            <button
                                                className={styles.orderDeleteBtn}
                                                onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }}
                                                disabled={deletingId === order.id}
                                                title="Xoá đơn đã huỷ"
                                            >
                                                {deletingId === order.id ? '...' : '🗑'}
                                            </button>
                                        )}
                                        <span className={styles.orderExpand}>{expandedId === order.id ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {/* PHẦN CHI TIẾT (Chỉ hiện khi bấm vào) */}
                                {expandedId === order.id && (
                                    <div className={styles.orderCardDetail}>
                                        <div className={styles.orderDetailInfo}>
                                            <p><strong>📍 Địa chỉ:</strong> {order.address}</p>
                                            {order.note && <p><strong>📝 Ghi chú:</strong> {order.note}</p>}
                                        </div>
                                        <table className={styles.orderItemsTable}>
                                            <thead><tr><th>Sản phẩm</th><th>Giá</th><th>SL</th><th>Tổng</th></tr></thead>
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
                                        {/* Nút đổi trạng thái đơn */}
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
                                                <button
                                                    className={`${styles.orderStatusBtn} ${styles.cancelBtn}`}
                                                    onClick={() => handleStatusChange(order.id, 'cancelled')}
                                                    disabled={updatingId === order.id}
                                                >
                                                    Huỷ đơn
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Phân trang của Đơn hàng */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                <button key={pg} className={`${styles.pageBtn}${currentPage === pg ? ' ' + styles.pageBtnActive : ''}`} onClick={() => setCurrentPage(pg)}>{pg}</button>
                            ))}
                        </div>
                    )}
                </>
            )}
            <button className={styles.orderRefreshBtn} onClick={loadOrders}>🔄 Làm mới</button>
        </div>
    );
}

// ===================== DASHBOARD CHÍNH (Gồm các Tab) =====================
type Tab = 'products' | 'orders' | 'categories' | 'promotions' | 'sort';

export default function AdminDashboard({ open, onClose, onAdd, categories, onRefreshCategories, productCategoryCounts, products, onUpdateProductOrders, onUpdateGlobalProductOrders, showToast }: AdminDashboardProps) {
    const [activeTab, setActiveTab] = useState<Tab>('products');
    const [unreadCount, setUnreadCount] = useState(0);

    // KIỂM TRA ĐƠN HÀNG MỚI: Cứ 30 giây Bím sẽ đi kiểm tra xem có đơn mới nào khách vừa đặt không
    useEffect(() => {
        const fetchUnread = async () => {
            const orders = await getOrders();
            const unread = orders.filter(o => !o.is_read).length;
            setUnreadCount(unread);
        };
        fetchUnread();
        const timer = setInterval(fetchUnread, 30000);
        return () => clearInterval(timer);
    }, []);

    // NGĂN SCROLL NỀN: Khi mở Admin Dashboard, vô hiệu hóa scroll của body
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        // Cleanup function phòng trường hợp component bị unmount đột ngột
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    // Nếu sidebar đang đóng thì không render gì cả (phần Backdrop xử lý hiệu ứng sau)
    // if (!open) return null; // Ta sẽ xử lý hiệu ứng CSS nên vẫn trả về JSX

    return (
        <>
            {/* Lớp nền mờ (Backdrop) */}
            <div className={`${styles.adminOverlay}${open ? ' ' + styles.open : ''}`} onClick={onClose} />

            {/* Thanh Sidebar quản trị */}
            <div className={`${styles.adminSidebar}${open ? ' ' + styles.open : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.sidebarTitle}>
                        <span className={styles.sidebarIcon}>⚙️</span>
                        <div>
                            <h3>Trung tâm quản trị</h3>
                        </div>
                    </div>
                    <button className={styles.btnCloseSidebar} onClick={onClose} title="Đóng bảng điều khiển">✕</button>
                </div>

                {/* Thanh chuyển đổi giữa các tab công việc (Dạng dọc trên Desktop) */}
                <div className={styles.dashboardTabs}>
                    <button className={`${styles.dashboardTab}${activeTab === 'products' ? ' ' + styles.active : ''}`} onClick={() => setActiveTab('products')}>
                        <div className={styles.tabIconWrapper}><span className={styles.tabIcon}>📦</span></div>
                        <span>Quản lý sản phẩm</span>
                    </button>
                    <button className={`${styles.dashboardTab}${activeTab === 'categories' ? ' ' + styles.active : ''}`} onClick={() => setActiveTab('categories')}>
                        <div className={styles.tabIconWrapper}><span className={styles.tabIcon}>🏷️</span></div>
                        <span>Quản lý danh mục</span>
                    </button>
                    <button className={`${styles.dashboardTab}${activeTab === 'sort' ? ' ' + styles.active : ''}`} onClick={() => setActiveTab('sort')}>
                        <div className={styles.tabIconWrapper}><span className={styles.tabIcon}>↕️</span></div>
                        <span>Sắp xếp sản phẩm</span>
                    </button>
                    <button className={`${styles.dashboardTab}${activeTab === 'promotions' ? ' ' + styles.active : ''}`} onClick={() => setActiveTab('promotions')}>
                        <div className={styles.tabIconWrapper}><span className={styles.tabIcon}>🔥</span></div>
                        <span>Quản lý khuyến mãi</span>
                    </button>
                    <button className={`${styles.dashboardTab}${activeTab === 'orders' ? ' ' + styles.active : ''}`} onClick={() => setActiveTab('orders')}>
                        <div className={styles.tabIconWrapper}>
                            <span className={styles.tabIcon}>📋</span>
                            {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>}
                        </div>
                        <span>Quản lý đơn hàng</span>
                    </button>
                </div>

                {/* Nội dung tương ứng với mỗi tab */}
                <div className={styles.dashboardContent}>
                    {activeTab === 'products' && (
                        <div className={styles.tabSection}>
                            <h4>+ Thêm sản phẩm mới</h4>
                            <AddProductForm onAdd={onAdd} categories={categories} />
                        </div>
                    )}
                    {activeTab === 'categories' && (
                        <div className={styles.tabSection}>
                            <CategoryManager categories={categories} productCategoryCounts={productCategoryCounts} onRefresh={onRefreshCategories} />
                        </div>
                    )}
                    {activeTab === 'sort' && (
                        <div className={styles.tabSection}>
                            <h4>↕️ Sắp xếp sản phẩm</h4>
                            <ProductSortManager
                                categories={categories}
                                products={products}
                                onUpdateOrders={onUpdateProductOrders}
                                onUpdateGlobalOrders={onUpdateGlobalProductOrders}
                                showToast={showToast}
                            />
                        </div>
                    )}
                    {activeTab === 'promotions' && (
                        <div className={styles.tabSection}>
                            <h4>🔥 Chương trình khuyến mãi</h4>
                            <PromotionManager products={products} />
                        </div>
                    )}
                    {activeTab === 'orders' && (
                        <div className={styles.tabSection}>
                            <h4>📋 Lịch sử đơn hàng</h4>
                            <OrderHistory />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
