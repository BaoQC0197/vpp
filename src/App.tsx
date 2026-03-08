/**
 * src/App.tsx
 * 
 * ĐÂY LÀ "BỘ KHUNG" GIAO DIỆN CHÍNH CỦA WEBSITE
 * --------------------------------------------
 * File này đóng vai trò như người điều phối: lấy dữ liệu từ Bím (useVppData) 
 * rồi chia cho các Component con (Header, Hero, ProductList, v.v.) hiển thị.
 */
import { useState } from 'react';
import { useVppData } from './hooks/useVppData';
import type { Product } from './types/product';

// Nhập các thành phần giao diện (UI Components)
import Header from './components/Header';
import CategoryBar from './components/CategoryBar';
import Hero from './components/Hero';
import ProductList from './components/ProductList';
import AdminDashboard from './components/AdminDashboard';
import EditModal from './components/EditModal';
import CartDrawer from './components/CartDrawer';
import OrderModal from './components/OrderModal';
import FloatButtons from './components/FloatButtons';
import ConfirmModal from './components/ConfirmModal';
import ProductDetailModal from './components/ProductDetailModal';
import OrderHistoryDrawer from './components/OrderHistoryDrawer';
// import SaleSection from './components/SaleSection';
import Toast, { type ToastType } from './components/Toast';
import styles from './App.module.css';
import logoImg from './assets/logo.png';

// Định nghĩa kiểu dữ liệu cho Modal xác nhận
interface ConfirmState {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

// Định nghĩa kiểu dữ liệu cho thông báo Toast
interface ToastState {
    show: boolean;
    message: string;
    type: ToastType;
}

export default function App() {
    // 1. LẤY "BỘ NÃO" XỬ LÝ DỮ LIỆU TỪ HOOK
    const {
        isAdmin,
        products,
        categories,
        isLoading,
        cart,
        handleLogin: login,
        handleLogout,
        handleAddProduct,
        handleDeleteProduct,
        handleUpdateProduct,
        handleUpdateProductOrders,
        handleUpdateGlobalProductOrders,
        handleRefreshCategories,
        getFullProduct,
    } = useVppData();

    // 2. CÁC TRẠNG THÁI GIAO DIỆN (UI STATE)
    const [activeCategory, setActiveCategory] = useState('all'); // Danh mục đang chọn để lọc
    const [searchQuery, setSearchQuery] = useState(''); // Từ khóa tìm kiếm
    const [editingProduct, setEditingProduct] = useState<Product | null>(null); // SP đang được Admin sửa
    const [detailProduct, setDetailProduct] = useState<Product | null>(null); // SP đang xem chi tiết (Modal)
    const [cartOpen, setCartOpen] = useState(false); // Trạng thái đóng/mở Giỏ hàng
    const [orderOpen, setOrderOpen] = useState(false); // Trạng thái đóng/mở Form đặt hàng
    const [orderHistoryOpen, setOrderHistoryOpen] = useState(false); // Trạng thái xem Lịch sử đơn hàng
    const [adminPanelOpen, setAdminPanelOpen] = useState(false); // Trạng thái đóng/mở Bảng quản trị (Sidebar)

    // Quản lý thông báo và xác nhận
    const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
    const [confirm, setConfirm] = useState<ConfirmState>({
        open: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    // Hàm tiện ích để hiện thông báo nhanh
    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ show: true, message, type });
    };

    // 3. CÁC HÀM ĐIỀU KHIỂN (HANDLERS) - Kết nối UI với logic của Bím

    // Xử lý đăng nhập
    const handleLogin = async (email: string, password: string) => {
        try {
            await login(email, password);
            showToast('Đăng nhập thành công');
        } catch (error: any) {
            showToast(error.message || 'Lỗi đăng nhập', 'error');
        }
    };

    const handleLogoutWithToast = async () => {
        await handleLogout();
        showToast('Đã đăng xuất');
    };

    const handleAdd = async (product: any) => {
        const id = await handleAddProduct(product);
        showToast('Đã thêm sản phẩm mới');
        return id;
    };

    const handleDelete = async (id: number) => {
        setConfirm({
            open: true,
            title: 'Xoá sản phẩm',
            message: 'Bạn có chắc muốn xoá sản phẩm này? Hành động này không thể hoàn tác.',
            variant: 'danger',
            onConfirm: async () => {
                setConfirm(c => ({ ...c, open: false }));
                await handleDeleteProduct(id);
                showToast('Đã xoá sản phẩm');
            },
        });
    };

    const handleEdit = async (id: number) => {
        const product = await getFullProduct(id);
        if (!product) {
            showToast('Không lấy được dữ liệu sản phẩm', 'error');
            return;
        }
        setEditingProduct(product);
    };

    const handleUpdate = async (id: number, data: Partial<Product>, imageUrls: string[]) => {
        await handleUpdateProduct(id, data, imageUrls);
        showToast('Cập nhật sản phẩm thành công');
    };

    // Cart
    const handleAddToCart = (product: Product, qty = 1) => {
        for (let i = 0; i < qty; i++) cart.addToCart(product);
        setCartOpen(true);
    };

    const handleBuyNow = (product: Product, qty = 1) => {
        for (let i = 0; i < qty; i++) cart.addToCart(product);
        setDetailProduct(null);
        setCartOpen(false);
        setOrderOpen(true);
    };

    const handleCheckout = () => {
        setCartOpen(false);
        setOrderOpen(true);
    };

    const handleOrderConfirm = () => {
        cart.clearCart();
        setOrderOpen(false);
        showToast('Đặt hàng thành công! Chúng tôi sẽ liên hệ sớm.');
    };

    // Reset filters
    const handleResetFilter = () => {
        setActiveCategory('all');
        setSearchQuery('');
    };

    // Filter và Sắp xếp
    const filteredProducts = products.filter((p) => {
        const matchCategory = activeCategory === 'all' || p.category === activeCategory;
        const q = searchQuery.trim().toLowerCase();
        const matchSearch = !q || p.name.toLowerCase().includes(q);
        return matchCategory && matchSearch;
    }).sort((a, b) => {
        // Nếu đang ở trang chủ (Tất cả), sử dụng global_sort_order để ưu tiên ghim
        if (activeCategory === 'all') {
            const globalA = a.global_sort_order;
            const globalB = b.global_sort_order;

            // Cả 2 đều được ghim -> So sánh vị trí ghim
            if (globalA !== null && globalA !== undefined && globalB !== null && globalB !== undefined) {
                return globalA - globalB;
            }
            // Chỉ A được ghim -> A lên trước
            if (globalA !== null && globalA !== undefined) return -1;
            // Chỉ B được ghim -> B lên trước
            if (globalB !== null && globalB !== undefined) return 1;

            // Nếu không ai được ghim, hiển thị mới nhất giảm dần
            return b.id - a.id;
        }

        // Nếu ở trong danh mục cụ thể, backend đã sort theo sort_order và id rồi nên giữ nguyên thứ tự ban đầu của API
        return 0;
    });

    // Product count per category
    const productCategoryCounts = products.reduce<Record<string, number>>((acc, p) => {
        const key = p.category ?? 'khac';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <>
            <Header
                isAdmin={isAdmin}
                onLogin={handleLogin}
                onLogout={handleLogoutWithToast}
                onAdminPanelOpen={() => setAdminPanelOpen(true)} // Mở trung tâm điều khiển
            />
            <Hero searchQuery={searchQuery} onSearchChange={setSearchQuery} />
            {/* <SaleSection products={products} onViewDetail={(p) => setDetailProduct(p)} /> */}
            <CategoryBar
                activeCategory={activeCategory}
                onFilter={(cat) => { setActiveCategory(cat); setSearchQuery(''); }}
                categories={categories}
            />

            <main className="container" id="product-list">
                <ProductList
                    products={filteredProducts}
                    isAdmin={isAdmin}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddToCart={handleAddToCart}
                    onViewDetail={(p) => setDetailProduct(p)}
                    searchQuery={searchQuery}
                    isLoading={isLoading}
                    onResetFilter={handleResetFilter}
                    activeCategory={activeCategory}
                />
            </main>

            {isAdmin && (
                <AdminDashboard
                    open={adminPanelOpen}
                    onClose={() => setAdminPanelOpen(false)}
                    onAdd={handleAdd}
                    categories={categories}
                    onRefreshCategories={handleRefreshCategories}
                    productCategoryCounts={productCategoryCounts}
                    products={products}
                    onUpdateProductOrders={handleUpdateProductOrders}
                    onUpdateGlobalProductOrders={handleUpdateGlobalProductOrders}
                    showToast={showToast}
                />
            )}

            {editingProduct && (
                <EditModal
                    product={editingProduct}
                    categories={categories}
                    onSave={handleUpdate}
                    onClose={() => setEditingProduct(null)}
                />
            )}

            <CartDrawer
                open={cartOpen}
                items={cart.items}
                totalPrice={cart.totalPrice}
                onClose={() => setCartOpen(false)}
                onUpdateQuantity={cart.updateQuantity}
                onRemove={cart.removeFromCart}
                onCheckout={handleCheckout}
                onClearCart={cart.clearCart}
            />

            {orderOpen && (
                <OrderModal
                    items={cart.items}
                    totalPrice={cart.totalPrice}
                    onClose={() => setOrderOpen(false)}
                    onConfirm={handleOrderConfirm}
                />
            )}

            {/* Confirm modal */}
            {confirm.open && (
                <ConfirmModal
                    title={confirm.title}
                    message={confirm.message}
                    variant={confirm.variant}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(c => ({ ...c, open: false }))}
                />
            )}

            {/* Product detail modal */}
            {detailProduct && (
                <ProductDetailModal
                    product={detailProduct}
                    allProducts={products}
                    categories={categories}
                    onClose={() => setDetailProduct(null)}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    onViewDetail={(p) => setDetailProduct(p)}
                />
            )}

            {/* Ẩn các nút trôi (FloatButtons) khi đang mở các Sidebar/Modal để tránh bị che khuất và rối mắt */}
            {!(cartOpen || orderHistoryOpen || orderOpen || adminPanelOpen) && (
                <FloatButtons
                    onOrderHistory={() => setOrderHistoryOpen(true)}
                    cartCount={cart.totalItems}
                    onCartOpen={() => setCartOpen(true)}
                />
            )}

            <OrderHistoryDrawer
                open={orderHistoryOpen}
                onClose={() => setOrderHistoryOpen(false)}
            />

            {/* Toast system */}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(t => ({ ...t, show: false }))}
                />
            )}

            {/* Footer */}
            <footer className={styles.footer} id="contact">
                <div className={`container ${styles.footerInner}`}>
                    <div className={styles.footerBrand}>
                        <div className={styles.footerLogo}>
                            <img src={logoImg} alt="VPP Ti Anh logo" className={styles.footerLogoImg} />
                            VPP Ti Anh
                        </div>
                        <p className={styles.footerTagline}>Đại lý văn phòng phẩm uy tín<br />Chất lượng cao, giá tốt nhất</p>
                    </div>
                    <div className={styles.footerLinks} id="about">
                        <h4>Liên kết</h4>
                        <a href="#">Trang chủ</a>
                        <a href="#category-menu">Sản phẩm</a>
                        <a href="#about">Giới thiệu</a>
                    </div>
                    <div className={styles.footerContact}>
                        <h4>Liên hệ</h4>
                        <p>📞 <a href="tel:0981063381">0981 063 381</a></p>
                        <p>💬 <a href="https://zalo.me/0981063381" target="_blank" rel="noreferrer">Zalo: 0981 063 381</a></p>
                        <p>📍 TP. Hồ Chí Minh</p>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <p>© 2026 VPP Ti Anh. All rights reserved.</p>
                </div>
            </footer>
        </>
    );
}
