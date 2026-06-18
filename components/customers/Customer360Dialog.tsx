"use client"

import { useState, useEffect, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Phone, Mail, MapPin, Plus, Minus,
    Sparkles, Bike, Wrench, Receipt, ArrowUpRight
} from "lucide-react"
import { toast } from "sonner"
import { getCustomer360Data } from "./actions"
import { createVehicle } from "@/components/vehicles/actions"
import { createTransaction } from "@/components/finance/actions"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Customer360DialogProps {
    customerId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function Customer360Dialog({ customerId, open, onOpenChange }: Customer360DialogProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<"vehicles" | "services" | "transactions">("vehicles")

    // Finance dialog states
    const [financeAction, setFinanceAction] = useState<"debit" | "collect" | null>(null)
    const [financeAmount, setFinanceAmount] = useState("")
    const [financeDesc, setFinanceDesc] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("nakit")
    const [selectedCashRegister, setSelectedCashRegister] = useState("")
    const [selectedBankAccount, setSelectedBankAccount] = useState("")
    const [activeFinanceTab, setActiveFinanceTab] = useState<"collect" | "debit">("collect")
    const [financeDate, setFinanceDate] = useState("")

    // Vehicle form states
    const [showAddVehicle, setShowAddVehicle] = useState(false)
    const [plate, setPlate] = useState("")
    const [brand, setBrand] = useState("")
    const [model, setModel] = useState("")
    const [year, setYear] = useState("")
    const [mileage, setMileage] = useState("")
    const [submittingVehicle, setSubmittingVehicle] = useState(false)

    const formRef = useRef<HTMLFormElement>(null)

    const loadData = async () => {
        if (!customerId) return
        setLoading(true)
        try {
            const res = await getCustomer360Data(customerId)
            setData(res)

            if (res.cashRegisters?.length > 0) {
                setSelectedCashRegister(res.cashRegisters[0].id)
            }
            if (res.bankAccounts?.length > 0) {
                setSelectedBankAccount(res.bankAccounts[0].id)
            }
        } catch (error) {
            console.error(error)
            toast.error("Müşteri verileri yüklenirken bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open && customerId) {
            loadData()
            setActiveTab("vehicles")
            setShowAddVehicle(false)
        }
    }, [open, customerId])

    useEffect(() => {
        if (financeAction) {
            setFinanceAmount("")
            setFinanceDesc(financeAction === "collect" ? "Cari Tahsilat" : "Cari Borçlandırma")
            setPaymentMethod("nakit")
            setActiveFinanceTab(financeAction === "collect" ? "collect" : "debit")
            setFinanceDate(new Date().toISOString().split("T")[0])
        }
    }, [financeAction])

    if (!customerId) return null

    const handleAddVehicle = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!plate.trim() || !brand.trim() || !model.trim()) {
            toast.error("Lütfen plaka, marka ve model alanlarını doldurun.")
            return
        }

        setSubmittingVehicle(true)
        try {
            const formData = new FormData()
            formData.append("customerId", customerId)
            formData.append("plate", plate)
            formData.append("brand", brand)
            formData.append("model", model)
            formData.append("year", year)
            formData.append("currentKm", mileage)

            await createVehicle(formData)
            toast.success("Araç başarıyla atandı ve kaydedildi!")

            setPlate("")
            setBrand("")
            setModel("")
            setYear("")
            setMileage("")
            setShowAddVehicle(false)

            await loadData()
        } catch (error: any) {
            toast.error("Araç eklenirken hata oluştu: " + error.message)
        } finally {
            setSubmittingVehicle(false)
        }
    }

    const handleFinanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const amountNum = parseFloat(financeAmount)
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error("Lütfen geçerli bir tutar girin.")
            return
        }

        if (activeFinanceTab === "collect") {
            if (paymentMethod === "nakit" && !selectedCashRegister) {
                toast.error("Lütfen giriş yapılacak kasayı seçin.")
                return
            }
            if (["kredi_karti", "havale"].includes(paymentMethod) && !selectedBankAccount) {
                toast.error("Lütfen giriş yapılacak banka hesabını seçin.")
                return
            }
        }

        try {
            const formData = new FormData()
            formData.append("customerId", customerId)
            formData.append("amount", financeAmount)
            formData.append("description", financeDesc)
            formData.append("transactionDate", financeDate)

            if (activeFinanceTab === "collect") {
                formData.append("type", "gelir")
                formData.append("paymentMethod", paymentMethod)
                if (paymentMethod === "nakit") {
                    formData.append("cashRegisterId", selectedCashRegister)
                } else {
                    formData.append("bankAccountId", selectedBankAccount)
                }
            } else {
                formData.append("type", "gelir")
                formData.append("paymentMethod", "acik_hesap")
            }

            const res = await createTransaction(formData)
            if (res.success) {
                toast.success(activeFinanceTab === "collect" ? "Tahsilat başarıyla işlendi!" : "Borçlandırma başarıyla kaydedildi!")
                setFinanceAction(null)
                await loadData()
            } else {
                toast.error(res.message || "İşlem kaydedilemedi.")
            }
        } catch (error: any) {
            toast.error("İşlem sırasında hata: " + error.message)
        }
    }

    const customer = data?.customer
    const vehicles = data?.vehicles || []
    const services = data?.services || []
    const transactions = data?.transactions || []

    const balance = customer?.balance || 0
    const isDebit = balance > 0
    const isCredit = balance < 0

    return (
        <>
            {/* Main Customer 360 Dialog */}
            <Dialog open={open && !financeAction} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0 bg-white overflow-hidden">

                    {loading && !data ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-2 py-24">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-semibold">Detaylar yükleniyor...</span>
                        </div>
                    ) : !customer ? (
                        <div className="flex-1 flex items-center justify-center text-zinc-400 py-24">
                            <span className="text-xs">Müşteri bulunamadı veya silinmiş.</span>
                        </div>
                    ) : (
                        <>
                            {/* Header: Sabit */}
                            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row justify-between gap-4 shrink-0">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Sparkles className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Müşteri Kartı 360</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-zinc-950 tracking-tight">
                                        {customer.first_name} {customer.last_name || ""}
                                    </h2>

                                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
                                        <div className="flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5 text-zinc-400" />
                                            <span>{customer.phone}</span>
                                        </div>
                                        {customer.email && (
                                            <div className="flex items-center gap-1">
                                                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                                                <span>{customer.email}</span>
                                            </div>
                                        )}
                                        {(customer.city || customer.district) && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                                                <span>{customer.district ? `${customer.district}, ` : ""}{customer.city}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Balance Card & Quick Buttons */}
                                <div className="flex flex-col items-end gap-2.5 min-w-[200px]">
                                    <div className={cn(
                                        "w-full border rounded-lg px-4 py-3 text-right shadow-xs",
                                        isDebit
                                            ? "bg-red-50 text-red-700 border-red-200"
                                            : isCredit
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-zinc-50 text-zinc-600 border-zinc-200"
                                    )}>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-85">GÜNCEL BAKİYE</div>
                                        <div className="text-xl font-bold tracking-tight mt-0.5">
                                            {isDebit
                                                ? `Borç: ${Math.abs(balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
                                                : isCredit
                                                ? `Alacak: ${Math.abs(balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
                                                : `0.00 ₺`}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 w-full">
                                        <Button
                                            onClick={() => setFinanceAction("debit")}
                                            variant="outline"
                                            className="flex-1 text-xs border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 h-8 gap-1"
                                        >
                                            <Plus className="w-3 h-3 text-red-600" /> Borçlandır
                                        </Button>
                                        <Button
                                            onClick={() => setFinanceAction("collect")}
                                            className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white h-8 gap-1"
                                        >
                                            <Minus className="w-3 h-3 text-white" /> Tahsilat Yap
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs Navigation: Sabit */}
                            <div className="flex border-b border-zinc-100 px-6 bg-zinc-50/20 shrink-0">
                                {[
                                    { key: "vehicles", label: "Araçlar", count: vehicles.length, icon: <Bike className="w-3.5 h-3.5" /> },
                                    { key: "services", label: "Servis Geçmişi", count: services.length, icon: <Wrench className="w-3.5 h-3.5" /> },
                                    { key: "transactions", label: "Cari Hareketler", count: transactions.length, icon: <Receipt className="w-3.5 h-3.5" /> },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key as "vehicles" | "services" | "transactions")}
                                        className={cn(
                                            "px-4 py-3 text-xs font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5",
                                            activeTab === tab.key
                                                ? "border-blue-600 text-blue-600"
                                                : "border-transparent text-zinc-500 hover:text-zinc-800"
                                        )}
                                    >
                                        {tab.icon}
                                        {tab.label} ({tab.count})
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content: Kaydırılabilir */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 bg-zinc-50/20">

                                {/* Tab 1: Araçlar */}
                                {activeTab === "vehicles" && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Kayıtlı Araç Listesi</h3>
                                            {!showAddVehicle && (
                                                <Button
                                                    onClick={() => setShowAddVehicle(true)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8 gap-1.5"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Yeni Araç Ata
                                                </Button>
                                            )}
                                        </div>

                                        {showAddVehicle && (
                                            <form onSubmit={handleAddVehicle} className="p-4 bg-white border border-zinc-200 rounded-lg space-y-4 shadow-xs">
                                                <div className="text-xs font-semibold text-zinc-800 border-b pb-2 mb-1 flex items-center justify-between">
                                                    <span>Yeni Araç Ekle ve Ata</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddVehicle(false)}
                                                        className="text-zinc-400 hover:text-zinc-600"
                                                    >
                                                        Kapat
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium">Plaka <span className="text-red-500">*</span></Label>
                                                        <Input value={plate} onChange={e => setPlate(e.target.value)} placeholder="örn: 34 ABC 123" className="h-9 text-xs border-zinc-200" required />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium">Marka <span className="text-red-500">*</span></Label>
                                                        <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="örn: Yamaha" className="h-9 text-xs border-zinc-200" required />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium">Model <span className="text-red-500">*</span></Label>
                                                        <Input value={model} onChange={e => setModel(e.target.value)} placeholder="örn: MT-07" className="h-9 text-xs border-zinc-200" required />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium">Yıl</Label>
                                                        <Input value={year} onChange={e => setYear(e.target.value)} type="number" placeholder="örn: 2022" className="h-9 text-xs border-zinc-200" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium">KM</Label>
                                                        <Input value={mileage} onChange={e => setMileage(e.target.value)} type="number" placeholder="örn: 12500" className="h-9 text-xs border-zinc-200" />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2 pt-1">
                                                    <Button type="button" variant="ghost" onClick={() => setShowAddVehicle(false)} className="h-8 text-xs text-zinc-500">
                                                        İptal
                                                    </Button>
                                                    <Button type="submit" disabled={submittingVehicle} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                                                        {submittingVehicle ? "Kaydediliyor..." : "Aracı Kaydet"}
                                                    </Button>
                                                </div>
                                            </form>
                                        )}

                                        {vehicles.length === 0 ? (
                                            <div className="text-center py-12 border border-dashed border-zinc-200 rounded-lg bg-white">
                                                <p className="text-xs text-zinc-400">Müşteriye ait kayıtlı araç bulunamadı.</p>
                                            </div>
                                        ) : (
                                            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-xs">
                                                <Table>
                                                    <TableHeader className="bg-zinc-50/50">
                                                        <TableRow>
                                                            <TableHead className="text-xs font-medium">Plaka</TableHead>
                                                            <TableHead className="text-xs font-medium">Araç Bilgisi</TableHead>
                                                            <TableHead className="text-xs font-medium">Model Yılı</TableHead>
                                                            <TableHead className="text-xs font-medium">KM</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {vehicles.map((v: any) => (
                                                            <TableRow key={v.id} className="hover:bg-zinc-50/20">
                                                                <TableCell className="font-bold text-zinc-800 text-xs">{v.plate}</TableCell>
                                                                <TableCell className="text-xs font-medium">{v.brand} {v.model}</TableCell>
                                                                <TableCell className="text-xs text-zinc-500">{v.year || "-"}</TableCell>
                                                                <TableCell className="text-xs text-zinc-600 font-semibold">
                                                                    {v.mileage ? `${v.mileage.toLocaleString()} KM` : "0 KM"}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tab 2: Servis Geçmişi */}
                                {activeTab === "services" && (
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Geçmiş Servis Kayıtları</h3>
                                        {services.length === 0 ? (
                                            <div className="text-center py-12 border border-dashed border-zinc-200 rounded-lg bg-white">
                                                <p className="text-xs text-zinc-400">Müşteriye ait servis geçmişi bulunmuyor.</p>
                                            </div>
                                        ) : (
                                            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-xs">
                                                <Table>
                                                    <TableHeader className="bg-zinc-50/50">
                                                        <TableRow>
                                                            <TableHead className="text-xs font-medium">Servis Kodu</TableHead>
                                                            <TableHead className="text-xs font-medium">Araç Plakası</TableHead>
                                                            <TableHead className="text-xs font-medium">Giriş Tarihi</TableHead>
                                                            <TableHead className="text-xs font-medium">Durum</TableHead>
                                                            <TableHead className="text-right text-xs font-medium">Tutar</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {services.map((s: any) => {
                                                            const totalCost = s.service_items?.reduce(
                                                                (sum: number, item: any) => sum + (item.unit_price * item.quantity),
                                                                0
                                                            ) || 0

                                                            return (
                                                                <TableRow key={s.id} className="hover:bg-zinc-50/20">
                                                                    <TableCell className="font-semibold text-xs">
                                                                        <Link href={`/services/${s.id}`} className="text-blue-600 hover:underline">
                                                                            {s.service_code}
                                                                        </Link>
                                                                    </TableCell>
                                                                    <TableCell className="text-xs font-medium text-zinc-700">
                                                                        {s.vehicles ? `${s.vehicles.brand} ${s.vehicles.model} (${s.vehicles.plate})` : "-"}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs text-zinc-500">
                                                                        {new Date(s.created_at).toLocaleDateString("tr-TR")}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-50/50 text-blue-700 border-blue-200">
                                                                            {s.status}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-semibold text-zinc-900 text-xs">
                                                                        {totalCost > 0
                                                                            ? `${totalCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`
                                                                            : "-"}
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tab 3: Cari Hareketler */}
                                {activeTab === "transactions" && (
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Hesap Ekstresi / Cari Hareketler</h3>
                                        {transactions.length === 0 ? (
                                            <div className="text-center py-12 border border-dashed border-zinc-200 rounded-lg bg-white">
                                                <p className="text-xs text-zinc-400">Müşteriye ait cari hareket kaydı bulunmuyor.</p>
                                            </div>
                                        ) : (
                                            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-xs">
                                                <Table>
                                                    <TableHeader className="bg-zinc-50/50">
                                                        <TableRow>
                                                            <TableHead className="text-xs font-medium">Tarih</TableHead>
                                                            <TableHead className="text-xs font-medium">Açıklama</TableHead>
                                                            <TableHead className="text-xs font-medium">Ödeme Yöntemi</TableHead>
                                                            <TableHead className="text-xs font-medium">Kasa/Banka</TableHead>
                                                            <TableHead className="text-right text-xs font-medium">Tutar</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {transactions.map((t: any) => {
                                                            const isIncome = t.type === "gelir"
                                                            const isAccPay = t.payment_method === "acik_hesap"

                                                            let displayEffect = ""
                                                            let effectClass = ""

                                                            if (isAccPay) {
                                                                if (isIncome) {
                                                                    displayEffect = "Borç (Sistem)"
                                                                    effectClass = "text-red-600 bg-red-50/30"
                                                                } else {
                                                                    displayEffect = "Alacak (Sistem)"
                                                                    effectClass = "text-emerald-600 bg-emerald-50/30"
                                                                }
                                                            } else {
                                                                displayEffect = "Tahsilat"
                                                                effectClass = "text-zinc-600 bg-zinc-50"
                                                            }

                                                            return (
                                                                <TableRow key={t.id} className="hover:bg-zinc-50/20">
                                                                    <TableCell className="text-xs text-zinc-500">
                                                                        {new Date(t.transaction_date).toLocaleDateString("tr-TR")}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs font-medium text-zinc-900">
                                                                        <div>{t.description || "Cari Hareket"}</div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 font-medium", effectClass)}>
                                                                            {displayEffect}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-xs text-zinc-500">
                                                                        {t.payment_method === "nakit"
                                                                            ? t.cash_registers?.name || "Kasa"
                                                                            : t.payment_method === "acik_hesap"
                                                                            ? "Cari Hesap"
                                                                            : t.bank_accounts?.name || "Banka"}
                                                                    </TableCell>
                                                                    <TableCell className={cn(
                                                                        "text-right font-bold text-xs",
                                                                        isAccPay && isIncome
                                                                            ? "text-red-600"
                                                                            : !isAccPay
                                                                            ? "text-emerald-600"
                                                                            : "text-zinc-800"
                                                                    )}>
                                                                        {isAccPay && isIncome ? "+" : "-"} {t.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer: Sabit */}
                            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs h-9"
                                >
                                    Kapat
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Finance Popup (separate Dialog) */}
            <Dialog open={financeAction !== null} onOpenChange={(isOpen) => { if (!isOpen) setFinanceAction(null) }}>
                <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 bg-white overflow-hidden">
                    <DialogHeader className="px-6 py-5 border-b border-zinc-100">
                        <DialogTitle className="text-base font-bold text-zinc-950 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span>Hızlı Finansal Aksiyon</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">
                            Müşteriye ait bakiye düzeltme veya tahsilat işlemlerini gerçekleştirin.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFinanceSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-4">
                        {/* Segmented Control / Tabs for quick action selection */}
                        <div className="grid grid-cols-2 p-1 bg-zinc-100/80 rounded-lg">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveFinanceTab("collect")
                                    setFinanceDesc("Cari Tahsilat")
                                }}
                                className={cn(
                                    "py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5",
                                    activeFinanceTab === "collect"
                                        ? "bg-white text-zinc-900 shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-900"
                                )}
                            >
                                <Minus className="w-3.5 h-3.5 text-blue-600" />
                                Tahsilat Yap
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveFinanceTab("debit")
                                    setFinanceDesc("Cari Borçlandırma")
                                }}
                                className={cn(
                                    "py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5",
                                    activeFinanceTab === "debit"
                                        ? "bg-white text-zinc-900 shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-900"
                                )}
                            >
                                <Plus className="w-3.5 h-3.5 text-red-600" />
                                Borçlandır
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="amount" className="text-xs font-semibold text-zinc-700">Tutar (₺) <span className="text-red-500">*</span></Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={financeAmount}
                                onChange={e => setFinanceAmount(e.target.value)}
                                placeholder="0.00"
                                className="border-zinc-200 h-10 text-sm font-semibold"
                                required
                                autoFocus
                            />
                        </div>

                        {activeFinanceTab === "collect" && (
                            <>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-zinc-700">Ödeme Yöntemi <span className="text-red-500">*</span></Label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <SelectTrigger className="border-zinc-200 bg-white text-xs h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="nakit">Nakit (Kasa Girişi)</SelectItem>
                                            <SelectItem value="kredi_karti">Kredi Kartı (Banka Girişi)</SelectItem>
                                            <SelectItem value="havale">EFT / Havale (Banka Girişi)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {paymentMethod === "nakit" && data?.cashRegisters && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-zinc-700">Giriş Yapılacak Kasa <span className="text-red-500">*</span></Label>
                                        <Select value={selectedCashRegister} onValueChange={setSelectedCashRegister}>
                                            <SelectTrigger className="border-zinc-200 bg-white text-xs h-9">
                                                <SelectValue placeholder="Kasa seçin..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white">
                                                {data.cashRegisters.map((c: any) => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {(paymentMethod === "kredi_karti" || paymentMethod === "havale") && data?.bankAccounts && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-zinc-700">Giriş Yapılacak Banka Hesabı <span className="text-red-500">*</span></Label>
                                        <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                                            <SelectTrigger className="border-zinc-200 bg-white text-xs h-9">
                                                <SelectValue placeholder="Banka hesabı seçin..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white">
                                                {data.bankAccounts.map((b: any) => (
                                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="date" className="text-xs font-semibold text-zinc-700">İşlem Tarihi</Label>
                            <Input
                                id="date"
                                type="date"
                                value={financeDate}
                                onChange={e => setFinanceDate(e.target.value)}
                                className="border-zinc-200 h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="description" className="text-xs font-semibold text-zinc-700">Açıklama</Label>
                            <Textarea
                                id="description"
                                value={financeDesc}
                                onChange={e => setFinanceDesc(e.target.value)}
                                placeholder="Cari hareket açıklaması..."
                                className="resize-none h-14 text-xs border-zinc-200 w-full"
                            />
                        </div>
                    </form>

                    <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-2 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFinanceAction(null)}
                            className="text-xs h-9 border-zinc-200"
                        >
                            Vazgeç
                        </Button>
                        <Button
                            type="button"
                            onClick={handleFinanceSubmit as any}
                            className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Kaydet ve Uygula
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
