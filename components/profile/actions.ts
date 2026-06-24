'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfileAction(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, message: 'Oturum bulunamadı' }
    }

    const fullName = formData.get('fullName') as string

    // Update in profiles table
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

    if (profileError) {
        return { success: false, message: profileError.message }
    }

    // Update in auth.users user_metadata (optional but good practice)
    await supabase.auth.updateUser({
        data: { full_name: fullName }
    })

    revalidatePath('/profile')
    return { success: true, message: 'Profil başarıyla güncellendi!' }
}
