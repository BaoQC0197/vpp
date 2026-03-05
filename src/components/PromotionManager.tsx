// src/components/PromotionManager.tsx
import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../types/product';
import type { Promotion } from '../types/promotion';
import { getAllPromotions, createPromotion, deletePromotion, updatePromotion } from '../api/promotions';
import styles from './PromotionManager.module.css';

interface Props {
    products: Product[];
}

const PROMO_PAGE_SIZE = 10;

export default function PromotionManager({ products }: Props) {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Form state
    const [productId, setProductId] = useState<number | ''>('');
    const [salePrice, setSalePrice] = useState('');
    const [label, setLabel] = useState('SALE');
    const [endsAt, setEndsAt] = useState('');
    const [formError, setFormError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getAllPromotions();
        setPromotions(data);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const selectedProduct = products.find(p => p.id === productId);

    const validate = () => {
        if (!productId) return 'Vui lòng chọn sản phẩm';
        if (!salePrice) return 'Vui lòng nhập giá khuyến mãi';
        const sale = parseInt(salePrice.replace(/\D/g, ''));
        if (isNaN(sale) || sale <= 0) return 'Giá không hợp lệ';
        if (selectedProduct && sale >= selectedProduct.price) return 'Giá KM phải nhỏ hơn giá gốc';
        if (!label.trim()) return 'Vui lòng nhập nhãn khuyến mãi';
        return '';
    };

    const handleSubmit = async () => {
        const err = validate();
        if (err) { setFormError(err); return; }
        setSaving(true);
        setFormError('');
        try {
            await createPromotion({
                product_id: productId as number,
                sale_price: parseInt(salePrice.replace(/\D/g, '')),
                label: label.trim(),
                ends_at: endsAt ? new Date(endsAt).toISOString() : null,
            });
            setProductId('');
            setSalePrice('');
            setLabel('SALE');
            setEndsAt('');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2500);
            await load();
            setCurrentPage(1);
        } catch {
            setFormError('Lỗi khi tạo khuyến mãi, thử lại nhé!');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (promo: Promotion) => {
        try {
            await updatePromotion(promo.id, { active: !promo.active });
            setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, active: !p.active } : p));
        } catch {
            alert('Cập nhật thất bại!');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Xoá khuyến mãi này?')) return;
        setDeletingId(id);
        try {
            await deletePromotion(id);
            const remaining = promotions.filter(p => p.id !== id);
            setPromotions(remaining);
            const maxPage = Math.max(1, Math.ceil(remaining.length / PROMO_PAGE_SIZE));
            if (currentPage > maxPage) setCurrentPage(maxPage);
        } catch {
            alert('Xoá thất bại!');
        } finally {
            setDeletingId(null);
        }
    };

    const fmt = (n: number) => n.toLocaleString('vi-VN') + ' đ';
    const fmtDate = (iso: string | null) =>
        iso ? new Date(iso).toLocaleDateString('vi-VN') : 'Không có hạn';

    const getProductName = (id: number) =>
        products.find(p => p.id === id)?.name ?? `Sản phẩm #${id}`;

    // Pagination
    const totalPages = Math.max(1, Math.ceil(promotions.length / PROMO_PAGE_SIZE));
    const pagedPromotions = promotions.slice(
        (currentPage - 1) * PROMO_PAGE_SIZE,
        currentPage * PROMO_PAGE_SIZE
    );

    return (
        <div className={styles.wrap}>
            {/* ── Form thêm KM ── */}
            <div className={styles.formCard}>
                <h3 className={styles.formTitle}>➕ Thêm khuyến mãi mới</h3>

                {showSuccess && (
                    <div className={styles.successMsg}>✅ Đã tạo khuyến mãi thành công!</div>
                )}

                <div className={styles.formGrid}>
                    <div className={styles.formField}>
                        <label className={styles.label}>Sản phẩm *</label>
                        <select
                            className={styles.select}
                            value={productId}
                            onChange={e => { setProductId(Number(e.target.value) || ''); setFormError(''); }}
                        >
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({fmt(p.price)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formField}>
                        <label className={styles.label}>Giá khuyến mãi (VNĐ) *</label>
                        <input
                            className={styles.input}
                            type="text"
                            inputMode="numeric"
                            placeholder="Ví dụ: 15.000"
                            value={salePrice ? parseInt(salePrice.replace(/\D/g, '') || '0').toLocaleString('vi-VN') : ''}
                            onChange={e => {
                                const digits = e.target.value.replace(/\D/g, '');
                                setSalePrice(digits);
                                setFormError('');
                            }}
                        />
                        {selectedProduct && salePrice && (
                            <p className={styles.priceHint}>
                                Giá gốc: {fmt(selectedProduct.price)}
                                {parseInt(salePrice.replace(/\D/g, '')) < selectedProduct.price && (
                                    <span className={styles.discountHint}>
                                        {' '}→ Giảm {Math.round((1 - parseInt(salePrice.replace(/\D/g, '')) / selectedProduct.price) * 100)}%
                                    </span>
                                )}
                            </p>
                        )}
                    </div>

                    <div className={styles.formField}>
                        <label className={styles.label}>Nhãn hiển thị *</label>
                        <div className={styles.labelPresets}>
                            {['SALE', 'Flash Sale', 'Giảm giá', 'Clearance'].map(preset => (
                                <button
                                    key={preset}
                                    className={`${styles.presetBtn}${label === preset ? ' ' + styles.presetActive : ''}`}
                                    onClick={() => setLabel(preset)}
                                    type="button"
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Hoặc nhập tuỳ chỉnh..."
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                        />
                    </div>

                    <div className={styles.formField}>
                        <label className={styles.label}>Ngày hết hạn (tuỳ chọn)</label>
                        <input
                            className={styles.input}
                            type="datetime-local"
                            value={endsAt}
                            onChange={e => setEndsAt(e.target.value)}
                        />
                        <p className={styles.priceHint}>Để trống = không có hạn</p>
                    </div>
                </div>

                {formError && <p className={styles.errorMsg}>⚠️ {formError}</p>}

                <div className={styles.submitRow}>
                    <button className={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Đang lưu...' : '🏷️ Tạo khuyến mãi'}
                    </button>
                </div>
            </div>

            {/* ── Danh sách KM ── */}
            <div className={styles.listSection}>
                <div className={styles.listHeader}>
                    <h3 className={styles.listTitle}>📋 Danh sách khuyến mãi</h3>
                    <div className={styles.listHeaderRight}>
                        {promotions.length > 0 && (
                            <span className={styles.pageSummary}>
                                {(currentPage - 1) * PROMO_PAGE_SIZE + 1}–{Math.min(currentPage * PROMO_PAGE_SIZE, promotions.length)} / {promotions.length}
                            </span>
                        )}
                        <button className={styles.refreshBtn} onClick={load} disabled={loading}>🔄</button>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loadingMsg}>⏳ Đang tải...</div>
                ) : promotions.length === 0 ? (
                    <div className={styles.emptyMsg}>
                        <span>🏷️</span>
                        <p>Chưa có khuyến mãi nào</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.promoList}>
                            {pagedPromotions.map(promo => {
                                const productName = getProductName(promo.product_id);
                                const origProduct = products.find(p => p.id === promo.product_id);
                                const isExpired = promo.ends_at ? new Date(promo.ends_at) < new Date() : false;

                                return (
                                    <div key={promo.id} className={`${styles.promoRow}${!promo.active || isExpired ? ' ' + styles.promoInactive : ''}`}>
                                        <div className={styles.promoLeft}>
                                            <span className={styles.promoLabel}
                                                style={{ background: promo.active && !isExpired ? '#ef4444' : '#94a3b8' }}>
                                                {promo.label}
                                            </span>
                                            <div className={styles.promoInfo}>
                                                <p className={styles.promoProduct}>{productName}</p>
                                                <p className={styles.promoPrices}>
                                                    {origProduct && (
                                                        <span className={styles.origPrice}>{fmt(origProduct.price)}</span>
                                                    )}
                                                    <span className={styles.salePrice}>{fmt(promo.sale_price)}</span>
                                                    {origProduct && (
                                                        <span className={styles.savePct}>
                                                            -{Math.round((1 - promo.sale_price / origProduct.price) * 100)}%
                                                        </span>
                                                    )}
                                                </p>
                                                <p className={styles.promoExpiry}>
                                                    {isExpired
                                                        ? '⏰ Đã hết hạn'
                                                        : `📅 Hết hạn: ${fmtDate(promo.ends_at)}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={styles.promoActions}>
                                            <button
                                                className={`${styles.toggleBtn}${promo.active ? ' ' + styles.toggleActive : ''}`}
                                                onClick={() => handleToggleActive(promo)}
                                                title={promo.active ? 'Tắt KM' : 'Bật KM'}
                                            >
                                                {promo.active ? '✅ Đang bật' : '⏸ Tắt'}
                                            </button>
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => handleDelete(promo.id)}
                                                disabled={deletingId === promo.id}
                                                title="Xoá khuyến mãi"
                                            >
                                                {deletingId === promo.id ? '...' : '🗑'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    className={styles.pageBtn}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >← Trước</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                    <button
                                        key={pg}
                                        className={`${styles.pageBtn}${currentPage === pg ? ' ' + styles.pageBtnActive : ''}`}
                                        onClick={() => setCurrentPage(pg)}
                                    >{pg}</button>
                                ))}
                                <button
                                    className={styles.pageBtn}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >Sau →</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
