'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { wsManager } from '@/lib/websocket';
import { TrendingUp, TrendingDown, Plus, X } from 'lucide-react';

interface PriceData {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  change: number;
  changePercent: number;
}

export default function LivePrices() {
  const { user, wsConnected } = useStore();
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [symbols, setSymbols] = useState<string[]>(['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD']);
  const [newSymbol, setNewSymbol] = useState('');
  const [showAddSymbol, setShowAddSymbol] = useState(false);

  useEffect(() => {
    if (wsConnected && user?.api_key) {
      // Subscribe to live prices
      wsManager.subscribeToPrices(user.api_key, symbols);

      // Listen for price updates
      const handlePriceUpdate = (data: any) => {
        if (data.symbol && data.bid && data.ask) {
          setPrices(prev => {
            const newPrices = new Map(prev);
            const existing = newPrices.get(data.symbol);
            
            const priceData: PriceData = {
              symbol: data.symbol,
              bid: data.bid,
              ask: data.ask,
              last: data.last || data.bid,
              change: data.change || 0,
              changePercent: data.change_percent || 0,
            };

            newPrices.set(data.symbol, priceData);
            return newPrices;
          });
        }
      };

      wsManager.on('price_update', handlePriceUpdate);

      // Set up interval to request price updates
      const interval = setInterval(() => {
        if (wsConnected && user?.api_key) {
          wsManager.send({
            api_key: user.api_key,
            action: 'GET_PRICES',
            symbols,
          });
        }
      }, 1000); // Update every second

      return () => {
        clearInterval(interval);
        wsManager.off('price_update', handlePriceUpdate);
        if (user?.api_key) {
          wsManager.unsubscribeFromPrices(user.api_key, symbols);
        }
      };
    }
  }, [wsConnected, user, symbols]);

  const handleAddSymbol = () => {
    if (newSymbol && !symbols.includes(newSymbol.toUpperCase())) {
      const upper = newSymbol.toUpperCase();
      setSymbols([...symbols, upper]);
      setNewSymbol('');
      setShowAddSymbol(false);

      if (wsConnected && user?.api_key) {
        wsManager.subscribeToPrices(user.api_key, [upper]);
      }
    }
  };

  const handleRemoveSymbol = (symbol: string) => {
    setSymbols(symbols.filter(s => s !== symbol));
    setPrices(prev => {
      const newPrices = new Map(prev);
      newPrices.delete(symbol);
      return newPrices;
    });

    if (wsConnected && user?.api_key) {
      wsManager.unsubscribeFromPrices(user.api_key, [symbol]);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Live Prices</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time forex rates
            {wsConnected && <span className="ml-2 text-green-600">● Connected</span>}
            {!wsConnected && <span className="ml-2 text-red-600">● Disconnected</span>}
          </p>
        </div>
        <button
          onClick={() => setShowAddSymbol(!showAddSymbol)}
          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          title="Add Symbol"
        >
          <Plus size={20} />
        </button>
      </div>

      {showAddSymbol && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
              placeholder="EURUSD"
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm"
            />
            <button
              onClick={handleAddSymbol}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {symbols.map((symbol) => {
          const priceData = prices.get(symbol);
          const isPositive = priceData && priceData.changePercent >= 0;

          return (
            <div
              key={symbol}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {symbol}
                    </h3>
                    {priceData && (
                      <span className={`flex items-center text-xs font-medium ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {priceData.changePercent.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  {priceData ? (
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Bid: <strong className="text-gray-900 dark:text-white">{priceData.bid.toFixed(5)}</strong>
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Ask: <strong className="text-gray-900 dark:text-white">{priceData.ask.toFixed(5)}</strong>
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">Loading...</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemoveSymbol(symbol)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Remove"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {symbols.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No symbols added. Click + to add symbols.</p>
        </div>
      )}
    </div>
  );
}
