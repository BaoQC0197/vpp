// src/components/ProductList.tsx
import { useState, useEffect } from 'react';
import type { Product } from '../types/product';
import ProductCard from './ProductCard';
import SkeletonCard from './SkeletonCard';
import styles from './ProductList.module.css';

const PAGE_SIZE = 8;
const SKELETON_COUNT = 8;

interface ProductListProps {
    products: Product[];
    isAdmin: boolean;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onAddToCart: (product: Product) => void;
    onViewDetail?: (product: Product) => void;
    searchQuery?: string;
    isLoading?: boolean;
    onResetFilter?: () => void;
}

export default function ProductList({ products, isAdmin, onEdit, onDelete, onAddToCart, onViewDetail, searchQuery, isLoading, onResetFilter }: ProductListProps) {
    const [page, setPage] = useState(1);

    useEffect(() => { setPage(1); }, [products]);

    // Skeleton loading state
    if (isLoading) {
        return (
            <div id="product-list">
                <div className={styles.productGrid}>
                    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div id="product-list" className={styles.emptyState}>
                <span className={styles.emptyIcon}>{searchQuery?.trim() ? '🔍' : '📦'}</span>
                {searchQuery?.trim() ? (
                    <>
                        <p>Không tìm thấy sản phẩm nào với từ khoá "<strong>{searchQuery}</strong>".</p>
                        <button className={styles.emptyResetBtn} onClick={onResetFilter}>
                            ✕ Xem tất cả sản phẩm
                        </button>
                    </>
                ) : (
                    <>
                        <p>Không có sản phẩm nào trong danh mục này.</p>
                        {onResetFilter && (
                            <button className={styles.emptyResetBtn} onClick={onResetFilter}>
                                ← Xem tất cả sản phẩm
                            </button>
                        )}
                    </>
                )}
            </div>
        );
    }

    const totalPages = Math.ceil(products.length / PAGE_SIZE);
    const shown = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const goTo = (p: number) => {
        setPage(p);
        document.getElementById('product-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const getPageNumbers = (): (number | '...')[] => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | '...')[] = [1];
        if (page > 3) pages.push('...');
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
        if (page < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    return (
        <div id="product-list">
            <div className={styles.productGrid}>
                {shown.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        isAdmin={isAdmin}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onAddToCart={onAddToCart}
                        onViewDetail={onViewDetail}
                        searchQuery={searchQuery}
                    />
                ))}
            </div>

            <div className={styles.productListFooter}>
                <p className={styles.productCountLabel}>
                    Hiển thị <strong>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, products.length)}</strong> / <strong>{products.length}</strong> sản phẩm
                </p>

                {totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button
                            className={`${styles.pageBtn} ${styles.pageArrow}`}
                            onClick={() => goTo(page - 1)}
                            disabled={page === 1}
                            aria-label="Trang trước"
                        >‹</button>

                        {getPageNumbers().map((p, idx) =>
                            p === '...'
                                ? <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>…</span>
                                : (
                                    <button
                                        key={p}
                                        className={`${styles.pageBtn}${page === p ? ' ' + styles.active : ''}`}
                                        onClick={() => goTo(p as number)}
                                    >{p}</button>
                                )
                        )}

                        <button
                            className={`${styles.pageBtn} ${styles.pageArrow}`}
                            onClick={() => goTo(page + 1)}
                            disabled={page === totalPages}
                            aria-label="Trang sau"
                        >›</button>
                    </div>
                )}
            </div>
        </div>
    );
}
