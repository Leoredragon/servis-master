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
import { Plus, ChevronsUpDown, Check, UserPlus, X, UploadCloud } from "lucide-react"
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
    const [entryMileage, setEntryMileage] = useState("")

    // Dropzone states
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [dragActive, setDragActive] = useState(false)

    // Refs
    const customerComboboxTriggerRef = useRef<HTMLButtonElement>(null)
    const formRef = useRef<HTMLFormElement>(null)

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

    // Smart Default: selectedVehicleId değiştiğinde aracın son KM'sini otomatik getir
    useEffect(() => {
        if (selectedVehicleId) {
            const vehicle = vehicles.find(v => v.id === selectedVehicleId)
            if (vehicle) {
                setEntryMileage(vehicle.mileage ? vehicle.mileage.toString() : "")
            }
        } else {
            setEntryMileage("")
        }
    }, [selectedVehicleId, vehicles])

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const files = Array.from(e.dataTransfer.files)
            setSelectedFiles(prev => [...prev, ...files])
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const files = Array.from(e.target.files)
            setSelectedFiles(prev => [...prev, ...files])
        }
    }

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

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
        formData.set("entryMileage", entryMileage)

        try {
            const res = await createServiceRecord(formData)
            if (res.success) {
                toast.success("Servis iş emri kaydı başarıyla oluşturuldu!")
                setOpen(false)
                
                // Seçimleri sıfırla
                setSelectedCustomerId("")
                setSelectedVehicleId("")
                setEntryMileage("")
                setSelectedFiles([])
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

            <DialogContent 
                className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white" 
                onInteractOutside={(e) => e.preventDefault()}
                onOpenAutoFocus={(e) => {
                    e.preventDefault()
                    customerComboboxTriggerRef.current?.focus()
                }}
            >
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl font-bold tracking-tight">Yeni Servis Kaydı</DialogTitle>
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
                                <Input value={quickFirstName} onChange={e => setQuickFirstName(e.target.value)} placeholder="örn. Ahmet" className="h-9 border-zinc-200" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Soyadı *</Label>
                                <Input value={quickLastName} onChange={e => setQuickLastName(e.target.value)} placeholder="örn. Yılmaz" className="h-9 border-zinc-200" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Telefon *</Label>
                                <Input value={quickPhone} onChange={e => setQuickPhone(e.target.value)} placeholder="örn. 0555..." className="h-9 border-zinc-200" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">E-posta</Label>
                                <Input value={quickEmail} onChange={e => setQuickEmail(e.target.value)} placeholder="örn. ahmet@mail.com" type="email" className="h-9 border-zinc-200" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setShowQuickAdd(false)} className="h-9 text-xs">İptal</Button>
                            <Button type="button" onClick={handleQuickAdd} className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white">Kaydet ve Seç</Button>
                        </div>
                    </div>
                ) : null}

                <form ref={formRef} action={handleSubmit} className="space-y-6">
                    {/* Bölüm 1: Müşteri ve Araç Seçimi */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">1. Müşteri & Araç Seçimi</h3>
                        <div className="space-y-4">
                            {/* Müşteri Arama (Combobox) */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Müşteri Seçimi *</Label>
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
                                            ref={customerComboboxTriggerRef}
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={comboboxOpen}
                                            className="w-full justify-between font-normal text-left h-10 border-zinc-200 bg-white"
                                        >
                                            {selectedCustomerId
                                                ? `${selectedCustomer?.first_name} ${selectedCustomer?.last_name} (${selectedCustomer?.phone})`
                                                : "Müşteri arayın veya seçin..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border border-zinc-200 shadow-md rounded-md overflow-hidden z-50">
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
                                <Label>Araç Seçimi *</Label>
                                <Select 
                                    value={selectedVehicleId} 
                                    onValueChange={setSelectedVehicleId}
                                    disabled={!selectedCustomerId}
                                >
                                    <SelectTrigger className="border-zinc-200 bg-white">
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
                    </div>

                    {/* Bölüm 2: Kabul Detayları */}
                    <div className="pt-4 border-t border-zinc-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">2. Kabul Detayları</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Servis Tipi</Label>
                                <Select name="serviceType" defaultValue="bakim">
                                    <SelectTrigger className="border-zinc-200 bg-white">
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
                                    <SelectTrigger className="border-zinc-200 bg-white">
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

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="entryMileage">Giriş Kilometresi (KM)</Label>
                                <Input
                                    id="entryMileage"
                                    name="entryMileage"
                                    type="number"
                                    value={entryMileage}
                                    onChange={e => setEntryMileage(e.target.value)}
                                    placeholder="Örn: 42500"
                                    className="border-zinc-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Yakıt Durumu</Label>
                                <Select name="fuelLevel" defaultValue="yarim">
                                    <SelectTrigger className="border-zinc-200 bg-white">
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
                    </div>

                    {/* Bölüm 3: Şikayet & Hasar Notları ve Görseller */}
                    <div className="pt-4 border-t border-zinc-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">3. Hasar / Talep Notları & Görseller</h3>
                        <div className="space-y-4">
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

                            {/* Sürükle Bırak Fotoğraf Yükleme Alanı */}
                            <div className="space-y-2 pt-2">
                                <Label className="text-xs font-semibold text-zinc-600">Araç Kabul Hasar Fotoğrafları</Label>
                                <div 
                                    onDragEnter={handleDrag}
                                    onDragOver={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDrop={handleDrop}
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                                        dragActive ? "border-blue-500 bg-blue-50/50" : "border-zinc-200 hover:border-zinc-300 bg-zinc-50/50"
                                    )}
                                    onClick={() => document.getElementById("service-files-input")?.click()}
                                >
                                    <input 
                                        id="service-files-input"
                                        type="file" 
                                        multiple 
                                        accept="image/*"
                                        className="hidden" 
                                        onChange={handleFileChange}
                                    />
                                    <UploadCloud className="w-8 h-8 text-zinc-400" />
                                    <p className="text-sm font-medium text-zinc-700">Fotoğraf sürükleyin veya göz atın</p>
                                    <p className="text-xs text-zinc-500">PNG, JPG veya JPEG (Maksimum 5MB)</p>
                                </div>

                                {selectedFiles.length > 0 && (
                                    <div className="space-y-1.5 mt-2">
                                        {selectedFiles.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs p-2 bg-zinc-50 border border-zinc-200 rounded-md">
                                                <span className="font-medium text-zinc-700 truncate max-w-[240px]">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                                                <button 
                                                    type="button" 
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        removeFile(i)
                                                    }}
                                                    className="text-red-500 hover:text-red-700 font-semibold"
                                                >
                                                    Kaldır
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
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
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium"
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