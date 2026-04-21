"use client"

import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  stokId: number | null
  stokAd: string
  mevcutMiktar: number
  resimYolu?: string
}

const inputStyle = { width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }

export default function StokHareketiModal({ isOpen, onClose, onSuccess, stokId, stokAd, mevcutMiktar, resimYolu }: Props) {
  const [type, setType] = useState<'Giriş' | 'Çıkış' | 'Düzeltme'>('Giriş')
  const [miktar, setMiktar] = useState('')
  const [birimFiyat, setBirimFiyat] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [resimUrl, setResimUrl] = useState(resimYolu || '')
  const [saving, setSaving] = useState(false)

  if (!isOpen || !stokId) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const islemMiktar = parseFloat(miktar) || 0
    if (islemMiktar <= 0 && type !== 'Düzeltme') {
      alert('Geçerli bir miktar giriniz.')
      return
    }

    if (type === 'Çıkış' && islemMiktar > mevcutMiktar) {
      alert(`Stok yetersiz! Mevcut stok: ${mevcutMiktar}`)
      return
    }

    setSaving(true)
    try {
      // 1. Stok tablosunda miktarı güncelle
      if (type === 'Düzeltme') {
        // Düzeltmede direkt miktar set edilir. Değişim miktarını hesapla ki log'da görebilelim.
        const fark = islemMiktar - mevcutMiktar
        // Sıfır fark varsa hareket yazmaya gerek yok
        if (fark !== 0) {
           await supabase.from('stok').update({ miktar: islemMiktar }).eq('id', stokId)
           await supabase.from('stok_hareket').insert([{
             stok_id: stokId, hareket_turu: 'Düzeltme', miktar: Math.abs(fark), 
             birim_fiyat: parseFloat(birimFiyat) || null, aciklama: aciklama || `Manuel düzeltme yapıldı: ${mevcutMiktar} -> ${islemMiktar}`,
             kullaniciadi: (await supabase.auth.getUser()).data.user?.email || 'admin', subeadi: 'Merkez'
           }])
        }
      } else {
        // Normal Giriş / Çıkış: RPC kullanımı
        const degisim = type === 'Giriş' ? islemMiktar : -islemMiktar
        await supabase.rpc('update_stok_miktar', { s_id: stokId, degisim: degisim })
        await supabase.from('stok_hareket').insert([{
          stok_id: stokId, hareket_turu: type, miktar: islemMiktar, 
          birim_fiyat: parseFloat(birimFiyat) || null, aciklama: aciklama || `Manuel ${type} İşlemi`,
          kullaniciadi: (await supabase.auth.getUser()).data.user?.email || 'admin', subeadi: 'Merkez'
        }])
      }

      // 2. Resim yolu güncellendiyse stok tablosunu güncelle
      if (resimUrl !== resimYolu) {
        await supabase.from('stok').update({ resimyolu: resimUrl }).eq('id', stokId)
      }

      // 3. Başarılı Tamamlama
      setMiktar('')
      setBirimFiyat('')
      setAciklama('')
      setType('Giriş')
      onSuccess()
      onClose()
    } catch (err: any) {
       alert(err.message)
    } finally {
       setSaving(false)
    }
  }

  // Dinamik Buton Rengi
  const btnColor = type === 'Giriş' ? '#10b981' : type === 'Çıkış' ? '#ef4444' : '#3b82f6'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
       <div style={{ background: '#fff', width: '380px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', overflow: 'hidden', animation: 'modalSlideIn 0.2s ease-out' }}>
          
          <div style={{ padding: '24px 24px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
               <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>Stok Hareketi</h3>
               <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Ürün: <span style={{ color: '#0f172a' }}>{stokAd}</span></p>
             </div>
             <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}>✖</button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div>
                <label style={labelStyle}>İşlem Türü</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                   {['Giriş', 'Çıkış', 'Düzeltme'].map(t => (
                      <button 
                         type="button" key={t} onClick={() => setType(t as any)}
                         style={{ 
                            flex: 1, padding: '10px 0', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: '0.2s',
                            background: type === t ? btnColor : '#f1f5f9',
                            color: type === t ? '#fff' : '#64748b', border: 'none'
                         }}>
                         {t}
                      </button>
                   ))}
                </div>
             </div>

             <div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={labelStyle}>{type === 'Düzeltme' ? 'Yeni Stok Miktarı *' : 'İşlem Miktarı *'}</label>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>Mevcut: {mevcutMiktar}</span>
               </div>
               <input autoFocus type="number" step="0.01" required style={inputStyle} value={miktar} onChange={e => setMiktar(e.target.value)} placeholder="0.00" />
             </div>

             <div>
               <label style={labelStyle}>Birim Fiyat (Opsiyonel ₺)</label>
               <input type="number" step="0.01" style={inputStyle} value={birimFiyat} onChange={e => setBirimFiyat(e.target.value)} placeholder="Örn: 15.50" />
             </div>

             <div>
               <label style={labelStyle}>Açıklama / Not</label>
               <textarea rows={2} style={{ ...inputStyle, resize: 'none' }} value={aciklama} onChange={e => setAciklama(e.target.value)} placeholder="Sebebini belirtebilirsiniz..." />
             </div>

             <div>
               <label style={labelStyle}>Ürün Görseli (URL)</label>
               <input type="text" style={inputStyle} value={resimUrl} onChange={e => setResimUrl(e.target.value)} placeholder="https://...image.jpg" />
             </div>

             <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 800, cursor: 'pointer' }}>İptal</button>
                <button type="submit" disabled={saving || !miktar} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: btnColor, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                   {saving ? '...' : (type === 'Düzeltme' ? 'Güncelle' : 'Kaydet')}
                </button>
             </div>
          </form>

       </div>
    </div>
  )
}
