'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

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
    const companyName = formData.get('companyName') as string

    if (!companyName || !fullName) {
        return redirect('/register?message=Ad Soyad ve Şirket/Servis Adı zorunludur.')
    }

    const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName, // Supabase user metadata içine ad soyad ekliyoruz
            }
        }
    })

    if (error) {
        return redirect('/register?message=Kayıt işlemi başarısız. Detay: ' + error.message)
    }

    if (authData.user) {
        // Service Role client'ı kullan (Bypass RLS)
        const adminSupabase = createAdminClient()

        // 1. Şirketi oluştur
        const { data: company, error: companyError } = await adminSupabase
            .from('companies')
            .insert([{ name: companyName }])
            .select()
            .single()

        if (companyError) {
             console.error("Şirket oluşturulamadı:", companyError)
             return redirect('/register?message=Hesap açıldı ancak şirket oluşturulamadı.')
        }

        // 2. Profili güncelle veya ekle
        const { error: profileError } = await adminSupabase
            .from('profiles')
            .upsert({
                id: authData.user.id,
                email: email,
                full_name: fullName,
                company_id: company.id,
                role: 'admin', // İlk kayıt olan admin'dir
                package_name: 'Başlangıç',
                status: 'active'
            })

        if (profileError) {
            console.error("Profil güncellenemedi:", profileError)
            return redirect('/register?message=Hesap açıldı ancak profil yapılandırılamadı.')
        }
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