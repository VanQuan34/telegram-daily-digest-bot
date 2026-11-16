export interface CityPreset {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface AppConfig {
  telegramBotToken: string;
  telegramChatId: string; // Hỗ trợ 1 hoặc nhiều Chat ID cách nhau bằng dấu phẩy (ví dụ: "5134773769, -100987654")
  enableInteractiveBot: boolean;
  scheduleEnabled: boolean;
  scheduleTime: string; // e.g. "07:00"
  eveningScheduleEnabled: boolean;
  eveningScheduleTime: string; // e.g. "21:00"
  timezone: string; // e.g. "Asia/Ho_Chi_Minh"
  weather: {
    enabled: boolean;
    cityName: string;
    lat: number;
    lon: number;
  };
  lunar: {
    enabled: boolean;
  };
  finance: {
    enabled: boolean;
  };
  lottery: {
    enabled: boolean;
  };
  lucky: {
    enabled: boolean;
    mode: 'personalized' | 'random';
    userName: string;
    birthDate: string; // YYYY-MM-DD
  };
  crypto: {
    enabled: boolean;
    coins: string[]; // e.g. ['BTC', 'ETH', 'SOL', 'BNB']
  };
  news: {
    enabled: boolean;
    rssUrl: string;
    maxItems: number;
  };
  customHeader: string;
  customFooter: string;
}

export interface AirQualityData {
  aqi: number;
  pm25: number;
  pm10: number;
  level: string;
  badge: string;
  advice: string;
}

export interface WeatherData {
  cityName: string;
  currentTemp: number;
  feelsLike: number;
  minTemp: number;
  maxTemp: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  uvIndex: number;
  weatherCode: number;
  description: string;
  icon: string;
  advice: string;
  airQuality?: AirQualityData;
  updatedAt: string;
}

export interface LunarEventCountdown {
  name: string;
  dateStr: string;
  daysLeft: number;
}

export interface LunarCalendarData {
  solarDate: string;
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  isLeapMonth: boolean;
  lunarDateFormatted: string;
  canChiDay: string;
  canChiMonth: string;
  canChiYear: string;
  tietKhi: string;
  auspiciousDirection: {
    hyThan: string;
    taiThan: string;
  };
  auspiciousHours: string;
  nextMoonNote: string;
  upcomingEvents: LunarEventCountdown[];
}

export interface GoldItem {
  name: string;
  buyVnd: string; // triệu đồng/lượng
  sellVnd: string;
  note?: string;
}

export interface ForexItem {
  code: string;
  name: string;
  rateVnd: number;
}

export interface FuelItem {
  name: string;
  priceVnd: number;
  unit: string;
}

export interface VietnamFinanceData {
  gold: GoldItem[];
  worldGoldUsdOz: number;
  forex: ForexItem[];
  fuel: FuelItem[];
  updatedAt: string;
}

export interface LotteryData {
  date: string;
  specialPrize: string;
  firstPrize: string;
  secondPrizes: string[];
  thirdPrizes: string[];
  fourthPrizes: string[];
  fifthPrizes: string[];
  sixthPrizes: string[];
  seventhPrizes: string[];
  twoDigitNumbers: string[];
  source: string;
}

export interface LuckyData {
  date: string;
  canChiDay: string;
  luckyNumber2D: string;
  luckyNumber3D: string;
  luckyPair: string[];
  luckyColor: string;
  auspiciousHours: string;
  quote: string;
  fortuneScore: number; // 1-100
  mode: 'personalized' | 'random';
  forPerson: string;
}

export interface CoinPrice {
  symbol: string;
  name: string;
  priceUsd: number;
  priceVnd: number;
  change24h: number;
  high24h: number;
  low24h: number;
}

export interface CryptoData {
  coins: CoinPrice[];
  usdToVnd: number;
  fearAndGreed?: {
    value: number;
    classification: string;
  };
  updatedAt: string;
}

export interface NewsItem {
  title: string;
  link: string;
  summary: string;
  pubDate: string;
  source: string;
}

export interface NewsData {
  sourceTitle: string;
  items: NewsItem[];
  updatedAt: string;
}

export interface DigestPayload {
  edition: 'morning' | 'evening';
  generatedAt: string;
  weather?: WeatherData;
  lunar?: LunarCalendarData;
  finance?: VietnamFinanceData;
  lottery?: LotteryData;
  lucky?: LuckyData;
  crypto?: CryptoData;
  news?: NewsData;
  telegramHtml: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  type: 'scheduled' | 'manual' | 'command' | 'single';
  section?: string;
  chatId: string;
  success: boolean;
  error?: string;
  previewSnippet: string;
}
