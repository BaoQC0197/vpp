// src/components/ProductCard.tsx
import { useState } from 'react';
import type { Product } from '../types/product';
import styles from './ProductCard.module.css';

interface ProductCardProps {
    product: Product;
    isAdmin: boolean;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onAddToCart: (product: Product) => void;
    onViewDetail?: (product: Product) => void;
    searchQuery?: string;
}

function Highlight({ text, query }: { text: string; query?: string }) {
    if (!query?.trim()) return <>{text}</>;
    const q = query.trim();
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, idx)}
            <mark className={styles.searchHighlight}>{text.slice(idx, idx + q.length)}</mark>
            {text.slice(idx + q.length)}
        </>
    );
}

export default function ProductCard({ product, isAdmin, onEdit, onDelete, onAddToCart, onViewDetail, searchQuery }: ProductCardProps) {
    const [added, setAdded] = useState(false);
    const promo = product.promotion;

    const handleAddToCart = () => {
        onAddToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    const fmt = (n: number) => n.toLocaleString('vi-VN') + ' đ';

    return (
        <div className={styles.card}>
            <div
                className={styles.cardImgWrapper}
                onClick={() => onViewDetail?.(product)}
                title="Xem chi tiết"
            >
                <img src={product.image} alt={product.name} className={styles.cardImg} />
                <div className={styles.imgOverlay}>
                    <span className={styles.imgZoomIcon}>🔍</span>
                </div>
                {promo && (
                    <span className={styles.saleBadge}>{promo.label}</span>
                )}
            </div>
            <div className={styles.cardContent}>
                <h3
                    className={styles.cardName}
                    onClick={() => onViewDetail?.(product)}
                    style={{ cursor: onViewDetail ? 'pointer' : 'default' }}
                >
                    <Highlight text={product.name} query={searchQuery} />
                </h3>
                {product.description && (
                    <p className={styles.cardDesc}>{product.description}</p>
                )}
                <div className={styles.cardFooter}>
                    <div className={styles.priceBlock}>
                        {promo ? (
                            <>
                                <span className={styles.originalPrice}>{fmt(product.price)}</span>
                                <span className={styles.salePrice}>{fmt(promo.sale_price)}</span>
                            </>
                        ) : (
                            <span className={styles.cardPrice}>{fmt(product.price)}</span>
                        )}
                    </div>
                    {!isAdmin && (
                        <button
                            className={`${styles.btnAddCart}${added ? ' ' + styles.added : ''}`}
                            onClick={handleAddToCart}
                            disabled={added}
                        >
                            {added ? '✓ Đã thêm' : '+ Giỏ'}
                        </button>
                    )}
                </div>
                {isAdmin && (
                    <div className={styles.adminActions}>
                        <button className={styles.btnEdit} onClick={() => onEdit(product.id)}>✏️ Sửa</button>
                        <button className={styles.btnDelete} onClick={() => onDelete(product.id)}>🗑 Xoá</button>
                    </div>
                )}
            </div>
        </div>
    );
}
