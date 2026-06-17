"use client"

import { useState } from "react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Wallet,
    Landmark,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    AlertTriangle,
    Calendar,
    Clock,
    Wrench
} from "lucide-react"
import Link from "next/link"

interface DashboardOverviewProps {
    cashRegisters: any[]
    bankAccounts: any[]
    customers: any[]
    transactions: any[]
    serviceRecords: any[]
    stockCards: any[]
    appointments: any[]
}

export default function DashboardOverview({
    cashRegisters,
    bankAccounts,
    customers,
    transactions,
    serviceRecords,
    stockCards,
    appointments,
}: DashboardOverviewProps) {
    // 1. Calculate Metrics
    const totalKasa = cashRegisters.reduce((sum, r) => sum + (r.balance || 0), 0)
    const totalBanka = bankAccounts.reduce((sum, b) => sum + (b.balance || 0), 0)
    const totalCariAlacak = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0)

    // Calculate Monthly Revenue (Aylık Ciro)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlyCiro = transactions
        .filter(tx => {
            const txDate = new Date(tx.transaction_date)
            return txDate.getMonth() === currentMonth && 
                   txDate.getFullYear() === currentYear && 
                   tx.type === "gelir"
        })
        .reduce((sum, tx) => sum + tx.amount, 0)

    // 2. Format 30-Day Cash Flow Chart Data
    const daysMap: Record<string, { date: string; Gelir: number; Gider: number }> = {}
    for (let i = 14; i >= 0; i--) { // Let's group last 15 days for cleaner visual layout on responsive screen
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateString = date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
        daysMap[dateString] = { date: dateString, Gelir: 0, Gider: 0 }
    }

    transactions.forEach((tx: any) => {
        const txDate = new Date(tx.transaction_date)
        const dateString = txDate.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
        if (daysMap[dateString]) {
            if (tx.type === "gelir") {
                daysMap[dateString].Gelir += tx.amount
            } else {
                daysMap[dateString].Gider += tx.amount
            }
        }
    })
    const flowChartData = Object.values(daysMap)

    // 3. Format Service Status Pie Chart Data
    const statusCounts: Record<string, number> = {
        "Kabul / Tespit": 0,
        "Onarımda": 0,
        "Parça Bekliyor": 0,
        "Teslimata Hazır": 0,
    }

    serviceRecords.forEach(s => {
        const status = (s.status || "").toLowerCase()
        if (status === "araç kabul" || status === "arıza tespiti") {
            statusCounts["Kabul / Tespit"]++
        } else if (status === "onarımda" || status === "kalite kontrol") {
            statusCounts["Onarımda"]++
        } else if (status === "parça bekleniyor") {
            statusCounts["Parça Bekliyor"]++
        } else if (status === "teslimata hazır" || status === "tamamlandı") {
            statusCounts["Teslimata Hazır"]++
        }
    })

    const statusChartData = Object.entries(statusCounts)
        .map(([name, value]) => ({ name, value }))
        .filter(item => item.value > 0)

    const STATUS_COLORS = {
        "Kabul / Tespit": "#3B82F6", // Blue
        "Onarımda": "#8B5CF6",     // Violet
        "Parça Bekliyor": "#F59E0B",  // Amber
        "Teslimata Hazır": "#10B981"  // Emerald
    }

    // 4. Low stock items (min_stock limit exceeded)
    const lowStockItems = stockCards
        .filter(item => item.current_stock <= (item.min_stock ?? 0))
        .slice(0, 4)

    return (
        <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Nakit Kasa */}
                <Card className="bg-white border border-zinc-200 shadow-sm relative overflow-hidden">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Kasa Bakiyesi</span>
                            <div className="text-2xl font-extrabold text-zinc-900">
                                {totalKasa.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                            <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Geçen aya göre %12.4 artış
                            </div>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Wallet className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* Banka Hesapları */}
                <Card className="bg-white border border-zinc-200 shadow-sm relative overflow-hidden">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Banka Bakiyesi</span>
                            <div className="text-2xl font-extrabold text-zinc-900">
                                {totalBanka.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                            <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Geçen aya göre %8.2 artış
                            </div>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Landmark className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* Cari Alacaklar */}
                <Card className="bg-white border border-zinc-200 shadow-sm relative overflow-hidden">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cari Alacaklar</span>
                            <div className="text-2xl font-extrabold text-zinc-900">
                                {totalCariAlacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                            <div className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-1">
                                <TrendingDown className="w-3.5 h-3.5" />
                                Bekleyen 4 fatura satışı
                            </div>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                            <Users className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* Aylık Ciro */}
                <Card className="bg-white border border-zinc-200 shadow-sm relative overflow-hidden">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Aylık Net Ciro</span>
                            <div className="text-2xl font-extrabold text-zinc-900">
                                {monthlyCiro.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                            <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Geçen aya göre %15.3 artış
                            </div>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cash Flow Chart */}
                <Card className="bg-white border border-zinc-200 shadow-sm lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-zinc-900">Nakit Akış Analizi</CardTitle>
                        <CardDescription className="text-xs">Son 15 günün kasa/banka gelir-gider dağılımı</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={flowChartData} barGap={4}>
                                    <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val} ₺`} />
                                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", fontSize: "12px" }} />
                                    <Bar dataKey="Gelir" fill="#10B981" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="Gider" fill="#EF4444" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Service Record Distribution Donut Chart */}
                <Card className="bg-white border border-zinc-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-zinc-900">Atölye Yoğunluk Analizi</CardTitle>
                        <CardDescription className="text-xs">Servisteki araçların güncel durum oranları</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 flex flex-col items-center justify-center">
                        <div className="h-[180px] w-full relative">
                            {statusChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {statusChartData.map((entry: any) => (
                                                <Cell 
                                                    key={`cell-${entry.name}`} 
                                                    fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || "#d4d4d8"} 
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400 font-semibold">
                                    Aktif servis kaydı bulunmuyor
                                </div>
                            )}
                        </div>
                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-semibold mt-4 w-full">
                            {Object.entries(STATUS_COLORS).map(([name, color]) => {
                                const count = statusCounts[name] || 0
                                return (
                                    <div key={name} className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                        <span className="text-zinc-600 truncate">{name}</span>
                                        <span className="text-zinc-400 ml-auto font-normal">({count})</span>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stok Uyarı Listesi */}
                <Card className="bg-white border border-zinc-200 shadow-sm flex flex-col justify-between">
                    <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" /> Kritik Stok Uyarıları
                            </CardTitle>
                            <CardDescription className="text-xs">Minimum stok seviyesinin altına düşen parçalar</CardDescription>
                        </div>
                        <Link href="/stock">
                            <Button size="sm" variant="ghost" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                                Stokları Yönet
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <div className="divide-y divide-zinc-100">
                            {lowStockItems.length > 0 ? (
                                lowStockItems.map((item: any) => (
                                    <div key={item.id} className="p-4 flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-zinc-900">{item.name}</p>
                                            <p className="text-xs text-zinc-400">SKU: {item.stock_code} | Marka: {item.brand || "-"}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-extrabold text-red-600">
                                                {item.current_stock} {item.unit || "Adet"}
                                            </div>
                                            <p className="text-[10px] text-zinc-400">Min. Limit: {item.min_stock}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-xs text-zinc-400 font-medium">
                                    Kritik seviyede olan yedek parça bulunmuyor.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Bugünkü / Yaklaşan Randevular */}
                <Card className="bg-white border border-zinc-200 shadow-sm flex flex-col justify-between">
                    <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" /> Yaklaşan Randevular
                            </CardTitle>
                            <CardDescription className="text-xs">Kabul bekleyen güncel araç randevuları</CardDescription>
                        </div>
                        <Link href="/calendar">
                            <Button size="sm" variant="ghost" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                                Ajandayı Aç
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <div className="divide-y divide-zinc-100">
                            {appointments.length > 0 ? (
                                appointments.slice(0, 4).map((appt: any) => {
                                    const apptDate = new Date(appt.appointment_date)
                                    return (
                                        <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/20 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-md bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600 font-bold text-xs flex-col">
                                                    <span>{apptDate.toLocaleDateString('tr-TR', { day: 'numeric' })}</span>
                                                    <span className="text-[8px] uppercase">{apptDate.toLocaleDateString('tr-TR', { month: 'short' })}</span>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-bold text-zinc-900">{appt.title}</p>
                                                    <p className="text-xs text-zinc-400">
                                                        Müşteri: {appt.customers?.first_name} {appt.customers?.last_name || ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                                                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                                {apptDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="p-8 text-center text-xs text-zinc-400 font-medium">
                                    Yaklaşan randevu bulunmuyor.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
