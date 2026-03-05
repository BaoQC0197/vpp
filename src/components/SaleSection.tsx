// src/components/SaleSection.tsx
import type { Product } from '../types/product';
import styles from './SaleSection.module.css';

interface Props {
    products: Product[];
    onViewDetail: (product: Product) => void;
}

export default function SaleSection({ products, onViewDetail }: Props) {
    const saleProducts = products.filter(p => p.promotion != null);
    if (saleProducts.length === 0) return null;

    const calcDiscount = (original: number, sale: number) =>
        Math.round((1 - sale / original) * 100);

    const fmt = (n: number) => n.toLocaleString('vi-VN') + ' đ';

    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.titleRow}>
                    <h2 className={styles.title}>
                        Đang khuyến mãi 🔥
                        <span className={styles.titleBadge}>HOT</span>
                    </h2>
                    <span className={styles.countLabel}>{saleProducts.length} sản phẩm</span>
                </div>

                <div className={styles.strip}>
                    {saleProducts.map(p => {
                        const promo = p.promotion!;
                        const discount = calcDiscount(p.price, promo.sale_price);
                        return (
                            <button
                                key={p.id}
                                className={styles.saleCard}
                                onClick={() => onViewDetail(p)}
                                title={p.name}
                            >
                                <span className={styles.saleBadge}>{promo.label}</span>
                                <div className={styles.imgWrap}>
                                    <img src={p.image} alt={p.name} className={styles.img} loading="lazy" />
                                </div>
                                <div className={styles.cardBody}>
                                    <p className={styles.cardName}>{p.name}</p>
                                    <div className={styles.priceRow}>
                                        <span className={styles.originalPrice}>{fmt(p.price)}</span>
                                        <span className={styles.salePrice}>{fmt(promo.sale_price)}</span>
                                        <span className={styles.discountPct}>↓ Giảm {discount}%</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
