"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Wrench,
    AlertTriangle,
    Calendar,
    Clock,
    TrendingUp,
    AlertCircle,
    ArrowUpRight,
    FileText,
    CircleDollarSign,
    Package
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DashboardOverviewProps {
    cashRegisters: any[]
    bankAccounts: any[]
    customers: any[]
    transactions: any[]
    serviceRecords: any[]
    stockCards: any[]
    appointments: any[]
    openInvoices: any[]
}

export default function DashboardOverview({
    cashRegisters,
    bankAccounts,
    customers,
    transactions,
    serviceRecords,
    stockCards,
    appointments,
    openInvoices,
}: DashboardOverviewProps) {
    const router = useRouter()

    // Date Helper for today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // 1. Bugünü Açılan Servis Sayısı
    const todayServicesCount = serviceRecords.filter(s => {
        const d = new Date(s.created_at)
        return d >= todayStart
    }).length

    // 2. Parça Bekleyen Araçlar (status: 'parca bekleniyor' veya 'parça bekleniyor')
    const pendingPartsCount = serviceRecords.filter(s => {
        const st = (s.status || "").toLowerCase()
        return st === "parca bekleniyor" || st === "parça bekleniyor"
    }).length

    // 3. Kritik Stok Uyarıları (Stok miktarı < 10)
    const criticalStocksCount = stockCards.filter(s => s.current_stock < 10).length
    const criticalStockList = stockCards.filter(s => s.current_stock < 10).slice(0, 5)

    // 4. Günlük Toplam Tahsilat
    const dailyCollection = transactions
        .filter(tx => {
            const txDate = new Date(tx.transaction_date)
            return txDate >= todayStart && tx.type === "gelir"
        })
        .reduce((sum, tx) => sum + tx.amount, 0)

    // Nakit Akış Grafiği (Son 15 Gün)
    const daysMap: Record<string, { date: string; Gelir: number; Gider: number }> = {}
    for (let i = 14; i >= 0; i--) {
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

    const statusLabels: Record<string, string> = {
        "araç kabul": "Araç Kabul",
        "ariza tespiti": "Arıza Tespiti",
        "parca bekleniyor": "Parça Bekleniyor",
        "onarimda": "Onarımda",
        "kalite_kontrol": "Kalite Kontrol",
        "teslimata_hazir": "Teslimata Hazır",
        "tamamlandı": "Tamamlandı",
        "iptal": "İptal"
    }

    const getStatusBadgeClass = (status: string) => {
        const st = (status || "").toLowerCase()
        if (st === "tamamlandı") return "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
        if (st === "iptal") return "bg-red-50 text-red-700 hover:bg-red-50 border-red-200"
        if (st === "onarimda" || st === "kalite_kontrol") return "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200"
        if (st === "parca bekleniyor" || st === "parça bekleniyor") return "bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200"
        return "bg-zinc-50 text-zinc-700 hover:bg-zinc-50 border-zinc-200"
    }

    return (
        <div className="space-y-6">
            
            {/* 1. ÜST İSTATİSTİK KARTLARI (KPI WIDGETS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Bugün Açılan Servisler */}
                <Card className="bg-white border border-zinc-200 shadow-sm relative overflow-hidden transition-all hover:border-zinc-300">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bugün Açılan Servisler</span>
                            <div className="text-3xl font-black text-zinc-900 leading-none pt-1">
                                {todayServicesCount}
                            </div>
                            <p className="text-[10px] text-zinc-500 font-medium">Gün içinde açılan iş emirleri</p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                            <Wrench className="w-5 h-5 stroke-[2]" />
                        </div>
                    </CardContent>
                </Card>

                {/* Parça Bekleyen Araçlar */}
                <Card className="bg-white border border-zinc-200 shadow-sm relative overflow-hidden transition-all hover:border-zinc-300">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Parça Bekleyen Araçlar</span>
                            <div className={cn(
                                "text-3xl font-black leading-none pt-1",
                                pendingPartsCount > 0 ? "text-amber-600" : "text-zinc-900"
                            )}>
                                {pendingPartsCount}
                            </div>
                            <p className="text-[10px] text-zinc-500 font-medium">Tedarik statüsündeki işler</p>
                        </div>
                        <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center shadow-inner",
                            pendingPartsCount > 0 ? "bg-amber-50 text-amber-600" : "bg-zinc-50 text-zinc-500"
                        )}>
                            <Package className="w-5 h-5 stroke-[2]" />
                        </div>
                    </CardContent>
                </Card>

                {/* Kritik Stok Uyarıları */}
                <Card className="bg-white border border-zinc-200 shadow-sm relative overflow-hidden transition-all hover:border-zinc-300">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Kritik Stok Uyarıları</span>
                            <div className={cn(
                                "text-3xl font-black leading-none pt-1",
                                criticalStocksCount > 0 ? "text-red-600" : "text-zinc-900"
                            )}>
                                {criticalStocksCount}
                            </div>
                            <p className="text-[10px] text-zinc-500 font-medium">Miktarı 10'un altındaki yedek parçalar</p>
                        </div>
                        <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center shadow-inner",
                            criticalStocksCount > 0 ? "bg-red-50 text-red-600" : "bg-zinc-50 text-zinc-500"
                        )}>
                            <AlertCircle className="w-5 h-5 stroke-[2]" />
                        </div>
                    </CardContent>
                </Card>

                {/* Günlük Toplam Tahsilat */}
                <Card className="bg-white border border-zinc-200 shadow-sm relative overflow-hidden transition-all hover:border-zinc-300">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Günlük Tahsilat</span>
                            <div className="text-2xl font-black text-emerald-600 leading-none pt-1.5">
                                {dailyCollection.toLocaleString('tr-TR')} ₺
                            </div>
                            <p className="text-[10px] text-zinc-500 font-medium">Bugün yapılan kasa/banka girişleri</p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                            <CircleDollarSign className="w-5 h-5 stroke-[2]" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 2. ORTA BÖLÜM - İKİ KOLONLU AKIŞ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* SOL KOLON: Aktif İşlemler (Son 5 Servis Kaydı) & Grafikler (lg:col-span-8) */}
                <div className="lg:col-span-8 space-y-6 flex flex-col justify-start">
                    
                    {/* Son 5 Servis Kaydı Tablosu */}
                    <Card className="bg-white border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
                        <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Son 5 Servis Kaydı</CardTitle>
                                <CardDescription className="text-xs">Atölyeye kabul edilen son aktif iş emri kayıtları</CardDescription>
                            </div>
                            <Link href="/services">
                                <Button size="sm" variant="ghost" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                                    Tüm Servisler
                                </Button>
                            </Link>
                        </CardHeader>
                        
                        <Table className="text-xs">
                            <TableHeader className="bg-zinc-50/50">
                                <TableRow>
                                    <TableHead className="font-semibold">Plaka</TableHead>
                                    <TableHead className="font-semibold">Müşteri</TableHead>
                                    <TableHead className="font-semibold">Araç Detayı</TableHead>
                                    <TableHead className="w-32 text-center font-semibold">Durum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {serviceRecords && serviceRecords.length > 0 ? (
                                    serviceRecords.slice(0, 5).map((record) => (
                                        <TableRow 
                                            key={record.id}
                                            onClick={() => router.push(`/services/${record.id}`)}
                                            className="hover:bg-zinc-50/60 cursor-pointer transition-colors"
                                        >
                                            <TableCell className="font-bold text-zinc-950">
                                                <div className="inline-block border border-zinc-950 bg-white px-2 py-0.5 rounded text-zinc-950 font-black tracking-wider text-[10px] shadow-sm select-none">
                                                    {record.vehicles?.plate}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-zinc-800">
                                                {record.customers?.first_name} {record.customers?.last_name || ""}
                                            </TableCell>
                                            <TableCell className="text-zinc-500">
                                                {record.vehicles?.brand} {record.vehicles?.model}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className={cn("text-[9px] font-bold px-1.5 py-0.5", getStatusBadgeClass(record.status))}>
                                                    {statusLabels[record.status]?.toUpperCase() || record.status?.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-zinc-400 italic">
                                            Aktif servis kaydı bulunmuyor.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Nakit Akış Analizi Grafiği */}
                    <Card className="bg-white border border-zinc-200 shadow-sm flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Nakit Akış Analizi</CardTitle>
                            <CardDescription className="text-xs">Son 15 günün kasalara ve banka hesaplarına giren/çıkan işlem toplamları</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="h-[235px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={flowChartData} barGap={4}>
                                        <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val} ₺`} />
                                        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", fontSize: "11px" }} />
                                        <Bar dataKey="Gelir" fill="#10B981" radius={[3, 3, 0, 0]} />
                                        <Bar dataKey="Gider" fill="#EF4444" radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* SAĞ KOLON: Stok, Finans Bildirimleri & Randevular (lg:col-span-4) */}
                <div className="lg:col-span-4 space-y-6 flex flex-col">
                    
                    {/* Açık Faturalar Bildirimi */}
                    <Card className="bg-white border border-zinc-200 shadow-sm flex flex-col">
                        <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-blue-500" /> Açık Faturalar
                                </CardTitle>
                                <CardDescription className="text-[10px]">Vadesi bekleyen / ödenmemiş son 3 fatura</CardDescription>
                            </div>
                            <Link href="/invoices">
                                <Button size="sm" variant="ghost" className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 p-0 h-6">
                                    Faturalara Git
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            <div className="divide-y divide-zinc-100">
                                {openInvoices && openInvoices.length > 0 ? (
                                    openInvoices.slice(0, 3).map((inv: any) => {
                                        const isOverdue = new Date(inv.due_date) < new Date() && inv.status !== 'ödendi'
                                        return (
                                            <div key={inv.id} className="p-3.5 flex items-center justify-between hover:bg-zinc-50/20 transition-colors">
                                                <div className="space-y-0.5 max-w-[170px]">
                                                    <p className="text-xs font-bold text-zinc-900 truncate">No: {inv.invoice_no}</p>
                                                    <p className="text-[10px] text-zinc-400 truncate">
                                                        {inv.customers?.first_name} {inv.customers?.last_name || ""}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-zinc-900">
                                                        {inv.total_amount.toLocaleString('tr-TR')} ₺
                                                    </div>
                                                    <Badge 
                                                        variant="outline" 
                                                        className={cn(
                                                            "text-[8px] font-bold px-1 py-0 border-zinc-100 leading-none",
                                                            isOverdue ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                                        )}
                                                    >
                                                        {isOverdue ? "VADESİ GEÇTİ" : "BEKLİYOR"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="p-6 text-center text-[10px] text-zinc-400 italic">
                                        Bekleyen açık fatura bulunmuyor.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Kritik Stok Mini Listesi */}
                    <Card className="bg-white border border-zinc-200 shadow-sm flex flex-col">
                        <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-red-500" /> Kritik Parçalar
                                </CardTitle>
                                <CardDescription className="text-[10px]">Stok miktarı 10'un altına düşen kartlar</CardDescription>
                            </div>
                            <Link href="/stock">
                                <Button size="sm" variant="ghost" className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 p-0 h-6">
                                    Stok Kartları
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            <div className="divide-y divide-zinc-100">
                                {criticalStockList.length > 0 ? (
                                    criticalStockList.map((item: any) => (
                                        <div key={item.id} className="p-3.5 flex items-center justify-between">
                                            <div className="space-y-0.5 max-w-[180px]">
                                                <p className="text-xs font-bold text-zinc-900 truncate">{item.name}</p>
                                                <p className="text-[10px] text-zinc-400">SKU: {item.stock_code}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-black text-red-600">
                                                    {item.current_stock} {item.unit || "Adet"}
                                                </div>
                                                <p className="text-[8px] text-zinc-400 font-medium">Min: {item.min_stock ?? 0}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-[10px] text-zinc-400 italic">
                                        Kritik seviyede parça bulunmuyor.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Yaklaşan Randevular */}
                    <Card className="bg-white border border-zinc-200 shadow-sm flex flex-col">
                        <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-zinc-450" /> Randevular
                                </CardTitle>
                                <CardDescription className="text-[10px]">Bugün ve yakındaki randevular</CardDescription>
                            </div>
                            <Link href="/calendar">
                                <Button size="sm" variant="ghost" className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 p-0 h-6">
                                    Ajandayı Aç
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            <div className="divide-y divide-zinc-100">
                                {appointments.length > 0 ? (
                                    appointments.slice(0, 3).map((appt: any) => {
                                        const apptDate = new Date(appt.appointment_date)
                                        return (
                                            <div key={appt.id} className="p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2 max-w-[190px]">
                                                    <div className="h-8 w-8 rounded bg-blue-50/70 border border-blue-100 flex flex-col items-center justify-center text-[9px] font-bold text-blue-700 shrink-0">
                                                        <span>{apptDate.getDate()}</span>
                                                        <span className="text-[7px] uppercase font-black">{apptDate.toLocaleDateString('tr-TR', { month: 'short' })}</span>
                                                    </div>
                                                    <div className="space-y-0.5 truncate">
                                                        <p className="text-xs font-bold text-zinc-900 truncate">{appt.title}</p>
                                                        <p className="text-[9px] text-zinc-400 truncate">
                                                            {appt.customers?.first_name} {appt.customers?.last_name || ""}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 shrink-0">
                                                    <Clock className="w-3 h-3 text-zinc-400" />
                                                    {apptDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="p-6 text-center text-[10px] text-zinc-400 italic">
                                        Yakın zamanda randevu bulunmuyor.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    
                </div>
            </div>
        </div>
    )
}
