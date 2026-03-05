import { supabase } from '../lib/supabase';
import emailjs from '@emailjs/browser';
import type { Order, OrderStatus, CreateOrderPayload } from '../types/order';

export async function createOrder(payload: CreateOrderPayload): Promise<number> {
    // 1. Insert order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            customer_name: payload.customer_name,
            customer_phone: payload.customer_phone,
            address: payload.address,
            note: payload.note || null,
            total_price: payload.total_price,
            status: 'pending',
            is_read: false,
        })
        .select('id')
        .single();

    if (orderError) throw orderError;

    // 2. Insert order_items
    const orderItems = payload.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) throw itemsError;

    return order.id;
}

export async function getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getOrders error:', error);
        return [];
    }

    return data as Order[];
}

export async function getOrdersByPhone(phone: string): Promise<Order[]> {
    const cleaned = phone.replace(/\s/g, '');
    const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('customer_phone', cleaned)
        .order('created_at', { ascending: false });

    if (error) { console.error('getOrdersByPhone error:', error); return []; }
    return data as Order[];
}


export async function updateOrderStatus(id: number, status: OrderStatus): Promise<void> {
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

    if (error) throw error;
}

export async function markOrderAsRead(id: number): Promise<void> {
    const { error } = await supabase
        .from('orders')
        .update({ is_read: true })
        .eq('id', id);

    if (error) throw error;
}

export async function deleteOrder(id: number): Promise<void> {
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Sends Email notification using EmailJS.
 */
export async function sendEmailNotification(order: any) {
    const SERVICE_ID = 'service_qowr3sv';
    const TEMPLATE_ID = 'template_0w0ogfc';
    const PUBLIC_KEY = 'vP4sl05peymvaFrwK';

    const itemsList = order.items
        .map((item: any) => `- ${item.name} x ${item.qty}`)
        .join('\n');

    const templateParams = {
        id: order.id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        total_price: order.total_price.toLocaleString('vi-VN'),
        items_list: itemsList,
    };

    try {
        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        console.log('Email sent successfully!', response.status, response.text);
    } catch (error) {
        console.error('Failed to send email:', error);
    }
}
