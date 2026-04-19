"use client"

import { useState, useEffect, useCallback, Suspense } from 'react'
import { supabase } from '../lib/supabase'
import { useSearchParams } from 'next/navigation'

const Icons = {
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  firm: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 7v14M21 7v14M9 21V11h6v10M2 7l10-4 10 4"/></svg>,
  account: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  save: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  badge: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
}

function AyarlarContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ customers: 0, services: 0, stocks: 0 })
  const [toast, setToast] = useState<any>(null)

  // Form States
  const [userData, setUserData] = useState({ adSoyad: 'Ali Yılmaz', email: '', tel: '0555 000 00 00', kullaniciadi: 'admin', subeadi: 'Merkez' })
  const [password, setPassword] = useState('')
  const [firmData, setFirmData] = useState({ ad: 'Servis Master Pro A.Ş.', vergiNo: '1234567890', vergiDairesi: 'Kadıköy', tel: '0216 111 22 33', adres: 'İstanbul, Türkiye', email: 'info@firma.com', web: 'www.firma.com' })

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load Initial Data
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(parseInt(tab))

    const savedUser = localStorage.getItem('sm_user_data')
    const savedFirm = localStorage.getItem('sm_firm_data')
    if (savedUser) setUserData(JSON.parse(savedUser))
    if (savedFirm) setFirmData(JSON.parse(savedFirm))

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserData(prev => ({ ...prev, email: user.email }))
      }
    })

    fetchStats()
  }, [searchParams])

  const fetchStats = async () => {
    const [c, s, st] = await Promise.all([
      supabase.from('cari_kart').select('*', { count: 'exact', head: true }),
      supabase.from('servis_karti').select('*', { count: 'exact', head: true }),
      supabase.from('stok').select('*', { count: 'exact', head: true })
    ])
    setStats({ customers: c.count || 0, services: s.count || 0, stocks: st.count || 0 })
  }

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const updates: any = {}
    if (userData.email) updates.email = userData.email
    if (password) updates.password = password

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.auth.updateUser(updates)
      if (error) {
        showToast('Kimlik doğrulama ayarları güncellenemedi: ' + error.message, 'error')
        setLoading(false)
        return
      }
    }

    localStorage.setItem('sm_user_data', JSON.stringify(userData))
    showToast('Kullanıcı ayarları başarıyla kaydedildi.')
    if (password) setPassword('')
    setLoading(false)
  }

  const saveFirm = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('sm_firm_data', JSON.stringify(firmData))
    showToast('Firma bilgileri başarıyla kaydedildi.')
  }

  return (
    <div className="animate-fadeIn">
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Ayarlar</h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Sistem ve uygulama tercihlerini buradan yönetebilirsiniz.</p>
      </div>

      {/* Tabs Header */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '32px', paddingBottom: '2px' }}>
        {[
          { id: 0, label: 'Kullanıcı Ayarları', icon: Icons.user },
          { id: 1, label: 'Firma Bilgileri',    icon: Icons.firm },
          { id: 2, label: 'Hesap Bilgileri',    icon: Icons.account }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px',
              border: 'none', background: 'none', cursor: 'pointer', transition: 'all 0.2s',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === tab.id ? '#3b82f6' : '#64748b',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '14px'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn" style={{ maxWidth: '800px' }}>
        {activeTab === 0 && (
          <form onSubmit={saveUser} className="card">
            <div className="card-header">Kullanıcı Bilgileri</div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Ad Soyad</label>
                  <input value={userData.adSoyad} onChange={e => setUserData({...userData, adSoyad: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">E-posta</label>
                  <input type="email" value={userData.email} onChange={e => setUserData({...userData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input value={userData.tel} onChange={e => setUserData({...userData, tel: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Şifre Değiştir</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Değiştirmek istemiyorsanız boş bırakın</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Sistem Kullanıcı Adı</label>
                  <input value={userData.kullaniciadi} onChange={e => setUserData({...userData, kullaniciadi: e.target.value})} />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Kayıtlarda görünen isim</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Şube Adı</label>
                  <input value={userData.subeadi} onChange={e => setUserData({...userData, subeadi: e.target.value})} />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Merkez, Şube vb.</span>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '12px', alignSelf: 'flex-start' }}>
                {Icons.save} Değişiklikleri Kaydet
              </button>
            </div>
          </form>
        )}

        {activeTab === 1 && (
          <form onSubmit={saveFirm} className="card">
            <div className="card-header">Firma Profili</div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '16px', background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '11px', textAlign: 'center', padding: '10px' }}>
                  Logo Yükle
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>Firma Logosu</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Önerilen: 500x500px, PNG veya JPG.</div>
                  <button type="button" className="btn-secondary" style={{ marginTop: '10px', fontSize: '12px' }}>Dosya Seç</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Firma Adı</label>
                  <input value={firmData.ad} onChange={e => setFirmData({...firmData, ad: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vergi No</label>
                  <input value={firmData.vergiNo} onChange={e => setFirmData({...firmData, vergiNo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vergi Dairesi</label>
                  <input value={firmData.vergiDairesi} onChange={e => setFirmData({...firmData, vergiDairesi: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input value={firmData.tel} onChange={e => setFirmData({...firmData, tel: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">E-posta</label>
                  <input value={firmData.email} onChange={e => setFirmData({...firmData, email: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Adres</label>
                  <textarea value={firmData.adres} onChange={e => setFirmData({...firmData, adres: e.target.value})} style={{ minHeight: '80px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Web Sitesi</label>
                  <input value={firmData.web} onChange={e => setFirmData({...firmData, web: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '12px', alignSelf: 'flex-start' }}>
                {Icons.save} Firma Bilgilerini Kaydet
              </button>
            </div>
          </form>
        )}

        {activeTab === 2 && (
          <div className="card">
            <div className="card-header">Hesap ve Yazılım Bilgileri</div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '16px', color: '#fff', marginBottom: '32px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>Mevcut Paket</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px' }}>Servis Master Pro</div>
                </div>
                <div style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '8px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 800, border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icons.badge}
                  PREMIUM
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Kullanım İstatistikleri</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Toplam Müşteri</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{stats.customers}</div>
                  </div>
                  <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Toplam Servis</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{stats.services}</div>
                  </div>
                  <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Stok Kalemi</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{stats.stocks}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Veritabanı</span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>Supabase Cloud (PostgreSQL)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Sistem Versiyonu</span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>v1.0.4 - Kararlı</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Lisans Durumu</span>
                    <span style={{ color: '#059669', fontWeight: 800 }}>Ömür Boyu - Aktif</span>
                  </div>
                </div>
                <button className="btn-secondary" style={{ width: '100%', marginTop: '24px', height: '48px', fontWeight: 700 }}>
                   Teknik Destek Al
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Ayarlar() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <AyarlarContent />
    </Suspense>
  )
}
