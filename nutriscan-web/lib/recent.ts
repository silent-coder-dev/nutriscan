import { useSyncExternalStore } from 'react';
import { NutriScore, Product, VegStatus } from '@/types/product';

// Products looked up on this device, newest first
export interface RecentSearch {
  barcode: string;
  productName: string;
  brand: string | null;
  nutriScore: NutriScore;
  imageUrl: string | null;
  vegStatus: VegStatus;
  searchedAt: number;
}

const STORAGE_KEY = 'nutriscan_recent_searches';
const CHANGE_EVENT = 'nutriscan-recent-change';
const MAX_ITEMS = 30;
const EMPTY: RecentSearch[] = [];

let cachedRaw: string | null = null;
let cachedList: RecentSearch[] = EMPTY;

function read(): RecentSearch[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedList;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedList = Array.isArray(parsed)
      ? parsed.filter((item): item is RecentSearch => typeof item?.barcode === 'string' && typeof item?.productName === 'string')
      : EMPTY;
  } catch {
    cachedList = EMPTY;
  }
  return cachedList;
}

function write(list: RecentSearch[]) {
  try {
    if (list.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable: recents just won't persist
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addRecentSearch(product: Product) {
  const entry: RecentSearch = {
    barcode: product.barcode,
    productName: product.productName,
    brand: product.brand,
    nutriScore: product.nutriScore,
    imageUrl: product.imageUrl,
    vegStatus: product.vegStatus ?? 'UNKNOWN',
    searchedAt: Date.now(),
  };
  write([entry, ...read().filter((item) => item.barcode !== product.barcode)].slice(0, MAX_ITEMS));
}

export function removeRecentSearch(barcode: string) {
  write(read().filter((item) => item.barcode !== barcode));
}

export function clearRecentSearches() {
  write([]);
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function useRecentSearches(): RecentSearch[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function timeAgo(timestamp: number, now = Date.now()): string {
  const minutes = Math.round((now - timestamp) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}
