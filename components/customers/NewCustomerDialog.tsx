"use client"

import { useState, useRef, useEffect } from "react"
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
import { Plus, HelpCircle } from "lucide-react"
import { createCustomer, getCustomerGroups } from "./actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function NewCustomerDialog({ triggerVisible = true }: { triggerVisible?: boolean }) {
    const [open, setOpen] = useState(false)
    const [customerType, setCustomerType] = useState("bireysel")
    const [customerCode, setCustomerCode] = useState("")
    const [phone, setPhone] = useState("")
    const [taxNumber, setTaxNumber] = useState("")
    const [discountRate, setDiscountRate] = useState("0")
    const [groups, setGroups] = useState<any[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState("none")
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitAction, setSubmitAction] = useState<"save" | "saveAndAdd">("save")

    const formRef = useRef<HTMLFormElement>(null)
    const firstInputRef = useRef<HTMLInputElement>(null)

    // Load groups and reset errors when dialog opens
    useEffect(() => {
        if (open) {
            setErrors({})
            setDiscountRate("0")
            setSelectedGroupId("none")
            setCustomerCode("")
            
            getCustomerGroups().then((data) => {
                setGroups(data)
            })
        }
    }, [open])

    useEffect(() => {
        const handleOpen = () => setOpen(true)
        window.addEventListener("open-new-customer", handleOpen)
        return () => window.removeEventListener("open-new-customer", handleOpen)
    }, [])

    const handleGroupChange = (groupId: string) => {
        setSelectedGroupId(groupId)
        if (groupId === "none") {
            setDiscountRate("0")
        } else {
            const group = groups.find(g => g.id === groupId)
            if (group) {
                setDiscountRate(group.discount_rate.toString())
            }
        }
    }

    const validatePhone = (val: string) => {
        if (!val) return "Telefon numarası zorunludur."
        const cleanVal = val.replace(/\D/g, "")
        if (cleanVal.length < 10) {
            return "Telefon numarası en az 10 haneli olmalıdır."
        }
        return ""
    }

    const validateTaxNumber = (val: string) => {
        if (!val) return "Vergi No / TCKN zorunludur."
        if (!/^\d+$/.test(val)) return "Sadece rakam girilmelidir."
        if (val.length !== 10 && val.length !== 11) {
            return "Vergi No 10 haneli, TCKN 11 haneli olmalıdır."
        }
        return ""
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setPhone(val)
        const errMsg = validatePhone(val)
        setErrors(prev => ({ ...prev, phone: errMsg }))
    }

    const handleTaxNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setTaxNumber(val)
        const errMsg = validateTaxNumber(val)
        setErrors(prev => ({ ...prev, taxNumber: errMsg }))
    }

    async function handleSubmit(formData: FormData) {
        // Validate inputs before submitting
        const phoneErr = validatePhone(phone)
        const taxNumberErr = customerType === "kurumsal" ? validateTaxNumber(taxNumber) : ""

        if (phoneErr || taxNumberErr) {
            setErrors({ phone: phoneErr, taxNumber: taxNumberErr })
            toast.error("Lütfen formdaki hataları kontrol edin.")
            return
        }

        // Set customer code value as it is set via React state
        formData.set("customerCode", customerCode)

        try {
            const result = await createCustomer(formData)
            if (result.success) {
                toast.success("Müşteri başarıyla kaydedildi!")
                if (submitAction === "save") {
                    setOpen(false)
                    setCustomerType("bireysel")
                    setPhone("")
                    setTaxNumber("")
                    setDiscountRate("0")
                    setSelectedGroupId("none")
                    setErrors({})
                } else {
                    // Reset form state but keep dialog open
                    formRef.current?.reset()
                    setCustomerType("bireysel")
                    setPhone("")
                    setTaxNumber("")
                    setDiscountRate("0")
                    setSelectedGroupId("none")
                    setErrors({})
                    setCustomerCode("")
                    setTimeout(() => {
                        firstInputRef.current?.focus()
                    }, 100)
                }
            } else {
                toast.error(result.message || "Müşteri kaydedilirken bir hata oluştu.")
            }
        } catch (err: any) {
            console.error("Beklenmeyen Hata:", err)
            toast.error("Beklenmeyen bir hata oluştu: " + (err.message || 'Sunucu hatası'))
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {triggerVisible && (
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                        <Plus className="w-4 h-4" />
                        Yeni Müşteri Ekle
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent 
                className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 bg-white overflow-hidden" 
                onInteractOutside={(e) => e.preventDefault()}
                onOpenAutoFocus={(e) => {
                    e.preventDefault()
                    firstInputRef.current?.focus()
                }}
            >
                {/* Header: Sabit */}
                <DialogHeader className="px-6 py-4 border-b border-zinc-100">
                    <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">Yeni Müşteri Ekle</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Müşterinin operasyonel ve finansal detaylarını girin.
                    </DialogDescription>
                </DialogHeader>

                <form ref={formRef} action={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    {/* Body: Kaydırılabilir (Scrollable) Alan */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                        
                        {/* Bölüm 1: Kişisel Bilgiler */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">1. Genel Bilgiler</h4>
                            <div className="h-px bg-zinc-100 w-full" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Müşteri Tipi <span className="text-red-500">*</span></Label>
                                    <Select name="type" value={customerType} onValueChange={setCustomerType}>
                                        <SelectTrigger className="border-zinc-200 bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="bireysel">Bireysel Müşteri</SelectItem>
                                            <SelectItem value="kurumsal">Kurumsal Müşteri</SelectItem>
                                            <SelectItem value="personel">Personel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Müşteri Grubu</Label>
                                    <Select name="groupId" value={selectedGroupId} onValueChange={handleGroupChange}>
                                        <SelectTrigger className="border-zinc-200 bg-white">
                                            <SelectValue placeholder="Grup Seçin" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="none">Grup Yok (Standart)</SelectItem>
                                            {groups.map((g) => (
                                                <SelectItem key={g.id} value={g.id}>
                                                    {g.name} (%{g.discount_rate})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customerCode">Müşteri Kodu</Label>
                                    <Input 
                                        ref={firstInputRef}
                                        id="customerCode" 
                                        name="customerCode" 
                                        value={customerCode}
                                        onChange={(e) => setCustomerCode(e.target.value)}
                                        placeholder="Örn: MSTM-0001 (İsteğe bağlı)" 
                                        className="border-zinc-200 bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Adı / Firma Adı <span className="text-red-500">*</span></Label>
                                    <Input id="firstName" name="firstName" placeholder={customerType === "kurumsal" ? "Örn: Örnek Ltd. Şti." : "Ahmet"} required className="border-zinc-200 bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Soyadı {customerType !== "kurumsal" && <span className="text-red-500">*</span>}</Label>
                                    <Input 
                                        id="lastName" 
                                        name="lastName" 
                                        placeholder={customerType === "kurumsal" ? "Boş bırakılabilir" : "Yılmaz"} 
                                        required={customerType !== "kurumsal"} 
                                        className="border-zinc-200 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Kurumsal Bilgiler (Sadece Kurumsal Seçildiğinde) */}
                        {customerType === "kurumsal" && (
                            <div className="space-y-4 pt-2">
                                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kurumsal Bilgiler</h4>
                                <div className="h-px bg-zinc-100 w-full" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="taxOffice">Vergi Dairesi <span className="text-red-500">*</span></Label>
                                        <Input id="taxOffice" name="taxOffice" placeholder="Örn: Boğaziçi VD" required={customerType === "kurumsal"} className="border-zinc-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="taxNumber">Vergi No / TCKN <span className="text-red-500">*</span></Label>
                                        <Input 
                                            id="taxNumber" 
                                            name="taxNumber" 
                                            value={taxNumber}
                                            onChange={handleTaxNumberChange}
                                            placeholder="10 haneli VKN veya 11 haneli TCKN" 
                                            required={customerType === "kurumsal"} 
                                            className={cn("border-zinc-200", errors.taxNumber ? "border-red-500 focus-visible:ring-red-500" : "")}
                                        />
                                        {errors.taxNumber && <p className="text-xs text-red-500 mt-1">{errors.taxNumber}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bölüm 2: İletişim & Konum */}
                        <div className="space-y-4 pt-2">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">2. İletişim & Konum</h4>
                            <div className="h-px bg-zinc-100 w-full" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefon Numarası <span className="text-red-500">*</span></Label>
                                    <Input 
                                        id="phone" 
                                        name="phone" 
                                        type="tel" 
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder="0555 555 55 55" 
                                        required 
                                        className={cn("border-zinc-200", errors.phone ? "border-red-500 focus-visible:ring-red-500" : "")}
                                    />
                                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-posta Adresi</Label>
                                    <Input id="email" name="email" type="email" placeholder="ahmet@yolcu.com" className="border-zinc-200" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">İl</Label>
                                    <Input id="city" name="city" placeholder="Düzce" className="border-zinc-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="district">İlçe</Label>
                                    <Input id="district" name="district" placeholder="Merkez" className="border-zinc-200" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Açık Adres</Label>
                                <Textarea id="address" name="address" placeholder="Müşterinin fatura/ikamet adresi..." className="resize-none h-16 border-zinc-200 w-full" />
                            </div>
                        </div>

                        {/* Bölüm 3: Finansal Tercihler & Notlar */}
                        <div className="space-y-4 pt-2">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">3. Finansal Tercihler & Notlar</h4>
                            <div className="h-px bg-zinc-100 w-full" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5">
                                        <Label htmlFor="discountRate">Tanımlı İskonto Oranı (%)</Label>
                                        <div className="group relative inline-block">
                                            <HelpCircle className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 cursor-pointer" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 hidden group-hover:block bg-zinc-900 text-white text-[11px] font-normal rounded p-2 shadow-lg leading-normal z-50">
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                                                Bu müşteriye faturalarda uygulanacak varsayılan indirim oranıdır.
                                            </div>
                                        </div>
                                    </div>
                                    <Input 
                                        id="discountRate" 
                                        name="discountRate" 
                                        type="number" 
                                        min="0" 
                                        max="100" 
                                        step="0.01" 
                                        value={discountRate}
                                        onChange={(e) => setDiscountRate(e.target.value)}
                                        placeholder="Örn: 10" 
                                        className="border-zinc-200 bg-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Özel Notlar</Label>
                                <Textarea id="notes" name="notes" placeholder="Müşteri hakkında hatırlatıcı notlar..." className="resize-none h-16 border-zinc-200 w-full" />
                            </div>
                        </div>
                    </div>

                    {/* Footer: Sabit (Sticky) */}
                    <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row justify-end gap-2 mt-auto">
                        <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full sm:w-auto" 
                            onClick={() => setOpen(false)}
                        >
                            İptal
                        </Button>
                        <Button 
                            type="submit" 
                            variant="secondary"
                            className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                            onClick={() => setSubmitAction("saveAndAdd")}
                        >
                            Kaydet ve Yeni Ekle
                        </Button>
                        <Button 
                            type="submit" 
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => setSubmitAction("save")}
                        >
                            Müşteriyi Kaydet
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}