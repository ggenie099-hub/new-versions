'use client';

import { TrendingUp, TrendingDown, Activity, BarChart3, Zap, Waves, GitBranch, ArrowRight } from 'lucide-react';

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

// Visual regime indicator component
function RegimeVisual({ condition, direction, confidence }: { condition: string; direction: string; confidence: number }) {
  const regimeConfig: Record<string, { icon: any; color: string; bgColor: string; description: string; tradingTip: string }> = {
    trending: {
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      description: 'Strong directional movement',
      tradingTip: 'Follow the trend, use pullbacks for entry'
    },
    ranging: {
      icon: Waves,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500',
      description: 'Price moving sideways',
      tradingTip: 'Trade support/resistance levels'
    },
    volatile: {
      icon: Zap,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
      description: 'High price swings',
      tradingTip: 'Use wider stops, reduce position size'
    },
    choppy: {
      icon: GitBranch,
      color: 'text-red-500',
      bgColor: 'bg-red-500',
      description: 'Unpredictable movements',
      tradingTip: 'Consider staying out or scalping only'
    }
  };

  const config = regimeConfig[condition] || regimeConfig.choppy;
  const Icon = config.icon;

  return (
    <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
      {/* Visual Regime Diagram */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${config.bgColor}/20`}>
            <Icon size={28} className={config.color} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Current Regime</p>
            <p className={`text-lg font-bold capitalize ${config.color}`}>{condition}</p>
          </div>
        </div>
        
        {/* Confidence Meter */}
        <div className="text-right">
          <p className="text-xs text-gray-400">Confidence</p>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${config.bgColor} transition-all duration-500`}
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className={`text-sm font-bold ${config.color}`}>{confidence.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Regime Visual Bar */}
      <div className="relative h-12 bg-gray-800 rounded-lg overflow-hidden mb-3">
        <div className="absolute inset-0 flex">
          <div className={`flex-1 flex items-center justify-center border-r border-gray-700 ${condition === 'trending' ? 'bg-green-500/30' : ''}`}>
            <TrendingUp size={16} className={condition === 'trending' ? 'text-green-400' : 'text-gray-600'} />
            <span className={`ml-1 text-xs ${condition === 'trending' ? 'text-green-400' : 'text-gray-600'}`}>Trend</span>
          </div>
          <div className={`flex-1 flex items-center justify-center border-r border-gray-700 ${condition === 'ranging' ? 'bg-blue-500/30' : ''}`}>
            <Waves size={16} className={condition === 'ranging' ? 'text-blue-400' : 'text-gray-600'} />
            <span className={`ml-1 text-xs ${condition === 'ranging' ? 'text-blue-400' : 'text-gray-600'}`}>Range</span>
          </div>
          <div className={`flex-1 flex items-center justify-center border-r border-gray-700 ${condition === 'volatile' ? 'bg-orange-500/30' : ''}`}>
            <Zap size={16} className={condition === 'volatile' ? 'text-orange-400' : 'text-gray-600'} />
            <span className={`ml-1 text-xs ${condition === 'volatile' ? 'text-orange-400' : 'text-gray-600'}`}>Volatile</span>
          </div>
          <div className={`flex-1 flex items-center justify-center ${condition === 'choppy' ? 'bg-red-500/30' : ''}`}>
            <GitBranch size={16} className={condition === 'choppy' ? 'text-red-400' : 'text-gray-600'} />
            <span className={`ml-1 text-xs ${condition === 'choppy' ? 'text-red-400' : 'text-gray-600'}`}>Choppy</span>
          </div>
        </div>
      </div>

      {/* Direction Arrow */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Direction:</span>
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${
            direction === 'bullish' ? 'bg-green-500/20 text-green-400' :
            direction === 'bearish' ? 'bg-red-500/20 text-red-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {direction === 'bullish' ? <TrendingUp size={14} /> :
             direction === 'bearish' ? <TrendingDown size={14} /> :
             <ArrowRight size={14} />}
            <span className="capitalize font-medium">{direction}</span>
          </div>
        </div>
        <div className="text-gray-400 text-xs">
          💡 {config.tradingTip}
        </div>
      </div>
    </div>
  );
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

      {/* Visual Regime Diagram */}
      <RegimeVisual condition={data.condition} direction={data.direction} confidence={data.confidence} />

      {/* Technical Indicators */}
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
