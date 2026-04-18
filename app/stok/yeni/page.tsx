"use client"

import { supabase } from '../../lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function YeniStok() {
  const router    = useRouter()
  const [saving, setSaving] = useState(false)
  const [toast,  setToast]  = useState<{ msg: string; type: 'success'|'error' } | null>(null)
  const [form, setForm] = useState({
    kod:       '',
    ad:        '',
    grup:      '',
    barkod:    '',
    birim:     'Adet',
    a_fiyat:   '',
    s_fiyat:   '',
    kdv_oran:  '18',
  })

  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('stok').insert([{
      kod:      form.kod      || null,
      ad:       form.ad,
      grup:     form.grup     || null,
      barkod:   form.barkod   || null,
      birim:    form.birim,
      a_fiyat:  parseFloat(form.a_fiyat)  || 0,
      s_fiyat:  parseFloat(form.s_fiyat)  || 0,
      kdv_oran: parseInt(form.kdv_oran)   || 18,
    }])
    setSaving(false)
    if (error) { showToast('Hata: ' + error.message, 'error'); return }
    showToast('Ürün başarıyla eklendi!', 'success')
    setTimeout(() => router.push('/stok'), 1000)
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
          <h1 className="page-title">Yeni Ürün / Parça</h1>
          <p className="page-subtitle">Stoka yeni ürün ekleyin</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '680px' }}>
        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Ürün / Parça Adı <span className="required">*</span></label>
                <input type="text" placeholder="Örn: Yağ Filtresi" value={form.ad} onChange={e => setForm({ ...form, ad: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Stok Kodu</label>
                <input type="text" placeholder="Örn: ST-001" value={form.kod} onChange={e => setForm({ ...form, kod: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Barkod</label>
                <input type="text" placeholder="Barkod numarası" value={form.barkod} onChange={e => setForm({ ...form, barkod: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Grup / Kategori</label>
                <input type="text" placeholder="Örn: Filtre, Yağlar" value={form.grup} onChange={e => setForm({ ...form, grup: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Birim</label>
                <select value={form.birim} onChange={e => setForm({ ...form, birim: e.target.value })}>
                  <option>Adet</option>
                  <option>Lt</option>
                  <option>Kg</option>
                  <option>Metre</option>
                  <option>Takım</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Alış Fiyatı (₺)</label>
                <input type="number" step="0.01" min="0" placeholder="0.00" value={form.a_fiyat} onChange={e => setForm({ ...form, a_fiyat: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Satış Fiyatı (₺) <span className="required">*</span></label>
                <input type="number" step="0.01" min="0" placeholder="0.00" value={form.s_fiyat} onChange={e => setForm({ ...form, s_fiyat: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">KDV Oranı (%)</label>
                <select value={form.kdv_oran} onChange={e => setForm({ ...form, kdv_oran: e.target.value })}>
                  <option value="0">%0</option>
                  <option value="8">%8</option>
                  <option value="18">%18</option>
                  <option value="20">%20</option>
                </select>
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
              {saving ? 'Kaydediliyor...' : '✓ Ürünü Kaydet'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>İptal</button>
          </div>
        </form>
      </div>
    </div>
  )
}
