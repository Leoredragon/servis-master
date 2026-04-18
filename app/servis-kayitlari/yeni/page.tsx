"use client"

import { supabase } from '@/app/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function YeniServisForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const preCariId    = searchParams.get('cari_id') || ''

  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState<{ msg: string; type: 'success'|'error' } | null>(null)
  const [musteriler,setMusteriler] = useState<any[]>([])
  const [araclar,  setAraclar]  = useState<any[]>([])
  const [seciliMusteri, setSeciliMusteri] = useState(preCariId)

  const [form, setForm] = useState({
    servis_no:  '',
    cari_id:    preCariId,
    arac_id:    '',
    gelis_kmsi: '',
    sikayet:    '',
    teknisyen:  '',
  })

  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    supabase.from('cari_kart').select('id, yetkili').order('yetkili').then(({ data }) => setMusteriler(data || []))
  }, [])

  useEffect(() => {
    if (!seciliMusteri) { setAraclar([]); return }
    supabase.from('arac').select('*').eq('cari_id', seciliMusteri).then(({ data }) => setAraclar(data || []))
  }, [seciliMusteri])

  const handleMusteriChange = (id: string) => {
    setSeciliMusteri(id)
    setForm({ ...form, cari_id: id, arac_id: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cari_id) { showToast('Müşteri seçiniz', 'error'); return }
    if (!form.arac_id) { showToast('Araç seçiniz', 'error'); return }
    setSaving(true)

    const servisNo = form.servis_no.trim() || `SRV-${Date.now()}`
    const { data, error } = await supabase.from('servis_karti').insert([{
      servis_no:   servisNo,
      cari_id:     parseInt(form.cari_id),
      arac_id:     parseInt(form.arac_id),
      gelis_kmsi:  parseInt(form.gelis_kmsi) || 0,
      sikayet:     form.sikayet,
      teknisyen:   form.teknisyen,
      durum:       'Girildi',
      giris_tarihi: new Date().toISOString(),
    }]).select().single()

    setSaving(false)
    if (error) { showToast('Hata: ' + error.message, 'error'); return }
    showToast('Servis kaydı oluşturuldu!', 'success')
    setTimeout(() => router.push(`/servis-kayitlari/${data.id}`), 800)
  }

  return (
    <div className="animate-fadeIn">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
          </div>
        </div>
      )}

      <button className="btn-ghost" onClick={() => router.back()} style={{ marginBottom: '1rem' }}>
        ← Geri
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Yeni Servis Kaydı</h1>
          <p className="page-subtitle">Araç kabulü ve servis formu oluşturun</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '720px' }}>
        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

              <div className="form-group">
                <label className="form-label">Servis No</label>
                <input type="text" placeholder="Otomatik (SRV-...)" value={form.servis_no} onChange={e => setForm({ ...form, servis_no: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Geliş KM</label>
                <input type="number" min="0" placeholder="0" value={form.gelis_kmsi} onChange={e => setForm({ ...form, gelis_kmsi: e.target.value })} />
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Müşteri <span className="required">*</span></label>
                <select value={seciliMusteri} onChange={e => handleMusteriChange(e.target.value)} required>
                  <option value="">— Müşteri Seçin —</option>
                  {musteriler.map(m => (
                    <option key={m.id} value={m.id}>{m.yetkili} (#{m.id})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Araç <span className="required">*</span></label>
                <select value={form.arac_id} onChange={e => setForm({ ...form, arac_id: e.target.value })} required disabled={!seciliMusteri}>
                  <option value="">— Araç Seçin —</option>
                  {araclar.map(a => (
                    <option key={a.id} value={a.id}>{a.plaka} — {a.marka} {a.model} ({a.yil || '—'})</option>
                  ))}
                </select>
                {seciliMusteri && araclar.length === 0 && (
                  <p style={{ fontSize: '0.8125rem', color: '#d97706', marginTop: '0.375rem' }}>
                    ⚠ Bu müşteriye kayıtlı araç bulunamadı.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Teknisyen</label>
                <input type="text" placeholder="Teknisyen adı" value={form.teknisyen} onChange={e => setForm({ ...form, teknisyen: e.target.value })} />
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Müşteri Şikayeti</label>
                <textarea rows={3} placeholder="Müşterinin bildirdiği sorun veya şikayet..." value={form.sikayet} onChange={e => setForm({ ...form, sikayet: e.target.value })} />
              </div>

            </div>
          </div>

          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', background: '#f8fafc', borderRadius: '0 0 0.875rem 0.875rem' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Oluşturuluyor...' : '✓ Servis Kaydını Oluştur'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>İptal</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function YeniServisKaydi() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>}>
      <YeniServisForm />
    </Suspense>
  )
}