// src/components/FloatButtons.tsx
import { useState, useEffect } from 'react';
import styles from './FloatButtons.module.css';

export default function FloatButtons() {
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => setShowTop(window.scrollY > 300);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <div className={styles.floatGroup}>
            {/* Zalo button */}
            <a href="https://zalo.me/0981063381" target="_blank" rel="noreferrer" className={styles.floatBtn} title="Chat Zalo">
                <svg viewBox="0 0 50 50" width="24" height="24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M25 2C12.318 2 2 12.318 2 25c0 3.96 1.023 7.854 2.963 11.29L2.037 46.73a1 1 0 0 0 1.233 1.233l10.44-2.926A23 23 0 0 0 25 48c12.682 0 23-10.318 23-23S37.682 2 25 2zm0 4c10.477 0 19 8.523 19 19S35.477 44 25 44a19 19 0 0 1-9.504-2.537 1 1 0 0 0-.71-.1l-7.377 2.067 2.067-7.377a1 1 0 0 0-.1-.71A19 19 0 0 1 6 25c0-10.477 8.523-19 19-19zm-8 10v2h10.586l-11 11 1.414 1.414 11-11V30h2V16H17z" />
                </svg>
                <span className={styles.floatLabel}>Zalo</span>
            </a>

            {/* Hotline button */}
            <a href="tel:0981063381" className={`${styles.floatBtn} ${styles.hotlineBtn}`} title="Gọi điện">
                <i className="fa-solid fa-phone"></i>
                <span className={styles.floatLabel}>Gọi ngay</span>
            </a>

            {/* Scroll to top */}
            <button
                className={`${styles.floatBtn} ${styles.topBtn}${showTop ? ' ' + styles.visible : ''}`}
                onClick={scrollToTop}
                title="Lên đầu trang"
                aria-label="Scroll to top"
            >
                ↑
                <span className={styles.floatLabel}>Lên đầu</span>
            </button>
        </div>
    );
}
