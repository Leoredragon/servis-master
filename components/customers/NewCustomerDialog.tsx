"use client"

import { useState } from "react"
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
import { Plus } from "lucide-react"
import { createCustomer } from "./actions"
import { toast } from "sonner"

export default function NewCustomerDialog() {
    const [open, setOpen] = useState(false)
    const [customerType, setCustomerType] = useState("bireysel")

    async function handleSubmit(formData: FormData) {
        const result = await createCustomer(formData)
        if (result.success) {
            toast.success("Müşteri başarıyla kaydedildi!")
            setOpen(false) // İşlem başarılıysa modalı kapat
            setCustomerType("bireysel") // Reset type state
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

            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl">Yeni Müşteri Kaydı</DialogTitle>
                    <DialogDescription>
                        Sisteme yeni bir bireysel, kurumsal veya personel müşteri tanımlayın.
                    </DialogDescription>
                </DialogHeader>

                {/* Server action bağlantısı kuruldu */}
                <form action={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Müşteri Tipi</Label>
                            <Select name="type" value={customerType} onValueChange={setCustomerType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bireysel">Bireysel Müşteri</SelectItem>
                                    <SelectItem value="kurumsal">Kurumsal Müşteri</SelectItem>
                                    <SelectItem value="personel">Personel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customerCode">Müşteri Kodu</Label>
                            <Input id="customerCode" name="customerCode" placeholder="Örn: MSTM-0001" required />
                        </div>
                    </div>

                    {customerType === "kurumsal" && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                            <div className="space-y-2">
                                <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                                <Input id="taxOffice" name="taxOffice" placeholder="Örn: Boğaziçi VD" required={customerType === "kurumsal"} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxNumber">Vergi No / TCKN</Label>
                                <Input id="taxNumber" name="taxNumber" placeholder="10 haneli VKN veya 11 haneli TCKN" required={customerType === "kurumsal"} />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Adı / Firma Adı</Label>
                            <Input id="firstName" name="firstName" placeholder={customerType === "kurumsal" ? "Örn: Örnek Ltd. Şti." : "Ahmet"} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Soyadı</Label>
                            <Input 
                                id="lastName" 
                                name="lastName" 
                                placeholder={customerType === "kurumsal" ? "Boş bırakılabilir" : "Yılmaz"} 
                                required={customerType !== "kurumsal"} 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon Numarası</Label>
                            <Input id="phone" name="phone" type="tel" placeholder="0555 555 55 55" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta Adresi</Label>
                            <Input id="email" name="email" type="email" placeholder="ahmet@yolcu.com" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="discountRate">Tanımlı İskonto Oranı (%)</Label>
                            <Input 
                                id="discountRate" 
                                name="discountRate" 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.01" 
                                defaultValue="0" 
                                placeholder="Örn: 10" 
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-zinc-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">İl</Label>
                                <Input id="city" name="city" placeholder="Düzce" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="district">İlçe</Label>
                                <Input id="district" name="district" placeholder="Merkez" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Açık Adres</Label>
                            <Textarea id="address" name="address" placeholder="Müşterinin fatura/ikamet adresi..." className="resize-none h-16" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Özel Notlar</Label>
                            <Textarea id="notes" name="notes" placeholder="Müşteri hakkında hatırlatıcı notlar..." className="resize-none h-16" />
                        </div>
                    </div>

                    <DialogFooter className="pt-6 mt-6 border-t border-zinc-100">
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            Müşteriyi Kaydet
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}