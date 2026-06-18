import { redirect } from 'next/navigation'

// Bu sayfa artık /dashboard adresine taşındı.
// Eski / yolu için yönlendirme sağlanıyor.
export default function OldDashboardRedirectPage() {
    redirect('/dashboard')
}