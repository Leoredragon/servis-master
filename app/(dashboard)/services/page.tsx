import NewServiceDialog from "@/components/services/NewServiceDialog"
import ServicesTable from "@/components/services/ServicesTable"
import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/ui/empty-state"

interface ServiceRecord {
    id: string
    service_code: string
    service_type: string
    priority: string
    status: string
    entry_mileage: number | null
    created_at: string
    customers: {
        first_name: string
        last_name: string | null
    } | null
    vehicles: {
        brand: string
        model: string
        plate: string
    } | null
    service_items: {
        unit_price: number
        quantity: number
    }[]
}

export default async function ServicesPage() {
    const supabase = await createClient()

    // Supabase'den servis kayıtlarını, müşteri, araç ve kalem ilişkilerini çekiyoruz
    const { data } = await supabase
        .from('service_records')
        .select('*, customers(first_name, last_name), vehicles(brand, model, plate), service_items(unit_price, quantity)')
        .order('created_at', { ascending: false })

    const services = data as unknown as ServiceRecord[] | null

    return (
        <div className="space-y-6">
            {/* Sayfa Üst Bilgisi ve Aksiyonlar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Servis Kayıtları</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Tüm araç bakım, onarım ve operasyon süreçlerini buradan yönetin.
                    </p>
                </div>

                <NewServiceDialog />
            </div>

            {/* Tablo Alanı */}
            {services && services.length > 0 ? (
                <ServicesTable services={services} />
            ) : (
                <EmptyState
                    iconName="file-text"
                    title="Servis Kaydı Bulunamadı"
                    description="Henüz hiçbir servis kaydı/iş emri oluşturulmamış. Yeni bir kayıt ekleyerek başlayın."
                />
            )}
        </div>
    )
}