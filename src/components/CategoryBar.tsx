// src/components/CategoryBar.tsx
import { buildCategoryList } from '../constants/categories';

interface CategoryBarProps {
    activeCategory: string;
    onFilter: (category: string) => void;
    productCategories?: string[]; // danh mục thực tế từ các sản phẩm trong DB
}

export default function CategoryBar({ activeCategory, onFilter, productCategories = [] }: CategoryBarProps) {
    const categories = buildCategoryList(productCategories);

    return (
        <div className="category-bar">
            <div className="container category-list">
                {categories.map((cat) => (
                    <button
                        key={cat.key}
                        className={`category-pill${activeCategory === cat.key ? ' active' : ''}`}
                        onClick={() => onFilter(cat.key)}
                    >
                        <span className="cat-icon">{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
