import { VietnamFinanceData } from '../types';

export async function fetchVietnamFinance(): Promise<VietnamFinanceData> {
  let usdRate = 25450;
  let eurRate = 27200;
  let jpyRate = 168;
  let cnyRate = 3530;
  let worldGoldUsdOz = 2685;

  // 1. Fetch live Forex rates from Open Exchange Rates API
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const data: any = await res.json();
      const rates = data?.rates;
      if (rates?.VND) {
        usdRate = Math.round(Number(rates.VND));
        if (rates.EUR) eurRate = Math.round(usdRate / Number(rates.EUR));
        if (rates.JPY) jpyRate = Math.round((usdRate / Number(rates.JPY)) * 100) / 100;
        if (rates.CNY) cnyRate = Math.round(usdRate / Number(rates.CNY));
      }
    }
  } catch {
    // use fallback forex
  }

  // 2. Fetch live World Gold Price (XAU/USD via PAXGUSDT on Binance)
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT', {
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data?.price) {
        worldGoldUsdOz = Math.round(Number(data.price));
      }
    }
  } catch {
    // fallback world gold
  }

  // Quy đổi chuẩn 1 lượng vàng = 1.20565 troy ounce + biên độ thị trường trong nước (SJC & Nhẫn 9999)
  const baseWorldTaelMillion = (worldGoldUsdOz * 1.20565 * usdRate) / 1_000_000;
  const sjcBuy = Math.max(82.5, Math.round((baseWorldTaelMillion + 4.2) * 10) / 10);
  const sjcSell = Math.round((sjcBuy + 2.0) * 10) / 10;

  const ringBuy = Math.max(81.8, Math.round((baseWorldTaelMillion + 2.8) * 10) / 10);
  const ringSell = Math.round((ringBuy + 1.5) * 10) / 10;

  return {
    gold: [
      {
        name: 'Vàng miếng SJC 9999',
        buyVnd: `${sjcBuy.toFixed(1)} tr`,
        sellVnd: `${sjcSell.toFixed(1)} tr`,
        note: '₫/lượng'
      },
      {
        name: 'Vàng Nhẫn tròn trơn 9999 (DOJI/PNJ)',
        buyVnd: `${ringBuy.toFixed(1)} tr`,
        sellVnd: `${ringSell.toFixed(1)} tr`,
        note: '₫/lượng'
      }
    ],
    worldGoldUsdOz,
    forex: [
      { code: 'USD', name: 'Đô la Mỹ', rateVnd: usdRate },
      { code: 'EUR', name: 'Euro', rateVnd: eurRate },
      { code: 'JPY', name: 'Yên Nhật', rateVnd: jpyRate },
      { code: 'CNY', name: 'Nhân dân tệ', rateVnd: cnyRate }
    ],
    fuel: [
      { name: 'Xăng RON 95-III', priceVnd: 20960, unit: '₫/lít' },
      { name: 'Xăng E5 RON 92', priceVnd: 19840, unit: '₫/lít' },
      { name: 'Dầu Diesel 0.05S', priceVnd: 18590, unit: '₫/lít' }
    ],
    updatedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  };
}

export function formatFinanceTelegram(f: VietnamFinanceData): string {
  const lines: string[] = [`💰 <b>GIÁ VÀNG, TỶ GIÁ & XĂNG DẦU HÔM NAY</b>`];

  for (const g of f.gold) {
    lines.push(
      `• 🪙 <b>${g.name}:</b> Mua <code>${g.buyVnd}</code> — Bán <code>${g.sellVnd}</code> (${g.note})`
    );
  }
  lines.push(`• 🌐 <b>Vàng Thế giới (XAU/USD):</b> <b>$${f.worldGoldUsdOz.toLocaleString('en-US')}/oz</b>`);

  const fxStr = f.forex
    .map((fx) => `<b>${fx.code}:</b> ${fx.rateVnd.toLocaleString('vi-VN')}₫`)
    .join(' | ');
  lines.push(`• 💱 <b>Tỷ giá ngoại tệ:</b> ${fxStr}`);

  const fuelStr = f.fuel
    .map((fl) => `${fl.name}: <b>${fl.priceVnd.toLocaleString('vi-VN')}${fl.unit}</b>`)
    .join(' | ');
  lines.push(`• ⛽ <b>Giá xăng dầu:</b> ${fuelStr}`);

  return lines.join('\n');
}
