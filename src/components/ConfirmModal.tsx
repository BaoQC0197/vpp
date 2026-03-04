// src/components/ConfirmModal.tsx
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

const ICONS: Record<string, string> = {
    danger: '🗑️',
    warning: '⚠️',
    info: 'ℹ️',
};

export default function ConfirmModal({
    title,
    message,
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Huỷ',
    variant = 'danger',
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={`${styles.iconWrap} ${styles[variant]}`}>
                    <span>{ICONS[variant]}</span>
                </div>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onCancel}>{cancelLabel}</button>
                    <button className={`${styles.confirmBtn} ${styles[variant]}`} onClick={onConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}
