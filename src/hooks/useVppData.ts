/**
 * src/hooks/useVppData.ts
 * 
 * ĐÂY LÀ "BỘ NÃO" CỦA ỨNG DỤNG (Custom Hook)
 * -----------------------------------------
 * Bím tạo ra hook này để gom tất cả logic xử lý dữ liệu vào một nơi. 
 * Giúp giao diện (App.tsx) chỉ việc hiển thị, còn mọi việc tính toán, 
 * gọi API, quản lý trạng thái thì Bím để hết ở đây.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase, ADMIN_EMAIL } from '../lib/supabase';
import { getProducts, addProduct, deleteProduct, updateProduct, updateProductOrders, updateGlobalProductOrders, getProductById, replaceProductImages } from '../api/products';
import { getCategories } from '../api/categories';
import { useCart } from './useCart';
import type { Product, ProductInput } from '../types/product';
import type { Category } from '../types/category';

export function useVppData() {
    // --- QUẢN LÝ TRẠNG THÁI (STATE) ---
    const [isAdmin, setIsAdmin] = useState(false); // Lưu xem người dùng hiện tại có phải Admin không
    const [products, setProducts] = useState<Product[]>([]); // Danh sách sản phẩm lấy từ Database
    const [categories, setCategories] = useState<Category[]>([]); // Danh sách danh mục (Bút, Vở, v.v.)
    const [isLoading, setIsLoading] = useState(true); // Trạng thái đang tải dữ liệu (để hiện loading icon)

    // Kết nối với logic Giỏ hàng
    const cart = useCart();

    // --- HÀM XỬ LÝ DỮ LIỆU (DATA ACTIONS) ---

    // Hàm lấy danh sách sản phẩm từ database
    const loadProducts = useCallback(async () => {
        setIsLoading(true);
        const data = await getProducts();
        setProducts(data); // Cập nhật danh sách mới vào state
        setIsLoading(false);
    }, []);

    // Hàm lấy danh mục sản phẩm (Văn phòng phẩm, Dụng cụ học tập...)
    const loadCategories = useCallback(async () => {
        const data = await getCategories();
        setCategories(data);
    }, []);

    // Hàm làm mới cả sản phẩm và danh mục (dùng sau khi Admin thay đổi dữ liệu)
    const handleRefreshCategories = useCallback(async () => {
        await Promise.all([loadProducts(), loadCategories()]);
    }, [loadProducts, loadCategories]);

    // --- HIỆU ỨNG (SIDE EFFECTS) ---
    // Chạy ngay khi ứng dụng khởi động để kiểm tra User và load dữ liệu ban đầu
    useEffect(() => {
        const checkUser = async () => {
            // Kiểm tra xem có phiên đăng nhập cũ không
            const { data } = await supabase.auth.getUser();
            const user = data?.user;
            // Nếu email khớp với email Admin thì cấp quyền Admin
            if (user && user.email === ADMIN_EMAIL) setIsAdmin(true);

            // Load sản phẩm và danh mục lên màn hình
            loadProducts();
            loadCategories();
        };
        checkUser();
    }, [loadProducts, loadCategories]);

    // --- LOGIC ĐĂNG NHẬP / ĐĂNG XUẤT ---
    const handleLogin = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error('Sai email hoặc mật khẩu'); // Bắn lỗi để App.tsx bắt và hiện Toast
        if (data.user?.email === ADMIN_EMAIL) setIsAdmin(true);
        await loadProducts(); // Tải lại để cập nhật quyền Admin trên UI
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAdmin(false);
        await loadProducts();
    };

    // --- LOGIC QUẢN LÝ SẢN PHẨM (CHO ADMIN) ---

    // Thêm sản phẩm mới
    const handleAddProduct = async (product: ProductInput): Promise<number> => {
        const id = await addProduct(product);
        await loadProducts(); // Load lại để SP mới hiện ngay trên web
        return id;
    };

    // Xóa sản phẩm
    const handleDeleteProduct = async (id: number) => {
        await deleteProduct(id);
        await loadProducts(); // Load lại để SP biến mất khỏi web
    };

    // Cập nhật thông tin và hình ảnh sản phẩm
    const handleUpdateProduct = async (id: number, data: Partial<Product>, imageUrls: string[]) => {
        await updateProduct(id, data);
        await replaceProductImages(id, imageUrls); // Cập nhật cả bảng ảnh phụ nếu có thay đổi
        await loadProducts();
    };

    // Cập nhật thứ tự hiển thị sản phẩm (Danh mục)
    const handleUpdateProductOrders = async (updates: { id: number; sort_order: number }[]) => {
        await updateProductOrders(updates);
        await loadProducts();
    };

    // Cập nhật thứ tự hiển thị sản phẩm (Khắp nơi - Trang chủ)
    const handleUpdateGlobalProductOrders = async (updates: { id: number; global_sort_order: number | null }[]) => {
        await updateGlobalProductOrders(updates);
        await loadProducts();
    };

    // Lấy chi tiết một sản phẩm (để sửa hoặc xem chi tiết)
    const getFullProduct = async (id: number) => {
        return await getProductById(id);
    };

    // TRẢ VỀ DỮ LIỆU ĐỂ CÁC COMPONENT GIAO DIỆN SỬ DỤNG
    return {
        isAdmin,
        products,
        categories,
        isLoading,
        cart,
        handleLogin,
        handleLogout,
        handleAddProduct,
        handleDeleteProduct,
        handleUpdateProduct,
        handleUpdateProductOrders,
        handleUpdateGlobalProductOrders,
        handleRefreshCategories,
        getFullProduct,
    };
}
