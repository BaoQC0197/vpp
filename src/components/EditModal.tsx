// src/components/EditModal.tsx
import { useState, useEffect } from 'react';
import type { Product } from '../types/product';
import ImageUpload from './ImageUpload';
import styles from './EditModal.module.css';

interface EditModalProps {
    product: Product | null;
    onSave: (id: number, data: Partial<Product>) => Promise<void>;
    onClose: () => void;
}

export default function EditModal({ product, onSave, onClose }: EditModalProps) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setName(product.name || '');
            setPrice(String(product.price || ''));
            setImage(product.image || '');
            setDescription(product.description || '');
        }
    }, [product]);

    if (!product) return null;

    const handleSave = async () => {
        const parsedPrice = parseInt(price);
        if (isNaN(parsedPrice)) { alert('Giá không hợp lệ'); return; }
        setLoading(true);
        try {
            await onSave(product.id, { name, price: parsedPrice, image, description });
            onClose();
        } catch {
            alert('Lỗi khi cập nhật sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="edit-modal" className={styles.editModalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modalContent}>
                <h3>Sửa sản phẩm</h3>
                <input type="text" id="edit-name" placeholder="Tên" value={name} onChange={(e) => setName(e.target.value)} />
                <input type="number" id="edit-price" placeholder="Giá" value={price} onChange={(e) => setPrice(e.target.value)} />
                <label className="field-label">Ảnh sản phẩm</label>
                <ImageUpload currentImageUrl={image} onUploaded={(url) => setImage(url)} />
                <textarea id="edit-desc" placeholder="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className={styles.modalButtons}>
                    <button type="button" onClick={handleSave} disabled={loading}>
                        {loading ? 'Đang lưu...' : 'Lưu'}
                    </button>
                    <button type="button" onClick={onClose}>Huỷ</button>
                </div>
            </div>
        </div>
    );
}
