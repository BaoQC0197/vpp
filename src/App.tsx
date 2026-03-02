// src/App.tsx
import { useState, useEffect, useCallback } from 'react';
import { supabase, ADMIN_EMAIL } from './lib/supabase';
import { getProducts, addProduct, deleteProduct, updateProduct, getProductById } from './api/products';
import type { Product, ProductInput } from './types/product';
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

export default function App() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [orderOpen, setOrderOpen] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const { items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

    // Load products
    const loadProducts = useCallback(async () => {
        const data = await getProducts();
        setProducts(data);
    }, []);

    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            const user = data?.user;
            if (user && user.email === ADMIN_EMAIL) setIsAdmin(true);
            loadProducts();
        };
        checkUser();
    }, [loadProducts]);

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

    // CRUD
    const handleAdd = async (product: ProductInput) => {
        await addProduct(product);
        await loadProducts();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xoá sản phẩm này?')) return;
        await deleteProduct(id);
        await loadProducts();
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

    // Filter
    const filteredProducts = products.filter((p) => {
        const matchCategory = activeCategory === 'all' || p.category === activeCategory;
        const q = searchQuery.trim().toLowerCase();
        const matchSearch = !q || p.name.toLowerCase().includes(q);
        return matchCategory && matchSearch;
    });

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
                productCategories={products.map((p) => p.category ?? '').filter(Boolean)}
            />

            <main className="container" id="product-list">
                <ProductList
                    products={filteredProducts}
                    isAdmin={isAdmin}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddToCart={handleAddToCart}
                    searchQuery={searchQuery}
                />
            </main>

            {isAdmin && <AdminDashboard onAdd={handleAdd} />}

            {editingProduct && (
                <EditModal
                    product={editingProduct}
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
                <div className="order-toast">
                    ✅ Đặt hàng thành công! Chúng tôi sẽ liên hệ sớm.
                </div>
            )}

            <FloatButtons />

            {/* Footer */}
            <footer className="footer" id="contact">
                <div className="container footer-inner">
                    <div className="footer-brand">
                        <div className="footer-logo">📚 VPP Ti Anh</div>
                        <p className="footer-tagline">Đại lý văn phòng phẩm uy tín<br />Chất lượng cao, giá tốt nhất</p>
                    </div>
                    <div className="footer-links" id="about">
                        <h4>Liên kết</h4>
                        <a href="#">Trang chủ</a>
                        <a href="#product-list">Sản phẩm</a>
                        <a href="#about">Giới thiệu</a>
                    </div>
                    <div className="footer-contact">
                        <h4>Liên hệ</h4>
                        <p>📞 <a href="tel:0987063387">0987 063 387</a></p>
                        <p>💬 <a href="https://zalo.me/0987063387" target="_blank" rel="noreferrer">Zalo: 0987 063 387</a></p>
                        <p>📍 TP. Hồ Chí Minh</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 VPP Ti Anh. All rights reserved.</p>
                </div>
            </footer>
        </>
    );
}
