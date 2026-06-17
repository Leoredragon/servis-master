"use client"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, User, Car, Plus, ChevronsUpDown, Check, Phone } from "lucide-react"
import { createAppointment } from "@/components/appointments/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CalendarViewProps {
    initialAppointments: any[]
    customers: any[]
    vehicles: any[]
}

export default function CalendarView({
    initialAppointments,
    customers,
    vehicles,
}: CalendarViewProps) {
    const [open, setOpen] = useState(false)
    const [selectedCustomerId, setSelectedCustomerId] = useState("")
    const [selectedVehicleId, setSelectedVehicleId] = useState("")
    const [title, setTitle] = useState("")
    const [appointmentDate, setAppointmentDate] = useState("")

    const [comboboxOpen, setComboboxOpen] = useState(false)

    // Filter vehicles for selected customer
    const filteredVehicles = selectedCustomerId
        ? vehicles.filter(v => v.customer_id === selectedCustomerId)
        : []

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

    async function handleSubmit(formData: FormData) {
        if (!selectedCustomerId) {
            toast.error("Lütfen bir müşteri seçin.")
            return
        }
        if (!selectedVehicleId) {
            toast.error("Lütfen bir araç seçin.")
            return
        }
        if (!title) {
            toast.error("Lütfen randevu başlığı girin.")
            return
        }
        if (!appointmentDate) {
            toast.error("Lütfen randevu tarihi seçin.")
            return
        }

        formData.append("customerId", selectedCustomerId)
        formData.append("vehicleId", selectedVehicleId)
        formData.append("title", title)
        formData.append("appointmentDate", new Date(appointmentDate).toISOString())

        try {
            const res = await createAppointment(formData)
            if (res.success) {
                toast.success("Randevu başarıyla planlandı!")
                setOpen(false)
                
                // Reset states
                setSelectedCustomerId("")
                setSelectedVehicleId("")
                setTitle("")
                setAppointmentDate("")
            }
        } catch (err: any) {
            toast.error("Randevu oluşturulurken hata: " + err.message)
        }
    }

    // Sort and filter appointments (upcoming first)
    const sortedAppointments = [...initialAppointments].sort(
        (a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                        <CalendarDays className="w-6 h-6 text-blue-600" /> Randevu Ajandası
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Yaklaşan servis randevularını planlayın, takvim yoğunluğunu yönetin.
                    </p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium">
                            <Plus className="w-4 h-4" /> Yeni Randevu Planla
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle>Yeni Randevu Oluştur</DialogTitle>
                            <DialogDescription>Müşteri ve araç seçerek takvimde yeni bir randevu planlayın.</DialogDescription>
                        </DialogHeader>

                        <form action={handleSubmit} className="space-y-4">
                            {/* Müşteri Seçimi */}
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
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border border-zinc-200 shadow-md rounded-md overflow-hidden animate-in fade-in-50">
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
                                <Label>Araç</Label>
                                <Select 
                                    value={selectedVehicleId} 
                                    onValueChange={setSelectedVehicleId}
                                    disabled={!selectedCustomerId}
                                >
                                    <SelectTrigger className="border-zinc-200">
                                        <SelectValue placeholder={
                                            selectedCustomerId 
                                                ? filteredVehicles.length > 0 
                                                    ? "Aracı seçin..." 
                                                    : "Kayıtlı araç yok"
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

                            {/* Randevu Başlığı */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Randevu Nedeni / Başlık</Label>
                                <Input 
                                    id="title" 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    placeholder="Örn: 30 Bin KM Periyodik Bakım" 
                                    required 
                                />
                            </div>

                            {/* Tarih & Saat */}
                            <div className="space-y-2">
                                <Label htmlFor="date">Randevu Tarih ve Saati</Label>
                                <Input 
                                    id="date" 
                                    type="datetime-local" 
                                    value={appointmentDate} 
                                    onChange={e => setAppointmentDate(e.target.value)} 
                                    required 
                                />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                                    Randevuyu Kaydet
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Agenda List View */}
            <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-zinc-50/50 border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900 text-sm">Planlanmış Randevular Listesi</h3>
                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 font-medium">{sortedAppointments.length} Aktif Randevu</Badge>
                </div>

                <div className="divide-y divide-zinc-100">
                    {sortedAppointments.length > 0 ? (
                        sortedAppointments.map((appt) => {
                            const dateObj = new Date(appt.appointment_date)
                            const formattedDate = dateObj.toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })
                            const formattedTime = dateObj.toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })

                            return (
                                <div key={appt.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-zinc-50/30 transition-colors">
                                    <div className="flex items-start gap-4">
                                        {/* Date Block */}
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center w-16 shrink-0 flex flex-col justify-center">
                                            <span className="text-xs font-bold text-blue-600 uppercase">
                                                {dateObj.toLocaleDateString('tr-TR', { weekday: 'short' })}
                                            </span>
                                            <span className="text-xl font-extrabold text-blue-900 mt-0.5">
                                                {dateObj.getDate()}
                                            </span>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-1.5">
                                            <h4 className="font-bold text-zinc-900 text-base">{appt.title}</h4>
                                            
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                                    {formattedDate} - {formattedTime}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5 text-zinc-400" />
                                                    {appt.customers?.first_name} {appt.customers?.last_name || ""}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                                                    {appt.customers?.phone}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Car className="w-3.5 h-3.5 text-zinc-400" />
                                                    {appt.vehicles?.brand} {appt.vehicles?.model} ({appt.vehicles?.plate})
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status and Action */}
                                    <div className="flex items-center gap-2 self-end md:self-auto">
                                        <Badge className="bg-blue-50 text-blue-700 border-blue-150 font-medium hover:bg-blue-50 capitalize">
                                            {appt.status || "planlandı"}
                                        </Badge>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-16 text-zinc-400">
                            Takviminizde planlanmış herhangi bir randevu bulunmuyor.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
