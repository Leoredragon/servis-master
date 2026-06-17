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
import { Pencil } from "lucide-react"
import { updateVehicle } from "./actions"
import { toast } from "sonner"

interface Vehicle {
    id: string
    plate: string
    brand: string
    model: string
    year: number | null
    mileage: number
    chassis_number?: string | null
    engine_number?: string | null
    notes: string | null
    customers: {
        first_name: string
        last_name: string | null
    } | null
}

interface EditVehicleDialogProps {
    vehicle: Vehicle
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export default function EditVehicleDialog({ vehicle, open, onOpenChange, onSuccess }: EditVehicleDialogProps) {
    const [submitting, setSubmitting] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)
    const firstInputRef = useRef<HTMLInputElement>(null)

    // Pre-fill values from vehicle prop
    const [plate, setPlate] = useState(vehicle.plate)
    const [brand, setBrand] = useState(vehicle.brand)
    const [model, setModel] = useState(vehicle.model)
    const [year, setYear] = useState(vehicle.year?.toString() || "")
    const [vin, setVin] = useState(vehicle.chassis_number || "")
    const [engineNo, setEngineNo] = useState(vehicle.engine_number || "")
    const [currentKm, setCurrentKm] = useState(vehicle.mileage?.toString() || "")
    const [notes, setNotes] = useState(vehicle.notes || "")

    // Sync state when vehicle prop changes (when a different vehicle is selected)
    useEffect(() => {
        if (open) {
            setPlate(vehicle.plate)
            setBrand(vehicle.brand)
            setModel(vehicle.model)
            setYear(vehicle.year?.toString() || "")
            setVin(vehicle.chassis_number || "")
            setEngineNo(vehicle.engine_number || "")
            setCurrentKm(vehicle.mileage?.toString() || "")
            setNotes(vehicle.notes || "")
        }
    }, [open, vehicle])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!plate.trim() || !brand.trim() || !model.trim()) {
            toast.error("Plaka, marka ve model alanları zorunludur.")
            return
        }

        const formData = new FormData()
        formData.set("plate", plate)
        formData.set("brand", brand)
        formData.set("model", model)
        formData.set("year", year)
        formData.set("vin", vin)
        formData.set("engineNo", engineNo)
        formData.set("currentKm", currentKm)
        formData.set("notes", notes)

        setSubmitting(true)
        try {
            const res = await updateVehicle(vehicle.id, formData)
            if (res.success) {
                toast.success("Araç başarıyla güncellendi!")
                onOpenChange(false)
                if (onSuccess) onSuccess()
            } else {
                toast.error(res.message || "Araç güncellenirken hata oluştu.")
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
                className="sm:max-w-[680px] max-h-[90vh] flex flex-col p-0 bg-white overflow-hidden"
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
                        <span className="text-xs font-semibold uppercase tracking-wider">Araç Düzenle</span>
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">
                        {vehicle.plate} — {vehicle.brand} {vehicle.model}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Aracın mevcut bilgilerini düzenleyin. Plaka, marka ve model zorunludur.
                    </DialogDescription>
                </DialogHeader>

                {/* Body: Kaydırılabilir */}
                <form ref={formRef} onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">

                        {/* Bölüm 1: Temel Araç Bilgileri */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">1. Temel Bilgiler</h4>
                            <div className="h-px bg-zinc-100 w-full" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-plate">Plaka <span className="text-red-500">*</span></Label>
                                    <Input
                                        ref={firstInputRef}
                                        id="edit-plate"
                                        value={plate}
                                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                                        placeholder="Örn: 34 ABC 123"
                                        className="border-zinc-200 bg-white font-mono tracking-widest"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-brand">Marka <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="edit-brand"
                                        value={brand}
                                        onChange={(e) => setBrand(e.target.value)}
                                        placeholder="Örn: Yamaha"
                                        className="border-zinc-200 bg-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-model">Model <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="edit-model"
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        placeholder="Örn: MT-07"
                                        className="border-zinc-200 bg-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-year">Model Yılı</Label>
                                    <Input
                                        id="edit-year"
                                        type="number"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        placeholder="Örn: 2022"
                                        min="1900"
                                        max="2099"
                                        className="border-zinc-200 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bölüm 2: Teknik Detaylar */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">2. Teknik Detaylar</h4>
                            <div className="h-px bg-zinc-100 w-full" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-vin">Şasi No (VIN)</Label>
                                    <Input
                                        id="edit-vin"
                                        value={vin}
                                        onChange={(e) => setVin(e.target.value.toUpperCase())}
                                        placeholder="17 haneli şasi numarası"
                                        className="border-zinc-200 bg-white font-mono tracking-wider text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-engineNo">Motor No</Label>
                                    <Input
                                        id="edit-engineNo"
                                        value={engineNo}
                                        onChange={(e) => setEngineNo(e.target.value.toUpperCase())}
                                        placeholder="Motor seri numarası"
                                        className="border-zinc-200 bg-white font-mono tracking-wider text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-currentKm">Mevcut Kilometre (KM)</Label>
                                    <Input
                                        id="edit-currentKm"
                                        type="number"
                                        value={currentKm}
                                        onChange={(e) => setCurrentKm(e.target.value)}
                                        placeholder="Örn: 12500"
                                        min="0"
                                        className="border-zinc-200 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bölüm 3: Notlar */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">3. Notlar</h4>
                            <div className="h-px bg-zinc-100 w-full" />
                            <div className="space-y-2">
                                <Label htmlFor="edit-notes">Özel Notlar</Label>
                                <Textarea
                                    id="edit-notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ruhsat sahibi, garanti durumu, hasar geçmişi vb. notlar..."
                                    className="resize-none h-20 border-zinc-200 w-full"
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
