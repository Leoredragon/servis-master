"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, ChevronsUpDown, Check, UserPlus, X, Car } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createServiceRecord } from "./actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function NewServiceDialog({ triggerVisible = true }: { triggerVisible?: boolean }) {
    const [open, setOpen] = useState(false)
    const [customers, setCustomers] = useState<any[]>([])
    const [vehicles, setVehicles] = useState<any[]>([])
    
    // Seçim durumları
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
    const [comboboxOpen, setComboboxOpen] = useState(false)
    const [submitAction, setSubmitAction] = useState<"save" | "saveAndAdd">("save")

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

    // Hızlı araç ekleme form durumları
    const [showQuickVehicleAdd, setShowQuickVehicleAdd] = useState(false)
    const [quickVehiclePlate, setQuickVehiclePlate] = useState("")
    const [quickVehicleBrand, setQuickVehicleBrand] = useState("")
    const [quickVehicleModel, setQuickVehicleModel] = useState("")

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
                .eq("is_deleted", false)
                .order("plate", { ascending: true })
            if (vehs) setVehicles(vehs)
        }
        loadData()
    }, [open])

    useEffect(() => {
        const handleOpen = () => setOpen(true)
        window.addEventListener("open-new-service", handleOpen)
        return () => window.removeEventListener("open-new-service", handleOpen)
    }, [])

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

    async function handleQuickVehicleAdd() {
        if (!quickVehiclePlate || !quickVehicleBrand || !quickVehicleModel) {
            toast.error("Lütfen plaka, marka ve model alanlarını doldurun.")
            return
        }

        const supabase = createClient()

        const { data, error } = await supabase
            .from("vehicles")
            .insert([{
                customer_id: selectedCustomerId,
                plate: quickVehiclePlate.toUpperCase(),
                brand: quickVehicleBrand,
                model: quickVehicleModel,
                mileage: 0,
                year: null
            }])
            .select()
            .single()

        if (error) {
            toast.error("Hızlı araç kaydı sırasında hata oluştu: " + error.message)
            return
        }

        // Listeye ekle ve seç
        setVehicles(prev => [data, ...prev])
        setSelectedVehicleId(data.id)
        
        // Formu temizle ve kapat
        setQuickVehiclePlate("")
        setQuickVehicleBrand("")
        setQuickVehicleModel("")
        setShowQuickVehicleAdd(false)
        toast.success("Araç başarıyla oluşturuldu ve seçildi!")
    }

    async function handleSubmit(formData: FormData) {
        if (!selectedCustomerId || selectedCustomerId.trim() === "") {
            toast.error("Lütfen bir müşteri seçin.")
            return
        }
        if (!selectedVehicleId || selectedVehicleId.trim() === "") {
            toast.error("Lütfen bir araç seçin.")
            return
        }

        formData.append("customerId", selectedCustomerId)
        formData.append("vehicleId", selectedVehicleId)

        try {
            const res = await createServiceRecord(formData)
            if (res.success) {
                toast.success("Servis iş emri kaydı başarıyla oluşturuldu!")
                
                if (submitAction === "save") {
                    setOpen(false)
                    // Seçimleri sıfırla
                    setSelectedCustomerId("")
                    setSelectedVehicleId("")
                } else {
                    formRef.current?.reset()
                    // Seçimleri sıfırla
                    setSelectedCustomerId("")
                    setSelectedVehicleId("")
                    setTimeout(() => {
                        customerComboboxTriggerRef.current?.focus()
                    }, 100)
                }
            } else {
                toast.error(res.error || "Servis kaydı oluşturulurken bir hata oluştu.")
            }
        } catch (err: any) {
            toast.error("Servis kaydı oluşturulurken hata oluştu: " + err.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {triggerVisible && (
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                        <Plus className="w-4 h-4" /> Yeni Servis Kaydı
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent 
                className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 bg-white overflow-hidden" 
                onInteractOutside={(e) => e.preventDefault()}
                onOpenAutoFocus={(e) => {
                    e.preventDefault()
                    customerComboboxTriggerRef.current?.focus()
                }}
            >
                {/* Header: Sabit */}
                <DialogHeader className="px-6 py-4 border-b border-zinc-100">
                    <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">Yeni Servis Kaydı</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Araç için yeni bir iş emri oluşturun. Müşteri ve araç seçimini tamamlayın.
                    </DialogDescription>
                </DialogHeader>

                {/* Hızlı Müşteri Ekleme Paneli */}
                {showQuickAdd ? (
                    <div className="mx-6 my-4 bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-4">
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
                                <Label className="text-xs">Adı <span className="text-red-500">*</span></Label>
                                <Input value={quickFirstName} onChange={e => setQuickFirstName(e.target.value)} placeholder="örn. Ahmet" className="h-9 border-zinc-200 w-full" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Soyadı <span className="text-red-500">*</span></Label>
                                <Input value={quickLastName} onChange={e => setQuickLastName(e.target.value)} placeholder="örn. Yılmaz" className="h-9 border-zinc-200 w-full" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Telefon <span className="text-red-500">*</span></Label>
                                <Input value={quickPhone} onChange={e => setQuickPhone(e.target.value)} placeholder="örn. 0555..." className="h-9 border-zinc-200 w-full" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">E-posta</Label>
                                <Input value={quickEmail} onChange={e => setQuickEmail(e.target.value)} placeholder="örn. ahmet@mail.com" type="email" className="h-9 border-zinc-200 w-full" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setShowQuickAdd(false)} className="h-9 text-xs">İptal</Button>
                            <Button type="button" onClick={handleQuickAdd} className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white">Kaydet ve Seç</Button>
                        </div>
                    </div>
                ) : null}

                <form ref={formRef} action={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    {/* Body: Kaydırılabilir (Scrollable) Alan */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">
                        
                        {/* Bölüm 1: Müşteri ve Araç Seçimi */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Müşteri & Araç Seçimi</h4>
                            <div className="h-px bg-zinc-100 w-full" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Müşteri Arama (Combobox) */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between w-full">
                                        <Label className="m-0">Müşteri Seçimi <span className="text-red-500">*</span></Label>
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
                                                className="w-full flex items-center justify-between font-normal text-left h-10 border-zinc-200 bg-white px-3"
                                            >
                                                <span className="truncate pr-2">
                                                    {selectedCustomerId
                                                        ? `${selectedCustomer?.first_name} ${selectedCustomer?.last_name || ""} (${selectedCustomer?.phone})`
                                                        : "Müşteri arayın veya seçin..."}
                                                </span>
                                                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
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
                                                                value={`${customer.first_name} ${customer.last_name || ""} ${customer.phone}`}
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
                                                                {customer.first_name} {customer.last_name || ""} ({customer.phone})
                                                             </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Araç Seçimi */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between w-full">
                                        <Label className="m-0">Araç Seçimi <span className="text-red-500">*</span></Label>
                                        {selectedCustomerId && !showQuickVehicleAdd && (
                                            <button
                                                type="button"
                                                onClick={() => setShowQuickVehicleAdd(true)}
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> Yeni Araç Ekle
                                            </button>
                                        )}
                                    </div>
                                    
                                    {showQuickVehicleAdd ? (
                                        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-3">
                                            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                                                <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                                                    <Car className="w-3.5 h-3.5 text-blue-600" /> Hızlı Araç Ekle
                                                </h4>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowQuickVehicleAdd(false)}
                                                    className="text-zinc-400 hover:text-zinc-600"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[11px] text-zinc-500">Plaka <span className="text-red-500">*</span></Label>
                                                    <Input value={quickVehiclePlate} onChange={e => setQuickVehiclePlate(e.target.value)} placeholder="34 ABC 123" className="h-8 text-xs border-zinc-200 bg-white" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-zinc-500">Marka <span className="text-red-500">*</span></Label>
                                                        <Input value={quickVehicleBrand} onChange={e => setQuickVehicleBrand(e.target.value)} placeholder="Yamaha" className="h-8 text-xs border-zinc-200 bg-white" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-zinc-500">Model <span className="text-red-500">*</span></Label>
                                                        <Input value={quickVehicleModel} onChange={e => setQuickVehicleModel(e.target.value)} placeholder="MT-07" className="h-8 text-xs border-zinc-200 bg-white" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-1">
                                                <Button type="button" variant="ghost" onClick={() => setShowQuickVehicleAdd(false)} className="h-7 text-[11px] px-2">İptal</Button>
                                                <Button type="button" onClick={handleQuickVehicleAdd} className="h-7 text-[11px] px-3 bg-blue-600 hover:bg-blue-700 text-white">Kaydet ve Seç</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Select 
                                                value={selectedVehicleId} 
                                                onValueChange={setSelectedVehicleId}
                                                disabled={!selectedCustomerId || filteredVehicles.length === 0}
                                            >
                                                <SelectTrigger className="w-full border-zinc-200 bg-white truncate">
                                                    <SelectValue placeholder={
                                                        selectedCustomerId 
                                                            ? filteredVehicles.length > 0 
                                                                ? "Müşterinin aracını seçin..." 
                                                                : "Kayıtlı araç bulunamadı" 
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
                                                <div className="mt-2 flex items-start gap-3 p-3 bg-amber-50/50 border border-amber-200/60 rounded-lg">
                                                    <div className="flex-1 space-y-1.5">
                                                        <p className="text-xs font-semibold text-amber-800">
                                                            Kayıtlı araç bulunamadı.
                                                        </p>
                                                        <p className="text-[11px] text-amber-700/80 leading-relaxed">
                                                            İş emri oluşturmak için önce bir araç eklemelisiniz.
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setShowQuickVehicleAdd(true)}
                                                        className="shrink-0 h-8 text-[11px] font-semibold border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        Araç Ekle
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
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
                            className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium"
                            onClick={() => setSubmitAction("saveAndAdd")}
                            disabled={!selectedCustomerId || !selectedVehicleId}
                        >
                            Kaydet ve Yeni Ekle
                        </Button>
                        <Button 
                            type="submit" 
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            onClick={() => setSubmitAction("save")}
                            disabled={!selectedCustomerId || !selectedVehicleId}
                        >
                            Kaydı Oluştur
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}