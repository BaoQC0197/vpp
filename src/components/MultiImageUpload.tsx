// src/components/MultiImageUpload.tsx
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { uploadImage } from '../api/products';
import styles from './MultiImageUpload.module.css';

interface MultiImageUploadProps {
    urls: string[];               // current list of image URLs
    onChange: (urls: string[]) => void;
    maxImages?: number;
}

export default function MultiImageUpload({ urls, onChange, maxImages = 6 }: MultiImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFiles = async (files: File[]) => {
        setError('');
        const remaining = maxImages - urls.length;
        if (remaining <= 0) { setError(`Tối đa ${maxImages} ảnh`); return; }
        const toUpload = files.slice(0, remaining);
        const invalid = toUpload.filter(f => !f.type.startsWith('image/'));
        if (invalid.length) { setError('Chỉ chấp nhận file ảnh'); return; }
        const tooLarge = toUpload.filter(f => f.size > 5 * 1024 * 1024);
        if (tooLarge.length) { setError('Mỗi ảnh tối đa 5MB'); return; }

        setUploading(true);
        try {
            const newUrls = await Promise.all(toUpload.map(f => uploadImage(f)));
            onChange([...urls, ...newUrls]);
        } catch {
            setError('Upload thất bại. Vui lòng thử lại.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length) processFiles(files);
        e.target.value = '';
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
        processFiles(Array.from(e.dataTransfer.files));
    };

    const handleRemove = (idx: number) => {
        onChange(urls.filter((_, i) => i !== idx));
    };

    const handleMoveUp = (idx: number) => {
        if (idx === 0) return;
        const next = [...urls];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        onChange(next);
    };

    const handleMoveDown = (idx: number) => {
        if (idx === urls.length - 1) return;
        const next = [...urls];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        onChange(next);
    };

    return (
        <div className={styles.wrapper}>
            {/* Existing images */}
            {urls.length > 0 && (
                <div className={styles.grid}>
                    {urls.map((url, idx) => (
                        <div key={url + idx} className={`${styles.thumb}${idx === 0 ? ' ' + styles.primary : ''}`}>
                            <img src={url} alt={`Ảnh ${idx + 1}`} className={styles.thumbImg} />
                            {idx === 0 && <span className={styles.primaryBadge}>Ảnh chính</span>}
                            <div className={styles.thumbActions}>
                                <button type="button" onClick={() => handleMoveUp(idx)} disabled={idx === 0} title="Lên trước" className={styles.thumbBtn}>↑</button>
                                <button type="button" onClick={() => handleMoveDown(idx)} disabled={idx === urls.length - 1} title="Xuống sau" className={styles.thumbBtn}>↓</button>
                                <button type="button" onClick={() => handleRemove(idx)} title="Xoá ảnh" className={`${styles.thumbBtn} ${styles.removeBtn}`}>✕</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload zone */}
            {urls.length < maxImages && (
                <div
                    className={`${styles.dropZone}${dragging ? ' ' + styles.dragging : ''}`}
                    onClick={() => inputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                >
                    {uploading ? (
                        <div className={styles.uploadingIndicator}>
                            <span className={styles.spinner} />
                            Đang upload...
                        </div>
                    ) : (
                        <>
                            <span className={styles.dropIcon}>🖼️</span>
                            <p>Kéo ảnh vào đây hoặc <strong>bấm để chọn</strong></p>
                            <small>JPG, PNG, WEBP — tối đa 5MB/ảnh · còn {maxImages - urls.length} slot</small>
                        </>
                    )}
                </div>
            )}

            {error && <p className={styles.error}>{error}</p>}
            <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
    );
}
