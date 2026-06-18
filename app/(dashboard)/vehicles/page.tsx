import NewVehicleDialog from "@/components/vehicles/NewVehicleDialog"
import VehiclesTable from "@/components/vehicles/VehiclesTable"
import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/ui/empty-state"
import { Suspense } from "react"

interface Vehicle {
    id: string
    plate: string
    brand: string
    model: string
    year: number | null
    mileage: number
    chassis_number: string | null
    engine_number: string | null
    notes: string | null
    customers: {
        first_name: string
        last_name: string | null
    } | null
}

export default async function VehiclesPage() {
    const supabase = await createClient()

    // Supabase'den araçları ve müşteri ilişkisini çekiyoruz (created_at DESC sıralı ve silinmemişler)
    const { data } = await supabase
        .from('vehicles')
        .select('*, customers(first_name, last_name)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

    const vehicles = data as unknown as Vehicle[] | null

    return (
        <div className="space-y-6">
            {/* Sayfa Üst Bilgisi ve Aksiyonlar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Araçlar</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Müşterilerinize ait kayıtlı tüm araçları, teknik detayları ve kilometre geçmişlerini takip edin.
                    </p>
                </div>

                <NewVehicleDialog />
            </div>

            {/* Tablo Alanı */}
            {vehicles && vehicles.length > 0 ? (
                <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Araçlar yükleniyor...</div>}>
                    <VehiclesTable vehicles={vehicles} />
                </Suspense>
            ) : (
                <EmptyState
                    iconName="car"
                    title="Araç Bulunamadı"
                    description="Henüz hiçbir araç kaydı yapılmamış. Servis süreçlerini takip etmek için bir araç ekleyin."
                />
            )}
        </div>
    )
}