"use client"

import { useState, useEffect, useRef } from "react"
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
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Pencil, HelpCircle } from "lucide-react"
import { updateCustomer, getCustomerGroups } from "./actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CustomerGroup {
    id: string
    name: string
    discount_rate: number
}

interface CustomerWithGroup {
    id: string
    customer_code: string
    first_name: string
    last_name: string | null
    phone: string
    email: string | null
    type: string
    discount_rate: number
    city?: string | null
    district?: string | null
    address?: string | null
    notes?: string | null
    tax_office?: string | null
    tax_number?: string | null
    group_id?: string | null
    customer_groups: {
        id?: string
        name: string
    } | null
}

interface EditCustomerDialogProps {
    customer: CustomerWithGroup
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export default function EditCustomerDialog({ customer, open, onOpenChange, onSuccess }: EditCustomerDialogProps) {
    const [submitting, setSubmitting] = useState(false)
    const [groups, setGroups] = useState<CustomerGroup[]>([])
    const firstInputRef = useRef<HTMLInputElement>(null)

    // Form state — pre-filled from customer prop
    const [customerType, setCustomerType] = useState(customer.type || "bireysel")
    const [customerCode, setCustomerCode] = useState(customer.customer_code || "")
    const [firstName, setFirstName] = useState(customer.first_name || "")
    const [lastName, setLastName] = useState(customer.last_name || "")
    const [phone, setPhone] = useState(customer.phone || "")
    const [email, setEmail] = useState(customer.email || "")
    const [city, setCity] = useState(customer.city || "")
    const [district, setDistrict] = useState(customer.district || "")
    const [address, setAddress] = useState(customer.address || "")
    const [notes, setNotes] = useState(customer.notes || "")
    const [taxOffice, setTaxOffice] = useState(customer.tax_office || "")
    const [taxNumber, setTaxNumber] = useState(customer.tax_number || "")
    const [discountRate, setDiscountRate] = useState(customer.discount_rate?.toString() || "0")
    const [selectedGroupId, setSelectedGroupId] = useState<string>("none")

    // Error state
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Sync state when customer prop or open changes
    useEffect(() => {
        if (open) {
            setCustomerType(customer.type || "bireysel")
            setCustomerCode(customer.customer_code || "")
            setFirstName(customer.first_name || "")
            setLastName(customer.last_name || "")
            setPhone(customer.phone || "")
            setEmail(customer.email || "")
            setCity(customer.city || "")
            setDistrict(customer.district || "")
            setAddress(customer.address || "")
            setNotes(customer.notes || "")
            setTaxOffice(customer.tax_office || "")
            setTaxNumber(customer.tax_number || "")
            setDiscountRate(customer.discount_rate?.toString() || "0")
            setErrors({})

            // Load groups and set current group
            getCustomerGroups().then((data) => {
                const groupList = data as unknown as CustomerGroup[]
                setGroups(groupList)

                // Determine current group_id from customer_groups relation
                const currentGroup = customer.group_id ||
                    groupList.find(g => g.name === customer.customer_groups?.name)?.id || "none"
                setSelectedGroupId(currentGroup || "none")
            })
        }
    }, [open, customer])

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
        if (cleanVal.length < 10) return "Telefon numarası en az 10 haneli olmalıdır."
        return ""
    }

    const validateTaxNumber = (val: string) => {
        if (!val) return "Vergi No / TCKN zorunludur."
        if (!/^\d+$/.test(val)) return "Sadece rakam girilmelidir."
        if (val.length !== 10 && val.length !== 11) return "Vergi No 10 haneli, TCKN 11 haneli olmalıdır."
        return ""
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        // Validation
        const phoneErr = validatePhone(phone)
        const taxNumberErr = customerType === "kurumsal" ? validateTaxNumber(taxNumber) : ""

        if (phoneErr || taxNumberErr) {
            setErrors({ phone: phoneErr, taxNumber: taxNumberErr })
            toast.error("Lütfen formdaki hataları kontrol edin.")
            return
        }

        const formData = new FormData()
        formData.set("type", customerType)
        formData.set("customerCode", customerCode)
        formData.set("firstName", firstName)
        formData.set("lastName", lastName)
        formData.set("phone", phone)
        formData.set("email", email)
        formData.set("city", city)
        formData.set("district", district)
        formData.set("address", address)
        formData.set("notes", notes)
        formData.set("taxOffice", taxOffice)
        formData.set("taxNumber", taxNumber)
        formData.set("discountRate", discountRate)
        formData.set("groupId", selectedGroupId)

        setSubmitting(true)
        try {
            const res = await updateCustomer(customer.id, formData)
            if (res.success) {
                toast.success("Müşteri başarıyla güncellendi!")
                onOpenChange(false)
                if (onSuccess) onSuccess()
            } else {
                toast.error(res.message || "Müşteri güncellenirken hata oluştu.")
            }
        } catch (error: any) {
            toast.error("İşlem sırasında bir hata oluştu: " + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                    <div className="flex items-center gap-2 text-zinc-500 mb-0.5">
                        <Pencil className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Müşteri Düzenle</span>
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">
                        {customer.first_name} {customer.last_name || ""}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Müşterinin operasyonel ve finansal detaylarını güncelleyin.
                    </DialogDescription>
                </DialogHeader>

                {/* Body: Kaydırılabilir */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">

                        {/* Bölüm 1: Genel Bilgiler */}
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
                                    <Label htmlFor="edit-customerCode">Müşteri Kodu</Label>
                                    <Input
                                        ref={firstInputRef}
                                        id="edit-customerCode"
                                        value={customerCode}
                                        onChange={(e) => setCustomerCode(e.target.value)}
                                        placeholder="Örn: MSTM-0001 (İsteğe bağlı)"
                                        className="border-zinc-200 bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-firstName">Adı / Firma Adı <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="edit-firstName"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder={customerType === "kurumsal" ? "Örn: Örnek Ltd. Şti." : "Ahmet"}
                                        required
                                        className="border-zinc-200 bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-lastName">
                                        Soyadı {customerType !== "kurumsal" && <span className="text-red-500">*</span>}
                                    </Label>
                                    <Input
                                        id="edit-lastName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder={customerType === "kurumsal" ? "Boş bırakılabilir" : "Yılmaz"}
                                        required={customerType !== "kurumsal"}
                                        className="border-zinc-200 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Kurumsal Bilgiler — sadece kurumsal seçildiğinde */}
                        {customerType === "kurumsal" && (
                            <div className="space-y-4 pt-2">
                                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kurumsal Bilgiler</h4>
                                <div className="h-px bg-zinc-100 w-full" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-taxOffice">Vergi Dairesi <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="edit-taxOffice"
                                            value={taxOffice}
                                            onChange={(e) => setTaxOffice(e.target.value)}
                                            placeholder="Örn: Boğaziçi VD"
                                            required={customerType === "kurumsal"}
                                            className="border-zinc-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-taxNumber">Vergi No / TCKN <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="edit-taxNumber"
                                            value={taxNumber}
                                            onChange={(e) => {
                                                setTaxNumber(e.target.value)
                                                setErrors(prev => ({ ...prev, taxNumber: validateTaxNumber(e.target.value) }))
                                            }}
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
                                    <Label htmlFor="edit-phone">Telefon Numarası <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="edit-phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => {
                                            setPhone(e.target.value)
                                            setErrors(prev => ({ ...prev, phone: validatePhone(e.target.value) }))
                                        }}
                                        placeholder="0555 555 55 55"
                                        required
                                        className={cn("border-zinc-200", errors.phone ? "border-red-500 focus-visible:ring-red-500" : "")}
                                    />
                                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-email">E-posta Adresi</Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ahmet@yolcu.com"
                                        className="border-zinc-200"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-city">İl</Label>
                                    <Input
                                        id="edit-city"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Düzce"
                                        className="border-zinc-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-district">İlçe</Label>
                                    <Input
                                        id="edit-district"
                                        value={district}
                                        onChange={(e) => setDistrict(e.target.value)}
                                        placeholder="Merkez"
                                        className="border-zinc-200"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-address">Açık Adres</Label>
                                <Textarea
                                    id="edit-address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Müşterinin fatura/ikamet adresi..."
                                    className="resize-none h-16 border-zinc-200 w-full"
                                />
                            </div>
                        </div>

                        {/* Bölüm 3: Finansal Tercihler & Notlar */}
                        <div className="space-y-4 pt-2">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">3. Finansal Tercihler & Notlar</h4>
                            <div className="h-px bg-zinc-100 w-full" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5">
                                        <Label htmlFor="edit-discountRate">Tanımlı İskonto Oranı (%)</Label>
                                        <div className="group relative inline-block">
                                            <HelpCircle className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 cursor-pointer" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 hidden group-hover:block bg-zinc-900 text-white text-[11px] font-normal rounded p-2 shadow-lg leading-normal z-50">
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                                                Bu müşteriye faturalarda uygulanacak varsayılan indirim oranıdır.
                                            </div>
                                        </div>
                                    </div>
                                    <Input
                                        id="edit-discountRate"
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
                                <Label htmlFor="edit-notes">Özel Notlar</Label>
                                <Textarea
                                    id="edit-notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Müşteri hakkında hatırlatıcı notlar..."
                                    className="resize-none h-16 border-zinc-200 w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer: Sabit (Sticky) */}
                    <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row justify-end gap-2 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto border-zinc-200"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {submitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
