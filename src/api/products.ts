// src/api/products.ts
import { supabase } from '../lib/supabase';
import type { Product, ProductInput } from '../types/product';

export async function getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*, product_images(id, url, position)')
        .order('id', { ascending: false });

    if (error) {
        console.error('getProducts error:', error);
        return [];
    }

    return (data as any[]).map(p => ({
        ...p,
        images: (p.product_images ?? [])
            .sort((a: any, b: any) => a.position - b.position)
            .map((img: any) => img.url),
    })) as Product[];
}

export async function addProduct(product: ProductInput): Promise<number> {
    const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select('id')
        .single();
    if (error) throw error;
    return data.id;
}

export async function deleteProduct(id: number): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
}

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

// ── Product Images API ──────────────────────────────────────────

export async function addProductImages(productId: number, urls: string[]): Promise<void> {
    if (!urls.length) return;
    const rows = urls.map((url, i) => ({ product_id: productId, url, position: i }));
    const { error } = await supabase.from('product_images').insert(rows);
    if (error) throw error;
}

export async function replaceProductImages(productId: number, urls: string[]): Promise<void> {
    // Delete all then re-insert
    const { error: delError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);
    if (delError) throw delError;
    if (!urls.length) return;
    const rows = urls.map((url, i) => ({ product_id: productId, url, position: i }));
    const { error } = await supabase.from('product_images').insert(rows);
    if (error) throw error;
}

export async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('Images vpp')
        .upload(filePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('Images vpp')
        .getPublicUrl(filePath);

    return data.publicUrl;
}
