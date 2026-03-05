// src/api/promotions.ts
import { supabase } from '../lib/supabase';
import type { Promotion } from '../types/promotion';

export async function getActivePromotions(): Promise<Promotion[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('active', true)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('created_at', { ascending: false });

    if (error) { console.error('getActivePromotions error:', error); return []; }
    return data as Promotion[];
}

export async function getAllPromotions(): Promise<Promotion[]> {
    const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) { console.error('getAllPromotions error:', error); return []; }
    return data as Promotion[];
}

export interface CreatePromotionPayload {
    product_id: number;
    sale_price: number;
    label: string;
    ends_at: string | null;
}

export async function createPromotion(payload: CreatePromotionPayload): Promise<void> {
    const { error } = await supabase.from('promotions').insert({
        ...payload,
        active: true,
    });
    if (error) throw error;
}

export async function updatePromotion(id: number, payload: Partial<CreatePromotionPayload & { active: boolean }>): Promise<void> {
    const { error } = await supabase.from('promotions').update(payload).eq('id', id);
    if (error) throw error;
}

export async function deletePromotion(id: number): Promise<void> {
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) throw error;
}
