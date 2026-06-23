"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Wrench,
    Users,
    Car,
    Package,
    FileText,
    CalendarDays,
    Wallet,
    Landmark,
    User
} from "lucide-react"
import { cn } from "@/lib/utils"

const groups = [
    {
        title: "Operasyon",
        items: [
            { name: "Müşteriler", path: "/customers", icon: Users },
            { name: "Araçlar", path: "/vehicles", icon: Car },
            { name: "Servis Kayıtları", path: "/services", icon: Wrench },
            { name: "Ajanda", path: "/calendar", icon: CalendarDays },
        ]
    },
    {
        title: "Envanter",
        items: [
            { name: "Stok Kartları", path: "/stock", icon: Package },
        ]
    },
    {
        title: "Finans",
        items: [
            { name: "Faturalar", path: "/invoices", icon: FileText },
            { name: "Finans", path: "/finance", icon: Landmark },
        ]
    },
    {
        title: "Ayarlar",
        items: [
            { name: "Profil", path: "/profile", icon: User },
        ]
    }
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-zinc-950 text-zinc-50 flex flex-col h-screen border-r border-zinc-800">
            <div className="h-16 flex items-center px-6 border-b border-zinc-800">
                <h1 className="text-xl font-bold tracking-tight text-white">ServisMaster</h1>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
                {/* Ana Sayfa (Dashboard) */}
                <div>
                    <Link
                        href="/dashboard"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-colors",
                            pathname === "/dashboard"
                                ? "bg-zinc-800 text-white"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                        )}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Ana Sayfa
                    </Link>
                </div>

                {/* Kategorize Edilmiş Gruplar */}
                {groups.map((group) => (
                    <div key={group.title} className="space-y-2">
                        <h3 className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.path
                                const Icon = item.icon

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.path}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-zinc-800 text-white"
                                                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                                        )}
                                    >
                                        <Icon className="w-4 h-4 text-zinc-450" />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-zinc-800">
                <div className="text-xs text-zinc-500 text-center">
                    v1.0.0 &copy; 2026
                </div>
            </div>
        </aside>
    )
}