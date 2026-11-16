import cron, { ScheduledTask } from 'node-cron';
import { addHistoryEntry, loadConfig, saveConfig } from '../config';
import { buildFullDigest, buildSingleSectionTelegram } from './digest';

let morningTask: ScheduledTask | null = null;
let eveningTask: ScheduledTask | null = null;
let pollingTimer: NodeJS.Timeout | null = null;
let lastUpdateId = 0;
let isPollingRequestActive = false;

export function parseChatIds(chatIdRaw: string): string[] {
  return chatIdRaw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function sendTelegramMessage(
  botToken: string,
  chatIdRaw: string,
  htmlText: string
): Promise<{ ok: boolean; error?: string; sentCount?: number }> {
  const chatIds = parseChatIds(chatIdRaw);
  if (!botToken || chatIds.length === 0) {
    return {
      ok: false,
      error: 'Thiếu Telegram Bot Token hoặc Chat ID. Vui lòng cấu hình trên Dashboard.'
    };
  }

  let successCount = 0;
  let lastError = '';

  for (const chatId of chatIds) {
    try {
      const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: htmlText,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }),
        signal: AbortSignal.timeout(10000)
      });

      const data: any = await res.json();
      if (!res.ok || !data.ok) {
        lastError = data.description || `Lỗi Telegram HTTP ${res.status} (Chat ID: ${chatId})`;
      } else {
        successCount++;
      }
    } catch (err: any) {
      lastError = err?.message || `Không thể kết nối tới máy chủ Telegram (Chat ID: ${chatId})`;
    }
  }

  if (successCount > 0) {
    return { ok: true, sentCount: successCount };
  }
  return { ok: false, error: lastError };
}

export async function verifyTelegramBot(botToken: string): Promise<{
  ok: boolean;
  botName?: string;
  username?: string;
  error?: string;
}> {
  if (!botToken.trim()) {
    return { ok: false, error: 'Vui lòng nhập Bot Token' };
  }
  try {
    const url = `https://api.telegram.org/bot${botToken.trim()}/getMe`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data: any = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description || 'Token không hợp lệ' };
    }
    return {
      ok: true,
      botName: data.result.first_name,
      username: data.result.username
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Không thể kết nối Telegram API' };
  }
}

export async function detectRecentChatIds(botToken: string): Promise<{
  ok: boolean;
  chats: Array<{ id: string; title: string; type: string }>;
  error?: string;
}> {
  if (!botToken.trim()) {
    return { ok: false, chats: [], error: 'Vui lòng nhập Bot Token trước' };
  }
  try {
    const url = `https://api.telegram.org/bot${botToken.trim()}/getUpdates?limit=20`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data: any = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, chats: [], error: data.description || 'Không lấy được danh sách chat' };
    }

    const map = new Map<string, { id: string; title: string; type: string }>();
    for (const upd of data.result || []) {
      const msg = upd.message || upd.channel_post || upd.my_chat_member;
      const chat = msg?.chat;
      if (chat && chat.id) {
        const idStr = String(chat.id);
        const title =
          chat.title ||
          [chat.first_name, chat.last_name].filter(Boolean).join(' ') ||
          chat.username ||
          idStr;
        map.set(idStr, {
          id: idStr,
          title: `${title} (${chat.type})`,
          type: chat.type
        });
      }
    }

    return {
      ok: true,
      chats: Array.from(map.values())
    };
  } catch (err: any) {
    return { ok: false, chats: [], error: err?.message || 'Lỗi kết nối Telegram' };
  }
}

export function restartScheduler(): void {
  if (morningTask) {
    morningTask.stop();
    morningTask = null;
  }
  if (eveningTask) {
    eveningTask.stop();
    eveningTask = null;
  }

  const config = loadConfig();

  if (config.scheduleEnabled && config.scheduleTime) {
    const [hourStr, minuteStr] = config.scheduleTime.split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (!isNaN(hour) && !isNaN(minute)) {
      morningTask = cron.schedule(
        `${minute} ${hour} * * *`,
        async () => {
          const latestConfig = loadConfig();
          if (!latestConfig.telegramBotToken || !latestConfig.telegramChatId) return;
          const digest = await buildFullDigest(latestConfig, 'morning');
          const res = await sendTelegramMessage(
            latestConfig.telegramBotToken,
            latestConfig.telegramChatId,
            digest.telegramHtml
          );
          addHistoryEntry({
            type: 'scheduled',
            section: 'all',
            chatId: latestConfig.telegramChatId,
            success: res.ok,
            error: res.error,
            previewSnippet: `Bản tin Sáng định kỳ (${latestConfig.scheduleTime})`
          });
        },
        { timezone: config.timezone || 'Asia/Ho_Chi_Minh' }
      );
      console.log(`✅ Đã đặt lịch Bản tin Sáng lúc ${config.scheduleTime}`);
    }
  }

  if (config.eveningScheduleEnabled && config.eveningScheduleTime) {
    const [hourStr, minuteStr] = config.eveningScheduleTime.split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (!isNaN(hour) && !isNaN(minute)) {
      eveningTask = cron.schedule(
        `${minute} ${hour} * * *`,
        async () => {
          const latestConfig = loadConfig();
          if (!latestConfig.telegramBotToken || !latestConfig.telegramChatId) return;
          const digest = await buildFullDigest(latestConfig, 'evening');
          const res = await sendTelegramMessage(
            latestConfig.telegramBotToken,
            latestConfig.telegramChatId,
            digest.telegramHtml
          );
          addHistoryEntry({
            type: 'scheduled',
            section: 'all',
            chatId: latestConfig.telegramChatId,
            success: res.ok,
            error: res.error,
            previewSnippet: `Bản tin Tối định kỳ (${latestConfig.eveningScheduleTime})`
          });
        },
        { timezone: config.timezone || 'Asia/Ho_Chi_Minh' }
      );
      console.log(`✅ Đã đặt lịch Bản tin Tối lúc ${config.eveningScheduleTime}`);
    }
  }
}

async function pollBotUpdatesOnce() {
  if (isPollingRequestActive) return;
  const config = loadConfig();
  if (!config.enableInteractiveBot || !config.telegramBotToken.trim()) {
    return;
  }

  isPollingRequestActive = true;
  try {
    const offsetParam = lastUpdateId > 0 ? `&offset=${lastUpdateId + 1}` : '';
    const url = `https://api.telegram.org/bot${config.telegramBotToken.trim()}/getUpdates?timeout=2${offsetParam}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return;
    const data: any = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return;

    for (const upd of data.result) {
      if (upd.update_id > lastUpdateId) {
        lastUpdateId = upd.update_id;
      }

      const msg = upd.message;
      if (!msg || !msg.text || !msg.chat?.id) continue;

      const chatId = String(msg.chat.id);
      const text = String(msg.text).trim().toLowerCase();

      if (!config.telegramChatId) {
        config.telegramChatId = chatId;
        saveConfig(config);
      }

      if (text.startsWith('/start') || text.startsWith('/help')) {
        const welcomeHtml = [
          `👋 <b>Xin chào! Tôi là Trợ lý Bản Tin Hàng Ngày của bạn.</b>`,
          `🆔 Chat ID của bạn là: <code>${chatId}</code>`,
          `🌐 <b>Dashboard Online / Mini App:</b> <a href="https://vanquan34.github.io/telegram-daily-digest-bot/">Mở Bảng Điều Khiển</a>`,
          ``,
          `📌 <b>Các lệnh tra cứu nhanh:</b>`,
          `• /all hoặc /bantin — Nhận toàn bộ bản tin tổng hợp`,
          `• /licham — Xem Lịch Âm Dương, Giờ hoàng đạo & Hướng xuất hành`,
          `• /giavang — Xem Giá Vàng SJC, Nhẫn 9999, Tỷ giá & Giá Xăng`,
          `• /thoitiet — Xem Thời tiết & Chỉ số Bụi mịn AQI (${config.weather.cityName})`,
          `• /xoso — Kết quả Xổ số miền Bắc`,
          `• /mayman — Con số may mắn & tử vi hôm nay`,
          `• /btc — Giá Bitcoin, ETH, SOL & Fear/Greed Index`,
          `• /tintuc — Tin tức thế giới nổi bật mới nhất`
        ].join('\n');
        await sendTelegramMessage(config.telegramBotToken, chatId, welcomeHtml);
      } else if (text.startsWith('/all') || text.startsWith('/bantin')) {
        const digest = await buildFullDigest(config);
        const r = await sendTelegramMessage(config.telegramBotToken, chatId, digest.telegramHtml);
        addHistoryEntry({
          type: 'command',
          section: 'all',
          chatId,
          success: r.ok,
          error: r.error,
          previewSnippet: 'Lệnh /all từ Telegram'
        });
      } else if (text.startsWith('/licham')) {
        const html = await buildSingleSectionTelegram('lunar', config);
        await sendTelegramMessage(config.telegramBotToken, chatId, html);
      } else if (text.startsWith('/giavang') || text.startsWith('/tygia') || text.startsWith('/xang')) {
        const html = await buildSingleSectionTelegram('finance', config);
        await sendTelegramMessage(config.telegramBotToken, chatId, html);
      } else if (text.startsWith('/thoitiet')) {
        const html = await buildSingleSectionTelegram('weather', config);
        await sendTelegramMessage(config.telegramBotToken, chatId, html);
      } else if (text.startsWith('/xoso')) {
        const html = await buildSingleSectionTelegram('lottery', config);
        await sendTelegramMessage(config.telegramBotToken, chatId, html);
      } else if (text.startsWith('/mayman')) {
        const html = await buildSingleSectionTelegram('lucky', config);
        await sendTelegramMessage(config.telegramBotToken, chatId, html);
      } else if (text.startsWith('/btc') || text.startsWith('/crypto')) {
        const html = await buildSingleSectionTelegram('crypto', config);
        await sendTelegramMessage(config.telegramBotToken, chatId, html);
      } else if (text.startsWith('/tintuc') || text.startsWith('/news')) {
        const html = await buildSingleSectionTelegram('news', config);
        await sendTelegramMessage(config.telegramBotToken, chatId, html);
      }
    }
  } catch {
    // Ignore transient network errors
  } finally {
    isPollingRequestActive = false;
  }
}

export function startBotPolling(): void {
  if (pollingTimer) {
    clearInterval(pollingTimer);
  }
  pollingTimer = setInterval(pollBotUpdatesOnce, 4500);
}
