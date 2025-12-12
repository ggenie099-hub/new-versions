'use client';

import { useState } from 'react';
import { CreditCard, Users, DollarSign, TrendingUp, Edit3, Check, X } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  userCount: number;
  revenue: number;
  color: string;
}

const defaultPlans: Plan[] = [
  { id: 'free', name: 'Free', price: 0, interval: 'monthly', features: ['5 trades/day', 'Basic AI chat', '1 MT5 account', 'Email support'], userCount: 892, revenue: 0, color: 'text-gray-400' },
  { id: 'pro', name: 'Pro', price: 29, interval: 'monthly', features: ['Unlimited trades', 'All AI agents', '5 MT5 accounts', 'Priority support', 'Backtesting', 'Custom alerts'], userCount: 234, revenue: 6786, color: 'text-primary-500' },
  { id: 'enterprise', name: 'Enterprise', price: 99, interval: 'monthly', features: ['Everything in Pro', 'Unlimited MT5', 'API access', 'Dedicated support', 'Custom agents', 'White-label'], userCount: 45, revenue: 4455, color: 'text-purple-500' },
];

interface Subscription {
  id: number;
  user: string;
  email: string;
  plan: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  nextBilling: string;
  amount: number;
}

const mockSubscriptions: Subscription[] = [
  { id: 1, user: 'Rahul Sharma', email: 'rahul@example.com', plan: 'Pro', status: 'active', startDate: '2024-06-15', nextBilling: '2025-01-15', amount: 29 },
  { id: 2, user: 'Amit Kumar', email: 'amit@example.com', plan: 'Enterprise', status: 'active', startDate: '2024-03-10', nextBilling: '2025-01-10', amount: 99 },
  { id: 3, user: 'Priya Patel', email: 'priya@example.com', plan: 'Pro', status: 'cancelled', startDate: '2024-08-20', nextBilling: '-', amount: 29 },
  { id: 4, user: 'Sneha Gupta', email: 'sneha@example.com', plan: 'Pro', status: 'active', startDate: '2024-07-05', nextBilling: '2025-01-05', amount: 29 },
];

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [subscriptions] = useState<Subscription[]>(mockSubscriptions);
  const [editPlan, setEditPlan] = useState<string | null>(null);

  const totalRevenue = plans.reduce((a, p) => a + p.revenue, 0);
  const totalUsers = plans.reduce((a, p) => a + p.userCount, 0);
  const paidUsers = plans.filter(p => p.price > 0).reduce((a, p) => a + p.userCount, 0);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
        <p className="text-gray-400 text-sm">Manage subscription plans and view revenue</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg"><DollarSign size={20} className="text-green-500"/></div>
          </div>
          <p className="text-2xl font-bold text-white">${totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Monthly Revenue</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg"><Users size={20} className="text-blue-500"/></div>
          </div>
          <p className="text-2xl font-bold text-white">{totalUsers.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Users</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-500/10 rounded-lg"><CreditCard size={20} className="text-primary-500"/></div>
          </div>
          <p className="text-2xl font-bold text-white">{paidUsers}</p>
          <p className="text-sm text-gray-500">Paid Users</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg"><TrendingUp size={20} className="text-purple-500"/></div>
          </div>
          <p className="text-2xl font-bold text-white">{((paidUsers / totalUsers) * 100).toFixed(1)}%</p>
          <p className="text-sm text-gray-500">Conversion Rate</p>
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-lg font-semibold text-white mb-4">Subscription Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {plans.map(plan => (
          <div key={plan.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${plan.color}`}>{plan.name}</h3>
              <button onClick={() => setEditPlan(editPlan === plan.id ? null : plan.id)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
                <Edit3 size={16}/>
              </button>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-white">${plan.price}</span>
              <span className="text-gray-500">/{plan.interval}</span>
            </div>
            <ul className="space-y-2 mb-4">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                  <Check size={14} className="text-primary-500"/>{f}
                </li>
              ))}
            </ul>
            <div className="pt-4 border-t border-gray-800 grid grid-cols-2 gap-4">
              <div>
                <p className="text-lg font-bold text-white">{plan.userCount}</p>
                <p className="text-xs text-gray-500">Users</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-500">${plan.revenue}</p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Subscriptions */}
      <h2 className="text-lg font-semibold text-white mb-4">Recent Subscriptions</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">User</th>
              <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">Plan</th>
              <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">Status</th>
              <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">Start Date</th>
              <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">Next Billing</th>
              <th className="text-right px-5 py-4 text-sm font-medium text-gray-400">Amount</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map(sub => (
              <tr key={sub.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-white">{sub.user}</p>
                  <p className="text-xs text-gray-500">{sub.email}</p>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${sub.plan === 'Enterprise' ? 'bg-purple-500/20 text-purple-400' : sub.plan === 'Pro' ? 'bg-primary-500/20 text-primary-400' : 'bg-gray-700 text-gray-400'}`}>
                    {sub.plan}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${sub.status === 'active' ? 'bg-green-500/20 text-green-400' : sub.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-400">{sub.startDate}</td>
                <td className="px-5 py-4 text-sm text-gray-400">{sub.nextBilling}</td>
                <td className="px-5 py-4 text-sm text-white text-right">${sub.amount}/mo</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
