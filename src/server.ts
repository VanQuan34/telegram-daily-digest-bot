import express from 'express';
import cors from 'cors';
import path from 'path';
import {
  addHistoryEntry,
  CITY_PRESETS,
  loadConfig,
  loadHistory,
  saveConfig
} from './config';
import { buildFullDigest, buildSingleSectionTelegram } from './services/digest';
import {
  detectRecentChatIds,
  restartScheduler,
  sendTelegramMessage,
  startBotPolling,
  verifyTelegramBot
} from './services/telegram';
import { searchCityCoordinates } from './services/weather';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Get current config & presets
app.get('/api/config', (_req, res) => {
  const config = loadConfig();
  res.json({
    config,
    cityPresets: CITY_PRESETS
  });
});

// Save config & update scheduler
app.post('/api/config', (req, res) => {
  try {
    const current = loadConfig();
    const updated = saveConfig({
      ...current,
      ...req.body,
      weather: { ...current.weather, ...(req.body.weather || {}) },
      lottery: { ...current.lottery, ...(req.body.lottery || {}) },
      lucky: { ...current.lucky, ...(req.body.lucky || {}) },
      crypto: { ...current.crypto, ...(req.body.crypto || {}) },
      news: { ...current.news, ...(req.body.news || {}) }
    });
    restartScheduler();
    res.json({ ok: true, config: updated });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err?.message || 'Lỗi lưu cấu hình' });
  }
});

// Search city coordinates for Weather
app.get('/api/cities/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    res.json({ results: [] });
    return;
  }
  const results = await searchCityCoordinates(q);
  res.json({ results });
});

// Live preview of full digest
app.get('/api/preview', async (_req, res) => {
  try {
    const config = loadConfig();
    const digest = await buildFullDigest(config);
    res.json({ ok: true, digest });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Không thể tải bản tin xem trước' });
  }
});

// Verify Telegram Bot Token
app.post('/api/telegram/verify', async (req, res) => {
  const token = String(req.body.botToken || loadConfig().telegramBotToken || '');
  const result = await verifyTelegramBot(token);
  res.json(result);
});

// Auto-detect Chat IDs from recent messages sent to Bot
app.post('/api/telegram/detect-chats', async (req, res) => {
  const token = String(req.body.botToken || loadConfig().telegramBotToken || '');
  const result = await detectRecentChatIds(token);
  res.json(result);
});

// Send full digest or single section to Telegram immediately
app.post('/api/send', async (req, res) => {
  try {
    const config = loadConfig();
    const botToken = String(req.body.botToken || config.telegramBotToken || '').trim();
    const chatId = String(req.body.chatId || config.telegramChatId || '').trim();
    const section = String(req.body.section || 'all');

    let htmlToSend = '';
    let label = 'Toàn bộ bản tin tổng hợp';

    if (section === 'all') {
      const digest = await buildFullDigest(config);
      htmlToSend = digest.telegramHtml;
    } else if (['weather', 'lottery', 'lucky', 'crypto', 'news'].includes(section)) {
      htmlToSend = await buildSingleSectionTelegram(section as any, config);
      const mapName: Record<string, string> = {
        weather: 'Thời tiết hôm nay',
        lottery: 'Xổ số miền Bắc',
        lucky: 'Con số may mắn',
        crypto: 'Giá Bitcoin & Crypto',
        news: 'Tin tức thế giới'
      };
      label = `Chuyên mục: ${mapName[section]}`;
    } else if (section === 'custom' && req.body.customText) {
      htmlToSend = String(req.body.customText);
      label = 'Tin nhắn tùy chỉnh';
    } else {
      res.status(400).json({ ok: false, error: 'Chuyên mục không hợp lệ' });
      return;
    }

    const sendRes = await sendTelegramMessage(botToken, chatId, htmlToSend);
    const historyItem = addHistoryEntry({
      type: section === 'all' ? 'manual' : 'single',
      section,
      chatId: chatId || '(Chưa nhập)',
      success: sendRes.ok,
      error: sendRes.error,
      previewSnippet: label
    });

    res.json({
      ok: sendRes.ok,
      error: sendRes.error,
      historyItem
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Lỗi khi gửi tin nhắn Telegram' });
  }
});

// Get notification history
app.get('/api/history', (_req, res) => {
  res.json({ history: loadHistory() });
});

app.listen(PORT, () => {
  console.log(`🚀 Telegram Daily Digest App đang chạy tại: http://localhost:${PORT}`);
  restartScheduler();
  startBotPolling();
});
