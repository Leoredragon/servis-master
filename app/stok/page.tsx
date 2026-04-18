"use client"

import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import SlideOver from '../components/SlideOver'
import Pagination from '../components/Pagination'

const KATEGORILER = [
  "Filtre ve Bakım", "Mekanik/Motor", "Elektrik", "Kaporta/Aksesuar", "Sarf Malzeme", "Diğer"
]

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', color: '#0f172a', background: '#fff', boxSizing: 'border-box', transition: 'border-color 0.2s' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }

export default function Stok() {
  const [urunler,  setUrunler]  = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [arama,    setArama]    = useState('')
  const [modalAcik,setModalAcik]= useState(false)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState<{ type: 'success' | 'error', msg: string } | null>(null)
  const [confirmData, setConfirmData] = useState<{ open: boolean, item: any }>({ open: false, item: null })
  const [form, setForm] = useState({
    id: null as number | null,
    kod: '', ad: '', kategori: 'Filtre ve Bakım', barkod: '', birim: 'Adet',
    a_fiyat: '', s_fiyat: '', kdv_oran: '20', miktar: '0', kritik_seviye: '5', aciklama: ''
  })
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000) }

  const loadUrunler = async () => {
    setLoading(true)
    const { data } = await supabase.from('stok').select('*').order('ad')
    setUrunler(data || [])
    setLoading(false)
  }

  useEffect(() => { loadUrunler() }, [])

  useEffect(() => {
    const q = arama.toLowerCase()
    setFiltered(!q ? urunler : urunler.filter(u =>
      (u.ad||'').toLowerCase().includes(q) ||
      (u.kod||'').toLowerCase().includes(q) ||
      (u.kategori||'').toLowerCase().includes(q) ||
      (u.barkod||'').toLowerCase().includes(q)
    ))
    setCurrentPage(1)
  }, [arama, urunler])

  const paginatedResults = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      kod: form.kod || null,
      ad: form.ad,
      kategori: form.kategori,
      barkod: form.barkod || null,
      birim: form.birim,
      a_fiyat: parseFloat(form.a_fiyat) || 0,
      s_fiyat: parseFloat(form.s_fiyat) || 0,
      kdv_oran: parseInt(form.kdv_oran) || 20,
      miktar: parseFloat(form.miktar) || 0,
      kritik_seviye: parseFloat(form.kritik_seviye) || 0,
      aciklama: form.aciklama || null
    }

    let error
    if (form.id) {
      // Değişiklik kontrolü için eski veriyi al
      const { data: old } = await supabase.from('stok').select('miktar').eq('id', form.id).single()
      
      const res = await supabase.from('stok').update(payload).eq('id', form.id)
      error = res.error

      if (!error && old && parseFloat(form.miktar) !== old.miktar) {
        const diff = parseFloat(form.miktar) - old.miktar
        await supabase.from('stok_hareket').insert([{
          stok_id: form.id,
          hareket_turu: 'Düzeltme',
          miktar: Math.abs(diff),
          notlar: `Manuel miktar düzeltmesi (${old.miktar} -> ${form.miktar})`
        }])
      }
    } else {
      const res = await supabase.from('stok').insert([payload]).select()
      error = res.error
      // İlk giriş kaydını harelete ekle
      if (!error && res.data && res.data[0]) {
        await supabase.from('stok_hareket').insert([{
          stok_id: res.data[0].id,
          hareket_turu: 'Giriş',
          miktar: payload.miktar,
          birim_fiyat: payload.a_fiyat,
          notlar: 'Açılış bakiyesi'
        }])
      }
    }

    setSaving(false)
    if (error) { showToast('Hata: ' + error.message, 'error'); return }
    setModalAcik(false)
    setForm({ id: null, kod:'', ad:'', kategori:'Filtre ve Bakım', barkod:'', birim:'Adet', a_fiyat:'', s_fiyat:'', kdv_oran:'20', miktar: '0', kritik_seviye: '5', aciklama: '' })
    showToast(form.id ? 'Ürün güncellendi' : 'Ürün başarıyla eklendi')
    await loadUrunler()
  }

  const handleSil = async (id: number) => {
    const { error } = await supabase.from('stok').delete().eq('id', id)
    if (error) { showToast('Silinemedi: ' + error.message); return }
    showToast('Ürün silindi')
    await loadUrunler()
  }

  return (
    <div className="animate-fadeIn" style={{ width: '100%', padding: '0 40px', boxSizing: 'border-box' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 3000, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', padding: '14px 24px', borderRadius: '14px', fontSize: '14px', fontWeight: 800, boxShadow: '0 10px 25px -4px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', marginTop: '10px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>Yedek Parça & Stok</h1>
          <p style={{ color: '#64748b', fontSize: '15px', margin: '4px 0 0', fontWeight: 500 }}>
            Toplam <span style={{ color: '#0f172a', fontWeight: 700 }}>{urunler.length}</span> kalem stok kartı
          </p>
        </div>
        <button 
          onClick={() => {
            setForm({ id: null, kod:'', ad:'', kategori:'Filtre ve Bakım', barkod:'', birim:'Adet', a_fiyat:'', s_fiyat:'', kdv_oran:'20', miktar: '0', kritik_seviye: '5', aciklama: '' })
            setModalAcik(true)
          }} 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', padding: '12px 24px', borderRadius: '14px', fontWeight: 800, fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.25)', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Yeni Stok Kartı
        </button>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
        {[
          { label: 'Kritik Stokta', val: urunler.filter(u => u.miktar <= (u.kritik_seviye||0)).length, color: '#ef4444', bg: '#fef2f2' },
          { label: 'Toplam Adet', val: urunler.reduce((s, u) => s + (u.miktar||0), 0).toFixed(0), color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Stok Değeri (Alış)', val: urunler.reduce((s, u) => s + (u.miktar * u.a_fiyat), 0).toLocaleString('tr-TR'), suffix: ' ₺', color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'Tahmini Kazanç', val: urunler.reduce((s, u) => s + (u.miktar * (u.s_fiyat - u.a_fiyat)), 0).toLocaleString('tr-TR'), suffix: ' ₺', color: '#10b981', bg: '#f0fdf4' }
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: s.color, marginTop: '8px' }}>
              {s.val}{s.suffix}
              {s.label === 'Kritik Stokta' && s.val > 0 && <span style={{ marginLeft: '8px', fontSize: '14px', background: s.color, color: '#fff', padding: '2px 8px', borderRadius: '6px' }}>ALARM</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input type="text" placeholder="Ürün adı, kod veya barkod ile hızlı ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStyle, paddingLeft: '44px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Filtre ve Bakım', 'Mekanik/Motor'].map(cat => (
              <button key={cat} onClick={() => setArama(arama === cat ? '' : cat)} style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: '1px solid #e2e8f0', background: arama === cat ? '#0f172a' : '#fff', color: arama === cat ? '#fff' : '#64748b' }}>{cat}</button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '100px', textAlign: 'center' }}>
               <div style={{ width: '40px', height: '40px', margin: '0 auto', border: '4px solid #f1f5f9', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
               <p style={{ marginTop: '16px', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Veriler yükleniyor...</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Durum', 'Kod / Barkod', 'Ürün Bilgisi', 'Kategori', 'Miktar', 'Alış / Satış', 'İşlemler'].map(h => (
                    <th key={h} style={{ padding: '16px 24px', textAlign: h === 'İşlemler' || h === 'Alış / Satış' ? 'right' : 'left', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((u, idx) => {
                  const isLow = u.miktar <= (u.kritik_seviye || 0)
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fcfdfe'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '18px 24px' }}>
                         <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isLow ? '#ef4444' : '#10b981', boxShadow: isLow ? '0 0 8px #ef444466' : 'none' }} />
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 750, color: '#1e293b', fontFamily: 'var(--font-mono)' }}>{u.kod || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{u.barkod || 'Barkodsuz'}</div>
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{u.ad}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{u.birim}</div>
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        <span style={{ padding: '6px 12px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontSize: '12px', fontWeight: 700 }}>{u.kategori || 'Genel'}</span>
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: isLow ? '#ef4444' : '#0f172a' }}>
                          {u.miktar} <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>{u.birim}</span>
                        </div>
                        {isLow && <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>Kritik Seviye! ({u.kritik_seviye})</div>}
                      </td>
                      <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                         <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Alış: {u.a_fiyat?.toFixed(2)} ₺</div>
                         <div style={{ fontSize: '16px', fontWeight: 900, color: '#059669', marginTop: '2px' }}>{u.s_fiyat?.toFixed(2)} ₺</div>
                      </td>
                      <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => {
                              setForm({ ...u, a_fiyat: u.a_fiyat.toString(), s_fiyat: u.s_fiyat.toString(), miktar: u.miktar.toString(), kritik_seviye: u.kritik_seviye.toString(), kdv_oran: u.kdv_oran.toString() })
                              setModalAcik(true)
                            }}
                            style={{ padding: '8px 12px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          >Detay</button>
                          <button onClick={() => setConfirmData({ open: true, item: u })} style={{ padding: '8px 12px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Sil</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {paginatedResults.length === 0 && <tr><td colSpan={7} style={{ padding: '100px', textAlign: 'center', color: '#94a3b8', fontSize: '15px', fontWeight: 600 }}>Ürün bulunamadı</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        <Pagination 
          totalItems={filtered.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ─── SLIDEOVER FORM ─── */}
      <SlideOver
        isOpen={modalAcik}
        onClose={() => setModalAcik(false)}
        title={form.id ? 'Stok Kartı Düzenle' : 'Yeni Stok Kartı'}
        subtitle="Ürün detaylarını ve stok seviyelerini girin."
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Ürün Adı *</label>
              <input style={inputStyle} type="text" placeholder="Örn: Yağ Filtresi" value={form.ad} onChange={e => setForm({...form, ad: e.target.value})} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <div>
                 <label style={labelStyle}>Stok Kodu</label>
                 <input style={inputStyle} type="text" placeholder="ST-..." value={form.kod} onChange={e => setForm({...form, kod: e.target.value})} />
               </div>
               <div>
                 <label style={labelStyle}>Barkod</label>
                 <input style={inputStyle} type="text" placeholder="Scanning..." value={form.barkod} onChange={e => setForm({...form, barkod: e.target.value})} />
               </div>
            </div>
            <div>
              <label style={labelStyle}>Kategori</label>
              <select style={inputStyle} value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})}>
                {KATEGORILER.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <div>
                  <label style={labelStyle}>Birim</label>
                  <select style={inputStyle} value={form.birim} onChange={e => setForm({...form, birim: e.target.value})}>
                    {['Adet', 'Litre', 'Set', 'Kg', 'Metre'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
               </div>
               <div>
                 <label style={labelStyle}>KDV Oranı</label>
                 <select style={inputStyle} value={form.kdv_oran} onChange={e => setForm({...form, kdv_oran: e.target.value})}>
                   {['0','1','10','20'].map(k => <option key={k} value={k}>%{k}</option>)}
                 </select>
               </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Finansal Bilgiler & Stok</h4>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                   <label style={labelStyle}>Alış Fiyatı (₺)</label>
                   <input style={inputStyle} type="number" step="0.01" value={form.a_fiyat} onChange={e => setForm({...form, a_fiyat: e.target.value})} />
                </div>
                <div>
                   <label style={labelStyle}>Satış Fiyatı (₺)</label>
                   <input style={inputStyle} type="number" step="0.01" value={form.s_fiyat} onChange={e => setForm({...form, s_fiyat: e.target.value})} required />
                </div>
                <div>
                   <label style={labelStyle}>Mevcut Stok</label>
                   <input style={inputStyle} type="number" value={form.miktar} onChange={e => setForm({...form, miktar: e.target.value})} />
                </div>
                <div>
                   <label style={labelStyle}>Kritik Seviye</label>
                   <input style={inputStyle} type="number" value={form.kritik_seviye} onChange={e => setForm({...form, kritik_seviye: e.target.value})} />
                </div>
             </div>
          </div>

          <div>
             <label style={labelStyle}>Açıklama</label>
             <textarea style={{ ...inputStyle, height: '100px', resize: 'none' }} value={form.aciklama} onChange={e => setForm({...form, aciklama: e.target.value})} />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
              {saving ? 'Kaydediliyor...' : (form.id ? 'Güncelle' : 'Ürünü Kaydet')}
            </button>
            <button type="button" onClick={() => setModalAcik(false)} style={{ padding: '16px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>İptal</button>
          </div>
        </form>
      </SlideOver>

      <ConfirmModal 
        isOpen={confirmData.open}
        onClose={() => setConfirmData({ open: false, item: null })}
        onConfirm={() => handleSil(confirmData.item.id)}
        type="danger"
        title="Stok Kartını Sil"
        message={`${confirmData.item?.ad} isimli ürünü stoka siliyorsunuz. Bu ürünün geçmiş hareketleri de silinecektir. Emin misiniz?`}
      />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}