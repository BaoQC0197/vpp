// src/types/product.ts

export interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    description: string;
    category?: string;
    images?: string[]; // gallery images from product_images table
}

export type ProductInput = Omit<Product, 'id' | 'images'>;
