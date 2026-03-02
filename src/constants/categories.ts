// src/constants/categories.ts
// Danh sách danh mục cố định. Danh mục 'Khác' phải luôn là phần tử cuối cùng.

export interface CategoryDef {
    key: string;
    label: string;
    icon: string;
}

export const FIXED_CATEGORIES: CategoryDef[] = [
    { key: 'but', label: 'Bút viết', icon: '✏️' },
    { key: 'vo', label: 'Vở', icon: '📓' },
    { key: 'dungcu', label: 'Dụng cụ HT', icon: '📐' },
    { key: 'mythuat', label: 'Mỹ thuật', icon: '🎨' },
    { key: 'khac', label: 'Khác', icon: '📦' },
];

/** "Tất cả" luôn đứng đầu, "Khác" luôn đứng cuối.
 *  Các danh mục từ dữ liệu sản phẩm thực tế sẽ được xen vào ở giữa nếu chưa có trong FIXED_CATEGORIES. */
export function buildCategoryList(productCategories: string[]): CategoryDef[] {
    const fixedKeys = new Set(FIXED_CATEGORIES.map((c) => c.key));
    const khac = FIXED_CATEGORIES.find((c) => c.key === 'khac')!;
    const rest = FIXED_CATEGORIES.filter((c) => c.key !== 'khac');

    // Các danh mục lạ (từ DB) chưa có trong danh sách cố định
    const extra: CategoryDef[] = [];
    const seen = new Set<string>();
    for (const k of productCategories) {
        if (!k || k === 'all' || fixedKeys.has(k) || seen.has(k)) continue;
        seen.add(k);
        extra.push({ key: k, label: k, icon: '🏷️' });
    }

    return [
        { key: 'all', label: 'Tất cả', icon: '🏪' },
        ...rest,
        ...extra,
        khac,
    ];
}
