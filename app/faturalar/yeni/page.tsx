"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import CariSec from '@/app/components/CariSec'
import SmartProductSearch, { StokItem } from '@/app/components/SmartProductSearch'

const Icons = {
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  save: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
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

export default function YeniFaturaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [evrakNo, setEvrakNo] = useState('')
  const [cariId, setCariId] = useState('')
  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0])
  const [tur, setTur] = useState('Satış')
  const [notlar, setNotlar] = useState('')
  const [kalemler, setKalemler] = useState<Kalem[]>([])

  const [totals, setTotals] = useState({ araToplam: 0, kdvToplam: 0, genelToplam: 0 })

  useEffect(() => {
    setEvrakNo(`FAT-${Date.now()}`)
  }, [])

  // Calculate totals
  useEffect(() => {
    let ara = 0, kdv = 0, genel = 0
    kalemler.forEach(k => {
      const lineAmount = k.miktar * k.birim_fiyat
      if (k.kdv_dahil) {
        genel += lineAmount
        const base = lineAmount / (1 + k.kdv_oran / 100)
        ara += base
        kdv += (lineAmount - base)
      } else {
        ara += lineAmount
        const tax = lineAmount * (k.kdv_oran / 100)
        kdv += tax
        genel += (lineAmount + tax)
      }
    })
    setTotals({ araToplam: ara, kdvToplam: kdv, genelToplam: genel })
  }, [kalemler])

  const addKalem = () => {
    setKalemler([...kalemler, { id: Math.random().toString(36).substr(2, 9), stok_id: null, aciklama: '', miktar: 1, birim: 'Adet', birim_fiyat: 0, kdv_oran: 20, kdv_dahil: true, toplam_tutar: 0 }])
  }

  const updateKalem = (id: string, updates: Partial<Kalem>) => {
    setKalemler(kalemler.map(k => k.id === id ? { ...k, ...updates } : k))
  }

  const saveFatura = async () => {
    if (!cariId) { alert('Lütfen müşteri seçin'); return }
    if (kalemler.length === 0) { alert('Lütfen en az bir kalem ekleyin'); return }

    setLoading(true)
    try {
      // 1. Header Insertion
      const { data: fData, error: fErr } = await supabase.from('fatura').insert([{
        evrak_no: evrakNo,
        cari_id: parseInt(cariId),
        fat_tarih: new Date(tarih).toISOString(),
        fatura_turu: tur,
        toplam: totals.araToplam,
        kdv: totals.kdvToplam,
        gtoplam: totals.genelToplam,
        aciklama: notlar,
        odeme_durumu: 'Bekliyor',
        kullaniciadi: 'admin',
        subeadi: 'Merkez'
      }]).select().single()

      if (fErr) throw fErr

      // 2. Items Insertion
      const kalemPayload = kalemler.map(k => ({
        fatura_id: fData.id,
        stok_id: k.stok_id,
        aciklama: k.aciklama,
        miktar: k.miktar,
        birim: k.birim,
        birim_fiyat: k.birim_fiyat,
        kdv_oran: k.kdv_oran,
        kdv_dahil: k.kdv_dahil,
        toplam_tutar: k.kdv_dahil ? (k.miktar * k.birim_fiyat) : (k.miktar * k.birim_fiyat * (1 + k.kdv_oran/100)),
        kullaniciadi: 'admin',
        subeadi: 'Merkez'
      }))

      const { error: kErr } = await supabase.from('fat_isl').insert(kalemPayload)
      if (kErr) throw kErr

      router.push('/faturalar')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }
  const inputStyle = { width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', background: '#fff' }

  return (
    <div className="animate-fadeIn" style={{ padding: '0 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => router.back()} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>{Icons.back}</button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Yeni Fatura Oluştur</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Satış veya alış faturası hazırlayarak cari bakiyeyi güncelleyin.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card">
            <div className="card-header">Fatura Başlık Bilgileri</div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
               <div style={{ gridColumn: 'span 2' }}>
                 <label style={labelStyle}>Müşteri / Cari *</label>
                 <CariSec value={cariId} onChange={setCariId} />
               </div>
               <div>
                 <label style={labelStyle}>Fatura No</label>
                 <input style={inputStyle} value={evrakNo} onChange={e => setEvrakNo(e.target.value)} />
               </div>
               <div>
                 <label style={labelStyle}>Fatura Türü</label>
                 <select style={inputStyle} value={tur} onChange={e => setTur(e.target.value)}>
                    <option value="Satış">Satış Faturası</option>
                    <option value="Alış">Alış Faturası</option>
                    <option value="İade">İade Faturası</option>
                 </select>
               </div>
               <div>
                 <label style={labelStyle}>Fatura Tarihi</label>
                 <input type="date" style={inputStyle} value={tarih} onChange={e => setTarih(e.target.value)} />
               </div>
            </div>
          </div>

          <div className="card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Fatura Kalemleri</h3>
               <button onClick={addKalem} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}>{Icons.plus} Satır Ekle</button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                     <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Açıklama</th>
                        <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '11px', color: '#94a3b8', width: '80px' }}>Miktar</th>
                        <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '11px', color: '#94a3b8', width: '110px' }}>Birim Fiyat</th>
                        <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '11px', color: '#94a3b8', width: '90px' }}>KDV</th>
                        <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: '11px', color: '#94a3b8', width: '110px' }}>Toplam</th>
                        <th style={{ width: '50px' }}></th>
                     </tr>
                  </thead>
                  <tbody>
                     {kalemler.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Henüz kalem eklenmedi.</td></tr>
                     )}
                     {kalemler.map(k => (
                        <tr key={k.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                           <td style={{ padding: '12px 20px' }}>
                              <SmartProductSearch 
                                value={k.aciklama} 
                                onChange={v => updateKalem(k.id, { aciklama: v })}
                                onSelect={p => updateKalem(k.id, { stok_id: p.id, aciklama: p.ad, birim: p.birim, birim_fiyat: p.s_fiyat, kdv_oran: p.kdv_oran })}
                              />
                           </td>
                           <td style={{ padding: '12px 20px' }}>
                              <input type="number" step="0.01" style={{ ...inputStyle, padding: '8px', textAlign: 'center' }} value={k.miktar} onChange={e => updateKalem(k.id, { miktar: parseFloat(e.target.value) || 0 })} />
                           </td>
                           <td style={{ padding: '12px 20px' }}>
                              <input type="number" step="0.01" style={{ ...inputStyle, padding: '8px', textAlign: 'right' }} value={k.birim_fiyat} onChange={e => updateKalem(k.id, { birim_fiyat: parseFloat(e.target.value) || 0 })} />
                           </td>
                           <td style={{ padding: '12px 20px' }}>
                              <select style={{ ...inputStyle, padding: '6px' }} value={k.kdv_oran} onChange={e => updateKalem(k.id, { kdv_oran: parseInt(e.target.value) })}>
                                 <option value={0}>%0</option>
                                 <option value={1}>%1</option>
                                 <option value={10}>%10</option>
                                 <option value={20}>%20</option>
                              </select>
                              <div style={{ marginTop: '4px', textAlign: 'center' }}>
                                <label style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                                  <input type="checkbox" checked={k.kdv_dahil} onChange={e => updateKalem(k.id, { kdv_dahil: e.target.checked })} /> Dahil
                                </label>
                              </div>
                           </td>
                           <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 700, fontSize: '14px' }}>
                              {(k.kdv_dahil ? (k.miktar * k.birim_fiyat) : (k.miktar * k.birim_fiyat * (1 + k.kdv_oran/100))).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                           </td>
                           <td style={{ padding: '12px 20px' }}>
                              <button onClick={() => setKalemler(kalemler.filter(x => x.id !== k.id))} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>{Icons.trash}</button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'sticky', top: '20px' }}>
           <div className="card">
              <div className="card-header">Fatura Özeti</div>
              <div className="card-body">
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                       <span style={{ color: '#0f172a', fontWeight: 800 }}>GENEL TOPLAM</span>
                       <span style={{ color: '#3b82f6', fontWeight: 900 }}>{totals.genelToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                    </div>
                 </div>

                 <div style={{ marginTop: '32px' }}>
                    <label style={labelStyle}>Fatura Notu / Açıklama</label>
                    <textarea 
                      style={{ ...inputStyle, height: '80px', resize: 'none' }} 
                      value={notlar}
                      onChange={e => setNotlar(e.target.value)}
                    />
                 </div>

                 <button 
                   disabled={loading} 
                   onClick={saveFatura}
                   className="btn-primary" 
                   style={{ width: '100%', height: '52px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '32px' }}
                 >
                   {Icons.save} {loading ? 'Kaydediliyor...' : 'Faturayı Kes / Kaydet'}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
