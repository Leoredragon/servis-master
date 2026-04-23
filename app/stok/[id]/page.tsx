"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'

const GRUPLAR = [
  "Filtre ve Bakım", "Mekanik/Motor", "Elektrik", "Kaporta/Aksesuar", "Sarf Malzeme", "Lastik/Jant", "Madeni Yağ", "Diğer"
]
const BIRIMLER = ["Adet", "Litre", "Set", "Kg", "Metre", "Takım"]

const inputStyle = { width: '100%', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none', background: '#fff', color: '#0f172a' }
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' as const }

export default function StokDetayPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [stok, setStok] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchStok = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data, error } = await supabase.from('stok').select('*').eq('id', id).single()
    if (data) {
      setStok(data)
      setForm(data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchStok() }, [fetchStok])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const payload = {
        ad: form.ad,
        kod: form.kod || null,
        barkod: form.barkod || null,
        grup: form.grup,
        birim: form.birim,
        a_fiyat: parseFloat(form.a_fiyat) || 0,
        s_fiyat: parseFloat(form.s_fiyat) || 0,
        kdv_oran: form.kdv_oran.toString(),
        kritik_seviye: parseFloat(form.kritik_seviye) || 10,
        aciklama: form.aciklama,
        kullaniciadi: (await supabase.auth.getUser()).data.user?.email || 'admin'
      }

      const { error } = await supabase.from('stok').update(payload).eq('id', id)
      if (error) throw error

      showToast('Stok kartı başarıyla güncellendi.', 'success')
      setStok({ ...stok, ...payload })
      setIsEditing(false)
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: '400px', borderRadius: '24px', maxWidth: '800px', margin: '0 auto' }}></div>
      </div>
    )
  }

  if (!stok) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <h2 style={{ color: '#64748b' }}>Stok kartı bulunamadı.</h2>
        <button onClick={() => router.push('/stok')} className="btn-secondary" style={{ marginTop: '20px' }}>Listeye Dön</button>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 60px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
         <button onClick={() => router.push('/stok')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
           ← Listeye Dön
         </button>
         {!isEditing && (
           <button onClick={() => setIsEditing(true)} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '12px' }}>
             Düzenle
           </button>
         )}
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>Stok Detayı</h1>
        <p style={{ color: '#64748b', fontSize: '16px', marginTop: '8px' }}>{stok.ad} - Ürün bilgilerini görüntüleyin ve yönetin.</p>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <form onSubmit={handleUpdate}>
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Temel Bilgiler Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
               <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Ürün Adı *</label>
                  <input 
                    required 
                    disabled={!isEditing} 
                    style={{ ...inputStyle, background: isEditing ? '#fff' : '#f8fafc', fontWeight: 700, fontSize: '18px' }} 
                    value={isEditing ? form.ad : stok.ad} 
                    onChange={e => setForm({...form, ad: e.target.value})} 
                  />
               </div>

               <div>
                  <label style={labelStyle}>Stok Kodu</label>
                  <input 
                    disabled={!isEditing} 
                    style={{ ...inputStyle, background: isEditing ? '#fff' : '#f8fafc', fontFamily: 'monospace' }} 
                    value={isEditing ? (form.kod || '') : (stok.kod || '---')} 
                    onChange={e => setForm({...form, kod: e.target.value})} 
                  />
               </div>
               <div>
                  <label style={labelStyle}>Barkod</label>
                  <input 
                    disabled={!isEditing} 
                    style={{ ...inputStyle, background: isEditing ? '#fff' : '#f8fafc', fontFamily: 'monospace' }} 
                    value={isEditing ? (form.barkod || '') : (stok.barkod || '---')} 
                    onChange={e => setForm({...form, barkod: e.target.value})} 
                  />
               </div>

               <div>
                  <label style={labelStyle}>Kategori / Grup</label>
                  {isEditing ? (
                    <select style={inputStyle} value={form.grup} onChange={e => setForm({...form, grup: e.target.value})}>
                      {GRUPLAR.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  ) : (
                    <div style={{ ...inputStyle, background: '#f8fafc', fontWeight: 600 }}>{stok.grup}</div>
                  )}
               </div>
               <div>
                  <label style={labelStyle}>Birim</label>
                  {isEditing ? (
                    <select style={inputStyle} value={form.birim} onChange={e => setForm({...form, birim: e.target.value})}>
                      {BIRIMLER.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  ) : (
                    <div style={{ ...inputStyle, background: '#f8fafc', fontWeight: 600 }}>{stok.birim}</div>
                  )}
               </div>
            </div>

            {/* Fiyat ve Miktar Bloğu */}
            <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
               <div>
                  <label style={labelStyle}>Alış Fiyatı</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" step="0.01" 
                      disabled={!isEditing} 
                      style={{ ...inputStyle, background: isEditing ? '#fff' : 'transparent', fontWeight: 800, fontSize: '18px' }} 
                      value={isEditing ? form.a_fiyat : stok.a_fiyat} 
                      onChange={e => setForm({...form, a_fiyat: e.target.value})} 
                    />
                    <span style={{ position: 'absolute', right: '16px', top: '14px', fontWeight: 800, color: '#94a3b8' }}>₺</span>
                  </div>
               </div>
               <div>
                  <label style={labelStyle}>Satış Fiyatı</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" step="0.01" 
                      disabled={!isEditing} 
                      style={{ ...inputStyle, background: isEditing ? '#fff' : 'transparent', fontWeight: 800, fontSize: '18px', color: '#3b82f6' }} 
                      value={isEditing ? form.s_fiyat : stok.s_fiyat} 
                      onChange={e => setForm({...form, s_fiyat: e.target.value})} 
                    />
                    <span style={{ position: 'absolute', right: '16px', top: '14px', fontWeight: 800, color: '#3b82f6' }}>₺</span>
                  </div>
               </div>
               <div>
                  <label style={labelStyle}>KDV Oranı</label>
                  {isEditing ? (
                    <select style={inputStyle} value={form.kdv_oran} onChange={e => setForm({...form, kdv_oran: e.target.value})}>
                      <option value="0">%0</option>
                      <option value="1">%1</option>
                      <option value="10">%10</option>
                      <option value="20">%20</option>
                    </select>
                  ) : (
                    <div style={{ ...inputStyle, background: 'transparent', fontWeight: 800, fontSize: '18px' }}>%{stok.kdv_oran}</div>
                  )}
               </div>

               <div style={{ borderTop: '1px solid #e2e8f0', gridColumn: 'span 3', padding: '12px 0 0' }}></div>

               <div>
                  <label style={labelStyle}>Mevcut Stok</label>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: stok.miktar <= (stok.kritik_seviye || 10) ? '#ef4444' : '#10b981' }}>
                    {stok.miktar} <span style={{ fontSize: '16px' }}>{stok.birim}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Stok miktarı hareketler ile güncellenir.</p>
               </div>
               <div>
                  <label style={labelStyle}>Kritik Seviye</label>
                  <input 
                    type="number" 
                    disabled={!isEditing} 
                    style={{ ...inputStyle, background: isEditing ? '#fff' : 'transparent', fontWeight: 700 }} 
                    value={isEditing ? form.kritik_seviye : stok.kritik_seviye} 
                    onChange={e => setForm({...form, kritik_seviye: e.target.value})} 
                  />
               </div>
            </div>

            <div>
               <label style={labelStyle}>Açıklama / Notlar</label>
               <textarea 
                  disabled={!isEditing} 
                  rows={3} 
                  style={{ ...inputStyle, background: isEditing ? '#fff' : '#f8fafc', resize: 'none' }} 
                  value={isEditing ? form.aciklama : (stok.aciklama || 'Açıklama bulunmuyor.')} 
                  onChange={e => setForm({...form, aciklama: e.target.value})} 
               />
            </div>

            {isEditing && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#fff', borderTop: '1px solid #e2e8f0', padding: '24px 0 0' }}>
                 <button type="button" onClick={() => setIsEditing(false)} disabled={saving} style={{ padding: '14px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                 <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '14px 40px', borderRadius: '12px' }}>
                    {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                 </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {toast && (
        <div className="toast-container" style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 1000 }}>
          <div className={`toast toast-${toast.type}`} style={{ padding: '16px 24px', borderRadius: '12px', background: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}
