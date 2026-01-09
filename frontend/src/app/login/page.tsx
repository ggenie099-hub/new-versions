'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { TrendingUp, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { access_token, refresh_token } = response.data;

      console.log('Login successful, storing tokens...');
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // Fetch user data after login
      try {
        const userResponse = await authAPI.getCurrentUser();
        const userData = userResponse.data;
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('User data stored:', userData);
      } catch (userError) {
        console.error('Failed to fetch user data:', userError);
      }
      
      // Verify tokens were stored
      const storedToken = localStorage.getItem('access_token');
      console.log('Token verification after storage:', storedToken ? 'Token stored successfully' : 'Token NOT stored');
      console.log('Tokens stored, redirecting to dashboard...');

      toast.success('Login successful!');
      
      // Use router.replace instead of router.push to prevent back navigation
      // Also use window.location for more reliable redirect
      setLoading(false);
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        {/* Back to Home Button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center space-x-2 text-gray-400 hover:text-primary-500 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>
        <div className="flex items-center justify-center space-x-2 mb-8">
          <TrendingUp size={32} className="text-primary-500" />
          <h1 className="text-3xl font-bold text-white">Trading Maven</h1>
        </div>

        <h2 className="text-2xl font-semibold text-white mb-6 text-center">
          Login to Your Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary-500 hover:text-primary-400">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
