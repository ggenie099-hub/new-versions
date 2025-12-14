'use client';

import { Brain, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

interface MarketNarrativeProps {
  data: {
    narrative: string;
    key_observations: string[];
    smart_money_bias: string;
    action_recommendation: string;
    confidence: number;
  } | null;
  loading?: boolean;
}

export default function MarketNarrativeCard({ data, loading }: MarketNarrativeProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Market Insight</h3>
        <p className="text-gray-500 dark:text-gray-400">Connect MT5 to view market narrative</p>
      </div>
    );
  }

  const biasIcons: Record<string, any> = {
    buying: TrendingUp,
    selling: TrendingDown,
    neutral: Minus,
    unclear: Clock,
  };

  const biasColors: Record<string, string> = {
    buying: 'text-green-500 bg-green-500/10',
    selling: 'text-red-500 bg-red-500/10',
    neutral: 'text-gray-500 bg-gray-500/10',
    unclear: 'text-yellow-500 bg-yellow-500/10',
  };

  const actionColors: Record<string, string> = {
    wait: 'text-gray-500 bg-gray-500/10',
    prepare: 'text-yellow-500 bg-yellow-500/10',
    act_cautiously: 'text-blue-500 bg-blue-500/10',
    act_confidently: 'text-green-500 bg-green-500/10',
  };

  const actionLabels: Record<string, string> = {
    wait: 'Wait',
    prepare: 'Prepare',
    act_cautiously: 'Act Cautiously',
    act_confidently: 'Act Confidently',
  };

  const BiasIcon = biasIcons[data.smart_money_bias] || Minus;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Brain size={20} className="text-purple-500" />
          AI Market Insight
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {data.confidence}% confidence
        </div>
      </div>

      {/* Main Narrative */}
      <div className="p-4 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-lg mb-4 border border-purple-500/10">
        <p className="text-gray-700 dark:text-gray-200 leading-relaxed italic">
          "{data.narrative}"
        </p>
      </div>

      {/* Key Observations */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Key Observations</p>
        <div className="flex flex-wrap gap-2">
          {data.key_observations.map((obs, idx) => (
            <span key={idx} className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
              {obs}
            </span>
          ))}
        </div>
      </div>

      {/* Smart Money & Action */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg ${biasColors[data.smart_money_bias]}`}>
          <p className="text-xs opacity-70 mb-1">Smart Money Bias</p>
          <div className="flex items-center gap-2">
            <BiasIcon size={18} />
            <span className="font-semibold capitalize">{data.smart_money_bias}</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${actionColors[data.action_recommendation]}`}>
          <p className="text-xs opacity-70 mb-1">Recommendation</p>
          <span className="font-semibold">{actionLabels[data.action_recommendation]}</span>
        </div>
      </div>
    </div>
  );
}
