'use client';

import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

interface MarketRegimeProps {
  data: {
    condition: string;
    direction: string;
    confidence: number;
    atr_ratio: number;
    adx_strength: number;
    rsi_slope: number;
    volume_expansion: boolean;
    color_code: string;
    summary: string;
  } | null;
  loading?: boolean;
}

export default function MarketRegimeCard({ data, loading }: MarketRegimeProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Market Regime</h3>
        <p className="text-gray-500 dark:text-gray-400">Connect MT5 to view market analysis</p>
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const bgColorMap: Record<string, string> = {
    green: 'bg-green-500/10 border-green-500/30',
    yellow: 'bg-yellow-500/10 border-yellow-500/30',
    red: 'bg-red-500/10 border-red-500/30',
  };

  const textColorMap: Record<string, string> = {
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
  };

  const DirectionIcon = data.direction === 'bullish' ? TrendingUp : 
                        data.direction === 'bearish' ? TrendingDown : Activity;

  return (
    <div className={`p-6 rounded-xl border ${bgColorMap[data.color_code]} transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 size={20} />
          Market Regime
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${textColorMap[data.color_code]} ${bgColorMap[data.color_code]}`}>
          {data.confidence.toFixed(0)}% Confidence
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Condition</p>
          <p className={`text-xl font-bold capitalize ${textColorMap[data.color_code]}`}>
            {data.condition}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Direction</p>
          <div className="flex items-center gap-2">
            <DirectionIcon className={textColorMap[data.color_code]} size={20} />
            <p className={`text-xl font-bold capitalize ${textColorMap[data.color_code]}`}>
              {data.direction}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4 text-sm">
        <div className="text-center p-2 bg-gray-100 dark:bg-gray-700/50 rounded">
          <p className="text-gray-500 dark:text-gray-400">ATR</p>
          <p className="font-semibold text-gray-900 dark:text-white">{(data.atr_ratio * 100).toFixed(2)}%</p>
        </div>
        <div className="text-center p-2 bg-gray-100 dark:bg-gray-700/50 rounded">
          <p className="text-gray-500 dark:text-gray-400">ADX</p>
          <p className="font-semibold text-gray-900 dark:text-white">{data.adx_strength.toFixed(1)}</p>
        </div>
        <div className="text-center p-2 bg-gray-100 dark:bg-gray-700/50 rounded">
          <p className="text-gray-500 dark:text-gray-400">RSI Slope</p>
          <p className="font-semibold text-gray-900 dark:text-white">{data.rsi_slope.toFixed(2)}</p>
        </div>
        <div className="text-center p-2 bg-gray-100 dark:bg-gray-700/50 rounded">
          <p className="text-gray-500 dark:text-gray-400">Volume</p>
          <p className={`font-semibold ${data.volume_expansion ? 'text-green-600' : 'text-gray-600'}`}>
            {data.volume_expansion ? '↑ Expanding' : '→ Normal'}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">{data.summary}</p>
    </div>
  );
}
