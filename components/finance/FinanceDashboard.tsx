"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Wallet, Landmark, ArrowUpRight, ArrowDownRight, Plus, History, MoreHorizontal } from "lucide-react"
import { createCashRegister, createBankAccount, createTransaction } from "./actions"
import { toast } from "sonner"

interface FinanceDashboardProps {
    initialCashRegisters: any[]
    initialBankAccounts: any[]
    initialCustomers: any[]
    initialTransactions: any[]
}

export default function FinanceDashboard({
    initialCashRegisters,
    initialBankAccounts,
    initialCustomers,
    initialTransactions,
}: FinanceDashboardProps) {
    const router = useRouter()

    // Modals open state
    const [isKasaOpen, setIsKasaOpen] = useState(false)
    const [isBankaOpen, setIsBankaOpen] = useState(false)
    const [isTxOpen, setIsTxOpen] = useState(false)

    // Selection state for quick transaction
    const [txType, setTxType] = useState<"gelir" | "gider">("gelir")
    const [txPaymentMethod, setTxPaymentMethod] = useState("nakit")
    const [txCashRegisterId, setTxCashRegisterId] = useState(initialCashRegisters[0]?.id || "")
    const [txBankAccountId, setTxBankAccountId] = useState(initialBankAccounts[0]?.id || "")

    const totalCash = initialCashRegisters.reduce((sum, r) => sum + Number(r.balance || 0), 0)
    const totalBank = initialBankAccounts.reduce((sum, b) => sum + Number(b.balance || 0), 0)

    async function handleAddKasa(formData: FormData) {
        const res = await createCashRegister(formData)
        if (res.success) {
            toast.success("Kasa başarıyla oluşturuldu!")
            setIsKasaOpen(false)
        } else {
            toast.error(res.message || "Kasa oluşturulurken hata.")
        }
    }

    async function handleAddBanka(formData: FormData) {
        const res = await createBankAccount(formData)
        if (res.success) {
            toast.success("Banka hesabı başarıyla oluşturuldu!")
            setIsBankaOpen(false)
        } else {
            toast.error(res.message || "Banka hesabı oluşturulurken hata.")
        }
    }

    async function handleAddTx(formData: FormData) {
        formData.append("type", txType)
        formData.append("paymentMethod", txPaymentMethod)
        formData.append("cashRegisterId", txCashRegisterId)
        formData.append("bankAccountId", txBankAccountId)

        const res = await createTransaction(formData)
        if (res.success) {
            toast.success("Finansal hareket başarıyla kaydedildi!")
            setIsTxOpen(false)
        } else {
            toast.error(res.message || "İşlem kaydedilemedi.")
        }
    }

    function handleRowClick(serviceId?: string) {
        if (serviceId) {
            router.push(`/services/${serviceId}`)
        }
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-zinc-900 font-sans">Kasa & Banka</h2>
                    <p className="text-sm text-zinc-500 mt-1.5 font-medium">
                        İşletmenize giren ve çıkan tüm nakit akışını takip edin.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="border-zinc-200 text-zinc-700 font-semibold hover:bg-zinc-50 shadow-sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Yeni Hesap
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setIsKasaOpen(true)} className="gap-2 cursor-pointer">
                                <Wallet className="w-4 h-4 text-zinc-500" />
                                Yeni Kasa Ekle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsBankaOpen(true)} className="gap-2 cursor-pointer">
                                <Landmark className="w-4 h-4 text-zinc-500" />
                                Yeni Banka Hesabı Ekle
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        onClick={() => {
                            setTxType("gider")
                            setIsTxOpen(true)
                        }}
                        className="gap-2 border-zinc-200 text-zinc-700 font-semibold hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 shadow-sm transition-colors"
                    >
                        <ArrowDownRight className="w-4 h-4 text-rose-500" />
                        Ödeme Çıkışı
                    </Button>

                    <Button
                        onClick={() => {
                            setTxType("gelir")
                            setIsTxOpen(true)
                        }}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        Tahsilat Gir
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between h-36 group hover:shadow-md transition-shadow">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="font-semibold text-zinc-500 text-sm tracking-wide uppercase">Toplam Nakit (Kasa)</span>
                        </div>
                    </div>
                    <div className="text-4xl font-black text-zinc-900 tracking-tight relative z-10">
                        {totalCash.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-2xl text-zinc-400 font-bold">₺</span>
                    </div>
                </div>

                <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between h-36 group hover:shadow-md transition-shadow">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Landmark className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-semibold text-zinc-500 text-sm tracking-wide uppercase">Toplam Banka (Hesaplar)</span>
                        </div>
                    </div>
                    <div className="text-4xl font-black text-zinc-900 tracking-tight relative z-10">
                        {totalBank.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-2xl text-zinc-400 font-bold">₺</span>
                    </div>
                </div>
            </div>

            {/* Timeline / Transaction List */}
            <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100 flex items-center gap-3">
                    <History className="w-5 h-5 text-zinc-400" />
                    <h3 className="text-lg font-bold text-zinc-900">İşlem Geçmişi</h3>
                </div>
                
                <Table>
                    <TableHeader className="bg-zinc-50/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold text-zinc-500 h-12 w-[180px]">Tarih</TableHead>
                            <TableHead className="font-semibold text-zinc-500">Açıklama & Cari</TableHead>
                            <TableHead className="font-semibold text-zinc-500 w-[140px]">Yöntem</TableHead>
                            <TableHead className="font-semibold text-zinc-500 w-[160px]">Kasa / Banka</TableHead>
                            <TableHead className="font-semibold text-zinc-500 w-[120px]">Tip</TableHead>
                            <TableHead className="text-right font-semibold text-zinc-500 w-[160px]">Tutar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialTransactions.length > 0 ? (
                            initialTransactions.map((tx) => {
                                const formattedDate = new Date(tx.transaction_date).toLocaleDateString('tr-TR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })
                                const formattedTime = new Date(tx.transaction_date).toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })

                                const isGelir = tx.type === "gelir"
                                const hasServiceLink = !!tx.service_id

                                return (
                                    <TableRow 
                                        key={tx.id} 
                                        onClick={() => handleRowClick(tx.service_id)}
                                        className={`transition-colors border-zinc-100 ${hasServiceLink ? "cursor-pointer hover:bg-zinc-50 group" : "hover:bg-transparent"}`}
                                    >
                                        <TableCell className="py-4">
                                            <div className="font-semibold text-zinc-700">{formattedDate}</div>
                                            <div className="text-xs text-zinc-400 font-medium">{formattedTime}</div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="font-bold text-zinc-900 flex items-center gap-2">
                                                {tx.description || "-"}
                                                {hasServiceLink && (
                                                    <Badge variant="outline" className="bg-white border-zinc-200 text-[10px] text-zinc-500 px-1.5 py-0 rounded font-semibold group-hover:bg-zinc-100 transition-colors">
                                                        Servis Kaydı
                                                    </Badge>
                                                )}
                                            </div>
                                            {tx.customers && (
                                                <div className="text-xs text-zinc-500 font-medium mt-0.5 flex items-center gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                                                    Cari: {tx.customers.first_name} {tx.customers.last_name || ""}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4 text-zinc-600 font-medium text-sm">
                                            {tx.payment_method === "kredi_karti" 
                                                ? "Kredi Kartı" 
                                                : tx.payment_method === "acik_hesap" 
                                                ? "Cari (Açık Hesap)" 
                                                : tx.payment_method === "havale"
                                                ? "EFT / Havale"
                                                : tx.payment_method === "nakit"
                                                ? "Nakit"
                                                : tx.payment_method}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-semibold">
                                                {tx.cash_registers ? <Wallet className="w-3 h-3 text-emerald-600" /> : <Landmark className="w-3 h-3 text-blue-600" />}
                                                {tx.cash_registers?.name || tx.bank_accounts?.name || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge
                                                variant="secondary"
                                                className={`font-bold px-2.5 py-0.5 shadow-sm ${
                                                    isGelir
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                        : "bg-rose-50 text-rose-700 border border-rose-100"
                                                }`}
                                            >
                                                {isGelir ? "Giriş" : "Çıkış"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`py-4 text-right font-black text-base ${isGelir ? "text-emerald-600" : "text-rose-600"}`}>
                                            {isGelir ? "+" : "-"}{tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16 text-zinc-400 font-medium">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <History className="w-8 h-8 text-zinc-200" />
                                        <span>Henüz finansal işlem hareketi bulunmuyor.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* --- Dialog Modals --- */}
            {/* 1. Yeni Kasa Dialog */}
            <Dialog open={isKasaOpen} onOpenChange={setIsKasaOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Yeni Kasa Hesabı Ekle</DialogTitle>
                        <DialogDescription>Nakit tahsilat ve ödemelerinizi yöneteceğiniz yeni bir fiziki kasa oluşturun.</DialogDescription>
                    </DialogHeader>
                    <form action={handleAddKasa} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="kasaName">Kasa Adı</Label>
                            <Input id="kasaName" name="name" placeholder="Örn: Şube-2 Kasası" required />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold">Kasayı Oluştur</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 2. Yeni Banka Dialog */}
            <Dialog open={isBankaOpen} onOpenChange={setIsBankaOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Yeni Banka Hesabı Ekle</DialogTitle>
                        <DialogDescription>POS, EFT, Havale ve kredi kartı işlemlerinizi takip etmek üzere yeni bir hesap tanımlayın.</DialogDescription>
                    </DialogHeader>
                    <form action={handleAddBanka} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bankName">Banka Adı / Açıklama</Label>
                            <Input id="bankName" name="name" placeholder="Örn: Garanti Bankası Ticari" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="accNo">Hesap Numarası</Label>
                                <Input id="accNo" name="accountNumber" placeholder="Örn: 9876543" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="iban">IBAN Numarası</Label>
                                <Input id="iban" name="iban" placeholder="TR..." />
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold">Hesabı Oluştur</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 3. Genel Tahsilat & Ödeme Dialog */}
            <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
                <DialogContent className="bg-white max-w-md">
                    <DialogHeader>
                        <DialogTitle>{txType === "gelir" ? "Tahsilat Gir (Gelir)" : "Ödeme Çıkışı (Gider)"}</DialogTitle>
                        <DialogDescription>
                            Kasaya veya bankaya manuel gelir/gider hareketi girin.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={handleAddTx} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Ödeme Yöntemi</Label>
                            <Select value={txPaymentMethod} onValueChange={setTxPaymentMethod}>
                                <SelectTrigger className="border-zinc-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="nakit">Nakit</SelectItem>
                                    <SelectItem value="kredi_karti">Kredi Kartı</SelectItem>
                                    <SelectItem value="havale">EFT / Havale</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {txPaymentMethod === "nakit" && (
                            <div className="space-y-2">
                                <Label>İlgili Kasa</Label>
                                <Select value={txCashRegisterId} onValueChange={setTxCashRegisterId}>
                                    <SelectTrigger className="border-zinc-200">
                                        <SelectValue placeholder="Kasa seçin..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {initialCashRegisters.map(r => (
                                            <SelectItem key={r.id} value={r.id}>{r.name} (Bakiye: {r.balance} ₺)</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {(txPaymentMethod === "kredi_karti" || txPaymentMethod === "havale") && (
                            <div className="space-y-2">
                                <Label>İlgili Banka Hesabı</Label>
                                <Select value={txBankAccountId} onValueChange={setTxBankAccountId}>
                                    <SelectTrigger className="border-zinc-200">
                                        <SelectValue placeholder="Banka seçin..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {initialBankAccounts.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name} (Bakiye: {b.balance} ₺)</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="txAmount">İşlem Tutarı</Label>
                                <Input id="txAmount" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="txDate">İşlem Tarihi</Label>
                                <Input id="txDate" name="transactionDate" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="txDesc">Açıklama</Label>
                            <Textarea id="txDesc" name="description" placeholder="Örn: Fatura ödemesi..." className="resize-none h-16" required />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="submit" className={`w-full text-white font-bold shadow-md transition-all ${txType === 'gelir' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                                İşlemi Kaydet
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
