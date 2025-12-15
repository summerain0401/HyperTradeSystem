
// Hyperliquid API Documentation & Implementation
// Base URLs
export const HL_BASE_URL_MAINNET = "https://api.hyperliquid.xyz";
export const HL_BASE_URL_TESTNET = "https://api.hyperliquid-testnet.xyz";
export const HL_WS_URL_MAINNET = "wss://api.hyperliquid.xyz/ws";
export const HL_WS_URL_TESTNET = "wss://api.hyperliquid-testnet.xyz/ws";

// ==========================================
// 1. INFO API (Read-only, Public)
// Endpoint: /info
// Method: POST
// Headers: { "Content-Type": "application/json" }
// ==========================================

export type InfoRequestType =
    | "meta"
    | "spotMeta"
    | "allMids"
    | "metaAndAssetCtxs"
    | "clearinghouseState" // User state
    | "openOrders"
    | "userFills"
    | "userFunding"
    | "l2Book"
    | "candleSnapshot";

export interface InfoRequest {
    type: InfoRequestType;
    [key: string]: any;
}

// --- Specific Payload Interfaces ---

export interface L2BookRequest extends InfoRequest {
    type: "l2Book";
    coin: string;
}

export interface CandleSnapshotRequest extends InfoRequest {
    type: "candleSnapshot";
    req: {
        coin: string;
        interval: "1m" | "5m" | "15m" | "1h" | "4h" | "8h" | "1d";
        startTime: number;
        endTime: number;
    };
}

export interface UserStateRequest extends InfoRequest {
    type: "clearinghouseState";
    user: string; // Address
}

export interface OpenOrdersRequest extends InfoRequest {
    type: "openOrders";
    user: string;
}

// --- Response Interfaces ---

export interface UniverseItem {
    name: string;
    szDecimals: number;
    maxLeverage: number;
    onlyIsolated: boolean;
}

export interface AssetCtx {
    dayNtlVlm: string;
    funding: string;
    impactPxs: string[]; // [bid_impact, ask_impact]
    markPx: string;
    midPx: string;
    openInterest: string;
    oraclePx: string;
    premium: string;
    prevDayPx: string;
}

export interface MetaAndAssetCtxsResponse {
    0: UniverseItem[];
    1: AssetCtx[];
}

export interface L2BookLevel {
    px: string;
    sz: string;
    n: number;
}

export interface L2BookResponse {
    coin: string;
    time: number;
    levels: [L2BookLevel[], L2BookLevel[]]; // [bids, asks]
}

export interface Candle {
    t: number; // Open 
    T: number; // Close
    s: string; // Symbol
    i: string; // Interval
    o: string; // Open
    c: string; // Close
    h: string; // High
    l: string; // Low
    v: string; // Volume
    n: number; // Trades
}

export interface UserPosition {
    coin: string;
    cumFunding: {
        allTime: string;
        sinceOpen: string;
        sinceChange: string;
    };
    entryPx: string;
    leverage: {
        type: "cross" | "isolated";
        value: number;
    };
    liquidationPx: string;
    marginUsed: string;
    positionValue: string;
    returnOnEquity: string;
    szi: string; // Size (signed)
    unrealizedPnl: string;
}

export interface UserStateResponse {
    assetPositions: {
        position: UserPosition;
        type: string;
    }[];
    crossMaintenanceMarginUsed: string;
    crossMarginSummary: {
        accountValue: string;
        totalMarginUsed: string;
        totalNtlPos: string;
        totalRawUsd: string;
    };
    marginSummary: {
        accountValue: string;
        totalMarginUsed: string;
        totalNtlPos: string;
        totalRawUsd: string;
    };
    withdrawable: string;
}

// --- Info API Function ---

export async function infoApi<T>(request: InfoRequest, isTestnet = false): Promise<T> {
    const url = (isTestnet ? HL_BASE_URL_TESTNET : HL_BASE_URL_MAINNET) + "/info";
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error(`Info API Error: ${response.statusText}`);
    }

    return response.json();
}


// ==========================================
// 2. EXCHANGE API (Execute Trades, Private)
// Endpoint: /exchange
// Method: POST
// Headers: { "Content-Type": "application/json" }
// Note: Requires signing via EIP-712 (handled by SDKs usually)
// ==========================================

export type ExchangeActionType =
    | "order"
    | "cancel"
    | "cancelByCloid"
    | "updateLeverage"
    | "usdClassTransfer";

export interface OrderWire {
    a: number; // Asset index
    b: boolean; // Is Buy?
    p: string; // Price
    s: string; // Size
    r: boolean; // Reduce Only
    t: { // Order Type
        limit?: { tif: "Gtc" | "Ioc" | "Alo" };
        trigger?: {
            isMarket: boolean;
            triggerPx: string;
            tpsl: "tp" | "sl";
        };
    };
    c?: string; // Cloid
}

export interface ExchangeRequest {
    action: {
        type: ExchangeActionType;
        orders?: OrderWire[]; // for 'order'
        cancels?: { a: number; o: number }[]; // for 'cancel'
        asset?: number; // for leverage
        isCross?: boolean; // for leverage
        leverage?: number; // for leverage
        amount?: string; // for transfer
        toPerp?: boolean; // for transfer
    };
    nonce: number;
    signature: { r: string; s: string; v: number };
    vaultAddress?: string;
}

// --- Exchange API Function (Skeleton) ---
// Actual signing implementation requires ethers/viem and is complex
export async function exchangeApi(request: ExchangeRequest, isTestnet = false) {
    const url = (isTestnet ? HL_BASE_URL_TESTNET : HL_BASE_URL_MAINNET) + "/exchange";
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error(`Exchange API Error: ${response.statusText}`);
    }

    return response.json();
}

// ==========================================
// 3. WEBSOCKET API (Real-time Data)
// Endpoint: /ws
// ==========================================

export type WsSubscriptionType =
    | "allMids"
    | "l2Book"
    | "trades"
    | "user"
    | "candle";

export interface WsSubscription {
    type: WsSubscriptionType;
    coin?: string;
    user?: string;
    interval?: string;
}

export interface WsMessage {
    method: "subscribe" | "unsubscribe";
    subscription: WsSubscription;
}

// Helper to get formatted subscription message
export function getSubscribeMessage(subscription: WsSubscription): string {
    return JSON.stringify({
        method: "subscribe",
        subscription
    });
}

// ==========================================
// 4. HELPER FUNCTIONS & MOCK DATA
// ==========================================

export interface GlobalMarketState {
    coin: string;
    price: number;
    prevDayPx: number;
    dayNtlVlm: number;
    funding: number;
    openInterest: number;
    maxLeverage: number;
}

const MOCK_MARKETS: GlobalMarketState[] = [
    { coin: "BTC", price: 95000.5, prevDayPx: 92000.0, dayNtlVlm: 1500000000, funding: 0.0001, openInterest: 500000000, maxLeverage: 50 },
    { coin: "ETH", price: 3500.2, prevDayPx: 3350.0, dayNtlVlm: 800000000, funding: 0.00015, openInterest: 200000000, maxLeverage: 50 },
    { coin: "SOL", price: 145.5, prevDayPx: 138.0, dayNtlVlm: 300000000, funding: 0.0002, openInterest: 50000000, maxLeverage: 50 },
    { coin: "DOGE", price: 0.15, prevDayPx: 0.14, dayNtlVlm: 100000000, funding: -0.0001, openInterest: 20000000, maxLeverage: 20 },
    { coin: "AVAX", price: 35.2, prevDayPx: 34.0, dayNtlVlm: 50000000, funding: 0.0001, openInterest: 15000000, maxLeverage: 20 },
    { coin: "WIF", price: 2.5, prevDayPx: 2.1, dayNtlVlm: 80000000, funding: 0.0005, openInterest: 10000000, maxLeverage: 10 },
    { coin: "PEPE", price: 0.000012, prevDayPx: 0.000011, dayNtlVlm: 60000000, funding: 0.0003, openInterest: 12000000, maxLeverage: 10 },
    { coin: "HYPE", price: 45.0, prevDayPx: 42.5, dayNtlVlm: 20000000, funding: 0.0001, openInterest: 5000000, maxLeverage: 20 },
    { coin: "ARB", price: 1.1, prevDayPx: 1.15, dayNtlVlm: 30000000, funding: 0.0001, openInterest: 25000000, maxLeverage: 20 },
    { coin: "SUI", price: 1.8, prevDayPx: 1.6, dayNtlVlm: 40000000, funding: 0.0002, openInterest: 20000000, maxLeverage: 20 },
];

export async function getL2Book(coin: string): Promise<L2BookResponse> {
    return infoApi<L2BookResponse>({ type: "l2Book", coin });
}

export async function getMeta(): Promise<any> {
    return infoApi({ type: "meta" });
}

export async function getCandles(coin: string, interval: string = "1h", startTime?: number, endTime?: number): Promise<Candle[]> {
    return infoApi<Candle[]>({
        type: "candleSnapshot",
        req: {
            coin,
            interval: interval as any,
            startTime: startTime || Date.now() - 24 * 60 * 60 * 1000,
            endTime: endTime || Date.now(),
        }
    });
}

export interface MarketInfo {
    coin: string;
    price: number;
    size: number;
    funding: number;
    fundingTime: number;
}

export async function getAllMarkets(): Promise<GlobalMarketState[]> {
    try {
        const response = await fetch(HL_BASE_URL_MAINNET + "/info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "metaAndAssetCtxs" }),
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json() as MetaAndAssetCtxsResponse;
        const universe = data[0];
        const assetCtxs = data[1];

        return universe.map((u: UniverseItem, i: number) => {
            const ctx = assetCtxs[i];
            return {
                coin: u.name,
                price: parseFloat(ctx.markPx),
                prevDayPx: parseFloat(ctx.prevDayPx),
                dayNtlVlm: parseFloat(ctx.dayNtlVlm),
                funding: parseFloat(ctx.funding),
                openInterest: parseFloat(ctx.openInterest),
                maxLeverage: u.maxLeverage,
            };
        });
    } catch (error) {
        console.warn("Using mock data for getAllMarkets due to error:", error);
        return MOCK_MARKETS;
    }
}

export async function getMarketInfo(coin: string): Promise<MarketInfo | null> {
    try {
        const response = await fetch(HL_BASE_URL_MAINNET + "/info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "metaAndAssetCtxs" })
        });
        
        if (!response.ok) return null;

        const data = await response.json() as MetaAndAssetCtxsResponse;
        const universe = data[0];
        const assetCtxs = data[1];

        const index = universe.findIndex((u: UniverseItem) => u.name === coin);
        if (index === -1) return null;

        const ctx = assetCtxs[index];

        return {
            coin,
            price: parseFloat(ctx.markPx),
            size: 0,
            funding: parseFloat(ctx.funding),
            fundingTime: 0
        };
    } catch (e) {
        console.error("Error fetching market info:", e);
        return null;
    }
}
