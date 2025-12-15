type SubscriptionCallback = (data: any) => void;

class HyperliquidWebSocket {
    private ws: WebSocket | null = null;
    private url: string = "wss://api.hyperliquid.xyz/ws";
    private subscribers: Map<string, Set<SubscriptionCallback>> = new Map();
    private reconnectTimer: NodeJS.Timeout | null = null;
    private pingInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.connect();
    }

    private connect() {
        if (typeof window === "undefined") return; // Don't connect on server

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log("Hyperliquid WS Connected");
            this.resubscribe();
            this.startPing();
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                const channel = message.channel;

                // Handle pong
                if (message.channel === "pong") return;

                // Dispatch to subscribers
                // The channel name in the message might differ slightly from subscription
                // For candles: { channel: "candle", data: { ... } }
                // We subscribe with { type: "candle", coin: "BTC", interval: "15m" }
                // But the message comes back with channel "candle".
                // We need to route based on the data content or maintain a mapping.

                // For simplicity, we will dispatch based on the 'channel' field in the response
                // and let subscribers filter if needed.
                // Actually, for candles, the message structure is:
                // { channel: "candle", data: { ... } }
                // We can use a key like "candle:BTC:15m" for internal routing if we want,
                // but the raw message doesn't always have the subscription params in the top level.
                // Let's just notify all listeners of a channel.

                if (this.subscribers.has(channel)) {
                    this.subscribers.get(channel)?.forEach((callback) => callback(message));
                }
            } catch (e) {
                console.error("WS Message Parse Error", e);
            }
        };

        this.ws.onclose = () => {
            console.log("Hyperliquid WS Disconnected");
            this.stopPing();
            this.scheduleReconnect();
        };

        this.ws.onerror = (err) => {
            console.error("Hyperliquid WS Error", err);
        };
    }

    private startPing() {
        this.stopPing();
        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ method: "ping" }));
            }
        }, 50000); // Send ping every 50s (Hyperliquid requires periodic traffic or pings)
    }

    private stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, 5000);
    }

    private resubscribe() {
        // Re-send all active subscriptions
        // This is tricky because we need to know the original subscription message.
        // For now, we'll rely on components re-subscribing or implement a better tracker later.
        // Actually, let's just expose a subscribe method that sends the message.
    }

    public subscribe(subscription: any, callback: SubscriptionCallback) {
        const channel = subscription.type; // e.g., "candle", "l2Book"

        if (!this.subscribers.has(channel)) {
            this.subscribers.set(channel, new Set());
        }
        this.subscribers.get(channel)?.add(callback);

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                method: "subscribe",
                subscription: subscription
            }));
        } else if (this.ws?.readyState === WebSocket.CONNECTING) {
            // Wait for open
            const onOpen = () => {
                this.ws?.send(JSON.stringify({
                    method: "subscribe",
                    subscription: subscription
                }));
                this.ws?.removeEventListener("open", onOpen);
            };
            this.ws?.addEventListener("open", onOpen);
        }

        return () => {
            this.subscribers.get(channel)?.delete(callback);
            // Optional: Unsubscribe if no listeners left
        };
    }
}

// Singleton instance
export const wsManager = new HyperliquidWebSocket();
