"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Plus, ChevronsUpDown, Check, FileText, Trash2, Split, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createInvoice } from "./actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface InvoiceItem {
    id: string
    description: string
    quantity: number
    unitPrice: number
    kdvRate: string
}

export default function NewInvoiceDialog({ triggerVisible = true }: { triggerVisible?: boolean }) {
    const [open, setOpen] = useState(false)
    const [customers, setCustomers] = useState<any[]>([])
    const [cashRegisters, setCashRegisters] = useState<any[]>([])
    const [bankAccounts, setBankAccounts] = useState<any[]>([])
    const [serviceRecords, setServiceRecords] = useState<any[]>([])

    // Form states
    const [invoiceNo, setInvoiceNo] = useState("")
    const [selectedCustomerId, setSelectedCustomerId] = useState("")
    const [selectedServiceId, setSelectedServiceId] = useState("")
    
    // Payment Mode: single | parcali
    const [paymentMode, setPaymentMode] = useState<"single" | "parcali">("single")
    const [singlePaymentMethod, setSinglePaymentMethod] = useState("kredi_karti")
    
    // Split payments amounts
    const [cashAmount, setCashAmount] = useState<number>(0)
    const [bankAmount, setBankAmount] = useState<number>(0)
    
    const [selectedCashRegisterId, setSelectedCashRegisterId] = useState("")
    const [selectedBankAccountId, setSelectedBankAccountId] = useState("")
    
    const [notes, setNotes] = useState("")
    const [submitAction, setSubmitAction] = useState<"save" | "saveAndAdd">("save")
    const [comboboxOpen, setComboboxOpen] = useState(false)

    // Dynamic Multi-item invoice lines
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: "1", description: "", quantity: 1, unitPrice: 0, kdvRate: "20" }
    ])

    // Calculations
    const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const taxAmount = items.reduce((sum, item) => {
        const rate = parseFloat(item.kdvRate)
        return sum + (item.quantity * item.unitPrice * (rate / 100))
    }, 0)
    const grandTotal = subTotal + taxAmount

    // Computed credit amount for split payments
    const creditAmount = Math.max(0, grandTotal - cashAmount - bankAmount)

    // Load data
    useEffect(() => {
        if (!open) return

        const supabase = createClient()
        async function loadData() {
            // Fetch customers
            const { data: custs } = await supabase
                .from("customers")
                .select("*")
                .eq('is_deleted', false)
                .order("first_name", { ascending: true })
            if (custs) setCustomers(custs)

            // Fetch cash registers
            const { data: registers } = await supabase
                .from("cash_registers")
                .select("*")
                .order("name", { ascending: true })
            if (registers) {
                setCashRegisters(registers)
                if (registers.length > 0) setSelectedCashRegisterId(registers[0].id)
            }

            // Fetch bank accounts
            const { data: banks } = await supabase
                .from("bank_accounts")
                .select("*")
                .order("name", { ascending: true })
            if (banks) {
                setBankAccounts(banks)
                if (banks.length > 0) setSelectedBankAccountId(banks[0].id)
            }

            // Fetch service records
            const { data: services } = await supabase
                .from("service_records")
                .select("*")
                .eq('is_deleted', false)
                .order("created_at", { ascending: false })
            if (services) setServiceRecords(services)

            // Generate temporary invoice number
            setInvoiceNo(`FTR-${Date.now().toString().slice(-6)}`)

            // Load defaults from localStorage
            const savedNotes = localStorage.getItem("default_invoice_notes")
            if (savedNotes && !notes) setNotes(savedNotes)
        }
        loadData()
    }, [open])

    // Global Event Listener to trigger modal and pre-fill from a service record
    useEffect(() => {
        const handleOpen = (e: Event) => {
            const customEvent = e as CustomEvent
            if (customEvent.detail) {
                const { customerId, serviceId, items: incomingItems } = customEvent.detail
                if (customerId) setSelectedCustomerId(customerId)
                if (serviceId) setSelectedServiceId(serviceId)
                if (incomingItems && Array.isArray(incomingItems)) {
                    setItems(incomingItems.map((item: any, idx: number) => ({
                        id: `incoming-${idx}-${Date.now()}`,
                        description: item.description || "Parça / İşçilik Hizmeti",
                        quantity: item.quantity || 1,
                        unitPrice: item.unitPrice || 0,
                        kdvRate: "20"
                    })))
                }
            } else {
                setSelectedCustomerId("")
                setSelectedServiceId("")
                setItems([{ id: "1", description: "", quantity: 1, unitPrice: 0, kdvRate: "20" }])
            }
            setOpen(true)
        }
        window.addEventListener("open-new-invoice", handleOpen)
        return () => window.removeEventListener("open-new-invoice", handleOpen)
    }, [])

    // Helper functions for dynamic items
    const addItem = () => {
        setItems([
            ...items,
            { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0, kdvRate: "20" }
        ])
    }

    const removeItem = (id: string) => {
        if (items.length === 1) {
            toast.warning("Faturada en az bir kalem bulunmalıdır.")
            return
        }
        setItems(items.filter(item => item.id !== id))
    }

    const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value }
            }
            return item
        }))
    }

    // Filter service records by selected customer
    const filteredServices = selectedCustomerId
        ? serviceRecords.filter(s => s.customer_id === selectedCustomerId)
        : []

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

    const selectedCashRegister = cashRegisters.find(r => r.id === selectedCashRegisterId)
    const selectedBankAccount = bankAccounts.find(b => b.id === selectedBankAccountId)

    async function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault()
        
        if (!selectedCustomerId) {
            toast.error("Lütfen bir müşteri seçin.")
            return
        }

        // Validate kurumsal customer
        if (selectedCustomer?.type === "kurumsal") {
            if (!selectedCustomer?.tax_number || !selectedCustomer?.tax_office) {
                toast.error("Kurumsal müşteriler için Vergi No ve Vergi Dairesi tanımlanmış olmalıdır.")
                return
            }
        }

        // Validate payment allocations
        if (paymentMode === "parcali") {
            const totalAllocated = cashAmount + bankAmount
            if (totalAllocated > grandTotal) {
                toast.error(`Girilen toplam tahsilat (${totalAllocated.toLocaleString()} ₺) fatura genel toplamından (${grandTotal.toLocaleString()} ₺) büyük olamaz!`)
                return
            }
        }

        const payload: any = {
            invoiceNo,
            customerId: selectedCustomerId,
            serviceId: selectedServiceId || null,
            paymentType: paymentMode === "single" ? singlePaymentMethod : "parçalı",
            cashRegisterId: (paymentMode === "single" && singlePaymentMethod === "nakit") || paymentMode === "parcali" ? selectedCashRegisterId : null,
            bankAccountId: (paymentMode === "single" && (singlePaymentMethod === "kredi_karti" || singlePaymentMethod === "havale")) || paymentMode === "parcali" ? selectedBankAccountId : null,
            cashAmount: paymentMode === "parcali" ? cashAmount : 0,
            bankAmount: paymentMode === "parcali" ? bankAmount : 0,
            creditAmount: paymentMode === "parcali" ? creditAmount : 0,
            items: items.map(i => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                kdvRate: i.kdvRate
            })),
            notes
        }

        try {
            const res = await createInvoice(payload)
            if (res.success) {
                toast.success("Fatura başarıyla kaydedildi!")
                
                if (submitAction === "save") {
                    setOpen(false)
                    // Reset states
                    setSelectedCustomerId("")
                    setSelectedServiceId("")
                    setNotes("")
                    setItems([{ id: "1", description: "", quantity: 1, unitPrice: 0, kdvRate: "20" }])
                    setCashAmount(0)
                    setBankAmount(0)
                    setPaymentMode("single")
                } else {
                    // Reset states but keep open
                    setSelectedCustomerId("")
                    setSelectedServiceId("")
                    setNotes("")
                    setItems([{ id: "1", description: "", quantity: 1, unitPrice: 0, kdvRate: "20" }])
                    setCashAmount(0)
                    setBankAmount(0)
                    setPaymentMode("single")
                    setInvoiceNo(`FTR-${Date.now().toString().slice(-6)}`)
                }
            } else {
                toast.error(res.message || "Fatura oluşturulurken hata.")
            }
        } catch (err: any) {
            toast.error("Fatura oluşturulurken hata oluştu: " + err.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {triggerVisible && (
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                        <Plus className="w-4 h-4" />
                        Yeni Fatura Oluştur
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent 
                className="sm:max-w-[1200px] w-[95vw] max-h-[95vh] flex flex-col p-0 bg-white overflow-hidden" 
                onInteractOutside={(e) => e.preventDefault()}
            >
                {/* Header: Sabit */}
                <DialogHeader className="px-6 py-4 border-b border-zinc-100 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Yeni Fatura Düzenle
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 text-xs">
                            Müşteri için satış faturası oluşturun ve tahsilat/cari borç dağılımını yapın.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
                    {/* Grid Body: Sol Form, Sağ Önizleme */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                            
                            {/* Sol Bölüm: Form Alanı */}
                            <div className="xl:col-span-7 space-y-6">
                                
                                {/* Bölüm 1: Müşteri & Servis Seçimi */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">1. Cari ve Referans Seçimi</h4>
                                        {selectedServiceId && (
                                            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" /> Servis Kaydından Aktarıldı
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-px bg-zinc-100 w-full" />
                                    
                                    {/* Müşteri Arama */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-zinc-700">Müşteri Seçimi <span className="text-red-500">*</span></Label>
                                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={comboboxOpen}
                                                    className="w-full justify-between font-normal text-left h-10 border-zinc-200 bg-white text-xs"
                                                >
                                                    {selectedCustomerId
                                                        ? `${selectedCustomer?.first_name} ${selectedCustomer?.last_name || ""} (${selectedCustomer?.phone})`
                                                        : "Müşteri arayın veya seçin..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border border-zinc-200 shadow-md rounded-md overflow-hidden z-50">
                                                <Command>
                                                    <CommandInput placeholder="Müşteri ara..." className="text-xs" />
                                                    <CommandList>
                                                        <CommandEmpty className="text-xs p-3">Müşteri bulunamadı.</CommandEmpty>
                                                        <CommandGroup>
                                                            {customers.map((customer) => (
                                                                <CommandItem
                                                                    key={customer.id}
                                                                    value={`${customer.first_name} ${customer.last_name || ""} ${customer.phone}`}
                                                                    onSelect={() => {
                                                                        setSelectedCustomerId(customer.id)
                                                                        setComboboxOpen(false)
                                                                        setSelectedServiceId("")
                                                                    }}
                                                                    className="text-xs cursor-pointer p-2 hover:bg-zinc-50"
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {customer.first_name} {customer.last_name || ""} ({customer.phone})
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        {selectedCustomer?.type === "kurumsal" && (!selectedCustomer?.tax_number || !selectedCustomer?.tax_office) && (
                                            <p className="text-[10px] text-red-500 font-medium">
                                                ⚠️ Seçilen kurumsal müşterinin VKN veya Vergi Dairesi eksik! Fatura kesilmeden önce müşteri detayından tamamlanmalıdır.
                                            </p>
                                        )}
                                    </div>

                                    {/* İlişkili Servis Kaydı */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-zinc-700">İlişkili Servis Kaydı (Opsiyonel)</Label>
                                        <Select 
                                            value={selectedServiceId} 
                                            onValueChange={setSelectedServiceId}
                                            disabled={!selectedCustomerId}
                                        >
                                            <SelectTrigger className="border-zinc-200 bg-white text-xs h-10">
                                                <SelectValue placeholder={
                                                    selectedCustomerId 
                                                        ? filteredServices.length > 0 
                                                            ? "İlişkili servis kaydını seçin..." 
                                                            : "Bu müşteriye ait aktif servis kaydı bulunmuyor."
                                                        : "Önce müşteri seçmelisiniz"
                                                } />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white">
                                                {filteredServices.map(s => (
                                                    <SelectItem key={s.id} value={s.id} className="text-xs">
                                                        {s.service_code} - {s.service_type === "bakim" ? "Periyodik Bakım" : "Onarım"}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Bölüm 2: Fatura Detayları & Esnek Tahsilat Kontrolleri */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">2. Fatura ve Finansal Dağılım</h4>
                                    <div className="h-px bg-zinc-100 w-full" />
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="invoiceNo" className="text-xs font-medium text-zinc-700">Fatura Numarası <span className="text-red-500">*</span></Label>
                                            <Input 
                                                id="invoiceNo" 
                                                value={invoiceNo}
                                                onChange={(e) => setInvoiceNo(e.target.value)}
                                                placeholder="Örn: FTR202600001" 
                                                required 
                                                className="border-zinc-200 text-xs h-10 bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-700">Ödeme Yapısı</Label>
                                            <div className="grid grid-cols-2 gap-1 bg-zinc-100 p-1 rounded-lg">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPaymentMode("single")
                                                        setCashAmount(0)
                                                        setBankAmount(0)
                                                    }}
                                                    className={cn(
                                                        "text-xs py-1.5 rounded-md font-semibold transition-all",
                                                        paymentMode === "single" 
                                                            ? "bg-white text-zinc-900 shadow-sm" 
                                                            : "text-zinc-500 hover:text-zinc-900"
                                                    )}
                                                >
                                                    Tek Yöntem
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPaymentMode("parcali")
                                                        setCashAmount(0)
                                                        setBankAmount(0)
                                                    }}
                                                    className={cn(
                                                        "text-xs py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1",
                                                        paymentMode === "parcali" 
                                                            ? "bg-white text-zinc-900 shadow-sm" 
                                                            : "text-zinc-500 hover:text-zinc-900"
                                                    )}
                                                >
                                                    <Split className="w-3.5 h-3.5 text-blue-500" />
                                                    Parçalı Ödeme
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tekli Ödeme Seçenekleri */}
                                    {paymentMode === "single" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 p-4 border border-zinc-200 rounded-lg">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-zinc-700">Ödeme Yöntemi</Label>
                                                <Select value={singlePaymentMethod} onValueChange={setSinglePaymentMethod}>
                                                    <SelectTrigger className="border-zinc-200 bg-white text-xs h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white">
                                                        <SelectItem value="kredi_karti" className="text-xs">Kredi Kartı</SelectItem>
                                                        <SelectItem value="havale" className="text-xs">EFT / Havale</SelectItem>
                                                        <SelectItem value="nakit" className="text-xs">Nakit (Kasa)</SelectItem>
                                                        <SelectItem value="acik_hesap" className="text-xs">Açık Hesap (Cari Borç)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {singlePaymentMethod === "nakit" && (
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium text-zinc-700">Tahsil Edilecek Kasa <span className="text-red-500">*</span></Label>
                                                    <Select value={selectedCashRegisterId} onValueChange={setSelectedCashRegisterId}>
                                                        <SelectTrigger className="border-zinc-200 bg-white text-xs h-9">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white">
                                                            {cashRegisters.map(r => (
                                                                <SelectItem key={r.id} value={r.id} className="text-xs">{r.name} ({r.balance} ₺)</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {(singlePaymentMethod === "kredi_karti" || singlePaymentMethod === "havale") && (
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium text-zinc-700">Tahsil Edilecek Banka Hesabı <span className="text-red-500">*</span></Label>
                                                    <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
                                                        <SelectTrigger className="border-zinc-200 bg-white text-xs h-9">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white">
                                                            {bankAccounts.map(b => (
                                                                <SelectItem key={b.id} value={b.id} className="text-xs">{b.name} ({b.balance} ₺)</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {singlePaymentMethod === "acik_hesap" && (
                                                <div className="md:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-800 font-medium">
                                                    📌 Fatura tutarının tamamı tahsil edilmeden müşterinin cari hesabına <strong>borç</strong> olarak kaydedilecektir.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Parçalı / Taksitli Ödeme Arayüzü */}
                                    {paymentMode === "parcali" && (
                                        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-4">
                                            <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                                                <span className="text-xs font-bold text-zinc-700">Parçalı Ödeme & Kapora Girişi</span>
                                                <span className="text-[10px] text-zinc-400 font-medium">Fatura Toplamı: {grandTotal.toLocaleString()} ₺</span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                
                                                {/* Nakit Kısmı */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] font-semibold text-zinc-600">Nakit (Kapora/Peşinat)</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={cashAmount || ""}
                                                        onChange={(e) => setCashAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                                                        className="border-zinc-200 text-xs bg-white"
                                                        placeholder="0.00 ₺"
                                                    />
                                                    <Select value={selectedCashRegisterId} onValueChange={setSelectedCashRegisterId}>
                                                        <SelectTrigger className="border-zinc-200 bg-white text-[10px] h-7 px-2">
                                                            <SelectValue placeholder="Kasa..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white">
                                                            {cashRegisters.map(r => (
                                                                <SelectItem key={r.id} value={r.id} className="text-[10px]">{r.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Banka/POS Kısmı */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] font-semibold text-zinc-600">Banka / Kart Tahsilat</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={bankAmount || ""}
                                                        onChange={(e) => setBankAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                                                        className="border-zinc-200 text-xs bg-white"
                                                        placeholder="0.00 ₺"
                                                    />
                                                    <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
                                                        <SelectTrigger className="border-zinc-200 bg-white text-[10px] h-7 px-2">
                                                            <SelectValue placeholder="Banka..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white">
                                                            {bankAccounts.map(b => (
                                                                <SelectItem key={b.id} value={b.id} className="text-[10px]">{b.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Cari Açık Hesap Kısmı */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] font-semibold text-zinc-600">Kalan Cari Borç (Açık Hesap)</Label>
                                                    <Input
                                                        type="text"
                                                        readOnly
                                                        value={`${creditAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`}
                                                        className="border-zinc-200 text-xs bg-zinc-100 font-bold text-zinc-700"
                                                    />
                                                    <p className="text-[9px] text-zinc-400 leading-tight">Bu tutar doğrudan müşterinin cari borcuna yansıtılır.</p>
                                                </div>
                                            </div>

                                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-[10px] text-blue-700 leading-relaxed">
                                                <strong>Muhasebe Dağılımı:</strong> Tahsil edilen Nakit tutarı kasa bakiyesine, Banka tutarı ise banka bakiyesine anında eklenecek, kalan Açık Hesap tutarı ise cari bakiye trigger'ları vasıtasıyla müşteriye borç yazılacaktır.
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Bölüm 3: Fatura Kalemleri */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">3. Fatura Kalem Detayları</h4>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addItem}
                                            className="h-8 text-xs gap-1 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Kalem Ekle
                                        </Button>
                                    </div>
                                    <div className="h-px bg-zinc-100 w-full" />

                                    <div className="space-y-3">
                                        {items.map((item, index) => (
                                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-150 items-end">
                                                <div className="md:col-span-6 space-y-1">
                                                    <Label className="text-[10px] font-semibold text-zinc-500">Açıklama / Ürün <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        value={item.description}
                                                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                                        placeholder="Örn: 10W-40 Motor Yağı veya Rot Ayarı İşçilik"
                                                        required
                                                        className="border-zinc-200 text-xs h-8 bg-white"
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <Label className="text-[10px] font-semibold text-zinc-500">Miktar <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                                                        required
                                                        className="border-zinc-200 text-xs h-8 bg-white text-center"
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <Label className="text-[10px] font-semibold text-zinc-500">Birim Fiyat <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unitPrice || ""}
                                                        onChange={(e) => updateItem(item.id, "unitPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                                                        required
                                                        className="border-zinc-200 text-xs h-8 bg-white text-right"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div className="md:col-span-1.5 flex items-center justify-end h-8">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => removeItem(item.id)}
                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Bölüm 4: Açıklama ve Notlar */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-xs font-semibold text-zinc-700">Fatura Notları & Açıklama (Opsiyonel)</Label>
                                    <Textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Faturaya eklenecek genel açıklama veya banka IBAN bilgileri..."
                                        className="border-zinc-200 text-xs bg-white min-h-[60px]"
                                    />
                                </div>

                                {/* Toplam Tutar Özet Tablosu */}
                                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-xs text-zinc-500">
                                        <span>Ara Toplam (KDV Hariç):</span>
                                        <span className="font-medium">{subTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-zinc-500">
                                        <span>Toplam KDV (%20):</span>
                                        <span className="font-medium">{taxAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold text-zinc-900 border-t border-zinc-200 pt-2 mt-2">
                                        <span>Genel Toplam (KDV Dahil):</span>
                                        <span>{grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                                    </div>
                                </div>

                            </div>

                            {/* Sağ Bölüm: WYSIWYG A4 Canlı Önizleme */}
                            <div className="xl:col-span-5 sticky top-0 bg-zinc-100 border border-zinc-250 rounded-xl p-5 shadow-inner max-h-[82vh] overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        Müşteri A4 Baskı Önizlemesi
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-semibold">Canlı Önizleme</span>
                                </div>

                                {/* A4 Sayfa Tasarımı Mockup */}
                                <div className="bg-white shadow-lg border border-zinc-300 w-full p-6 text-zinc-900 font-sans text-[10px] leading-relaxed space-y-6 aspect-[1/1.41] overflow-hidden rounded-sm select-none">
                                    
                                    {/* Önizleme Header */}
                                    <div className="flex justify-between items-start border-b border-zinc-350 pb-4">
                                        <div>
                                            <h2 className="text-sm font-extrabold tracking-tight text-blue-600 leading-none">OMES</h2>
                                            <span className="text-[8px] text-zinc-400">Teknik Servis Yönetim Sistemi</span>
                                        </div>
                                        <div className="text-right space-y-0.5">
                                            <h3 className="text-xs font-bold leading-none uppercase tracking-wide">SATIŞ FATURASI</h3>
                                            <p className="font-semibold text-zinc-700">No: {invoiceNo || "FTR-******"}</p>
                                            <p className="text-zinc-500 text-[8px]">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>

                                    {/* Önizleme Cari ve Detaylar */}
                                    <div className="grid grid-cols-2 gap-4 border border-zinc-200 rounded p-3 bg-zinc-50/50">
                                        <div className="space-y-1 text-zinc-800">
                                            <span className="font-bold text-zinc-400 uppercase text-[8px] border-b pb-0.5 block">Fatura Alıcısı</span>
                                            <p className="font-semibold">{selectedCustomerId ? `${selectedCustomer?.first_name} ${selectedCustomer?.last_name || ""}` : "Seçilmedi"}</p>
                                            {selectedCustomerId && <p>Tel: {selectedCustomer?.phone}</p>}
                                            {selectedCustomer?.type === "kurumsal" && (
                                                <>
                                                    <p>V.D: {selectedCustomer?.tax_office || "-"}</p>
                                                    <p>VKN: {selectedCustomer?.tax_number || "-"}</p>
                                                </>
                                            )}
                                        </div>
                                        <div className="space-y-1 text-zinc-800">
                                            <span className="font-bold text-zinc-400 uppercase text-[8px] border-b pb-0.5 block">Fatura Bilgileri</span>
                                            <p><strong>Ödeme Tipi:</strong> {paymentMode === "parcali" ? "Parçalı Ödeme" : (singlePaymentMethod === "nakit" ? "Nakit (Kasa)" : singlePaymentMethod === "acik_hesap" ? "Açık Hesap (Cari)" : "Banka/Kart")}</p>
                                            <p><strong>Durum:</strong> {paymentMode === "parcali" ? (creditAmount <= 0 ? "Ödendi" : "Kısmi Ödendi") : (singlePaymentMethod === "acik_hesap" ? "Açık Hesap (Bekliyor)" : "Ödendi")}</p>
                                        </div>
                                    </div>

                                    {/* Kalemler Tablosu */}
                                    <div className="space-y-1">
                                        <table className="w-full text-left text-[9px] border-collapse">
                                            <thead>
                                                <tr className="border-b border-zinc-300 bg-zinc-100/80 font-bold text-zinc-700">
                                                    <th className="py-1 px-2">Açıklama</th>
                                                    <th className="py-1 px-2 text-center w-12">Adet</th>
                                                    <th className="py-1 px-2 text-right w-20">Birim</th>
                                                    <th className="py-1 px-2 text-right w-20">Toplam</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-200">
                                                {items.map((item, idx) => {
                                                    const total = item.quantity * item.unitPrice
                                                    return (
                                                        <tr key={item.id} className="text-zinc-800">
                                                            <td className="py-1.5 px-2 truncate max-w-[150px] font-semibold">{item.description || "Açıklama girilmedi"}</td>
                                                            <td className="py-1.5 px-2 text-center">{item.quantity}</td>
                                                            <td className="py-1.5 px-2 text-right">{item.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</td>
                                                            <td className="py-1.5 px-2 text-right font-bold">{total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Toplam Bilgiler ve QR */}
                                    <div className="flex justify-between items-end border-t border-zinc-200 pt-3">
                                        <div>
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`http://localhost:3000/invoices/preview`)}`} 
                                                alt="QR Code" 
                                                className="w-12 h-12 border border-zinc-200 p-0.5 rounded bg-white" 
                                            />
                                        </div>
                                        <div className="w-48 text-right space-y-1">
                                            <div className="flex justify-between text-zinc-500 text-[9px]">
                                                <span>Ara Toplam:</span>
                                                <span>{subTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                                            </div>
                                            <div className="flex justify-between text-zinc-500 text-[9px]">
                                                <span>KDV (%20):</span>
                                                <span>{taxAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-zinc-950 text-xs border-t border-zinc-200 pt-1 mt-1">
                                                <span>Genel Toplam:</span>
                                                <span>{grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parçalı Ödeme Dağılım Detayı */}
                                    {paymentMode === "parcali" && (
                                        <div className="bg-zinc-50 border border-zinc-200 rounded p-2 space-y-1 text-[8px] text-zinc-700">
                                            <div className="font-bold border-b border-zinc-200 pb-0.5 mb-1">Tahsilat & Kalan Cari Dağılımı</div>
                                            <div className="flex justify-between">
                                                <span>Nakit Ödenen ({selectedCashRegister?.name || "Kasa"}):</span>
                                                <span className="font-semibold">{cashAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Kart/Banka Ödenen ({selectedBankAccount?.name || "Banka"}):</span>
                                                <span className="font-semibold">{bankAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                                            </div>
                                            <div className="flex justify-between text-red-600 font-bold border-t border-zinc-200/50 pt-0.5 mt-0.5">
                                                <span>Açık Hesap (Müşteri Cari Borcu):</span>
                                                <span>{creditAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* İmza Notu */}
                                    <div className="grid grid-cols-2 gap-4 text-center text-[7px] text-zinc-400 font-bold uppercase pt-8">
                                        <div>
                                            <p className="border-t border-zinc-150 pt-1">Düzenleyen (Kaşe / İmza)</p>
                                        </div>
                                        <div>
                                            <p className="border-t border-zinc-150 pt-1">Teslim Alan (İsim / İmza)</p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer: Sabit (Sticky) */}
                    <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row justify-end gap-2 mt-auto">
                        <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full sm:w-auto text-xs h-9" 
                            onClick={() => setOpen(false)}
                        >
                            İptal
                        </Button>
                        <Button 
                            type="submit" 
                            variant="secondary"
                            className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium text-xs h-9"
                            onClick={() => setSubmitAction("saveAndAdd")}
                            disabled={!selectedCustomerId || (selectedCustomer?.type === "kurumsal" && (!selectedCustomer?.tax_number || !selectedCustomer?.tax_office))}
                        >
                            Kaydet ve Yeni Ekle
                        </Button>
                        <Button 
                            type="submit" 
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9"
                            onClick={() => setSubmitAction("save")}
                            disabled={!selectedCustomerId || (selectedCustomer?.type === "kurumsal" && (!selectedCustomer?.tax_number || !selectedCustomer?.tax_office))}
                        >
                            Faturayı Kaydet ve Kes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}