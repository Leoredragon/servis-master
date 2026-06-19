"use client"

import { useState, useEffect, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
    Wrench, User, Car, FileText, Upload, Play, CheckCircle2, Trash2, 
    AlertCircle, Loader2, Plus, Sparkles, Clock, ShieldCheck, 
    FileAudio, FileVideo, Image as ImageIcon, Eye, X, BookOpen
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { addServiceItemAction, updateServiceItemAction, deleteServiceItemAction, updateServiceStatus } from "./actions"

interface StockCard {
    id: string
    stock_code: string
    name: string
    sale_price: number | null
    current_stock: number
    reserved_stock: number
}

interface ServiceItem {
    id: string
    stock_id: string | null
    item_type: 'parça' | 'işçilik'
    description: string
    quantity: number
    unit_price: number
    total_price: number
    stock_cards?: StockCard | null
}

interface ServiceRecord {
    id: string
    service_code: string
    customer_id: string
    vehicle_id: string
    service_type: string
    priority: string
    status: string
    customer_complaint: string | null
    solution: string | null
    description: string | null
    entry_mileage: number | null
    fuel_level: string | null
    damage_assessment: string | null
    created_at: string
    customers: {
        first_name: string
        last_name: string | null
        phone: string | null
        email: string | null
        type: string
        balance: number
    } | null
    vehicles: {
        plate: string
        brand: string
        model: string
        year: number | null
        mileage: number
    } | null
    service_items: ServiceItem[]
}

interface ServiceCockpitClientProps {
    serviceInitial: ServiceRecord
    stockCards: StockCard[]
}

export default function ServiceCockpitClient({
    serviceInitial,
    stockCards
}: ServiceCockpitClientProps) {
    const supabase = createClient()
    const [service, setService] = useState<ServiceRecord>(serviceInitial)
    const [isPending, startTransition] = useTransition()

    // Form inputs and statuses
    const [status, setStatus] = useState(serviceInitial.status)
    const [complaint, setComplaint] = useState(serviceInitial.customer_complaint || "")
    const [solution, setSolution] = useState(serviceInitial.solution || "")
    const [notes, setNotes] = useState(serviceInitial.description || "")

    // Kabul detayları states
    const [serviceType, setServiceType] = useState(serviceInitial.service_type || "bakim")
    const [priority, setPriority] = useState(serviceInitial.priority || "normal")
    const [entryMileage, setEntryMileage] = useState(serviceInitial.entry_mileage ? String(serviceInitial.entry_mileage) : "")
    const [fuelLevel, setFuelLevel] = useState(serviceInitial.fuel_level || "yarim")
    const [damageAssessment, setDamageAssessment] = useState(serviceInitial.damage_assessment || "")
    
    const [isSavingTexts, setIsSavingTexts] = useState(false)
    const [partSearch, setPartSearch] = useState("")

    // Excel edit row state
    const [newLineType, setNewLineType] = useState<'parça' | 'işçilik'>('parça')
    const [selectedStockId, setSelectedStockId] = useState("")
    const [newLineDesc, setNewLineDesc] = useState("")
    const [newLineQty, setNewLineQty] = useState(1)
    const [newLinePrice, setNewLinePrice] = useState(0)

    // Storage files state
    const [mediaFiles, setMediaFiles] = useState<any[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [activeLightbox, setActiveLightbox] = useState<{ url: string; type: string } | null>(null)

    // Status styling maps
    const statusLabels: Record<string, string> = {
        "araç kabul": "Araç Kabul",
        "ariza tespiti": "Arıza Tespiti",
        "parca bekleniyor": "Parça Bekleniyor",
        "onarimda": "Onarımda",
        "kalite_kontrol": "Kalite Kontrol",
        "teslimata_hazir": "Teslimata Hazır",
        "tamamlandı": "Tamamlandı",
        "iptal": "İptal"
    }

    const fuelLabels: Record<string, string> = {
        "bos": "Işık Yanıyor / Boş",
        "ceyrek": "Çeyrek Depo",
        "yarim": "Yarım Depo",
        "ucceyrek": "3/4 Depo",
        "dolu": "Dolu Depo"
    }

    // Calculations
    const totalAmount = service.service_items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0
    const hasNotesChanges = complaint !== (service.customer_complaint || "") || solution !== (service.solution || "")

    // Fetch and list media files from storage folder `${service.id}/`
    async function loadMediaFiles() {
        try {
            const { data, error } = await supabase.storage
                .from('service_media')
                .list(service.id)
            if (error) {
                console.error("Storage list error:", error.message)
                return
            }
            if (data) {
                setMediaFiles(data)
            }
        } catch (err) {
            console.error("Storage error:", err)
        }
    }

    useEffect(() => {
        loadMediaFiles()
    }, [])

    // Upload to Supabase Storage
    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return
        setIsUploading(true)
        const file = e.target.files[0]
        const filePath = `${service.id}/${file.name}`

        try {
            const { error } = await supabase.storage
                .from('service_media')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (error) {
                toast.error("Dosya yüklenemedi: " + error.message)
            } else {
                toast.success("Dosya başarıyla yüklendi.")
                loadMediaFiles()
            }
        } catch (err: any) {
            toast.error("Hata oluştu: " + err.message)
        } finally {
            setIsUploading(false)
        }
    }

    // Delete file from storage
    async function handleFileDelete(fileName: string) {
        const filePath = `${service.id}/${fileName}`
        try {
            const { error } = await supabase.storage
                .from('service_media')
                .remove([filePath])
            if (error) {
                toast.error("Dosya silinemedi: " + error.message)
            } else {
                toast.success("Dosya silindi.")
                loadMediaFiles()
            }
        } catch (err: any) {
            toast.error("Hata: " + err.message)
        }
    }



    // Save customer complaint and solution explicitly
    async function handleSaveNotes() {
        setIsSavingTexts(true)
        try {
            const { error } = await supabase
                .from('service_records')
                .update({
                    customer_complaint: complaint || null,
                    solution: solution || null
                })
                .eq('id', service.id)

            if (error) {
                toast.error("Notlar kaydedilemedi: " + error.message)
            } else {
                setService(prev => ({
                    ...prev,
                    customer_complaint: complaint,
                    solution: solution
                }))
                toast.success("Servis notları başarıyla güncellendi")
            }
        } catch (err: any) {
            console.error("Save notes error:", err)
            toast.error("Bir hata oluştu.")
        } finally {
            setIsSavingTexts(false)
        }
    }

    // Save general notebook content on blur
    async function handleSaveGeneralNotes(currentNotes: string) {
        setIsSavingTexts(true)
        try {
            const { error } = await supabase
                .from('service_records')
                .update({
                    description: currentNotes || null
                })
                .eq('id', service.id)

            if (error) {
                toast.error("Not kaydedilemedi: " + error.message)
            } else {
                setService(prev => ({
                    ...prev,
                    description: currentNotes
                }))
                toast.success("Genel not defteri güncellendi")
            }
        } catch (err: any) {
            console.error("General notes save error:", err)
        } finally {
            setIsSavingTexts(false)
        }
    }

    // Auto-save individual fields on blur/change
    async function updateServiceField(fieldName: string, value: any) {
        setIsSavingTexts(true)
        try {
            let dbValue = value
            if (fieldName === 'entry_mileage') {
                const num = parseInt(value, 10)
                dbValue = isNaN(num) ? null : num
            } else if (value === "") {
                dbValue = null
            }

            const { error } = await supabase
                .from('service_records')
                .update({
                    [fieldName]: dbValue
                })
                .eq('id', service.id)

            if (error) {
                toast.error("Kaydedilemedi: " + error.message)
            } else {
                setService(prev => ({
                    ...prev,
                    [fieldName]: dbValue
                }))
            }
        } catch (err: any) {
            console.error("Field save error:", err)
        } finally {
            setIsSavingTexts(false)
        }
    }

    // Refetch items to sync reservation changes
    async function syncServiceItems() {
        const { data } = await supabase
            .from('service_items')
            .select('*, stock_cards(*)')
            .eq('service_id', service.id)
        
        if (data) {
            setService(prev => ({
                ...prev,
                service_items: data as any[]
            }))
        }
    }

    // Add service item
    async function handleAddItem() {
        let desc = newLineDesc
        let stockId: string | null = null

        if (newLineType === 'parça') {
            if (selectedStockId) {
                const selectedStock = stockCards.find(s => s.id === selectedStockId)
                if (selectedStock) {
                    stockId = selectedStock.id
                    if (!desc.trim()) {
                        desc = selectedStock.name
                    }
                }
            }
            if (!desc.trim()) {
                toast.error("Lütfen parça açıklaması girin veya listeden parça seçin.")
                return
            }
        } else {
            if (!desc.trim()) {
                toast.error("İşçilik açıklaması girilmelidir.")
                return
            }
        }

        const res = await addServiceItemAction({
            serviceId: service.id,
            stockId,
            description: desc,
            quantity: newLineQty,
            unitPrice: newLinePrice,
            itemType: newLineType
        })

        if (res.success) {
            toast.success("Kalem başarıyla eklendi.")
            // Reset input values
            setNewLineDesc("")
            setSelectedStockId("")
            setNewLineQty(1)
            setNewLinePrice(0)
            
            // Sync layout items & stock quantities
            await syncServiceItems()
        } else {
            toast.error(res.error || "Kalem eklenirken hata.")
        }
    }

    // Delete service item
    async function handleDeleteItem(itemId: string) {
        const res = await deleteServiceItemAction(itemId, service.id)
        if (res.success) {
            toast.success("Kalem silindi.")
            await syncServiceItems()
        } else {
            toast.error(res.error || "Kalem silinirken hata.")
        }
    }

    // Direct inline update of quantities
    async function handleInlineUpdateQty(itemId: string, newQty: number, item: any) {
        const res = await updateServiceItemAction(itemId, service.id, {
            description: item.description,
            quantity: Math.max(1, newQty),
            unitPrice: item.unit_price
        })
        if (res.success) {
            await syncServiceItems()
        } else {
            toast.error(res.error || "Miktar güncellenemedi.")
        }
    }

    // Status transition handler
    function handleStatusUpdate(newStatus: string) {
        startTransition(async () => {
            try {
                const res = await updateServiceStatus(service.id, newStatus)
                if (res.success) {
                    setStatus(newStatus)
                    setService(prev => ({ ...prev, status: newStatus }))
                    toast.success(`Durum başarıyla güncellendi: ${statusLabels[newStatus]}`)
                    await syncServiceItems()
                }
            } catch (err: any) {
                toast.error("Durum güncellenirken hata oluştu: " + err.message)
            }
        })
    }

    // Filter stock list
    const filteredStocks = stockCards.filter(s => 
        s.name.toLowerCase().includes(partSearch.toLowerCase()) || 
        s.stock_code.toLowerCase().includes(partSearch.toLowerCase())
    )

    // Render file icon or preview
    const getFileIcon = (file: any) => {
        const name = file.name.toLowerCase()
        const url = supabase.storage.from('service_media').getPublicUrl(`${service.id}/${file.name}`).data.publicUrl
        if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp') || name.endsWith('.gif')) {
            return (
                <div className="relative group cursor-pointer" onClick={() => setActiveLightbox({ url, type: 'image' })}>
                    <img src={url} alt={file.name} className="w-full h-24 object-cover rounded border border-zinc-200" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded">
                        <Eye className="w-5 h-5 text-white" />
                    </div>
                </div>
            )
        }
        if (name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.webm')) {
            return (
                <div className="relative group cursor-pointer" onClick={() => setActiveLightbox({ url, type: 'video' })}>
                    <div className="w-full h-24 bg-zinc-900 rounded flex flex-col items-center justify-center border border-zinc-200 text-zinc-400">
                        <FileVideo className="w-8 h-8 text-zinc-400" />
                        <span className="text-[8px] mt-1 truncate max-w-full px-2">{file.name}</span>
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded">
                        <Play className="w-5 h-5 text-white" />
                    </div>
                </div>
            )
        }
        if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a') || name.endsWith('.ogg')) {
            return (
                <div className="w-full h-24 bg-zinc-50 rounded flex flex-col items-center justify-center border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-colors">
                    <FileAudio className="w-8 h-8 text-blue-500" />
                    <span className="text-[8px] mt-1 truncate max-w-full px-2">{file.name}</span>
                    <audio src={url} controls className="w-full scale-75 mt-1 scale-x-95 scale-y-75 max-w-full" />
                </div>
            )
        }
        return (
            <div className="w-full h-24 bg-zinc-50 rounded flex flex-col items-center justify-center border border-zinc-200 text-zinc-500">
                <FileText className="w-8 h-8 text-zinc-400" />
                <span className="text-[8px] mt-1 truncate max-w-full px-2">{file.name}</span>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 h-full overflow-hidden">
            
            {/* LİGHTBOX PREVIEW MODAL */}
            {activeLightbox && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
                    <button className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2" onClick={() => setActiveLightbox(null)}>
                        <X className="w-6 h-6" />
                    </button>
                    {activeLightbox.type === 'image' ? (
                        <img src={activeLightbox.url} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl" />
                    ) : (
                        <video src={activeLightbox.url} controls autoPlay className="max-w-full max-h-[90vh] rounded shadow-2xl" />
                    )}
                </div>
            )}

            {/* SOL KOLON: Müşteri & Cihaz Bilgi Kartları */}
            <div className="lg:col-span-3 h-full overflow-y-auto custom-scrollbar space-y-5 pr-1 pb-4">
                
                {/* 1. Servis Kodu Başlığı */}
                <div className="bg-zinc-900 text-white p-4 rounded-xl shadow-md border border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">İş Emri / Servis Kodu</span>
                    <h2 className="text-xl font-black tracking-wide leading-none">{service.service_code}</h2>
                    <div className="pt-2 flex items-center gap-1.5">
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-[10px]">{(service.service_type || 'bakim').toUpperCase()}</Badge>
                        <Badge className={cn("text-[10px]", 
                            service.priority === "yuksek" || service.priority === "yüksek" ? "bg-red-600" : "bg-zinc-700"
                        )}>{(service.priority || 'normal').toUpperCase()}</Badge>
                    </div>
                </div>

                {/* 2. Müşteri Detay Kartı */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <User className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">Müşteri Cari</h3>
                    </div>
                    {service.customers ? (
                        <div className="space-y-3 text-xs leading-relaxed text-zinc-600">
                            <div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase leading-none">İsim / Ünvan</p>
                                <p className="font-bold text-zinc-900 mt-1">{service.customers.first_name} {service.customers.last_name || ""}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase leading-none">İletişim Numarası</p>
                                <p className="font-semibold text-zinc-800 mt-1">{service.customers.phone || "-"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase leading-none">E-posta</p>
                                <p className="text-zinc-850 mt-1">{service.customers.email || "-"}</p>
                            </div>
                            <div className="pt-2 border-t border-zinc-100 flex justify-between items-center">
                                <span className="font-bold text-[10px] text-zinc-400 uppercase">Cari Hesap Durumu</span>
                                <Badge className={cn("text-[10px] font-bold",
                                    service.customers.balance > 0 ? "bg-red-50 text-red-700 hover:bg-red-50 border border-red-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                                )}>
                                    {service.customers.balance > 0 
                                        ? `Borçlu: ${Math.abs(service.customers.balance).toLocaleString()} ₺` 
                                        : `Alacaklı: ${Math.abs(service.customers.balance).toLocaleString()} ₺`}
                                </Badge>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-zinc-450 italic">Müşteri bilgileri bulunamadı.</p>
                    )}
                </div>

                {/* 3. Cihaz / Araç Detay Kartı */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <Car className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">Cihaz / Araç Bilgileri</h3>
                    </div>
                    {service.vehicles ? (
                        <div className="space-y-3 text-xs leading-relaxed text-zinc-600">
                            <div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase leading-none">Plaka</p>
                                <div className="mt-1 inline-block border-2 border-zinc-950 bg-white px-2 py-0.5 rounded text-zinc-950 font-black tracking-widest text-sm shadow-sm select-none">
                                    {service.vehicles.plate}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase leading-none">Marka / Model</p>
                                <p className="font-bold text-zinc-900 mt-1">{service.vehicles.brand} {service.vehicles.model} ({service.vehicles.year || "-"})</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase leading-none">Kayıtlı Araç Kilometresi</p>
                                <p className="font-semibold text-zinc-800 mt-1">
                                    {service.vehicles.mileage.toLocaleString()} KM
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-zinc-455 italic">Cihaz veya araç kartı bulunamadı.</p>
                    )}
                </div>

                {/* 4. Kabul Detayları Kartı */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <Wrench className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">Kabul Detayları</h3>
                    </div>
                    <div className="space-y-3 text-xs text-zinc-600">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-zinc-400 font-bold uppercase leading-none">Servis Tipi</Label>
                            <Select value={serviceType} onValueChange={(val) => {
                                setServiceType(val)
                                updateServiceField('service_type', val)
                            }}>
                                <SelectTrigger className="h-8 text-xs border-zinc-200 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="bakim" className="text-xs">Periyodik Bakım</SelectItem>
                                    <SelectItem value="tamir" className="text-xs">Tamir / Onarım</SelectItem>
                                    <SelectItem value="muayene" className="text-xs">Muayene Hazırlık</SelectItem>
                                    <SelectItem value="modifikasyon" className="text-xs">Modifikasyon</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-1">
                            <Label className="text-[10px] text-zinc-400 font-bold uppercase leading-none">Öncelik</Label>
                            <Select value={priority} onValueChange={(val) => {
                                setPriority(val)
                                updateServiceField('priority', val)
                            }}>
                                <SelectTrigger className="h-8 text-xs border-zinc-200 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="dusuk" className="text-xs">Düşük</SelectItem>
                                    <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                                    <SelectItem value="yuksek" className="text-xs">Yüksek</SelectItem>
                                    <SelectItem value="acil" className="text-xs">Acil!</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] text-zinc-400 font-bold uppercase leading-none">Giriş Kilometresi (KM)</Label>
                            <Input 
                                type="number"
                                value={entryMileage}
                                onChange={(e) => setEntryMileage(e.target.value)}
                                onBlur={() => updateServiceField('entry_mileage', entryMileage)}
                                placeholder="Giriş KM girin..."
                                className="h-8 text-xs border-zinc-200 bg-white"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] text-zinc-400 font-bold uppercase leading-none">Yakıt Durumu</Label>
                            <Select value={fuelLevel} onValueChange={(val) => {
                                setFuelLevel(val)
                                updateServiceField('fuel_level', val)
                            }}>
                                <SelectTrigger className="h-8 text-xs border-zinc-200 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="bos" className="text-xs">Işık Yanıyor / Boş</SelectItem>
                                    <SelectItem value="ceyrek" className="text-xs">Çeyrek Depo</SelectItem>
                                    <SelectItem value="yarim" className="text-xs">Yarım Depo</SelectItem>
                                    <SelectItem value="ucceyrek" className="text-xs">3/4 Depo</SelectItem>
                                    <SelectItem value="dolu" className="text-xs">Dolu Depo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] text-zinc-400 font-bold uppercase leading-none">Hasar / Kaporta Notları</Label>
                            <Textarea 
                                value={damageAssessment}
                                onChange={(e) => setDamageAssessment(e.target.value)}
                                onBlur={() => updateServiceField('damage_assessment', damageAssessment)}
                                placeholder="Kaporta çizik veya hasar detayları..."
                                className="text-xs border-zinc-200 bg-white min-h-[50px] resize-none"
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* ORTA KOLON: Ana Operasyon, Şikayet/Çözüm ve Excel Kalemler Tablosu */}
            <div className="lg:col-span-6 h-full overflow-y-auto custom-scrollbar space-y-6 px-2 pb-4 border-r border-zinc-200">
                
                {/* 1. Arıza Şikayeti & Detaylar */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-zinc-400" />
                            <h3 className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">Arıza Teşhisi & Şikayet</h3>
                        </div>
                        {isSavingTexts && (
                            <span className="text-[9px] text-zinc-400 flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> Kaydediliyor...
                            </span>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Müşteri Şikayeti */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-zinc-650">Müşteri Şikayeti / Talebi</Label>
                            <Textarea
                                value={complaint}
                                onChange={(e) => setComplaint(e.target.value)}
                                placeholder="Müşterinin bildirdiği şikayet veya talebi detaylı olarak yazın..."
                                className="border-zinc-200 text-xs bg-white min-h-[120px] leading-relaxed"
                            />
                        </div>

                        {/* Çözüm Açıklaması */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-zinc-650">Uygulanan Çözüm / İşlem</Label>
                            <Textarea
                                value={solution}
                                onChange={(e) => setSolution(e.target.value)}
                                placeholder="Uygulanan teknik onarımı ve çözümü detaylı olarak yazın..."
                                className="border-zinc-200 text-xs bg-white min-h-[140px] leading-relaxed"
                            />
                        </div>

                        {/* Explicit Save Button */}
                        <div className="flex justify-end pt-1">
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveNotes}
                                disabled={!hasNotesChanges || isSavingTexts}
                                className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs px-3.5 h-8 flex items-center gap-1.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                            >
                                {isSavingTexts ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    "Notları Kaydet"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. Excel Hücresi Mantığında Yapılan Parça & İşçilik İşlemleri Tablosu */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">Parça & İşçilik Kalemleri</span>
                        <span className="text-xs font-bold text-zinc-900">Toplam: {totalAmount.toLocaleString()} ₺</span>
                    </div>

                    <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <Table className="text-xs">
                            <TableHeader className="bg-zinc-50/70">
                                <TableRow>
                                    <TableHead className="w-16 font-semibold">Tür</TableHead>
                                    <TableHead className="font-semibold">Açıklama / Parça</TableHead>
                                    <TableHead className="w-24 text-center font-semibold">Miktar</TableHead>
                                    <TableHead className="w-24 text-right font-semibold">Birim Fiyat</TableHead>
                                    <TableHead className="w-24 text-right font-semibold">Toplam</TableHead>
                                    <TableHead className="w-16 text-center font-semibold"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {service.service_items && service.service_items.length > 0 ? (
                                    service.service_items.map((item) => {
                                        // Dynamic Stock Reservation check
                                        const isPart = item.stock_id !== null
                                        const isOut = isPart && item.stock_cards && item.stock_cards.current_stock < 0

                                        return (
                                            <TableRow 
                                                key={item.id} 
                                                className={cn(
                                                    "hover:bg-zinc-50/50 transition-colors",
                                                    isOut ? "bg-red-50/40 hover:bg-red-50/60 text-red-900" : ""
                                                )}
                                            >
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[9px] px-1 py-0.5",
                                                        isPart ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"
                                                    )}>
                                                        {item.item_type === 'parça' ? 'Parça' : 'İşçilik'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    <div>
                                                        {item.description}
                                                        {isOut && (
                                                            <div className="text-[9px] text-red-600 font-bold mt-0.5 flex items-center gap-0.5">
                                                                <AlertCircle className="w-3 h-3 shrink-0" /> Tedarik Bekliyor (Eksik: {Math.abs(item.stock_cards?.current_stock || 0)} adet)
                                                            </div>
                                                        )}
                                                        {isPart && !isOut && (
                                                            <div className="text-[8px] text-emerald-600 font-bold mt-0.5">
                                                                ✓ Rezerve Edildi (Stokta: {item.stock_cards?.current_stock || 0} adet)
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {status === 'tamamlandı' ? (
                                                        <span className="font-bold">{item.quantity}</span>
                                                    ) : (
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => handleInlineUpdateQty(item.id, parseInt(e.target.value) || 1, item)}
                                                            className="w-14 h-7 text-center mx-auto text-xs border-zinc-200 bg-white"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">{item.unit_price.toLocaleString()} ₺</TableCell>
                                                <TableCell className="text-right font-bold text-zinc-950">{(item.quantity * item.unit_price).toLocaleString()} ₺</TableCell>
                                                <TableCell className="text-center">
                                                    {status !== 'tamamlandı' && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-6 text-zinc-400 italic">
                                            Henüz parça veya işçilik eklenmedi.
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* Excel Inline Kalem Ekleme Satırı (Alt Sıra) */}
                                {status !== 'tamamlandı' && (
                                    <TableRow className="bg-zinc-50/50 border-t-2 border-zinc-200">
                                        <TableCell className="p-2">
                                            <Select value={newLineType} onValueChange={(val: any) => {
                                                setNewLineType(val)
                                                setSelectedStockId("")
                                                setNewLineDesc("")
                                                setNewLinePrice(0)
                                            }}>
                                                <SelectTrigger className="h-8 text-[10px] border-zinc-200 bg-white px-2">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    <SelectItem value="parça" className="text-xs">Parça</SelectItem>
                                                    <SelectItem value="işçilik" className="text-xs">İşçilik</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="p-2">
                                            {newLineType === 'parça' ? (
                                                <div className="space-y-1.5">
                                                    <Input
                                                        placeholder="Parça ara..."
                                                        value={partSearch}
                                                        onChange={(e) => setPartSearch(e.target.value)}
                                                        className="h-7 text-[10px] border-zinc-200 bg-white"
                                                    />
                                                    <Select value={selectedStockId || "no_stock"} onValueChange={(val) => {
                                                        if (val === "no_stock") {
                                                            setSelectedStockId("")
                                                            setNewLinePrice(0)
                                                            setNewLineDesc("")
                                                        } else {
                                                            setSelectedStockId(val)
                                                            const card = stockCards.find(c => c.id === val)
                                                            if (card) {
                                                                setNewLinePrice(card.sale_price || 0)
                                                                setNewLineDesc(card.name)
                                                            }
                                                        }
                                                    }}>
                                                        <SelectTrigger className="h-8 text-[10px] border-zinc-200 bg-white">
                                                            <SelectValue placeholder="Parça seçin (Opsiyonel)..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white max-h-48 overflow-y-auto">
                                                            <SelectItem value="no_stock" className="text-xs italic text-zinc-400">--- Stok Seçimi Yok (Serbest Giriş) ---</SelectItem>
                                                            {filteredStocks.map(card => (
                                                                <SelectItem key={card.id} value={card.id} className="text-xs">
                                                                    {card.name} (Kod: {card.stock_code}) - {card.sale_price || 0} ₺
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        placeholder="Parça açıklamasını girin..."
                                                        value={newLineDesc}
                                                        onChange={(e) => setNewLineDesc(e.target.value)}
                                                        className="h-8 text-xs border-zinc-200 bg-white mt-1.5"
                                                    />
                                                </div>
                                            ) : (
                                                <Input
                                                    placeholder="İşçilik açıklamasını girin..."
                                                    value={newLineDesc}
                                                    onChange={(e) => setNewLineDesc(e.target.value)}
                                                    className="h-8 text-xs border-zinc-200 bg-white"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <Input
                                                type="number"
                                                min="1"
                                                value={newLineQty}
                                                onChange={(e) => setNewLineQty(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-14 h-8 text-center mx-auto text-xs border-zinc-200 bg-white"
                                            />
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={newLinePrice || ""}
                                                onChange={(e) => setNewLinePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                                                className="w-20 h-8 text-right ml-auto text-xs border-zinc-200 bg-white"
                                                placeholder="0.00"
                                            />
                                        </TableCell>
                                        <TableCell className="p-2 text-right font-bold text-zinc-700">
                                            {(newLineQty * newLinePrice).toLocaleString()} ₺
                                        </TableCell>
                                        <TableCell className="p-2 text-center">
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={handleAddItem}
                                                className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white p-0"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

            </div>

            {/* SAĞ KOLON: Durum Değiştirme, Notlar ve Multimedya Yükleme Alanı */}
            <div className="lg:col-span-3 h-full overflow-y-auto custom-scrollbar space-y-6 pl-1 pb-4">
                
                {/* 1. Aksiyonlar ve Statü Güncelleme Butonları */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <Clock className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">Servis İş Emri Statüsü</h3>
                    </div>

                    {status === 'tamamlandı' ? (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>İş emri tamamlanmış ve stok çıkışları kesinleştirilmiştir.</span>
                        </div>
                    ) : status === 'iptal' ? (
                        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span>Bu servis kaydı iptal edilmiştir. Rezervasyonlar iade edildi.</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] text-zinc-400 font-bold">DURUMU GÜNCELLE:</span>
                            {['araç kabul', 'ariza tespiti', 'parca bekleniyor', 'onarimda', 'kalite_kontrol', 'teslimata_hazir'].map((st) => (
                                <Button
                                    key={st}
                                    type="button"
                                    variant={status === st ? "default" : "outline"}
                                    onClick={() => handleStatusUpdate(st)}
                                    disabled={isPending}
                                    className={cn(
                                        "w-full text-left justify-start text-xs font-semibold h-8.5 px-3 border-zinc-200",
                                        status === st 
                                            ? "bg-zinc-900 text-white border-zinc-950 hover:bg-zinc-900" 
                                            : "bg-white text-zinc-700 hover:bg-zinc-50"
                                    )}
                                >
                                    {statusLabels[st]}
                                </Button>
                            ))}
                            <div className="h-px bg-zinc-150 my-1" />
                            <Button
                                type="button"
                                onClick={() => handleStatusUpdate('tamamlandı')}
                                disabled={isPending}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Tamamla ve Stoktan Düş
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleStatusUpdate('iptal')}
                                disabled={isPending}
                                variant="outline"
                                className="w-full border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs h-8.5"
                            >
                                İş Emrini İptal Et
                            </Button>
                        </div>
                    )}
                </div>

                {/* 2. Multimedya Sürükle Bırak Fotoğraf/Dosya Alanı */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <Upload className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">Fotoğraf & Multimedya</h3>
                    </div>

                    {/* Drag Drop Area */}
                    {status !== 'tamamlandı' && status !== 'iptal' && (
                        <div className="relative border-2 border-dashed border-zinc-250 rounded-lg p-4 text-center bg-zinc-50 hover:bg-zinc-100 transition-colors group">
                            <input
                                type="file"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="flex flex-col items-center justify-center space-y-2">
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                        <p className="text-[10px] text-zinc-500">Dosya yükleniyor...</p>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="w-6 h-6 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                                        <p className="text-[10px] text-zinc-600 font-semibold">Tıklayın veya Sürükleyin</p>
                                        <p className="text-[8px] text-zinc-400">Görsel, Video veya Ses dosyası</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Dosya Önizlemeleri */}
                    {mediaFiles.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            {mediaFiles.map((file, idx) => (
                                <div key={file.id || idx} className="relative group border border-zinc-200 rounded overflow-hidden shadow-sm bg-white">
                                    {getFileIcon(file)}
                                    {status !== 'tamamlandı' && status !== 'iptal' && (
                                        <button
                                            type="button"
                                            onClick={() => handleFileDelete(file.name)}
                                            className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-[10px] text-zinc-400 italic py-4">Henüz yüklenmiş medya dosyası bulunmuyor.</p>
                    )}
                </div>

                {/* 3. Not Defteri */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">Genel Not Defteri</h3>
                    </div>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onBlur={() => handleSaveGeneralNotes(notes)}
                        placeholder="Teknisyen notları veya dökümantasyon detayları..."
                        className="border-zinc-200 text-xs bg-white min-h-[80px] leading-relaxed"
                    />
                </div>

            </div>

        </div>
    )
}
