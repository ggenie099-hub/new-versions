'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { useStore } from '@/store/useStore';
import { authAPI, notificationAPI } from '@/lib/api';
import { wsManager } from '@/lib/websocket';
import { clsx } from 'clsx';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser, setUnreadCount, setWsConnected, theme, sidebarMinimized, setSidebarMinimized } = useStore();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('access_token');
    console.log('DashboardLayout - Token check:', token ? 'Token exists' : 'No token');
    
    if (!token) {
      console.log('No token found, redirecting to login...');
      router.push('/login');
      return;
    }

    console.log('Token found, loading user data...');
    // Load user data
    loadUserData();
    
    // Load unread notifications count
    loadUnreadCount();

    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply saved sidebar minimized state
    const savedSidebarMin = localStorage.getItem('sidebarMinimized');
    if (savedSidebarMin) {
      setSidebarMinimized(savedSidebarMin === 'true');
    }
  }, []);

  const loadUserData = async () => {
    try {
      console.log('Fetching user data from API...');
      const response = await authAPI.getCurrentUser();
      console.log('User data loaded successfully:', response.data);
      setUser(response.data);
      
      // Connect WebSocket
      connectWebSocket(response.data);
    } catch (error: any) {
      console.error('Failed to load user data:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error detail:', error.response?.data);
      
      // If unauthorized, try explicit refresh once before logout
      if (error.response?.status === 401) {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            console.log('Attempting token refresh...');
            const r = await authAPI.refresh(refreshToken);
            const { access_token, refresh_token } = r.data;
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            console.log('Refresh successful, retrying user fetch...');
            const me = await authAPI.getCurrentUser();
            setUser(me.data);
            connectWebSocket(me.data);
            return;
          }
        } catch (refreshError) {
          console.error('Refresh failed:', refreshError);
        }
        console.log('Unauthorized after refresh attempt, clearing tokens and redirecting...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
      }
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const connectWebSocket = (user: any) => {
    const wsToken = user.websocket_url?.split('/').pop() || 'default';
    
    wsManager.connect(user.id, wsToken, user.api_key);
    
    wsManager.on('connection', (data) => {
      setWsConnected(data.status === 'connected');
    });
    
    wsManager.on('success', (data) => {
      console.log('Trade executed:', data);
      loadUnreadCount();
    });
    
    wsManager.on('error', (data) => {
      console.error('WebSocket error:', data);
    });
  };

  return (
    <div className={clsx('min-h-screen', theme)}>
      <Sidebar />
      <main
        className={clsx(
          'transition-all duration-300',
          'ml-0',
          sidebarMinimized ? 'lg:ml-16' : 'lg:ml-64',
          'min-h-screen bg-gray-50 dark:bg-black'
        )}
      >
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
