'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { mt5API } from '@/lib/api';
import { Plus, Server, Key as KeyIcon, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AddAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mt5Accounts, setMT5Accounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [newAccount, setNewAccount] = useState({
    account_number: '',
    password: '',
    server: '',
    account_type: 'demo',
    broker: '',
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await mt5API.getAccounts();
      setMT5Accounts(response.data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await mt5API.createAccount(newAccount);
      toast.success('MT5 account added successfully!');
      
      // Reset form
      setNewAccount({
        account_number: '',
        password: '',
        server: '',
        account_type: 'demo',
        broker: '',
      });

      // Reload accounts list
      loadAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (accountId: number) => {
    try {
      await mt5API.connectAccount(accountId);
      toast.success('Connected to MT5 account');
      loadAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to connect');
    }
  };

  const handleDisconnect = async (accountId: number) => {
    try {
      await mt5API.disconnectAccount(accountId);
      toast.success('Disconnected from MT5 account');
      loadAccounts();
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const handleDelete = async (accountId: number) => {
    if (!confirm('Are you sure you want to delete this MT5 account?')) {
      return;
    }

    try {
      await mt5API.deleteAccount(accountId);
      toast.success('Account deleted successfully');
      loadAccounts();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add MT5 Account</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect your MetaTrader 5 account to start trading
          </p>
        </div>

        {/* Existing MT5 Accounts */}
        {!loadingAccounts && mt5Accounts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Your MT5 Accounts ({mt5Accounts.length})
            </h2>
            <div className="space-y-3">
              {mt5Accounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {account.account_number}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          account.is_connected
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {account.is_connected ? 'Connected' : 'Disconnected'}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase ${
                          account.account_type === 'demo'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {account.account_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {account.server} {account.broker && `• ${account.broker}`}
                      </p>
                      {account.is_connected && (
                        <div className="grid grid-cols-3 gap-3 mt-2">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Balance</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${account.balance?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Equity</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${account.equity?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Profit</p>
                            <p className={`text-sm font-semibold ${
                              account.profit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${account.profit?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {account.is_connected ? (
                        <button
                          onClick={() => handleDisconnect(account.id)}
                          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(account.id)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Connect
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        title="Delete Account"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <Server className="text-blue-600 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Server Name</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Example: ICMarkets-Demo, XMGlobal-Demo01
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start space-x-3">
              <KeyIcon className="text-green-600 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Credentials</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Use your MT5 login credentials (Account & Password)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Account Form */}
        <form onSubmit={handleAddAccount} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Details</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                placeholder="12345678"
                required
                autoComplete="off"
                value={newAccount.account_number}
                onChange={(e) => setNewAccount({ ...newAccount, account_number: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Password *
              </label>
              <input
                type="password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                value={newAccount.password}
                onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Server */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Server *
              </label>
              <input
                type="text"
                placeholder="ICMarkets-Demo"
                required
                autoComplete="off"
                value={newAccount.server}
                onChange={(e) => setNewAccount({ ...newAccount, server: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Broker Name */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Broker Name (Optional)
              </label>
              <input
                type="text"
                placeholder="IC Markets"
                autoComplete="off"
                value={newAccount.broker}
                onChange={(e) => setNewAccount({ ...newAccount, broker: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Account Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Account Type *
              </label>
              <select
                value={newAccount.account_type}
                onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="demo">Demo Account</option>
                <option value="live">Live Account</option>
              </select>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            <span>{loading ? 'Adding Account...' : 'Add MT5 Account'}</span>
          </button>
        </form>

        {/* Help Section */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Need Help?</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Find your account number and server in your MT5 platform</li>
            <li>• Your password is the same password you use to login to MT5</li>
            <li>• Server format: BrokerName-Demo or BrokerName-Live</li>
            <li>• All credentials are encrypted and stored securely</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
