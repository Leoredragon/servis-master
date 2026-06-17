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
    DialogFooter,
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
import { Plus, ChevronsUpDown, Check, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createInvoice } from "./actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function NewInvoiceDialog() {
    const [open, setOpen] = useState(false)
    const [customers, setCustomers] = useState<any[]>([])
    const [cashRegisters, setCashRegisters] = useState<any[]>([])
    const [bankAccounts, setBankAccounts] = useState<any[]>([])
    const [serviceRecords, setServiceRecords] = useState<any[]>([])

    // Form states
    const [invoiceNo, setInvoiceNo] = useState("")
    const [selectedCustomerId, setSelectedCustomerId] = useState("")
    const [selectedServiceId, setSelectedServiceId] = useState("")
    const [paymentType, setPaymentType] = useState("kredi_karti")
    const [selectedCashRegisterId, setSelectedCashRegisterId] = useState("")
    const [selectedBankAccountId, setSelectedBankAccountId] = useState("")

    const [comboboxOpen, setComboboxOpen] = useState(false)

    // Invoice item states
    const [description, setDescription] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [unitPrice, setUnitPrice] = useState(0)
    const [kdvRate, setKdvRate] = useState("20")

    // Calculations
    const subTotal = quantity * unitPrice
    const taxAmount = subTotal * (parseFloat(kdvRate) / 100)
    const grandTotal = subTotal + taxAmount

    // Load dynamic data from Supabase
    useEffect(() => {
        if (!open) return

        const supabase = createClient()
        async function loadData() {
            // Fetch customers
            const { data: custs } = await supabase
                .from("customers")
                .select("*")
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
                .order("created_at", { ascending: false })
            if (services) setServiceRecords(services)

            // Generate temporary invoice number
            setInvoiceNo(`FTR-${Date.now().toString().slice(-6)}`)

            // Load defaults from localStorage
            const savedKdv = localStorage.getItem("default_kdv_rate")
            if (savedKdv) setKdvRate(savedKdv)

            const savedNotes = localStorage.getItem("default_invoice_notes")
            if (savedNotes) setDescription(savedNotes)
        }
        loadData()
    }, [open])

    // Filter service records by selected customer
    const filteredServices = selectedCustomerId
        ? serviceRecords.filter(s => s.customer_id === selectedCustomerId)
        : []

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

    async function handleSubmit(formData: FormData) {
        if (!selectedCustomerId) {
            toast.error("Lütfen bir müşteri seçin.")
            return
        }

        formData.append("customerId", selectedCustomerId)
        formData.append("serviceId", selectedServiceId)
        formData.append("paymentType", paymentType)
        formData.append("cashRegisterId", selectedCashRegisterId)
        formData.append("bankAccountId", selectedBankAccountId)
        formData.append("subTotal", subTotal.toString())
        formData.append("taxAmount", taxAmount.toString())
        formData.append("grandTotal", grandTotal.toString())

        try {
            const res = await createInvoice(formData)
            if (res.success) {
                toast.success("Fatura başarıyla kaydedildi!")
                setOpen(false)
                
                // Reset states
                setSelectedCustomerId("")
                setSelectedServiceId("")
                setDescription("")
                setQuantity(1)
                setUnitPrice(0)
            } else {
                toast.error(res.message || "Fatura oluşturulurken hata.")
            }
        } catch (err: any) {
            toast.error("Fatura oluşturulurken hata oluştu: " + err.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Yeni Fatura Oluştur
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl">Yeni Fatura Kaydı</DialogTitle>
                    <DialogDescription>
                        Müşteri için yeni bir satış faturası düzenleyin.
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit} className="space-y-6">
                    {/* Müşteri Arama */}
                    <div className="space-y-2">
                        <Label>Müşteri</Label>
                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={comboboxOpen}
                                    className="w-full justify-between font-normal text-left h-10 border-zinc-200"
                                >
                                    {selectedCustomerId
                                        ? `${selectedCustomer?.first_name} ${selectedCustomer?.last_name || ""} (${selectedCustomer?.phone})`
                                        : "Müşteri arayın veya seçin..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border border-zinc-200 shadow-md rounded-md overflow-hidden">
                                <Command>
                                    <CommandInput placeholder="İsim veya telefon yazarak arayın..." />
                                    <CommandList>
                                        <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>
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
                            <p className="text-xs text-red-500">
                                Uyarı: Seçilen kurumsal müşterinin VKN/TCKN veya Vergi Dairesi eksik! Fatura kesilmeden önce müşteri kartından tamamlanmalıdır.
                            </p>
                        )}
                    </div>

                    {/* İlişkili Servis Kaydı */}
                    <div className="space-y-2">
                        <Label>İlişkili Servis Kaydı (Opsiyonel)</Label>
                        <Select 
                            value={selectedServiceId} 
                            onValueChange={setSelectedServiceId}
                            disabled={!selectedCustomerId}
                        >
                            <SelectTrigger className="border-zinc-200">
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
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.service_code} - {s.service_type === "bakim" ? "Periyodik Bakım" : "Onarım"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Fatura No ve Ödeme Yöntemi */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                        <div className="space-y-2">
                            <Label htmlFor="invoiceNo">Fatura Numarası</Label>
                            <Input 
                                id="invoiceNo" 
                                name="invoiceNo"
                                value={invoiceNo}
                                onChange={(e) => setInvoiceNo(e.target.value)}
                                placeholder="Örn: FTR202600001" 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ödeme Yöntemi</Label>
                            <Select value={paymentType} onValueChange={setPaymentType}>
                                <SelectTrigger className="border-zinc-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="kredi_karti">Kredi Kartı</SelectItem>
                                    <SelectItem value="havale">EFT / Havale</SelectItem>
                                    <SelectItem value="nakit">Nakit (Kasa)</SelectItem>
                                    <SelectItem value="acik_hesap">Açık Hesap (Cari)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Hesap Seçimi (Kasa veya Banka) */}
                    {paymentType === "nakit" && (
                        <div className="space-y-2">
                            <Label>Tahsil Edilecek Kasa</Label>
                            <Select value={selectedCashRegisterId} onValueChange={setSelectedCashRegisterId}>
                                <SelectTrigger className="border-zinc-200">
                                    <SelectValue placeholder="Kasa seçin..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {cashRegisters.map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.name} (Bakiye: {r.balance} ₺)</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {(paymentType === "kredi_karti" || paymentType === "havale") && (
                        <div className="space-y-2">
                            <Label>Tahsil Edilecek Banka Hesabı</Label>
                            <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
                                <SelectTrigger className="border-zinc-200">
                                    <SelectValue placeholder="Banka seçin..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {bankAccounts.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name} (Bakiye: {b.balance} ₺)</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {paymentType === "acik_hesap" && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
                            <strong>Açık Hesap Bilgilendirmesi:</strong> Fatura tutarı tahsil edilmeyip müşterinin cari bakiyesine <strong>borç</strong> olarak yansıtılacaktır.
                        </div>
                    )}

                    {/* Fatura Kalem Detayları */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100">
                        <h3 className="text-sm font-semibold text-zinc-900">Fatura Kalemi</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-3 space-y-1">
                                <Label htmlFor="description">Ürün/Hizmet Açıklaması</Label>
                                <Input 
                                    id="description" 
                                    name="description" 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Örn: 10.000 KM Bakım Hizmet Bedeli ve Malzeme" 
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="quantity">Miktar</Label>
                                <Input 
                                    id="quantity" 
                                    name="quantity" 
                                    type="number" 
                                    min="1" 
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    required 
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="unitPrice">Birim Fiyat (KDV Hariç)</Label>
                                <Input 
                                    id="unitPrice" 
                                    name="unitPrice" 
                                    type="number" 
                                    min="0" 
                                    step="0.01"
                                    value={unitPrice}
                                    onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                                    required 
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>KDV Oranı</Label>
                                <Select value={kdvRate} onValueChange={setKdvRate}>
                                    <SelectTrigger className="border-zinc-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="20">%20</SelectItem>
                                        <SelectItem value="10">%10</SelectItem>
                                        <SelectItem value="0">%0 (Muaf)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Finansal Detaylar */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm text-zinc-500">
                            <span>Ara Toplam (KDV Hariç):</span>
                            <span>{subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                        <div className="flex justify-between text-sm text-zinc-500">
                            <span>Hesaplanan KDV (%{kdvRate}):</span>
                            <span>{taxAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-zinc-900 border-t border-zinc-200 pt-2 mt-2">
                            <span>Genel Toplam (KDV Dahil):</span>
                            <span>{grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-zinc-100">
                        <Button 
                            type="submit" 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={!selectedCustomerId || (selectedCustomer?.type === "kurumsal" && (!selectedCustomer?.tax_number || !selectedCustomer?.tax_office))}
                        >
                            Faturayı Kaydet ve Kes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}