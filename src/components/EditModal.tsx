// src/components/EditModal.tsx
import { useState, useEffect } from 'react';
import type { Product } from '../types/product';
import type { Category } from '../types/category';
import MultiImageUpload from './MultiImageUpload';
import styles from './EditModal.module.css';

interface EditModalProps {
    product: Product | null;
    categories: Category[];
    onSave: (id: number, data: Partial<Product>, imageUrls: string[]) => Promise<void>;
    onClose: () => void;
}

export default function EditModal({ product, categories, onSave, onClose }: EditModalProps) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setName(product.name || '');
            setPrice(String(product.price || '').replace(/\D/g, ''));
            // merge primary image + gallery
            const all = product.images && product.images.length > 0
                ? product.images
                : (product.image ? [product.image] : []);
            setImageUrls([...new Set(all)]);
            setDescription(product.description || '');
            setCategory(product.category || (categories[0]?.key ?? ''));
        }
    }, [product, categories]);

    if (!product) return null;

    const validate = () => {
        const e: typeof errors = {};
        if (!name.trim()) e.name = 'Vui lòng nhập tên sản phẩm';
        const parsedPrice = parseInt(price.replace(/\./g, ''), 10);
        if (!price || isNaN(parsedPrice) || parsedPrice <= 0) e.price = 'Giá không hợp lệ';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        const parsedPrice = parseInt(price.replace(/\./g, ''), 10);
        setLoading(true);
        try {
            const primaryImage = imageUrls[0] ?? '';
            await onSave(product!.id, { name: name.trim(), price: parsedPrice, image: primaryImage, description, category }, imageUrls);
            onClose();
        } catch {
            setErrors(p => ({ ...p, name: 'Lỗi khi cập nhật sản phẩm. Thử lại nhé!' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="edit-modal" className={styles.editModalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>✏️ Sửa sản phẩm</h3>
                    <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Đóng">✕</button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.formField}>
                        <label className="field-label">Tên sản phẩm *</label>
                        <input type="text" id="edit-name" placeholder="Tên" value={name}
                            onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
                            className={errors.name ? 'input-error' : ''} />
                        {errors.name && <p className="field-error">{errors.name}</p>}
                    </div>

                    <div className={styles.formField}>
                        <label className="field-label">Giá (VNĐ) *</label>
                        <input
                            type="text"
                            id="edit-price"
                            placeholder="Giá"
                            inputMode="numeric"
                            value={price ? price.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                            onChange={(e) => { setPrice(e.target.value.replace(/\D/g, '')); setErrors(p => ({ ...p, price: undefined })); }}
                            className={errors.price ? 'input-error' : ''}
                        />
                        {errors.price && <p className="field-error">{errors.price}</p>}
                    </div>

                    <div className={styles.formField}>
                        <label className="field-label">Danh mục</label>
                        <select className="vpp-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                            {categories.map(c => (
                                <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formField}>
                        <label className="field-label">Ảnh sản phẩm (ảnh đầu tiên = ảnh chính)</label>
                        <MultiImageUpload urls={imageUrls} onChange={setImageUrls} />
                    </div>

                    <div className={styles.formField}>
                        <label className="field-label">Mô tả</label>
                        <textarea id="edit-desc" placeholder="Mô tả" value={description}
                            onChange={(e) => setDescription(e.target.value)} rows={3} />
                    </div>
                </div>

                <div className={styles.modalButtons}>
                    <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                        {loading ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                    </button>
                    <button type="button" className={styles.cancelBtn} onClick={onClose}>Huỷ</button>
                </div>
            </div>
        </div>
    );
}
