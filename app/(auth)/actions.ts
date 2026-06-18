'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        // Hata durumunda URL'e parametre ekleyerek geri döndürüyoruz
        return redirect('/login?message=E-posta veya şifre hatalı')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard') // Başarılı girişte panele yönlendir
}

export async function register(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName, // Supabase user metadata içine ad soyad ekliyoruz
            }
        }
    })

    if (error) {
        return redirect('/register?message=Kayıt işlemi başarısız. Lütfen tekrar deneyin.')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard') // Başarılı kayıtta panele yönlendir
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}