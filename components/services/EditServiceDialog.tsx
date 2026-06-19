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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ChevronsUpDown, Check, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { updateServiceRecord } from "./actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface EditServiceDialogProps {
    service: {
        id: string
        customer_id: string
        vehicle_id: string
        entry_mileage: number | null
        fuel_level: string | null
        damage_assessment: string | null
        service_code: string
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function EditServiceDialog({ service, open, onOpenChange }: EditServiceDialogProps) {
    const [customers, setCustomers] = useState<any[]>([])
    const [vehicles, setVehicles] = useState<any[]>([])
    const [isSaving, setIsSaving] = useState(false)

    // Form states
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
    const [entryMileage, setEntryMileage] = useState("")
    const [fuelLevel, setFuelLevel] = useState("yarim")
    const [damageAssessment, setDamageAssessment] = useState("")
    const [comboboxOpen, setComboboxOpen] = useState(false)

    const customerComboboxTriggerRef = useRef<HTMLButtonElement>(null)

    // Load customers and vehicles
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

    // Pre-fill states when dialog opens or service changes
    useEffect(() => {
        if (open && service) {
            setSelectedCustomerId(service.customer_id || "")
            setSelectedVehicleId(service.vehicle_id || "")
            setEntryMileage(service.entry_mileage !== null && service.entry_mileage !== undefined ? String(service.entry_mileage) : "")
            setFuelLevel(service.fuel_level || "yarim")
            setDamageAssessment(service.damage_assessment || "")
        }
    }, [open, service])

    // Filter vehicles of the selected customer
    const filteredVehicles = selectedCustomerId
        ? vehicles.filter(v => v.customer_id === selectedCustomerId)
        : []

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedCustomerId) {
            toast.error("Lütfen bir müşteri seçin.")
            return
        }
        if (!selectedVehicleId) {
            toast.error("Lütfen bir araç seçin.")
            return
        }

        setIsSaving(true)
        try {
            const res = await updateServiceRecord(service.id, {
                customerId: selectedCustomerId,
                vehicleId: selectedVehicleId,
                entryMileage: entryMileage.trim() !== "" ? entryMileage : null,
                fuelLevel: fuelLevel,
                damageAssessment: damageAssessment.trim() !== "" ? damageAssessment : null
            })

            if (res.success) {
                toast.success("Servis kaydı başarıyla güncellendi.")
                onOpenChange(false)
            } else {
                toast.error(res.error || "Servis kaydı güncellenirken bir hata oluştu.")
            }
        } catch (err: any) {
            toast.error("Servis kaydı güncellenirken hata oluştu: " + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 bg-white overflow-hidden" 
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="px-6 py-4 border-b border-zinc-100">
                    <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">
                        Servis Kaydını Düzenle ({service.service_code})
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Servis kabul detaylarını ve ilişkili araç/müşteri bilgilerini güncelleyin.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    {/* Body: Scrollable area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">
                        
                        {/* Section 1: Customer & Vehicle */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Müşteri & Araç Bilgisi</h4>
                            <div className="h-px bg-zinc-100 w-full" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer Selection */}
                                <div className="space-y-2">
                                    <Label>Müşteri Seçimi <span className="text-red-500">*</span></Label>
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
                                                        ? selectedCustomer 
                                                            ? `${selectedCustomer.first_name} ${selectedCustomer.last_name || ""} (${selectedCustomer.phone})`
                                                            : "Seçili Müşteri Yükleniyor..."
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

                                {/* Vehicle Selection */}
                                <div className="space-y-2">
                                    <Label>Araç Seçimi <span className="text-red-500">*</span></Label>
                                    <Select 
                                        value={selectedVehicleId} 
                                        onValueChange={setSelectedVehicleId}
                                        disabled={!selectedCustomerId}
                                    >
                                        <SelectTrigger className="w-full border-zinc-200 bg-white truncate">
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
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Reception Details */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kabul Bilgileri</h4>
                            <div className="h-px bg-zinc-100 w-full" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Entry Mileage */}
                                <div className="space-y-2">
                                    <Label>Giriş Kilometresi (KM)</Label>
                                    <Input
                                        type="number"
                                        value={entryMileage}
                                        onChange={(e) => setEntryMileage(e.target.value)}
                                        placeholder="Araç kilometresini girin..."
                                        className="h-10 border-zinc-200 bg-white"
                                    />
                                </div>

                                {/* Fuel Level */}
                                <div className="space-y-2">
                                    <Label>Yakıt Durumu</Label>
                                    <Select value={fuelLevel} onValueChange={setFuelLevel}>
                                        <SelectTrigger className="h-10 border-zinc-200 bg-white">
                                            <SelectValue placeholder="Yakıt durumu seçin" />
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

                            {/* Damage Assessment / Notes */}
                            <div className="space-y-2">
                                <Label>Hasar / Kaporta Notları</Label>
                                <Textarea
                                    value={damageAssessment}
                                    onChange={(e) => setDamageAssessment(e.target.value)}
                                    placeholder="Kaporta çizik veya hasar detayları..."
                                    className="border-zinc-200 bg-white min-h-[80px] leading-relaxed resize-none"
                                />
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-2 mt-auto">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            İptal
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSaving || !selectedCustomerId || !selectedVehicleId}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium min-w-[100px]"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Güncelleniyor...
                                </>
                            ) : (
                                "Kaydet"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
