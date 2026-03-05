// src/components/OrderHistoryDrawer.tsx
import { useState } from 'react';
import { getOrdersByPhone } from '../api/orders';
import type { Order } from '../types/order';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../types/order';
import styles from './OrderHistoryDrawer.module.css';

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function OrderHistoryDrawer({ open, onClose }: Props) {
    const [phone, setPhone] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const handleSearch = async () => {
        const cleaned = phone.replace(/\s/g, '');
        if (!cleaned || cleaned.length < 9) return;
        setLoading(true);
        setSearched(false);
        const data = await getOrdersByPhone(cleaned);
        setOrders(data);
        setSearched(true);
        setLoading(false);
        setExpandedId(null);
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

    const formatPrice = (p: number) => p.toLocaleString('vi-VN') + ' đ';

    return (
        <>
            {/* Backdrop */}
            <div
                className={`${styles.backdrop} ${open ? styles.backdropVisible : ''}`}
                onClick={onClose}
            />
            {/* Drawer */}
            <aside className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <span className={styles.headerIcon}>📋</span>
                        <h2 className={styles.headerTitle}>Đơn hàng của tôi</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">✕</button>
                </div>

                <div className={styles.searchSection}>
                    <p className={styles.searchHint}>Nhập số điện thoại đặt hàng để tra cứu</p>
                    <div className={styles.searchRow}>
                        <input
                            type="tel"
                            className={styles.searchInput}
                            placeholder="Ví dụ: 0981 063 381"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            className={styles.searchBtn}
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            {loading ? '⏳' : '🔍'}
                        </button>
                    </div>
                </div>

                <div className={styles.body}>
                    {!searched && !loading && (
                        <div className={styles.emptyState}>
                            <span>🛍️</span>
                            <p>Nhập SĐT để xem lịch sử đơn hàng</p>
                        </div>
                    )}

                    {searched && orders.length === 0 && (
                        <div className={styles.emptyState}>
                            <span>📭</span>
                            <p>Không tìm thấy đơn hàng nào với SĐT này</p>
                        </div>
                    )}

                    {orders.map(order => (
                        <div key={order.id} className={styles.orderCard}>
                            <div
                                className={styles.orderHeader}
                                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                            >
                                <div className={styles.orderMeta}>
                                    <span className={styles.orderId}>#{order.id}</span>
                                    <span className={styles.orderDate}>{formatDate(order.created_at)}</span>
                                </div>
                                <div className={styles.orderRight}>
                                    <span
                                        className={styles.statusBadge}
                                        style={{
                                            background: ORDER_STATUS_COLORS[order.status] + '20',
                                            color: ORDER_STATUS_COLORS[order.status],
                                            borderColor: ORDER_STATUS_COLORS[order.status] + '50',
                                        }}
                                    >
                                        {ORDER_STATUS_LABELS[order.status]}
                                    </span>
                                    <span className={styles.orderTotal}>{formatPrice(order.total_price)}</span>
                                    <span className={styles.expandIcon}>{expandedId === order.id ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {expandedId === order.id && (
                                <div className={styles.orderDetail}>
                                    <p className={styles.orderAddress}>📍 {order.address}</p>
                                    {order.note && <p className={styles.orderNote}>📝 {order.note}</p>}
                                    <div className={styles.itemList}>
                                        {order.order_items?.map((item, i) => (
                                            <div key={i} className={styles.itemRow}>
                                                <span className={styles.itemName}>{item.product_name} × {item.quantity}</span>
                                                <span className={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.totalRow}>
                                        <span>Tổng cộng</span>
                                        <strong>{formatPrice(order.total_price)}</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </aside>
        </>
    );
}
