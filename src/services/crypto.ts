import { CoinPrice, CryptoData } from '../types';

const COIN_META: Record<string, { name: string; binanceSymbol: string; geckoId: string }> = {
  BTC: { name: 'Bitcoin', binanceSymbol: 'BTCUSDT', geckoId: 'bitcoin' },
  ETH: { name: 'Ethereum', binanceSymbol: 'ETHUSDT', geckoId: 'ethereum' },
  SOL: { name: 'Solana', binanceSymbol: 'SOLUSDT', geckoId: 'solana' },
  BNB: { name: 'BNB', binanceSymbol: 'BNBUSDT', geckoId: 'binancecoin' },
  XRP: { name: 'XRP', binanceSymbol: 'XRPUSDT', geckoId: 'ripple' },
  DOGE: { name: 'Dogecoin', binanceSymbol: 'DOGEUSDT', geckoId: 'dogecoin' }
};

async function fetchUsdToVndRate(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data?.rates?.VND) {
        return Number(data.rates.VND);
      }
    }
  } catch {
    // ignore and use fallback rate
  }
  return 25450;
}

async function fetchFearAndGreed(): Promise<{ value: number; classification: string } | undefined> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1', {
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return undefined;
    const data: any = await res.json();
    const item = data?.data?.[0];
    if (!item) return undefined;
    const val = Number(item.value);
    const mapVi: Record<string, string> = {
      'Extreme Fear': 'Sợ hãi tột độ 😨',
      Fear: 'Tâm lý Sợ hãi 😟',
      Neutral: 'Trung lập 😐',
      Greed: 'Tham lam 🤑',
      'Extreme Greed': 'Tham lam tột độ 🚀'
    };
    return {
      value: val,
      classification: mapVi[item.value_classification] || item.value_classification
    };
  } catch {
    return undefined;
  }
}

export async function fetchCryptoData(symbols: string[] = ['BTC', 'ETH', 'SOL', 'BNB']): Promise<CryptoData> {
  const usdToVnd = await fetchUsdToVndRate();
  const fearAndGreed = await fetchFearAndGreed();
  const coins: CoinPrice[] = [];

  try {
    // Try Binance 24hr ticker API (fast & keyless)
    const binanceSymbols = symbols
      .map((s) => COIN_META[s]?.binanceSymbol)
      .filter(Boolean);
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(
      JSON.stringify(binanceSymbols)
    )}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });

    if (res.ok) {
      const list: any[] = await res.json();
      for (const sym of symbols) {
        const meta = COIN_META[sym];
        if (!meta) continue;
        const ticker = list.find((t) => t.symbol === meta.binanceSymbol);
        if (ticker) {
          const priceUsd = Number(ticker.lastPrice);
          coins.push({
            symbol: sym,
            name: meta.name,
            priceUsd,
            priceVnd: Math.round(priceUsd * usdToVnd),
            change24h: Number(ticker.priceChangePercent),
            high24h: Number(ticker.highPrice),
            low24h: Number(ticker.lowPrice)
          });
        }
      }
    }
  } catch {
    // Fallback to CoinGecko if Binance is blocked
  }

  if (coins.length === 0) {
    try {
      const ids = symbols.map((s) => COIN_META[s]?.geckoId).filter(Boolean).join(',');
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (res.ok) {
        const list: any[] = await res.json();
        for (const sym of symbols) {
          const meta = COIN_META[sym];
          const item = list.find((i) => i.id === meta?.geckoId);
          if (item && meta) {
            const priceUsd = Number(item.current_price);
            coins.push({
              symbol: sym,
              name: meta.name,
              priceUsd,
              priceVnd: Math.round(priceUsd * usdToVnd),
              change24h: Number(item.price_change_percentage_24h || 0),
              high24h: Number(item.high_24h || priceUsd),
              low24h: Number(item.low_24h || priceUsd)
            });
          }
        }
      }
    } catch {
      // Fallback values if completely offline
    }
  }

  if (coins.length === 0) {
    const defaults = [
      { symbol: 'BTC', name: 'Bitcoin', priceUsd: 89500, change24h: 2.35, high24h: 91000, low24h: 87200 },
      { symbol: 'ETH', name: 'Ethereum', priceUsd: 3120, change24h: 1.45, high24h: 3180, low24h: 3040 },
      { symbol: 'SOL', name: 'Solana', priceUsd: 195, change24h: 4.12, high24h: 201, low24h: 186 },
      { symbol: 'BNB', name: 'BNB', priceUsd: 640, change24h: 0.85, high24h: 652, low24h: 631 }
    ];
    for (const d of defaults) {
      coins.push({
        ...d,
        priceVnd: Math.round(d.priceUsd * usdToVnd)
      });
    }
  }

  return {
    coins,
    usdToVnd,
    fearAndGreed,
    updatedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  };
}

function formatNumberUsd(n: number): string {
  return n >= 100
    ? n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function formatVndShort(vnd: number): string {
  if (vnd >= 1_000_000_000) {
    return `${(vnd / 1_000_000_000).toFixed(2)} tỷ ₫`;
  }
  if (vnd >= 1_000_000) {
    return `${(vnd / 1_000_000).toFixed(1)} tr ₫`;
  }
  return `${vnd.toLocaleString('vi-VN')} ₫`;
}

export function formatCryptoTelegram(c: CryptoData): string {
  const lines: string[] = [`₿ <b>THỊ TRƯỜNG BITCOIN & CRYPTO</b>`];

  for (const coin of c.coins) {
    const icon = coin.change24h >= 0 ? '🟢 ▲' : '🔴 ▼';
    const sign = coin.change24h >= 0 ? '+' : '';
    lines.push(
      `• <b>${coin.symbol}</b>: <b>$${formatNumberUsd(coin.priceUsd)}</b> (~${formatVndShort(
        coin.priceVnd
      )}) | ${icon} <b>${sign}${coin.change24h.toFixed(2)}%</b>`
    );
    if (coin.symbol === 'BTC') {
      lines.push(
        `  └ <i>Biên độ 24h BTC: $${formatNumberUsd(coin.low24h)} – $${formatNumberUsd(coin.high24h)}</i>`
      );
    }
  }

  if (c.fearAndGreed) {
    lines.push(
      `• 📊 <b>Chỉ số Fear & Greed:</b> <b>${c.fearAndGreed.value}/100</b> (${c.fearAndGreed.classification})`
    );
  }

  return lines.join('\n');
}
