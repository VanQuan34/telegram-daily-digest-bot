let currentConfig = null;
let cityPresets = [];
let latestDigest = null;

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  const colors = {
    success: 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200',
    error: 'bg-rose-950/95 border-rose-500/50 text-rose-200',
    info: 'bg-slate-900/95 border-sky-500/50 text-sky-200'
  };
  el.className = `px-4 py-3 rounded-xl border shadow-xl text-xs font-medium transition-all duration-300 ${
    colors[type] || colors.info
  }`;
  el.innerHTML = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 4500);
}

function toggleTokenVisibility() {
  const input = document.getElementById('inputBotToken');
  input.type = input.type === 'password' ? 'text' : 'password';
}

async function initApp() {
  await loadConfigFromServer();
  await Promise.all([loadPreview(false), loadHistory()]);
}

async function loadConfigFromServer() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    currentConfig = data.config;
    cityPresets = data.cityPresets || [];

    // Populate City Select
    const citySelect = document.getElementById('selectCityPreset');
    citySelect.innerHTML = cityPresets
      .map(
        (c) =>
          `<option value="${c.id}" ${
            c.name === currentConfig.weather.cityName ? 'selected' : ''
          }>${c.name}</option>`
      )
      .join('');

    // Fill inputs
    document.getElementById('inputBotToken').value = currentConfig.telegramBotToken || '';
    document.getElementById('inputChatId').value = currentConfig.telegramChatId || '';
    document.getElementById('inputScheduleTime').value = currentConfig.scheduleTime || '07:30';
    document.getElementById('chkScheduleEnabled').checked = !!currentConfig.scheduleEnabled;
    document.getElementById('chkInteractiveBot').checked = !!currentConfig.enableInteractiveBot;

    document.getElementById('chkWeather').checked = !!currentConfig.weather.enabled;
    document.getElementById('chkLottery').checked = !!currentConfig.lottery.enabled;
    document.getElementById('chkLucky').checked = !!currentConfig.lucky.enabled;
    document.getElementById('chkCrypto').checked = !!currentConfig.crypto.enabled;
    document.getElementById('chkNews').checked = !!currentConfig.news.enabled;

    document.getElementById('selectLuckyMode').value = currentConfig.lucky.mode || 'personalized';
    document.getElementById('inputUserName').value = currentConfig.lucky.userName || 'Bạn';
    document.getElementById('inputBirthDate').value = currentConfig.lucky.birthDate || '1998-08-18';

    updateScheduleBadge();
  } catch (err) {
    showToast('Không thể tải cấu hình từ server', 'error');
  }
}

function updateScheduleBadge() {
  const badge = document.getElementById('scheduleBadge');
  if (!currentConfig) return;
  if (currentConfig.scheduleEnabled) {
    badge.className =
      'text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    badge.textContent = `⏰ Hẹn giờ: ${currentConfig.scheduleTime} hàng ngày`;
  } else {
    badge.className =
      'text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700';
    badge.textContent = '⏸️ Đang tắt hẹn giờ';
  }
}

function onCityPresetChange() {
  const selectedId = document.getElementById('selectCityPreset').value;
  const found = cityPresets.find((c) => c.id === selectedId);
  if (found && currentConfig) {
    currentConfig.weather.cityName = found.name;
    currentConfig.weather.lat = found.lat;
    currentConfig.weather.lon = found.lon;
  }
}

function collectConfigFromForm() {
  const selectedId = document.getElementById('selectCityPreset').value;
  const foundCity = cityPresets.find((c) => c.id === selectedId) || cityPresets[0];

  return {
    telegramBotToken: document.getElementById('inputBotToken').value.trim(),
    telegramChatId: document.getElementById('inputChatId').value.trim(),
    scheduleTime: document.getElementById('inputScheduleTime').value || '07:30',
    scheduleEnabled: document.getElementById('chkScheduleEnabled').checked,
    enableInteractiveBot: document.getElementById('chkInteractiveBot').checked,
    weather: {
      enabled: document.getElementById('chkWeather').checked,
      cityName: foundCity ? foundCity.name : 'Hà Nội',
      lat: foundCity ? foundCity.lat : 21.0285,
      lon: foundCity ? foundCity.lon : 105.8542
    },
    lottery: {
      enabled: document.getElementById('chkLottery').checked
    },
    lucky: {
      enabled: document.getElementById('chkLucky').checked,
      mode: document.getElementById('selectLuckyMode').value,
      userName: document.getElementById('inputUserName').value.trim() || 'Bạn',
      birthDate: document.getElementById('inputBirthDate').value || '1998-08-18'
    },
    crypto: {
      enabled: document.getElementById('chkCrypto').checked,
      coins: ['BTC', 'ETH', 'SOL', 'BNB']
    },
    news: {
      enabled: document.getElementById('chkNews').checked,
      rssUrl: 'https://vnexpress.net/rss/the-gioi.rss',
      maxItems: 5
    }
  };
}

async function saveConfiguration() {
  const payload = collectConfigFromForm();
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.ok) {
      currentConfig = data.config;
      updateScheduleBadge();
      showToast('✅ Đã lưu cấu hình và cập nhật bản tin!', 'success');
      await loadPreview(false);
    } else {
      showToast(`❌ Lỗi: ${data.error}`, 'error');
    }
  } catch (err) {
    showToast('❌ Không thể lưu cấu hình', 'error');
  }
}

async function verifyBotToken() {
  const botToken = document.getElementById('inputBotToken').value.trim();
  const pill = document.getElementById('botStatusPill');
  pill.textContent = 'Đang kiểm tra...';
  try {
    const res = await fetch('/api/telegram/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botToken })
    });
    const data = await res.json();
    if (data.ok) {
      pill.className =
        'text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      pill.textContent = `🟢 @${data.username} (${data.botName})`;
      showToast(`✅ Kết nối thành công với Bot <b>@${data.username}</b>!`, 'success');
    } else {
      pill.className =
        'text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30';
      pill.textContent = '🔴 Token lỗi';
      showToast(`❌ ${data.error}`, 'error');
    }
  } catch {
    showToast('❌ Không thể kiểm tra Bot Token', 'error');
  }
}

async function detectChatId() {
  const botToken = document.getElementById('inputBotToken').value.trim();
  const box = document.getElementById('detectedChatsBox');
  box.classList.remove('hidden');
  box.innerHTML = `<span class="text-slate-400">Đang tìm tin nhắn gửi tới Bot...</span>`;

  try {
    const res = await fetch('/api/telegram/detect-chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botToken })
    });
    const data = await res.json();
    if (!data.ok) {
      box.innerHTML = `<span class="text-rose-400">❌ ${data.error}</span>`;
      return;
    }
    if (!data.chats || data.chats.length === 0) {
      box.innerHTML = `<span class="text-amber-300">⚠️ Chưa thấy cuộc trò chuyện nào. Hãy mở Telegram, tìm Bot của bạn và bấm <b>/start</b> rồi thử lại!</span>`;
      return;
    }

    // Auto-select first chat ID
    document.getElementById('inputChatId').value = data.chats[0].id;
    box.innerHTML =
      `<div class="text-emerald-300 font-medium mb-1">✅ Đã tìm thấy Chat ID (bấm để chọn):</div>` +
      data.chats
        .map(
          (c) =>
            `<button type="button" onclick="selectDetectedChat('${c.id}')" class="mr-2 mb-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-sky-500/20 border border-slate-700 text-slate-200">
              <b>${c.id}</b> — ${c.title}
            </button>`
        )
        .join('');
    showToast(`✅ Đã tự động điền Chat ID: <b>${data.chats[0].id}</b>`, 'success');
  } catch {
    box.innerHTML = `<span class="text-rose-400">❌ Lỗi kết nối khi dò Chat ID</span>`;
  }
}

function selectDetectedChat(id) {
  document.getElementById('inputChatId').value = id;
  showToast(`Đã chọn Chat ID: <b>${id}</b>`, 'info');
}

async function loadPreview(notify = false) {
  const btn = document.getElementById('btnRefreshPreview');
  btn.disabled = true;
  btn.innerHTML = `<span>⏳</span> Đang tải...`;
  try {
    const res = await fetch('/api/preview');
    const data = await res.json();
    if (data.ok && data.digest) {
      latestDigest = data.digest;
      renderDigestCards(data.digest);
      document.getElementById('telegramPreviewBox').innerHTML = data.digest.telegramHtml;
      if (notify) {
        showToast('🔄 Đã làm mới toàn bộ dữ liệu trực tiếp!', 'info');
      }
    }
  } catch (err) {
    showToast('❌ Lỗi khi tải bản tin xem trước', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>🔄</span> Làm mới dữ liệu`;
  }
}

function renderDigestCards(digest) {
  // 1. Weather
  const wEl = document.getElementById('cardWeatherContent');
  if (digest.weather) {
    const w = digest.weather;
    wEl.innerHTML = `
      <div class="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div>
          <div class="text-xs text-slate-400">${w.cityName} • Cập nhật ${w.updatedAt}</div>
          <div class="text-2xl font-extrabold text-white mt-0.5">${w.currentTemp}°C <span class="text-xs font-normal text-slate-400">(Cảm giác ${w.feelsLike}°C)</span></div>
          <div class="text-xs text-sky-300 font-medium mt-0.5">${w.description}</div>
        </div>
        <div class="text-4xl">${w.icon}</div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">🌡️ Thấp/Cao: <b>${w.minTemp}° - ${w.maxTemp}°C</b></div>
        <div class="bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">💧 Độ ẩm: <b>${w.humidity}%</b></div>
        <div class="bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">🌧️ Khả năng mưa: <b>${w.rainProbability}%</b></div>
        <div class="bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">☀️ Chỉ số UV: <b>${w.uvIndex}</b></div>
      </div>
      <p class="text-xs text-slate-300 italic bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-lg">
        💡 ${w.advice}
      </p>
    `;
  } else {
    wEl.innerHTML = `<p class="text-xs text-slate-500">Chuyên mục Thời tiết đang tắt.</p>`;
  }

  // 2. Lucky
  const lkEl = document.getElementById('cardLuckyContent');
  if (digest.lucky) {
    const l = digest.lucky;
    lkEl.innerHTML = `
      <div class="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div>
          <div class="text-xs text-slate-400">${l.forPerson}</div>
          <div class="text-xs text-emerald-300 font-medium mt-0.5">${l.canChiDay} • Vận khí: <b>${l.fortuneScore}/100</b></div>
        </div>
        <div class="text-right">
          <span class="text-[10px] uppercase tracking-wider text-slate-400 block">Số chủ đạo</span>
          <span class="text-3xl font-black text-emerald-400 font-mono">${l.luckyNumber2D}</span>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">💎 Bộ số lộc: <b class="text-amber-300 font-mono">${l.luckyPair.join(' - ')}</b></div>
        <div class="bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">🎯 3 càng: <b class="text-amber-300 font-mono">${l.luckyNumber3D}</b></div>
      </div>
      <div class="text-xs space-y-1 text-slate-300">
        <div>🎨 <b>Màu hợp vận:</b> ${l.luckyColor}</div>
        <div>⏰ <b>Giờ hoàng đạo:</b> ${l.auspiciousHours}</div>
      </div>
      <p class="text-xs text-emerald-200/90 italic bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
        ✨ "${l.quote}"
      </p>
    `;
  } else {
    lkEl.innerHTML = `<p class="text-xs text-slate-500">Chuyên mục Con số may mắn đang tắt.</p>`;
  }

  // 3. Lottery
  const ltEl = document.getElementById('cardLotteryContent');
  if (digest.lottery) {
    const lt = digest.lottery;
    ltEl.innerHTML = `
      <div class="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
        <div>
          <div class="text-xs text-amber-200/80">Kỳ mở thưởng: <b>${lt.date}</b></div>
          <div class="text-xs text-slate-400 mt-0.5">Giải Đặc Biệt XSMB</div>
        </div>
        <div class="text-2xl font-black text-amber-400 tracking-widest font-mono">${lt.specialPrize}</div>
      </div>
      <div class="space-y-1.5 text-xs text-slate-300">
        <div class="flex justify-between py-1 border-b border-slate-800">
          <span class="text-slate-400">🥇 Giải Nhất:</span>
          <b class="font-mono text-white">${lt.firstPrize}</b>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-800">
          <span class="text-slate-400">🥈 Giải Nhì:</span>
          <span class="font-mono">${lt.secondPrizes.join(' - ') || '---'}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-800">
          <span class="text-slate-400">🎯 Giải Bảy:</span>
          <b class="font-mono text-emerald-400">${lt.seventhPrizes.join(' - ') || '---'}</b>
        </div>
        <div class="pt-1">
          <span class="text-slate-400 block mb-1">🔢 Lô tô 2 số:</span>
          <div class="flex flex-wrap gap-1">
            ${Array.from(new Set(lt.twoDigitNumbers))
              .slice(0, 14)
              .map(
                (n) =>
                  `<span class="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px]">${n}</span>`
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  } else {
    ltEl.innerHTML = `<p class="text-xs text-slate-500">Chuyên mục Xổ số đang tắt.</p>`;
  }

  // 4. Crypto
  const crEl = document.getElementById('cardCryptoContent');
  if (digest.crypto) {
    const c = digest.crypto;
    crEl.innerHTML = `
      <div class="space-y-2">
        ${c.coins
          .map((coin) => {
            const up = coin.change24h >= 0;
            const badgeClass = up
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30';
            const sign = up ? '+' : '';
            return `
              <div class="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <div>
                  <span class="font-bold text-white text-xs">${coin.symbol}</span>
                  <span class="text-[11px] text-slate-400 ml-1">${coin.name}</span>
                </div>
                <div class="text-right flex items-center gap-2">
                  <div>
                    <div class="font-bold text-white text-xs">$${coin.priceUsd.toLocaleString('en-US', {
                      maximumFractionDigits: 2
                    })}</div>
                    <div class="text-[10px] text-slate-400">${(coin.priceVnd / 1_000_000).toFixed(1)} tr ₫</div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeClass}">
                    ${sign}${coin.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
      ${
        c.fearAndGreed
          ? `<div class="mt-2 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs flex items-center justify-between">
              <span class="text-slate-300">📊 Tâm lý thị trường (Fear & Greed):</span>
              <b class="text-orange-300">${c.fearAndGreed.value}/100 — ${c.fearAndGreed.classification}</b>
            </div>`
          : ''
      }
    `;
  } else {
    crEl.innerHTML = `<p class="text-xs text-slate-500">Chuyên mục Crypto đang tắt.</p>`;
  }

  // 5. News
  const nwEl = document.getElementById('cardNewsContent');
  if (digest.news && digest.news.items) {
    nwEl.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${digest.news.items
          .map(
            (item, idx) => `
          <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="block bg-slate-900/60 hover:bg-slate-800/80 p-3 rounded-xl border border-slate-800 transition group">
            <div class="text-xs font-semibold text-slate-100 group-hover:text-sky-300 line-clamp-2">
              ${idx + 1}. ${item.title}
            </div>
            ${
              item.summary
                ? `<p class="text-[11px] text-slate-400 mt-1 line-clamp-2">${item.summary}</p>`
                : ''
            }
          </a>
        `
          )
          .join('')}
      </div>
    `;
  } else {
    nwEl.innerHTML = `<p class="text-xs text-slate-500">Chuyên mục Tin tức đang tắt.</p>`;
  }
}

async function sendSection(section) {
  const botToken = document.getElementById('inputBotToken').value.trim();
  const chatId = document.getElementById('inputChatId').value.trim();

  if (!botToken || !chatId) {
    showToast(
      '⚠️ Vui lòng nhập <b>Telegram Bot Token</b> và <b>Chat ID</b> ở bảng cấu hình phía trên trước khi gửi!',
      'error'
    );
    document.getElementById('inputBotToken').focus();
    return;
  }

  // Save current config first so latest settings are used
  await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(collectConfigFromForm())
  });

  showToast('✈️ Đang đẩy thông báo qua Telegram...', 'info');
  try {
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, botToken, chatId })
    });
    const data = await res.json();
    if (data.ok) {
      showToast('🎉 Đã gửi thông báo qua Telegram thành công!', 'success');
      await loadHistory();
    } else {
      showToast(`❌ Gửi thất bại: ${data.error}`, 'error');
      await loadHistory();
    }
  } catch (err) {
    showToast('❌ Lỗi kết nối khi gửi thông báo Telegram', 'error');
  }
}

async function sendCustomMessage() {
  const input = document.getElementById('inputCustomMessage');
  const text = input.value.trim();
  if (!text) {
    showToast('Vui lòng nhập nội dung tin nhắn cần gửi', 'error');
    return;
  }

  const botToken = document.getElementById('inputBotToken').value.trim();
  const chatId = document.getElementById('inputChatId').value.trim();
  if (!botToken || !chatId) {
    showToast('⚠️ Vui lòng nhập Bot Token và Chat ID trước!', 'error');
    return;
  }

  try {
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'custom',
        customText: `📢 <b>THÔNG BÁO NHANH</b>\n\n${text}`,
        botToken,
        chatId
      })
    });
    const data = await res.json();
    if (data.ok) {
      input.value = '';
      showToast('✅ Đã gửi tin nhắn tuỳ chỉnh qua Telegram!', 'success');
      await loadHistory();
    } else {
      showToast(`❌ Gửi thất bại: ${data.error}`, 'error');
    }
  } catch {
    showToast('❌ Lỗi khi gửi tin nhắn', 'error');
  }
}

function copyTelegramPreview() {
  const el = document.getElementById('telegramPreviewBox');
  navigator.clipboard.writeText(el.innerText || '');
  showToast('📋 Đã sao chép nội dung bản tin vào Clipboard!', 'success');
}

async function loadHistory() {
  try {
    const res = await fetch('/api/history');
    const data = await res.json();
    const tbody = document.getElementById('historyTableBody');
    if (!data.history || data.history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-500">Chưa có lịch sử gửi thông báo nào.</td></tr>`;
      return;
    }

    const typeMap = {
      scheduled: '⏰ Hẹn giờ tự động',
      manual: '🚀 Gửi toàn bộ (Web)',
      single: '📌 Gửi mục lẻ (Web)',
      command: '🤖 Lệnh chat Bot'
    };

    tbody.innerHTML = data.history
      .slice(0, 12)
      .map((item) => {
        const timeStr = new Date(item.timestamp).toLocaleString('vi-VN');
        const statusBadge = item.success
          ? `<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Thành công</span>`
          : `<span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300" title="${
              item.error || ''
            }">Lỗi: ${item.error || 'Thất bại'}</span>`;

        return `
          <tr>
            <td class="py-2.5 px-3 text-slate-400 whitespace-nowrap">${timeStr}</td>
            <td class="py-2.5 px-3">${typeMap[item.type] || item.type}</td>
            <td class="py-2.5 px-3 font-medium text-slate-200">${item.previewSnippet}</td>
            <td class="py-2.5 px-3 font-mono text-slate-400">${item.chatId}</td>
            <td class="py-2.5 px-3">${statusBadge}</td>
          </tr>
        `;
      })
      .join('');
  } catch {
    // ignore
  }
}

window.addEventListener('DOMContentLoaded', initApp);
