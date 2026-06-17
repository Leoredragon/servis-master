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
import { createCustomer } from "./actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function NewCustomerDialog() {
    const [open, setOpen] = useState(false)
    const [customerType, setCustomerType] = useState("bireysel")
    const [customerCode, setCustomerCode] = useState("")
    const [phone, setPhone] = useState("")
    const [taxNumber, setTaxNumber] = useState("")
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitAction, setSubmitAction] = useState<"save" | "saveAndAdd">("save")

    const formRef = useRef<HTMLFormElement>(null)
    const firstInputRef = useRef<HTMLInputElement>(null)

    // Generate smart default customer code when open changes
    useEffect(() => {
        if (open) {
            setCustomerCode("MSTM-" + Math.floor(1000 + Math.random() * 9000).toString())
            setErrors({})
        }
    }, [open])

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

        const result = await createCustomer(formData)
        if (result.success) {
            toast.success("Müşteri başarıyla kaydedildi!")
            if (submitAction === "save") {
                setOpen(false)
                setCustomerType("bireysel")
                setPhone("")
                setTaxNumber("")
                setErrors({})
            } else {
                // Reset form state but keep dialog open
                formRef.current?.reset()
                setCustomerType("bireysel")
                setPhone("")
                setTaxNumber("")
                setErrors({})
                setCustomerCode("MSTM-" + Math.floor(1000 + Math.random() * 9000).toString())
                setTimeout(() => {
                    firstInputRef.current?.focus()
                }, 100)
            }
        } else {
            toast.error(result.message || "Müşteri kaydedilirken bir hata oluştu.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Yeni Müşteri Ekle
                </Button>
            </DialogTrigger>

            <DialogContent 
                className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white" 
                onInteractOutside={(e) => e.preventDefault()}
                onOpenAutoFocus={(e) => {
                    e.preventDefault()
                    firstInputRef.current?.focus()
                }}
            >
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl font-bold tracking-tight">Yeni Müşteri Kaydı</DialogTitle>
                    <DialogDescription>
                        Sisteme yeni bir bireysel, kurumsal veya personel müşteri tanımlayın.
                    </DialogDescription>
                </DialogHeader>

                <form ref={formRef} action={handleSubmit} className="space-y-6">
                    {/* Bölüm 1: Genel Bilgiler */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">1. Genel Bilgiler</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Müşteri Tipi</Label>
                                <Select name="type" value={customerType} onValueChange={setCustomerType}>
                                    <SelectTrigger className="border-zinc-200">
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
                                <Label htmlFor="customerCode">Müşteri Kodu</Label>
                                <Input 
                                    ref={firstInputRef}
                                    id="customerCode" 
                                    name="customerCode" 
                                    value={customerCode}
                                    onChange={(e) => setCustomerCode(e.target.value)}
                                    placeholder="Örn: MSTM-0001" 
                                    required 
                                    className="border-zinc-200"
                                />
                            </div>
                        </div>
                    </div>

                    {customerType === "kurumsal" && (
                        <div className="pt-4 border-t border-zinc-100">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Kurumsal Detaylar</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                                    <Input id="taxOffice" name="taxOffice" placeholder="Örn: Boğaziçi VD" required={customerType === "kurumsal"} className="border-zinc-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="taxNumber">Vergi No / TCKN</Label>
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

                    <div className="pt-4 border-t border-zinc-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Kişisel Bilgiler</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Adı / Firma Adı</Label>
                                <Input id="firstName" name="firstName" placeholder={customerType === "kurumsal" ? "Örn: Örnek Ltd. Şti." : "Ahmet"} required className="border-zinc-200" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Soyadı</Label>
                                <Input 
                                    id="lastName" 
                                    name="lastName" 
                                    placeholder={customerType === "kurumsal" ? "Boş bırakılabilir" : "Yılmaz"} 
                                    required={customerType !== "kurumsal"} 
                                    className="border-zinc-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bölüm 2: İletişim Bilgileri */}
                    <div className="pt-4 border-t border-zinc-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">2. İletişim Bilgileri</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon Numarası</Label>
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
                    </div>

                    {/* Bölüm 3: Finansal Tercihler */}
                    <div className="pt-4 border-t border-zinc-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">3. Finansal Tercihler</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                    <Label htmlFor="discountRate">Tanımlı İskonto Oranı (%)</Label>
                                    <div className="group relative inline-block">
                                        <HelpCircle className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 cursor-pointer inline" />
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
                                    defaultValue="0" 
                                    placeholder="Örn: 10" 
                                    className="border-zinc-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bölüm 4: Adres ve Notlar */}
                    <div className="pt-4 border-t border-zinc-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">4. Adres & Notlar</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">İl</Label>
                                <Input id="city" name="city" placeholder="Düzce" className="border-zinc-200" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="district">İlçe</Label>
                                <Input id="district" name="district" placeholder="Merkez" className="border-zinc-200" />
                            </div>
                        </div>

                        <div className="space-y-2 mt-4">
                            <Label htmlFor="address">Açık Adres</Label>
                            <Textarea id="address" name="address" placeholder="Müşterinin fatura/ikamet adresi..." className="resize-none h-16 border-zinc-200" />
                        </div>

                        <div className="space-y-2 mt-4">
                            <Label htmlFor="notes">Özel Notlar</Label>
                            <Textarea id="notes" name="notes" placeholder="Müşteri hakkında hatırlatıcı notlar..." className="resize-none h-16 border-zinc-200" />
                        </div>
                    </div>

                    <DialogFooter className="pt-6 mt-6 border-t border-zinc-100 flex flex-col sm:flex-row gap-2">
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
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}