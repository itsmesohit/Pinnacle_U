// ==========================================
// LocalStorage Persistence Layer
// ==========================================

const STORAGE_PREFIX = 'college_sis_v1_';
const DATA_VERSION_KEY = `${STORAGE_PREFIX}version`;
const CURRENT_VERSION = '1.0.0';

type StorageKey =
  | 'users'
  | 'students'
  | 'teachers'
  | 'departments'
  | 'courses'
  | 'enrollments'
  | 'attendanceSessions'
  | 'attendanceRecords'
  | 'grades'
  | 'announcements'
  | 'activities'
  | 'settings'
  | 'notifications'
  | 'currentUser';

function getKey(key: StorageKey): string {
  return `${STORAGE_PREFIX}${key}`;
}

export function getStorageItem<T>(key: StorageKey, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(getKey(key));
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`Failed to parse localStorage key: ${key}`);
    return defaultValue;
  }
}

export function setStorageItem<T>(key: StorageKey, value: T): void {
  try {
    localStorage.setItem(getKey(key), JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write localStorage key: ${key}`, e);
  }
}

export function removeStorageItem(key: StorageKey): void {
  localStorage.removeItem(getKey(key));
}

export function getDataVersion(): string | null {
  return localStorage.getItem(DATA_VERSION_KEY);
}

export function setDataVersion(): void {
  localStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);
}

export function isDataSeeded(): boolean {
  return getDataVersion() !== null;
}

export function clearAllData(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// ==========================================
// ID Generator
// ==========================================

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateStudentId(index: number): string {
  return `STU-2024-${String(index).padStart(3, '0')}`;
}

export function generateTeacherId(index: number): string {
  return `TCH-${String(index).padStart(3, '0')}`;
}

export function generateCourseId(): string {
  return `CRS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}
