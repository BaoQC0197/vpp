// src/constants/categories.ts
// Chỉ giữ lại hằng số phòng trường hợp fallback khi DB chưa load.
// Danh mục thực tế được lấy từ bảng `categories` trong Supabase.

export const FALLBACK_ALL = { key: 'all', label: 'Tất cả', icon: '🏪' };
