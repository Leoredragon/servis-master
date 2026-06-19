import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import ServiceDetailActions from "@/components/services/ServiceDetailActions"
import ServiceCockpitClient from "@/components/services/ServiceCockpitClient"

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Servis, müşteri, araç ve parça/işçilik kalemlerini (stok kartları ile birlikte) çekiyoruz
    const { data: service, error } = await supabase
        .from('service_records')
        .select('*, customers(*), vehicles(*), service_items(*, stock_cards(*))')
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

    // Aktif stok kartlarını çekiyoruz
    const { data: stockCards } = await supabase
        .from('stock_cards')
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true })

    // Fiyat hesaplaması (Yazıcı çıktısı için)
    const totalAmount = service.service_items?.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0) || 0

    const fuelLabels: Record<string, string> = {
        "bos": "Işık Yanıyor / Boş",
        "ceyrek": "Çeyrek Depo",
        "yarim": "Yarım Depo",
        "ucceyrek": "3/4 Depo",
        "dolu": "Dolu Depo"
    }

    return (
        <>
            {/* Ekran Görünümü (SPA Cockpit ve Üst Aksiyon Çubuğu) */}
            <div className="flex flex-col h-[calc(100vh-8.5rem)] overflow-hidden space-y-4 print:hidden">
                {/* Üst Kısım / Yol Bulucu & Detay Butonları */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <Link href="/services" className="text-zinc-500 hover:text-zinc-800 transition-colors text-xs font-bold flex items-center gap-1">
                            &larr; Servis Kayıtları
                        </Link>
                        <div className="h-4 w-px bg-zinc-200" />
                        <h2 className="text-sm font-black tracking-tight text-zinc-900">
                            Servis Kokpiti / {service.service_code}
                        </h2>
                    </div>

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

                {/* 3-Column SPA Cockpit */}
                <ServiceCockpitClient 
                    serviceInitial={service as any} 
                    stockCards={(stockCards || []) as any} 
                />
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
