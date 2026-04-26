"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CariSec from '../../components/CariSec'

const inputStyle = { width: '100%', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none', background: '#fff' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }

export default function YeniServis() {
  const router = useRouter()
  const [form, setForm] = useState({
    cari_id: '',
    arac_id: '',
    gelis_kmsi: '',
    teknisyen: '',
    sikayet: '',
    giris_tarihi: new Date().toISOString().slice(0, 16) // datetime-local format
  })
  
  const [araclar, setAraclar] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Generate SRV code
  const today = new Date()
  const yyyymmdd = today.toISOString().split('T')[0].replace(/-/g, '')
  const random4 = Math.floor(1000 + Math.random() * 9000)
  const defaultSrvNo = `SRV-${yyyymmdd}-${random4}`

  // Cari ID değiştiğinde o müşteriye ait araçları getir
  useEffect(() => {
    if (!form.cari_id) {
      setAraclar([])
      setForm(prev => ({ ...prev, arac_id: '' }))
      return
    }

    const fetchAraclar = async () => {
      const { data } = await supabase.from('arac').select('id, plaka, marka, model').eq('cari_id', form.cari_id)
      setAraclar(data || [])
      if (data && data.length === 1) {
        setForm(prev => ({ ...prev, arac_id: data[0].id.toString() }))
      } else {
        setForm(prev => ({ ...prev, arac_id: '' }))
      }
    }
    fetchAraclar()
  }, [form.cari_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cari_id || !form.arac_id) {
      showToast('Lütfen müşteri ve ait olduğu bir aracı seçin.', 'error')
      return
    }

    setLoading(true)
    const payload = {
      servis_no: defaultSrvNo,
      cari_id: parseInt(form.cari_id),
      arac_id: parseInt(form.arac_id),
      giris_tarihi: new Date(form.giris_tarihi).toISOString(),
      gelis_kmsi: parseInt(form.gelis_kmsi) || 0,
      teknisyen: form.teknisyen,
      sikayet: form.sikayet,
      durum: 'Araç Kabul',
      odeme_durumu: 'Ödenmedi',
      toplam_tutar: 0,
      odenen_tutar: 0,
      kullaniciadi: (await supabase.auth.getUser()).data.user?.email || 'admin',
      subeadi: 'Merkez'
    }

    const { data, error } = await supabase.from('servis_karti').insert([payload]).select().single()

    if (error) {
      showToast('Hata oluştu: ' + error.message, 'error')
      setLoading(false)
    } else {
      router.push(`/servis-kayitlari/${data.id}`)
    }
  }

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '0 16px 80px' : '0 24px 60px' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginBottom: isMobile ? '16px' : '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        ← Geri Dön
      </button>

      <div style={{ marginBottom: isMobile ? '20px' : '32px' }}>
        <h1 style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Yeni İş Emri Oluştur</h1>
        <p style={{ color: '#64748b', fontSize: isMobile ? '13px' : '15px', marginTop: '8px' }}>Müşteri aracını servise kabul edin.</p>
      </div>

      <div style={{ background: '#fff', borderRadius: isMobile ? '16px' : '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '20px' : '32px', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '24px' }}>
             
             {/* Cari ve Araç Seçimi */}
             <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '20px' }}>
                <div>
                   <label style={labelStyle}>Müşteri Seçin *</label>
                   <CariSec value={form.cari_id} onChange={(id) => setForm({...form, cari_id: id})} />
                </div>
                <div>
                   <label style={labelStyle}>Araç Seçin *</label>
                   <select required disabled={!form.cari_id} style={{ ...inputStyle, background: !form.cari_id ? '#f8fafc' : '#fff' }} value={form.arac_id} onChange={e => setForm({...form, arac_id: e.target.value})}>
                     <option value="">{form.cari_id ? 'Araç Seçiniz' : 'Önce Müşteri Seçin'}</option>
                     {araclar.map(a => <option key={a.id} value={a.id}>{a.plaka} - {a.marka} {a.model}</option>)}
                   </select>
                   {form.cari_id && araclar.length === 0 && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444' }}>
                         Müşterinin kayıtlı aracı yok. <Link href={`/musteriler/${form.cari_id}?arac_ekle=true`} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 700 }}>Yeni Araç Ekle</Link>
                      </div>
                   )}
                </div>
             </div>

             <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2', height: '1px', background: '#f1f5f9', margin: '8px 0' }}></div>

             <div>
                <label style={labelStyle}>Servis No</label>
                <input disabled style={{ ...inputStyle, background: '#f8fafc', color: '#64748b', fontWeight: 800, fontFamily: 'monospace' }} value={defaultSrvNo} />
             </div>
             <div>
                <label style={labelStyle}>Giriş Tarihi ve Saati *</label>
                <input type="datetime-local" required style={inputStyle} value={form.giris_tarihi} onChange={e => setForm({...form, giris_tarihi: e.target.value})} />
             </div>
             <div>
                <label style={labelStyle}>Geliş Kilometresi (KM)</label>
                <input type="number" style={inputStyle} placeholder="Örn: 45000" value={form.gelis_kmsi} onChange={e => setForm({...form, gelis_kmsi: e.target.value})} />
             </div>
             <div>
                <label style={labelStyle}>Teknisyen / Usta</label>
                <input type="text" style={inputStyle} placeholder="A personeli" value={form.teknisyen} onChange={e => setForm({...form, teknisyen: e.target.value})} />
             </div>
          </div>

          <div>
             <label style={labelStyle}>Müşteri Şikayeti / Araç Kabul Notu</label>
             <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Müşterinin belirttiği arızalar veya talepler..." value={form.sikayet} onChange={e => setForm({...form, sikayet: e.target.value})} />
          </div>

          <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
             <button type="button" onClick={() => router.back()} disabled={loading} style={{ padding: '16px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>İptal</button>
             <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '16px 32px', borderRadius: '12px', fontSize: '16px' }}>
                {loading ? 'İş Emri Açılıyor...' : 'İş Emrini Başlat →'}
             </button>
          </div>

        </form>
      </div>

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>}
            {toast.type === 'error' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}