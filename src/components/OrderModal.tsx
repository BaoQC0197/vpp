// src/components/OrderModal.tsx
import { useState } from 'react';
import type { CartItem } from '../hooks/useCart';
import { createOrder, sendEmailNotification } from '../api/orders';
import styles from './OrderModal.module.css';

interface OrderModalProps {
    items: CartItem[];
    totalPrice: number;
    onClose: () => void;
    onConfirm: () => void;
}

export default function OrderModal({ items, totalPrice, onClose, onConfirm }: OrderModalProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [note, setNote] = useState('');
    const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const validate = () => {
        const e: typeof errors = {};
        if (!name.trim()) e.name = 'Vui lòng nhập họ tên';
        if (!phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
        else if (!/^[0-9]{9,11}$/.test(phone.replace(/\s/g, ''))) e.phone = 'SĐT không hợp lệ';
        if (!address.trim()) e.address = 'Vui lòng nhập địa chỉ';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        setApiError('');
        try {
            const orderId = await createOrder({
                customer_name: name.trim(),
                customer_phone: phone.trim(),
                address: address.trim(),
                note: note.trim() || undefined,
                total_price: totalPrice,
                items: items.map((i) => ({
                    product_id: i.product.id,
                    product_name: i.product.name,
                    price: i.product.price,
                    quantity: i.quantity,
                })),
            });

            // Notify admin via Email (placeholder)
            sendEmailNotification({
                id: orderId,
                customer_name: name.trim(),
                customer_phone: phone.trim(),
                total_price: totalPrice,
                items: items.map(i => ({ name: i.product.name, qty: i.quantity }))
            });

            onConfirm();
        } catch (err) {
            console.error('Order error:', err);
            setApiError('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.orderOverlay} onClick={onClose}>
            <div className={styles.orderModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.orderModalHeader}>
                    <h2>📋 Thông tin đặt hàng</h2>
                    <button className={styles.orderCloseBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.orderModalBody}>
                    <div className={styles.orderSummary}>
                        <h3>Đơn hàng ({items.length} sản phẩm)</h3>
                        <ul className={styles.orderSummaryList}>
                            {items.map(({ product, quantity }) => (
                                <li key={product.id} className={styles.orderSummaryItem}>
                                    <span>{product.name} × {quantity}</span>
                                    <span>{(product.price * quantity).toLocaleString('vi-VN')} đ</span>
                                </li>
                            ))}
                        </ul>
                        <div className={styles.orderSummaryTotal}>
                            <span>Tổng cộng</span>
                            <span>{totalPrice.toLocaleString('vi-VN')} đ</span>
                        </div>
                    </div>

                    <div className={styles.orderForm}>
                        <div className={styles.orderField}>
                            <label>Họ và tên *</label>
                            <input type="text" placeholder="Nguyễn Văn A" value={name}
                                onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
                                className={errors.name ? 'input-error' : ''} />
                            {errors.name && <p className="field-error">{errors.name}</p>}
                        </div>
                        <div className={styles.orderField}>
                            <label>Số điện thoại *</label>
                            <input type="tel" placeholder="0981 06 33 81" value={phone}
                                onChange={(e) => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: undefined })); }}
                                className={errors.phone ? 'input-error' : ''} />
                            {errors.phone && <p className="field-error">{errors.phone}</p>}
                        </div>
                        <div className={styles.orderField}>
                            <label>Địa chỉ giao hàng *</label>
                            <input type="text" placeholder="Số nhà, đường, phường/xã, quận/huyện..." value={address}
                                onChange={(e) => { setAddress(e.target.value); setErrors(p => ({ ...p, address: undefined })); }}
                                className={errors.address ? 'input-error' : ''} />
                            {errors.address && <p className="field-error">{errors.address}</p>}
                        </div>
                        <div className={styles.orderField}>
                            <label>Ghi chú (tuỳ chọn)</label>
                            <textarea placeholder="Ghi chú thêm về đơn hàng..." value={note}
                                onChange={(e) => setNote(e.target.value)} rows={3} />
                        </div>
                        {apiError && <div className={styles.orderApiError}>⚠️ {apiError}</div>}
                    </div>
                </div>

                <div className={styles.orderModalFooter}>
                    <button className={styles.orderCancelBtn} onClick={onClose} disabled={loading}>Huỷ</button>
                    <button className={styles.orderConfirmBtn} onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Đang đặt hàng...' : 'Xác nhận đặt hàng'}
                    </button>
                </div>
            </div>
        </div>
    );
}
