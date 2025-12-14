'use client';

import { Target, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface TradeQualityProps {
  data: Array<{
    ticket: number;
    symbol: string;
    score: number;
    positive_factors: string[];
    warnings: string[];
    recommendation: string;
    color_code: string;
  }>;
  loading?: boolean;
}

export default function TradeQualityCard({ data, loading }: TradeQualityProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
          <Target size={20} />
          Trade Quality
        </h3>
        <p className="text-gray-500 dark:text-gray-400">No open positions to analyze</p>
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

  const recommendationLabels: Record<string, { label: string; icon: any; color: string }> = {
    hold: { label: 'Hold', icon: CheckCircle, color: 'text-green-500' },
    partial_close: { label: 'Partial Close', icon: TrendingDown, color: 'text-yellow-500' },
    exit_early: { label: 'Exit Early', icon: AlertTriangle, color: 'text-red-500' },
    add_position: { label: 'Add Position', icon: TrendingUp, color: 'text-blue-500' },
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
        <Target size={20} />
        Trade Quality Scores
      </h3>

      <div className="space-y-4">
        {data.map((trade) => {
          const rec = recommendationLabels[trade.recommendation] || recommendationLabels.hold;
          const RecIcon = rec.icon;

          return (
            <div key={trade.ticket} className={`p-4 rounded-lg border ${bgColorMap[trade.color_code]}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">{trade.symbol}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">#{trade.ticket}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-2xl font-bold ${colorMap[trade.color_code]}`}>
                    {trade.score.toFixed(0)}
                    <span className="text-sm font-normal">%</span>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${rec.color} bg-opacity-10`}>
                    <RecIcon size={14} />
                    <span className="text-xs font-medium">{rec.label}</span>
                  </div>
                </div>
              </div>

              {/* Factors */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  {trade.positive_factors.slice(0, 3).map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle size={12} />
                      <span className="truncate">{factor}</span>
                    </div>
                  ))}
                </div>
                <div>
                  {trade.warnings.slice(0, 3).map((warning, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                      <AlertTriangle size={12} />
                      <span className="truncate">{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
