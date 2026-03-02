import { useState, useEffect } from 'react';

interface HeroProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

const CAROUSEL_IMAGES = [
    '/hero-stationery.png',
    '/skg.png',
    '/may-photo.png',
    '/stationery.png',
];

export default function Hero({ searchQuery, onSearchChange }: HeroProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % CAROUSEL_IMAGES.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="hero" id="home">
            <div className="hero-bg" />
            <div className="container hero-inner">
                {/* Left: Text (title + subtitle only) */}
                <div className="hero-content">
                    <div className="hero-badge">🔥 Ưu đãi đặc biệt hôm nay</div>
                    <h1 className="hero-title">
                        Văn Phòng Phẩm<br />
                        <span className="hero-title-accent">Chất Lượng Cao</span>
                    </h1>
                    <p className="hero-subtitle">
                        Chuyên nhận đặt SGK giá tốt - Photo - In - Gói quà lưu niệm
                    </p>

                    {/* Search bar — hidden on mobile, shown here on desktop */}
                    <div className="hero-search hero-search-desktop">
                        <span className="hero-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm bút, vở, sách giáo khoa..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="hero-search-input"
                        />
                        {searchQuery && (
                            <button className="hero-search-clear" onClick={() => onSearchChange('')}>✕</button>
                        )}
                    </div>
                </div>

                {/* Right: Image carousel */}
                <div className="hero-image-wrap">
                    <div className="hero-image-glow" />
                    <div className="hero-carousel">
                        {CAROUSEL_IMAGES.map((src, idx) => (
                            <img
                                key={src}
                                src={src}
                                alt="Văn phòng phẩm và dịch vụ photo"
                                className={`hero-carousel-item ${idx === currentImageIndex ? 'active' : ''}`}
                                loading={idx === 0 ? "eager" : "lazy"}
                            />
                        ))}

                        {/* Carousel Indicators */}
                        <div className="hero-carousel-indicators">
                            {CAROUSEL_IMAGES.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`hero-carousel-dot ${idx === currentImageIndex ? 'active' : ''}`}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Search bar — mobile only, shown BELOW the image */}
                <div className="hero-search hero-search-mobile">
                    <span className="hero-search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm bút, vở, sách giáo khoa..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="hero-search-input"
                    />
                    {searchQuery && (
                        <button className="hero-search-clear" onClick={() => onSearchChange('')}>✕</button>
                    )}
                </div>
            </div>
        </section>
    );
}
