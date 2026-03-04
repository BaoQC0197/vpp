// src/components/ProductCard.tsx
import { useState } from 'react';
import type { Product } from '../types/product';
import styles from './ProductCard.module.css';

const CATEGORY_LABELS: Record<string, string> = {
    but: 'Bút viết',
    vo: 'Vở',
    dungcu: 'Dụng cụ HT',
    mythuat: 'Mỹ thuật',
    all: '',
};

interface ProductCardProps {
    product: Product;
    isAdmin: boolean;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onAddToCart: (product: Product) => void;
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

export default function ProductCard({ product, isAdmin, onEdit, onDelete, onAddToCart, searchQuery }: ProductCardProps) {
    const [added, setAdded] = useState(false);

    const handleAddToCart = () => {
        onAddToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    const catLabel = product.category
        ? (CATEGORY_LABELS[product.category] ?? product.category)
        : '';

    return (
        <div className={styles.card}>
            <div className={styles.cardImgWrapper}>
                <img src={product.image} alt={product.name} className={styles.cardImg} />
                {catLabel && <span className={styles.cardBadge}>{catLabel}</span>}
            </div>
            <div className={styles.cardContent}>
                <h3 className={styles.cardName}>
                    <Highlight text={product.name} query={searchQuery} />
                </h3>
                {product.description && (
                    <p className={styles.cardDesc}>{product.description}</p>
                )}
                <div className={styles.cardFooter}>
                    <div className={styles.cardPrice}>{product.price.toLocaleString('vi-VN')} đ</div>
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
