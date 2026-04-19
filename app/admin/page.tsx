"use client"

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { MODULLER } from '../lib/permissions'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [kullanicilar, setKullanicilar] = useState<any[]>([])
  const [paketler, setPaketler] = useState<any[]>([])
  const [paketIzinleri, setPaketIzinleri] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  async function checkAdminAndFetch() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/login')

      const { data: tenant } = await supabase.from('firma_kullanicilari').select('rol').eq('user_id', session.user.id).single()
      
      if (tenant?.rol !== 'admin') {
        return router.push('/')
      }

      await Promise.all([
        fetchFirmalar(),
        fetchKullanicilar(),
        fetchPaketler()
      ])
      
      setLoading(false)
    } catch (e) {
      router.push('/')
    }
  }

  async function fetchFirmalar() {
    const { data } = await supabase.from('firmalar').select('*, paketler(paket_adi, fiyat)')
    if (data) setFirmalar(data)
  }

  async function fetchKullanicilar() {
    const { data } = await supabase.from('firma_kullanicilari').select('*, firmalar(firma_adi)')
    if (data) setKullanicilar(data)
  }

  async function fetchPaketler() {
    const { data: pData } = await supabase.from('paketler').select('*')
    if (pData) setPaketler(pData)

    const { data: iData } = await supabase.from('paket_izinleri').select('*')
    if (iData) setPaketIzinleri(iData)
  }

  // --- KPI Hesaplamaları ---
  const totalFirma = firmalar.length
  const activeFirma = firmalar.filter(f => f.aktif).length
  const monthlyRevenue = firmalar.filter(f => f.aktif).reduce((acc, f) => acc + (f.paketler?.fiyat || 0), 0)
  const totalUsers = kullanicilar.length

  if (loading) {
     return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#0f172a', fontWeight: 800, animation: 'pulse 2s infinite' }}>SaaS Admin Yükleniyor...</div>
     </div>
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui' }} className="animate-fadeIn">
       <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', margin: '0 0 8px 0' }}>Merkezi Yönetim</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>Tüm firmaları, paketleri ve lisansları tek ekrandan yönetin.</p>
          </div>
       </div>

       {/* --- KPI KARTLARI --- */}
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <KPICard title="Toplam Firma" value={totalFirma} icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" color="#3b82f6" />
          <KPICard title="Aktif Abonelik" value={activeFirma} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="#10b981" />
          <KPICard title="Tahmini Aylık Gelir" value={`₺${monthlyRevenue.toLocaleString('tr-TR')}`} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="#8b5cf6" />
          <KPICard title="Bağlı Kullanıcılar" value={totalUsers} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" color="#f59e0b" />
       </div>

       {/* --- TAB MENÜ --- */}
       <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
         {['Firmalar', 'Kullanıcılar', 'Abonelik Paketleri'].map((t, i) => (
           <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === i ? '3px solid #0f172a' : '3px solid transparent',
              color: activeTab === i ? '#0f172a' : '#64748b', fontWeight: activeTab === i ? 700 : 500,
              fontSize: '15px', transition: 'all 0.2s'
           }}>
             {t}
           </button>
         ))}
       </div>

       <div className="animate-fadeIn">
         {activeTab === 0 && <FirmalarTab firmalar={firmalar} paketler={paketler} reload={fetchFirmalar} />}
         {activeTab === 1 && <KullanicilarTab kullanicilar={kullanicilar} firmalar={firmalar} reload={() => fetchKullanicilar()} />}
         {activeTab === 2 && <PaketlerTab paketler={paketler} izinler={paketIzinleri} reload={() => fetchPaketler()} />}
       </div>
    </div>
  )
}

function KPICard({ title, value, icon, color }: { title: string, value: string|number, icon: string, color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg>
      </div>
      <div>
        <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        <div style={{ color: '#0f172a', fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{value}</div>
      </div>
    </div>
  )
}

function FirmalarTab({ firmalar, paketler, reload }: any) {
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterPaket, setFilterPaket] = useState('')
  const [filterDurum, setFilterDurum] = useState('')

  const [form, setForm] = useState({ firma_adi: '', paket_id: 1, yetkili: '', email: '', baslangic_tarihi: '', bitis_tarihi: '' })
  
  async function handleSubmit() {
    const tenant_id = form.firma_adi.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now()
    const { error } = await supabase.from('firmalar').insert({ ...form, tenant_id, aktif: true })
    if(!error) { setModalOpen(false); reload() }
  }

  // Bar Chart Data (Son 6 ay)
  const chartData = useMemo(() => {
    const counts: {[key: string]: number} = {}
    firmalar.forEach((f: any) => {
      const d = new Date(f.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      counts[key] = (counts[key] || 0) + 1
    })
    const sortedKeys = Object.keys(counts).sort().slice(-6)
    return sortedKeys.map(k => ({ label: k, value: counts[k] }))
  }, [firmalar])

  const maxChartValue = Math.max(...chartData.map(d => d.value), 1)

  const filtered = firmalar.filter((f: any) => {
    if(search && !f.firma_adi.toLowerCase().includes(search.toLowerCase())) return false
    if(filterPaket && f.paket_id.toString() !== filterPaket) return false
    if(filterDurum !== '') {
       if (filterDurum === '1' && !f.aktif) return false
       if (filterDurum === '0' && f.aktif) return false
    }
    return true
  })

  return (
    <div>
      {/* İstatistik ve Grafik Bölümü */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>Aylık Firma Kayıtları</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '16px', paddingBottom: '10px' }}>
          {chartData.length === 0 ? <div style={{ color: '#94a3b8', fontSize: '14px' }}>Henüz veri yok.</div> : chartData.map((d, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
               <div style={{ color: '#3b82f6', fontWeight: 800, fontSize: '13px' }}>{d.value}</div>
               <div style={{ width: '100%', maxWidth: '40px', background: 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%)', borderRadius: '4px', height: `${(d.value / maxChartValue) * 80}px`, transition: 'height 0.5s' }}></div>
               <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <input type="text" placeholder="Firma Adı Ara..." value={search} onChange={e=>setSearch(e.target.value)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '250px' }} />
          <select value={filterPaket} onChange={e=>setFilterPaket(e.target.value)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}>
            <option value="">Tüm Paketler</option>
            {paketler.map((p:any) => <option key={p.id} value={p.id}>{p.paket_adi}</option>)}
          </select>
          <select value={filterDurum} onChange={e=>setFilterDurum(e.target.value)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}>
            <option value="">Tüm Durumlar</option>
            <option value="1">Aktif</option>
            <option value="0">Pasif</option>
          </select>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ padding: '10px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>+ Yeni Firma</button>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
           <thead>
             <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
               <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>Firma Adı</th>
               <th style={{ color: '#475569', fontWeight: 600 }}>Yetkili</th>
               <th style={{ color: '#475569', fontWeight: 600 }}>Paket</th>
               <th style={{ color: '#475569', fontWeight: 600 }}>Kalan Süre</th>
               <th style={{ color: '#475569', fontWeight: 600 }}>Durum</th>
             </tr>
           </thead>
           <tbody>
             {filtered.map((f:any, i:number) => {
                let kalanGun = 999
                if (f.bitis_tarihi) {
                  kalanGun = Math.ceil((new Date(f.bitis_tarihi).getTime() - new Date().getTime()) / (1000*60*60*24))
                }
                const isCritical = kalanGun <= 7 && f.aktif
                return (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: isCritical ? '#fef2f2' : 'transparent' }}>
                   <td style={{ padding: '16px 24px' }}>
                     <div style={{ fontWeight: 700, color: '#0f172a' }}>{f.firma_adi}</div>
                     <div style={{ fontSize: '12px', color: '#64748b' }}>{f.tenant_id}</div>
                   </td>
                   <td style={{ color: '#475569' }}>
                     <div style={{ fontWeight: 500 }}>{f.yetkili}</div>
                     <div style={{ fontSize: '12px', color: '#94a3b8' }}>{f.email}</div>
                   </td>
                   <td><span style={{ background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>{f.paketler?.paket_adi}</span></td>
                   <td>
                     {f.bitis_tarihi ? (
                        <span style={{ 
                          background: isCritical ? '#ef4444' : '#10b981', 
                          color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 
                        }}>
                          {kalanGun > 0 ? `${kalanGun} Gün Kaldı` : 'Süresi Doldu'}
                        </span>
                     ) : <span style={{ color: '#94a3b8' }}>Süresiz</span>}
                   </td>
                   <td>
                     <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.aktif ? '#10b981' : '#ef4444' }}></span>
                       <span style={{ fontWeight: 600, color: f.aktif ? '#059669' : '#dc2626' }}>{f.aktif ? 'Aktif' : 'Pasif'}</span>
                     </span>
                   </td>
                </tr>
                )
             })}
             {filtered.length === 0 && <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Firma bulunamadı.</td></tr>}
           </tbody>
        </table>
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
           <div style={{ background: '#fff', padding: '32px', borderRadius: '24px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} className="animate-fadeIn">
             <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 800 }}>Yeni Firma Oluştur</h3>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input placeholder="Firma Adı" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} onChange={e=>setForm({...form, firma_adi: e.target.value})} />
                <input placeholder="Yetkili Ad Soyad" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} onChange={e=>setForm({...form, yetkili: e.target.value})} />
                <input placeholder="E-Posta" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} onChange={e=>setForm({...form, email: e.target.value})} />
                <select style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} onChange={e=>setForm({...form, paket_id: parseInt(e.target.value)})}>
                    {paketler.map((p:any) => <option key={p.id} value={p.id}>{p.paket_adi}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input type="date" title="Başlangıç" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} onChange={e=>setForm({...form, baslangic_tarihi: e.target.value})} />
                  <input type="date" title="Bitiş" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} onChange={e=>setForm({...form, bitis_tarihi: e.target.value})} />
                </div>
             </div>

             <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>İptal</button>
                <button onClick={handleSubmit} style={{ flex: 1, padding: '12px', background: '#3b82f6', border: 'none', borderRadius: '10px', fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>Kaydet</button>
             </div>
           </div>
        </div>
      )}
    </div>
  )
}

function KullanicilarTab({ kullanicilar, firmalar, reload }: any) {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', firmaId: 1, rol: 'kullanici' })
  const [msg, setMsg] = useState('')

  async function handleCreate() {
     setMsg('Oluşturuluyor...')
     const res = await fetch('/api/admin/create-user', {
        method: 'POST', body: JSON.stringify(form)
     })
     const out = await res.json()
     if (out.success) { setModal(false); reload(); setMsg('') }
     else setMsg(out.error)
  }

  return (
    <div>
       <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button onClick={() => setModal(true)} style={{ padding: '10px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>+ Yeni Kullanıcı</button>
       </div>
       <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
             <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
               <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>Auth UID</th>
               <th style={{ color: '#475569', fontWeight: 600 }}>Bağlı Firma</th>
               <th style={{ color: '#475569', fontWeight: 600 }}>Rol</th>
               <th style={{ color: '#475569', fontWeight: 600 }}>Durum</th>
             </tr></thead>
             <tbody>
                {kullanicilar.map((k:any, i:number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>{k.user_id}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{k.firmalar?.firma_adi}</td>
                    <td>{k.rol === 'admin' ? <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, fontSize:'12px' }}>Yönetici</span> : <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, fontSize:'12px' }}>Kullanıcı</span>}</td>
                    <td>{k.aktif ? <span style={{ color: '#10b981', fontWeight: 600 }}>Aktif</span> : <span style={{ color: '#ef4444', fontWeight: 600 }}>Pasif</span>}</td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>

       {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
             <div style={{ background: '#fff', padding: '32px', borderRadius: '24px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} className="animate-fadeIn">
               <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 800 }}>Yeni Kullanıcı Kimliği</h3>
               <p style={{ fontSize: '13px', color: '#ef4444', minHeight: '18px', margin: '0 0 16px 0' }}>{msg}</p>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input placeholder="E-Posta (Servis Master ID)" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} onChange={e=>setForm({...form, email: e.target.value})} />
                  <input placeholder="Şifre" type="password" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} onChange={e=>setForm({...form, password: e.target.value})} />
                  <select style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} onChange={e=>setForm({...form, firmaId: parseInt(e.target.value)})}>
                    <option value={0} disabled selected>Bağlanacak Firmayı Seçin</option>
                    {firmalar.map((f:any) => <option key={f.id} value={f.id}>{f.firma_adi}</option>)}
                  </select>
                  <select style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} onChange={e=>setForm({...form, rol: e.target.value})}>
                    <option value="kullanici">Personel / Kullanıcı</option>
                    <option value="admin">Firma Yöneticisi</option>
                  </select>
               </div>

               <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button onClick={() => setModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>İptal</button>
                  <button onClick={handleCreate} style={{ flex: 1, padding: '12px', background: '#3b82f6', border: 'none', borderRadius: '10px', fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>Oluştur</button>
               </div>
             </div>
          </div>
       )}
    </div>
  )
}

function PaketlerTab({ paketler, izinler, reload }: any) {
  
  const allModules = Object.values(MODULLER)

  async function handleToggle(paketId: number, modulKodu: string, current: boolean) {
     const nextState = !current
     // paket_izinleri'nde varsa upsert yap
     const { error } = await supabase.from('paket_izinleri').upsert({
        paket_id: paketId,
        modul_kodu: modulKodu,
        aktif: nextState
     }, { onConflict: 'paket_id, modul_kodu' })
     
     if (!error) reload()
  }

  return (
     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {paketler.map((p:any) => (
          <div key={p.id} style={{ background: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderTop: '4px solid #3b82f6', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>{p.paket_adi}</h3>
             <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '24px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: '#3b82f6' }}>₺{p.fiyat}</span>
                <span style={{ fontSize: '14px', color: '#64748b', marginBottom: '6px' }}>/ay</span>
             </div>
             
             <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#475569', fontSize: '13px' }}>Kullanıcı Limiti:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{p.kullanici_limiti}</span>
             </div>

             <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '12px', fontSize: '14px' }}>Modül İzinleri</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {allModules.map(modul => {
                      const izinRecord = izinler.find((i:any) => i.paket_id === p.id && i.modul_kodu === modul)
                      const isAuth = izinRecord ? izinRecord.aktif : false

                      return (
                        <div key={modul} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>{modul}</span>
                           
                           {/* Toggle Switch */}
                           <div 
                              onClick={() => handleToggle(p.id, modul, isAuth)}
                              style={{
                                width: '36px', height: '20px', borderRadius: '20px',
                                background: isAuth ? '#10b981' : '#cbd5e1', position: 'relative', cursor: 'pointer',
                                transition: 'background 0.3s'
                              }}
                           >
                              <div style={{
                                 width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                                 position: 'absolute', top: '2px', left: isAuth ? '18px' : '2px',
                                 transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }} />
                           </div>
                        </div>
                      )
                   })}
                </div>
             </div>
          </div>
        ))}
     </div>
  )
}
