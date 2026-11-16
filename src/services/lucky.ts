import { LuckyData } from '../types';

const THIEN_CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const DIA_CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

const LUCKY_COLORS = [
  'Đỏ Ruby & Cam Đất (Hành Hỏa)',
  'Xanh Lá Ngọc & Xanh Rêu (Hành Mộc)',
  'Vàng Hoàng Kim & Nâu Đất (Hành Thổ)',
  'Trắng Ánh Kim & Bạc (Hành Kim)',
  'Xanh Dương Đậm & Đen Huyền (Hành Thủy)',
  'Tím Thạch Anh & Hồng Phấn'
];

const AUSPICIOUS_HOURS = [
  'Tý (23h-1h), Dần (3h-5h), Thìn (7h-9h), Ngọ (11h-13h), Mùi (13h-15h), Dậu (17h-19h)',
  'Sửu (1h-3h), Thìn (7h-9h), Ngọ (11h-13h), Mùi (13h-15h), Tuất (19h-21h), Hợi (21h-23h)',
  'Dần (3h-5h), Mão (5h-7h), Tỵ (9h-11h), Thân (15h-17h), Tuất (19h-21h), Hợi (21h-23h)',
  'Tý (23h-1h), Sửu (1h-3h), Tỵ (9h-11h), Mùi (13h-15h), Thân (15h-17h), Tuất (19h-21h)'
];

const QUOTES = [
  'Cơ hội tốt thường đến với người chuẩn bị kỹ càng. Hôm nay là ngày thuận lợi để bắt đầu một kế hoạch mới!',
  'Năng lượng tích cực sẽ thu hút may mắn về tài lộc và công việc. Hãy giữ tinh thần cởi mở và quyết đoán.',
  'Một tin vui bất ngờ về tài chính hoặc sự hợp tác có thể gõ cửa trong hôm nay.',
  'Sự kiên trì của bạn đang dần đơm hoa kết trái. Hãy tự tin vào trực giác của chính mình!',
  'Hôm nay rất thích hợp để kết nối với bạn bè, đối tác hoặc giải quyết dứt điểm các công việc tồn đọng.',
  'Tài vận hanh thông, quý nhân phù trợ. Hãy chú ý những chi tiết nhỏ vì đó là chìa khóa thành công hôm nay.'
];

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function getCanChiOfDay(date: Date): string {
  // Julian Day Number calculation for Can Chi day
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const a = Math.floor((14 - m) / 12);
  const y1 = y + 4800 - a;
  const m1 = m + 12 * a - 3;
  const jdn =
    d +
    Math.floor((153 * m1 + 2) / 5) +
    365 * y1 +
    Math.floor(y1 / 4) -
    Math.floor(y1 / 100) +
    Math.floor(y1 / 400) -
    32045;

  const canIndex = (jdn + 9) % 10;
  const chiIndex = (jdn + 1) % 12;
  return `Ngày ${THIEN_CAN[canIndex]} ${DIA_CHI[chiIndex]}`;
}

export function generateLuckyData(options: {
  mode: 'personalized' | 'random';
  userName: string;
  birthDate: string;
}): LuckyData {
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const isoDay = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

  const seedSource =
    options.mode === 'personalized'
      ? `${isoDay}::${options.userName.trim().toLowerCase()}::${options.birthDate}`
      : `${isoDay}::${Math.random()}`;

  const h1 = hashString(seedSource);
  const h2 = hashString(seedSource + '#2');
  const h3 = hashString(seedSource + '#3');
  const h4 = hashString(seedSource + '#4');

  const luckyNumber2D = String(h1 % 100).padStart(2, '0');
  const pairSecond = String((h2 % 99) + 1).padStart(2, '0');
  const pairThird = String(99 - (h1 % 100)).padStart(2, '0');
  const luckyNumber3D = String(h3 % 1000).padStart(3, '0');

  const luckyColor = LUCKY_COLORS[h1 % LUCKY_COLORS.length];
  const auspiciousHours = AUSPICIOUS_HOURS[h2 % AUSPICIOUS_HOURS.length];
  const quote = QUOTES[h3 % QUOTES.length];
  const fortuneScore = 78 + (h4 % 22); // 78 - 99%

  const forPerson =
    options.mode === 'personalized'
      ? `${options.userName || 'Bạn'} (${options.birthDate || 'Hôm nay'})`
      : 'Ngẫu nhiên trong ngày';

  return {
    date: dateStr,
    canChiDay: getCanChiOfDay(now),
    luckyNumber2D,
    luckyNumber3D,
    luckyPair: [luckyNumber2D, pairSecond, pairThird],
    luckyColor,
    auspiciousHours,
    quote,
    fortuneScore,
    mode: options.mode,
    forPerson
  };
}

export function formatLuckyTelegram(l: LuckyData): string {
  return [
    `🍀 <b>CON SỐ MAY MẮN HÔM NAY (${l.date})</b>`,
    `• Dành cho: <b>${l.forPerson}</b> | Lịch Can Chi: <b>${l.canChiDay}</b>`,
    `• 🎯 <b>Con số chủ đạo (2 số):</b> <code>${l.luckyNumber2D}</code>`,
    `• 💎 <b>Bộ số tài lộc:</b> <code>${l.luckyPair.join(' - ')}</code> | <b>3 càng:</b> <code>${l.luckyNumber3D}</code>`,
    `• 🎨 <b>Màu sắc hợp vận:</b> ${l.luckyColor}`,
    `• ⏰ <b>Giờ hoàng đạo:</b> ${l.auspiciousHours}`,
    `• 📈 <b>Chỉ số năng lượng & may mắn:</b> <b>${l.fortuneScore}/100</b>`,
    `✨ <i>"${l.quote}"</i>`
  ].join('\n');
}
