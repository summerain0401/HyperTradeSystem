"use client"

import { useState } from "react"
import { OrderBook } from "@/components/order-book";
import { TradeForm } from "@/components/trade-form";
import { EChartsChart } from "@/components/echarts-chart";
import { Header } from "@/components/header";

import { Footer } from "@/components/footer";
import { BottomPanel } from "@/components/bottom-panel";

export default function Home() {
  const [coin, setCoin] = useState("BTC");

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <Header coin={coin} setCoin={setCoin} />


      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Chart (Grow) */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative">
            <EChartsChart coin={coin} />
          </div>
          {/* Bottom Panel (Positions/History) */}
          <div className="h-[300px] border-t">
            <BottomPanel />
          </div>
        </div>

        {/* Middle: Order Book (Fixed) */}
        <div className="w-[280px] border-l flex flex-col hidden xl:flex">
          <OrderBook coin={coin} />
        </div>

        {/* Right: Trade Form (Fixed) */}
        <div className="w-[300px] border-l flex flex-col bg-card">
          <TradeForm coin={coin} />
        </div>
      </main>


      <Footer />
    </div>
  );
}
