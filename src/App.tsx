// src/App.tsx
import { useState, useEffect, useCallback } from 'react';
import { supabase, ADMIN_EMAIL } from './lib/supabase';
import { getProducts, addProduct, deleteProduct, updateProduct, getProductById } from './api/products';
import { getCategories } from './api/categories';
import type { Product, ProductInput } from './types/product';
import type { Category } from './types/category';
import { useCart } from './hooks/useCart';

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
import styles from './App.module.css';
import logoImg from './assets/logo.png';

interface ConfirmState {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

export default function App() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [orderOpen, setOrderOpen] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [confirm, setConfirm] = useState<ConfirmState>({
        open: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const { items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

    // Load products
    const loadProducts = useCallback(async () => {
        setIsLoading(true);
        const data = await getProducts();
        setProducts(data);
        setIsLoading(false);
    }, []);

    // Load categories from DB
    const loadCategories = useCallback(async () => {
        const data = await getCategories();
        setCategories(data);
    }, []);

    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            const user = data?.user;
            if (user && user.email === ADMIN_EMAIL) setIsAdmin(true);
            loadProducts();
            loadCategories();
        };
        checkUser();
    }, [loadProducts, loadCategories]);

    // Auth
    const handleLogin = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { alert('Sai email hoặc mật khẩu'); return; }
        if (data.user?.email === ADMIN_EMAIL) setIsAdmin(true);
        await loadProducts();
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAdmin(false);
        await loadProducts();
    };

    // CRUD Products
    const handleAdd = async (product: ProductInput) => {
        await addProduct(product);
        await loadProducts();
    };

    const handleDelete = async (id: number) => {
        setConfirm({
            open: true,
            title: 'Xoá sản phẩm',
            message: 'Bạn có chắc muốn xoá sản phẩm này? Hành động này không thể hoàn tác.',
            variant: 'danger',
            onConfirm: async () => {
                setConfirm(c => ({ ...c, open: false }));
                await deleteProduct(id);
                await loadProducts();
            },
        });
    };

    const handleEdit = async (id: number) => {
        const product = await getProductById(id);
        if (!product) { alert('Không lấy được dữ liệu sản phẩm'); return; }
        setEditingProduct(product);
    };

    const handleUpdate = async (id: number, data: Partial<Product>) => {
        await updateProduct(id, data);
        await loadProducts();
    };

    // Refresh both products and categories (called after category changes)
    const handleRefreshCategories = useCallback(async () => {
        await Promise.all([loadProducts(), loadCategories()]);
    }, [loadProducts, loadCategories]);

    // Cart
    const handleAddToCart = (product: Product) => {
        addToCart(product);
        setCartOpen(true);
    };

    const handleCheckout = () => {
        setCartOpen(false);
        setOrderOpen(true);
    };

    const handleOrderConfirm = () => {
        clearCart();
        setOrderOpen(false);
        setOrderSuccess(true);
        setTimeout(() => setOrderSuccess(false), 4000);
    };

    // Reset filters
    const handleResetFilter = () => {
        setActiveCategory('all');
        setSearchQuery('');
    };

    // Filter
    const filteredProducts = products.filter((p) => {
        const matchCategory = activeCategory === 'all' || p.category === activeCategory;
        const q = searchQuery.trim().toLowerCase();
        const matchSearch = !q || p.name.toLowerCase().includes(q);
        return matchCategory && matchSearch;
    });

    // Product count per category (for CategoryManager)
    const productCategoryCounts = products.reduce<Record<string, number>>((acc, p) => {
        const key = p.category ?? 'khac';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <>
            <Header
                isAdmin={isAdmin}
                cartCount={totalItems}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onCartOpen={() => setCartOpen(true)}
            />
            <Hero searchQuery={searchQuery} onSearchChange={setSearchQuery} />
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
                    searchQuery={searchQuery}
                    isLoading={isLoading}
                    onResetFilter={handleResetFilter}
                />
            </main>

            {isAdmin && (
                <AdminDashboard
                    onAdd={handleAdd}
                    categories={categories}
                    onRefreshCategories={handleRefreshCategories}
                    productCategoryCounts={productCategoryCounts}
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
                items={items}
                totalPrice={totalPrice}
                onClose={() => setCartOpen(false)}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                onCheckout={handleCheckout}
                onClearCart={clearCart}
            />

            {orderOpen && (
                <OrderModal
                    items={items}
                    totalPrice={totalPrice}
                    onClose={() => setOrderOpen(false)}
                    onConfirm={handleOrderConfirm}
                />
            )}

            {/* Order success toast */}
            {orderSuccess && (
                <div className={styles.orderToast}>
                    <span className={styles.orderToastIcon}>✅</span>
                    Đặt hàng thành công! Chúng tôi sẽ liên hệ sớm.
                </div>
            )}

            {/* Confirm modal (replaces window.confirm) */}
            {confirm.open && (
                <ConfirmModal
                    title={confirm.title}
                    message={confirm.message}
                    variant={confirm.variant}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(c => ({ ...c, open: false }))}
                />
            )}

            <FloatButtons />

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
                        <a href="#product-list">Sản phẩm</a>
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
