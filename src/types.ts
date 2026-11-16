export interface CityPreset {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface AppConfig {
  telegramBotToken: string;
  telegramChatId: string;
  enableInteractiveBot: boolean;
  scheduleEnabled: boolean;
  scheduleTime: string; // e.g. "07:30"
  timezone: string; // e.g. "Asia/Ho_Chi_Minh"
  weather: {
    enabled: boolean;
    cityName: string;
    lat: number;
    lon: number;
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
  generatedAt: string;
  weather?: WeatherData;
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
