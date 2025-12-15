"use client"

import Link from "next/link"

export function Footer() {
    return (
        <footer className="h-8 border-t bg-card/50 flex items-center justify-between px-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span>Operational</span>
                </div>
                <span>Block: 123,456,789</span>
            </div>

            <div className="flex items-center gap-4">
                <Link href="#" className="hover:text-foreground transition-colors">Docs</Link>
                <Link href="#" className="hover:text-foreground transition-colors">Support</Link>
                <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
                <span>v1.0.0</span>
            </div>
        </footer>
    )
}
