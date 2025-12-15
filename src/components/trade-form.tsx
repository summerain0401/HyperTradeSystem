"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function TradeForm({ coin }: { coin: string }) {
    // Wallet & Store
    const { isConnected: isWalletConnected } = useAccount()
    const { isConnected: isMockConnected, connectMock, placeOrder, usdcBalance, currentPrice } = useStore()
    const isConnected = isWalletConnected || isMockConnected;

    // Form State
    const [side, setSide] = useState<"Buy" | "Sell">("Buy")
    const [orderType, setOrderType] = useState<"Limit" | "Market" | "Stop">("Limit")
    const [price, setPrice] = useState("")
    const [size, setSize] = useState("")
    const [leverage, setLeverage] = useState(20)

    // Advanced Options
    const [reduceOnly, setReduceOnly] = useState(false)
    const [postOnly, setPostOnly] = useState(false)
    const [tpSlEnabled, setTpSlEnabled] = useState(false)
    const [tp, setTp] = useState("")
    const [sl, setSl] = useState("")

    // Calculations
    const numPrice = parseFloat(price) || currentPrice; // Use market price if empty/market
    const numSize = parseFloat(size) || 0;
    const orderValue = numPrice * numSize;
    const requiredMargin = orderValue / leverage;
    const available = usdcBalance; // Simplified

    // Percentage Slider Logic
    const handleSliderChange = (vals: number[]) => {
        const pct = vals[0] / 100;
        const maxVal = available * leverage;
        const maxAsset = maxVal / numPrice;
        setSize((maxAsset * pct).toFixed(4));
    }


    const handlePlaceOrder = (paramSide: "Buy" | "Sell") => {
        if (isMockConnected) {
            setSide(paramSide); // Keep UI in sync

            const finalType = orderType === "Stop" ? "Stop Market" : orderType;

            // Ensure inputs are valid
            const finalPrice = parseFloat(price) || currentPrice;
            const finalSize = parseFloat(size) || 0;

            if (finalSize <= 0) {
                console.error("Invalid size");
                return;
            }

            placeOrder({
                coin,
                side: paramSide,
                type: finalType,
                price: finalPrice,
                size: finalSize,
                reduceOnly,
                postOnly,
                tp: tpSlEnabled ? parseFloat(tp) : undefined,
                sl: tpSlEnabled ? parseFloat(sl) : undefined,
            });
        }
    }

    if (!isConnected) {
        return (
            <Card className="h-full border-0 shadow-none rounded-none border-l flex flex-col">
                <CardHeader className="p-3 border-b">
                    <CardTitle className="text-sm font-medium">Trade</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
                    <ConnectButton />
                    <Button variant="outline" onClick={connectMock} className="w-full text-xs">
                        Start Mock Trading
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full border-0 shadow-none rounded-none border-l flex flex-col bg-card font-sans">
            {/* Header: Leverage & Margin Mode */}
            <div className="p-3 border-b flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-2">
                    <div className="bg-secondary px-2 py-1 rounded text-xs font-medium cursor-pointer hover:bg-secondary/80 transition-colors">
                        Cross
                    </div>
                    <div className="bg-secondary px-2 py-1 rounded text-xs font-medium cursor-pointer hover:bg-secondary/80 transition-colors flex items-center gap-1 group">
                        <span>{leverage}x</span>
                        {/* Leverage Popover/Tooltip simulation */}
                    </div>
                </div>
                {/* Leverage Slider (Mini) */}
                <div className="w-24">
                    <Slider
                        defaultValue={[20]}
                        max={50}
                        step={1}
                        value={[leverage]}
                        onValueChange={(v) => setLeverage(v[0])}
                        className="h-4"
                    />
                </div>
            </div>

            <CardContent className="p-3 space-y-4 flex-1 overflow-y-auto">
                {/* Order Type Tabs */}
                <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-8 bg-muted/50 rounded-md p-0.5">
                        <TabsTrigger value="Limit" className="text-xs h-7 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">Limit</TabsTrigger>
                        <TabsTrigger value="Market" className="text-xs h-7 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">Market</TabsTrigger>
                        <TabsTrigger value="Stop" className="text-xs h-7 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">Stop</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Inputs */}
                <div className="space-y-4">
                    {/* Price Input */}
                    {orderType !== "Market" && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                                <span>Price</span>
                                <span>USDC</span>
                            </div>
                            <div className="relative">
                                <Input
                                    type="number"
                                    className="text-right font-mono h-9 pr-2"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder={currentPrice.toFixed(1)}
                                />
                                <div className="absolute left-3 top-2.5 text-xs text-muted-foreground">USD</div>
                            </div>
                        </div>
                    )}

                    {/* Size Input */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                            <span>Size</span>
                            <span className="cursor-pointer hover:text-foreground">Max</span>
                        </div>
                        <div className="relative">
                            <Input
                                type="number"
                                className="text-right font-mono h-9 pr-2"
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                                placeholder="0.00"
                            />
                            <div className="absolute left-3 top-2.5 text-xs text-muted-foreground">{coin}</div>
                        </div>
                    </div>

                    {/* Value Input (Readonly/Calc) */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                            <span>Order Value</span>
                        </div>
                        <div className="relative">
                            <Input
                                type="number"
                                className="text-right font-mono h-9 pr-2 bg-muted/20"
                                value={orderValue > 0 ? orderValue.toFixed(2) : ""}
                                readOnly
                                placeholder="0.00"
                            />
                            <div className="absolute left-3 top-2.5 text-xs text-muted-foreground">USDC</div>
                        </div>
                    </div>

                    {/* Percentage Slider */}
                    <div className="pt-2 px-1">
                        <Slider
                            defaultValue={[0]}
                            max={100}
                            step={25}
                            onValueChange={handleSliderChange}
                            className="py-1"
                        />
                        <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-mono">
                            <span>0%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>

                {/* Advanced Options */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="reduce" checked={reduceOnly} onCheckedChange={(c) => setReduceOnly(!!c)} />
                        <Label htmlFor="reduce" className="text-xs font-normal cursor-pointer">Reduce Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="tpsl" checked={tpSlEnabled} onCheckedChange={(c) => setTpSlEnabled(!!c)} />
                        <Label htmlFor="tpsl" className="text-xs font-normal cursor-pointer">TP / SL</Label>
                    </div>

                    {tpSlEnabled && (
                        <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground">TP (Price)</span>
                                <Input
                                    className="h-7 text-xs font-mono"
                                    placeholder="Take Profit"
                                    value={tp}
                                    onChange={(e) => setTp(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground">SL (Price)</span>
                                <Input
                                    className="h-7 text-xs font-mono"
                                    placeholder="Stop Loss"
                                    value={sl}
                                    onChange={(e) => setSl(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Account Stats */}
                <div className="pt-4 mt-auto space-y-2 border-t text-xs">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Available</span>
                        <span className="font-mono">{usdcBalance.toFixed(2)} USDC</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Margin Req.</span>
                        <span className="font-mono">{requiredMargin.toFixed(2)} USDC</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Fee (0.02%)</span>
                        <span className="font-mono">{(orderValue * 0.0002).toFixed(4)} USDC</span>
                    </div>
                </div>
            </CardContent>

            {/* Buttons */}
            <div className="p-3 grid grid-cols-2 gap-3 border-t bg-background">
                <Button
                    variant="default"
                    className="bg-green-500 hover:bg-green-600 text-white font-bold"
                    onClick={() => { setSide("Buy"); setPrice(currentPrice.toString()); handlePlaceOrder("Buy"); }}
                >
                    Buy / Long
                </Button>
                <Button
                    variant="default"
                    className="bg-red-500 hover:bg-red-600 text-white font-bold"
                    onClick={() => { setSide("Sell"); setPrice(currentPrice.toString()); handlePlaceOrder("Sell"); }}
                >
                    Sell / Short
                </Button>
            </div>
        </Card>
    )
}
