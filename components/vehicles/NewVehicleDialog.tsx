"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
    DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { createVehicle } from "./actions"

export default function NewVehicleDialog() {
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        try {
            await createVehicle(formData)
            setOpen(false)
        } catch (error) {
            alert("Araç kaydedilirken bir hata oluştu.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Yeni Araç Ekle
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl bg-white" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Yeni Araç Kaydı</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <Input name="customerId" type="hidden" value="buraya-gelecek-id" /> {/* İleride müşteri seçimi gelecek */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input name="plate" placeholder="Plaka" required />
                        <Input name="brand" placeholder="Marka" required />
                    </div>
                    <Input name="model" placeholder="Model" required />
                    <Input name="year" type="number" placeholder="Yıl" />
                    <Input name="vin" placeholder="Şasi No" />
                    <Input name="engineNo" placeholder="Motor No" />
                    <Input name="currentKm" type="number" placeholder="Kilometre" />
                    <Textarea name="notes" placeholder="Notlar" />
                    <DialogFooter>
                        <Button type="submit">Kaydet</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}