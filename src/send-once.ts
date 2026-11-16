import dotenv from 'dotenv';
import { CITY_PRESETS, loadConfig } from './config';
import { buildFullDigest } from './services/digest';
import { sendTelegramMessage } from './services/telegram';

dotenv.config();

// Đảm bảo múi giờ Việt Nam khi chạy trên máy chủ GitHub Actions (mặc định là UTC)
process.env.TZ = process.env.TZ || 'Asia/Ho_Chi_Minh';

async function main() {
  console.log('🚀 Bắt đầu tổng hợp Bản Tin Hàng Ngày (Chế độ chạy 1 lần / GitHub Actions)...');

  const config = loadConfig();

  // Ưu tiên lấy từ biến môi trường (GitHub Secrets / Variables)
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || config.telegramBotToken || '').trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID || config.telegramChatId || '').trim();

  if (!botToken || !chatId) {
    console.error(
      '❌ LỖI: Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID.\n' +
        '👉 Nếu chạy trên GitHub Actions, hãy vào Settings -> Secrets and variables -> Actions để thêm 2 biến này.'
    );
    process.exit(1);
  }

  // Cho phép tuỳ chỉnh nhanh qua biến môi trường trên GitHub nếu muốn
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

  const digest = await buildFullDigest(config);
  console.log('📦 Đã tổng hợp xong dữ liệu. Đang gửi tới Telegram Chat ID:', chatId);

  const result = await sendTelegramMessage(botToken, chatId, digest.telegramHtml);

  if (!result.ok) {
    console.error('❌ Gửi thông báo thất bại:', result.error);
    process.exit(1);
  }

  console.log('✅ Đã đẩy bản tin tổng hợp qua Telegram thành công!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Lỗi không mong đợi:', err);
  process.exit(1);
});
