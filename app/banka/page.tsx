"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BankaRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Esnaf dostu tek sayfa mimarisi gereği tüm banka işlemleri Kasa sayfasına taşınmıştır.
    router.replace('/kasa')
  }, [router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ marginBottom: '16px' }}></div>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Hesaplara yönlendiriliyorsunuz...</p>
      </div>
      <style>{`
        .spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
