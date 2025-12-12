class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(userId: number, token: string, apiKey: string) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    const url = `${wsUrl}/${userId}/${token}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connection', { status: 'connected' });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', { message: 'WebSocket error occurred' });
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.emit('connection', { status: 'disconnected' });
      this.attemptReconnect(userId, token, apiKey);
    };
  }

  private attemptReconnect(userId: number, token: string, apiKey: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connect(userId, token, apiKey);
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('error', { message: 'Failed to reconnect to WebSocket' });
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  // Trading methods
  placeTrade(apiKey: string, symbol: string, action: string, volume: number, stopLoss?: number, takeProfit?: number) {
    this.send({
      api_key: apiKey,
      action: action.toUpperCase(),
      symbol,
      volume,
      stop_loss: stopLoss,
      take_profit: takeProfit,
    });
  }

  closePosition(apiKey: string, symbol?: string, ticket?: string) {
    this.send({
      api_key: apiKey,
      action: 'CLOSE',
      symbol,
      ticket,
    });
  }

  syncAccount(apiKey: string) {
    this.send({
      api_key: apiKey,
      action: 'SYNC',
    });
  }

  ping(apiKey: string) {
    this.send({
      api_key: apiKey,
      action: 'PING',
    });
  }

  // Subscribe to live prices for symbols
  subscribeToPrices(apiKey: string, symbols: string[]) {
    this.send({
      api_key: apiKey,
      action: 'SUBSCRIBE_PRICES',
      symbols,
    });
  }

  // Unsubscribe from live prices
  unsubscribeFromPrices(apiKey: string, symbols: string[]) {
    this.send({
      api_key: apiKey,
      action: 'UNSUBSCRIBE_PRICES',
      symbols,
    });
  }
}

export const wsManager = new WebSocketManager();
