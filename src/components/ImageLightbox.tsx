// src/components/ImageLightbox.tsx
import { useEffect } from 'react';
import styles from './ImageLightbox.module.css';

interface ImageLightboxProps {
    src: string;
    name: string;
    description?: string;
    price: number;
    onClose: () => void;
}

export default function ImageLightbox({ src, name, description, price, onClose }: ImageLightboxProps) {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">✕</button>
                <div className={styles.imgWrap}>
                    <img src={src} alt={name} className={styles.img} />
                </div>
                <div className={styles.info}>
                    <h2 className={styles.name}>{name}</h2>
                    {description && <p className={styles.desc}>{description}</p>}
                    <p className={styles.price}>{price.toLocaleString('vi-VN')} đ</p>
                </div>
            </div>
        </div>
    );
}
