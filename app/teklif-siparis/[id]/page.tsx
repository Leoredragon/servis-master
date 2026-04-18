"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import SmartProductSearch, { StokItem } from '@/app/components/SmartProductSearch'
import Modal from '@/app/components/Modal'

const Icons = {
  back: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  check: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  sync: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  service: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  print: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
}

export default function TeklifDetayPage() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [teklif, setTeklif] = useState<any>(null)
  const [kalemler, setKalemler] = useState<any[]>([])
  const [totals, setTotals] = useState({ araToplam: 0, kdvToplam: 0, genelToplam: 0 })
  const [updating, setUpdating] = useState(false)

  // Arac Seçim Modalı
  const [showAracModal, setShowAracModal] = useState(false)
  const [araclar, setAraclar] = useState<any[]>([])
  const [selectedArac, setSelectedArac] = useState('')

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    const { data: tData } = await supabase.from('teklif').select('*, cari_kart(*)').eq('id', id).single()
    const { data: kData } = await supabase.from('teklif_kalem').select('*').eq('teklif_id', id)
    
    setTeklif(tData)
    setKalemler(kData || [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  // Recalculate totals when kalemler change
  useEffect(() => {
    let ara = 0, kdv = 0, genel = 0
    kalemler.forEach(k => {
      const lineAmount = k.miktar * k.birim_fiyat
      if (k.kdv_dahil) {
        genel += lineAmount
        const base = lineAmount / (1 + k.kdv_oran/100)
        ara += base
        kdv += (lineAmount - base)
      } else {
        ara += lineAmount
        const tax = lineAmount * (k.kdv_oran/100)
        kdv += tax
        genel += (lineAmount + tax)
      }
    })
    setTotals({ araToplam: ara, kdvToplam: kdv, genelToplam: genel })
  }, [kalemler])

  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    await supabase.from('teklif').update({ durum: newStatus }).eq('id', id)
    fetchDetail()
    setUpdating(false)
  }

  const convertToOrder = async () => {
    setUpdating(true)
    await supabase.from('teklif').update({ tip: 'Sipariş', durum: 'Onaylandı' }).eq('id', id)
    fetchDetail()
    setUpdating(false)
  }

  const openServiceConvert = async () => {
    const { data } = await supabase.from('arac').select('*').eq('cari_id', teklif.cari_id)
    setAraclar(data || [])
    if (data && data.length === 1) {
      handleConvertToService(data[0].id)
    } else if (data && data.length > 1) {
      setShowAracModal(true)
    } else {
      alert('Bu müşteriye kayıtlı araç bulunamadı. Servis kaydı için önce araç eklemelisiniz.')
    }
  }

  const handleConvertToService = async (aracId: any) => {
    if (!aracId) return
    setUpdating(true)
    try {
      const { data: sData, error: sErr } = await supabase.from('servis_karti').insert([{
        servis_no: `SRV-TKL-${teklif.teklif_no}`,
        cari_id: teklif.cari_id,
        arac_id: parseInt(aracId),
        durum: 'Girildi',
        giris_tarihi: new Date().toISOString(),
        sikayet: `Tekliften aktarıldı: ${teklif.teklif_no}`,
        kullaniciadi: 'admin',
        subeadi: 'Merkez'
      }]).select().single()

      if (sErr) throw sErr

      const islemPayload = kalemler.map(k => ({
        servis_id: sData.id,
        stok_id: k.stok_id,
        islem_adi: k.aciklama,
        miktar: k.miktar,
        birim_fiyat: k.birim_fiyat,
        kdv_oran: k.kdv_oran,
        kdv_dahil: k.kdv_dahil,
        toplam_tutar: k.toplam_tutar,
        tur: k.stok_id ? 'Parça' : 'İşçilik',
        kullaniciadi: 'admin',
        subeadi: 'Merkez'
      }))

      await supabase.from('servis_islem').insert(islemPayload)
      await supabase.from('teklif').update({ durum: 'Servise Dönüştü' }).eq('id', id)
      
      router.push(`/servis-kayitlari/${sData.id}`)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUpdating(false)
      setShowAracModal(false)
    }
  }

  const saveChanges = async () => {
    setUpdating(true)
    try {
      // Update totals in main table
      await supabase.from('teklif').update({
        toplam: totals.araToplam,
        kdv_toplam: totals.kdvToplam,
        genel_toplam: totals.genelToplam
      }).eq('id', id)

      // Update line items
      // For simplicity, we'll delete and re-insert if dynamic rows were used, 
      // but here we just update existing or handle new/deleted logic.
      // Since the UI allows adding/removing, a full sync is safer.
      await supabase.from('teklif_kalem').delete().eq('teklif_id', id)
      const payload = kalemler.map(k => ({
        teklif_id: id,
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
      await supabase.from('teklif_kalem').insert(payload)
      
      alert('Değişiklikler kaydedildi.')
      fetchDetail()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const updateKalem = (idx: number, updates: any) => {
    const newItems = [...kalemler]
    newItems[idx] = { ...newItems[idx], ...updates }
    setKalemler(newItems)
  }

  const addKalem = () => {
    setKalemler([...kalemler, { id: Date.now(), aciklama: '', miktar: 1, birim: 'Adet', birim_fiyat: 0, kdv_oran: 20, kdv_dahil: true }])
  }

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}><div className="skeleton" style={{ height: '200px', width: '100%', marginBottom: '20px' }} /><div className="skeleton" style={{ height: '400px', width: '100%' }} /></div>

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.back()} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{Icons.back}</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>{teklif?.teklif_no}</h1>
              <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: '#f1f5f9', color: '#64748b' }}>{teklif?.tip}</span>
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>{teklif?.cari_kart?.yetkili} • {new Date(teklif?.tarih).toLocaleDateString('tr-TR')}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{Icons.print} Yazdır</button>
          <button onClick={saveChanges} disabled={updating} className="btn-primary" style={{ background: '#0f172a' }}>Değişiklikleri Kaydet</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Main Info Card */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span>Kalemler ve Hizmetler</span>
               <button onClick={addKalem} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>{Icons.plus} Satır Ekle</button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>AÇIKLAMA</th>
                      <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', width: '70px' }}>MIKTAR</th>
                      <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', width: '100px' }}>FİYAT</th>
                      <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', width: '80px' }}>KDV</th>
                      <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', width: '100px' }}>TOPLAM</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {kalemler.map((k, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 20px' }}>
                           <SmartProductSearch 
                             value={k.aciklama} 
                             onChange={val => updateKalem(idx, { aciklama: val })}
                             onSelect={p => updateKalem(idx, { stok_id: p.id, aciklama: p.ad, birim_fiyat: p.s_fiyat, kdv_oran: p.kdv_oran })}
                           />
                        </td>
                        <td style={{ padding: '8px 20px' }}>
                           <input type="number" step="0.01" style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px' }} value={k.miktar} onChange={e => updateKalem(idx, { miktar: parseFloat(e.target.value) || 0 })} />
                        </td>
                        <td style={{ padding: '8px 20px' }}>
                           <input type="number" step="0.01" style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'right', fontSize: '13px' }} value={k.birim_fiyat} onChange={e => updateKalem(idx, { birim_fiyat: parseFloat(e.target.value) || 0 })} />
                        </td>
                        <td style={{ padding: '8px 20px', textAlign: 'center' }}>
                           <div style={{ fontSize: '12px', fontWeight: 700 }}>%{k.kdv_oran}</div>
                           <label style={{ fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginTop: '4px' }}>
                              <input type="checkbox" checked={k.kdv_dahil} onChange={e => updateKalem(idx, { kdv_dahil: e.target.checked })} /> Dahil
                           </label>
                        </td>
                        <td style={{ padding: '8px 20px', textAlign: 'right', fontWeight: 700, fontSize: '14px' }}>
                           {(k.kdv_dahil ? (k.miktar * k.birim_fiyat) : (k.miktar * k.birim_fiyat * (1 + k.kdv_oran/100))).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                        <td style={{ padding: '8px 20px' }}>
                           <button onClick={() => setKalemler(kalemler.filter((_, i) => i !== idx))} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>{Icons.trash}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Summary Card */}
          <div className="card">
             <div className="card-body">
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                      <span style={{ color: '#64748b' }}>Ara Toplam</span>
                      <span style={{ fontWeight: 700 }}>{totals.araToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                      <span style={{ color: '#64748b' }}>KDV Toplam</span>
                      <span style={{ fontWeight: 700 }}>{totals.kdvToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                   </div>
                   <div style={{ borderTop: '1px solid #e2e8f0', margin: '12px 0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
                      <span style={{ fontWeight: 800 }}>GENEL</span>
                      <span style={{ fontWeight: 900, color: '#3b82f6' }}>{totals.genelToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                   </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   {teklif?.durum === 'Onay Bekliyor' && (
                     <>
                       <button onClick={() => updateStatus('Onaylandı')} disabled={updating} style={{ background: '#10b981', color: '#fff', width: '100%', height: '44px', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>{Icons.check} Onayla</button>
                       <button onClick={() => updateStatus('Reddedildi')} disabled={updating} style={{ background: '#ef4444', color: '#fff', width: '100%', height: '44px', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>{Icons.x} Reddet</button>
                     </>
                   )}
                   {teklif?.durum === 'Taslak' && (
                     <button onClick={() => updateStatus('Onay Bekliyor')} disabled={updating} style={{ background: '#3b82f6', color: '#fff', width: '100%', height: '44px', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Onaya Gönder</button>
                   )}
                   {(teklif?.durum === 'Onaylandı' || teklif?.durum === 'Onay Bekliyor' || teklif?.durum === 'Reddedildi') && (
                     <button onClick={() => updateStatus('Taslak')} disabled={updating} style={{ background: '#f1f5f9', color: '#475569', width: '100%', height: '44px', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>{Icons.sync} Taslağa Çek</button>
                   )}

                   <div style={{ height: '1px', background: '#f1f5f9', margin: '10px 0' }} />

                   {teklif?.durum === 'Onaylandı' && teklif?.tip === 'Teklif' && (
                     <button onClick={convertToOrder} disabled={updating} style={{ background: '#fef3c7', color: '#92400e', width: '100%', height: '44px', border: '1px solid #fde68a', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>✓ Siparişe Dönüştür</button>
                   )}
                   {teklif?.durum === 'Onaylandı' && (
                     <button onClick={openServiceConvert} disabled={updating} style={{ background: '#dcfce7', color: '#166534', width: '100%', height: '44px', border: '1px solid #bbf7d0', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>{Icons.service} Servise Dönüştür</button>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showAracModal} onClose={() => setShowAracModal(false)} title="Araç Seçimi" size="sm">
         <div style={{ padding: '24px' }}>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Müşterinin birden fazla aracı var. Lütfen servis kaydı açılacak aracı seçin:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               {araclar.map(a => (
                  <button 
                    key={a.id} 
                    onClick={() => handleConvertToService(a.id)}
                    style={{ padding: '16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', fontWeight: 700 }}
                  >
                     {a.plaka} — {a.marka} {a.model}
                  </button>
               ))}
            </div>
         </div>
      </Modal>
    </div>
  )
}
