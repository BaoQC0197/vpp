// src/api/categories.ts
import { supabase } from '../lib/supabase';
import type { Category, CategoryInput } from '../types/category';

/** Lấy tất cả danh mục từ DB, sắp xếp theo sort_order */
export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('getCategories error:', error);
        return [];
    }
    return data as Category[];
}

/** Thêm danh mục mới */
export async function addCategory(input: Omit<CategoryInput, 'sort_order'>): Promise<void> {
    const { error } = await supabase.from('categories').insert([{
        ...input,
        sort_order: 50,
    }]);
    if (error) throw error;
}

/** Cập nhật label, icon và/hoặc sort_order của một danh mục */
export async function updateCategory(id: number, data: Partial<Pick<Category, 'label' | 'icon' | 'sort_order'>>): Promise<void> {
    const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id);
    if (error) throw error;
}

/**
 * Xoá danh mục.
 * Tất cả sản phẩm có category = key sẽ được chuyển sang 'khac'.
 */
export async function deleteCategory(id: number, key: string): Promise<void> {
    // 1. Chuyển sản phẩm sang 'khac'
    const { error: updateErr } = await supabase
        .from('products')
        .update({ category: 'khac' })
        .eq('category', key);
    if (updateErr) throw updateErr;

    // 2. Xoá danh mục
    const { error: deleteErr } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
    if (deleteErr) throw deleteErr;
}
