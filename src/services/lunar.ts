import { LunarCalendarData, LunarEventCountdown } from '../types';

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

const TIET_KHI = [
  'Xuân Phân', 'Thanh Minh', 'Cốc Vũ', 'Lập Hạ', 'Tiểu Mãn', 'Mang Chủng',
  'Hạ Chí', 'Tiểu Thử', 'Đại Thử', 'Lập Thu', 'Xử Thử', 'Bạch Lộ',
  'Thu Phân', 'Hàn Lộ', 'Sương Giáng', 'Lập Đông', 'Tiểu Tuyết', 'Đại Tuyết',
  'Đông Chí', 'Tiểu Hàn', 'Đại Hàn', 'Lập Xuân', 'Vũ Thủy', 'Kinh Trập'
];

// Thuật toán thiên văn tính Lịch Âm Việt Nam (GMT+7)
function INT(d: number): number {
  return Math.floor(d);
}

export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = INT((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    INT((153 * m + 2) / 5) +
    365 * y +
    INT(y / 4) -
    INT(y / 100) +
    INT(y / 400) -
    32045;
  if (jd < 2299161) {
    jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  }
  return jd;
}

function getNewMoonDay(k: number, timeZone: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  let deltat: number;
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  const JdNew = Jd1 + C1 - deltat;
  return INT(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn: number, timeZone: number): number {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L * dr;
  L = L - Math.PI * 2 * INT(L / (Math.PI * 2));
  return INT((L / Math.PI) * 6);
}

function getSunLongitude24(jdn: number, timeZone: number): number {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L * dr;
  L = L - Math.PI * 2 * INT(L / (Math.PI * 2));
  return INT((L / (Math.PI * 2)) * 24);
}

function getLunarMonth11(yy: number, timeZone: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = INT(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11: number, timeZone: number): number {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

export function convertSolar2Lunar(
  dd: number,
  mm: number,
  yy: number,
  timeZone: number = 7
): [number, number, number, boolean] {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = true;
      }
    }
  }
  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }
  return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}

function getAuspiciousDirections(canDayIndex: number): { hyThan: string; taiThan: string } {
  // Can index: 0=Giáp, 1=Ất, 2=Bính, 3=Đinh, 4=Mậu, 5=Kỷ, 6=Canh, 7=Tân, 8=Nhâm, 9=Quý
  const hyThanMap = [
    'Đông Bắc', 'Tây Bắc', 'Tây Nam', 'Chính Nam', 'Đông Nam',
    'Đông Bắc', 'Tây Bắc', 'Tây Nam', 'Chính Nam', 'Đông Nam'
  ];
  const taiThanMap = [
    'Đông Nam', 'Đông Nam', 'Chính Đông', 'Chính Đông', 'Chính Bắc',
    'Chính Nam', 'Tây Nam', 'Tây Nam', 'Chính Tây', 'Tây Bắc'
  ];
  return {
    hyThan: hyThanMap[canDayIndex] || 'Đông Nam',
    taiThan: taiThanMap[canDayIndex] || 'Chính Nam'
  };
}

function getAuspiciousHoursByChi(chiDayIndex: number): string {
  // 12 Địa Chi giờ hoàng đạo chuẩn Vạn Niên
  const table: Record<number, string> = {
    0: 'Tý (23h-1h), Sửu (1h-3h), Mão (5h-7h), Ngọ (11h-13h), Thân (15h-17h), Dậu (17h-19h)', // Tý, Ngọ
    6: 'Tý (23h-1h), Sửu (1h-3h), Mão (5h-7h), Ngọ (11h-13h), Thân (15h-17h), Dậu (17h-19h)',
    1: 'Dần (3h-5h), Mão (5h-7h), Tỵ (9h-11h), Thân (15h-17h), Tuất (19h-21h), Hợi (21h-23h)', // Sửu, Mùi
    7: 'Dần (3h-5h), Mão (5h-7h), Tỵ (9h-11h), Thân (15h-17h), Tuất (19h-21h), Hợi (21h-23h)',
    2: 'Tý (23h-1h), Sửu (1h-3h), Thìn (7h-9h), Tỵ (9h-11h), Mùi (13h-15h), Tuất (19h-21h)', // Dần, Thân
    8: 'Tý (23h-1h), Sửu (1h-3h), Thìn (7h-9h), Tỵ (9h-11h), Mùi (13h-15h), Tuất (19h-21h)',
    3: 'Tý (23h-1h), Dần (3h-5h), Mão (5h-7h), Ngọ (11h-13h), Mùi (13h-15h), Dậu (17h-19h)', // Mão, Dậu
    9: 'Tý (23h-1h), Dần (3h-5h), Mão (5h-7h), Ngọ (11h-13h), Mùi (13h-15h), Dậu (17h-19h)',
    4: 'Dần (3h-5h), Thìn (7h-9h), Tỵ (9h-11h), Thân (15h-17h), Dậu (17h-19h), Hợi (21h-23h)', // Thìn, Tuất
    10: 'Dần (3h-5h), Thìn (7h-9h), Tỵ (9h-11h), Thân (15h-17h), Dậu (17h-19h), Hợi (21h-23h)',
    5: 'Sửu (1h-3h), Thìn (7h-9h), Ngọ (11h-13h), Mùi (13h-15h), Tuất (19h-21h), Hợi (21h-23h)', // Tỵ, Hợi
    11: 'Sửu (1h-3h), Thìn (7h-9h), Ngọ (11h-13h), Mùi (13h-15h), Tuất (19h-21h), Hợi (21h-23h)'
  };
  return table[chiDayIndex] || table[0];
}

export function getLunarCalendarData(date: Date = new Date()): LunarCalendarData {
  const dd = date.getDate();
  const mm = date.getMonth() + 1;
  const yy = date.getFullYear();

  const jdn = jdFromDate(dd, mm, yy);
  const [lunarDay, lunarMonth, lunarYear, isLeapMonth] = convertSolar2Lunar(dd, mm, yy, 7);

  const canDayIdx = (jdn + 9) % 10;
  const chiDayIdx = (jdn + 1) % 12;
  const canChiDay = `${CAN[canDayIdx]} ${CHI[chiDayIdx]}`;

  const canYearIdx = (lunarYear + 6) % 10;
  const chiYearIdx = (lunarYear + 8) % 12;
  const canChiYear = `${CAN[canYearIdx]} ${CHI[chiYearIdx]}`;

  const canMonthIdx = (lunarYear * 12 + lunarMonth + 3) % 10;
  const chiMonthIdx = (lunarMonth + 1) % 12;
  const canChiMonth = `${CAN[canMonthIdx]} ${CHI[chiMonthIdx]}`;

  const tietKhiIdx = getSunLongitude24(jdn, 7);
  const tietKhi = TIET_KHI[tietKhiIdx] || 'Lập Đông';

  // Tính ngày tới Rằm (15) hoặc Mùng 1 Âm lịch gần nhất
  let nextMoonNote = '';
  if (lunarDay === 1) {
    nextMoonNote = '🌕 Hôm nay là ngày Mùng 1 đầu tháng Âm lịch!';
  } else if (lunarDay === 15) {
    nextMoonNote = '🌕 Hôm nay là ngày Rằm (15 Âm lịch)!';
  } else if (lunarDay < 15) {
    nextMoonNote = `Còn ${15 - lunarDay} ngày nữa đến Rằm tháng ${lunarMonth} Âm lịch`;
  } else {
    // Tìm Mùng 1 tháng sau
    let daysToMung1 = 1;
    for (let i = 1; i <= 16; i++) {
      const nextDate = new Date(date.getTime() + i * 86400000);
      const [ld] = convertSolar2Lunar(
        nextDate.getDate(),
        nextDate.getMonth() + 1,
        nextDate.getFullYear(),
        7
      );
      if (ld === 1) {
        daysToMung1 = i;
        break;
      }
    }
    nextMoonNote = `Còn ${daysToMung1} ngày nữa đến Mùng 1 Âm lịch tháng tới`;
  }

  // Tính các sự kiện sắp tới
  const upcomingEvents: LunarEventCountdown[] = [];
  const fixedHolidays = [
    { name: 'Ngày Nhà giáo Việt Nam (20/11)', month: 11, day: 20 },
    { name: 'Lễ Giáng Sinh (Noel 24/12)', month: 12, day: 24 },
    { name: 'Tết Dương Lịch (01/01)', month: 1, day: 1 },
    { name: 'Lễ Tình Nhân (14/02)', month: 2, day: 14 },
    { name: 'Quốc tế Phụ nữ (08/03)', month: 3, day: 8 },
    { name: 'Giải phóng miền Nam (30/04)', month: 4, day: 30 },
    { name: 'Quốc tế Lao động (01/05)', month: 5, day: 1 },
    { name: 'Quốc khánh Việt Nam (02/09)', month: 9, day: 2 },
    { name: 'Phụ nữ Việt Nam (20/10)', month: 10, day: 20 }
  ];

  const todayMidnight = new Date(yy, mm - 1, dd).getTime();

  for (const h of fixedHolidays) {
    let targetYear = yy;
    let targetTime = new Date(targetYear, h.month - 1, h.day).getTime();
    if (targetTime < todayMidnight) {
      targetYear = yy + 1;
      targetTime = new Date(targetYear, h.month - 1, h.day).getTime();
    }
    const daysLeft = Math.round((targetTime - todayMidnight) / 86400000);
    upcomingEvents.push({
      name: h.name,
      dateStr: `${String(h.day).padStart(2, '0')}/${String(h.month).padStart(2, '0')}/${targetYear}`,
      daysLeft
    });
  }

  upcomingEvents.sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    solarDate: date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    lunarDay,
    lunarMonth,
    lunarYear,
    isLeapMonth,
    lunarDateFormatted: `${String(lunarDay).padStart(2, '0')}/${String(lunarMonth).padStart(
      2,
      '0'
    )}${isLeapMonth ? ' (Nhuận)' : ''} năm ${canChiYear}`,
    canChiDay,
    canChiMonth,
    canChiYear,
    tietKhi,
    auspiciousDirection: getAuspiciousDirections(canDayIdx),
    auspiciousHours: getAuspiciousHoursByChi(chiDayIdx),
    nextMoonNote,
    upcomingEvents: upcomingEvents.slice(0, 2)
  };
}

export function formatLunarTelegram(l: LunarCalendarData): string {
  const lines = [
    `🏮 <b>LỊCH ÂM - DƯƠNG & XUẤT HÀNH</b>`,
    `• Dương lịch: <b>${l.solarDate}</b> | Âm lịch: <b>${l.lunarDateFormatted}</b>`,
    `• Can Chi: Ngày <b>${l.canChiDay}</b>, Tháng <b>${l.canChiMonth}</b> | Tiết khí: <b>${l.tietKhi}</b>`,
    `• 🧭 <b>Hướng xuất hành tốt:</b> Hỷ Thần: <b>${l.auspiciousDirection.hyThan}</b> — Tài Thần: <b>${l.auspiciousDirection.taiThan}</b>`,
    `• 🌙 <b>Chu kỳ trăng:</b> ${l.nextMoonNote}`
  ];

  if (l.upcomingEvents.length > 0) {
    const evStr = l.upcomingEvents
      .map((e) => `${e.name} (còn <b>${e.daysLeft} ngày</b>)`)
      .join(' • ');
    lines.push(`• ⏳ <b>Sự kiện sắp tới:</b> ${evStr}`);
  }

  return lines.join('\n');
}
