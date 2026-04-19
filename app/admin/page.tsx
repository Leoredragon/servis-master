"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [kullanicilar, setKullanicilar] = useState<any[]>([])
  const [paketler, setPaketler] = useState<any[]>([])
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
    const { data } = await supabase.from('firmalar').select('*, paketler(paket_adi)')
    if (data) setFirmalar(data)
  }

  async function fetchKullanicilar() {
    const { data } = await supabase.from('firma_kullanicilari').select('*, firmalar(firma_adi)')
    if (data) setKullanicilar(data) // Wait: to show emails we need to join auth.users securely or api route. However we can show the basic details. 
  }

  async function fetchPaketler() {
    const { data } = await supabase.from('paketler').select('*')
    if (data) setPaketler(data)
  }

  if (loading) {
     return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#0f172a', fontWeight: 800 }}>Admin Paneli Yükleniyor...</div>
     </div>
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
       <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>Merkezi Yönetim (SaaS)</h1>
          <p style={{ color: '#64748b' }}>Sistemdeki tüm firmaları, paketleri ve lisansları buradan yönetin.</p>
       </div>

       <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
         {['Firmalar', 'Kullanıcılar', 'Abonelik Paketleri'].map((t, i) => (
           <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === i ? '3px solid #3b82f6' : '3px solid transparent',
              color: activeTab === i ? '#3b82f6' : '#64748b', fontWeight: activeTab === i ? 800 : 600,
           }}>
             {t}
           </button>
         ))}
       </div>

       <div className="animate-fadeIn">
         {activeTab === 0 && <FirmalarTab firmalar={firmalar} paketler={paketler} reload={fetchFirmalar} />}
         {activeTab === 1 && <KullanicilarTab kullanicilar={kullanicilar} firmalar={firmalar} reload={fetchKullanicilar} />}
         {activeTab === 2 && <PaketlerTab paketler={paketler} reload={fetchPaketler} />}
       </div>
    </div>
  )
}

function FirmalarTab({ firmalar, paketler, reload }: any) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ firma_adi: '', paket_id: 1, yetkili: '', email: '' })
  
  async function handleSubmit() {
    const tenant_id = form.firma_adi.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    const { error } = await supabase.from('firmalar').insert({ ...form, tenant_id, aktif: true })
    if(!error) { setModalOpen(false); reload() }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={() => setModalOpen(true)} className="btn-primary" style={{ padding: '10px 16px' }}>+ Yeni Firma</button>
      </div>
      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
           <thead>
             <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
               <th style={{ padding: '16px' }}>Firma Adı</th>
               <th>Yetkili</th>
               <th>Paket</th>
               <th>Tenant ID</th>
               <th>Durum</th>
             </tr>
           </thead>
           <tbody>
             {firmalar.map((f:any, i:number) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                   <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{f.firma_adi}</td>
                   <td style={{ color: '#64748b' }}>{f.yetkili}</td>
                   <td><span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>{f.paketler?.paket_adi}</span></td>
                   <td style={{ color: '#94a3b8', fontSize: '12px' }}>{f.tenant_id}</td>
                   <td>{f.aktif ? <span style={{ color: '#16a34a' }}>Aktif</span> : 'Pasif'}</td>
                </tr>
             ))}
           </tbody>
        </table>
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '400px' }}>
             <h3>Yeni Firma Oluştur</h3>
             <input placeholder="Firma Adı" className="login-input" style={{ width:'100%', padding:'10px', marginTop:'10px' }} onChange={e=>setForm({...form, firma_adi: e.target.value})} />
             <input placeholder="Yetkili" className="login-input" style={{ width:'100%', padding:'10px', marginTop:'10px' }} onChange={e=>setForm({...form, yetkili: e.target.value})} />
             <input placeholder="E-Posta" className="login-input" style={{ width:'100%', padding:'10px', marginTop:'10px' }} onChange={e=>setForm({...form, email: e.target.value})} />
             <select style={{ width:'100%', padding:'10px', marginTop:'10px' }} onChange={e=>setForm({...form, paket_id: parseInt(e.target.value)})}>
                 {paketler.map((p:any) => <option key={p.id} value={p.id}>{p.paket_adi}</option>)}
             </select>
             <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '10px' }}>İptal</button>
                <button onClick={handleSubmit} className="btn-primary" style={{ flex: 1, padding: '10px' }}>Kaydet</button>
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
          <button onClick={() => setModal(true)} className="btn-primary" style={{ padding: '10px 16px' }}>+ Yeni Kullanıcı ID Ata</button>
       </div>
       <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
             <thead><tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
               <th style={{ padding: '16px' }}>Auth UID</th><th>Bağlı Firma</th><th>Rol</th><th>Durum</th>
             </tr></thead>
             <tbody>
                {kullanicilar.map((k:any, i:number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{k.user_id}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{k.firmalar?.firma_adi}</td>
                    <td>{k.rol === 'admin' ? 'Yönetici' : 'Kullanıcı'}</td>
                    <td>{k.aktif ? 'Aktif' : 'Pasif'}</td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>

       {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '400px' }}>
               <h3>Yeni Kullanıcı Bağla</h3>
               <p style={{ fontSize: '12px', color: '#ef4444' }}>{msg}</p>
               <input placeholder="E-Posta" className="login-input" style={{ width:'100%', padding:'10px', marginTop:'10px' }} onChange={e=>setForm({...form, email: e.target.value})} />
               <input placeholder="Şifre" type="password" className="login-input" style={{ width:'100%', padding:'10px', marginTop:'10px' }} onChange={e=>setForm({...form, password: e.target.value})} />
               <select style={{ width:'100%', padding:'10px', marginTop:'10px' }} onChange={e=>setForm({...form, firmaId: parseInt(e.target.value)})}>
                 {firmalar.map((f:any) => <option key={f.id} value={f.id}>{f.firma_adi}</option>)}
               </select>
               <select style={{ width:'100%', padding:'10px', marginTop:'10px' }} onChange={e=>setForm({...form, rol: e.target.value})}>
                 <option value="kullanici">Kullanıcı</option>
                 <option value="admin">Yönetici</option>
               </select>
               <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setModal(false)} style={{ flex: 1, padding: '10px' }}>İptal</button>
                  <button onClick={handleCreate} className="btn-primary" style={{ flex: 1, padding: '10px' }}>Oluştur</button>
               </div>
             </div>
          </div>
       )}
    </div>
  )
}

function PaketlerTab({ paketler }: any) {
  return (
     <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
           <thead><tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
             <th style={{ padding: '16px' }}>Paket Adı</th><th>Paket Kodu</th><th>Fiyat</th><th>Kullanıcı Limiti</th>
           </tr></thead>
           <tbody>
              {paketler.map((p:any, i:number) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{p.paket_adi}</td>
                  <td style={{ color: '#64748b' }}>{p.paket_kodu}</td>
                  <td>{p.fiyat} ₺</td>
                  <td>{p.kullanici_limiti} Limit</td>
                </tr>
              ))}
           </tbody>
        </table>
     </div>
  )
}
