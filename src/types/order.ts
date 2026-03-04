// src/types/order.ts

export interface OrderItem {
    id?: number;
    order_id?: number;
    product_id: number | null;
    product_name: string;
    price: number;
    quantity: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivering' | 'delivered' | 'cancelled';

export interface Order {
    id: number;
    customer_name: string;
    customer_phone: string;
    address: string;
    note?: string;
    total_price: number;
    status: OrderStatus;
    is_read: boolean;
    created_at: string;
    order_items?: OrderItem[];
}

export interface CreateOrderPayload {
    customer_name: string;
    customer_phone: string;
    address: string;
    note?: string;
    total_price: number;
    items: Omit<OrderItem, 'id' | 'order_id'>[];
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    delivering: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã huỷ',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    delivering: '#8b5cf6',
    delivered: '#16a34a',
    cancelled: '#ef4444',
};
