"use client"

import { useState, useEffect } from "react"
import { Bell, AlertTriangle, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"

interface NotificationItem {
    id: string
    type: "stock" | "service"
    title: string
    description: string
    time: Date
    link: string
}

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [lastReadTime, setLastReadTime] = useState<string | null>(null)

    useEffect(() => {
        // Load last read time from localStorage
        const storedTime = localStorage.getItem("last_read_notifications_time")
        setLastReadTime(storedTime)

        const supabase = createClient()

        async function fetchNotificationsData() {
            try {
                // 1. Fetch critical stock cards
                const { data: stocks } = await supabase
                    .from("stock_cards")
                    .select("id, name, stock_code, current_stock, min_stock, updated_at")
                    .eq('is_deleted', false)

                const criticalStocks = (stocks || [])
                    .filter(s => s.current_stock <= (s.min_stock ?? 0))
                    .map(s => ({
                        id: `stock-${s.id}`,
                        type: "stock" as const,
                        title: "Kritik Stok Uyarısı",
                        description: `"${s.name}" ürünü kritik seviyede! Kalan: ${s.current_stock}`,
                        time: new Date(s.updated_at || new Date()),
                        link: `/stock?search=${s.stock_code}`
                    }))

                // 2. Fetch completed services (last 10)
                const { data: services } = await supabase
                    .from("service_records")
                    .select("id, service_code, updated_at, vehicles(plate)")
                    .eq("status", "tamamlandı")
                    .eq('is_deleted', false)
                    .order("updated_at", { ascending: false })
                    .limit(10)

                const completedServices = (services || []).map(s => ({
                    id: `service-${s.id}`,
                    type: "service" as const,
                    title: "Servis Tamamlandı",
                    description: `"${s.service_code}" kodlu iş emri tamamlandı (${(s.vehicles as any)?.plate || ""})`,
                    time: new Date(s.updated_at || new Date()),
                    link: `/services/${s.id}`
                }))

                // Combine and sort notifications
                const allNotifs = [...criticalStocks, ...completedServices].sort(
                    (a, b) => b.time.getTime() - a.time.getTime()
                )

                setNotifications(allNotifs)

                // Calculate unread count
                if (storedTime) {
                    const lastRead = new Date(storedTime).getTime()
                    const unread = allNotifs.filter(n => n.time.getTime() > lastRead).length
                    setUnreadCount(unread)
                } else {
                    setUnreadCount(allNotifs.length)
                }
            } catch (err) {
                console.error("Error loading notifications:", err)
            }
        }

        fetchNotificationsData()

        // Set up real-time channels for service and stock updates
        const channel = supabase
            .channel("realtime-notifications")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "service_records" },
                () => {
                    fetchNotificationsData()
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "stock_cards" },
                () => {
                    fetchNotificationsData()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const handleBellClick = () => {
        const nowStr = new Date().toISOString()
        localStorage.setItem("last_read_notifications_time", nowStr)
        setLastReadTime(nowStr)
        setUnreadCount(0)
    }

    return (
        <Popover onOpenChange={(open) => { if (open) handleBellClick() }}>
            <PopoverTrigger asChild>
                <button className="relative p-2 text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer rounded-full hover:bg-zinc-100/80">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white ring-2 ring-white">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-white border border-zinc-200 shadow-xl rounded-lg overflow-hidden z-50 mr-4" align="end">
                <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-800">Bildirimler</h3>
                    {unreadCount > 0 && (
                        <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-extrabold">
                            {unreadCount} Yeni
                        </span>
                    )}
                </div>

                <div className="divide-y divide-zinc-100 max-h-[350px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                        notifications.map((notif) => {
                            const isStock = notif.type === "stock"
                            const isNew = lastReadTime 
                                ? notif.time.getTime() > new Date(lastReadTime).getTime()
                                : true

                            return (
                                <Link
                                    key={notif.id}
                                    href={notif.link}
                                    className={`flex items-start gap-3 p-3.5 hover:bg-zinc-50 transition-colors cursor-pointer ${
                                        isNew ? "bg-blue-50/10" : ""
                                    }`}
                                >
                                    <div className={`mt-0.5 p-1.5 rounded-full ${
                                        isStock ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                                    }`}>
                                        {isStock ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="flex-1 space-y-0.5">
                                        <p className="text-[11px] font-bold text-zinc-800 flex justify-between items-center">
                                            <span>{notif.title}</span>
                                            {isNew && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                                        </p>
                                        <p className="text-[10px] text-zinc-650 leading-relaxed">{notif.description}</p>
                                        <p className="text-[8px] text-zinc-400 font-semibold pt-1">
                                            {notif.time.toLocaleDateString("tr-TR", {
                                                day: "numeric",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </p>
                                    </div>
                                </Link>
                            )
                        })
                    ) : (
                        <div className="p-8 text-center text-zinc-400 text-xs">
                            Henüz bir bildirim bulunmuyor.
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
