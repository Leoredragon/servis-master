import { redirect } from "next/navigation"
import AdminClientPage from "./AdminClientPage"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { Building2, Users, Activity, LayoutDashboard } from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function SuperAdminPage() {
    const supabase = await createClient()

    // 1. Yetki Kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        redirect('/dashboard')
    }

    // 2. Platform Metriklerini Çekme
    const adminClient = createAdminClient()

    // Toplam Şirket Sayısı
    const { count: companyCount } = await adminClient
        .from('companies')
        .select('*', { count: 'exact', head: true })

    // Toplam Sistem Kullanıcısı
    const { count: userCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    // Son 7 Günde Açılan Servis Kaydı
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentServiceCount } = await adminClient
        .from('service_records')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())

    // En Son Kayıt Olan Şirketler (SaaS Gözetimi)
    // Şirket tablosunda kurucuyu bulmak için profiles tablosuyla join yapıyoruz (role = admin veya user)
    const { data: recentCompanies } = await adminClient
        .from('companies')
        .select(`
            id,
            name,
            created_at,
            profiles (
                email,
                role,
                status
            )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

    // Format companies for table
    const formattedCompanies = recentCompanies?.map(company => {
        // Şirketin ilk kullanıcısını (genelde admin veya ilk user) bul
        const founder = Array.isArray(company.profiles) && company.profiles.length > 0
            ? company.profiles[0] 
            : null
            
        return {
            id: company.id,
            name: company.name,
            createdAt: new Date(company.created_at).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            founderEmail: founder?.email || 'Bilinmiyor',
            status: founder?.status === 'passive' ? 'Askıya Alındı' : 'Aktif'
        }
    }) || []

    return (
        <div className="min-h-screen bg-zinc-50/50 pb-12">
            {/* Header Area */}
            <div className="bg-white border-b border-zinc-200 px-8 py-8 mb-8">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 flex items-center gap-3">
                            <LayoutDashboard className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
                            Platform Kontrol Kulesi
                        </h1>
                        <p className="text-zinc-500 mt-2 text-sm">
                            Servis Master platformunun genel performansını ve aktif kullanıcı havuzunu yönetin.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 space-y-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-zinc-200 shadow-none rounded-xl bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-500">
                                Toplam Aktif Servis
                            </CardTitle>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Building2 className="w-4 h-4 text-blue-600" strokeWidth={2} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-zinc-900">{companyCount || 0}</div>
                            <p className="text-xs text-zinc-500 mt-1">Platformdaki kayıtlı tüm tenant'lar</p>
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-200 shadow-none rounded-xl bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-500">
                                Toplam Kullanıcı
                            </CardTitle>
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Users className="w-4 h-4 text-indigo-600" strokeWidth={2} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-zinc-900">{userCount || 0}</div>
                            <p className="text-xs text-zinc-500 mt-1">Sistemdeki tüm bireysel hesaplar</p>
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-200 shadow-none rounded-xl bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-500">
                                Sistem Aktivitesi
                            </CardTitle>
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <Activity className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-zinc-900">{recentServiceCount || 0}</div>
                            <p className="text-xs text-zinc-500 mt-1">Son 7 günde açılan servis fişi</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Companies Table Client Component */}
                <AdminClientPage formattedCompanies={formattedCompanies} />
            </div>
        </div>
    )
}
