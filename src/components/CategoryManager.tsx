// src/components/CategoryManager.tsx
import { useState } from 'react';
import type { Category } from '../types/category';
import { addCategory, updateCategory, deleteCategory } from '../api/categories';
import styles from './CategoryManager.module.css';

interface Props {
    categories: Category[];
    productCategoryCounts: Record<string, number>;
    onRefresh: () => void;
}

const ICON_PRESETS = ['✏️', '📓', '📐', '🎨', '📦', '🏷️', '📏', '🖊️', '📌', '📎', '🗂️', '📚', '🖍️', '✂️', '🔖'];

export default function CategoryManager({ categories, productCategoryCounts, onRefresh }: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editIcon, setEditIcon] = useState('');
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [showAddForm, setShowAddForm] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newIcon, setNewIcon] = useState('🏷️');
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState('');

    const startEdit = (cat: Category) => { setEditingId(cat.id); setEditLabel(cat.label); setEditIcon(cat.icon); };
    const cancelEdit = () => { setEditingId(null); };

    const saveEdit = async (id: number) => {
        if (!editLabel.trim()) return;
        setSaving(true);
        try {
            await updateCategory(id, { label: editLabel.trim(), icon: editIcon });
            onRefresh(); setEditingId(null);
        } catch { alert('Lưu thất bại, thử lại nhé!'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (cat: Category) => {
        const count = productCategoryCounts[cat.key] ?? 0;
        const msg = count > 0
            ? `Xoá danh mục "${cat.label}"?\n${count} sản phẩm sẽ được chuyển sang "Khác".`
            : `Xoá danh mục "${cat.label}"? (không có sản phẩm nào bị ảnh hưởng)`;
        if (!confirm(msg)) return;
        setDeletingId(cat.id);
        try {
            await deleteCategory(cat.id, cat.key);
            onRefresh();
        } catch { alert('Xoá thất bại, thử lại nhé!'); }
        finally { setDeletingId(null); }
    };

    const handleAdd = async () => {
        setAddError('');
        const key = newKey.trim().toLowerCase().replace(/\s+/g, '_');
        const label = newLabel.trim();
        if (!key) { setAddError('Vui lòng nhập key danh mục'); return; }
        if (!label) { setAddError('Vui lòng nhập tên hiển thị'); return; }
        if (categories.some(c => c.key === key)) { setAddError('Key này đã tồn tại'); return; }
        setAdding(true);
        try {
            await addCategory({ key, label, icon: newIcon });
            setNewKey(''); setNewLabel(''); setNewIcon('🏷️');
            setShowAddForm(false);
            onRefresh();
        } catch { setAddError('Thêm thất bại, thử lại nhé!'); }
        finally { setAdding(false); }
    };

    return (
        <div className={styles.catManager}>
            <div className={styles.catManagerHeader}>
                <h3 className={styles.catManagerTitle}>🏷️ Danh mục sản phẩm</h3>
                <button className={styles.btnCatAdd} onClick={() => { setShowAddForm(v => !v); setAddError(''); }}>
                    {showAddForm ? '✕ Đóng' : '+ Thêm danh mục'}
                </button>
            </div>

            {showAddForm && (
                <div className={styles.catAddForm}>
                    <div className={styles.catAddRow}>
                        <div className={styles.catAddField}>
                            <label>Key (mã nội bộ)</label>
                            <input placeholder="vd: dung_cu" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
                        </div>
                        <div className={styles.catAddField}>
                            <label>Tên hiển thị</label>
                            <input placeholder="vd: Dụng cụ" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
                        </div>
                        <div className={`${styles.catAddField} ${styles.catIconField}`}>
                            <label>Icon</label>
                            <div className={styles.catIconPicker}>
                                {ICON_PRESETS.map(ic => (
                                    <button key={ic} className={`${styles.catIconOpt}${newIcon === ic ? ' ' + styles.selected : ''}`} onClick={() => setNewIcon(ic)} type="button">{ic}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    {addError && <p className={styles.catAddError}>⚠️ {addError}</p>}
                    <div className={styles.catAddActions}>
                        <button className={styles.btnCatConfirm} onClick={handleAdd} disabled={adding}>
                            {adding ? 'Đang thêm...' : '✅ Xác nhận thêm'}
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.catTable}>
                <div className={styles.catTableHead}>
                    <span>Danh mục</span>
                    <span className={styles.catColCount}>Sản phẩm</span>
                    <span className={styles.catColActions}>Thao tác</span>
                </div>

                {categories.map(cat => (
                    <div key={cat.id} className={styles.catRow}>
                        {editingId === cat.id ? (
                            <div className={styles.catEditRow}>
                                <div className={styles.catIconPicker}>
                                    {ICON_PRESETS.map(ic => (
                                        <button key={ic} className={`${styles.catIconOpt}${editIcon === ic ? ' ' + styles.selected : ''}`} onClick={() => setEditIcon(ic)} type="button">{ic}</button>
                                    ))}
                                </div>
                                <input className={styles.catEditInput} value={editLabel} onChange={(e) => setEditLabel(e.target.value)} autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(cat.id); if (e.key === 'Escape') cancelEdit(); }} />
                                <div className={styles.catEditBtns}>
                                    <button className={styles.btnCatSave} onClick={() => saveEdit(cat.id)} disabled={saving}>{saving ? '...' : '✅'}</button>
                                    <button className={styles.btnCatCancel} onClick={cancelEdit}>✕</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={styles.catInfo}>
                                    <span className={styles.catRowIcon}>{cat.icon}</span>
                                    <span className={styles.catRowLabel}>{cat.label}</span>
                                    <span className={styles.catRowKey}>({cat.key})</span>
                                    {cat.is_fixed && <span className={styles.catBadgeFixed}>Cố định</span>}
                                </div>
                                <span className={styles.catColCount}>{productCategoryCounts[cat.key] ?? 0}</span>
                                <div className={styles.catColActions}>
                                    <button className={styles.btnCatEdit} onClick={() => startEdit(cat)} title="Đổi tên">✏️</button>
                                    {!cat.is_fixed && (
                                        <button className={styles.btnCatDel} onClick={() => handleDelete(cat)} disabled={deletingId === cat.id} title="Xoá danh mục">
                                            {deletingId === cat.id ? '...' : '🗑'}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <p className={styles.catNote}>
                💡 Danh mục <strong>Cố định</strong> không thể xoá nhưng có thể đổi tên/icon.
                Khi xoá danh mục custom, sản phẩm sẽ được chuyển sang "Khác".
            </p>
        </div>
    );
}
