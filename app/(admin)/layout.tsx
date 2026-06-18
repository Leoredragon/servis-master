import type { Metadata } from "next"
import Link from "next/link"
import { Wrench, LayoutDashboard } from "lucide-react"

export const metadata: Metadata = {
    title: "ServisMaster | Admin Paneli",
    description: "Servis Master SaaS Yönetim ve Bayi Kontrol Merkezi",
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 flex flex-col">
            {/* Header */}
            <header className="h-16 bg-white border-b border-zinc-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                            <Wrench className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight leading-none text-zinc-900">ServisMaster</span>
                            <span className="text-[10px] font-semibold text-amber-600 tracking-wider uppercase mt-0.5">Admin Paneli</span>
                        </div>
                    </div>

                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 px-3.5 py-2 rounded-lg transition-colors border border-zinc-200"
                    >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Panele Dön
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    )
}
