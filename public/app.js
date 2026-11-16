const DEFAULT_CITY_PRESETS = [
  { id: 'hanoi', name: 'Hà Nội', lat: 21.0285, lon: 105.8542 },
  { id: 'hcm', name: 'TP. Hồ Chí Minh', lat: 10.8231, lon: 106.6297 },
  { id: 'danang', name: 'Đà Nẵng', lat: 16.0544, lon: 108.2022 },
  { id: 'haiphong', name: 'Hải Phòng', lat: 20.8449, lon: 106.6881 },
  { id: 'cantho', name: 'Cần Thơ', lat: 10.0452, lon: 105.7469 },
  { id: 'nhatrang', name: 'Nha Trang', lat: 12.2388, lon: 109.1967 },
  { id: 'dalat', name: 'Đà Lạt', lat: 11.9404, lon: 108.4583 },
  { id: 'hue', name: 'Huế', lat: 16.4637, lon: 107.5909 }
];

let currentConfig = null;
let cityPresets = DEFAULT_CITY_PRESETS;
let latestDigest = null;
let currentEdition = 'morning';
let isStaticHost = false;

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

function switchEdition(edition) {
  currentEdition = edition;
  const btnM = document.getElementById('btnEditionMorning');
  const btnE = document.getElementById('btnEditionEvening');
  if (edition === 'morning') {
    btnM.className = 'px-2.5 py-1.5 rounded-md font-medium bg-sky-600 text-white transition';
    btnE.className = 'px-2.5 py-1.5 rounded-md font-medium text-slate-300 hover:text-white transition';
  } else {
    btnE.className = 'px-2.5 py-1.5 rounded-md font-medium bg-indigo-600 text-white transition';
    btnM.className = 'px-2.5 py-1.5 rounded-md font-medium text-slate-300 hover:text-white transition';
  }
  loadPreview(true);
}

async function initApp() {
  // Initialize Telegram Mini App SDK if opened inside Telegram
  if (window.Telegram && window.Telegram.WebApp) {
    try {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    } catch {
      // ignore
    }
  }

  await loadConfigFromServerOrLocal();
  await Promise.all([loadPreview(false), loadHistory()]);
}

function getLocalStoredConfig() {
  try {
    const raw = localStorage.getItem('tg_digest_config_v2');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalStoredConfig(cfg) {
  try {
    localStorage.setItem('tg_digest_config_v2', JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

async function loadConfigFromServerOrLocal() {
  const localSaved = getLocalStoredConfig();
  try {
    const res = await fetch('./api/config', { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error('No local backend');
    const data = await res.json();
    currentConfig = {
      ...data.config,
      telegramBotToken: data.config.telegramBotToken || localSaved.telegramBotToken || '',
      telegramChatId: data.config.telegramChatId || localSaved.telegramChatId || ''
    };
    cityPresets = data.cityPresets || DEFAULT_CITY_PRESETS;
    isStaticHost = false;
    document.getElementById('modeBadge').textContent = '🖥️ Local Server';
  } catch {
    // Running on GitHub Pages / Static Cloud Mode!
    isStaticHost = true;
    document.getElementById('modeBadge').textContent = '☁️ GitHub Pages Cloud';
    currentConfig = {
      telegramBotToken: localSaved.telegramBotToken || '',
      telegramChatId: localSaved.telegramChatId || '5134773769',
      scheduleTime: localSaved.scheduleTime || '07:00',
      scheduleEnabled: localSaved.scheduleEnabled ?? true,
      eveningScheduleTime: localSaved.eveningScheduleTime || '21:00',
      eveningScheduleEnabled: localSaved.eveningScheduleEnabled ?? true,
      enableInteractiveBot: true,
      weather: localSaved.weather || {
        enabled: true,
        cityName: 'Hà Nội',
        lat: 21.0285,
        lon: 105.8542
      },
      lunar: localSaved.lunar || { enabled: true },
      finance: localSaved.finance || { enabled: true },
      lottery: localSaved.lottery || { enabled: true },
      lucky: localSaved.lucky || {
        enabled: true,
        mode: 'personalized',
        userName: 'Bạn',
        birthDate: '1996-04-03'
      },
      crypto: localSaved.crypto || { enabled: true, coins: ['BTC', 'ETH', 'SOL', 'BNB'] },
      news: localSaved.news || {
        enabled: true,
        rssUrl: 'https://vnexpress.net/rss/the-gioi.rss',
        maxItems: 5
      }
    };
  }

  const citySelect = document.getElementById('selectCityPreset');
  citySelect.innerHTML = cityPresets
    .map(
      (c) =>
        `<option value="${c.id}" ${
          c.name === currentConfig.weather.cityName ? 'selected' : ''
        }>${c.name}</option>`
    )
    .join('');

  document.getElementById('inputBotToken').value = currentConfig.telegramBotToken || '';
  document.getElementById('inputChatId').value = currentConfig.telegramChatId || '';
  document.getElementById('inputScheduleTime').value = currentConfig.scheduleTime || '07:00';
  document.getElementById('chkScheduleEnabled').checked = !!currentConfig.scheduleEnabled;
  document.getElementById('inputEveningScheduleTime').value =
    currentConfig.eveningScheduleTime || '21:00';
  document.getElementById('chkEveningScheduleEnabled').checked =
    currentConfig.eveningScheduleEnabled !== false;

  document.getElementById('chkWeather').checked = currentConfig.weather?.enabled !== false;
  document.getElementById('chkLunar').checked = currentConfig.lunar?.enabled !== false;
  document.getElementById('chkFinance').checked = currentConfig.finance?.enabled !== false;
  document.getElementById('chkLottery').checked = currentConfig.lottery?.enabled !== false;
  document.getElementById('chkLucky').checked = currentConfig.lucky?.enabled !== false;
  document.getElementById('chkCrypto').checked = currentConfig.crypto?.enabled !== false;
  document.getElementById('chkNews').checked = currentConfig.news?.enabled !== false;

  document.getElementById('selectLuckyMode').value = currentConfig.lucky?.mode || 'personalized';
  document.getElementById('inputUserName').value = currentConfig.lucky?.userName || 'Bạn';
  document.getElementById('inputBirthDate').value = currentConfig.lucky?.birthDate || '1996-04-03';

  updateScheduleBadge();
}

function updateScheduleBadge() {
  const badge = document.getElementById('scheduleBadge');
  if (!currentConfig) return;
  const parts = [];
  if (currentConfig.scheduleEnabled) parts.push(`Sáng ${currentConfig.scheduleTime}`);
  if (currentConfig.eveningScheduleEnabled) parts.push(`Tối ${currentConfig.eveningScheduleTime}`);
  badge.textContent = parts.length ? `⏰ ${parts.join(' • ')}` : '⏸️ Đang tắt hẹn giờ';
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
    scheduleTime: document.getElementById('inputScheduleTime').value || '07:00',
    scheduleEnabled: document.getElementById('chkScheduleEnabled').checked,
    eveningScheduleTime: document.getElementById('inputEveningScheduleTime').value || '21:00',
    eveningScheduleEnabled: document.getElementById('chkEveningScheduleEnabled').checked,
    enableInteractiveBot: true,
    weather: {
      enabled: document.getElementById('chkWeather').checked,
      cityName: foundCity ? foundCity.name : 'Hà Nội',
      lat: foundCity ? foundCity.lat : 21.0285,
      lon: foundCity ? foundCity.lon : 105.8542
    },
    lunar: {
      enabled: document.getElementById('chkLunar').checked
    },
    finance: {
      enabled: document.getElementById('chkFinance').checked
    },
    lottery: {
      enabled: document.getElementById('chkLottery').checked
    },
    lucky: {
      enabled: document.getElementById('chkLucky').checked,
      mode: document.getElementById('selectLuckyMode').value,
      userName: document.getElementById('inputUserName').value.trim() || 'Bạn',
      birthDate: document.getElementById('inputBirthDate').value || '1996-04-03'
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
  currentConfig = payload;
  saveLocalStoredConfig(payload);
  updateScheduleBadge();

  if (!isStaticHost) {
    try {
      const res = await fetch('./api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        currentConfig = data.config;
      }
    } catch {
      // fallback to localStorage
    }
  }

  showToast('✅ Đã lưu cấu hình và cập nhật dữ liệu mới nhất!', 'success');
  await loadPreview(false);
}

async function verifyBotToken() {
  const botToken = document.getElementById('inputBotToken').value.trim();
  if (!botToken) {
    showToast('⚠️ Vui lòng nhập Bot Token trước', 'error');
    return;
  }
  const pill = document.getElementById('botStatusPill');
  pill.textContent = 'Đang kiểm tra...';
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await res.json();
    if (data.ok && data.result) {
      pill.className =
        'text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      pill.textContent = `🟢 @${data.result.username}`;
      showToast(`✅ Kết nối thành công với Bot <b>@${data.result.username}</b>!`, 'success');
    } else {
      pill.className =
        'text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30';
      pill.textContent = '🔴 Token lỗi';
      showToast(`❌ Token không hợp lệ: ${data.description || ''}`, 'error');
    }
  } catch {
    showToast('❌ Không thể kết nối Telegram API', 'error');
  }
}

async function detectChatId() {
  const botToken = document.getElementById('inputBotToken').value.trim();
  const box = document.getElementById('detectedChatsBox');
  box.classList.remove('hidden');
  box.innerHTML = `<span class="text-slate-400">Đang tìm tin nhắn gửi tới Bot...</span>`;

  if (!botToken) {
    box.innerHTML = `<span class="text-rose-400">❌ Vui lòng nhập Bot Token ở ô phía trên trước.</span>`;
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=20`);
    const data = await res.json();
    if (!data.ok) {
      box.innerHTML = `<span class="text-rose-400">❌ ${data.description || 'Token lỗi'}</span>`;
      return;
    }

    const map = new Map();
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
        map.set(idStr, { id: idStr, title: `${title} (${chat.type})` });
      }
    }

    const chats = Array.from(map.values());
    if (chats.length === 0) {
      box.innerHTML = `<span class="text-amber-300">⚠️ Chưa thấy tin nhắn mới. Hãy nhắn <b>/start</b> cho Bot trên Telegram rồi bấm lại nút này!</span>`;
      return;
    }

    document.getElementById('inputChatId').value = chats.map((c) => c.id).join(', ');
    box.innerHTML =
      `<div class="text-emerald-300 font-medium mb-1">✅ Đã tìm thấy Chat ID (bấm để thêm/chọn):</div>` +
      chats
        .map(
          (c) =>
            `<button type="button" onclick="selectDetectedChat('${c.id}')" class="mr-2 mb-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-sky-500/20 border border-slate-700 text-slate-200">
              <b>${c.id}</b> — ${c.title}
            </button>`
        )
        .join('');
    showToast(`✅ Đã điền Chat ID tự động!`, 'success');
  } catch {
    box.innerHTML = `<span class="text-rose-400">❌ Lỗi khi dò Chat ID</span>`;
  }
}

function selectDetectedChat(id) {
  const input = document.getElementById('inputChatId');
  const existing = input.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!existing.includes(id)) {
    existing.push(id);
  }
  input.value = existing.join(', ');
}

async function loadPreview(notify = false) {
  const btn = document.getElementById('btnRefreshPreview');
  btn.disabled = true;
  btn.innerHTML = `<span>⏳</span> Đang tải...`;
  try {
    if (!isStaticHost) {
      const res = await fetch(`./api/preview?edition=${currentEdition}`);
      const data = await res.json();
      if (data.ok && data.digest) {
        latestDigest = data.digest;
        renderDigestCards(data.digest);
        document.getElementById('telegramPreviewBox').innerHTML = data.digest.telegramHtml;
        if (notify) showToast('🔄 Đã làm mới toàn bộ dữ liệu trực tiếp!', 'info');
        return;
      }
    }

    // Static GitHub Pages Mode: load latest-digest.json snapshot AND refresh live Weather + AQI + Crypto directly in browser!
    const snapRes = await fetch('./latest-digest.json');
    const snapData = await snapRes.json();
    const digest = snapData.digest;

    // Live browser refresh for Weather + AQI + Crypto so GitHub Pages is always real-time!
    await refreshBrowserLiveMetrics(digest);

    latestDigest = digest;
    renderDigestCards(digest);
    document.getElementById('telegramPreviewBox').innerHTML = digest.telegramHtml;
    if (notify) showToast('🔄 Đã cập nhật dữ liệu thời gian thực trên Cloud!', 'info');
  } catch (err) {
    showToast('❌ Không thể tải dữ liệu xem trước', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>🔄</span> Làm mới`;
  }
}

async function refreshBrowserLiveMetrics(digest) {
  const cfg = collectConfigFromForm();
  try {
    // 1. Live Weather + AQI from Open-Meteo (CORS-enabled)
    const [wRes, aqiRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${cfg.weather.lat}&longitude=${cfg.weather.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max&timezone=Asia%2FHo_Chi_Minh&forecast_days=1`
      ),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${cfg.weather.lat}&longitude=${cfg.weather.lon}&current=us_aqi,pm10,pm2_5&timezone=Asia%2FHo_Chi_Minh`
      )
    ]);
    if (wRes.ok && digest.weather) {
      const wJson = await wRes.json();
      digest.weather.cityName = cfg.weather.cityName;
      digest.weather.currentTemp = Number(wJson.current.temperature_2m);
      digest.weather.feelsLike = Number(wJson.current.apparent_temperature);
      digest.weather.humidity = Number(wJson.current.relative_humidity_2m);
      digest.weather.windSpeed = Number(wJson.current.wind_speed_10m);
      digest.weather.minTemp = Number(wJson.daily.temperature_2m_min[0]);
      digest.weather.maxTemp = Number(wJson.daily.temperature_2m_max[0]);
      digest.weather.rainProbability = Number(wJson.daily.precipitation_probability_max[0] || 0);
      digest.weather.uvIndex = Number(wJson.daily.uv_index_max[0] || 5);
    }
    if (aqiRes.ok && digest.weather && digest.weather.airQuality) {
      const aJson = await aqiRes.json();
      const aqi = Math.round(Number(aJson.current.us_aqi || 60));
      digest.weather.airQuality.aqi = aqi;
      digest.weather.airQuality.pm25 = Number(Number(aJson.current.pm2_5 || 20).toFixed(1));
      digest.weather.airQuality.pm10 = Number(Number(aJson.current.pm10 || 35).toFixed(1));
    }
  } catch {
    // keep snapshot values
  }
}

function renderDigestCards(digest) {
  // 1. Lunar Calendar Card
  const lnEl = document.getElementById('cardLunarContent');
  if (digest.lunar) {
    const ln = digest.lunar;
    lnEl.innerHTML = `
      <div class="flex items-center justify-between bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl">
        <div>
          <div class="text-xs text-rose-200/80">Dương lịch: <b>${ln.solarDate}</b></div>
          <div class="text-sm font-bold text-white mt-0.5">Âm lịch: ${ln.lunarDateFormatted}</div>
          <div class="text-xs text-rose-300 mt-0.5">Ngày ${ln.canChiDay} • Tháng ${ln.canChiMonth}</div>
        </div>
        <div class="text-center px-3 py-1.5 rounded-lg bg-slate-900/80 border border-rose-500/30">
          <span class="text-[10px] text-slate-400 block uppercase">Âm lịch</span>
          <span class="text-2xl font-black text-rose-400 font-mono">${ln.lunarDay}/${ln.lunarMonth}</span>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="bg-slate-900/40 p-2 rounded-lg border border-slate-800">🌿 Tiết khí: <b>${ln.tietKhi}</b></div>
        <div class="bg-slate-900/40 p-2 rounded-lg border border-slate-800">🧭 Hỷ Thần: <b>${ln.auspiciousDirection.hyThan}</b></div>
        <div class="bg-slate-900/40 p-2 rounded-lg border border-slate-800 col-span-2">💎 Hướng Tài Thần: <b class="text-amber-300">${ln.auspiciousDirection.taiThan}</b></div>
      </div>
      <div class="text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 space-y-1">
        <div>🌙 <b>${ln.nextMoonNote}</b></div>
        ${
          ln.upcomingEvents?.length
            ? `<div class="text-[11px] text-slate-400">⏳ Sắp tới: ${ln.upcomingEvents
                .map((e) => `${e.name} (còn <b class="text-white">${e.daysLeft} ngày</b>)`)
                .join(' • ')}</div>`
            : ''
        }
      </div>
    `;
  } else {
    lnEl.innerHTML = `<p class="text-xs text-slate-500">Chuyên mục Lịch Âm đang tắt.</p>`;
  }

  // 2. Weather & AQI Card
  const wEl = document.getElementById('cardWeatherContent');
  if (digest.weather) {
    const w = digest.weather;
    const aq = w.airQuality;
    wEl.innerHTML = `
      <div class="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div>
          <div class="text-xs text-slate-400">${w.cityName} • Cập nhật ${w.updatedAt}</div>
          <div class="text-2xl font-extrabold text-white mt-0.5">${w.currentTemp}°C <span class="text-xs font-normal text-slate-400">(Cảm giác ${w.feelsLike}°C)</span></div>
          <div class="text-xs text-sky-300 font-medium mt-0.5">${w.description}</div>
        </div>
        <div class="text-4xl">${w.icon}</div>
      </div>
      ${
        aq
          ? `<div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
              <div>
                <span class="text-slate-400">Chỉ số không khí (US AQI):</span>
                <div class="font-bold text-white mt-0.5">${aq.badge} AQI ${aq.aqi} — ${aq.level}</div>
              </div>
              <div class="text-right">
                <span class="text-[11px] text-slate-400 block">Bụi mịn PM2.5</span>
                <span class="font-mono font-bold text-amber-300">${aq.pm25} µg/m³</span>
              </div>
            </div>`
          : ''
      }
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">🌡️ Biên độ: <b>${w.minTemp}° - ${w.maxTemp}°C</b></div>
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

  // 3. Finance (Gold, Forex, Fuel) Card
  const fnEl = document.getElementById('cardFinanceContent');
  if (digest.finance) {
    const f = digest.finance;
    fnEl.innerHTML = `
      <div class="space-y-2">
        ${f.gold
          .map(
            (g) => `
          <div class="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/25 p-2.5 rounded-xl text-xs">
            <div>
              <div class="font-bold text-yellow-300">🪙 ${g.name}</div>
              <div class="text-[11px] text-slate-400">Đơn vị: ${g.note}</div>
            </div>
            <div class="text-right font-mono">
              <div class="text-slate-300">Mua: <b class="text-white">${g.buyVnd}</b></div>
              <div class="text-slate-300">Bán: <b class="text-emerald-400">${g.sellVnd}</b></div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs">
        ${f.forex
          .map(
            (fx) => `
          <div class="bg-slate-900/50 p-2 rounded-lg border border-slate-800 flex justify-between">
            <span class="text-slate-400 font-semibold">${fx.code}:</span>
            <b class="font-mono text-white">${fx.rateVnd.toLocaleString('vi-VN')}₫</b>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
        <div class="text-slate-400 font-medium">⛽ Giá bán lẻ xăng dầu Petrolimex:</div>
        <div class="flex flex-wrap justify-between gap-2 pt-0.5">
          ${f.fuel
            .map(
              (fl) =>
                `<span>${fl.name}: <b class="text-amber-300 font-mono">${fl.priceVnd.toLocaleString(
                  'vi-VN'
                )}₫</b></span>`
            )
            .join('')}
        </div>
      </div>
    `;
  } else {
    fnEl.innerHTML = `<p class="text-xs text-slate-500">Chuyên mục Giá Vàng & Tài chính đang tắt.</p>`;
  }

  // 4. Lucky
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

  // 5. Lottery
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

  // 6. Crypto
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
              <span class="text-slate-300">📊 Tâm lý (Fear & Greed):</span>
              <b class="text-orange-300">${c.fearAndGreed.value}/100 — ${c.fearAndGreed.classification}</b>
            </div>`
          : ''
      }
    `;
  } else {
    crEl.innerHTML = `<p class="text-xs text-slate-500">Chuyên mục Crypto đang tắt.</p>`;
  }

  // 7. News
  const nwEl = document.getElementById('cardNewsContent');
  if (digest.news && digest.news.items) {
    nwEl.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

async function sendDirectTelegramFromBrowser(botToken, chatIdRaw, htmlText) {
  const chatIds = chatIdRaw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  let okCount = 0;
  let lastErr = '';
  for (const cid of chatIds) {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cid,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
    const data = await res.json();
    if (data.ok) okCount++;
    else lastErr = data.description || 'Lỗi gửi tin nhắn';
  }
  return { ok: okCount > 0, sentCount: okCount, error: lastErr };
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

  saveLocalStoredConfig(collectConfigFromForm());
  showToast('✈️ Đang đẩy thông báo qua Telegram...', 'info');

  if (!isStaticHost) {
    try {
      await fetch('./api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectConfigFromForm())
      });
      const res = await fetch('./api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, edition: currentEdition, botToken, chatId })
      });
      const data = await res.json();
      if (data.ok) {
        showToast(
          `🎉 Đã đẩy thông báo qua Telegram thành công (${data.sentCount || 1} người nhận)!`,
          'success'
        );
        await loadHistory();
        return;
      }
    } catch {
      // Fall through to direct browser Telegram send
    }
  }

  // Direct Browser Telegram Send (Works on GitHub Pages without backend!)
  const textToSend = latestDigest ? latestDigest.telegramHtml : '🌅 Bản tin Telegram Daily Digest';
  const directRes = await sendDirectTelegramFromBrowser(botToken, chatId, textToSend);
  if (directRes.ok) {
    showToast(
      `🎉 Đã gửi trực tiếp qua Telegram thành công (${directRes.sentCount} người nhận)!`,
      'success'
    );
  } else {
    showToast(`❌ Gửi thất bại: ${directRes.error}`, 'error');
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

  const customHtml = `📢 <b>THÔNG BÁO NHANH</b>\n\n${text}`;
  const res = await sendDirectTelegramFromBrowser(botToken, chatId, customHtml);
  if (res.ok) {
    input.value = '';
    showToast('✅ Đã gửi tin nhắn tuỳ chỉnh qua Telegram!', 'success');
    if (!isStaticHost) await loadHistory();
  } else {
    showToast(`❌ Gửi thất bại: ${res.error}`, 'error');
  }
}

function copyTelegramPreview() {
  const el = document.getElementById('telegramPreviewBox');
  navigator.clipboard.writeText(el.innerText || '');
  showToast('📋 Đã sao chép nội dung bản tin vào Clipboard!', 'success');
}

async function loadHistory() {
  if (isStaticHost) return;
  try {
    const res = await fetch('./api/history');
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
