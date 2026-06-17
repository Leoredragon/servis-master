import { Car, CheckCircle2, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function RecentActivities() {
  const supabase = await createClient()
  
  // En son eklenen 4 aracı veritabanından çekiyoruz
  const { data: recentVehicles } = await supabase
    .from('vehicles')
    .select('*, customers(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(4)

  return (
    <div className="space-y-6">
      {recentVehicles && recentVehicles.length > 0 ? (
        recentVehicles.map((vehicle: any) => (
          <div key={vehicle.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                <Car className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {vehicle.customers?.first_name} {vehicle.customers?.last_name}
                </p>
                <p className="text-xs text-zinc-500">{vehicle.plate}</p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-zinc-400 text-center py-4">Henüz aktivite bulunmuyor.</p>
      )}
    </div>
  )
}