// src/components/CategoryBar.tsx
import type { Category } from '../types/category';
import { FALLBACK_ALL } from '../constants/categories';
import styles from './CategoryBar.module.css';

interface CategoryBarProps {
    activeCategory: string;
    onFilter: (category: string) => void;
    categories: Category[];
}

export default function CategoryBar({ activeCategory, onFilter, categories }: CategoryBarProps) {
    const allOption = FALLBACK_ALL;
    const fullList = [allOption, ...categories];

    return (
        <div className={styles.categoryBar}>
            <div className={styles.categoryList}>
                {fullList.map((cat) => (
                    <button
                        key={cat.key}
                        className={`${styles.categoryPill}${activeCategory === cat.key ? ' ' + styles.active : ''}`}
                        onClick={() => onFilter(cat.key)}
                    >
                        <span className={styles.catIcon}>{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
