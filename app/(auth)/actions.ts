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

export async function demoLoginAction() {
    const supabase = await createClient()

    const DEMO_EMAIL = 'demo@servismaster.app'
    const DEMO_PASSWORD = 'Demo123456!'

    // Önce kayıt olmayı dene — zaten varsa hatayı yoksay
    try {
        await supabase.auth.signUp({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
            options: {
                data: { full_name: 'Demo Kullanıcı' }
            }
        })
    } catch {
        // Zaten kayıtlı ise sessizce geç
    }

    // Şimdi giriş yap
    const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
    })

    if (error) {
        return redirect('/login?message=Demo hesabı şu an kullanılamıyor. Lütfen Supabase email onayını kapatın.')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}