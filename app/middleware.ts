import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    // Varsayılan yanıt objesini oluştur
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Middleware içinde çalışacak Supabase client'ı
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

    // Mevcut kullanıcının oturum durumunu kontrol et
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const currentPath = request.nextUrl.pathname
    const isAuthRoute = currentPath.startsWith('/login') || currentPath.startsWith('/register')

    // Kural 1: Kullanıcı YOKSA ve yetki gerektiren bir sayfadaysa Login'e gönder
    if (!user && !isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Kural 2: Kullanıcı VARSA ve Login/Register sayfasına gitmeye çalışıyorsa Ana Sayfaya gönder
    if (user && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

// Middleware'in çalışacağı rotaları (URL'leri) belirliyoruz
export const config = {
    matcher: [
        /*
         * Aşağıdaki yollar hariç tüm sayfalarda middleware çalışır:
         * - _next/static (statik dosyalar)
         * - _next/image (optimize edilmiş görseller)
         * - favicon.ico vb.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}