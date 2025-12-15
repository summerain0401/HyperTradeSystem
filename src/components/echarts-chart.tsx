"use client"

import React, { useEffect, useRef, useState } from "react"
import ReactECharts from "echarts-for-react"
import * as echarts from "echarts"
import { getCandles } from "@/lib/hyperliquid-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { wsManager } from "@/lib/websocket"

const INTERVALS = [
    { label: "15m", value: "15m" },
    { label: "1h", value: "1h" },
    { label: "4h", value: "4h" },
    { label: "1d", value: "1d" },
]

const UP_COLOR = "#22c55e"
const DOWN_COLOR = "#ef4444"

export function EChartsChart({ coin }: { coin: string }) {
    const echartsRef = useRef<ReactECharts>(null)
    const [loading, setLoading] = useState(true)
    const [interval, setInterval] = useState("15m")
    const [data, setData] = useState<any[]>([])

    const calculateMA = (dayCount: number, data: any[]) => {
        const result = []
        for (let i = 0, len = data.length; i < len; i++) {
            if (i < dayCount) {
                result.push("-")
                continue
            }
            let sum = 0
            for (let j = 0; j < dayCount; j++) {
                sum += data[i - j][1] // Close price is at index 1 in our mapped data
            }
            result.push((sum / dayCount).toFixed(2))
        }
        return result
    }

    const getOption = () => {
        const dates = data.map(item => item[0])
        const values = data.map(item => [item[1], item[2], item[3], item[4]]) // Open, Close, Low, High (ECharts expects Open, Close, Low, High)
        // Wait, ECharts Candlestick data: [open, close, lowest, highest]
        const volumes = data.map((item, index) => [index, item[5], item[1] > item[2] ? 1 : -1]) // [index, volume, sign]

        return {
            backgroundColor: "transparent",
            animation: false,
            legend: {
                bottom: 10,
                left: "center",
                data: ["Candle", "MA5", "MA10", "MA30"],
                textStyle: { color: "#9ca3af" }
            },
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "cross" },
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 10,
                textStyle: { color: "#000" },
            },
            axisPointer: {
                link: [{ xAxisIndex: "all" }],
                label: { backgroundColor: "#777" },
            },
            visualMap: {
                show: false,
                seriesIndex: 4, // Volume series
                dimension: 2,
                pieces: [
                    { value: 1, color: DOWN_COLOR },
                    { value: -1, color: UP_COLOR },
                ],
            },
            grid: [
                {
                    left: "10%",
                    right: "8%",
                    height: "50%",
                },
                {
                    left: "10%",
                    right: "8%",
                    top: "63%",
                    height: "16%",
                },
            ],
            xAxis: [
                {
                    type: "category",
                    data: dates,
                    scale: true,
                    boundaryGap: false,
                    axisLine: { onZero: false, lineStyle: { color: "#334155" } },
                    splitLine: { show: false },
                    min: "dataMin",
                    max: "dataMax",
                    axisPointer: { z: 100 },
                },
                {
                    type: "category",
                    gridIndex: 1,
                    data: dates,
                    scale: true,
                    boundaryGap: false,
                    axisLine: { onZero: false, lineStyle: { color: "#334155" } },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    min: "dataMin",
                    max: "dataMax",
                },
            ],
            yAxis: [
                {
                    scale: true,
                    splitArea: { show: false },
                    splitLine: { show: true, lineStyle: { color: "#334155" } },
                    axisLine: { lineStyle: { color: "#334155" } },
                },
                {
                    scale: true,
                    gridIndex: 1,
                    splitNumber: 2,
                    axisLabel: { show: false },
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { show: false },
                },
            ],
            dataZoom: [
                {
                    type: "inside",
                    xAxisIndex: [0, 1],
                    start: 80,
                    end: 100,
                },
                {
                    show: true,
                    xAxisIndex: [0, 1],
                    type: "slider",
                    bottom: 10,
                    start: 80,
                    end: 100,
                    borderColor: "#334155",
                    textStyle: { color: "#9ca3af" },
                },
            ],
            series: [
                {
                    name: "Candle",
                    type: "candlestick",
                    data: values,
                    itemStyle: {
                        color: UP_COLOR,
                        color0: DOWN_COLOR,
                        borderColor: UP_COLOR,
                        borderColor0: DOWN_COLOR,
                    },
                },
                {
                    name: "MA5",
                    type: "line",
                    data: calculateMA(5, values),
                    smooth: true,
                    lineStyle: { opacity: 0.5 },
                },
                {
                    name: "MA10",
                    type: "line",
                    data: calculateMA(10, values),
                    smooth: true,
                    lineStyle: { opacity: 0.5 },
                },
                {
                    name: "MA30",
                    type: "line",
                    data: calculateMA(30, values),
                    smooth: true,
                    lineStyle: { opacity: 0.5 },
                },
                {
                    name: "Volume",
                    type: "bar",
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: volumes,
                },
            ],
        }
    }

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const endTime = Date.now()
                const startTime = endTime - 24 * 60 * 60 * 1000 * 30 // 30 days

                const candles = await getCandles(coin, interval, startTime, endTime)

                // Map to ECharts format
                // [Date, Open, Close, Low, High, Volume]
                // ECharts Candlestick: [Open, Close, Low, High]
                const formattedData = candles.map(c => [
                    new Date(c.t).toLocaleTimeString(), // Simple time for x-axis
                    parseFloat(c.o), // Open
                    parseFloat(c.c), // Close
                    parseFloat(c.l), // Low
                    parseFloat(c.h), // High
                    parseFloat(c.v), // Volume
                    c.t // Timestamp for sorting
                ]).sort((a, b) => (a[6] as number) - (b[6] as number))

                setData(formattedData)
            } catch (error) {
                console.error("Failed to fetch candles:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()

        // WebSocket Subscription
        const unsubscribe = wsManager.subscribe(
            { type: "candle", coin: coin, interval: interval },
            (message) => {
                if (message.data && message.data.c === coin && message.data.i === interval) {
                    const c = message.data
                    const newDataPoint = [
                        new Date(c.t).toLocaleTimeString(),
                        parseFloat(c.o),
                        parseFloat(c.c),
                        parseFloat(c.l),
                        parseFloat(c.h),
                        parseFloat(c.v),
                        c.t
                    ]

                    setData(prev => {
                        const last = prev[prev.length - 1]
                        if (last && last[6] === c.t) {
                            // Update last candle
                            const newData = [...prev]
                            newData[newData.length - 1] = newDataPoint
                            return newData
                        } else {
                            // Add new candle
                            return [...prev, newDataPoint]
                        }
                    })
                }
            }
        )

        return () => {
            unsubscribe()
        }
    }, [coin, interval])

    return (
        <Card className="h-full border-0 shadow-none rounded-none border-x flex flex-col">
            <CardHeader className="p-2 border-b flex flex-row items-center justify-between shrink-0 h-12">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">{coin}-USD</CardTitle>
                    <div className="flex items-center bg-muted/50 rounded-md p-0.5">
                        {INTERVALS.map((int) => (
                            <button
                                key={int.value}
                                onClick={() => setInterval(int.value)}
                                className={cn(
                                    "px-2 py-1 text-xs font-medium rounded-sm transition-colors",
                                    interval === int.value
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {int.label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative min-h-0">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                        <span className="text-muted-foreground">Loading Chart...</span>
                    </div>
                )}
                <ReactECharts
                    ref={echartsRef}
                    option={getOption()}
                    style={{ height: "100%", width: "100%" }}
                    theme="dark"
                />
            </CardContent>
        </Card>
    )
}
