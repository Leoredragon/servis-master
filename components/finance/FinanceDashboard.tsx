"use client"

import { useState } from "react"
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
import { Wallet, Landmark, ArrowUpRight, ArrowDownRight, Plus, History, Users, RefreshCw } from "lucide-react"
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
    const [activeTab, setActiveTab] = useState<"safes" | "caris" | "transactions">("safes")

    // Modals open state
    const [isKasaOpen, setIsKasaOpen] = useState(false)
    const [isBankaOpen, setIsBankaOpen] = useState(false)
    const [isTxOpen, setIsTxOpen] = useState(false)

    // Selection state for quick customer transaction
    const [selectedCustomerForTx, setSelectedCustomerForTx] = useState<any>(null)
    const [txType, setTxType] = useState<"gelir" | "gider">("gelir")
    const [txPaymentMethod, setTxPaymentMethod] = useState("nakit")
    const [txCashRegisterId, setTxCashRegisterId] = useState(initialCashRegisters[0]?.id || "")
    const [txBankAccountId, setTxBankAccountId] = useState(initialBankAccounts[0]?.id || "")

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
        if (selectedCustomerForTx) {
            formData.append("customerId", selectedCustomerForTx.id)
        }
        formData.append("type", txType)
        formData.append("paymentMethod", txPaymentMethod)
        formData.append("cashRegisterId", txCashRegisterId)
        formData.append("bankAccountId", txBankAccountId)

        const res = await createTransaction(formData)
        if (res.success) {
            toast.success("Finansal hareket başarıyla kaydedildi!")
            setIsTxOpen(false)
            setSelectedCustomerForTx(null)
        } else {
            toast.error(res.message || "İşlem kaydedilemedi.")
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 font-sans">Kasa & Finans Yönetimi</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Kasalarınızı, banka hesaplarınızı, müşteri cari bakiyelerini ve finansal hareketleri takip edin.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setTxType("gelir")
                            setSelectedCustomerForTx(null)
                            setIsTxOpen(true)
                        }}
                        className="gap-2 border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50"
                    >
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        Tahsilat Gir
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setTxType("gider")
                            setSelectedCustomerForTx(null)
                            setIsTxOpen(true)
                        }}
                        className="gap-2 border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50"
                    >
                        <ArrowDownRight className="w-4 h-4 text-rose-600" />
                        Ödeme Gir
                    </Button>
                </div>
            </div>

            {/* Custom Tabs Navigation */}
            <div className="border-b border-zinc-200 flex gap-6">
                <button
                    onClick={() => setActiveTab("safes")}
                    className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === "safes"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-zinc-500 hover:text-zinc-900"
                    }`}
                >
                    <Wallet className="w-4 h-4" />
                    Kasa & Bankalar
                </button>
                <button
                    onClick={() => setActiveTab("caris")}
                    className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === "caris"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-zinc-500 hover:text-zinc-900"
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Müşteri Cari Hesapları
                </button>
                <button
                    onClick={() => setActiveTab("transactions")}
                    className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === "transactions"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-zinc-500 hover:text-zinc-900"
                    }`}
                >
                    <History className="w-4 h-4" />
                    Finansal Hareketler
                </button>
            </div>

            {/* 1. Kasa & Bankalar Tab Content */}
            {activeTab === "safes" && (
                <div className="space-y-6">
                    {/* Kasalar Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-zinc-500" /> Kasalar (Nakit)
                            </h3>
                            <Button
                                onClick={() => setIsKasaOpen(true)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                            >
                                <Plus className="w-4 h-4" /> Yeni Kasa Ekle
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {initialCashRegisters.map(kasa => (
                                <div key={kasa.id} className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Wallet className="w-16 h-16 text-blue-600" />
                                    </div>
                                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">{kasa.name}</h4>
                                    <p className="text-3xl font-extrabold text-zinc-900 mt-2">
                                        {kasa.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </p>
                                    <div className="text-xs text-zinc-400 mt-4">
                                        Son Güncelleme: {new Date(kasa.created_at).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bankalar Section */}
                    <div className="pt-6 border-t border-zinc-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                <Landmark className="w-5 h-5 text-zinc-500" /> Banka Hesapları (EFT/Havale/Kart)
                            </h3>
                            <Button
                                onClick={() => setIsBankaOpen(true)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                            >
                                <Plus className="w-4 h-4" /> Yeni Hesap Ekle
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {initialBankAccounts.map(bank => (
                                <div key={bank.id} className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Landmark className="w-16 h-16 text-blue-600" />
                                    </div>
                                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">{bank.name}</h4>
                                    <p className="text-3xl font-extrabold text-zinc-900 mt-2">
                                        {bank.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </p>
                                    <div className="text-xs text-zinc-400 mt-4 space-y-0.5">
                                        {bank.account_number && <div>Hesap No: {bank.account_number}</div>}
                                        {bank.iban && <div className="truncate">IBAN: {bank.iban}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Cari Hesaplar Tab Content */}
            {activeTab === "caris" && (
                <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-50/50">
                            <TableRow>
                                <TableHead className="w-[120px] font-medium">Müşteri Kodu</TableHead>
                                <TableHead className="font-medium">Müşteri Adı / Firma</TableHead>
                                <TableHead className="font-medium">Telefon</TableHead>
                                <TableHead className="font-medium">Müşteri Tipi</TableHead>
                                <TableHead className="text-right font-medium">Güncel Bakiye</TableHead>
                                <TableHead className="w-[150px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialCustomers.map((customer) => {
                                const hasDebt = customer.balance > 0
                                const hasCredit = customer.balance < 0

                                return (
                                    <TableRow key={customer.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <TableCell className="font-medium text-zinc-900">{customer.customer_code}</TableCell>
                                        <TableCell className="font-bold text-zinc-950">
                                            {customer.first_name} {customer.last_name || ""}
                                        </TableCell>
                                        <TableCell className="text-zinc-500">{customer.phone}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    customer.type === "kurumsal"
                                                        ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                                                        : customer.type === "personel"
                                                        ? "bg-purple-50 text-purple-700 hover:bg-purple-50"
                                                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-100"
                                                }
                                            >
                                                {customer.type === "kurumsal" 
                                                    ? "Kurumsal" 
                                                    : customer.type === "personel" 
                                                    ? "Personel" 
                                                    : "Bireysel"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {hasDebt ? (
                                                <span className="text-rose-600 font-bold">
                                                    +{customer.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ (Borçlu)
                                                </span>
                                            ) : hasCredit ? (
                                                <span className="text-emerald-600 font-bold">
                                                    {customer.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ (Alacaklı)
                                                </span>
                                            ) : (
                                                <span className="text-zinc-400 font-medium">0.00 ₺</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                onClick={() => {
                                                    setSelectedCustomerForTx(customer)
                                                    setTxType("gelir")
                                                    setIsTxOpen(true)
                                                }}
                                                size="sm"
                                                variant="outline"
                                                className="h-8 border-zinc-200 hover:bg-zinc-50 text-xs font-semibold"
                                            >
                                                Tahsilat Ekle
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* 3. Finansal Hareketler Tab Content */}
            {activeTab === "transactions" && (
                <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-50/50">
                            <TableRow>
                                <TableHead className="font-medium">Tarih</TableHead>
                                <TableHead className="font-medium">İşlem Açıklaması</TableHead>
                                <TableHead className="font-medium">İlişkili Cari</TableHead>
                                <TableHead className="font-medium">Ödeme Tipi</TableHead>
                                <TableHead className="font-medium">Kasa / Banka</TableHead>
                                <TableHead className="font-medium">Tür</TableHead>
                                <TableHead className="text-right font-medium">Tutar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialTransactions.length > 0 ? (
                                initialTransactions.map((tx) => {
                                    const formattedDate = new Date(tx.transaction_date).toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })

                                    const isGelir = tx.type === "gelir"

                                    return (
                                        <TableRow key={tx.id} className="hover:bg-zinc-50/50 transition-colors">
                                            <TableCell className="text-zinc-500 text-xs">{formattedDate}</TableCell>
                                            <TableCell className="font-semibold text-zinc-900">{tx.description || "-"}</TableCell>
                                            <TableCell className="font-medium text-zinc-700">
                                                {tx.customers
                                                    ? `${tx.customers.first_name} ${tx.customers.last_name || ""}`
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="text-zinc-500 capitalize text-xs">
                                                {tx.payment_method === "kredi_karti" 
                                                    ? "Kredi Kartı" 
                                                    : tx.payment_method === "acik_hesap" 
                                                    ? "Açık Hesap (Cari)" 
                                                    : tx.payment_method}
                                            </TableCell>
                                            <TableCell className="text-zinc-600 font-medium text-xs">
                                                {tx.cash_registers?.name || tx.bank_accounts?.name || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        isGelir
                                                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 font-medium"
                                                            : "bg-rose-50 text-rose-700 hover:bg-rose-50 font-medium"
                                                    }
                                                >
                                                    {isGelir ? "Giriş (Gelir)" : "Çıkış (Gider)"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-bold ${isGelir ? "text-emerald-600" : "text-rose-600"}`}>
                                                {isGelir ? "+" : "-"}{tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-zinc-400 font-medium">
                                        Henüz finansal işlem hareketi bulunmuyor.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

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
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Kasayı Oluştur</Button>
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
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Hesabı Oluştur</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 3. Genel Tahsilat & Ödeme Dialog */}
            <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
                <DialogContent className="bg-white max-w-md">
                    <DialogHeader>
                        <DialogTitle>Manuel Finansal İşlem Girişi</DialogTitle>
                        <DialogDescription>
                            {selectedCustomerForTx 
                                ? `${selectedCustomerForTx.first_name} ${selectedCustomerForTx.last_name || ""} müşterisi için cari ödeme veya tahsilat girin.`
                                : "Kasaya veya bankaya manuel gelir/gider hareketi girin."}
                        </DialogDescription>
                    </DialogHeader>
                    <form action={handleAddTx} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>İşlem Türü</Label>
                                <Select value={txType} onValueChange={(val: any) => setTxType(val)}>
                                    <SelectTrigger className="border-zinc-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="gelir">Tahsilat / Giriş (Gelir)</SelectItem>
                                        <SelectItem value="gider">Ödeme / Çıkış (Gider)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
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
                            <Textarea id="txDesc" name="description" placeholder="Örn: Cari hesap bakiyesi tahsilatı veya fatura ödemesi..." className="resize-none h-16" required />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                                İşlemi Kaydet ve İşle
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
