import { wsManager } from '@/lib/websocket';

type PriceUpdate = { symbol: string; price: number; time: number };

export function startRealtimePrices(apiKey: string, symbols: string[], onUpdate: (u: PriceUpdate) => void) {
  try {
    wsManager.subscribeToPrices(apiKey, symbols);
    wsManager.on('price', (payload: any) => {
      if (payload?.symbol && payload?.price) {
        onUpdate({ symbol: payload.symbol, price: payload.price, time: Date.now() });
      }
    });
  } catch (e) {
    // Fallback could be implemented with REST polling
    console.warn('Realtime subscription failed, consider REST fallback', e);
  }
}