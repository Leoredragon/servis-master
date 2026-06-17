"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Plus, HelpCircle } from "lucide-react"
import { createStock } from "./actions"
import { toast } from "sonner"

export default function NewStockDialog() {
    const [open, setOpen] = useState(false)
    const [submitAction, setSubmitAction] = useState<"save" | "saveAndAdd">("save")

    const formRef = useRef<HTMLFormElement>(null)
    const firstInputRef = useRef<HTMLInputElement>(null)

    async function handleSubmit(formData: FormData) {
        const result = await createStock(formData)
        if (result.success) {
            toast.success(result.message)
            if (submitAction === "save") {
                setOpen(false)
            } else {
                formRef.current?.reset()
                setTimeout(() => {
                    firstInputRef.current?.focus()
                }, 100)
            }
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
                    <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">Yeni Stok Kartı Oluştur</DialogTitle>
                </DialogHeader>
                
                <form ref={formRef} action={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    {/* Body: Kaydırılabilir (Scrollable) Alan */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                        
                        {/* Bölüm 1: Temel Bilgiler */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">1. Temel Bilgiler</h4>
                            <div className="h-px bg-zinc-100 w-full" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="stockCode" className="text-xs font-semibold text-zinc-600">Stok Kodu (SKU) <span className="text-red-500">*</span></Label>
                                    <Input 
                                        ref={firstInputRef}
                                        id="stockCode" 
                                        name="stockCode" 
                                        placeholder="örn. YD-NGK-CR9" 
                                        required 
                                        className="mt-1 border-zinc-200" 
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="barcode" className="text-xs font-semibold text-zinc-600">Barkod</Label>
                                    <Input id="barcode" name="barcode" placeholder="Barkod numarası" className="mt-1 border-zinc-200" />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="name" className="text-xs font-semibold text-zinc-600">Ürün / Malzeme Adı <span className="text-red-500">*</span></Label>
                                <Input id="name" name="name" placeholder="örn. NGK CR9E Buji" required className="mt-1 border-zinc-200" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="category" className="text-xs font-semibold text-zinc-600">Kategori</Label>
                                    <Input id="category" name="category" placeholder="örn. Yedek Parça" className="mt-1 border-zinc-200" />
                                </div>
                                <div>
                                    <Label htmlFor="brand" className="text-xs font-semibold text-zinc-600">Marka</Label>
                                    <Input id="brand" name="brand" placeholder="örn. NGK" className="mt-1 border-zinc-200" />
                                </div>
                                <div>
                                    <Label htmlFor="unit" className="text-xs font-semibold text-zinc-600">Birim</Label>
                                    <Input id="unit" name="unit" placeholder="örn. Adet" defaultValue="Adet" className="mt-1 border-zinc-200" />
                                </div>
                            </div>
                        </div>

                        {/* Bölüm 2: Fiyatlandırma & KDV */}
                        <div className="space-y-4 pt-2">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">2. Fiyatlandırma & KDV</h4>
                            <div className="h-px bg-zinc-100 w-full" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="purchasePrice" className="text-xs font-semibold text-zinc-600">Alış Fiyatı (₺)</Label>
                                    <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" placeholder="0.00" className="mt-1 border-zinc-200" />
                                </div>
                                <div>
                                    <Label htmlFor="salePrice" className="text-xs font-semibold text-zinc-600">Satış Fiyatı (₺)</Label>
                                    <Input id="salePrice" name="salePrice" type="number" step="0.01" placeholder="0.00" className="mt-1 border-zinc-200" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <Label htmlFor="vatRate" className="text-xs font-semibold text-zinc-600">KDV Oranı (%)</Label>
                                        <div className="group relative inline-block">
                                            <HelpCircle className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 cursor-pointer" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-zinc-900 text-white text-[10px] font-normal rounded p-2 shadow-lg leading-normal z-50">
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                                                Fatura kesilirken bu stok kartı için varsayılan olarak uygulanacak KDV oranıdır.
                                            </div>
                                        </div>
                                    </div>
                                    <Input id="vatRate" name="vatRate" type="number" placeholder="20" defaultValue="20" className="mt-1 border-zinc-200" />
                                </div>
                            </div>
                        </div>

                        {/* Bölüm 3: Stok Detayları & Raf */}
                        <div className="space-y-4 pt-2">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">3. Stok Detayları & Raf</h4>
                            <div className="h-px bg-zinc-100 w-full" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="currentStock" className="text-xs font-semibold text-zinc-600">Mevcut Stok</Label>
                                    <Input id="currentStock" name="currentStock" type="number" defaultValue="0" className="mt-1 border-zinc-200" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <Label htmlFor="minStock" className="text-xs font-semibold text-zinc-600">Kritik Seviye</Label>
                                        <div className="group relative inline-block">
                                            <HelpCircle className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 cursor-pointer" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-zinc-900 text-white text-[10px] font-normal rounded p-2 shadow-lg leading-normal z-50">
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                                                Stok miktarı bu seviyenin altına düştüğünde sistem uyarı verecektir.
                                            </div>
                                        </div>
                                    </div>
                                    <Input id="minStock" name="minStock" type="number" defaultValue="5" className="mt-1 border-zinc-200" />
                                </div>
                                <div>
                                    <Label htmlFor="location" className="text-xs font-semibold text-zinc-600">Raf / Depo Yeri</Label>
                                    <Input id="location" name="location" placeholder="örn. A-12" className="mt-1 border-zinc-200" />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="notes" className="text-xs font-semibold text-zinc-600">Açıklama / Notlar</Label>
                                <Textarea id="notes" name="notes" placeholder="Stok kartına dair ek notlar..." className="mt-1 resize-none h-16 border-zinc-200 w-full" />
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
                            className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                            onClick={() => setSubmitAction("saveAndAdd")}
                        >
                            Kaydet ve Yeni Ekle
                        </Button>
                        <Button 
                            type="submit" 
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => setSubmitAction("save")}
                        >
                            Kaydet
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}