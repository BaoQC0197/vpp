// src/types/product.ts
import type { Promotion } from './promotion';

export interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    description: string;
    category?: string;
    images?: string[]; // gallery images from product_images table
    promotion?: Promotion | null;
}

export type ProductInput = Omit<Product, 'id' | 'images' | 'promotion'>;
