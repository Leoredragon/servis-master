"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <aside style={{
        width: '260px',
        background: 'linear-gradient(180deg, #4c0519 0%, #0f172a 100%)', // Koyu kırmızı ve lacivert
        color: '#fff',
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '1px', margin: 0 }}>SaaS ADMIN</h2>
          <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '4px', letterSpacing: '2px' }}>SUPERUSER PANEL</div>
        </div>
        
        <nav style={{ padding: '20px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link href="/admin" style={{ display: 'flex', padding: '12px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f8fafc', textDecoration: 'none', fontWeight: 700, alignItems: 'center', gap: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Sistem Yönetimi
          </Link>
          <Link href="/" style={{ display: 'flex', padding: '12px 16px', borderRadius: '10px', color: '#cbd5e1', textDecoration: 'none', fontWeight: 600, alignItems: 'center', gap: '12px', marginTop: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Uygulamaya Dön
          </Link>
        </nav>

        <div style={{ padding: '20px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleSignOut} style={{ width: '100%', padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '0', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
