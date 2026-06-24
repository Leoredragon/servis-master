import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch (error) {
                        // Bu hata Server Component'lerden cookie set edilmeye çalışıldığında fırlatılır.
                        // Middleware üzerinden session yenilemesi yaptığımızda bu hatayı görmezden gelebiliriz.
                    }
                },
            },
        }
    )
}

export function createAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function getCompanyId() {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
        return { success: false, message: 'Yetkilendirme hatası: Kullanıcı oturumu bulunamadı.' }
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

    if (profileError || !profile?.company_id) {
        return { success: false, message: 'Yetkilendirme hatası: Şirket bilgisi bulunamadı.' }
    }

    return { success: true, companyId: profile.company_id }
}