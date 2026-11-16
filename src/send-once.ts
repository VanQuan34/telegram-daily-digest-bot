import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { CITY_PRESETS, loadConfig } from './config';
import { buildFullDigest } from './services/digest';
import { sendTelegramMessage } from './services/telegram';

dotenv.config();

process.env.TZ = process.env.TZ || 'Asia/Ho_Chi_Minh';

async function main() {
  const currentHour = new Date().getHours();
  const edition: 'morning' | 'evening' =
    process.env.DIGEST_EDITION === 'evening' || currentHour >= 18 ? 'evening' : 'morning';

  console.log(`🚀 Bắt đầu tổng hợp Bản Tin (${edition === 'evening' ? 'Buổi Tối' : 'Buổi Sáng'})...`);

  const config = loadConfig();

  const botToken = (process.env.TELEGRAM_BOT_TOKEN || config.telegramBotToken || '').trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID || config.telegramChatId || '').trim();

  if (process.env.WEATHER_CITY_ID) {
    const preset = CITY_PRESETS.find(
      (c) => c.id.toLowerCase() === process.env.WEATHER_CITY_ID?.trim().toLowerCase()
    );
    if (preset) {
      config.weather.cityName = preset.name;
      config.weather.lat = preset.lat;
      config.weather.lon = preset.lon;
    }
  }

  if (process.env.LUCKY_USER_NAME) {
    config.lucky.userName = process.env.LUCKY_USER_NAME.trim();
  }

  if (process.env.LUCKY_BIRTH_DATE) {
    config.lucky.birthDate = process.env.LUCKY_BIRTH_DATE.trim();
  }

  const digest = await buildFullDigest(config, edition);

  // Xuất file snapshot JSON tĩnh vào public/latest-digest.json để GitHub Pages có sẵn dữ liệu mới nhất
  try {
    const publicSnapshotPath = path.join(process.cwd(), 'public', 'latest-digest.json');
    fs.writeFileSync(publicSnapshotPath, JSON.stringify({ ok: true, digest }, null, 2), 'utf-8');
  } catch {
    // ignore
  }

  if (process.env.BUILD_STATIC_ONLY === 'true') {
    console.log('✅ Đã tạo xong dữ liệu tĩnh cho GitHub Pages (public/latest-digest.json).');
    process.exit(0);
  }

  if (!botToken || !chatId) {
    console.error('❌ LỖI: Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID.');
    process.exit(1);
  }

  console.log('📦 Đã tổng hợp xong dữ liệu. Đang gửi tới Telegram Chat ID:', chatId);
  const result = await sendTelegramMessage(botToken, chatId, digest.telegramHtml);

  if (!result.ok) {
    console.error('❌ Gửi thông báo thất bại:', result.error);
    process.exit(1);
  }

  console.log(`✅ Đã đẩy bản tin qua Telegram thành công (${result.sentCount || 1} người nhận)!`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Lỗi không mong đợi:', err);
  process.exit(1);
});
