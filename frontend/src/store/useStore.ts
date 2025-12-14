import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  username: string;
  api_key: string;
  websocket_url: string;
  subscription_tier: string;
  role?: string;
}

interface MT5Account {
  id: number;
  account_number: string;
  server: string;
  account_type: string;
  is_connected: boolean;
  balance: number;
  equity: number;
  profit: number;
  margin: number;
  free_margin: number;
}

interface Trade {
  id: number;
  symbol: string;
  order_type: string;
  volume: number;
  open_price: number;
  profit: number;
  status: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface Store {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  sidebarMinimized: boolean;
  setSidebarMinimized: (minimized: boolean) => void;
  toggleSidebarMinimized: () => void;
  
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  
  // MT5 Accounts
  mt5Accounts: MT5Account[];
  setMT5Accounts: (accounts: MT5Account[]) => void;
  activeAccount: MT5Account | null;
  setActiveAccount: (account: MT5Account | null) => void;
  
  // Trades
  trades: Trade[];
  setTrades: (trades: Trade[]) => void;
  
  // Notifications
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  
  // WebSocket
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
}

export const useStore = create<Store>((set) => ({
  // Theme
  theme: 'dark',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    return { theme: newTheme };
  }),
  
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  sidebarMinimized: false,
  setSidebarMinimized: (minimized) => set(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarMinimized', minimized ? 'true' : 'false');
    }
    return { sidebarMinimized: minimized };
  }),
  toggleSidebarMinimized: () => set((state) => {
    const next = !state.sidebarMinimized;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarMinimized', next ? 'true' : 'false');
    }
    return { sidebarMinimized: next };
  }),
  
  // User
  user: null,
  setUser: (user) => set({ user }),
  
  // MT5 Accounts
  mt5Accounts: [],
  setMT5Accounts: (accounts) => set({ mt5Accounts: accounts }),
  activeAccount: null,
  setActiveAccount: (account) => set({ activeAccount: account }),
  
  // Trades
  trades: [],
  setTrades: (trades) => set({ trades }),
  
  // Notifications
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  
  // WebSocket
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
