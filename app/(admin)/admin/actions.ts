'use server'

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// 1. Yeni Şirket ve İlk Admin Kullanıcısını Oluştur
export async function adminCreateCompanyWithUser(formData: FormData) {
    const adminSupabase = createAdminClient()

    const companyName = formData.get('companyName') as string
    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
        // Auth sisteminde kullanıcıyı doğrulanmış olarak oluştur
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        })

        if (authError) throw authError

        // Şirketi oluştur
        const { data: company, error: companyError } = await adminSupabase
            .from('companies')
            .insert([{ name: companyName }])
            .select()
            .single()

        if (companyError) throw companyError

        // Kullanıcı profilini "admin" (tenant admin) olarak oluştur ve şirkete bağla
        const { error: profileError } = await adminSupabase
            .from('profiles')
            .upsert({
                id: authData.user.id,
                email: email,
                full_name: fullName,
                company_id: company.id,
                role: 'admin',
                package_name: 'Başlangıç',
                status: 'active'
            })

        if (profileError) throw profileError

        revalidatePath('/admin')
        return { success: true }
    } catch (error: any) {
        console.error("Admin şirket oluşturma hatası:", error)
        return { success: false, message: error.message }
    }
}

// 2. Şirket Durumunu Değiştir (Aktif / Askıya Alındı)
export async function adminUpdateCompanyStatus(companyId: string, status: string) {
    const adminSupabase = createAdminClient()
    
    // Şirkete ait yöneticinin profil status'ünü güncelliyoruz
    const { error } = await adminSupabase
        .from('profiles')
        .update({ status: status })
        .eq('company_id', companyId)
        .eq('role', 'admin')

    if (error) return { success: false, message: error.message }

    revalidatePath('/admin')
    return { success: true }
}

// 3. Şirket Adını Düzenle
export async function adminUpdateCompanyName(companyId: string, newName: string) {
    const adminSupabase = createAdminClient()
    
    const { error } = await adminSupabase
        .from('companies')
        .update({ name: newName })
        .eq('id', companyId)

    if (error) return { success: false, message: error.message }

    revalidatePath('/admin')
    return { success: true }
}

// 4. Şirketi Kalıcı Olarak Sil (Cascade)
export async function adminDeleteCompany(companyId: string) {
    const adminSupabase = createAdminClient()
    
    // Not: Veritabanınızda ON DELETE CASCADE varsa, company silindiğinde her şey silinir.
    const { error } = await adminSupabase
        .from('companies')
        .delete()
        .eq('id', companyId)

    if (error) return { success: false, message: error.message }

    revalidatePath('/admin')
    return { success: true }
}
