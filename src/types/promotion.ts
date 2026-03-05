// src/types/promotion.ts

export interface Promotion {
    id: number;
    product_id: number;
    sale_price: number;
    label: string;       // e.g. "SALE", "Giảm 20%", "Flash Sale"
    starts_at: string;
    ends_at: string | null;  // null = không có hạn
    active: boolean;
    created_at: string;
}
