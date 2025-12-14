'use client';

import { ShieldAlert, ShieldCheck, AlertTriangle, Ban } from 'lucide-react';

interface TradeBlockerProps {
  data: {
    is_blocked: boolean;
    block_reasons: Array<{
      reason_code: string;
      description: string;
      severity: string;
    }>;
    spread_abnormal: boolean;
    volume_too_low: boolean;
    news_window_active: boolean;
    risk_limit_violated: boolean;
    can_override: boolean;
  } | null;
  loading?: boolean;
}

export default function TradeBlockerCard({ data, loading }: TradeBlockerProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // If no blocks, show minimal green status
  if (!data.is_blocked && data.block_reasons.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} className="text-green-500" />
          <div>
            <p className="font-semibold text-green-600 dark:text-green-400">Trading Enabled</p>
            <p className="text-sm text-green-600/70 dark:text-green-400/70">No blocking conditions detected</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border ${data.is_blocked ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {data.is_blocked ? (
            <Ban size={24} className="text-red-500" />
          ) : (
            <AlertTriangle size={24} className="text-yellow-500" />
          )}
          <div>
            <p className={`font-semibold ${data.is_blocked ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              {data.is_blocked ? 'Trading Blocked' : 'Trading Warnings'}
            </p>
          </div>
        </div>
        {data.can_override && data.is_blocked && (
          <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
            Can Override
          </span>
        )}
      </div>

      {/* Block Reasons */}
      <div className="space-y-2">
        {data.block_reasons.map((reason, idx) => (
          <div 
            key={idx} 
            className={`flex items-start gap-2 p-2 rounded ${reason.severity === 'block' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}
          >
            {reason.severity === 'block' ? (
              <Ban size={16} className="text-red-500 mt-0.5" />
            ) : (
              <AlertTriangle size={16} className="text-yellow-500 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-medium ${reason.severity === 'block' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                {reason.reason_code.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{reason.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Status Icons */}
      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className={`flex items-center gap-1 text-xs ${data.spread_abnormal ? 'text-red-500' : 'text-green-500'}`}>
          <div className={`w-2 h-2 rounded-full ${data.spread_abnormal ? 'bg-red-500' : 'bg-green-500'}`}></div>
          Spread
        </div>
        <div className={`flex items-center gap-1 text-xs ${data.volume_too_low ? 'text-red-500' : 'text-green-500'}`}>
          <div className={`w-2 h-2 rounded-full ${data.volume_too_low ? 'bg-red-500' : 'bg-green-500'}`}></div>
          Volume
        </div>
        <div className={`flex items-center gap-1 text-xs ${data.news_window_active ? 'text-yellow-500' : 'text-green-500'}`}>
          <div className={`w-2 h-2 rounded-full ${data.news_window_active ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          News
        </div>
        <div className={`flex items-center gap-1 text-xs ${data.risk_limit_violated ? 'text-red-500' : 'text-green-500'}`}>
          <div className={`w-2 h-2 rounded-full ${data.risk_limit_violated ? 'bg-red-500' : 'bg-green-500'}`}></div>
          Risk
        </div>
      </div>
    </div>
  );
}
