"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
    DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Plus, Check, ChevronsUpDown, UploadCloud } from "lucide-react"
import { createVehicle } from "./actions"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function NewVehicleDialog() {
    const [open, setOpen] = useState(false)
    const [customers, setCustomers] = useState<any[]>([])
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
    const [comboboxOpen, setComboboxOpen] = useState(false)
    const [submitAction, setSubmitAction] = useState<"save" | "saveAndAdd">("save")
    
    // Dropzone states
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [dragActive, setDragActive] = useState(false)

    const formRef = useRef<HTMLFormElement>(null)
    const customerSelectTriggerRef = useRef<HTMLButtonElement>(null)

    // Load customers on open
    useEffect(() => {
        if (!open) return
        const supabase = createClient()
        async function loadCustomers() {
            const { data } = await supabase
                .from("customers")
                .select("id, first_name, last_name, phone")
                .order("first_name", { ascending: true })
            if (data) setCustomers(data)
        }
        loadCustomers()
    }, [open])

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

    async function handleSubmit(formData: FormData) {
        if (!selectedCustomerId) {
            toast.error("Lütfen bir müşteri seçin.")
            return
        }

        formData.append("customerId", selectedCustomerId)

        try {
            await createVehicle(formData)
            toast.success("Araç başarıyla kaydedildi!")
            
            if (submitAction === "save") {
                setOpen(false)
                setSelectedCustomerId("")
                setSelectedFiles([])
            } else {
                formRef.current?.reset()
                setSelectedCustomerId("")
                setSelectedFiles([])
                setTimeout(() => {
                    customerSelectTriggerRef.current?.focus()
                }, 100)
            }
        } catch (error: any) {
            toast.error("Araç kaydedilerken bir hata oluştu: " + error.message)
        }
    }

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Yeni Araç Ekle
                </Button>
            </DialogTrigger>

            <DialogContent 
                className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 bg-white overflow-hidden" 
                onInteractOutside={(e) => e.preventDefault()}
                onOpenAutoFocus={(e) => {
                    e.preventDefault()
                    customerSelectTriggerRef.current?.focus()
                }}
            >
                {/* Header: Sabit */}
                <DialogHeader className="px-6 py-4 border-b border-zinc-100">
                    <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">Yeni Araç Kaydı</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Sisteme kayıtlı bir müşteriniz için yeni bir araç tanımı yapın.
                    </DialogDescription>
                </DialogHeader>

                <form ref={formRef} action={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    {/* Body: Kaydırılabilir (Scrollable) Alan */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                        
                        {/* Bölüm 1: Müşteri & Araç Bilgileri */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">1. Müşteri & Araç Bilgileri</h4>
                            <div className="h-px bg-zinc-100 w-full" />
                            
                            <div className="space-y-2">
                                <Label>Müşteri Seçimi <span className="text-red-500">*</span></Label>
                                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            ref={customerSelectTriggerRef}
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={comboboxOpen}
                                            className="w-full justify-between font-normal text-left h-10 border-zinc-200 bg-white"
                                        >
                                            {selectedCustomerId
                                                ? `${selectedCustomer?.first_name} ${selectedCustomer?.last_name || ""} (${selectedCustomer?.phone})`
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
                                                            value={`${customer.first_name} ${customer.last_name || ""} ${customer.phone}`}
                                                            onSelect={() => {
                                                                setSelectedCustomerId(customer.id)
                                                                setComboboxOpen(false)
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="plate">Plaka <span className="text-red-500">*</span></Label>
                                    <Input id="plate" name="plate" placeholder="Örn: 34 ABC 123" required className="border-zinc-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="brand">Marka <span className="text-red-500">*</span></Label>
                                    <Input id="brand" name="brand" placeholder="Örn: Yamaha" required className="border-zinc-200" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="model">Model <span className="text-red-500">*</span></Label>
                                    <Input id="model" name="model" placeholder="Örn: MT-07" required className="border-zinc-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="year">Model Yılı</Label>
                                    <Input id="year" name="year" type="number" placeholder="Örn: 2022" className="border-zinc-200" />
                                </div>
                            </div>
                        </div>

                        {/* Bölüm 2: Detaylı Bilgiler */}
                        <div className="space-y-4 pt-2">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">2. Detaylı Bilgiler</h4>
                            <div className="h-px bg-zinc-100 w-full" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="vin">Şasi No (VIN)</Label>
                                    <Input id="vin" name="vin" placeholder="17 haneli şasi numarası" className="border-zinc-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="engineNo">Motor No</Label>
                                    <Input id="engineNo" name="engineNo" placeholder="Motor seri numarası" className="border-zinc-200" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentKm">Mevcut Kilometre (KM)</Label>
                                    <Input id="currentKm" name="currentKm" type="number" placeholder="Örn: 12500" className="border-zinc-200" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="notes">Araç Hakkında Özel Notlar</Label>
                                <Textarea id="notes" name="notes" placeholder="Ruhsat sahibi, garanti durumu vb. hakkında notlar..." className="resize-none h-16 border-zinc-200 w-full" />
                            </div>
                        </div>

                        {/* Bölüm 3: Belgeler & Görseller */}
                        <div className="space-y-4 pt-2">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">3. Belgeler & Görseller</h4>
                            <div className="h-px bg-zinc-100 w-full" />
                            
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-600">Araç Görseli veya Ruhsat Fotoğrafı</Label>
                                <div 
                                    onDragEnter={handleDrag}
                                    onDragOver={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDrop={handleDrop}
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                                        dragActive ? "border-blue-500 bg-blue-50/50" : "border-zinc-200 hover:border-zinc-300 bg-zinc-50/50"
                                    )}
                                    onClick={() => document.getElementById("vehicle-files-input")?.click()}
                                >
                                    <input 
                                        id="vehicle-files-input"
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