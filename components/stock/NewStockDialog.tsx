"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { createStock } from "./actions"
import { toast } from "sonner"

export default function NewStockDialog() {
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        const result = await createStock(formData)
        if (result.success) {
            toast.success(result.message)
            setOpen(false)
        } else {
            toast.error(result.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Yeni Stok Ekle
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl bg-white" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Yeni Stok Kartı Oluştur</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="stockCode" className="text-xs font-semibold text-zinc-600">Stok Kodu (SKU) *</Label>
                            <Input id="stockCode" name="stockCode" placeholder="örn. YD-NGK-CR9" required className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="barcode" className="text-xs font-semibold text-zinc-600">Barkod</Label>
                            <Input id="barcode" name="barcode" placeholder="Barkod numarası" className="mt-1" />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="name" className="text-xs font-semibold text-zinc-600">Ürün / Malzeme Adı *</Label>
                        <Input id="name" name="name" placeholder="örn. NGK CR9E Buji" required className="mt-1" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="category" className="text-xs font-semibold text-zinc-600">Kategori</Label>
                            <Input id="category" name="category" placeholder="örn. Yedek Parça" className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="brand" className="text-xs font-semibold text-zinc-600">Marka</Label>
                            <Input id="brand" name="brand" placeholder="örn. NGK" className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="unit" className="text-xs font-semibold text-zinc-600">Birim (Adt, Lt, vb.)</Label>
                            <Input id="unit" name="unit" placeholder="örn. Adet" defaultValue="Adet" className="mt-1" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="purchasePrice" className="text-xs font-semibold text-zinc-600">Alış Fiyatı (₺)</Label>
                            <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" placeholder="0.00" className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="salePrice" className="text-xs font-semibold text-zinc-600">Satış Fiyatı (₺)</Label>
                            <Input id="salePrice" name="salePrice" type="number" step="0.01" placeholder="0.00" className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="vatRate" className="text-xs font-semibold text-zinc-600">KDV Oranı (%)</Label>
                            <Input id="vatRate" name="vatRate" type="number" placeholder="20" defaultValue="20" className="mt-1" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="currentStock" className="text-xs font-semibold text-zinc-600">Mevcut Stok</Label>
                            <Input id="currentStock" name="currentStock" type="number" defaultValue="0" className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="minStock" className="text-xs font-semibold text-zinc-600">Kritik Stok Seviyesi</Label>
                            <Input id="minStock" name="minStock" type="number" defaultValue="5" className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="location" className="text-xs font-semibold text-zinc-600">Raf / Depo Yeri</Label>
                            <Input id="location" name="location" placeholder="örn. A-12" className="mt-1" />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="notes" className="text-xs font-semibold text-zinc-600">Açıklama / Notlar</Label>
                        <Textarea id="notes" name="notes" placeholder="Stok kartına dair ek notlar..." className="mt-1" />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                            Kaydet
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}