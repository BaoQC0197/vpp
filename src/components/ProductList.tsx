// src/components/ProductList.tsx
import { useState, useEffect } from 'react';
import type { Product } from '../types/product';
import ProductCard from './ProductCard';
import SkeletonCard from './SkeletonCard';
import styles from './ProductList.module.css';

const SKELETON_COUNT = 8;

interface ProductListProps {
    // ... items from 12-21 ...
    products: Product[];
    isAdmin: boolean;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onAddToCart: (product: Product) => void;
    onViewDetail?: (product: Product) => void;
    searchQuery?: string;
    isLoading?: boolean;
    onResetFilter?: () => void;
    activeCategory?: string;
}

export default function ProductList({ products, isAdmin, onEdit, onDelete, onAddToCart, onViewDetail, searchQuery, isLoading, onResetFilter, activeCategory }: ProductListProps) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(window.innerWidth > 768 ? 12 : 8);

    useEffect(() => {
        const handleResize = () => {
            setPageSize(window.innerWidth > 768 ? 12 : 8);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset to page 1 ONLY when filters or pageSize change
    useEffect(() => {
        setPage(1);
    }, [activeCategory, searchQuery, pageSize]);

    // Ensure the current page is still valid after products change or pageSize changes
    useEffect(() => {
        const totalPages = Math.ceil(products.length / pageSize);
        if (page > totalPages && totalPages > 0) {
            setPage(totalPages);
        }
    }, [products.length, page, pageSize]);

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

    const totalPages = Math.ceil(products.length / pageSize);
    const shown = products.slice((page - 1) * pageSize, page * pageSize);

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
                    Hiển thị <strong>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, products.length)}</strong> / <strong>{products.length}</strong> sản phẩm
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
