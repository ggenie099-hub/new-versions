'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useStore } from '@/store/useStore';
import { Check, Crown } from 'lucide-react';

export default function BillingPage() {
  const { user } = useStore();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '1 MT5 Account',
        '10 Trades per month',
        'Basic notifications',
        'Community support',
      ],
      current: user?.subscription_tier === 'free',
    },
    {
      name: 'Basic',
      price: '$19',
      period: 'per month',
      features: [
        '3 MT5 Accounts',
        'Unlimited Trades',
        'Real-time notifications',
        'Email support',
        'Trading history',
      ],
      current: user?.subscription_tier === 'basic',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$49',
      period: 'per month',
      features: [
        '10 MT5 Accounts',
        'Unlimited Trades',
        'Priority notifications',
        'Priority support',
        'Advanced analytics',
        'Custom webhooks',
      ],
      current: user?.subscription_tier === 'pro',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '$199',
      period: 'per month',
      features: [
        'Unlimited MT5 Accounts',
        'Unlimited Trades',
        'Dedicated server',
        '24/7 Priority support',
        'Advanced analytics',
        'Custom integrations',
        'White-label option',
      ],
      current: user?.subscription_tier === 'enterprise',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Choose the plan that best fits your trading needs
          </p>
        </div>

        {/* Current Plan */}
        <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-xl border border-primary-200 dark:border-primary-800">
          <div className="flex items-center space-x-3">
            <Crown className="text-primary-600" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Current Plan: {user?.subscription_tier?.toUpperCase() || 'FREE'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You are currently on the {user?.subscription_tier || 'free'} plan
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white dark:bg-gray-800 p-6 rounded-xl border-2 transition-all ${
                plan.popular
                  ? 'border-primary-600 shadow-xl scale-105'
                  : plan.current
                  ? 'border-primary-400 dark:border-primary-700'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-400'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    POPULAR
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Check className="text-primary-600 flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.current}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.current
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                    : plan.popular
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-primary-600 dark:hover:bg-primary-700'
                }`}
              >
                {plan.current ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>

        {/* Payment History */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Payment History
          </h2>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              No payment history available yet
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
