"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const data = [
    { time: "10:00", price: 60000 },
    { time: "10:05", price: 60100 },
    { time: "10:10", price: 60050 },
    { time: "10:15", price: 60200 },
    { time: "10:20", price: 60150 },
    { time: "10:25", price: 60300 },
    { time: "10:30", price: 60250 },
    { time: "10:35", price: 60400 },
]

export function Chart({ coin }: { coin: string }) {
    return (
        <Card className="h-full border-0 shadow-none rounded-none border-x">
            <CardHeader className="p-2 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">{coin}-USD Chart</CardTitle>
                <div className="text-xs text-muted-foreground">1H</div>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-40px)]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={['auto', 'auto']} orientation="right" tick={{ fontSize: 12 }} stroke="#666" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111', border: 'none' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="price" stroke="#8884d8" fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
