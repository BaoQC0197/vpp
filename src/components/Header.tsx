// src/components/Header.tsx
import { useState } from 'react';
import styles from './Header.module.css';

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
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    {/* Logo */}
                    <a href="#" className={styles.logo}>
                        <span className={styles.logoIcon}>📚</span>
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
                            🛒
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
                    <span className={styles.navBannerIcon}>📚</span>
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
