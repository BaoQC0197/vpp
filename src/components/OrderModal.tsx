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

type PaymentMethod = 'cod' | 'bank_transfer';

const BANK_INFO = {
    bank: 'Vietcombank',
    account: '1234567890',
    name: 'NGUYEN THI ANH',
    branch: 'Chi nhánh TP.HCM',
};

export default function OrderModal({ items, totalPrice, onClose, onConfirm }: OrderModalProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [note, setNote] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
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
            const noteWithPayment = `[${paymentMethod === 'cod' ? 'COD' : 'Chuyển khoản'}]${note.trim() ? ' - ' + note.trim() : ''}`;
            const orderId = await createOrder({
                customer_name: name.trim(),
                customer_phone: phone.trim(),
                address: address.trim(),
                note: noteWithPayment,
                total_price: totalPrice,
                items: items.map((i) => ({
                    product_id: i.product.id,
                    product_name: i.product.name,
                    price: i.product.price,
                    quantity: i.quantity,
                })),
            });

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
                                    <div className={styles.orderSummaryItemLeft}>
                                        <img src={product.image} alt={product.name} className={styles.orderSummaryImg} />
                                        <span className={styles.orderSummaryName}>{product.name} × {quantity}</span>
                                    </div>
                                    <span className={styles.orderSummaryPrice}>{(product.price * quantity).toLocaleString('vi-VN')} đ</span>
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
                                onChange={(e) => setNote(e.target.value)} rows={2} />
                        </div>

                        {/* Payment method */}
                        <div className={styles.orderField}>
                            <label>Phương thức thanh toán</label>
                            <div className={styles.paymentOptions}>
                                <button
                                    type="button"
                                    className={`${styles.paymentOption}${paymentMethod === 'cod' ? ' ' + styles.selected : ''}`}
                                    onClick={() => setPaymentMethod('cod')}
                                >
                                    <span className={styles.paymentIcon}>💵</span>
                                    <div>
                                        <strong>Tiền mặt (COD)</strong>
                                        <span>Thanh toán khi nhận hàng</span>
                                    </div>
                                    {paymentMethod === 'cod' && <span className={styles.paymentCheck}>✓</span>}
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.paymentOption}${paymentMethod === 'bank_transfer' ? ' ' + styles.selected : ''}`}
                                    onClick={() => setPaymentMethod('bank_transfer')}
                                >
                                    <span className={styles.paymentIcon}>🏦</span>
                                    <div>
                                        <strong>Chuyển khoản</strong>
                                        <span>Ngân hàng / Ví điện tử</span>
                                    </div>
                                    {paymentMethod === 'bank_transfer' && <span className={styles.paymentCheck}>✓</span>}
                                </button>
                            </div>
                        </div>

                        {paymentMethod === 'bank_transfer' && (
                            <div className={styles.bankInfo}>
                                <p className={styles.bankInfoTitle}>💳 Thông tin chuyển khoản</p>
                                <div className={styles.bankInfoRow}><span>Ngân hàng:</span><strong>{BANK_INFO.bank}</strong></div>
                                <div className={styles.bankInfoRow}><span>Số tài khoản:</span><strong className={styles.bankAccount}>{BANK_INFO.account}</strong></div>
                                <div className={styles.bankInfoRow}><span>Chủ tài khoản:</span><strong>{BANK_INFO.name}</strong></div>
                                <div className={styles.bankInfoRow}><span>Chi nhánh:</span><strong>{BANK_INFO.branch}</strong></div>
                                <p className={styles.bankNote}>📌 Ghi chú chuyển khoản: <strong>Tên bạn + số điện thoại</strong></p>
                            </div>
                        )}

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
