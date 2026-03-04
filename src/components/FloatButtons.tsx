// src/components/FloatButtons.tsx
import styles from './FloatButtons.module.css';

export default function FloatButtons() {
    return (
        <>
            {/* Zalo button with official Zalo logo */}
            <a href="https://zalo.me/0981063381" target="_blank" rel="noreferrer" className={styles.zaloBtn} title="Chat Zalo">
                <svg viewBox="0 0 50 50" width="26" height="26" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M25 2C12.318 2 2 12.318 2 25c0 3.96 1.023 7.854 2.963 11.29L2.037 46.73a1 1 0 0 0 1.233 1.233l10.44-2.926A23 23 0 0 0 25 48c12.682 0 23-10.318 23-23S37.682 2 25 2zm0 4c10.477 0 19 8.523 19 19S35.477 44 25 44a19 19 0 0 1-9.504-2.537 1 1 0 0 0-.71-.1l-7.377 2.067 2.067-7.377a1 1 0 0 0-.1-.71A19 19 0 0 1 6 25c0-10.477 8.523-19 19-19zm-8 10v2h10.586l-11 11 1.414 1.414 11-11V30h2V16H17z" />
                </svg>
            </a>
            <a href="tel:0981063381" className={styles.hotlineBtn} title="Gọi điện">
                <i className="fa-solid fa-phone"></i>
            </a>
        </>
    );
}
