"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import CariSec from '@/app/components/CariSec'
import SmartProductSearch, { StokItem } from '@/app/components/SmartProductSearch'
import { useReactToPrint } from 'react-to-print'

const Icons = {
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  save: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  send: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  print: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  edit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}

interface Kalem {
  id: string
  db_id?: number
  stok_id: number | null
  aciklama: string
  miktar: number
  birim: string
  birim_fiyat: number
  kdv_oran: number
  kdv_dahil: boolean
  toplam_tutar: number
}

function ProposalDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const [teklifNo, setTeklifNo] = useState('')
  const [cariId, setCariId] = useState('')
  const [cariData, setCariData] = useState<any>(null)
  const [tarih, setTarih] = useState('')
  const [gecerlilikTarihi, setGecerlilikTarihi] = useState('')
  const [tip, setTip] = useState('Teklif')
  const [durum, setDurum] = useState('Taslak')
  const [notlar, setNotlar] = useState('')
  const [kalemler, setKalemler] = useState<Kalem[]>([])
  const [totals, setTotals] = useState({ araToplam: 0, kdvToplam: 0, genelToplam: 0 })

  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Teklif-${teklifNo}`
  })

  // Fetch Proposal Data
  useEffect(() => {
    if (!id) return

    const fetchProposal = async () => {
      setLoading(true)
      try {
        const { data: teklif, error: tErr } = await supabase
          .from('teklif')
          .select('*, cari_kart(*)')
          .eq('id', id)
          .single()

        if (tErr) throw tErr

        setTeklifNo(teklif.teklif_no)
        setCariId(teklif.cari_id.toString())
        setCariData(teklif.cari_kart)
        setTarih(teklif.tarih.split('T')[0])
        setGecerlilikTarihi(teklif.gecerlilik_tarihi?.split('T')[0] || '')
        setTip(teklif.tip)
        setDurum(teklif.durum)
        setNotlar(teklif.notlar || '')

        const { data: items, error: kErr } = await supabase
          .from('teklif_kalem')
          .select('*')
          .eq('teklif_id', id)

        if (kErr) throw kErr

        const mappedKalemler: Kalem[] = items.map(k => ({
          id: Math.random().toString(36).substr(2, 9),
          db_id: k.id,
          stok_id: k.stok_id,
          aciklama: k.aciklama,
          miktar: k.miktar,
          birim: k.birim,
          birim_fiyat: k.birim_fiyat,
          kdv_oran: k.kdv_oran,
          kdv_dahil: k.kdv_dahil,
          toplam_tutar: k.toplam_tutar
        }))
        setKalemler(mappedKalemler)
      } catch (err: any) {
        alert('Veri yükleme hatası: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProposal()
  }, [id])

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
    if (!isEditing) return
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
    if (!isEditing) return
    setKalemler(kalemler.filter(k => k.id !== id))
  }

  const updateKalem = (id: string, updates: Partial<Kalem>) => {
    if (!isEditing) return
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

  const saveTeklif = async (newDurum?: string) => {
    if (!cariId) { alert('Lütfen müşteri seçin'); return }
    if (kalemler.length === 0) { alert('Lütfen en az bir kalem ekleyin'); return }

    setSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userEmail = userData.user?.email || 'admin'

      const updatePayload = {
        teklif_no: teklifNo,
        cari_id: parseInt(cariId),
        tarih: new Date(tarih).toISOString(),
        gecerlilik_tarihi: gecerlilikTarihi ? new Date(gecerlilikTarihi).toISOString() : null,
        durum: newDurum || durum,
        tip: tip,
        toplam: totals.araToplam,
        kdv_toplam: totals.kdvToplam,
        genel_toplam: totals.genelToplam,
        notlar: notlar,
        kullaniciadi: userEmail,
        subeadi: 'Merkez'
      }

      const { error: tErr } = await supabase
        .from('teklif')
        .update(updatePayload)
        .eq('id', id)

      if (tErr) throw tErr

      // Delete old items and insert new ones (simplest way to handle updates)
      await supabase.from('teklif_kalem').delete().eq('teklif_id', id)

      const kalemPayload = kalemler.map(k => ({
        teklif_id: parseInt(id),
        stok_id: k.stok_id,
        aciklama: k.aciklama,
        miktar: k.miktar,
        birim: k.birim,
        birim_fiyat: k.birim_fiyat,
        kdv_oran: k.kdv_oran,
        kdv_dahil: k.kdv_dahil,
        toplam_tutar: k.kdv_dahil ? (k.miktar * k.birim_fiyat) : (k.total_amount || 0), // this will be recalculated
        kullaniciadi: userEmail,
        subeadi: 'Merkez'
      }))

      // Real totals for each line
      kalemPayload.forEach((kp, i) => {
        const k = kalemler[i]
        const lineAmount = k.miktar * k.birim_fiyat
        if (k.kdv_dahil) {
          kp.toplam_tutar = lineAmount
        } else {
          kp.toplam_tutar = lineAmount * (1 + k.kdv_oran / 100)
        }
      })

      const { error: kErr } = await supabase.from('teklif_kalem').insert(kalemPayload)
      if (kErr) throw kErr

      setIsEditing(false)
      if (newDurum) setDurum(newDurum)
      alert('Teklif başarıyla güncellendi.')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }
  const inputStyle = (disabled: boolean) => ({ 
    width: '100%', 
    padding: '12px 16px', 
    border: disabled ? '1.5px solid transparent' : '1.5px solid #e2e8f0', 
    borderRadius: '12px', 
    fontSize: '14px', 
    outline: 'none', 
    background: disabled ? '#f8fafc' : '#fff',
    color: '#0f172a',
    transition: 'all 0.2s'
  })

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center' }}><div className="skeleton" style={{ height: '400px', borderRadius: '24px' }}></div></div>
  }

  return (
    <div className="animate-fadeIn">
      {/* Top Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/teklif-siparis')} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>{Icons.back}</button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{tip} Detayı</h1>
            <p style={{ color: '#64748b', fontSize: '14px' }}>{teklifNo} numaralı evrakın detaylarını inceleyin.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!isEditing && (
            <>
              <button 
                onClick={handlePrint}
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
              >
                {Icons.print} Yazdır / PDF
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
              >
                {Icons.edit} Düzenle
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button 
                onClick={() => setIsEditing(false)}
                className="btn-secondary" 
                style={{ padding: '12px 24px' }}
              >
                İptal
              </button>
              <button 
                onClick={() => saveTeklif()}
                disabled={saving}
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
              >
                {Icons.save} {saving ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
            </>
          )}
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
                 {isEditing ? (
                   <CariSec value={cariId} onChange={setCariId} />
                 ) : (
                   <div style={inputStyle(true)}>{cariData?.yetkili || '—'}</div>
                 )}
               </div>
               <div>
                 <label style={labelStyle}>Evrak No</label>
                 <input style={inputStyle(true)} value={teklifNo} readOnly />
               </div>
               <div>
                 <label style={labelStyle}>Evrak Tipi</label>
                 <select disabled={!isEditing} style={inputStyle(!isEditing)} value={tip} onChange={e => setTip(e.target.value)}>
                    <option value="Teklif">Teklif</option>
                    <option value="Sipariş">Sipariş</option>
                 </select>
               </div>
               <div>
                 <label style={labelStyle}>Tarih</label>
                 <input type="date" readOnly={!isEditing} style={inputStyle(!isEditing)} value={tarih} onChange={e => setTarih(e.target.value)} />
               </div>
               <div>
                 <label style={labelStyle}>Geçerlilik Tarihi</label>
                 <input type="date" readOnly={!isEditing} style={inputStyle(!isEditing)} value={gecerlilikTarihi} onChange={e => setGecerlilikTarihi(e.target.value)} />
               </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Hizmet ve Ürün Kalemleri</h3>
               {isEditing && (
                 <button onClick={addKalem} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}>{Icons.plus} Satır Ekle</button>
               )}
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
                        {isEditing && <th style={{ width: '50px' }}></th>}
                     </tr>
                  </thead>
                  <tbody>
                     {kalemler.length === 0 && (
                        <tr><td colSpan={isEditing ? 6 : 5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Henüz kalem eklenmedi.</td></tr>
                     )}
                     {kalemler.map(k => (
                        <tr key={k.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                           <td style={{ padding: '12px 20px' }}>
                              {isEditing ? (
                                <SmartProductSearch 
                                  value={k.aciklama} 
                                  onChange={val => updateKalem(k.id, { aciklama: val })}
                                  onSelect={p => onSelectProduct(k.id, p)}
                                />
                              ) : (
                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{k.aciklama}</div>
                              )}
                           </td>
                           <td style={{ padding: '12px 20px' }}>
                              {isEditing ? (
                                <input type="number" style={{ ...inputStyle(false), padding: '8px', textAlign: 'center' }} value={k.miktar} onChange={e => updateKalem(k.id, { miktar: parseFloat(e.target.value) || 0 })} />
                              ) : (
                                <div style={{ textAlign: 'center' }}>{k.miktar} {k.birim}</div>
                              )}
                           </td>
                           <td style={{ padding: '12px 20px' }}>
                              {isEditing ? (
                                <input type="number" style={{ ...inputStyle(false), padding: '8px', textAlign: 'right' }} value={k.birim_fiyat} onChange={e => updateKalem(k.id, { birim_fiyat: parseFloat(e.target.value) || 0 })} />
                              ) : (
                                <div style={{ textAlign: 'right' }}>{k.birim_fiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                              )}
                           </td>
                           <td style={{ padding: '12px 20px' }}>
                              {isEditing ? (
                                <>
                                  <select style={{ ...inputStyle(false), padding: '8px' }} value={k.kdv_oran} onChange={e => updateKalem(k.id, { kdv_oran: parseInt(e.target.value) })}>
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
                                </>
                              ) : (
                                <div style={{ textAlign: 'center' }}>%{k.kdv_oran} {k.kdv_dahil ? '(D)' : '(H)'}</div>
                              )}
                           </td>
                           <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                              {(k.kdv_dahil ? (k.miktar * k.birim_fiyat) : (k.miktar * k.birim_fiyat * (1 + k.kdv_oran/100))).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                           </td>
                           {isEditing && (
                             <td style={{ padding: '12px 20px' }}>
                                <button onClick={() => removeKalem(k.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>{Icons.trash}</button>
                             </td>
                           )}
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
                      readOnly={!isEditing}
                      style={{ ...inputStyle(!isEditing), height: '100px', resize: 'none' }} 
                      placeholder="Örn: Geçerlilik süresi 15 gündür. Nakliye dahil değildir."
                      value={notlar}
                      onChange={e => setNotlar(e.target.value)}
                    />
                 </div>

                 {isEditing && (
                    <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                       <button 
                         disabled={saving} 
                         onClick={() => saveTeklif('Onay Bekliyor')}
                         className="btn-primary" 
                         style={{ width: '100%', height: '52px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                       >
                         {Icons.send} {saving ? 'Gönderiliyor...' : 'Onaya Gönder'}
                       </button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Hidden Printable Content */}
      <div style={{ display: 'none' }}>
        <PrintableTeklif 
          ref={printRef}
          teklif={{ teklif_no: teklifNo, tarih, gecerlilikTarihi, tip, notlar, totals }}
          cari={cariData}
          kalemler={kalemler}
        />
      </div>
    </div>
  )
}

// Printable Component
import React from 'react'
const PrintableTeklif = React.forwardRef(({ teklif, cari, kalemler }: any, ref: any) => {
  return (
    <div ref={ref} style={{ padding: '40px', color: '#000', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', color: '#3b82f6' }}>{teklif.tip.toUpperCase()}</h1>
          <p style={{ margin: '4px 0', fontWeight: 'bold' }}>No: {teklif.teklif_no}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0 }}>SİSTEM YÖNETİMİ</h2>
          <p style={{ margin: '4px 0' }}>Merkez Şube</p>
          <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>{new Date().toLocaleDateString('tr-TR')}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
        <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px', fontSize: '14px', color: '#666' }}>MÜŞTERİ BİLGİLERİ</h3>
          <p style={{ margin: '5px 0', fontWeight: 'bold', fontSize: '16px' }}>{cari?.yetkili}</p>
          <p style={{ margin: '5px 0' }}>{cari?.tel}</p>
          <p style={{ margin: '5px 0' }}>{cari?.mail}</p>
          <p style={{ margin: '5px 0', fontSize: '12px' }}>{cari?.adres}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '5px 0' }}><strong>Evrak Tarihi:</strong> {new Date(teklif.tarih).toLocaleDateString('tr-TR')}</p>
          <p style={{ margin: '5px 0' }}><strong>Geçerlilik:</strong> {teklif.gecerlilikTarihi ? new Date(teklif.gecerlilikTarihi).toLocaleDateString('tr-TR') : '—'}</p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #3b82f6' }}>
            <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px' }}>AÇIKLAMA</th>
            <th style={{ textAlign: 'center', padding: '12px', fontSize: '12px', width: '80px' }}>MİKTAR</th>
            <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', width: '120px' }}>BİRİM FİYAT</th>
            <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', width: '120px' }}>TOPLAM</th>
          </tr>
        </thead>
        <tbody>
          {kalemler.map((k: any, index: number) => {
             const lineTotal = k.kdv_dahil ? (k.miktar * k.birim_fiyat) : (k.miktar * k.birim_fiyat * (1 + k.kdv_oran/100))
             return (
              <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontSize: '13px' }}>{k.aciklama}</td>
                <td style={{ padding: '12px', fontSize: '13px', textAlign: 'center' }}>{k.miktar} {k.birim}</td>
                <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right' }}>{k.birim_fiyat.toLocaleString('tr-TR')} ₺</td>
                <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', fontWeight: 'bold' }}>{lineTotal.toLocaleString('tr-TR')} ₺</td>
              </tr>
             )
          })}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '250px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <span>Ara Toplam</span>
            <span>{teklif.totals.araToplam.toLocaleString('tr-TR')} ₺</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <span>KDV Toplam</span>
            <span>{teklif.totals.kdvToplam.toLocaleString('tr-TR')} ₺</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
            <span>GENEL TOPLAM</span>
            <span>{teklif.totals.genelToplam.toLocaleString('tr-TR')} ₺</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '60px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>NOTLAR</h4>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: '12px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
          {teklif.notlar || 'Herhangi bir not bulunmamaktadır.'}
        </div>
      </div>
    </div>
  )
})
PrintableTeklif.displayName = 'PrintableTeklif'

export default function Page() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <ProposalDetail />
    </Suspense>
  )
}
