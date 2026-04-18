"use client"

import { supabase } from './lib/supabase'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Modal from './components/Modal'

type Musteri = { id: number; yetkili: string; tel?: string; bakiye?: number }
type Arac    = { id: number; plaka: string; marka: string; model: string; yil: string; cari_id: number }

const DURUM_RENKLER: Record<string, [string, string]> = {
  'Tamamlandı':     ['#065f46', '#d1fae5'],
  'Hazır':          ['#065f46', '#d1fae5'],
  'İşlemde':        ['#92400e', '#fef3c7'],
  'Parça Bekliyor': ['#991b1b', '#fee2e2'],
  'Müşteri Onayı':  ['#5b21b6', '#ede9fe'],
  'Teslim Edildi':  ['#1e40af', '#dbeafe'],
  'Girildi':        ['#374151', '#f3f4f6'],
}

const yeniServisNo = () => `SRV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*9000)+1000)}`

// Helper styles for inputs
const inp: React.CSSProperties = { width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none', color: '#1e293b', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }
const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }

function MusteriSearch({ musteriler, value, onChange }: { musteriler: Musteri[]; value: string; onChange: (id: string) => void }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const secili = musteriler.find(m => m.id.toString() === value)
  useEffect(() => { if (secili) setText(secili.yetkili || '') }, [value, musteriler.length])
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn); return () => document.removeEventListener('mousedown', fn)
  }, [])
  const filtered = musteriler.filter(m => !text || (m.yetkili || '').toLowerCase().includes(text.toLowerCase()))
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" placeholder="Müşteri adı veya firma ara..." value={text} onFocus={() => setOpen(true)} onChange={e => { setText(e.target.value); setOpen(true); if (!e.target.value) onChange('') }} style={{ ...inp, paddingLeft: '38px' }} />
        {value && <button onClick={() => { onChange(''); setText('') }} type="button" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px', lineHeight: 1 }}>✕</button>}
      </div>
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 200, maxHeight: '200px', overflowY: 'auto' }}>
          {filtered.map(m => (
            <button key={m.id} type="button" onMouseDown={() => { onChange(m.id.toString()); setText(m.yetkili); setOpen(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }} onMouseEnter={e => (e.currentTarget.style.background='#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{m.yetkili}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [stats, setStats] = useState({ musteri: 0, servis: 0, islemde: 0, tamamlanan: 0, parca_bekleyen: 0 })
  const [cekStats, setCekStats] = useState({ count: 0, total: 0 })
  const [sonServisler, setSonServisler] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [globalSearch, setGlobalSearch] = useState('')

  const [musteriler, setMusteriler] = useState<Musteri[]>([])
  const [tumAraclar, setTumAraclar] = useState<Arac[]>([])
  const [araclar,    setAraclar]    = useState<Arac[]>([])

  const [modal, setModal] = useState<'servis' | 'musteri' | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'}|null>(null)

  const [servisForm, setServisForm] = useState({ servis_no: yeniServisNo(), cari_id: '', arac_id: '', gelis_kmsi: '', sikayet: '', teknisyen: '' })
  const [musteriForm, setMusteriForm] = useState({ yetkili: '', tel: '', cep: '', mail: '', adres: '', vergi_no: '', vergi_dairesi: '', plaka: '', marka: '', model: '', yil: '' })

  const showToast = (msg: string, type: 'success'|'error' = 'success') => { setToast({msg, type}); setTimeout(() => setToast(null), 3500) }

  const loadData = async () => {
    // Toplam Müşteri, Bugünkü Servisler vb.
    const today = new Date()
    today.setHours(0,0,0,0)
    
    const threeDaysLater = new Date()
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)

    const [m, s, ib, t, pb, sl, ms, ar, cs] = await Promise.all([
      supabase.from('cari_kart').select('*', { count: 'exact', head: true }),
      supabase.from('servis_karti').select('*', { count: 'exact', head: true }),
      supabase.from('servis_karti').select('*', { count: 'exact', head: true }).eq('durum', 'İşlemde'),
      supabase.from('servis_karti').select('*', { count: 'exact', head: true }).in('durum', ['Tamamlandı', 'Hazır']).gte('cikis_tarihi', today.toISOString()),
      supabase.from('servis_karti').select('*', { count: 'exact', head: true }).in('durum', ['Parça Bekliyor', 'Müşteri Onayı']),
      supabase.from('servis_karti').select('*, arac(plaka,marka,model), cari_kart(yetkili)').order('giris_tarihi', { ascending: false }).limit(10),
      supabase.from('cari_kart').select('id, yetkili, tel').order('yetkili'),
      supabase.from('arac').select('*').order('plaka'),
      supabase.from('cek_senet').select('tutar').eq('durum', 'Bekliyor').lte('vade_tarihi', threeDaysLater.toISOString().split('T')[0])
    ])
    
    const cekTotal = (cs.data || []).reduce((acc: number, item: any) => acc + (item.tutar || 0), 0)
    setCekStats({ count: cs.data?.length || 0, total: cekTotal })
    
    setStats({ 
      musteri: m.count||0, 
      servis: s.count||0, 
      islemde: ib.count||0, 
      tamamlanan: t.count||0,
      parca_bekleyen: pb.count||0
    })
    setSonServisler(sl.data || [])
    setMusteriler(ms.data || [])
    setTumAraclar(ar.data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!servisForm.cari_id) { setAraclar([]); return }
    setAraclar(tumAraclar.filter(a => a.cari_id.toString() === servisForm.cari_id))
    setServisForm(prev => ({ ...prev, arac_id: '' }))
  }, [servisForm.cari_id, tumAraclar])

  const handleServisKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!servisForm.cari_id || !servisForm.arac_id) { showToast('Müşteri ve araç seçimi zorunludur', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('servis_karti').insert([{
      servis_no: servisForm.servis_no || yeniServisNo(),
      cari_id: parseInt(servisForm.cari_id), arac_id: parseInt(servisForm.arac_id),
      gelis_kmsi: parseInt(servisForm.gelis_kmsi) || 0, sikayet: servisForm.sikayet,
      teknisyen: servisForm.teknisyen, durum: 'Girildi',
      giris_tarihi: new Date().toISOString(),
    }])
    setSaving(false)
    if (error) { showToast('Hata: ' + error.message, 'error'); return }
    showToast('Servis kaydı başarıyla oluşturuldu')
    setModal(null)
    setServisForm({ servis_no: yeniServisNo(), cari_id: '', arac_id: '', gelis_kmsi: '', sikayet: '', teknisyen: '' })
    await loadData()
  }

  const handleMusteriKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!musteriForm.yetkili.trim()) { showToast('Müşteri ünvanı zorunludur', 'error'); return }
    if (!musteriForm.plaka.trim() || !musteriForm.marka.trim() || !musteriForm.model.trim()) { showToast('Araç bilgilerinin doldurulması zorunludur', 'error'); return }
    
    setSaving(true)
    const { data, error } = await supabase.from('cari_kart').insert([{
      yetkili: musteriForm.yetkili, tel: musteriForm.tel,
      cep: musteriForm.cep, mail: musteriForm.mail,
      adres: musteriForm.adres, vergi_no: musteriForm.vergi_no,
      vergi_dairesi: musteriForm.vergi_dairesi,
    }]).select().single()
    
    if (error) { setSaving(false); showToast('Hata: ' + error.message, 'error'); return }

    await supabase.from('arac').insert([{
      cari_id: data.id, plaka: musteriForm.plaka.trim(),
      marka: musteriForm.marka.trim(), model: musteriForm.model.trim(), yil: musteriForm.yil.trim()
    }])

    setSaving(false)
    showToast('Yeni Müşteri ve Araç eklendi')
    setModal(null)
    setMusteriForm({ yetkili: '', tel: '', cep: '', mail: '', adres: '', vergi_no: '', vergi_dairesi: '', plaka: '', marka: '', model: '', yil: '' })
    await loadData()
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, background: toast.type==='error'?'#ef4444':'#10b981', color: '#fff', padding: '14px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', animation: 'modalSlideIn 0.2s ease-out' }}>
          {toast.msg}
        </div>
      )}

      {/* Üst Alan Kaldırıldı -> layout.tsx'e taşındı */}


      <div style={{ width: '100%', padding: '32px', flex: 1, display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* 2. ÖZET İSTATİSTİK KARTLARI (KPI) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {[
            { label: 'İşlemdeki Araçlar', value: stats.islemde, color: '#f59e0b', sub: 'Serviste işlem gören', icon: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/> },
            { label: 'Bugün Tamamlanan', value: stats.tamamlanan, color: '#10b981', sub: 'Teslimata hazır veya teslim edildi', icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></> },
            { label: 'Parça/Onay Bekleyen', value: stats.parca_bekleyen, color: '#ef4444', sub: 'İşlemi duran araçlar', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
            { label: 'Toplam Müşteri', value: stats.musteri, color: '#3b82f6', sub: 'Aktif kayıtlı müşteri', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> }
          ].map(kpi => (
            <div key={kpi.label} style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', borderLeft: `5px solid ${kpi.color}`, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>{kpi.label}</span>
                <div style={{ padding: '8px', borderRadius: '10px', background: `${kpi.color}15`, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{kpi.icon}</svg>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{loading ? '...' : kpi.value}</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', fontWeight: 500 }}>{kpi.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ALT ALAN: ANA TABLO + SAĞ KOLON */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '28px' }}>
          
          {/* ORTA: SON AKTİF SERVİSLER */}
          <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Son Aktif Servisler</h2>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Atölyedeki en son giriş yapan veya işlemi devam eden araçlar</div>
              </div>
              <Link href="/servis-kayitlari" style={{ fontSize: '13px', fontWeight: 700, background: '#f1f5f9', color: '#0f172a', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', transition: 'background 0.2s' }}>
                Tümünü Gör →
              </Link>
            </div>
            
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Servis No', 'Müşteri Adı', 'Araç', 'Giriş Tarihi', 'Durum'].map(h => (
                      <th key={h} style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>Yükleniyor...</td></tr>
                  ) : sonServisler.map((s, idx) => {
                    const d = DURUM_RENKLER[s.durum] || DURUM_RENKLER['Girildi']
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <Link href={`/servis-kayitlari/${s.id}`} style={{ fontWeight: 800, color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}>
                            {s.servis_no || `#${s.id}`}
                          </Link>
                        </td>
                        <td style={{ padding: '16px 24px', fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                          {s.cari_kart?.yetkili || '—'}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontWeight: 700, color: '#334155', fontSize: '13px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', display: 'inline-block', border: '1px solid #e2e8f0' }}>{s.arac?.plaka || 'Plaka Yok'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>{s.arac?.marka} {s.arac?.model}</div>
                        </td>
                        <td style={{ padding: '16px 24px', color: '#475569', fontSize: '13px', fontWeight: 500 }}>
                          {new Date(s.giris_tarihi).toLocaleString('tr-TR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ display: 'inline-flex', padding: '5px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, color: d[0], background: d[1] }}>
                            {s.durum || 'Girildi'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && sonServisler.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Aktif servis kaydı bulunamadı.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SAĞ KOLON: HIZLI İŞLEMLER + UYARILAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 3. HIZLI İŞLEMLER PANELİ */}
            <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Hızlı İşlemler</h3>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => setModal('servis')} style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', padding: '14px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '15px' }}>Yeni Servis Kaydı Aç</div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>Araç kabul işlemlerini başlat</div>
                  </div>
                </button>

                <button onClick={() => setModal('musteri')} style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', padding: '14px 16px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                  <div style={{ background: '#e2e8f0', color: '#334155', padding: '8px', borderRadius: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Yeni Müşteri Ekle</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Sisteme yeni müşteri tanımla</div>
                  </div>
                </button>

                <Link href="/faturalar" style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', padding: '14px 16px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', textDecoration: 'none', transition: 'all 0.2s' }}>
                  <div style={{ background: '#e2e8f0', color: '#334155', padding: '8px', borderRadius: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Fatura / Tahsilat</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Finansal kayıt oluştur</div>
                  </div>
                </Link>
              </div>
            </div>
            
            {/* Çek & Senet Uyarı Widget */}
            {cekStats.count > 0 && (
              <Link href="/cek-senet" style={{ display: 'block', textDecoration: 'none', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 20px rgba(15,23,42,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-15px', bottom: '-15px', opacity: 0.1, color: '#3b82f6' }}>
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4d4d', boxShadow: '0 0 8px #ff4d4d' }}></div>
                  <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#94a3b8' }}>Finansal Hatırlatıcı</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#f1f5f9', lineHeight: 1.4 }}>
                  Vadesine 3 günden az kalan <span style={{ fontWeight: 800, color: '#fff' }}>{cekStats.count}</span> tahsilat bekliyor.
                </div>
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#3b82f6' }}>{cekStats.total.toLocaleString('tr-TR')} <span style={{ fontSize: '14px' }}>₺</span></div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>Toplam Beklenen Tutar</div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>İncele →</div>
                </div>
              </Link>
            )}

            {/* 5. UYARILAR VE STOK ALARMLARI */}
            <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', background: '#fafbfc' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Kritik Uyarılar</h3>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Sahte Kritik Stok Uyarıları */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Stok Alarmları</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fef2f2', border: '1px solid #fee2e2', padding: '10px 12px', borderRadius: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', marginTop: '6px' }}></div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b' }}>5W-30 Motor Yağı (Sentetik)</div>
                      <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '2px' }}>Sadece 2 litre kaldı (Kritik)</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fffbeb', border: '1px solid #fef3c7', padding: '10px 12px', borderRadius: '8px', marginTop: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', marginTop: '6px' }}></div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#92400e' }}>Polen Filtresi (Genel Uyumlu)</div>
                      <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>Stok: 5 adet (Sipariş verilmeli)</div>
                    </div>
                  </div>
                </div>

                <div style={{ height: '1px', background: '#f1f5f9' }}></div>

                {/* Sahte Bekleyen Ödemeler */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Bekleyen İşlemler</div>
                  <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ fontWeight: 600 }}>Tedarikçi Ödemesi</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Yarın</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ fontWeight: 600 }}>Kesilecek Faturalar (3)</span>
                    <Link href="/faturalar" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 700 }}>İncele</Link>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Modal: Yeni Servis Kaydı ── */}
      <Modal isOpen={modal === 'servis'} onClose={() => setModal(null)} title="Yeni Servis Kaydı" subtitle="Servis no ve giriş tarihi otomatik oluşturulur" size="lg">
        <form onSubmit={handleServisKaydet}>
          <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Header Müşteri & Araç Seçim */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={lbl}>Hangi Müşteri? <span style={{ color: '#ef4444' }}>*</span></label>
                <MusteriSearch musteriler={musteriler} value={servisForm.cari_id} onChange={id => setServisForm({...servisForm, cari_id: id, arac_id: ''})} />
              </div>
              <div>
                <label style={lbl}>Servise Giren Araç <span style={{ color: '#ef4444' }}>*</span></label>
                {!servisForm.cari_id ? (
                  <div style={{ border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', background: '#fff' }}>Önce müşteri arayın ve seçin</div>
                ) : araclar.length === 0 ? (
                  <div style={{ border: '1px dashed #fbbf24', borderRadius: '10px', padding: '12px', textAlign: 'center', color: '#92400e', fontSize: '13px', background: '#fffbeb' }}>Bu müşteriye ait kayıtlı araç yok. Lütfen müşteri profiline gidip araç ekleyin.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {araclar.map(a => (
                      <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: `2px solid ${servisForm.arac_id === a.id.toString() ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '10px', cursor: 'pointer', background: servisForm.arac_id === a.id.toString() ? '#eff6ff' : '#fff' }}>
                        <input type="radio" value={a.id} checked={servisForm.arac_id === a.id.toString()} onChange={() => setServisForm({...servisForm, arac_id: a.id.toString()})} style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }} />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', letterSpacing: '0.5px' }}>{a.plaka}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{a.marka} {a.model}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ height: '1px', background: '#f1f5f9' }}></div>

            {/* Form Detayları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
              <div>
                <label style={lbl}>Araç Şikayeti / İstek (Kısa Özeti)</label>
                <textarea rows={3} placeholder="Müşterinin şikayeti veya yapılması istenen işlemler..." value={servisForm.sikayet} onChange={e => setServisForm({...servisForm, sikayet: e.target.value})} style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={lbl}>Geliş KM'si</label>
                    <input type="number" min="0" placeholder="Örn: 145000" value={servisForm.gelis_kmsi} onChange={e => setServisForm({...servisForm, gelis_kmsi: e.target.value})} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Teknisyen</label>
                    <input type="text" placeholder="Ad Soyad" value={servisForm.teknisyen} onChange={e => setServisForm({...servisForm, teknisyen: e.target.value})} style={inp} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Servis Kabul No</label>
                  <input readOnly value={servisForm.servis_no} style={{ ...inp, background: '#f8fafc', color: '#64748b' }} />
                </div>
              </div>
            </div>

          </div>
          <div style={{ padding: '18px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '14px', background: '#fafbfc' }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>{saving ? 'Oluşturuluyor...' : '✓ Servis Kaydını Aç'}</button>
            <button type="button" onClick={() => setModal(null)} style={{ padding: '14px 24px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>İptal</button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Yeni Müşteri ── */}
      <Modal isOpen={modal === 'musteri'} onClose={() => setModal(null)} title="Hızlı Müşteri Oluştur" subtitle="Bir Müşteri ve isteğe bağlı aracını sisteme tanımla" size="md">
        <form onSubmit={handleMusteriKaydet}>
          <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Kişi / Firma Bilgileri</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Ad Soyad veya Ünvan <span style={{ color: '#ef4444' }}>*</span></label><input placeholder="Örn: Ahmet Yılmaz" value={musteriForm.yetkili} onChange={e => setMusteriForm({...musteriForm, yetkili: e.target.value})} style={inp} required /></div>
                <div><label style={lbl}>Cep Telefonu</label><input type="tel" placeholder="0555 123 45 67" value={musteriForm.cep} onChange={e => setMusteriForm({...musteriForm, cep: e.target.value})} style={inp} /></div>
                <div><label style={lbl}>Sabit Telefon</label><input type="tel" placeholder="0212 123 45 67" value={musteriForm.tel} onChange={e => setMusteriForm({...musteriForm, tel: e.target.value})} style={inp} /></div>
              </div>
            </div>

            <div style={{ height: '1px', background: '#f1f5f9' }}></div>

            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Araç Bilgileri (Zorunlu)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Plaka <span style={{ color: '#ef4444' }}>*</span></label><input placeholder="34 ABC 123" value={musteriForm.plaka} onChange={e => setMusteriForm({...musteriForm, plaka: e.target.value})} style={{...inp, textTransform: 'uppercase'}} required /></div>
                <div><label style={lbl}>Marka <span style={{ color: '#ef4444' }}>*</span></label><input placeholder="Renault" value={musteriForm.marka} onChange={e => setMusteriForm({...musteriForm, marka: e.target.value})} style={inp} required /></div>
                <div><label style={lbl}>Model <span style={{ color: '#ef4444' }}>*</span></label><input placeholder="Clio" value={musteriForm.model} onChange={e => setMusteriForm({...musteriForm, model: e.target.value})} style={inp} required /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Yıl (Opsiyonel)</label><input placeholder="2022" value={musteriForm.yil} onChange={e => setMusteriForm({...musteriForm, yil: e.target.value})} style={inp} /></div>
              </div>
            </div>
          </div>
          <div style={{ padding: '18px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '14px', background: '#fafbfc' }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>{saving ? 'Kaydediliyor...' : '✓ Müşteri ve Araç Kaydet'}</button>
            <button type="button" onClick={() => setModal(null)} style={{ padding: '14px 24px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>İptal</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}