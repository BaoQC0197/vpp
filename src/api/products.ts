/**
 * src/api/products.ts
 * 
 * TẦNG GIAO TIẾP DỮ LIỆU (API Layer) - SẢN PHẨM
 * --------------------------------------------
 * Bím ví các hàm ở đây như những "anh bưu tá". Công việc của họ 
 * là chạy đến Database (Supabase) để lấy, thêm, sửa hoặc xóa 
 * thông tin sản phẩm theo yêu cầu của "Bộ não" (Hooks).
 */
import { supabase } from '../lib/supabase';
import type { Product, ProductInput } from '../types/product';

// HÀM: LẤY TẤT CẢ SẢN PHẨM
export async function getProducts(): Promise<Product[]> {
    const now = new Date().toISOString();
    // 1. Anh bưu tá hỏi Supabase: "Cho tôi xin tất cả SP, kèm ảnh và chương trình khuyến mãi"
    const { data, error } = await supabase
        .from('products')
        .select('*, product_images(id, url, position), promotions(*)')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: false }); // Sắp xếp cái nào mới nhất hiện lên đầu

    if (error) {
        console.error('Lỗi lấy danh sách sản phẩm:', error);
        return [];
    }

    // 2. Xử lý dữ liệu thô từ Database sang dạng mà web dễ dùng
    return (data as any[]).map(p => {
        // Tìm xem có khuyến mãi nào đang còn hiệu lực không
        const activePromo = (p.promotions ?? []).find((promo: any) =>
            promo.active && (!promo.ends_at || promo.ends_at >= now)
        ) ?? null;

        return {
            ...p,
            // Gom tất cả ảnh phụ vào một mảng và sắp xếp theo vị trí
            images: (p.product_images ?? [])
                .sort((a: any, b: any) => a.position - b.position)
                .map((img: any) => img.url),
            promotion: activePromo,
        };
    }) as Product[];
}

// HÀM: THÊM SẢN PHẨM MỚI (Dành cho Admin)
export async function addProduct(product: ProductInput): Promise<number> {
    const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select('id')
        .single(); // Chỉ lấy ID của sản phẩm vừa tạo
    if (error) throw error;
    return data.id;
}

// HÀM: XÓA SẢN PHẨM
export async function deleteProduct(id: number): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
}

// HÀM: CẬP NHẬT THÔNG TIN SẢN PHẨM
export async function updateProduct(
    id: number,
    updatedData: Partial<ProductInput>
): Promise<void> {
    const { error } = await supabase
        .from('products')
        .update(updatedData)
        .eq('id', id);
    if (error) throw error;
}

// HÀM: CẬP NHẬT THỨ TỰ NHIỀU SẢN PHẨM (Sắp xếp trong Danh mục cụ thể)
export async function updateProductOrders(
    updates: { id: number; sort_order: number }[]
): Promise<void> {
    // Gọi nhiều lệnh update cùng lúc
    await Promise.all(
        updates.map(u =>
            supabase.from('products').update({ sort_order: u.sort_order }).eq('id', u.id)
        )
    );
}

// HÀM: CẬP NHẬT THỨ TỰ NHIỀU SẢN PHẨM TRANH CHỦ (Sắp xếp Toàn cục)
export async function updateGlobalProductOrders(
    updates: { id: number; global_sort_order: number | null }[]
): Promise<void> {
    await Promise.all(
        updates.map(u =>
            supabase.from('products').update({ global_sort_order: u.global_sort_order }).eq('id', u.id)
        )
    );
}

// HÀM: LẤY CHI TIẾT 1 SẢN PHẨM THEO ID
export async function getProductById(id: number): Promise<Product | null> {
    const { data, error } = await supabase
        .from('products')
        .select('*, product_images(id, url, position)')
        .eq('id', id)
        .single();

    if (error) return null;
    const p = data as any;
    return {
        ...p,
        images: (p.product_images ?? [])
            .sort((a: any, b: any) => a.position - b.position)
            .map((img: any) => img.url),
    } as Product;
}

// ── QUẢN LÝ HÌNH ẢNH SẢN PHẨM ──────────────────────────────────────────

// Thêm các ảnh phụ cho sản phẩm
export async function addProductImages(productId: number, urls: string[]): Promise<void> {
    if (!urls.length) return;
    const rows = urls.map((url, i) => ({ product_id: productId, url, position: i }));
    const { error } = await supabase.from('product_images').insert(rows);
    if (error) throw error;
}

// Thay thế toàn bộ dàn ảnh cũ bằng dàn ảnh mới
export async function replaceProductImages(productId: number, urls: string[]): Promise<void> {
    // Bước 1: Xóa sạch ảnh cũ trong DB
    const { error: delError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);
    if (delError) throw delError;

    if (!urls.length) return;
    // Bước 2: Chèn dàn ảnh mới vào
    const rows = urls.map((url, i) => ({ product_id: productId, url, position: i }));
    const { error } = await supabase.from('product_images').insert(rows);
    if (error) throw error;
}

// HÀM QUAN TRỌNG: TẢI ẢNH LÊN KHO LƯU TRỮ (Storage)
export async function uploadImage(file: File): Promise<string> {
    // Tạo tên file độc nhất bằng thời gian để không bị trùng
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `products/${fileName}`;

    // 1. Đẩy file lên "Cái kho" Images vpp của Supabase
    const { error: uploadError } = await supabase.storage
        .from('Images vpp')
        .upload(filePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    // 2. Lấy đường link (URL) công khai để có thể hiển thị ảnh lên web
    const { data } = supabase.storage
        .from('Images vpp')
        .getPublicUrl(filePath);

    return data.publicUrl;
}
