import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateServiceStatus, completeService } from "@/components/services/actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, User, Wrench, AlertTriangle, CheckCircle2, Clock, Play, Package, ShieldCheck } from "lucide-react"
import Link from "next/link"
import ServiceDetailActions from "@/components/services/ServiceDetailActions"

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Servis, müşteri, araç ve parça/işçilik kalemlerini çekiyoruz
    const { data: service, error } = await supabase
        .from('service_records')
        .select('*, customers(*), vehicles(*), service_items(*)')
        .eq('id', id)
        .single()

    if (error || !service) {
        return (
            <div className="p-8 text-center bg-white border border-zinc-200 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-zinc-900">Servis Kaydı Bulunamadı</h3>
                <p className="text-sm text-zinc-500 mt-1">İlgili servis kaydı veritabanından silinmiş veya erişilemez durumda olabilir.</p>
                <Button className="mt-4" asChild>
                    <Link href="/services">Servis Kayıtlarına Dön</Link>
                </Button>
            </div>
        )
    }

    // Fiyat hesaplaması
    const totalAmount = service.service_items?.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0) || 0

    // Stepper Milestones (Kabul -> Onarım -> Kontrol -> Tamamlandı)
    const isStep1 = ['araç kabul', 'ariza tespiti', 'parca bekleniyor', 'onarimda', 'kalite_kontrol', 'teslimata_hazir', 'tamamlandı'].includes(service.status)
    const isStep2 = ['parca bekleniyor', 'onarimda', 'kalite_kontrol', 'teslimata_hazir', 'tamamlandı'].includes(service.status)
    const isStep3 = ['kalite_kontrol', 'teslimata_hazir', 'tamamlandı'].includes(service.status)
    const isStep4 = service.status === 'tamamlandı'

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

    return (
        <>
            {/* Web Görünümü (Yazdırma esnasında gizlenecek) */}
            <div className="space-y-8 print:hidden">
                {/* Üst Kısım & Durum Bilgisi */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">{service.service_code}</h2>
                            <Badge
                                variant="secondary"
                                className={
                                    service.status === "tamamlandı"
                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 font-semibold"
                                        : service.status === "iptal"
                                        ? "bg-red-50 text-red-700 hover:bg-red-50 font-semibold"
                                        : service.status === "onarimda" || service.status === "kalite_kontrol"
                                        ? "bg-blue-50 text-blue-700 hover:bg-blue-50 font-semibold"
                                        : "bg-amber-50 text-amber-700 hover:bg-amber-50 font-semibold"
                                }
                            >
                                {statusLabels[service.status]?.toUpperCase() || service.status.toUpperCase()}
                            </Badge>
                            
                            {/* Yazdırma ve WhatsApp Butonları */}
                            <ServiceDetailActions
                                serviceId={service.id}
                                serviceCode={service.service_code}
                                customerName={`${service.customers?.first_name || ""} ${service.customers?.last_name || ""}`}
                                phone={service.customers?.phone || ""}
                                plate={service.vehicles?.plate || ""}
                                totalAmount={totalAmount}
                                customerId={service.customer_id}
                                serviceItems={service.service_items}
                            />
                        </div>
                        <p className="text-sm text-zinc-500 mt-1">
                            Servis başlangıcı: {new Date(service.created_at).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    {service.status !== "tamamlandı" && service.status !== "iptal" && (
                        <div className="flex flex-wrap items-center gap-3 bg-zinc-50 p-2 border border-zinc-200 rounded-lg">
                            <form action={async (formData: FormData) => {
                                "use server"
                                const status = formData.get("status") as string
                                await updateServiceStatus(id, status)
                            }} className="flex items-center gap-2">
                                <Select name="status" defaultValue={service.status}>
                                    <SelectTrigger className="w-[180px] bg-white border-zinc-200 text-xs h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="araç kabul">Araç Kabul</SelectItem>
                                        <SelectItem value="ariza tespiti">Arıza Tespiti</SelectItem>
                                        <SelectItem value="parca bekleniyor">Parça Bekleniyor</SelectItem>
                                        <SelectItem value="onarimda">Onarımda</SelectItem>
                                        <SelectItem value="kalite_kontrol">Kalite Kontrol</SelectItem>
                                        <SelectItem value="teslimata_hazir">Teslimata Hazır</SelectItem>
                                        <SelectItem value="iptal">İptal Et</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button type="submit" variant="outline" className="text-xs font-semibold h-9 px-3">
                                    Güncelle
                                </Button>
                            </form>

                            <div className="h-6 w-px bg-zinc-200" />

                            <form action={async () => {
                                "use server"
                                await completeService(id)
                            }}>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2 h-9 px-4 text-xs">
                                    <CheckCircle2 className="w-4 h-4" /> Tamamla & Stok Düş
                                </Button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Stepper (Durum Çubuğu - İptal durumunda gizlenir) */}
                {service.status !== "iptal" ? (
                    <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative">
                            <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-[2px] bg-zinc-100 -z-10 hidden md:block" />
                            
                            <div className="flex items-center gap-4 bg-white px-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                                    isStep1 ? "border-amber-500 bg-amber-50 text-amber-600" : "border-zinc-200 text-zinc-400"
                                }`}>
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900">Kabul & Teşhis</p>
                                    <p className="text-xs text-zinc-500">Araç kabul edildi, arıza tespiti yapılıyor</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white px-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                                    isStep2 ? "border-blue-500 bg-blue-50 text-blue-600" : "border-zinc-200 text-zinc-400"
                                }`}>
                                    <Play className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900">Onarım Süreci</p>
                                    <p className="text-xs text-zinc-500">Parça bekleniyor veya onarımda</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white px-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                                    isStep3 ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-zinc-200 text-zinc-400"
                                }`}>
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900">Kalite Kontrol</p>
                                    <p className="text-xs text-zinc-500">Kontroller yapılıyor, teslime hazırlanıyor</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white px-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                                    isStep4 ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-zinc-200 text-zinc-400"
                                }`}>
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900">Tamamlandı</p>
                                    <p className="text-xs text-zinc-500">İşlem bitti, teslim edildi</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                        <div>
                            <p className="font-semibold text-sm">Bu Servis Kaydı İptal Edilmiştir</p>
                            <p className="text-xs text-red-700/90">Bu iş emri iptal edildiğinden üzerinde herhangi bir işlem veya stok hareketi yapılamaz.</p>
                        </div>
                    </div>
                )}

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sol Büyük Alan: Servis Detay & Kalemler */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm space-y-6">
                            <h3 className="text-lg font-bold text-zinc-900 border-b pb-2">Servis Kabul Detayları</h3>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 uppercase">Servis Tipi</p>
                                    <p className="text-sm font-semibold text-zinc-950 mt-1 capitalize">{service.service_type || "Periyodik Bakım"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 uppercase">Öncelik Seviyesi</p>
                                    <p className="text-sm font-semibold text-zinc-950 mt-1 capitalize">{service.priority || "Normal"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 uppercase">Giriş Kilometresi</p>
                                    <p className="text-sm font-semibold text-zinc-950 mt-1">
                                        {service.entry_mileage ? `${service.entry_mileage.toLocaleString('tr-TR')} KM` : "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 uppercase">Yakıt Durumu</p>
                                    <p className="text-sm font-semibold text-zinc-950 mt-1">
                                        {service.fuel_level ? fuelLabels[service.fuel_level] || service.fuel_level : "-"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 uppercase mb-1">Müşteri Şikayeti / Talep</p>
                                    <div className="bg-zinc-50 border border-zinc-200 rounded p-3 text-sm text-zinc-700 leading-relaxed min-h-[80px]">
                                        {service.customer_complaint || "Açıklama girilmemiş."}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 uppercase mb-1">Hasar Tespit / Kaporta Notları</p>
                                    <div className="bg-zinc-50 border border-zinc-200 rounded p-3 text-sm text-zinc-700 leading-relaxed min-h-[80px]">
                                        {service.damage_assessment || "Hasar veya kaporta kusuru bildirilmemiş."}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-lg font-bold text-zinc-900">Yapılan Parça & İşçilik İşlemleri</h3>
                            </div>
                            
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Açıklama / Parça</TableHead>
                                        <TableHead className="text-center">Miktar</TableHead>
                                        <TableHead className="text-right">Birim Fiyat</TableHead>
                                        <TableHead className="text-right">Toplam Fiyat</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {service.service_items && service.service_items.length > 0 ? (
                                        service.service_items.map((item: any) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {item.stock_id ? <Package className="w-4 h-4 text-zinc-400" /> : <Wrench className="w-4 h-4 text-zinc-400" />}
                                                        {item.description}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{item.unit_price} ₺</TableCell>
                                                <TableCell className="text-right font-semibold text-zinc-900">{item.total_price} ₺</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-zinc-400">
                                                Bu servis kaydına henüz hiçbir parça veya işçilik eklenmedi.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            <div className="flex justify-end pt-4 border-t border-zinc-100">
                                <div className="text-right space-y-1">
                                    <p className="text-xs text-zinc-500 font-semibold uppercase">Genel Toplam</p>
                                    <p className="text-2xl font-bold text-zinc-900">{totalAmount} ₺</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sağ Küçük Alan: Müşteri & Araç Bilgileri */}
                    <div className="space-y-6">
                        {/* Müşteri Bilgileri */}
                        <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <User className="w-5 h-5 text-zinc-500" />
                                <h3 className="text-lg font-bold text-zinc-900">Müşteri</h3>
                            </div>
                            {service.customers ? (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-zinc-400 font-semibold uppercase">Ad Soyad</p>
                                        <p className="text-sm font-semibold text-zinc-900">{service.customers.first_name} {service.customers.last_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-400 font-semibold uppercase">Telefon</p>
                                        <p className="text-sm text-zinc-700">{service.customers.phone || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-400 font-semibold uppercase">E-posta</p>
                                        <p className="text-sm text-zinc-700">{service.customers.email || "-"}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-500">Müşteri kaydı bulunamadı.</p>
                            )}
                        </div>

                        {/* Araç Bilgileri */}
                        <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <Calendar className="w-5 h-5 text-zinc-500" />
                                <h3 className="text-lg font-bold text-zinc-900">Araç Bilgisi</h3>
                            </div>
                            {service.vehicles ? (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-zinc-400 font-semibold uppercase">Plaka</p>
                                        <Badge className="bg-zinc-900 text-white font-bold tracking-wide mt-1">
                                            {service.vehicles.plate}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-400 font-semibold uppercase">Marka / Model</p>
                                        <p className="text-sm font-semibold text-zinc-900">{service.vehicles.brand} {service.vehicles.model}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-400 font-semibold uppercase">Model Yılı</p>
                                        <p className="text-sm text-zinc-700">{service.vehicles.year || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-400 font-semibold uppercase">Mevcut Kilometre</p>
                                        <p className="text-sm text-zinc-700">{service.vehicles.mileage} KM</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-500">Araç kaydı bulunamadı.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* A4 Yazıcı Dostu Çıktı Tasarımı (Ekran görüntülerinde gizlenip sadece yazdırma esnasında görünecektir) */}
            <div className="hidden print:block w-full text-zinc-900 font-sans p-4 space-y-8" style={{ minHeight: '297mm', width: '100%' }}>
                {/* Print Header */}
                <div className="flex justify-between items-start border-b border-zinc-300 pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-blue-600">OMES</h1>
                        <p className="text-xs text-zinc-500 mt-1">Teknik Servis ve Operasyon Yönetim Sistemi</p>
                    </div>
                    <div className="text-right space-y-1">
                        <h2 className="text-xl font-bold tracking-wide">SERVIS KABUL FORMU</h2>
                        <p className="text-sm font-semibold text-zinc-700">Kayıt No: {service.service_code}</p>
                        <p className="text-xs text-zinc-500">
                            Tarih: {new Date(service.created_at).toLocaleDateString('tr-TR')}
                        </p>
                        {/* Dinamik QR Kod Entegrasyonu */}
                        <div className="mt-2 flex justify-end">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`http://localhost:3000/services/${service.id}`)}`} 
                                alt="QR Code" 
                                className="w-16 h-16 border border-zinc-200 p-0.5 rounded bg-white" 
                            />
                        </div>
                    </div>
                </div>

                {/* Müşteri ve Araç Bilgi Kartları */}
                <div className="grid grid-cols-2 gap-6 border border-zinc-200 rounded-lg p-5">
                    <div className="space-y-1.5">
                        <h3 className="font-bold text-xs text-zinc-400 uppercase tracking-wider border-b pb-1">Müşteri Bilgileri</h3>
                        <p className="text-sm"><strong>Ad Soyad:</strong> {service.customers?.first_name} {service.customers?.last_name || ""}</p>
                        <p className="text-sm"><strong>Telefon:</strong> {service.customers?.phone || "-"}</p>
                        <p className="text-sm"><strong>E-posta:</strong> {service.customers?.email || "-"}</p>
                        {service.customers?.type === "kurumsal" && (
                            <>
                                <p className="text-sm"><strong>Vergi Dairesi:</strong> {service.customers?.tax_office || "-"}</p>
                                <p className="text-sm"><strong>VKN:</strong> {service.customers?.tax_number || "-"}</p>
                            </>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="font-bold text-xs text-zinc-400 uppercase tracking-wider border-b pb-1">Araç Bilgileri</h3>
                        <p className="text-sm"><strong>Plaka:</strong> {service.vehicles?.plate}</p>
                        <p className="text-sm"><strong>Marka / Model:</strong> {service.vehicles?.brand} {service.vehicles?.model} ({service.vehicles?.year})</p>
                        <p className="text-sm"><strong>Giriş KM:</strong> {service.entry_mileage ? `${service.entry_mileage.toLocaleString('tr-TR')} KM` : "-"}</p>
                        <p className="text-sm"><strong>Yakıt Seviyesi:</strong> {service.fuel_level ? fuelLabels[service.fuel_level] : "-"}</p>
                    </div>
                </div>

                {/* Hasar / Şikayet Detayları */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="border border-zinc-200 rounded-lg p-4 space-y-1.5">
                        <h4 className="font-bold text-xs text-zinc-500 uppercase tracking-wider">Müşteri Şikayeti / Talep</h4>
                        <p className="text-sm text-zinc-800 leading-relaxed">{service.customer_complaint || "Şikayet/Talep girilmemiş."}</p>
                    </div>
                    <div className="border border-zinc-200 rounded-lg p-4 space-y-1.5">
                        <h4 className="font-bold text-xs text-zinc-500 uppercase tracking-wider">Hasar Tespit / Kaporta Notları</h4>
                        <p className="text-sm text-zinc-800 leading-relaxed">{service.damage_assessment || "Kusurlu/Hasarlı alan bildirilmemiş."}</p>
                    </div>
                </div>

                {/* Parça / İşçilik Tablosu */}
                <div className="space-y-2">
                    <h3 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">Yapılan İşlemler, Parça & İşçilik Detayları</h3>
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b-2 border-zinc-300 bg-zinc-50 text-zinc-700">
                                <th className="py-2 px-3 font-semibold">Açıklama / Yedek Parça</th>
                                <th className="py-2 px-3 text-center w-20 font-semibold">Miktar</th>
                                <th className="py-2 px-3 text-right w-28 font-semibold">Birim Fiyat</th>
                                <th className="py-2 px-3 text-right w-28 font-semibold">Toplam Fiyat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {service.service_items && service.service_items.length > 0 ? (
                                service.service_items.map((item: any) => (
                                    <tr key={item.id} className="text-zinc-800">
                                        <td className="py-2.5 px-3">{item.description}</td>
                                        <td className="py-2.5 px-3 text-center font-medium">{item.quantity}</td>
                                        <td className="py-2.5 px-3 text-right">{item.unit_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                        <td className="py-2.5 px-3 text-right font-semibold">{item.total_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-4 text-center text-zinc-400">Herhangi bir işlem yapılmamıştır.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Finansal Toplam */}
                <div className="flex justify-end pt-4">
                    <div className="text-right space-y-1 w-64 border-t border-zinc-200 pt-3">
                        <span className="text-xs font-bold text-zinc-500 uppercase">Toplam Hizmet Bedeli</span>
                        <div className="text-2xl font-bold text-zinc-900">
                            {totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </div>
                    </div>
                </div>

                {/* Print Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-16 mt-12">
                    <div className="text-center space-y-12">
                        <p className="text-xs font-bold text-zinc-500 uppercase border-b border-zinc-200 pb-1">Müşteri / Aracı Teslim Eden</p>
                        <div className="h-12 flex items-end justify-center text-xs text-zinc-400 italic">İsim / İmza</div>
                    </div>
                    <div className="text-center space-y-12">
                        <p className="text-xs font-bold text-zinc-500 uppercase border-b border-zinc-200 pb-1">Servis Yetkilisi / Teslim Alan</p>
                        <div className="h-12 flex items-end justify-center text-xs text-zinc-400 italic">Kaşe / İmza</div>
                    </div>
                </div>
            </div>
        </>
    )
}
