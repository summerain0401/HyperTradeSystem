
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { WalletConnect } from "@/components/wallet-connect"
import { TokenSelector } from "@/components/token-selector"
import { useStore } from "@/lib/store"
import { useEffect } from "react"
import { getMarketInfo } from "@/lib/hyperliquid-api"

interface HeaderProps {
    coin: string
    setCoin: (coin: string) => void
}

export function Header({ coin, setCoin }: HeaderProps) {
    const pathname = usePathname()
    const { currentPrice, change24h, fundingRate, updateMarket } = useStore()

    // Fetch market data periodically
    useEffect(() => {
        const fetchMarket = async () => {
            try {
                const info = await getMarketInfo(coin);
                if (info) {
                    updateMarket({
                        currentPrice: info.price,
                        fundingRate: info.funding,
                        // We can't get 24h change easily from that EP without calcs, stick to mock or prev
                    });
                }
            } catch (e) {
                console.error("Failed to fetch market info", e);
            }
        };

        fetchMarket();
        const interval = setInterval(fetchMarket, 5000);
        return () => clearInterval(interval);
    }, [coin, updateMarket]);

    const tabs = [
        { name: "Perps", href: "/" },
        { name: "Spot", href: "/spot" },
        { name: "Portfolio", href: "/portfolio" },
    ]

    const isPositive = change24h >= 0;

    return (
        <header className="h-14 border-b flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2 mr-4">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="font-bold text-primary-foreground">H</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight hidden md:block">HyperTrade</span>
                </Link>

                <TokenSelector value={coin} onChange={setCoin} />

                {/* Market Stats Bar */}
                <div className="flex items-center gap-4 text-xs font-mono border-l pl-4 ml-2">
                    <div className="flex flex-col">
                        <span className={`font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}>
                            {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-muted-foreground text-[10px]">Price</span>
                    </div>
                    <div className="flex flex-col">
                        <span className={`font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                            {isPositive ? "+" : ""}{change24h.toFixed(2)}%
                        </span>
                        <span className="text-muted-foreground text-[10px]">24h Change</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-orange-500 font-medium">
                            {(fundingRate * 100).toFixed(4)}%
                        </span>
                        <span className="text-muted-foreground text-[10px]">Funding</span>
                    </div>
                </div>

                <div className="h-6 w-px bg-border mx-2 hidden lg:block" />

                <nav className="hidden lg:flex items-center gap-1">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                                pathname === tab.href
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            {tab.name}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Mainnet</span>
                    </div>
                </div>
                <WalletConnect />
            </div>
        </header>
    )
}

