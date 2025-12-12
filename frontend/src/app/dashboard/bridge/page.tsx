'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useStore } from '@/store/useStore';
import { symbolAPI } from '@/lib/api';
import { Copy, Check, Search, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TradingViewBridgePage() {
  const { user, setUser } = useStore();
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
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebSocketUrl, setShowWebSocketUrl] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

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

  const handleRegenerateApiKey = async () => {
    if (!confirm('Are you sure you want to regenerate your API key? Your old key will stop working immediately.')) {
      return;
    }

    setRegenerating(true);
    try {
      const { authAPI } = await import('@/lib/api');
      const response = await authAPI.regenerateApiKey();
      setUser(response.data);
      toast.success('API Key regenerated successfully');
      setShowApiKey(true); // Show the new key
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to regenerate API key';
      toast.error(message);
    } finally {
      setRegenerating(false);
    }
  };

  const maskString = (str: string, visibleChars: number = 8) => {
    if (!str) return '';
    if (str.length <= visibleChars) return str;
    return str.substring(0, visibleChars) + '•'.repeat(str.length - visibleChars);
  };

  const getWebSocketUrl = () => {
    if (!user) return '';
    // Fix the WebSocket URL to use actual domain
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}//${window.location.hostname}:8000/ws`;
    return `${wsHost}/${user.id}/${user.api_key?.substring(0, 16)}`;
  };

  const getWebhookUrl = () => {
    // Get webhook URL based on current environment
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || `${protocol}//${hostname}:8000/api`;
    return `${apiUrl}/webhook/tradingview`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">TradingView Bridge</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate JSON messages for TradingView alerts
          </p>
        </div>

        {/* API Credentials Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Key className="mr-2" size={24} />
              API Credentials
            </h2>
            <button
              onClick={handleRegenerateApiKey}
              disabled={regenerating}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {regenerating ? 'Regenerating...' : 'Regenerate API Key'}
            </button>
          </div>
          
          <div className="space-y-4">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                API Key
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={showApiKey ? (user?.api_key || '') : maskString(user?.api_key || '', 8)}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono text-sm"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title={showApiKey ? 'Hide API Key' : 'Show API Key'}
                >
                  {showApiKey ? '👁️' : '👁️‍🗨️'}
                </button>
                <button
                  onClick={handleCopyApiKey}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  title="Copy API Key"
                >
                  <Copy size={20} />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use this API key in your TradingView alert JSON messages
              </p>
            </div>

            {/* Webhook URL */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Webhook URL (for TradingView Alerts)
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={getWebhookUrl()}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getWebhookUrl());
                      toast.success('Webhook URL copied');
                    }}
                    className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    title="Copy Webhook URL"
                  >
                    <Copy size={20} />
                  </button>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-xs text-green-800 dark:text-green-200 font-semibold mb-1">
                    ✅ ngrok URL (Use this in TradingView):
                  </p>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-xs bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-green-900 dark:text-green-100 break-all">
                      https://be066daa2d46.ngrok-free.app/api/webhook/tradingview
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('https://be066daa2d46.ngrok-free.app/api/webhook/tradingview');
                        toast.success('ngrok URL copied!');
                      }}
                      className="p-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      title="Copy ngrok URL"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use the ngrok URL above in TradingView (localhost won't work)
              </p>
            </div>

            {/* WebSocket URL */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                WebSocket URL (Advanced)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={showWebSocketUrl ? getWebSocketUrl() : maskString(getWebSocketUrl(), 20)}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono text-sm"
                />
                <button
                  onClick={() => setShowWebSocketUrl(!showWebSocketUrl)}
                  className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title={showWebSocketUrl ? 'Hide URL' : 'Show URL'}
                >
                  {showWebSocketUrl ? '👁️' : '👁️‍🗨️'}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getWebSocketUrl());
                    toast.success('WebSocket URL copied');
                  }}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  title="Copy WebSocket URL"
                >
                  <Copy size={20} />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                For direct WebSocket connections (advanced users only)
              </p>
            </div>
          </div>

          {/* Warning Boxes */}
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Security Warning:</strong> Keep your API key secret! Never share it publicly or commit it to version control. If exposed, regenerate it immediately.
              </p>
            </div>
            
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-2">
                🚨 Important: TradingView Webhook Limitation
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                TradingView only accepts webhooks on port 80 (HTTP) or 443 (HTTPS). Your local server runs on port 8000, which won't work.
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 font-semibold">
                Solution: Use ngrok to create a public URL
              </p>
              <ol className="text-xs text-red-700 dark:text-red-300 mt-2 space-y-1 list-decimal list-inside">
                <li>Download ngrok: <a href="https://ngrok.com/download" target="_blank" rel="noopener noreferrer" className="underline">ngrok.com/download</a></li>
                <li>Run: <code className="bg-red-100 dark:bg-red-900 px-1 rounded">ngrok http 8000</code></li>
                <li>Copy the HTTPS URL (e.g., https://abc123.ngrok.io)</li>
                <li>Use in TradingView: <code className="bg-red-100 dark:bg-red-900 px-1 rounded">https://abc123.ngrok.io/api/webhook/tradingview</code></li>
              </ol>
            </div>
          </div>
        </div>

        {/* JSON Generator Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            JSON Message Generator
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
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
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold mb-2">
                  📋 How to use in TradingView:
                </p>
                <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Create an alert in TradingView</li>
                  <li>Go to <strong>"Message"</strong> tab (not Settings)</li>
                  <li>Paste this JSON in the message field</li>
                  <li>Go to <strong>"Notifications"</strong> tab</li>
                  <li>Check "Webhook URL" and paste: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs break-all">https://be066daa2d46.ngrok-free.app/api/webhook/tradingview</code></li>
                  <li>Click "Create" to save the alert</li>
                </ol>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  💡 Tip: Copy the ngrok URL from the green box above (not localhost)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
