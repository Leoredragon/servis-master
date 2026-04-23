"use client"

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Modal from './Modal'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  stokId: number | null
  stokAd: string
  mevcutMiktar: number
  resimYolu?: string
}

const inputStyle = { width: '100%', padding: '14px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', background: '#fff' }
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' as const }

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
      if (type === 'Düzeltme') {
        const fark = islemMiktar - mevcutMiktar
        if (fark !== 0) {
           await supabase.from('stok').update({ miktar: islemMiktar }).eq('id', stokId)
           await supabase.from('stok_hareket').insert([{
             stok_id: stokId, hareket_turu: 'Düzeltme', miktar: Math.abs(fark), 
             birim_fiyat: parseFloat(birimFiyat) || null, aciklama: aciklama || `Manuel düzeltme yapıldı: ${mevcutMiktar} -> ${islemMiktar}`,
             kullaniciadi: (await supabase.auth.getUser()).data.user?.email || 'admin', subeadi: 'Merkez'
           }])
        }
      } else {
        const degisim = type === 'Giriş' ? islemMiktar : -islemMiktar
        await supabase.rpc('update_stok_miktar', { s_id: stokId, degisim: degisim })
        await supabase.from('stok_hareket').insert([{
          stok_id: stokId, hareket_turu: type, miktar: islemMiktar, 
          birim_fiyat: parseFloat(birimFiyat) || null, aciklama: aciklama || `Manuel ${type} İşlemi`,
          kullaniciadi: (await supabase.auth.getUser()).data.user?.email || 'admin', subeadi: 'Merkez'
        }])
      }

      if (resimUrl !== resimYolu) {
        await supabase.from('stok').update({ resimyolu: resimUrl }).eq('id', stokId)
      }

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

  const btnColor = type === 'Giriş' ? '#10b981' : type === 'Çıkış' ? '#ef4444' : '#3b82f6'

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Stok Hareketi İşlemi" 
      subtitle={`Ürün: ${stokAd}`}
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
         <div>
            <label style={labelStyle}>İşlem Türü</label>
            <div style={{ display: 'flex', gap: '10px' }}>
               {['Giriş', 'Çıkış', 'Düzeltme'].map(t => (
                  <button 
                     type="button" key={t} onClick={() => setType(t as any)}
                     style={{ 
                        flex: 1, padding: '14px 0', borderRadius: '12px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                        background: type === t ? btnColor : '#f1f5f9',
                        color: type === t ? '#fff' : '#64748b', border: 'none',
                        boxShadow: type === t ? `0 4px 12px ${btnColor}44` : 'none'
                     }}>
                     {t}
                  </button>
               ))}
            </div>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <label style={labelStyle}>{type === 'Düzeltme' ? 'Yeni Miktar *' : 'İşlem Miktarı *'}</label>
                 <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800 }}>Mevcut: {mevcutMiktar}</span>
              </div>
              <input autoFocus type="number" step="0.01" required style={inputStyle} value={miktar} onChange={e => setMiktar(e.target.value)} placeholder="0.00" />
            </div>

            <div>
              <label style={labelStyle}>Birim Fiyat (₺)</label>
              <input type="number" step="0.01" style={inputStyle} value={birimFiyat} onChange={e => setBirimFiyat(e.target.value)} placeholder="Opsiyonel" />
            </div>
         </div>

         <div>
           <label style={labelStyle}>Açıklama / Not</label>
           <textarea rows={2} style={{ ...inputStyle, resize: 'none' }} value={aciklama} onChange={e => setAciklama(e.target.value)} placeholder="Sebevini veya detayları buraya yazabilirsiniz..." />
         </div>

         <div>
           <label style={labelStyle}>Ürün Görseli (URL)</label>
           <input type="text" style={inputStyle} value={resimUrl} onChange={e => setResimUrl(e.target.value)} placeholder="https://...image.jpg" />
         </div>

         <div style={{ display: 'flex', gap: '12px', marginTop: '8px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '16px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Vazgeç</button>
            <button type="submit" disabled={saving || !miktar} style={{ flex: 2, padding: '16px', borderRadius: '12px', background: btnColor, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 15px ${btnColor}44` }}>
               {saving ? 'İşleniyor...' : (type === 'Düzeltme' ? 'Miktarı Güncelle' : `${type} Kaydet`)}
            </button>
         </div>
      </form>
    </Modal>
  )
}
