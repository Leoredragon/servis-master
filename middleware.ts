import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Merkezi Supabase middleware fonksiyonunu çağırıyoruz
    // Bu sayede çerezler yenilenecek ve rotalar korunacak.
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Aşağıdaki dosya yolları hariç tüm isteklerde middleware'i çalıştır:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt vb. (static assets)
         * - public altındaki dosyalar (.png, .svg vb.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
