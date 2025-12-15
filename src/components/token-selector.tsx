"use client"

import { useEffect, useState, useMemo } from "react"
import { Search, Star, ChevronDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getAllMarkets, GlobalMarketState } from "@/lib/hyperliquid-api"

interface TokenSelectorProps {
    value: string
    onChange: (value: string) => void
}

const CATEGORIES = ["All", "Favorites", "Layer 1", "Defi", "Meme", "RWA"]

export function TokenSelector({ value, onChange }: TokenSelectorProps) {
    const [open, setOpen] = useState(false)
    const [markets, setMarkets] = useState<GlobalMarketState[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [activeCategory, setActiveCategory] = useState("All")
    const [favorites, setFavorites] = useState<Set<string>>(new Set())

    // Mock favorites persistence
    useEffect(() => {
        const stored = localStorage.getItem("favorites")
        if (stored) {
            setFavorites(new Set(JSON.parse(stored)))
        }
    }, [])

    const toggleFavorite = (e: React.MouseEvent, coin: string) => {
        e.stopPropagation()
        const newFavs = new Set(favorites)
        if (newFavs.has(coin)) {
            newFavs.delete(coin)
        } else {
            newFavs.add(coin)
        }
        setFavorites(newFavs)
        localStorage.setItem("favorites", JSON.stringify(Array.from(newFavs)))
    }

    useEffect(() => {
        const fetchMarkets = async () => {
            try {
                const data = await getAllMarkets()
                // Sort by volume desc by default
                data.sort((a, b) => b.dayNtlVlm - a.dayNtlVlm)
                setMarkets(data)
            } catch (error) {
                console.error("Failed to fetch markets:", error)
            } finally {
                setLoading(false)
            }
        }
        if (open) {
            fetchMarkets()
            // Poll? Maybe later.
        }
    }, [open])

    const filteredMarkets = useMemo(() => {
        let result = markets

        // Search Filter
        if (search) {
            const q = search.toLowerCase()
            result = result.filter(m => m.coin.toLowerCase().includes(q))
        }

        // Category Filter
        if (activeCategory === "Favorites") {
            result = result.filter(m => favorites.has(m.coin))
        } else if (activeCategory !== "All") {
            // Mock category filtering logic
            // In a real app, we'd have tags in the data
            // For now, just show everything or maybe simple matches
            if (activeCategory === "Layer 1") result = result.filter(m => ["BTC", "ETH", "SOL", "AVAX"].includes(m.coin))
            if (activeCategory === "Meme") result = result.filter(m => ["DOGE", "SHIB", "PEPE", "WIF"].includes(m.coin))
        }

        return result
    }, [markets, search, activeCategory, favorites])

    const selectedMarket = markets.find(m => m.coin === value)

    const formatVol = (val: number) => {
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`
        if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`
        return `$${(val / 1e3).toFixed(2)}K`
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className="w-auto min-w-[180px] justify-between font-bold text-lg hover:bg-muted/50 p-2 h-12"
                >
                    <div className="flex items-center gap-3">
                        {/* Coin Icon Placeholder */}
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">
                            {value[0]}
                        </div>
                        <div className="flex flex-col items-start leading-none gap-1">
                            <div className="flex items-center gap-2">
                                <span>{value}USD</span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </div>
                            {selectedMarket && (
                                <span className={cn(
                                    "text-xs font-mono font-normal",
                                    selectedMarket.price > selectedMarket.prevDayPx ? "text-green-500" : "text-red-500"
                                )}>
                                    {selectedMarket.price.toFixed(selectedMarket.price < 1 ? 4 : 2)}
                                </span>
                            )}
                        </div>
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[800px] p-0 bg-[#121417] border-[#2A2E37] text-white" align="start">
                <div className="p-4 border-b border-border/10 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search"
                            className="bg-[#1E2026] border-none pl-9 h-9 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {/* Categories */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground overflow-x-auto no-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={cn(
                                    "whitespace-nowrap pb-1 border-b-2 border-transparent transition-colors hover:text-white",
                                    activeCategory === cat && "text-white border-primary font-medium"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 p-3 text-xs text-muted-foreground border-b border-white/5 font-medium">
                    <div className="col-span-4 pl-2">Markets</div>
                    <div className="col-span-2 text-right cursor-pointer hover:text-white flex items-center justify-end gap-1">
                        Price
                    </div>
                    <div className="col-span-2 text-right">24H Change</div>
                    <div className="col-span-2 text-right">Trading Vol.</div>
                    <div className="col-span-1 text-right">Fund. Rate</div>
                    <div className="col-span-1 text-right">OI</div>
                </div>

                {/* Table Body */}
                <div className="max-h-[500px] overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">Loading markets...</div>
                    ) : (
                        filteredMarkets.map(market => {
                            const change = ((market.price - market.prevDayPx) / market.prevDayPx) * 100
                            const isPositive = change >= 0
                            const formattedChange = (isPositive ? "+" : "") + change.toFixed(2) + "%"

                            return (
                                <div
                                    key={market.coin}
                                    onClick={() => {
                                        onChange(market.coin)
                                        setOpen(false)
                                    }}
                                    className="grid grid-cols-12 gap-2 p-3 hover:bg-white/5 cursor-pointer items-center text-sm border-b border-white/5 last:border-0 group"
                                >
                                    {/* Market Name */}
                                    <div className="col-span-4 flex items-center gap-3 pl-2">
                                        <button
                                            onClick={(e) => toggleFavorite(e, market.coin)}
                                            className="text-muted-foreground hover:text-yellow-400 focus:outline-none"
                                        >
                                            <Star className={cn("h-4 w-4", favorites.has(market.coin) && "fill-yellow-400 text-yellow-400")} />
                                        </button>
                                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                                            {market.coin[0]}
                                        </div>
                                        <span className="font-bold">{market.coin}USD</span>
                                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-white/10 text-white/70 hover:bg-white/20 rounded ml-2 font-normal hidden group-hover:inline-flex md:inline-flex">
                                            {market.maxLeverage}x
                                        </Badge>
                                    </div>

                                    {/* Price */}
                                    <div className="col-span-2 text-right font-mono">
                                        {market.price.toFixed(market.price < 1 ? 4 : 2)}
                                    </div>

                                    {/* Change */}
                                    <div className={cn("col-span-2 text-right font-mono", isPositive ? "text-green-500" : "text-red-500")}>
                                        {formattedChange}
                                    </div>

                                    {/* Volume */}
                                    <div className="col-span-2 text-right font-mono text-muted-foreground">
                                        {formatVol(market.dayNtlVlm)}
                                    </div>

                                    {/* Funding */}
                                    <div className={cn("col-span-1 text-right font-mono text-xs", market.funding > 0 ? "text-orange-400" : "text-green-400")}>
                                        {(market.funding * 100).toFixed(4)}%
                                    </div>

                                    {/* OI */}
                                    <div className="col-span-1 text-right font-mono text-xs text-muted-foreground">
                                        {formatVol(market.openInterest * market.price)}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
