import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Token yenileme ve oturum durumunu alma işlemi
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()

    // Korumalı Rotalar (Protected Routes)
    // Eğer kullanıcı giriş yapmamışsa ve dashboard'a gitmeye çalışıyorsa login sayfasına yönlendir.
    if (!user && url.pathname.startsWith('/dashboard')) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Auth Rotaları
    // Eğer kullanıcı zaten giriş yapmışsa, login/register sayfalarına gitmesini engelle ve panele yönlendir.
    if (user && (url.pathname === '/login' || url.pathname === '/register')) {
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
