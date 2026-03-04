// src/components/Header.tsx
import { useState, useEffect } from 'react';
import styles from './Header.module.css';
import logoImg from '../assets/logo.png';

interface HeaderProps {
    isAdmin: boolean;
    cartCount: number;
    onLogin: (email: string, password: string) => Promise<void>;
    onLogout: () => Promise<void>;
    onCartOpen: () => void;
}

export default function Header({ isAdmin, cartCount, onLogin, onLogout, onCartOpen }: HeaderProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [adminOpen, setAdminOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Scroll-aware shadow
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);
        try {
            await onLogin(email, password);
            setEmail(''); setPassword(''); setAdminOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const navLinks = [
        { label: 'Trang chủ', href: '#' },
        { label: 'Sản phẩm', href: '#product-list' },
        { label: 'Giới thiệu', href: '#about' },
        { label: 'Liên hệ', href: '#contact' },
    ];

    const closeMenu = () => setMenuOpen(false);

    return (
        <>
            {/* ── Header bar ────────────────────────────────────────── */}
            <header className={`${styles.header}${scrolled ? ' ' + styles.scrolled : ''}`}>
                <div className={styles.headerInner}>
                    {/* Logo */}
                    <a href="#" className={styles.logo}>
                        <img src={logoImg} alt="VPP Ti Anh logo" className={styles.logoImg} />
                        <span className={styles.logoText}>VPP <span className={styles.logoAccent}>Ti Anh</span></span>
                    </a>

                    {/* Desktop nav links (hidden on mobile) */}
                    <nav className={styles.desktopNav}>
                        {navLinks.map((link) => (
                            <a key={link.label} href={link.href} className={styles.navLink}>
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* Right actions */}
                    <div className={styles.headerActions}>
                        <button className={styles.cartBtn} onClick={onCartOpen} aria-label="Giỏ hàng">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                            <span>Giỏ</span>
                            {cartCount > 0 && (
                                <span className={styles.cartBadge}>{cartCount > 99 ? '99+' : cartCount}</span>
                            )}
                        </button>

                        <div className={styles.adminDropdownWrapper}>
                            {isAdmin ? (
                                <div className={styles.adminInfo}>
                                    <span className={styles.adminGreeting}>👋 Admin</span>
                                    <button className={styles.btnLogout} onClick={onLogout}>Đăng xuất</button>
                                </div>
                            ) : (
                                <>
                                    <button className={styles.btnAdminToggle} onClick={() => setAdminOpen((v) => !v)} title="Đăng nhập Admin">🔑</button>
                                    {adminOpen && (
                                        <div className={styles.adminDropdown}>
                                            <p className={styles.adminDropdownTitle}>Đăng nhập Admin</p>
                                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                            <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                                            <button className={styles.btnLoginSubmit} onClick={handleLogin} disabled={loading}>
                                                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <button className={styles.hamburger} onClick={() => setMenuOpen(true)} aria-label="Mở menu">☰</button>
                    </div>
                </div>
            </header>

            {/* ── Mobile slide-out nav — NGOÀI header để tránh stacking context ── */}
            <nav className={`${styles.mobileNav}${menuOpen ? ' ' + styles.open : ''}`} aria-hidden={!menuOpen}>
                <button className={styles.navClose} onClick={closeMenu}>✕</button>

                <div className={styles.navBanner}>
                    <div className={styles.navBannerBg} />
                    <img src={logoImg} alt="VPP Ti Anh logo" className={styles.navBannerLogo} />
                    <div className={styles.navBannerText}>
                        <strong>VPP Ti Anh</strong>
                        <span>Văn phòng phẩm chất lượng</span>
                    </div>
                </div>

                <div className={styles.navLinksSection}>
                    {navLinks.map((link) => (
                        <a key={link.label} href={link.href} className={styles.mobileNavLink} onClick={closeMenu}>
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className={styles.navFooter}>
                    <span>📞 Liên hệ đặt hàng</span>
                    <span>🕐 8:00 – 20:00 mỗi ngày</span>
                </div>
            </nav>

            {/* Overlay — NGOÀI header, click để đóng menu */}
            {menuOpen && <div className={styles.navOverlay} onClick={closeMenu} aria-hidden="true" />}
        </>
    );
}
