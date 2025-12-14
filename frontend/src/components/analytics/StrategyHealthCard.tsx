'use client';

import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface StrategyHealthProps {
  data: Array<{
    strategy_name: string;
    confidence: number;
    status: string;
    win_rate_20: number;
    recent_drawdown: number;
    regime_compatible: boolean;
    color_code: string;
    notes: string;
  }>;
  loading?: boolean;
}

export default function StrategyHealthCard({ data, loading }: StrategyHealthProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
          <Activity size={20} />
          Strategy Health
        </h3>
        <p className="text-gray-500 dark:text-gray-400">No strategy data available</p>
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
  };

  const bgColorMap: Record<string, string> = {
    green: 'bg-green-500/10 border-green-500/30',
    yellow: 'bg-yellow-500/10 border-yellow-500/30',
    red: 'bg-red-500/10 border-red-500/30',
  };

  const statusIcons: Record<string, any> = {
    healthy: CheckCircle,
    weak: AlertTriangle,
    disabled: XCircle,
  };

  const statusLabels: Record<string, string> = {
    healthy: 'Healthy',
    weak: 'Weak',
    disabled: 'Disabled',
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
        <Activity size={20} />
        Strategy Health
      </h3>

      <div className="space-y-4">
        {data.map((strategy, idx) => {
          const StatusIcon = statusIcons[strategy.status] || AlertTriangle;

          return (
            <div key={idx} className={`p-4 rounded-lg border ${bgColorMap[strategy.color_code]}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusIcon size={18} className={colorMap[strategy.color_code]} />
                  <span className="font-semibold text-gray-900 dark:text-white">{strategy.strategy_name}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${colorMap[strategy.color_code]} ${bgColorMap[strategy.color_code]}`}>
                  {statusLabels[strategy.status]}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center p-2 bg-gray-100 dark:bg-gray-700/50 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                  <p className={`text-lg font-bold ${colorMap[strategy.color_code]}`}>
                    {strategy.confidence.toFixed(0)}%
                  </p>
                </div>
                <div className="text-center p-2 bg-gray-100 dark:bg-gray-700/50 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Win Rate (20)</p>
                  <p className={`text-lg font-bold ${strategy.win_rate_20 >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                    {strategy.win_rate_20.toFixed(0)}%
                  </p>
                </div>
                <div className="text-center p-2 bg-gray-100 dark:bg-gray-700/50 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Drawdown</p>
                  <p className={`text-lg font-bold ${strategy.recent_drawdown > 100 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    ${strategy.recent_drawdown.toFixed(0)}
                  </p>
                </div>
              </div>

              {/* Regime Compatibility */}
              <div className="flex items-center gap-2 mb-2">
                {strategy.regime_compatible ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <XCircle size={14} className="text-red-500" />
                )}
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {strategy.regime_compatible ? 'Compatible with current market regime' : 'Not optimal for current regime'}
                </span>
              </div>

              {/* Notes */}
              <p className="text-sm text-gray-600 dark:text-gray-300">{strategy.notes}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
