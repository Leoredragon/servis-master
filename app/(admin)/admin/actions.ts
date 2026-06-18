'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

// 1. Kullanıcının paket bilgisini güncelle
export async function updateUserPackageAction(userId: string, packageName: string) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('profiles')
        .update({ package_name: packageName })
        .eq('id', userId)

    if (error) {
        throw new Error('Paket güncellenirken hata oluştu: ' + error.message)
    }

    revalidatePath('/admin')
    return { success: true }
}

// 2. Kullanıcı üyelik durumunu güncelle (Aktif / Askıda)
export async function updateUserStatusAction(userId: string, status: string) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('profiles')
        .update({ status: status })
        .eq('id', userId)

    if (error) {
        throw new Error('Kullanıcı durumu güncellenirken hata oluştu: ' + error.message)
    }

    revalidatePath('/admin')
    return { success: true }
}

// 3. Kullanıcı rolünü güncelle (Admin / User)
export async function updateUserRoleAction(userId: string, role: string) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('profiles')
        .update({ role: role })
        .eq('id', userId)

    if (error) {
        throw new Error('Kullanıcı rolü güncellenirken hata oluştu: ' + error.message)
    }

    revalidatePath('/admin')
    return { success: true }
}

// 4. Kullanıcı şifresini doğrudan sıfırla (Admin yetkisiyle)
export async function resetUserPasswordAction(userId: string, newPassword: string) {
    const supabase = createAdminClient()

    const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
    )

    if (error) {
        throw new Error('Şifre sıfırlanırken hata oluştu: ' + error.message)
    }

    revalidatePath('/admin')
    return { success: true }
}

// 5. Kullanıcıyı sistemden ve Auth modülünden tamamen sil
export async function deleteUserAction(userId: string) {
    const supabase = createAdminClient()

    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
        throw new Error('Kullanıcı silinirken hata oluştu: ' + error.message)
    }

    revalidatePath('/admin')
    return { success: true }
}
