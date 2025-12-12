'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useStore } from '@/store/useStore';
import { mt5API, symbolAPI } from '@/lib/api';
import { Key, Link as LinkIcon, Copy, Check, Search, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const { user } = useStore();
  const [mt5Accounts, setMT5Accounts] = useState<any[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [jsonParams, setJsonParams] = useState({
    action: 'BUY',
    volume: 0.01,
    stop_loss: '',
    take_profit: '',
  });
  const [generatedJson, setGeneratedJson] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newAccount, setNewAccount] = useState({
    account_number: '',
    password: '',
    server: '',
    account_type: 'demo',
    broker: '',
  });

  useEffect(() => {
    loadAccountsData();
  }, []);

  useEffect(() => {
    const searchSymbols = async () => {
      if (symbolSearch.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await symbolAPI.search(symbolSearch);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Symbol search failed:', error);
      }
    };

    const timer = setTimeout(searchSymbols, 300);
    return () => clearTimeout(timer);
  }, [symbolSearch]);

  const loadAccountsData = async () => {
    try {
      const response = await mt5API.getAccounts();
      setMT5Accounts(response.data);
    } catch (error) {
      toast.error('Failed to load MT5 accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mt5API.createAccount(newAccount);
      toast.success('MT5 account added successfully');
      setShowAddAccount(false);
      setNewAccount({
        account_number: '',
        password: '',
        server: '',
        account_type: 'demo',
        broker: '',
      });
      loadAccountsData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add account');
    }
  };

  const handleConnect = async (accountId: number) => {
    try {
      await mt5API.connectAccount(accountId);
      toast.success('Connected to MT5 account');
      loadAccountsData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to connect');
    }
  };

  const handleDisconnect = async (accountId: number) => {
    try {
      await mt5API.disconnectAccount(accountId);
      toast.success('Disconnected from MT5 account');
      loadAccountsData();
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      await mt5API.deleteAccount(accountId);
      toast.success('Account deleted');
      loadAccountsData();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const handleGenerateJson = async () => {
    if (!selectedSymbol) {
      toast.error('Please select a symbol');
      return;
    }

    try {
      const params = {
        symbol: selectedSymbol,
        action: jsonParams.action,
        volume: jsonParams.volume,
        ...(jsonParams.stop_loss && { stop_loss: parseFloat(jsonParams.stop_loss) }),
        ...(jsonParams.take_profit && { take_profit: parseFloat(jsonParams.take_profit) }),
      };

      const response = await symbolAPI.generateJSON(params);
      setGeneratedJson(response.data.example);
      toast.success('JSON generated successfully');
    } catch (error) {
      toast.error('Failed to generate JSON');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedJson);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyApiKey = () => {
    if (user?.api_key) {
      navigator.clipboard.writeText(user.api_key);
      toast.success('API Key copied to clipboard');
    }
  };

  const handleCopyWebSocketUrl = () => {
    if (user?.websocket_url) {
      navigator.clipboard.writeText(user.websocket_url);
      toast.success('WebSocket URL copied to clipboard');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account</h1>

        {/* API Credentials Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Key className="mr-2" size={24} />
            API Credentials
          </h2>
          
          <div className="space-y-4">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                API Key
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={user?.api_key || ''}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono text-sm"
                />
                <button
                  onClick={handleCopyApiKey}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>

            {/* WebSocket URL */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                WebSocket URL
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={user?.websocket_url || ''}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono text-sm"
                />
                <button
                  onClick={handleCopyWebSocketUrl}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* JSON Generator Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            TradingView JSON Message Generator
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              {/* Symbol Search */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Symbol Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={symbolSearch}
                    onChange={(e) => setSymbolSearch(e.target.value)}
                    placeholder="Search symbols (e.g., EURUSD)"
                    className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  
                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedSymbol(result.symbol);
                            setSymbolSearch(result.symbol);
                            setSearchResults([]);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <div className="font-semibold">{result.symbol}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{result.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Action
                </label>
                <select
                  value={jsonParams.action}
                  onChange={(e) => setJsonParams({ ...jsonParams, action: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                  <option value="CLOSE">CLOSE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Volume
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={jsonParams.volume}
                  onChange={(e) => setJsonParams({ ...jsonParams, volume: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Stop Loss (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={jsonParams.stop_loss}
                    onChange={(e) => setJsonParams({ ...jsonParams, stop_loss: e.target.value })}
                    placeholder="0.00000"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Take Profit (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={jsonParams.take_profit}
                    onChange={(e) => setJsonParams({ ...jsonParams, take_profit: e.target.value })}
                    placeholder="0.00000"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateJson}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Generate JSON
              </button>
            </div>

            {/* Output Section */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Generated JSON for TradingView Alert
              </label>
              <div className="relative">
                <textarea
                  value={generatedJson}
                  readOnly
                  rows={14}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="Generated JSON will appear here..."
                />
                {generatedJson && (
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Copy this JSON and paste it into your TradingView alert message.
              </p>
            </div>
          </div>
        </div>

        {/* MT5 Accounts Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">MT5 Accounts</h2>
            <button
              onClick={() => setShowAddAccount(!showAddAccount)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={20} />
              <span>Add Account</span>
            </button>
          </div>

          {/* Add Account Form */}
          {showAddAccount && (
            <form onSubmit={handleAddAccount} className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New MT5 Account</h3>
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
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
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
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
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
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
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
                    value={newAccount.broker}
                    onChange={(e) => setNewAccount({ ...newAccount, broker: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
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
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="demo">Demo Account</option>
                    <option value="live">Live Account</option>
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add MT5 Account
              </button>
            </form>
          )}

          {/* Accounts List */}
          <div className="space-y-4">
            {mt5Accounts.length > 0 ? (
              mt5Accounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
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
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {account.server} {account.broker && `• ${account.broker}`}
                      </p>
                      {account.is_connected && (
                        <div className="grid grid-cols-3 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Balance</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${account.balance.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Equity</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${account.equity.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Profit</p>
                            <p className={`text-sm font-semibold ${
                              account.profit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${account.profit.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {account.is_connected ? (
                        <button
                          onClick={() => handleDisconnect(account.id)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(account.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Connect
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                No MT5 accounts added yet. Add an account to get started.
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
