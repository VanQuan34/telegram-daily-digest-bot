import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { AppConfig, CityPreset, HistoryEntry } from './types';

dotenv.config();

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const PREFS_FILE = path.join(DATA_DIR, 'preferences.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

export const CITY_PRESETS: CityPreset[] = [
  { id: 'hanoi', name: 'Hà Nội', lat: 21.0285, lon: 105.8542 },
  { id: 'hcm', name: 'TP. Hồ Chí Minh', lat: 10.8231, lon: 106.6297 },
  { id: 'danang', name: 'Đà Nẵng', lat: 16.0544, lon: 108.2022 },
  { id: 'haiphong', name: 'Hải Phòng', lat: 20.8449, lon: 106.6881 },
  { id: 'cantho', name: 'Cần Thơ', lat: 10.0452, lon: 105.7469 },
  { id: 'nhatrang', name: 'Nha Trang', lat: 12.2388, lon: 109.1967 },
  { id: 'dalat', name: 'Đà Lạt', lat: 11.9404, lon: 108.4583 },
  { id: 'hue', name: 'Huế', lat: 16.4637, lon: 107.5909 },
  { id: 'vinh', name: 'Vinh (Nghệ An)', lat: 18.6796, lon: 105.6813 },
  { id: 'halong', name: 'Hạ Long (Quảng Ninh)', lat: 20.9599, lon: 107.0425 }
];

export const DEFAULT_CONFIG: AppConfig = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  enableInteractiveBot: true,
  scheduleEnabled: true,
  scheduleTime: '07:00',
  eveningScheduleEnabled: true,
  eveningScheduleTime: '21:00',
  timezone: 'Asia/Ho_Chi_Minh',
  weather: {
    enabled: true,
    cityName: 'Hà Nội',
    lat: 21.0285,
    lon: 105.8542
  },
  lunar: {
    enabled: true
  },
  finance: {
    enabled: true
  },
  lottery: {
    enabled: true
  },
  lucky: {
    enabled: true,
    mode: 'personalized',
    userName: 'Bạn',
    birthDate: '1996-04-03'
  },
  crypto: {
    enabled: true,
    coins: ['BTC', 'ETH', 'SOL', 'BNB']
  },
  news: {
    enabled: true,
    rssUrl: 'https://vnexpress.net/rss/the-gioi.rss',
    maxItems: 5
  },
  customHeader: '🌅 <b>BẢN TIN TỔNG HỢP HÔM NAY</b>',
  customFooter: '💡 <i>Chúc bạn một ngày mới tràn đầy năng lượng, sức khỏe và tài lộc!</i>'
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadConfig(): AppConfig {
  ensureDataDir();

  let prefs: Partial<AppConfig> = {};
  if (fs.existsSync(PREFS_FILE)) {
    try {
      prefs = JSON.parse(fs.readFileSync(PREFS_FILE, 'utf-8'));
    } catch {
      // ignore
    }
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    const mergedDefault: AppConfig = {
      ...DEFAULT_CONFIG,
      ...prefs,
      weather: { ...DEFAULT_CONFIG.weather, ...(prefs.weather || {}) },
      lunar: { ...DEFAULT_CONFIG.lunar, ...(prefs.lunar || {}) },
      finance: { ...DEFAULT_CONFIG.finance, ...(prefs.finance || {}) },
      lottery: { ...DEFAULT_CONFIG.lottery, ...(prefs.lottery || {}) },
      lucky: { ...DEFAULT_CONFIG.lucky, ...(prefs.lucky || {}) },
      crypto: { ...DEFAULT_CONFIG.crypto, ...(prefs.crypto || {}) },
      news: { ...DEFAULT_CONFIG.news, ...(prefs.news || {}) },
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
      telegramChatId: process.env.TELEGRAM_CHAT_ID || ''
    };
    saveConfig(mergedDefault);
    return mergedDefault;
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...prefs,
      ...parsed,
      weather: { ...DEFAULT_CONFIG.weather, ...(prefs.weather || {}), ...(parsed.weather || {}) },
      lunar: { ...DEFAULT_CONFIG.lunar, ...(prefs.lunar || {}), ...(parsed.lunar || {}) },
      finance: { ...DEFAULT_CONFIG.finance, ...(prefs.finance || {}), ...(parsed.finance || {}) },
      lottery: { ...DEFAULT_CONFIG.lottery, ...(prefs.lottery || {}), ...(parsed.lottery || {}) },
      lucky: { ...DEFAULT_CONFIG.lucky, ...(prefs.lucky || {}), ...(parsed.lucky || {}) },
      crypto: { ...DEFAULT_CONFIG.crypto, ...(prefs.crypto || {}), ...(parsed.crypto || {}) },
      news: { ...DEFAULT_CONFIG.news, ...(prefs.news || {}), ...(parsed.news || {}) },
      telegramBotToken: parsed.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '',
      telegramChatId: parsed.telegramChatId || process.env.TELEGRAM_CHAT_ID || ''
    };
  } catch (err) {
    console.error('Error loading config.json, using default:', err);
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: AppConfig): AppConfig {
  ensureDataDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');

  const { telegramBotToken, telegramChatId, ...safePrefs } = config;
  fs.writeFileSync(PREFS_FILE, JSON.stringify(safePrefs, null, 2), 'utf-8');

  return config;
}

export function loadHistory(): HistoryEntry[] {
  ensureDataDir();
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry {
  ensureDataDir();
  const list = loadHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString()
  };
  const updated = [newEntry, ...list].slice(0, 50);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return newEntry;
}
