// src/components/Hero.tsx
import { useState, useEffect } from 'react';
import styles from './Hero.module.css';

interface HeroProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

const CAROUSEL_IMAGES = [
    '/hero-stationery-1.png',
    '/hero-backpack-1.png',
    '/hero-gifts-1.png',
    '/hero-printing-2.png',
    '/hero-backpack-2.png',
];

const CAROUSEL_TEXTS = [
    { title: "Siêu rẻ", desc: "Sale up to 50%" },
    { title: "Đầy đủ", desc: "Hành trang năm học mới" },
    { title: "Cập nhật", desc: "Mẫu mới hot trend" },
    { title: "Free ship", desc: "Đơn hàng 200k+" },
    { title: "Free ship", desc: "Đơn hàng 200k+" },

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
        document.getElementById('category-menu')?.scrollIntoView({ behavior: 'smooth' });
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
                        ✨ Mua ở đây thì ngon luôn!
                        <span className={styles.handPointer}>👆🏼</span>
                    </button>
                    <h1 className={styles.heroTitle}>
                        Học hành thiếu đồ<br />
                        <span className={styles.heroTitleAccent}>Ti Anh cứu bồ</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Nhận đặt SGK theo bộ giá tốt - Photo - In ấn - Gói quà lưu niệm
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

                {/* Right: Cover & Grid */}
                <div className={styles.heroImageWrap}>
                    <div className={styles.heroImageGlow} />

                    <div className={styles.masonryWrap}>
                        {/* Box 1: Large image cycling */}
                        <div className={`${styles.masonryItem} ${styles.m1}`}>
                            {CAROUSEL_IMAGES.map((src, idx) => (
                                <img
                                    key={src}
                                    src={src}
                                    alt="Văn phòng phẩm"
                                    className={`${styles.masonryImage}${idx === currentImageIndex ? ' ' + styles.active : ''}`}
                                    loading={idx === 0 ? 'eager' : 'lazy'}
                                />
                            ))}
                        </div>

                        {/* Box 2: Small image cycling (offset by 1) */}
                        <div className={`${styles.masonryItem} ${styles.m2}`}>
                            {CAROUSEL_IMAGES.map((src, idx) => (
                                <img
                                    key={`small-${src}`}
                                    src={src}
                                    alt="Dụng cụ học tập"
                                    className={`${styles.masonryImage}${idx === (currentImageIndex + 1) % CAROUSEL_IMAGES.length ? ' ' + styles.active : ''}`}
                                    loading="lazy"
                                />
                            ))}
                        </div>

                        {/* Box 3: Text cycling */}
                        <div className={`${styles.masonryItem} ${styles.m3}`}>
                            {CAROUSEL_TEXTS.map((text, idx) => (
                                <div
                                    key={`text-${idx}`}
                                    className={`${styles.masonryText}${idx === currentImageIndex ? ' ' + styles.active : ''}`}
                                >
                                    <h3>{text.title}</h3>
                                    <p>{text.desc}</p>
                                </div>
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
