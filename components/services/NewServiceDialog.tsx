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
import { Plus, ChevronsUpDown, Check, UserPlus, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createServiceRecord } from "./actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function NewServiceDialog() {
    const [open, setOpen] = useState(false)
    const [customers, setCustomers] = useState<any[]>([])
    const [vehicles, setVehicles] = useState<any[]>([])
    
    // Seçim durumları
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
    const [comboboxOpen, setComboboxOpen] = useState(false)

    // Hızlı müşteri ekleme form durumları
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [quickFirstName, setQuickFirstName] = useState("")
    const [quickLastName, setQuickLastName] = useState("")
    const [quickPhone, setQuickPhone] = useState("")
    const [quickEmail, setQuickEmail] = useState("")
    const [quickType, setQuickType] = useState("bireysel")

    // Verileri yükle
    useEffect(() => {
        if (!open) return
        
        const supabase = createClient()
        async function loadData() {
            const { data: custs } = await supabase
                .from("customers")
                .select("*")
                .order("first_name", { ascending: true })
            if (custs) setCustomers(custs)

            const { data: vehs } = await supabase
                .from("vehicles")
                .select("*")
                .order("plate", { ascending: true })
            if (vehs) setVehicles(vehs)
        }
        loadData()
    }, [open])

    // Seçilen müşterinin araçlarını filtrele
    const filteredVehicles = selectedCustomerId
        ? vehicles.filter(v => v.customer_id === selectedCustomerId)
        : []

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

    async function handleQuickAdd() {
        if (!quickFirstName || !quickLastName || !quickPhone) {
            toast.error("Lütfen ad, soyad ve telefon alanlarını doldurun.")
            return
        }

        const supabase = createClient()
        const customer_code = `MSTM-${Date.now().toString().slice(-4)}`

        const { data, error } = await supabase
            .from("customers")
            .insert([{
                first_name: quickFirstName,
                last_name: quickLastName,
                phone: quickPhone,
                email: quickEmail || null,
                type: quickType,
                customer_code
            }])
            .select()
            .single()

        if (error) {
            toast.error("Hızlı kayıt sırasında hata oluştu: " + error.message)
            return
        }

        // Listeye ekle ve seç
        setCustomers(prev => [data, ...prev])
        setSelectedCustomerId(data.id)
        setSelectedVehicleId("")
        
        // Formu temizle ve kapat
        setQuickFirstName("")
        setQuickLastName("")
        setQuickPhone("")
        setQuickEmail("")
        setShowQuickAdd(false)
        toast.success("Müşteri başarıyla oluşturuldu ve seçildi!")
    }

    async function handleSubmit(formData: FormData) {
        if (!selectedCustomerId) {
            toast.error("Lütfen bir müşteri seçin.")
            return
        }
        if (!selectedVehicleId) {
            toast.error("Lütfen bir araç seçin.")
            return
        }

        formData.append("customerId", selectedCustomerId)
        formData.append("vehicleId", selectedVehicleId)

        try {
            const res = await createServiceRecord(formData)
            if (res.success) {
                toast.success("Servis iş emri kaydı başarıyla oluşturuldu!")
                setOpen(false)
                
                // Seçimleri sıfırla
                setSelectedCustomerId("")
                setSelectedVehicleId("")
            }
        } catch (err: any) {
            toast.error("Servis kaydı oluşturulurken hata oluştu: " + err.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Yeni Servis Kaydı
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl">Yeni Servis Kaydı</DialogTitle>
                    <DialogDescription>
                        Araç için yeni bir iş emri oluşturun. Gerekli alanları doldurup kaydedin.
                    </DialogDescription>
                </DialogHeader>

                {/* Hızlı Müşteri Ekleme Paneli */}
                {showQuickAdd ? (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                <UserPlus className="w-4 h-4 text-blue-600" /> Hızlı Müşteri Ekle
                            </h4>
                            <button 
                                type="button" 
                                onClick={() => setShowQuickAdd(false)}
                                className="text-zinc-400 hover:text-zinc-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Adı *</Label>
                                <Input value={quickFirstName} onChange={e => setQuickFirstName(e.target.value)} placeholder="örn. Ahmet" className="h-9" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Soyadı *</Label>
                                <Input value={quickLastName} onChange={e => setQuickLastName(e.target.value)} placeholder="örn. Yılmaz" className="h-9" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Telefon *</Label>
                                <Input value={quickPhone} onChange={e => setQuickPhone(e.target.value)} placeholder="örn. 0555..." className="h-9" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">E-posta</Label>
                                <Input value={quickEmail} onChange={e => setQuickEmail(e.target.value)} placeholder="örn. ahmet@mail.com" type="email" className="h-9" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setShowQuickAdd(false)} className="h-9 text-xs">İptal</Button>
                            <Button type="button" onClick={handleQuickAdd} className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white">Kaydet ve Seç</Button>
                        </div>
                    </div>
                ) : null}

                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {/* Müşteri Arama (Combobox) */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Müşteri Seçimi</Label>
                                {!showQuickAdd && (
                                    <button
                                        type="button"
                                        onClick={() => setShowQuickAdd(true)}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Hızlı Müşteri Ekle
                                    </button>
                                )}
                            </div>
                            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={comboboxOpen}
                                        className="w-full justify-between font-normal text-left h-10 border-zinc-200"
                                    >
                                        {selectedCustomerId
                                            ? `${selectedCustomer?.first_name} ${selectedCustomer?.last_name} (${selectedCustomer?.phone})`
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
                                                        value={`${customer.first_name} ${customer.last_name} ${customer.phone}`}
                                                        onSelect={() => {
                                                            setSelectedCustomerId(customer.id)
                                                            setComboboxOpen(false)
                                                            setSelectedVehicleId("")
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {customer.first_name} {customer.last_name} ({customer.phone})
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Araç Seçimi (Müşteriye Göre Filtrelenir) */}
                        <div className="space-y-2">
                            <Label>Araç Seçimi</Label>
                            <Select 
                                value={selectedVehicleId} 
                                onValueChange={setSelectedVehicleId}
                                disabled={!selectedCustomerId}
                            >
                                <SelectTrigger className="border-zinc-200">
                                    <SelectValue placeholder={
                                        selectedCustomerId 
                                            ? filteredVehicles.length > 0 
                                                ? "Müşterinin aracını seçin..." 
                                                : "Müşteriye ait kayıtlı araç yok!" 
                                            : "Önce müşteri seçmelisiniz"
                                    } />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {filteredVehicles.map(v => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.brand} {v.model} ({v.plate})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedCustomerId && filteredVehicles.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">
                                    Bu müşteriye ait araç bulunmuyor. Öncelikle "Araçlar" sayfasından bu müşteri adına araç kaydetmelisiniz.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-zinc-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Servis Tipi</Label>
                                <Select name="serviceType" defaultValue="bakim">
                                    <SelectTrigger className="border-zinc-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="bakim">Periyodik Bakım</SelectItem>
                                        <SelectItem value="tamir">Tamir / Onarım</SelectItem>
                                        <SelectItem value="muayene">Muayene Hazırlık</SelectItem>
                                        <SelectItem value="modifikasyon">Modifikasyon</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Öncelik</Label>
                                <Select name="priority" defaultValue="normal">
                                    <SelectTrigger className="border-zinc-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="dusuk">Düşük</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="yuksek">Yüksek</SelectItem>
                                        <SelectItem value="acil">Acil!</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="entryMileage">Giriş Kilometresi (KM)</Label>
                                <Input
                                    id="entryMileage"
                                    name="entryMileage"
                                    type="number"
                                    placeholder="Örn: 42500"
                                    className="border-zinc-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Yakıt Durumu</Label>
                                <Select name="fuelLevel" defaultValue="yarim">
                                    <SelectTrigger className="border-zinc-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="bos">Işık Yanıyor / Boş</SelectItem>
                                        <SelectItem value="ceyrek">Çeyrek Depo</SelectItem>
                                        <SelectItem value="yarim">Yarım Depo</SelectItem>
                                        <SelectItem value="ucceyrek">3/4 Depo</SelectItem>
                                        <SelectItem value="dolu">Dolu Depo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="complaint">Müşteri Şikayeti / Talep</Label>
                            <Textarea
                                id="complaint"
                                name="complaint"
                                placeholder="Müşterinin belirttiği sorunları veya istekleri buraya yazın..."
                                className="resize-none h-20 border-zinc-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="damageAssessment">Hasar Tespit / Kaporta Çizik Notları</Label>
                            <Textarea
                                id="damageAssessment"
                                name="damageAssessment"
                                placeholder="Dış kasa hasarları, çizikler veya kabul sırasındaki görsel kusurları belirtin..."
                                className="resize-none h-20 border-zinc-200"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-6 mt-6 border-t border-zinc-100">
                        <Button 
                            type="submit" 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            disabled={!selectedCustomerId || !selectedVehicleId}
                        >
                            Kaydı Oluştur
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}