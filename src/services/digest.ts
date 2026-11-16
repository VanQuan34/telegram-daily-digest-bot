import { AppConfig, DigestPayload } from '../types';
import { fetchWeather, formatWeatherTelegram } from './weather';
import { getLunarCalendarData, formatLunarTelegram } from './lunar';
import { fetchVietnamFinance, formatFinanceTelegram } from './finance';
import { fetchLotteryXSMB, formatLotteryTelegram } from './lottery';
import { generateLuckyData, formatLuckyTelegram } from './lucky';
import { fetchCryptoData, formatCryptoTelegram } from './crypto';
import { fetchWorldNews, formatNewsTelegram } from './news';

export async function buildFullDigest(
  config: AppConfig,
  edition: 'morning' | 'evening' = 'morning'
): Promise<DigestPayload> {
  const nowStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const [weather, finance, lottery, crypto, news] = await Promise.all([
    config.weather.enabled
      ? fetchWeather(config.weather.cityName, config.weather.lat, config.weather.lon)
      : Promise.resolve(undefined),
    config.finance?.enabled !== false ? fetchVietnamFinance() : Promise.resolve(undefined),
    config.lottery.enabled ? fetchLotteryXSMB() : Promise.resolve(undefined),
    config.crypto.enabled ? fetchCryptoData(config.crypto.coins) : Promise.resolve(undefined),
    config.news.enabled
      ? fetchWorldNews(config.news.rssUrl, config.news.maxItems)
      : Promise.resolve(undefined)
  ]);

  const lunar = config.lunar?.enabled !== false ? getLunarCalendarData(new Date()) : undefined;

  const lucky = config.lucky.enabled
    ? generateLuckyData({
        mode: config.lucky.mode,
        userName: config.lucky.userName,
        birthDate: config.lucky.birthDate
      })
    : undefined;

  const sections: string[] = [];

  const header =
    edition === 'evening'
      ? '🌙 <b>BẢN TIN TỔNG KẾT BUỔI TỐI</b>'
      : config.customHeader || '🌅 <b>BẢN TIN TỔNG HỢP HÔM NAY</b>';
  sections.push(`${header}\n📅 <i>${nowStr}</i>`);

  if (lunar) {
    sections.push(formatLunarTelegram(lunar));
  }

  if (weather) {
    sections.push(formatWeatherTelegram(weather));
  }

  if (lucky) {
    sections.push(formatLuckyTelegram(lucky));
  }

  if (finance) {
    sections.push(formatFinanceTelegram(finance));
  }

  if (lottery) {
    sections.push(formatLotteryTelegram(lottery));
  }

  if (crypto) {
    sections.push(formatCryptoTelegram(crypto));
  }

  if (news) {
    sections.push(formatNewsTelegram(news));
  }

  const footer =
    edition === 'evening'
      ? '🌙 <i>Chúc bạn và gia đình một buổi tối thư giãn và ngủ ngon!</i>'
      : config.customFooter;

  if (footer) {
    sections.push(footer);
  }

  const divider = '\n━━━━━━━━━━━━━━━━━━━━\n';
  const telegramHtml = sections.join(divider);

  return {
    edition,
    generatedAt: new Date().toISOString(),
    weather,
    lunar,
    finance,
    lottery,
    lucky,
    crypto,
    news,
    telegramHtml
  };
}

export async function buildSingleSectionTelegram(
  section: 'weather' | 'lunar' | 'finance' | 'lottery' | 'lucky' | 'crypto' | 'news',
  config: AppConfig
): Promise<string> {
  switch (section) {
    case 'weather': {
      const w = await fetchWeather(config.weather.cityName, config.weather.lat, config.weather.lon);
      return formatWeatherTelegram(w);
    }
    case 'lunar': {
      const ln = getLunarCalendarData(new Date());
      return formatLunarTelegram(ln);
    }
    case 'finance': {
      const fn = await fetchVietnamFinance();
      return formatFinanceTelegram(fn);
    }
    case 'lottery': {
      const l = await fetchLotteryXSMB();
      return formatLotteryTelegram(l);
    }
    case 'lucky': {
      const lk = generateLuckyData({
        mode: config.lucky.mode,
        userName: config.lucky.userName,
        birthDate: config.lucky.birthDate
      });
      return formatLuckyTelegram(lk);
    }
    case 'crypto': {
      const c = await fetchCryptoData(config.crypto.coins);
      return formatCryptoTelegram(c);
    }
    case 'news': {
      const n = await fetchWorldNews(config.news.rssUrl, config.news.maxItems);
      return formatNewsTelegram(n);
    }
  }
}
