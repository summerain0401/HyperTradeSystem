"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PositionsTable } from "@/components/positions-table"
import { OrdersTable } from "@/components/orders-table"
import { useStore } from "@/lib/store"

export function BottomPanel() {
    const { positions, openOrders } = useStore()

    return (
        <div className="h-full flex flex-col bg-card border-t">
            <Tabs defaultValue="positions" className="flex-1 flex flex-col">
                <div className="border-b px-4">
                    <TabsList className="h-10 bg-transparent p-0 gap-6">
                        <TabsTrigger
                            value="positions"
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-normal relative"
                        >
                            Positions
                            {positions.length > 0 && (
                                <span className="ml-2 text-[10px] bg-secondary px-1.5 py-0.5 rounded-full text-foreground">
                                    {positions.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="orders"
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-normal"
                        >
                            Open Orders
                            {openOrders.length > 0 && (
                                <span className="ml-2 text-[10px] bg-secondary px-1.5 py-0.5 rounded-full text-foreground">
                                    {openOrders.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-normal"
                        >
                            Order History
                        </TabsTrigger>
                        <TabsTrigger
                            value="trades"
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-normal"
                        >
                            Trade History
                        </TabsTrigger>
                        <TabsTrigger
                            value="funding"
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-normal"
                        >
                            Funding Fees
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                    <TabsContent value="positions" className="h-full m-0 border-0 p-0 data-[state=inactive]:hidden">
                        <PositionsTable />
                    </TabsContent>
                    <TabsContent value="orders" className="h-full m-0 border-0 p-0 data-[state=inactive]:hidden">
                        <OrdersTable />
                    </TabsContent>
                    <TabsContent value="history" className="h-full m-0 border-0 p-0 data-[state=inactive]:hidden">
                        <div className="p-4 text-center text-xs text-muted-foreground">No recent order history</div>
                    </TabsContent>
                    <TabsContent value="trades" className="h-full m-0 border-0 p-0 data-[state=inactive]:hidden">
                        <div className="p-4 text-center text-xs text-muted-foreground">No recent trade history</div>
                    </TabsContent>
                    <TabsContent value="funding" className="h-full m-0 border-0 p-0 data-[state=inactive]:hidden">
                        <div className="p-4 text-center text-xs text-muted-foreground">No recent funding fees</div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
