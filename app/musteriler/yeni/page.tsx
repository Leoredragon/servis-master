"use client"

import { supabase } from '../../lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function YeniMusteri() {
  const router   = useRouter()
  const [saving, setSaving] = useState(false)
  const [toast,  setToast]  = useState<{ msg: string; type: 'success'|'error' } | null>(null)
  const [form, setForm] = useState({
    yetkili:        '',
    tel:            '',
    cep:            '',
    mail:           '',
    adres:          '',
    vergi_no:       '',
    vergi_dairesi:  '',
    plaka:          '',
    marka:          '',
    model:          '',
    yil:            '',
  })

  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.plaka.trim() || !form.marka.trim() || !form.model.trim()) {
      showToast('Araç plaka, marka ve model alanları zorunludur!', 'error')
      return
    }
    setSaving(true)
    const { data, error } = await supabase.from('cari_kart').insert([{
      yetkili:        form.yetkili,
      tel:            form.tel,
      cep:            form.cep,
      mail:           form.mail,
      adres:          form.adres,
      vergi_no:       form.vergi_no,
      vergi_dairesi:  form.vergi_dairesi,
    }]).select().single()

    if (error) {
      showToast('Kayıt oluşturulamadı: ' + error.message, 'error')
    } else {
      if (form.plaka.trim()) {
        await supabase.from('arac').insert([{
          cari_id: data.id,
          plaka: form.plaka.trim(),
          marka: form.marka.trim(),
          model: form.model.trim(),
          yil:   form.yil.trim()
        }])
      }
      showToast('Müşteri başarıyla eklendi!', 'success')
      setTimeout(() => router.push(`/musteriler/${data.id}`), 1000)
    }
    setSaving(false)
  }

  return (
    <div className="animate-fadeIn">
      {/* Toast */}
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
          <h1 className="page-title">Yeni Müşteri</h1>
          <p className="page-subtitle">Müşteri bilgilerini doldurun</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '720px' }}>
        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Firma / Müşteri Adı <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Örn: ABC Otomotiv Ltd. veya Ahmet Yılmaz"
                  value={form.yetkili}
                  onChange={e => setForm({ ...form, yetkili: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sabit Telefon</label>
                <input
                  type="tel"
                  placeholder="0212 000 00 00"
                  value={form.tel}
                  onChange={e => setForm({ ...form, tel: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cep Telefonu</label>
                <input
                  type="tel"
                  placeholder="0532 000 00 00"
                  value={form.cep}
                  onChange={e => setForm({ ...form, cep: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-posta</label>
                <input
                  type="email"
                  placeholder="info@firma.com"
                  value={form.mail}
                  onChange={e => setForm({ ...form, mail: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vergi No</label>
                <input
                  type="text"
                  placeholder="1234567890"
                  value={form.vergi_no}
                  onChange={e => setForm({ ...form, vergi_no: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vergi Dairesi</label>
                <input
                  type="text"
                  placeholder="Kadıköy VD"
                  value={form.vergi_dairesi}
                  onChange={e => setForm({ ...form, vergi_dairesi: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Adres</label>
                <textarea
                  rows={3}
                  placeholder="Firma adresi..."
                  value={form.adres}
                  onChange={e => setForm({ ...form, adres: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1', marginTop: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Araç Bilgileri</h3>
              </div>

              <div className="form-group">
                <label className="form-label">Plaka <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="34 ABC 123"
                  value={form.plaka}
                  onChange={e => setForm({ ...form, plaka: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Marka <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Renault"
                  value={form.marka}
                  onChange={e => setForm({ ...form, marka: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Model <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Clio"
                  value={form.model}
                  onChange={e => setForm({ ...form, model: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Yıl</label>
                <input
                  type="text"
                  placeholder="2020"
                  value={form.yil}
                  onChange={e => setForm({ ...form, yil: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            gap: '0.75rem',
            background: '#f8fafc',
            borderRadius: '0 0 0.875rem 0.875rem',
          }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Kaydediliyor...' : '✓ Müşteriyi Kaydet'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
