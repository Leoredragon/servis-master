"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasModuleAccess } from '../lib/auth'

export default function ModulGuard({ modulKodu, children }: { modulKodu: string, children: React.ReactNode }) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function check() {
      try {
        const userPkgStr = localStorage.getItem('sm_tenant_info')
        if (userPkgStr) {
          const info = JSON.parse(userPkgStr)
          
          if (info?.rol === 'admin') {
            // Admin paneli veya temel kısımlar hep açık
            // Ancak modül bazlı yetkiler firmaya aittir, eğer paket_izinleri'nde yoksa admin de görememeli
            const izin = info?.izinler?.find((i: any) => i.modul_kodu === modulKodu)
            if (izin) {
              setHasAccess(izin.aktif)
              return
            }
          } else {
            const izin = info?.izinler?.find((i: any) => i.modul_kodu === modulKodu)
            if (izin) {
              setHasAccess(izin.aktif)
              return
            }
          }
        }
        
        // localStorage'da yoksa API çağrısı yapalım
        const session = await supabase.auth.getSession()
        if (session.data.session?.user) {
          const { data: { user } } = session.data.session
          const remoteInfo = await getTenantInfo(user.id)
          if (remoteInfo) {
             localStorage.setItem('sm_tenant_info', JSON.stringify(remoteInfo))
             const izin = remoteInfo.izinler?.find((i: any) => i.modul_kodu === modulKodu)
             setHasAccess(izin ? izin.aktif : false)
             return
          }
        }
        
        setHasAccess(false)
      } catch (err) {
        setHasAccess(false)
      }
    }
    check()
  }, [modulKodu])

  if (hasAccess === null) return (
     <div style={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '20px', color: '#64748b', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>Yetki Kontrol Ediliyor...</div>
     </div>
  )

  if (!hasAccess) return <KilitliEkran modulKodu={modulKodu} router={router} />
  
  return <>{children}</>
}

function KilitliEkran({ modulKodu, router }: { modulKodu: string, router: any }) {
  return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '40px' }} className="animate-fadeIn">
      <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', maxWidth: '440px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '80px', height: '80px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#ef4444' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Modül Kilitli</h2>
        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
           <code>{modulKodu}</code> modülüne erişebilmek için paketinizde yeterli izin bulunmuyor. Premium pakete geçerek tüm özelliklere anında erişebilirsiniz.
        </p>
        <button onClick={() => router.push('/ayarlar?tab=2')} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(59,130,246,0.3)', transition: 'transform 0.2s' }} onMouseDown={e=>e.currentTarget.style.transform='scale(0.98)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
          Paket Merkezi
        </button>
      </div>
    </div>
  )
}
