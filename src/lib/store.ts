import { create } from 'zustand';

export interface Position {
    coin: string;
    entryPrice: number;
    size: number; // Positive for long, negative for short
    leverage: number;
    liquidationPrice: number;
    margin: number;
    unrealizedPnl: number;
    roe: number;
    tp?: number;
    sl?: number;
}

export interface Order {
    id: string;
    coin: string;
    type: 'Limit' | 'Market' | 'Stop Limit' | 'Stop Market';
    side: 'Buy' | 'Sell';
    price: number;
    size: number;
    filled: number;
    status: 'Open' | 'Filled' | 'Cancelled';
    timestamp: number;
    reduceOnly?: boolean;
    postOnly?: boolean;
    triggerPrice?: number; // For Stop orders
    tp?: number;
    sl?: number;
}

export interface Trade {
    id: string;
    coin: string;
    side: 'Buy' | 'Sell';
    price: number;
    size: number;
    time: number;
}

interface MarketState {
    currentPrice: number;
    change24h: number;
    volume24h: number; // in USD
    fundingRate: number;
    nextFundingTime: number;
    recentTrades: Trade[]; // Public market trades
}

interface TradeState {
    coin: string;
    positions: Position[];
    openOrders: Order[];
    orderHistory: Order[];
    tradeHistory: Trade[]; // User's trade history

    // Actions
    setCoin: (coin: string) => void;
    placeOrder: (order: Omit<Order, 'id' | 'filled' | 'status' | 'timestamp'>) => void;
    cancelOrder: (id: string) => void;
    closePosition: (coin: string) => void;
    updateMarket: (data: Partial<MarketState>) => void;
}

interface AccountState {
    isConnected: boolean;
    address: string | null;
    usdcBalance: number;

    // Actions
    connectMock: () => void;
    disconnect: () => void;
}

interface StoreState extends TradeState, MarketState, AccountState { }

export const useStore = create<StoreState>((set, get) => ({
    // Market Defaults
    currentPrice: 98000.50,
    change24h: 2.5,
    volume24h: 1500000000,
    fundingRate: 0.0001, // 0.01%
    nextFundingTime: Date.now() + 3600000,
    recentTrades: [],

    // Trading Defaults
    coin: "BTC",
    positions: [],
    openOrders: [],
    orderHistory: [],
    tradeHistory: [],

    // Account Defaults
    isConnected: false,
    address: null,
    usdcBalance: 10000, // 10k mock balance

    // Actions
    setCoin: (coin) => set({ coin }),

    connectMock: () => set({
        isConnected: true,
        address: "0xMockUser...8888",
        usdcBalance: 10000
    }),

    disconnect: () => set({
        isConnected: false,
        address: null
    }),

    updateMarket: (data) => set((state) => ({ ...state, ...data })),

    placeOrder: (orderParams) => {
        const state = get();
        const id = Math.random().toString(36).substr(2, 9);
        const timestamp = Date.now();

        const order: Order = {
            ...orderParams,
            id,
            filled: 0,
            status: 'Open',
            timestamp,
        };

        const isMarket = order.type === 'Market' || order.type === 'Stop Market'; // Simplified logic

        if (isMarket) {
            // Execute immediately for Market orders
            const { currentPrice } = state;
            const executionPrice = currentPrice; // Slippage could be added here
            const cost = order.size * executionPrice;

            // Create a position
            const newPosition: Position = {
                coin: order.coin,
                entryPrice: executionPrice,
                size: order.side === 'Buy' ? order.size : -order.size,
                leverage: 20, // Default or passed in? Store should probably track current leverage preference per coin
                liquidationPrice: order.side === 'Buy' ? executionPrice * 0.9 : executionPrice * 1.1,
                margin: cost / 20,
                unrealizedPnl: 0,
                roe: 0,
                tp: order.tp,
                sl: order.sl,
            };

            // Check if position already exists and merge
            const existingPosIndex = state.positions.findIndex(p => p.coin === order.coin);
            let updatedPositions = [...state.positions];

            if (existingPosIndex >= 0) {
                const existing = state.positions[existingPosIndex];
                const totalSize = existing.size + newPosition.size;
                if (Math.abs(totalSize) < 0.000001) { // Closed
                    updatedPositions = updatedPositions.filter(p => p.coin !== order.coin);
                } else {
                    // Weighted average entry
                    const totalCost = (Math.abs(existing.size) * existing.entryPrice) + (Math.abs(newPosition.size) * newPosition.entryPrice);
                    const newEntry = totalCost / Math.abs(totalSize); // Simplified approximation
                    updatedPositions[existingPosIndex] = {
                        ...existing,
                        size: totalSize,
                        entryPrice: newEntry,
                        margin: existing.margin + newPosition.margin
                    };
                }
            } else {
                updatedPositions.push(newPosition);
            }

            // Record Trade
            const trade: Trade = {
                id: Math.random().toString(36).substr(2, 9),
                coin: order.coin,
                side: order.side,
                price: executionPrice,
                size: order.size,
                time: timestamp
            };

            set({
                positions: updatedPositions,
                orderHistory: [
                    { ...order, status: 'Filled', filled: order.size },
                    ...state.orderHistory
                ],
                tradeHistory: [trade, ...state.tradeHistory],
                recentTrades: [trade, ...state.recentTrades.slice(0, 49)], // Add to public tape too for effect
            });

        } else {
            // Limit orders go to Open Orders
            set((state) => ({
                openOrders: [order, ...state.openOrders]
            }));
        }
    },

    cancelOrder: (id) => set((state) => ({
        openOrders: state.openOrders.filter(o => o.id !== id),
        orderHistory: state.orderHistory.map(o => o.id === id ? { ...o, status: 'Cancelled' } : o) // Move to history if needed or just drop
    })),

    closePosition: (coin) => set((state) => ({
        positions: state.positions.filter(p => p.coin !== coin)
    })),
}));
