/**
 * src/components/ProductSortManager.tsx
 * 
 * COMPONENT SẮP XẾP SẢN PHẨM
 * --------------------------
 * Cho phép Admin kéo thả hoặc dùng nút lên/xuống để thay đổi thứ tự sản phẩm trong một danh mục.
 */
import { useState, useEffect } from 'react';
import type { Product } from '../types/product';
import type { Category } from '../types/category';
import styles from './ProductSortManager.module.css';

interface ProductSortManagerProps {
    categories: Category[];
    products: Product[];
    onUpdateOrders: (updates: { id: number; sort_order: number }[]) => Promise<void>;
    onUpdateGlobalOrders?: (updates: { id: number; global_sort_order: number | null }[]) => Promise<void>;
    showToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function ProductSortManager({ categories, products, onUpdateOrders, onUpdateGlobalOrders, showToast }: ProductSortManagerProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [globalOrderChanges, setGlobalOrderChanges] = useState<Record<number, number | null>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Mặc định chọn danh mục đầu tiên
    useEffect(() => {
        if (categories.length > 0 && !selectedCategory) {
            setSelectedCategory(categories[0].key);
        }
    }, [categories, selectedCategory]);

    // Khi chọn danh mục khác hoặc tìm kiếm, lấy danh sách sản phẩm
    useEffect(() => {
        if (!selectedCategory) return;

        let filtered = [];

        if (selectedCategory === 'all') {
            // SẮP XẾP CHO TRANG CHỦ (TẤT CẢ) - CÓ TÌM KIẾM
            const q = searchQuery.trim().toLowerCase();
            filtered = [...products].filter(p => !q || p.name.toLowerCase().includes(q)).sort((a, b) => {
                // Ưu tiên hiển thị những đánh dấu thay đổi tại local trước
                const aOrder = globalOrderChanges[a.id] !== undefined ? globalOrderChanges[a.id] : a.global_sort_order;
                const bOrder = globalOrderChanges[b.id] !== undefined ? globalOrderChanges[b.id] : b.global_sort_order;

                if (aOrder !== null && aOrder !== undefined && bOrder !== null && bOrder !== undefined) {
                    return aOrder - bOrder;
                }
                if (aOrder !== null && aOrder !== undefined) return -1;
                if (bOrder !== null && bOrder !== undefined) return 1;

                return b.id - a.id;
            });
        } else {
            // SẮP XẾP CHO TỪNG DANH MỤC CỤ THỂ
            filtered = products
                .filter(p => (p.category || 'khac') === selectedCategory)
                .sort((a, b) => {
                    const orderA = a.sort_order ?? 0;
                    const orderB = b.sort_order ?? 0;
                    if (orderA === orderB) {
                        return b.id - a.id;
                    }
                    return orderA - orderB;
                });
        }

        setCategoryProducts(filtered);
    }, [products, selectedCategory, searchQuery, globalOrderChanges]);

    // Reset thay đổi khi đổi danh mục
    useEffect(() => {
        setHasChanges(false);
        setGlobalOrderChanges({});
        setSearchQuery('');
    }, [selectedCategory]);

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newProducts = [...categoryProducts];
        const temp = newProducts[index];
        newProducts[index] = newProducts[index - 1];
        newProducts[index - 1] = temp;
        setCategoryProducts(newProducts);
        setHasChanges(true);
    };

    const handleMoveDown = (index: number) => {
        if (index === categoryProducts.length - 1 || selectedCategory === 'all') return;
        const newProducts = [...categoryProducts];
        const temp = newProducts[index];
        newProducts[index] = newProducts[index + 1];
        newProducts[index + 1] = temp;
        setCategoryProducts(newProducts);
        setHasChanges(true);
    };

    const handleGlobalOrderChange = (productId: number, newOrder: number | null) => {
        setGlobalOrderChanges(prev => {
            const updated = { ...prev };

            // Xóa vị trí cũ nếu có sản phẩm nào đang chiếm vị trí này
            if (newOrder !== null) {
                for (const pid in updated) {
                    if (updated[pid] === newOrder && parseInt(pid) !== productId) {
                        updated[pid] = null;
                    }
                }
                // Cũng cần kiểm tra xem có sản phẩm nào trong mảng gốc đang chiếm vị trí này không
                products.forEach(p => {
                    if (p.global_sort_order === newOrder && p.id !== productId && updated[p.id] === undefined) {
                        updated[p.id] = null;
                    }
                });
            }

            updated[productId] = newOrder;
            return updated;
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatesForAll: { id: number; global_sort_order: number | null }[] = [];

            if (selectedCategory === 'all') {
                if (!onUpdateGlobalOrders) throw new Error("Tính năng này chưa được kích hoạt");

                // Gom nhặt tất cả những thay đổi vào updates
                for (const productId in globalOrderChanges) {
                    updatesForAll.push({
                        id: parseInt(productId),
                        global_sort_order: globalOrderChanges[productId]
                    });
                }

                if (updatesForAll.length > 0) {
                    await onUpdateGlobalOrders(updatesForAll);
                }
            } else {
                const updates = categoryProducts.map((p, index) => ({
                    id: p.id,
                    sort_order: index
                }));
                await onUpdateOrders(updates);
            }

            setHasChanges(false);
            setGlobalOrderChanges({});
            if (showToast) {
                showToast('Lưu thứ tự thành công!', 'success');
            } else {
                alert('Lưu thứ tự thành công!');
            }
        } catch (error) {
            console.error(error);
            if (showToast) {
                showToast('Có lỗi xảy ra khi lưu!', 'error');
            } else {
                alert('Có lỗi xảy ra khi lưu!');
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <label className={styles.label}>Chọn danh mục để sắp xếp:</label>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="vpp-select"
                >
                    <option value="all">🌟 Tất cả (Trang chủ - Ghim top 12)</option>
                    {categories.map(c => (
                        <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
                    ))}
                    {!categories.some(c => c.key === 'khac') && (
                        <option value="khac">📦 Khác</option>
                    )}
                </select>
            </div>

            {selectedCategory === 'all' && (
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="🔍 Tìm kiếm sản phẩm để ghim..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            )}

            <div className={styles.list}>
                {categoryProducts.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>📭</span>
                        <p>Không có sản phẩm nào trong danh mục này.</p>
                    </div>
                ) : (
                    categoryProducts.map((p, index) => {
                        const currentGlobalOrder = globalOrderChanges[p.id] !== undefined ? globalOrderChanges[p.id] : p.global_sort_order;
                        return (
                            <div key={p.id} className={styles.item}>
                                {selectedCategory !== 'all' && <div className={styles.itemIndex}>{index + 1}</div>}
                                <img src={p.image} alt={p.name} className={styles.image} />
                                <div className={styles.info}>
                                    <div className={styles.name}>{p.name}</div>
                                    <div className={styles.price}>{p.price.toLocaleString('vi-VN')} đ</div>
                                </div>
                                <div className={styles.actions}>
                                    {selectedCategory === 'all' ? (
                                        <select
                                            className="vpp-select"
                                            value={currentGlobalOrder === null || currentGlobalOrder === undefined ? 'none' : currentGlobalOrder}
                                            onChange={(e) => handleGlobalOrderChange(p.id, e.target.value === 'none' ? null : parseInt(e.target.value))}
                                        >
                                            <option value="none">Không ghim</option>
                                            {Array.from({ length: 12 }, (_, i) => i).map(num => (
                                                <option key={num} value={num}>Vị trí {num + 1}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <>
                                            <button
                                                className={styles.btnMove}
                                                onClick={() => handleMoveUp(index)}
                                                disabled={index === 0}
                                                title="Di chuyển lên"
                                            >
                                                ↑ Thể hiện ưu tiên
                                            </button>
                                            <button
                                                className={styles.btnMove}
                                                onClick={() => handleMoveDown(index)}
                                                disabled={index === categoryProducts.length - 1}
                                                title="Di chuyển xuống"
                                            >
                                                ↓ Chuyển xuống dưới
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {categoryProducts.length > 0 && (
                <div className={styles.footer}>
                    <button
                        className={`${styles.btnSave} ${hasChanges ? styles.btnSaveHighlight : ''}`}
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                    >
                        {isSaving ? 'Đang lưu...' : (hasChanges ? 'Lưu thay đổi' : 'Đã lưu cẩn thận')}
                    </button>
                    {hasChanges && <p className={styles.hint}>* Vui lòng nhấn nút Lưu để áp dụng thay đổi hiển thị cho khách hàng.</p>}
                </div>
            )}
        </div>
    );
}
