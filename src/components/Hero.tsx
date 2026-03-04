// src/components/Hero.tsx
import { useState, useEffect } from 'react';
import styles from './Hero.module.css';

interface HeroProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

const CAROUSEL_IMAGES = [
    '/hero-rect-1.png',
    '/hero-rect-2.png',
    '/hero-rect-3.png',
];

export default function Hero({ searchQuery, onSearchChange }: HeroProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % CAROUSEL_IMAGES.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const scrollToResults = () => {
        document.getElementById('product-list')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className={styles.hero} id="home">
            <div className={styles.heroBg} />
            <div className={`container ${styles.heroInner}`}>
                {/* Left: Text */}
                <div className={styles.heroContent}>
                    <button
                        className={styles.heroBadge}
                        onClick={scrollToResults}
                    >
                        ✨ Khám phá ngay
                    </button>
                    <h1 className={styles.heroTitle}>
                        Văn Phòng Phẩm<br />
                        <span className={styles.heroTitleAccent}>Chất Lượng Cao</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Chuyên nhận đặt SGK giá tốt - Photo - In - Gói quà lưu niệm
                    </p>

                    {/* Search — desktop */}
                    <div className={`${styles.heroSearch} ${styles.heroSearchDesktop}`}>
                        <span className={styles.heroSearchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm bút, vở, sách giáo khoa..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className={styles.heroSearchInput}
                        />
                        {searchQuery && (
                            <button className={styles.heroSearchClear} onClick={() => onSearchChange('')}>✕</button>
                        )}
                    </div>
                </div>

                {/* Right: Image carousel */}
                <div className={styles.heroImageWrap}>
                    <div className={styles.heroImageGlow} />
                    <div className={styles.heroCarousel}>
                        {CAROUSEL_IMAGES.map((src, idx) => (
                            <img
                                key={src}
                                src={src}
                                alt="Văn phòng phẩm và dịch vụ photo"
                                className={`${styles.heroCarouselItem}${idx === currentImageIndex ? ' ' + styles.active : ''}`}
                                loading={idx === 0 ? 'eager' : 'lazy'}
                            />
                        ))}
                        <div className={styles.heroCarouselIndicators}>
                            {CAROUSEL_IMAGES.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`${styles.heroCarouselDot}${idx === currentImageIndex ? ' ' + styles.active : ''}`}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Search — mobile */}
                <div className={`${styles.heroSearch} ${styles.heroSearchMobile}`}>
                    <span className={styles.heroSearchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm bút, vở, sách giáo khoa..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className={styles.heroSearchInput}
                    />
                    {searchQuery && (
                        <button className={styles.heroSearchClear} onClick={() => onSearchChange('')}>✕</button>
                    )}
                </div>
            </div>
        </section>
    );
}
