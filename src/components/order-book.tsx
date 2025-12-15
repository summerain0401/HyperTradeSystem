"use client"

import { useEffect, useState } from "react"
import { getL2Book, L2BookResponse } from "@/lib/hyperliquid-api"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore } from "@/lib/store"
import { format } from "date-fns"
import { wsManager } from "@/lib/websocket"


export function OrderBook({ coin }: { coin: string }) {
    const [book, setBook] = useState<L2BookResponse | null>(null)
    const [trades, setTrades] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState("book")

    useEffect(() => {
        // Clear state on coin change
        setBook(null)
        setTrades([])

        // Subscribe to L2 Book
        const unsubscribeBook = wsManager.subscribe({ type: "l2Book", coin }, (msg: any) => {
            if (msg.channel === "l2Book" && msg.data.coin === coin) {
                setBook(msg.data)
            }
        })

        // Subscribe to Trades
        const unsubscribeTrades = wsManager.subscribe({ type: "trades", coin }, (msg: any) => {
            if (msg.channel === "trades") {
                // Trades message data is an array of trades
                const newTrades = msg.data.filter((t: any) => t.coin === coin)
                if (newTrades.length > 0) {
                    setTrades(prev => {
                        const updated = [...newTrades, ...prev].slice(0, 50)
                        return updated
                    })
                }
            }
        })

        return () => {
            unsubscribeBook()
            unsubscribeTrades()
        }
    }, [coin]) // Re-subscribe when coin changes

    // No explicit loading state needed as we show "Loading..." or empty if null

    if (!book && activeTab === 'book') {
        return <div className="p-4 text-center text-xs text-muted-foreground">Connecting...</div>
    }

    // Process levels for visual depth
    const asksToDisplay = book ? book.levels[1].slice(0, 15).reverse() : []
    const bidsToDisplay = book ? book.levels[0].slice(0, 15) : []

    // Find max size to calculate depth bar width
    const maxAskSize = Math.max(...asksToDisplay.map(l => parseFloat(l.sz)), 0)
    const maxBidSize = Math.max(...bidsToDisplay.map(l => parseFloat(l.sz)), 0)
    const maxSize = Math.max(maxAskSize, maxBidSize) || 1

    return (
        <Card className="h-full border-0 shadow-none rounded-none flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <CardHeader className="p-0 border-b">
                    <TabsList className="w-full justify-start rounded-none h-9 bg-card">
                        <TabsTrigger value="book" className="text-xs h-9 rounded-none data-[state=active]:bg-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-primary px-4">
                            Order Book
                        </TabsTrigger>
                        <TabsTrigger value="trades" className="text-xs h-9 rounded-none data-[state=active]:bg-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-primary px-4">
                            Recent Trades
                        </TabsTrigger>
                    </TabsList>
                </CardHeader>

                <CardContent className="p-0 flex-1 overflow-hidden relative">
                    <TabsContent value="book" className="h-full m-0 p-0 grid grid-rows-2 absolute inset-0">
                        {/* Asks (Top) */}
                        <div className="flex flex-col justify-end border-b overflow-hidden">
                            <Table>
                                <TableBody>
                                    {asksToDisplay.map((level, i) => {
                                        const size = parseFloat(level.sz);
                                        const widthPct = maxSize > 0 ? Math.min((size / maxSize) * 100, 100) : 0;
                                        return (
                                            <TableRow key={i} className="h-5 border-0 hover:bg-muted/50 relative">
                                                {/* Depth Bar */}
                                                <div className="absolute top-0 right-0 bottom-0 bg-red-500/10 z-0" style={{ width: `${widthPct}%` }} />

                                                <TableCell className="p-0 px-2 text-[10px] text-red-500 text-left font-mono z-10 relative">
                                                    {parseFloat(level.px).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="p-0 px-2 text-[10px] text-right font-mono z-10 relative text-muted-foreground w-1/3">
                                                    {size.toFixed(3)}
                                                </TableCell>
                                                <TableCell className="p-0 px-2 text-[10px] text-right font-mono z-10 relative w-1/3">
                                                    {(size * parseFloat(level.px)).toFixed(0)}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Bids (Bottom) */}
                        <div className="flex flex-col justify-start overflow-hidden">
                            <Table>
                                <TableBody>
                                    {bidsToDisplay.map((level, i) => {
                                        const size = parseFloat(level.sz);
                                        const widthPct = maxSize > 0 ? Math.min((size / maxSize) * 100, 100) : 0;
                                        return (
                                            <TableRow key={i} className="h-5 border-0 hover:bg-muted/50 relative">
                                                {/* Depth Bar */}
                                                <div className="absolute top-0 right-0 bottom-0 bg-green-500/10 z-0" style={{ width: `${widthPct}%` }} />

                                                <TableCell className="p-0 px-2 text-[10px] text-green-500 text-left font-mono z-10 relative">
                                                    {parseFloat(level.px).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="p-0 px-2 text-[10px] text-right font-mono z-10 relative text-muted-foreground w-1/3">
                                                    {size.toFixed(3)}
                                                </TableCell>
                                                <TableCell className="p-0 px-2 text-[10px] text-right font-mono z-10 relative w-1/3">
                                                    {(size * parseFloat(level.px)).toFixed(0)}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="trades" className="h-full m-0 p-0 overflow-auto absolute inset-0">
                        <div className="grid grid-cols-3 px-2 py-1 text-[10px] text-muted-foreground border-b font-medium sticky top-0 bg-card z-10">
                            <span>Price</span>
                            <span className="text-right">Size</span>
                            <span className="text-right">Time</span>
                        </div>
                        <div className="flex flex-col">
                            {trades.length === 0 ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">Waiting for trades...</div>
                            ) : (
                                trades.map((trade, i) => (
                                    <div key={i} className="grid grid-cols-3 px-2 py-1 text-[10px] font-mono hover:bg-muted/50">
                                        <span className={trade.side === "B" ? "text-green-500" : "text-red-500"}>
                                            {parseFloat(trade.px).toFixed(2)}
                                        </span>
                                        <span className="text-right text-foreground">
                                            {parseFloat(trade.sz).toFixed(4)}
                                        </span>
                                        <span className="text-right text-muted-foreground">
                                            {format(new Date(trade.time), "HH:mm:ss")}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </CardContent>
            </Tabs>
        </Card>
    )
}
