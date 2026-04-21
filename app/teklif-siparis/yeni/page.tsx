"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import CariSec from '@/app/components/CariSec'
import SmartProductSearch, { StokItem } from '@/app/components/SmartProductSearch'

const Icons = {
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  save: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  send: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
}

interface Kalem {
  id: string
  stok_id: number | null
  aciklama: string
  miktar: number
  birim: string
  birim_fiyat: number
  kdv_oran: number
  kdv_dahil: boolean
  toplam_tutar: number
}

export default function YeniTeklifPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [teklifNo, setTeklifNo] = useState('')
  const [cariId, setCariId] = useState('')
  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0])
  const [gecerlilikTarihi, setGecerlilikTarihi] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 15)
    return d.toISOString().split('T')[0]
  })
  const [tip, setTip] = useState('Teklif')
  const [notlar, setNotlar] = useState('')
  const [kalemler, setKalemler] = useState<Kalem[]>([])

  const [totals, setTotals] = useState({ araToplam: 0, kdvToplam: 0, genelToplam: 0 })

  useEffect(() => {
    setTeklifNo(`TKL-${Date.now()}`)
  }, [])

  // Calculate totals
  useEffect(() => {
    let ara = 0
    let kdv = 0
    let genel = 0

    kalemler.forEach(k => {
      const lineAmount = k.miktar * k.birim_fiyat
      let lineKDV = 0
      let lineTotal = 0
      let lineBase = 0

      if (k.kdv_dahil) {
        lineTotal = lineAmount
        lineBase = lineAmount / (1 + k.kdv_oran / 100)
        lineKDV = lineTotal - lineBase
      } else {
        lineBase = lineAmount
        lineKDV = lineAmount * (k.kdv_oran / 100)
        lineTotal = lineAmount + lineKDV
      }

      ara += lineBase
      kdv += lineKDV
      genel += lineTotal
    })

    setTotals({ araToplam: ara, kdvToplam: kdv, genelToplam: genel })
  }, [kalemler])

  const addKalem = () => {
    const newKalem: Kalem = {
      id: Math.random().toString(36).substr(2, 9),
      stok_id: null,
      aciklama: '',
      miktar: 1,
      birim: 'Adet',
      birim_fiyat: 0,
      kdv_oran: 20,
      kdv_dahil: true,
      toplam_tutar: 0
    }
    setKalemler([...kalemler, newKalem])
  }

  const removeKalem = (id: string) => {
    setKalemler(kalemler.filter(k => k.id !== id))
  }

  const updateKalem = (id: string, updates: Partial<Kalem>) => {
    setKalemler(kalemler.map(k => k.id === id ? { ...k, ...updates } : k))
  }

  const onSelectProduct = (id: string, product: StokItem) => {
    updateKalem(id, {
      stok_id: product.id,
      aciklama: product.ad,
      birim: product.birim,
      birim_fiyat: product.s_fiyat,
      kdv_oran: product.kdv_oran
    })
  }

  const saveTeklif = async (durum: string) => {
    if (!cariId) { alert('Lütfen müşteri seçin'); return }
    if (kalemler.length === 0) { alert('Lütfen en az bir kalem ekleyin'); return }

    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userEmail = userData.user?.email || 'admin'

      const { data: tData, error: tErr } = await supabase.from('teklif').insert([{
        teklif_no: teklifNo,
        cari_id: parseInt(cariId),
        tarih: new Date(tarih).toISOString(),
        gecerlilik_tarihi: new Date(gecerlilikTarihi).toISOString(),
        durum: durum,
        tip: tip,
        toplam: totals.araToplam,
        kdv_toplam: totals.kdvToplam,
        genel_toplam: totals.genelToplam,
        notlar: notlar,
        kullaniciadi: userEmail,
        subeadi: 'Merkez'
      }]).select().single()

      if (tErr) throw tErr

      const kalemPayload = kalemler.map(k => ({
        teklif_id: tData.id,
        stok_id: k.stok_id,
        aciklama: k.aciklama,
        miktar: k.miktar,
        birim: k.birim,
        birim_fiyat: k.birim_fiyat,
        kdv_oran: k.kdv_oran,
        kdv_dahil: k.kdv_dahil,
        toplam_tutar: k.kdv_dahil ? (k.miktar * k.birim_fiyat) : (k.miktar * k.birim_fiyat * (1 + k.kdv_oran/100)),
        kullaniciadi: userEmail,
        subeadi: 'Merkez'
      }))

      const { error: kErr } = await supabase.from('teklif_kalem').insert(kalemPayload)
      if (kErr) throw kErr

      router.push('/teklif-siparis')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }
  const inputStyle = { width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', background: '#fff' }

  return (
    <div className="animate-fadeIn">
      {/* Top Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => router.back()} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>{Icons.back}</button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Yeni {tip} Hazırla</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Müşteriniz için profesyonel bir evrak oluşturun.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* General Info Card */}
          <div className="card">
            <div className="card-header">Genel Bilgiler</div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
               <div style={{ gridColumn: 'span 2' }}>
                 <label style={labelStyle}>Müşteri Seçimi *</label>
                 <CariSec value={cariId} onChange={setCariId} />
               </div>
               <div>
                 <label style={labelStyle}>Evrak No</label>
                 <input style={inputStyle} value={teklifNo} readOnly />
               </div>
               <div>
                 <label style={labelStyle}>Evrak Tipi</label>
                 <select style={inputStyle} value={tip} onChange={e => setTip(e.target.value)}>
                    <option value="Teklif">Teklif</option>
                    <option value="Sipariş">Sipariş</option>
                 </select>
               </div>
               <div>
                 <label style={labelStyle}>Tarih</label>
                 <input type="date" style={inputStyle} value={tarih} onChange={e => setTarih(e.target.value)} />
               </div>
               <div>
                 <label style={labelStyle}>Geçerlilik Tarihi</label>
                 <input type="date" style={inputStyle} value={gecerlilikTarihi} onChange={e => setGecerlilikTarihi(e.target.value)} />
               </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Hizmet ve Ürün Kalemleri</h3>
               <button onClick={addKalem} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}>{Icons.plus} Satır Ekle</button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                     <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Ürün / Açıklama</th>
                        <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '80px' }}>Miktar</th>
                        <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '100px' }}>Birim Fiyat</th>
                        <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '80px' }}>KDV</th>
                        <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '100px' }}>Toplam</th>
                        <th style={{ width: '50px' }}></th>
                     </tr>
                  </thead>
                  <tbody>
                     {kalemler.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Henüz kalem eklenmedi. "Satır Ekle" butonuyla başlayın.</td></tr>
                     )}
                     {kalemler.map(k => (
                        <tr key={k.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                           <td style={{ padding: '12px 20px' }}>
                              <SmartProductSearch 
                                value={k.aciklama} 
                                onChange={val => updateKalem(k.id, { aciklama: val })}
                                onSelect={p => onSelectProduct(k.id, p)}
                              />
                           </td>
                           <td style={{ padding: '12px 20px' }}>
                              <input type="number" style={{ ...inputStyle, padding: '8px', textAlign: 'center' }} value={k.miktar} onChange={e => updateKalem(k.id, { miktar: parseFloat(e.target.value) || 0 })} />
                           </td>
                           <td style={{ padding: '12px 20px' }}>
                              <input type="number" style={{ ...inputStyle, padding: '8px', textAlign: 'right' }} value={k.birim_fiyat} onChange={e => updateKalem(k.id, { birim_fiyat: parseFloat(e.target.value) || 0 })} />
                           </td>
                           <td style={{ padding: '12px 20px' }}>
                              <select style={{ ...inputStyle, padding: '8px' }} value={k.kdv_oran} onChange={e => updateKalem(k.id, { kdv_oran: parseInt(e.target.value) })}>
                                 <option value={0}>%0</option>
                                 <option value={1}>%1</option>
                                 <option value={10}>%10</option>
                                 <option value={20}>%20</option>
                              </select>
                              <div style={{ marginTop: '4px', textAlign: 'center' }}>
                                <label style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <input type="checkbox" checked={k.kdv_dahil} onChange={e => updateKalem(k.id, { kdv_dahil: e.target.checked })} />
                                  Dahil
                                </label>
                              </div>
                           </td>
                           <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                              {(k.kdv_dahil ? (k.miktar * k.birim_fiyat) : (k.miktar * k.birim_fiyat * (1 + k.kdv_oran/100))).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                           </td>
                           <td style={{ padding: '12px 20px' }}>
                              <button onClick={() => removeKalem(k.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>{Icons.trash}</button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'sticky', top: '20px' }}>
           <div className="card">
              <div className="card-header">Evrak Özeti</div>
              <div className="card-body">
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                       <span style={{ color: '#64748b', fontWeight: 600 }}>Ara Toplam</span>
                       <span style={{ fontWeight: 700 }}>{totals.araToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                       <span style={{ color: '#64748b', fontWeight: 600 }}>KDV Toplam</span>
                       <span style={{ fontWeight: 700 }}>{totals.kdvToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                    </div>
                    <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
                       <span style={{ color: '#0f172a', fontWeight: 800 }}>Genel Toplam</span>
                       <span style={{ color: '#3b82f6', fontWeight: 900 }}>{totals.genelToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                    </div>
                 </div>

                 <div style={{ marginTop: '32px' }}>
                    <label style={labelStyle}>Teklif Notları</label>
                    <textarea 
                      style={{ ...inputStyle, height: '100px', resize: 'none' }} 
                      placeholder="Örn: Geçerlilik süresi 15 gündür. Nakliye dahil değildir."
                      value={notlar}
                      onChange={e => setNotlar(e.target.value)}
                    />
                 </div>

                 <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button 
                      disabled={loading} 
                      onClick={() => saveTeklif('Onay Bekliyor')}
                      className="btn-primary" 
                      style={{ width: '100%', height: '52px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                      {Icons.send} {loading ? 'Gönderiliyor...' : 'Onaya Gönder'}
                    </button>
                    <button 
                      disabled={loading} 
                      onClick={() => saveTeklif('Taslak')}
                      className="btn-secondary" 
                      style={{ width: '100%', height: '52px', fontSize: '15px', color: '#475569', fontWeight: 700 }}
                    >
                      {Icons.save} {loading ? 'Kaydediliyor...' : 'Taslak Olarak Kaydet'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
