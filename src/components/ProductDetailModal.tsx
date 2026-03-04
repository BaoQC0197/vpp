// src/components/ProductDetailModal.tsx
import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../types/product';
import type { Category } from '../types/category';
import styles from './ProductDetailModal.module.css';

interface ProductDetailModalProps {
    product: Product;
    allProducts: Product[];
    categories: Category[];
    onClose: () => void;
    onAddToCart: (product: Product, qty: number) => void;
    onBuyNow: (product: Product, qty: number) => void;
}

export default function ProductDetailModal({
    product,
    allProducts,
    categories,
    onClose,
    onAddToCart,
    onBuyNow,
}: ProductDetailModalProps) {
    // Build gallery: combine product.image (always exists) with product.images (from DB)
    const gallery = (() => {
        const imgs = product.images && product.images.length > 0
            ? product.images
            : [product.image];
        // deduplicate while preserving order
        return [...new Set(imgs)];
    })();

    const [activeIdx, setActiveIdx] = useState(0);
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);

    const categoryLabel = categories.find(c => c.key === product.category);

    const related = allProducts.filter(
        p => p.id !== product.id && p.category === product.category
    ).slice(0, 6);

    // Close on ESC
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [handleKeyDown]);

    const handleAddToCart = () => {
        onAddToCart(product, qty);
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
    };

    const handleBuyNow = () => {
        onBuyNow(product, qty);
        onClose();
    };

    const formatPrice = (p: number) =>
        p.toLocaleString('vi-VN') + ' đ';

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                {/* Close */}
                <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">✕</button>

                <div className={styles.body}>
                    {/* ── Left: Image Gallery ── */}
                    <div className={styles.gallery}>
                        <div className={styles.mainImgWrap}>
                            <img
                                src={gallery[activeIdx]}
                                alt={product.name}
                                className={styles.mainImg}
                                key={activeIdx}
                            />
                            {gallery.length > 1 && (
                                <>
                                    <button
                                        className={`${styles.navBtn} ${styles.navPrev}`}
                                        onClick={() => setActiveIdx(i => (i - 1 + gallery.length) % gallery.length)}
                                        disabled={activeIdx === 0}
                                    >‹</button>
                                    <button
                                        className={`${styles.navBtn} ${styles.navNext}`}
                                        onClick={() => setActiveIdx(i => (i + 1) % gallery.length)}
                                        disabled={activeIdx === gallery.length - 1}
                                    >›</button>
                                    <div className={styles.imgCounter}>{activeIdx + 1} / {gallery.length}</div>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {gallery.length > 1 && (
                            <div className={styles.thumbStrip}>
                                {gallery.map((url, i) => (
                                    <button
                                        key={url + i}
                                        className={`${styles.thumbBtn}${i === activeIdx ? ' ' + styles.thumbActive : ''}`}
                                        onClick={() => setActiveIdx(i)}
                                    >
                                        <img src={url} alt={`Ảnh ${i + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Right: Info ── */}
                    <div className={styles.info}>
                        {categoryLabel && (
                            <span className={styles.categoryBadge}>
                                {categoryLabel.icon} {categoryLabel.label}
                            </span>
                        )}

                        <h2 className={styles.productName}>{product.name}</h2>
                        <p className={styles.price}>{formatPrice(product.price)}</p>

                        {product.description && (
                            <div className={styles.descSection}>
                                <h4 className={styles.descTitle}>Mô tả sản phẩm</h4>
                                <p className={styles.desc}>{product.description}</p>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className={styles.qtySection}>
                            <span className={styles.qtyLabel}>Số lượng</span>
                            <div className={styles.qtyControl}>
                                <button
                                    className={styles.qtyBtn}
                                    onClick={() => setQty(q => Math.max(1, q - 1))}
                                    disabled={qty <= 1}
                                >−</button>
                                <span className={styles.qtyValue}>{qty}</span>
                                <button
                                    className={styles.qtyBtn}
                                    onClick={() => setQty(q => q + 1)}
                                >+</button>
                            </div>
                        </div>

                        {/* CTA buttons */}
                        <div className={styles.ctaRow}>
                            <button
                                className={`${styles.btnCart}${added ? ' ' + styles.btnAdded : ''}`}
                                onClick={handleAddToCart}
                            >
                                {added ? '✅ Đã thêm!' : '🛒 Thêm vào giỏ'}
                            </button>
                            <button className={styles.btnBuyNow} onClick={handleBuyNow}>
                                ⚡ Mua ngay
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Related products ── */}
                {related.length > 0 && (
                    <div className={styles.related}>
                        <h4 className={styles.relatedTitle}>Sản phẩm liên quan</h4>
                        <div className={styles.relatedList}>
                            {related.map(p => (
                                <button
                                    key={p.id}
                                    className={styles.relatedCard}
                                    onClick={() => {
                                        // re-open modal with this product
                                        onClose();
                                        setTimeout(() => onAddToCart(p, 0), 0); // handled by parent via onViewDetail
                                    }}
                                    title={p.name}
                                >
                                    <img src={p.image} alt={p.name} className={styles.relatedImg} />
                                    <span className={styles.relatedName}>{p.name}</span>
                                    <span className={styles.relatedPrice}>{formatPrice(p.price)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
