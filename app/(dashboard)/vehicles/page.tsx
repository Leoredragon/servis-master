import NewVehicleDialog from "@/components/vehicles/NewVehicleDialog"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { MoreHorizontal, Bike, Car } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/ui/empty-state"

export default async function VehiclesPage() {
    const supabase = await createClient()

    // Supabase'den araçları ve müşteri ilişkisini çekiyoruz
    const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*, customers(first_name, last_name)')
        .order('created_at', { ascending: false })

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
                <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-50/50">
                            <TableRow>
                                <TableHead className="w-[80px] font-medium">Görsel</TableHead>
                                <TableHead className="w-[120px] font-medium">Plaka</TableHead>
                                <TableHead className="font-medium">Marka / Model</TableHead>
                                <TableHead className="font-medium">Yıl</TableHead>
                                <TableHead className="font-medium">Araç Sahibi</TableHead>
                                <TableHead className="font-medium">Mevcut KM</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vehicles.map((vehicle) => (
                                <TableRow key={vehicle.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <TableCell>
                                        <div className="h-8 w-8 rounded bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-500">
                                            <Bike className="w-4 h-4" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-zinc-900 tracking-wide">{vehicle.plate}</TableCell>
                                    <TableCell className="font-medium">{vehicle.brand} {vehicle.model}</TableCell>
                                    <TableCell className="text-zinc-500">{vehicle.year}</TableCell>
                                    <TableCell className="text-zinc-500">
                                        {vehicle.customers ? `${vehicle.customers.first_name} ${vehicle.customers.last_name}` : 'Bilinmeyen Müşteri'}
                                    </TableCell>
                                    <TableCell className="text-zinc-600 font-medium">{vehicle.mileage} KM</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-600">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
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