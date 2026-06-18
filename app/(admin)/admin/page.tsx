import { createAdminClient } from "@/lib/supabase/server"
import AdminClientPage from "./AdminClientPage"

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
    const supabase = createAdminClient()

    // Fetch all profiles from public.profiles ordered by registration date
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl space-y-2">
                <h2 className="text-lg font-bold">Veri Yükleme Hatası</h2>
                <p className="text-sm">Profiles tablosu yüklenemedi. Lütfen önce SQL Editor üzerinde şema betiğini çalıştırın.</p>
                <div className="text-xs bg-red-100 p-3 rounded-md font-mono mt-4">
                    {error.message}
                </div>
            </div>
        )
    }

    return (
        <AdminClientPage initialProfiles={profiles || []} />
    )
}
