// src/components/ProductCard.tsx
import { useState } from 'react';
import type { Product } from '../types/product';
import ImageLightbox from './ImageLightbox';
import styles from './ProductCard.module.css';


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
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const handleAddToCart = () => {
        onAddToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    return (
        <>
            <div className={styles.card}>
                <div className={styles.cardImgWrapper} onClick={() => setLightboxOpen(true)} title="Xem ảnh lớn">
                    <img src={product.image} alt={product.name} className={styles.cardImg} />
                    <div className={styles.imgOverlay}>
                        <span className={styles.imgZoomIcon}>🔍</span>
                    </div>
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

            {lightboxOpen && (
                <ImageLightbox
                    src={product.image}
                    name={product.name}
                    description={product.description}
                    price={product.price}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </>
    );
}
