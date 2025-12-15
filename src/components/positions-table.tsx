"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

export function PositionsTable() {
    const { positions, closePosition, currentPrice } = useStore()

    if (positions.length === 0) {
        return <div className="p-4 text-center text-xs text-muted-foreground">No open positions</div>
    }

    return (
        <div className="h-full overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow className="text-xs hover:bg-transparent">
                        <TableHead>Simbol</TableHead>
                        <TableHead className="text-right">Size</TableHead>
                        <TableHead className="text-right">Entry Price</TableHead>
                        <TableHead className="text-right">Mark Price</TableHead>
                        <TableHead className="text-right">Liq. Price</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead className="text-right">PnL (ROE%)</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {positions.map((pos) => {
                        const isLong = pos.size > 0;
                        const pnl = (currentPrice - pos.entryPrice) * pos.size;
                        const roe = (pnl / pos.margin) * 100;
                        const pnlColor = pnl >= 0 ? "text-green-500" : "text-red-500";

                        return (
                            <TableRow key={pos.coin} className="text-xs font-mono">
                                <TableCell className="font-bold">{pos.coin}</TableCell>
                                <TableCell className={`text-right ${isLong ? "text-green-500" : "text-red-500"}`}>
                                    {pos.size.toFixed(4)}
                                </TableCell>
                                <TableCell className="text-right">{pos.entryPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-right">{currentPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-right text-orange-500">{pos.liquidationPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-right">{pos.margin.toFixed(2)}</TableCell>
                                <TableCell className={`text-right ${pnlColor}`}>
                                    {pnl.toFixed(2)} ({roe.toFixed(2)}%)
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-6 text-[10px] px-2"
                                        onClick={() => closePosition(pos.coin)}
                                    >
                                        Close
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
