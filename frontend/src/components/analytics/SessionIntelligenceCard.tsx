'use client';

import { Clock, Droplets, TrendingUp } from 'lucide-react';

interface SessionIntelligenceProps {
  data: {
    active_session: string;
    session_name: string;
    liquidity_quality: string;
    false_breakout_probability: number;
    spread_condition: string;
    best_pairs: string[];
    avoid_pairs: string[];
    color_code: string;
    notes: string;
  } | null;
  loading?: boolean;
}

export default function SessionIntelligenceCard({ data, loading }: SessionIntelligenceProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Session Intelligence</h3>
        <p className="text-gray-500 dark:text-gray-400">Loading session data...</p>
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
  };

  const bgColorMap: Record<string, string> = {
    green: 'bg-green-500/10',
    yellow: 'bg-yellow-500/10',
    red: 'bg-red-500/10',
  };

  const liquidityColors: Record<string, string> = {
    high: 'text-green-500 bg-green-500/10',
    medium: 'text-yellow-500 bg-yellow-500/10',
    low: 'text-red-500 bg-red-500/10',
  };

  const spreadColors: Record<string, string> = {
    tight: 'text-green-500',
    normal: 'text-yellow-500',
    wide: 'text-red-500',
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock size={20} />
          Session Intelligence
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${liquidityColors[data.liquidity_quality]}`}>
          {data.liquidity_quality.charAt(0).toUpperCase() + data.liquidity_quality.slice(1)} Liquidity
        </div>
      </div>

      {/* Active Session */}
      <div className={`p-4 rounded-lg mb-4 ${bgColorMap[data.color_code]}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">Active Session</p>
        <p className={`text-2xl font-bold ${colorMap[data.color_code]}`}>{data.session_name}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-gray-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">False Breakout Risk</p>
          </div>
          <p className={`text-lg font-semibold ${data.false_breakout_probability > 50 ? 'text-red-500' : 'text-green-500'}`}>
            {data.false_breakout_probability}%
          </p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Droplets size={14} className="text-gray-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Spread</p>
          </div>
          <p className={`text-lg font-semibold capitalize ${spreadColors[data.spread_condition]}`}>
            {data.spread_condition}
          </p>
        </div>
      </div>

      {/* Best Pairs */}
      {data.best_pairs.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Best Pairs for This Session</p>
          <div className="flex flex-wrap gap-1">
            {data.best_pairs.map((pair, idx) => (
              <span key={idx} className="px-2 py-1 text-xs bg-green-500/10 text-green-600 dark:text-green-400 rounded">
                {pair}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Avoid Pairs */}
      {data.avoid_pairs.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Avoid</p>
          <div className="flex flex-wrap gap-1">
            {data.avoid_pairs.map((pair, idx) => (
              <span key={idx} className="px-2 py-1 text-xs bg-red-500/10 text-red-600 dark:text-red-400 rounded">
                {pair}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{data.notes}</p>
    </div>
  );
}
