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
import { format } from "date-fns"

export function OrdersTable() {
    const { openOrders, cancelOrder } = useStore()

    if (openOrders.length === 0) {
        return <div className="p-4 text-center text-xs text-muted-foreground">No open orders</div>
    }

    return (
        <div className="h-full overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow className="text-xs hover:bg-transparent">
                        <TableHead>Time</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Size</TableHead>
                        <TableHead className="text-right">Filled</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {openOrders.map((order) => (
                        <TableRow key={order.id} className="text-xs font-mono">
                            <TableCell className="text-muted-foreground">
                                {format(order.timestamp, "MM/dd HH:mm:ss")}
                            </TableCell>
                            <TableCell className="font-bold">{order.coin}</TableCell>
                            <TableCell>{order.type}</TableCell>
                            <TableCell className={order.side === "Buy" ? "text-green-500" : "text-red-500"}>
                                {order.side}
                            </TableCell>
                            <TableCell className="text-right">{order.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{order.size.toFixed(4)}</TableCell>
                            <TableCell className="text-right">{order.filled.toFixed(4)}</TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                    onClick={() => cancelOrder(order.id)}
                                >
                                    Cancel
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
