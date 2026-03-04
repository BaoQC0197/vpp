// src/components/CartDrawer.tsx
import { useState } from 'react';
import type { CartItem } from '../hooks/useCart';
import styles from './CartDrawer.module.css';

interface CartDrawerProps {
    open: boolean;
    items: CartItem[];
    totalPrice: number;
    onClose: () => void;
    onUpdateQuantity: (productId: number, quantity: number) => void;
    onRemove: (productId: number) => void;
    onCheckout: () => void;
    onClearCart: () => void;
}

export default function CartDrawer({ open, items, totalPrice, onClose, onUpdateQuantity, onRemove, onCheckout, onClearCart }: CartDrawerProps) {
    const [confirmClear, setConfirmClear] = useState(false);

    const handleClearCart = () => {
        if (confirmClear) {
            onClearCart();
            setConfirmClear(false);
        } else {
            setConfirmClear(true);
            setTimeout(() => setConfirmClear(false), 3000);
        }
    };

    return (
        <>
            <div className={`${styles.cartOverlay}${open ? ' ' + styles.visible : ''}`} onClick={onClose} />

            <aside className={`${styles.cartDrawer}${open ? ' ' + styles.open : ''}`}>
                <div className={styles.cartDrawerHeader}>
                    <h2 className={styles.cartDrawerTitle}>🛒 Giỏ hàng</h2>
                    <div className={styles.cartHeaderActions}>
                        {items.length > 0 && (
                            <button
                                className={`${styles.clearCartBtn}${confirmClear ? ' ' + styles.confirmClear : ''}`}
                                onClick={handleClearCart}
                                title="Xoá hết giỏ hàng"
                            >
                                {confirmClear ? '⚠️ Xác nhận xoá hết?' : '🗑 Xoá hết'}
                            </button>
                        )}
                        <button className={styles.cartCloseBtn} onClick={onClose} aria-label="Đóng giỏ hàng">✕</button>
                    </div>
                </div>

                <div className={styles.cartDrawerBody}>
                    {items.length === 0 ? (
                        <div className={styles.cartEmpty}>
                            <span className={styles.cartEmptyIcon}>🛍️</span>
                            <p>Giỏ hàng đang trống</p>
                            <button className={styles.cartContinueBtn} onClick={onClose}>Tiếp tục mua sắm</button>
                        </div>
                    ) : (
                        <ul className={styles.cartItemList}>
                            {items.map(({ product, quantity }) => (
                                <li key={product.id} className={styles.cartItem}>
                                    <img src={product.image} alt={product.name} className={styles.cartItemImg} />
                                    <div className={styles.cartItemInfo}>
                                        <p className={styles.cartItemName}>{product.name}</p>
                                        <p className={styles.cartItemPrice}>{(product.price * quantity).toLocaleString('vi-VN')} đ</p>
                                        <div className={styles.cartQtyRow}>
                                            <button className={styles.cartQtyBtn} onClick={() => onUpdateQuantity(product.id, quantity - 1)}>−</button>
                                            <span className={styles.cartQtyNum}>{quantity}</span>
                                            <button className={styles.cartQtyBtn} onClick={() => onUpdateQuantity(product.id, quantity + 1)}>+</button>
                                        </div>
                                    </div>
                                    <button className={styles.cartRemoveBtn} onClick={() => onRemove(product.id)} aria-label="Xoá">🗑</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {items.length > 0 && (
                    <div className={styles.cartDrawerFooter}>
                        <div className={styles.cartTotalRow}>
                            <span>Tổng cộng</span>
                            <span className={styles.cartTotalPrice}>{totalPrice.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <button className={styles.cartCheckoutBtn} onClick={onCheckout}>Đặt hàng ngay →</button>
                        <button className={styles.cartContinueBtn} onClick={onClose}>Tiếp tục mua sắm</button>
                    </div>
                )}
            </aside>
        </>
    );
}
