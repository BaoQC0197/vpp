---
description: CSS layout conventions for the VPP project - alignment rules to follow when creating new sections
---

# VPP Project – CSS Layout Conventions

## ⚠️ Quy tắc quan trọng nhất: Container alignment

`.container` trong `global.css` là container chuẩn của project:
```css
.container {
    max-width: 1800px;
    width: 100%;
    margin: 0 auto;
    padding: 0 clamp(20px, 2.5%, 60px);
}
```

Khi tạo **section mới full-width**, bên trong section dùng thẳng class `container` global, **không** tạo `.inner` riêng với cùng giá trị:

```tsx
/* ✅ ĐÚNG */
<section className={styles.section}>
    <div className="container">
        {/* content */}
    </div>
</section>
```

```tsx
/* ❌ SAI – tạo .inner riêng với padding lặp lại */
<section className={styles.section}>
    <div className={styles.inner}>   {/* copy lại max-width + clamp padding → double padding */}
        {/* content */}
    </div>
</section>
```

> **Lý do hay bị lỗi:** `CategoryBar` tự handle padding riêng trong `.categoryBar`, nhưng `ProductList` dùng `<main className="container">` từ App.tsx. Nếu section mới tự tạo `.inner` với cùng giá trị → bị double padding so với thực tế render.

### Quy tắc mobile 📱

**KHÔNG** override `padding: 0` trong media query cho `.inner` – điều này làm title/content bám sát mép màn hình, lệch với CategoryBar.

```css
/* ❌ SAI – làm lệch trên mobile */
@media (max-width: 600px) {
    .inner {
        padding: 0; /* XÓA CÁI NÀY */
    }
}
```

```css
/* ✅ ĐÚNG – để .inner giữ nguyên clamp padding trên mobile */
@media (max-width: 600px) {
    /* Chỉ điều chỉnh size của card, font, etc. */
    .saleCard { flex: 0 0 160px; }
    .title { font-size: 18px; }
    /* Không touch padding của .inner */
}
```

### Lý do

`CategoryBar` trên mobile dùng `.categoryList { padding: 10px clamp(20px, 2.5%, 60px) }`.
Nếu section khác set `padding: 0`, content sẽ lệch trái so với CategoryBar → mất đồng bộ.

---

## Checklist khi tạo section mới

- [ ] `.inner` dùng `max-width: 1800px` + `padding: 0 clamp(20px, 2.5%, 60px)`
- [ ] Không override `padding` của `.inner` trong mobile breakpoint
- [ ] Kiểm tra canh lề với CategoryBar ở cả desktop (1920px) và mobile (375px)
- [ ] CSS Modules: đặt tên file `ComponentName.module.css`

---

## Breakpoints chuẩn của dự án

| Breakpoint | Dùng cho |
|---|---|
| `max-width: 480px` | Mobile nhỏ (iPhone SE) |
| `max-width: 600px` | Mobile thông thường |
| `max-width: 768px` | Tablet |
| `min-width: 1800px` | Màn hình 27"+ |

---

## Các giá trị CSS variable quan trọng

```css
--color-primary: #16a34a;        /* xanh lá */
--color-primary-dark: #15803d;
--color-primary-light: #86efac;
--color-danger: #ef4444;
--color-text: #1e293b;
--color-text-muted: #64748b;
--color-border: #e2e8f0;
--color-surface: #ffffff;
--color-bg: #f8fafc;
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-full: 9999px;
--shadow-sm: 0 1px 3px rgba(0,0,0,.08);
--shadow-md: 0 4px 12px rgba(0,0,0,.1);
--shadow-lg: 0 8px 30px rgba(0,0,0,.12);
```
