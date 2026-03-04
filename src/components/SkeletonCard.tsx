// src/components/SkeletonCard.tsx
import styles from './SkeletonCard.module.css';

export default function SkeletonCard() {
    return (
        <div className={styles.card}>
            <div className={`${styles.shimmer} ${styles.img}`} />
            <div className={styles.body}>
                <div className={`${styles.shimmer} ${styles.title}`} />
                <div className={`${styles.shimmer} ${styles.titleShort}`} />
                <div className={`${styles.shimmer} ${styles.desc}`} />
                <div className={styles.footer}>
                    <div className={`${styles.shimmer} ${styles.price}`} />
                    <div className={`${styles.shimmer} ${styles.btn}`} />
                </div>
            </div>
        </div>
    );
}
