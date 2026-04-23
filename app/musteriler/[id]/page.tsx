"use client"

import { useState, useEffect, useCallback, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Modal from '../../components/Modal'

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }
const inputStyle = { width: '100%', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none', background: '#fff', color: '#0f172a', transition: 'all 0.2s' }

const Icons = {
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  car: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 13.1V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>,
  history: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
}

function MusteriDetayContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [cari, setCari] = useState<any>(null)
  const [araclar, setAraclar] = useState<any[]>([])
  const [servisler, setServisler] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'ozet' | 'araclar' | 'servisler'>('ozet')

  // Araç Modal States
  const [aracModalAcik, setAracModalAcik] = useState(false)
  const [aracSaving, setAracSaving] = useState(false)
  const [aracForm, setAracForm] = useState({
    plaka: '', marka: '', model: '', yil: '', renk: '', km: '', motor_no: '', sasi_no: ''
  })
  
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const [cariRes, aracRes, servisRes] = await Promise.all([
      supabase.from('cari_kart').select('*').eq('id', id).single(),
      supabase.from('arac').select('*').eq('cari_id', id).order('id', { ascending: false }),
      supabase.from('servis_karti').select('*').eq('cari_id', id).order('giris_tarihi', { ascending: false })
    ])
    
    setCari(cariRes.data)
    setAraclar(aracRes.data || [])
    setServisler(servisRes.data || [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (searchParams.get('arac_ekle') === 'true') {
      setActiveTab('araclar')
      setAracModalAcik(true)
    }
  }, [searchParams])

  const handleAracSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aracForm.plaka.trim()) return showToast('Plaka zorunludur.', 'error')
    
    setAracSaving(true)
    try {
      const email = (await supabase.auth.getUser()).data.user?.email || 'admin'
      const { error } = await supabase.from('arac').insert([{
        cari_id: parseInt(id),
        plaka: aracForm.plaka.toUpperCase().replace(/\s/g, ''),
        marka: aracForm.marka,
        model: aracForm.model,
        yil: parseInt(aracForm.yil) || null,
        renk: aracForm.renk,
        guncel_km: parseInt(aracForm.km) || 0,
        motor_no: aracForm.motor_no,
        sasi_no: aracForm.sasi_no,
        kullaniciadi: email,
        subeadi: 'Merkez'
      }])
      
      if (error) throw error
      
      showToast('Araç başarıyla eklendi.')
      setAracModalAcik(false)
      setAracForm({ plaka: '', marka: '', model: '', yil: '', renk: '', km: '', motor_no: '', sasi_no: '' })
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setAracSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}><div className="skeleton" style={{ height: '300px', borderRadius: '16px' }} /></div>
  if (!cari) return <div style={{ padding: '60px', textAlign: 'center' }}>Müşteri bulunamadı.</div>

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px 60px' }}>
      
      {/* ─── HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
             <button onClick={() => router.push('/musteriler')} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: '6px 12px', borderRadius: '8px' }}>← Müşteriler</button>
             <span style={{ fontSize: '12px', fontWeight: 800, color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px' }}>{cari.grup}</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.8px' }}>{cari.yetkili}</h1>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
             <span>{cari.cep || 'Telefon Yok'}</span>
             {cari.mail && <span>• {cari.mail}</span>}
          </div>
        </div>
        <Link href={`/musteriler/yeni?id=${id}`} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', textDecoration: 'none' }}>
           {Icons.edit} Düzenle
        </Link>
      </div>

      {/* ─── TABS ─── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '32px' }}>
        {[
          { id: 'ozet', name: 'Müşteri Bilgileri', icon: Icons.user },
          { id: 'araclar', name: 'Araçlar', icon: Icons.car, count: araclar.length },
          { id: 'servisler', name: 'Servis Geçmişi', icon: Icons.history, count: servisler.length },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: activeTab === tab.id ? 800 : 500,
              color: activeTab === tab.id ? '#3b82f6' : '#64748b',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', marginBottom: '-1px'
            }}
          >
            {tab.name} {tab.count !== undefined && <span style={{ background: activeTab === tab.id ? '#3b82f6' : '#f1f5f9', color: activeTab === tab.id ? '#fff' : '#64748b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* ─── TAB CONTENT ─── */}
      {activeTab === 'ozet' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
           <div className="card" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '24px' }}>İletişim & Adres</h3>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div><label style={labelStyle}>Adres</label><p style={{ fontSize: '15px', color: '#334155', lineHeight: 1.5 }}>{cari.adres || 'Adres belirtilmemiş.'}</p></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                   <div><label style={labelStyle}>Sabit Telefon</label><p style={{ fontSize: '15px', color: '#334155' }}>{cari.tel || '—'}</p></div>
                   <div><label style={labelStyle}>E-Posta</label><p style={{ fontSize: '15px', color: '#334155' }}>{cari.mail || '—'}</p></div>
                </div>
              </div>
           </div>
           <div className="card" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '24px' }}>Resmi Bilgiler</h3>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div><label style={labelStyle}>Vergi Dairesi</label><p style={{ fontSize: '15px', color: '#334155' }}>{cari.vergi_dairesi || '—'}</p></div>
                <div><label style={labelStyle}>Vergi / TCK No</label><p style={{ fontSize: '15px', color: '#334155' }}>{cari.vergi_no || '—'}</p></div>
                <div><label style={labelStyle}>Açıklama</label><p style={{ fontSize: '14px', color: '#64748b' }}>{cari.aciklama || '—'}</p></div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'araclar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setAracModalAcik(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px' }}>
                 {Icons.plus} Yeni Araç Ekle
              </button>
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {araclar.length === 0 ? (
                <div style={{ gridColumn: 'span 3', padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '20px', color: '#94a3b8' }}>Kayıtlı araç bulunamadı.</div>
              ) : araclar.map(arac => (
                <div key={arac.id} className="card hover-row" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
                   <div style={{ background: '#0f172a', color: '#fff', padding: '4px 12px', borderRadius: '6px', fontSize: '18px', fontWeight: 900, display: 'inline-block', marginBottom: '12px' }}>{arac.plaka}</div>
                   <div style={{ fontWeight: 800, fontSize: '16px', color: '#1e293b' }}>{arac.marka} {arac.model}</div>
                   <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '13px', color: '#64748b' }}>
                      <span>{arac.yil || '—'} Model</span>
                      <span>•</span>
                      <span>{arac.guncel_km?.toLocaleString()} KM</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'servisler' && (
        <div className="card" style={{ overflow: 'hidden' }}>
           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                 <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Servis No</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Tarih</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Durum</th>
                    <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Tutar</th>
                 </tr>
              </thead>
              <tbody>
                 {servisler.length === 0 ? (
                   <tr><td colSpan={4} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Servis geçmişi bulunamadı.</td></tr>
                 ) : servisler.map(s => (
                   <tr key={s.id} onClick={() => router.push(`/servis-kayitlari/${s.id}`)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} className="hover-row">
                      <td style={{ padding: '16px 24px', fontWeight: 800, color: '#0f172a' }}>#{s.servis_no}</td>
                      <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '14px' }}>{new Date(s.giris_tarihi).toLocaleDateString('tr-TR')}</td>
                      <td style={{ padding: '16px 24px' }}><span style={{ padding: '4px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 700, background: s.durum === 'Tamamlandı' ? '#dcfce7' : '#fef3c7', color: s.durum === 'Tamamlandı' ? '#16a34a' : '#d97706' }}>{s.durum}</span></td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800 }}>{(s.toplam_tutar || 0).toLocaleString('tr-TR')} ₺</td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {/* ─── ARAÇ MODALI ─── */}
      <Modal 
        isOpen={aracModalAcik} 
        onClose={() => setAracModalAcik(false)} 
        title="Yeni Araç Ekle" 
        size="md"
      >
        <form onSubmit={handleAracSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                 <label style={labelStyle}>Plaka *</label>
                 <input 
                   required style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 900, fontSize: '18px', textAlign: 'center', letterSpacing: '1px' }} 
                   placeholder="34 ABC 123" value={aracForm.plaka} 
                   onChange={e => setAracForm({...aracForm, plaka: e.target.value.toUpperCase()})}
                 />
              </div>
              <div><label style={labelStyle}>Marka</label><input style={inputStyle} placeholder="BMW" value={aracForm.marka} onChange={e => setAracForm({...aracForm, marka: e.target.value})} /></div>
              <div><label style={labelStyle}>Model</label><input style={inputStyle} placeholder="320i" value={aracForm.model} onChange={e => setAracForm({...aracForm, model: e.target.value})} /></div>
              <div><label style={labelStyle}>Yıl</label><input type="number" style={inputStyle} placeholder="2023" value={aracForm.yil} onChange={e => setAracForm({...aracForm, yil: e.target.value})} /></div>
              <div><label style={labelStyle}>KM</label><input type="number" style={inputStyle} placeholder="45000" value={aracForm.km} onChange={e => setAracForm({...aracForm, km: e.target.value})} /></div>
              <div><label style={labelStyle}>Motor No</label><input style={inputStyle} value={aracForm.motor_no} onChange={e => setAracForm({...aracForm, motor_no: e.target.value})} /></div>
              <div><label style={labelStyle}>Şasi No</label><input style={inputStyle} value={aracForm.sasi_no} onChange={e => setAracForm({...aracForm, sasi_no: e.target.value})} /></div>
           </div>
           
           <div style={{ padding: '20px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setAracModalAcik(false)} className="btn-secondary" style={{ padding: '12px 24px', borderRadius: '10px' }}>Vazgeç</button>
              <button type="submit" disabled={aracSaving} className="btn-primary" style={{ padding: '12px 32px', borderRadius: '10px', fontSize: '15px' }}>
                 {aracSaving ? 'Kaydediliyor...' : 'Aracı Kaydet'}
              </button>
           </div>
        </form>
      </Modal>

      {toast && (
        <div className={`toast toast-${toast.type}`} style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 10000 }}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default function MusteriDetayPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Yükleniyor...</div>}>
      <MusteriDetayContent />
    </Suspense>
  )
}
