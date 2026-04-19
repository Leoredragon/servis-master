"use client"

import { supabase } from '../../lib/supabase'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ConfirmModal from '../../components/ConfirmModal'
import SmartProductSearch, { StokItem } from '../../components/SmartProductSearch'
import PrintButton from '../../components/print/PrintButton'
import ServisIsEmri from '../../components/print/ServisIsEmri'

/* ─── Sabitler ─── */
const IS_AKISI = [
  'Araç Kabul', 'Arıza Tespiti', 'Onay Bekliyor', 'İşlemde', 'Kalite Kontrol', 'Teslime Hazır', 'Teslim Edildi'
]

const DURUM_RENKLER: Record<string, [string, string]> = {
  'Araç Kabul':     ['#374151', '#f3f4f6'],
  'Arıza Tespiti':  ['#0284c7', '#e0f2fe'],
  'Onay Bekliyor':  ['#c2410c', '#ffedd5'],
  'İşlemde':        ['#4338ca', '#e0e7ff'],
  'Kalite Kontrol': ['#7e22ce', '#f3e8ff'],
  'Teslime Hazır':  ['#15803d', '#dcfce7'],
  'Teslim Edildi':  ['#0f172a', '#e2e8f0'],
}

const Icons = {
  back: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>,
  wrench: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  file: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  invoice: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><line x1="14" y1="13" x2="16" y2="13"/><line x1="14" y1="17" x2="16" y2="17"/></svg>,
}

interface IslemRow {
  id?: number
  servis_karti_id: number
  stok_id: number | null
  islem_turu: string
  aciklama: string
  miktar: number
  birim: string
  birim_fiyat: number
  kdv_oran: number
  kdv_dahil: boolean
  toplam_tutar: number
  stok?: { ad: string; kod: string } | null
  _isEditing?: boolean
  _isNew?: boolean
  _searchValue?: string
}

export default function ServisDetay() {
  const { id } = useParams()
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [servis, setServis] = useState<any>(null)
  const [islemler, setIslemler] = useState<IslemRow[]>([])
  
  const [kasalar, setKasalar] = useState<any[]>([])
  const [odemeler, setOdemeler] = useState<any[]>([])

  const [activeTab, setActiveTab] = useState<'proforma' | 'odeme' | 'notlar'>('proforma')
  const [yapilanIslemNotu, setYapilanIslemNotu] = useState('')
  
  const [odemeForm, setOdemeForm] = useState({ kasa_id: '', tutar: '', odeme_sekli: 'Nakit', aciklama: '' })

  const [confirmModal, setConfirmModal] = useState({ open: false, config: 'fatura' as 'fatura' | 'sil' | 'islem_sil', targetId: null as number | null })

  // Data Fetching
  const fetchData = useCallback(async () => {
    if (!id) return
    const [s_res, i_res, h_res] = await Promise.all([
      supabase.from('servis_karti').select('*, arac(*), cari_kart(*)').eq('id', id).single(),
      supabase.from('servis_islem').select('*, stok(ad, kod)').eq('servis_karti_id', id).order('id'),
      supabase.from('kasa_hareket').select('*').eq('servis_id', id).order('islem_tarihi', { ascending: false })
    ])

    const sData = s_res.data
    const iData = (i_res.data || []).map((row: any) => ({
      ...row, birim: row.birim || 'Adet', kdv_oran: row.kdv_oran ?? 20, kdv_dahil: row.kdv_dahil ?? true
    }))

    setServis(sData)
    setYapilanIslemNotu(sData?.yapilan_islem || '')
    setIslemler(iData)
    setOdemeler(h_res.data || [])

    if (sData) {
      const calTotal = iData.reduce((sum: number, i: any) => {
        const base = (i.miktar || 0) * (i.birim_fiyat || 0)
        const kdv = base * ((i.kdv_oran ?? 20) / 100)
        return sum + (i.kdv_dahil ? base : base + kdv)
      }, 0)
      
      if (Math.abs((sData.toplam_tutar || 0) - calTotal) > 0.01) {
        await supabase.from('servis_karti').update({ toplam_tutar: calTotal }).eq('id', id)
        setServis({ ...sData, toplam_tutar: calTotal })
      }
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchData()
    supabase.from('kasalar').select('*').eq('aktif_mi', true).then(({ data }) => setKasalar(data || []))
  }, [fetchData])

  // Finance Calculus
  const finance = useMemo(() => {
    const valid = islemler.filter(r => !r._isNew)
    let araToplam = 0, toplamKDV = 0
    valid.forEach(r => {
      const base = (r.miktar || 0) * (r.birim_fiyat || 0)
      if (r.kdv_dahil) {
        const net = base / (1 + (r.kdv_oran || 0) / 100)
        araToplam += net; toplamKDV += base - net
      } else {
        const kdv = base * ((r.kdv_oran || 0) / 100)
        araToplam += base; toplamKDV += kdv
      }
    })
    return { araToplam, toplamKDV, genelToplam: araToplam + toplamKDV }
  }, [islemler])

  const odenenTutar = odemeler.reduce((acc, curr) => acc + (curr.tur === 'gelir' ? curr.tutar : -curr.tutar), 0)
  const kalanTutar = finance.genelToplam - odenenTutar

  useEffect(() => {
    // Sadece ödeme sekmesine geçildiğinde form tutarını kalana eşitle
    if (activeTab === 'odeme') setOdemeForm(prev => ({ ...prev, tutar: kalanTutar > 0 ? (Math.round(kalanTutar * 100)/100).toString() : '' }))
  }, [activeTab, kalanTutar])


  // Handlers
  const handleDurumChange = async (yeniDurum: string) => {
    await supabase.from('servis_karti').update({ durum: yeniDurum }).eq('id', id)
    setServis({ ...servis, durum: yeniDurum })
  }

  const handleYapilanIslemKaydet = async () => {
    setSaving(true)
    await supabase.from('servis_karti').update({ yapilan_islem: yapilanIslemNotu }).eq('id', id)
    setSaving(false)
  }

  const handleOdemeAl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!odemeForm.kasa_id || !odemeForm.tutar) return
    const tutar = parseFloat(odemeForm.tutar)
    
    setSaving(true)
    const { error } = await supabase.from('kasa_hareket').insert([{
      kasa_id: parseInt(odemeForm.kasa_id),
      islem_tarihi: new Date().toISOString(),
      tur: 'gelir',
      kategori: 'Servis Geliri',
      aciklama: odemeForm.aciklama || `SRV-${servis.servis_no} servis tahsilatı`,
      hesap: servis.cari_kart?.yetkili || '',
      tutar,
      odeme_sekli: odemeForm.odeme_sekli,
      servis_id: parseInt(id as string)
    }])

    if (!error) {
      const yeniOdenen = odenenTutar + tutar
      const yeniDurum = yeniOdenen >= finance.genelToplam - 0.01 ? 'Ödendi' : 'Kısmi Ödendi'
      await supabase.from('servis_karti').update({ odenen_tutar: yeniOdenen, odeme_durumu: yeniDurum }).eq('id', id)
      
      setOdemeForm({ ...odemeForm, tutar: '', aciklama: '' })
      await fetchData()
    } else alert(error.message)
    setSaving(false)
  }

  const handleFaturayaDonustur = async () => {
    setSaving(true)
    const { data: fatura, error } = await supabase.from('fatura').insert([{
      cari_id: servis.cari_id,
      evrak_no: `FAT-${servis.servis_no}`,
      fat_tarih: new Date().toISOString().split('T')[0],
      fatura_turu: 'Satış',
      toplam: finance.araToplam,
      kdv: finance.toplamKDV,
      gtoplam: finance.genelToplam,
      servis_id: parseInt(id as string),
      odeme_durumu: servis.odeme_durumu,
      kullaniciadi: 'admin',
      subeadi: 'Merkez'
    }]).select().single()

    if (!error) {
      await supabase.from('servis_karti').update({ fatura_id: fatura.id }).eq('id', id)
      router.push(`/faturalar/${fatura.id}`)
    } else {
      alert(error.message)
      setSaving(false)
      setConfirmModal({ open: false, config: 'fatura', targetId: null })
    }
  }

  const handleServisSil = async () => {
    setSaving(true)
    // Önce işlemleri bulalım ve varsa stokları geri verelim
    const { data: islemler } = await supabase.from('servis_islem').select('*').eq('servis_karti_id', id)
    if (islemler) {
      for (const isl of islemler) {
        if (isl.islem_turu === 'parca' && isl.stok_id) {
          await supabase.from('stok_hareket').insert([{
             stok_id: isl.stok_id, servis_id: parseInt(id as string), hareket_turu: 'Servis İade', miktar: isl.miktar, aciklama: 'Kayıt silindi, parça geri alındı.'
          }])
          await supabase.rpc('update_stok_miktar', { s_id: isl.stok_id, degisim: isl.miktar })
        }
      }
      await supabase.from('servis_islem').delete().eq('servis_karti_id', id)
    }

    // Kasa Hareketlerini temizle
    await supabase.from('kasa_hareket').delete().eq('servis_id', id)
    // Kendisini sil
    await supabase.from('servis_karti').delete().eq('id', id)
    
    router.push('/servis-kayitlari')
  }

  // --- Inline Grid Logic ---
  const addNewRow = () => {
    if (islemler.some(r => r._isNew)) return
    setIslemler(prev => [...prev, {
      servis_karti_id: parseInt(id as string), stok_id: null, islem_turu: 'parca', aciklama: '', miktar: 1, birim: 'Adet', birim_fiyat: 0, kdv_oran: 20, kdv_dahil: true, toplam_tutar: 0, _isNew: true, _isEditing: true
    }])
  }
  const setRow = (idx: number, obj: Partial<IslemRow>) => {
    setIslemler(prev => prev.map((r, i) => i === idx ? { ...r, ...obj } : r))
  }
  const saveRow = async (idx: number) => {
    const row = islemler[idx]
    const calc = row.kdv_dahil ? (row.miktar * row.birim_fiyat) : (row.miktar * row.birim_fiyat * (1 + row.kdv_oran / 100))
    const p = {
      servis_karti_id: row.servis_karti_id, stok_id: row.stok_id, islem_turu: row.islem_turu, aciklama: row.aciklama, miktar: row.miktar, birim: row.birim, birim_fiyat: row.birim_fiyat, kdv_oran: row.kdv_oran, kdv_dahil: row.kdv_dahil, toplam_tutar: calc, kullaniciadi: 'admin', subeadi: 'Merkez'
    }

    if (row._isNew) {
      await supabase.from('servis_islem').insert([p])
      if (row.islem_turu === 'parca' && row.stok_id) {
         await supabase.from('stok_hareket').insert([{ stok_id: row.stok_id, servis_id: row.servis_karti_id, hareket_turu: 'Servis Çıkış', miktar: row.miktar, birim_fiyat: row.birim_fiyat, aciklama: 'Parça eklendi' }])
         await supabase.rpc('update_stok_miktar', { s_id: row.stok_id, degisim: -row.miktar })
      }
    } else {
      const { data: old } = await supabase.from('servis_islem').select('*').eq('id', row.id).single()
      await supabase.from('servis_islem').update(p).eq('id', row.id)
      if (old && row.islem_turu === 'parca' && row.stok_id) {
        const diff = old.miktar - row.miktar
        if (diff !== 0) {
          await supabase.from('stok_hareket').insert([{ stok_id: row.stok_id, servis_id: row.servis_karti_id, hareket_turu: diff > 0 ? 'Servis İade' : 'Servis Çıkış', miktar: Math.abs(diff) }])
          await supabase.rpc('update_stok_miktar', { s_id: row.stok_id, degisim: diff })
        }
      }
    }
    fetchData()
  }

  const deleteIslem = async (targetId: number) => {
    const { data: row } = await supabase.from('servis_islem').select('*').eq('id', targetId).single()
    await supabase.from('servis_islem').delete().eq('id', targetId)
    if (row && row.islem_turu === 'parca' && row.stok_id) {
       await supabase.from('stok_hareket').insert([{ stok_id: row.stok_id, servis_id: parseInt(id as string), hareket_turu: 'Servis İade', miktar: row.miktar }])
       await supabase.rpc('update_stok_miktar', { s_id: row.stok_id, degisim: row.miktar })
    }
    fetchData()
    setConfirmModal({ open: false, config: 'islem_sil', targetId: null })
  }


  if (loading) return <div style={{ padding: '60px' }}><div className="skeleton" style={{ height: '500px', borderRadius: '24px' }}></div></div>
  if (!servis) return <div style={{ padding: '60px', textAlign: 'center' }}>İş emri bulunamadı.</div>

  const currentDurum = servis.durum
  const [bdgColor, bdgBg] = DURUM_RENKLER[currentDurum] || ['#64748b', '#f1f5f9']
  const canConvert = (currentDurum === 'Teslime Hazır' || currentDurum === 'Teslim Edildi' || currentDurum === 'Tamamlandı') && !servis.fatura_id

  return (
    <div className="animate-fadeIn" style={{ width: '100%', padding: '0 32px 32px' }}>
      
      {/* ─── Breadcrumb ve Üst Butonlar ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {Icons.back} Servis Kayıtları
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <PrintButton contentRef={printRef} fileName={`Is_Emri_${servis.servis_no}`} />
          {canConvert && (
            <button onClick={() => setConfirmModal({ open: true, config: 'fatura', targetId: null })} className="btn-primary" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              {Icons.invoice} Faturaya Dönüştür
            </button>
          )}
        </div>
      </div>

      {/* ─── ÜST HEADER KARTI ─── */}
      <div className="card" style={{ marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: bdgColor }}></div>
        <div style={{ padding: '32px 40px', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
           
           <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '6px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                 <div style={{ color: '#3b82f6' }}>{Icons.wrench}</div>
                 <span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', letterSpacing: '1px' }}>{servis.servis_no}</span>
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{servis.cari_kart?.yetkili || '---'}</h2>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>{servis.arac?.plaka} • {servis.arac?.marka} {servis.arac?.model} {servis.arac?.yil}</div>
              
              <div style={{ display: 'flex', gap: '24px', marginTop: '24px', padding: '16px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                 <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Giriş Tarihi</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginTop: '4px' }}>{new Date(servis.giris_tarihi).toLocaleString('tr-TR')}</div>
                 </div>
                 <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Geliş KM</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginTop: '4px' }}>{servis.gelis_kmsi} km</div>
                 </div>
                 <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Teknisyen</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginTop: '4px' }}>{servis.teknisyen || 'Seçilmedi'}</div>
                 </div>
              </div>
           </div>

           <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: '0 0 auto', minWidth: '350px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <span style={{ padding: '6px 14px', borderRadius: '99px', fontSize: '14px', fontWeight: 800, color: bdgColor, background: bdgBg, border: `1px solid ${bdgColor}30` }}>
                   {currentDurum}
                 </span>
                 <span style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, background: servis.odeme_durumu === 'Ödendi' ? '#dcfce7' : (servis.odeme_durumu === 'Kısmi Ödendi' ? '#fef9c3' : '#f1f5f9'), color: servis.odeme_durumu === 'Ödendi' ? '#166534' : (servis.odeme_durumu === 'Kısmi Ödendi' ? '#854d0e' : '#64748b') }}>
                   {servis.odeme_durumu || 'Ödenmedi'}
                 </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>İş Emri Akışı</div>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {IS_AKISI.map(d => (
                       <button key={d} onClick={() => handleDurumChange(d)} style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, borderRadius: '8px', border: currentDurum === d ? 'none' : '1px solid #e2e8f0', background: currentDurum === d ? DURUM_RENKLER[d][0] : '#fff', color: currentDurum === d ? '#fff' : '#64748b', cursor: 'pointer', transition: '0.2s' }}>
                          {d}
                       </button>
                    ))}
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                 <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Toplam</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>{finance.genelToplam.toLocaleString('tr-TR')} ₺</div>
                 </div>
                 <div style={{ padding: '12px', background: '#ecfdf5', borderRadius: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#10b981' }}>Ödenen</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#166534' }}>{odenenTutar.toLocaleString('tr-TR')} ₺</div>
                 </div>
                 <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#ef4444' }}>Kalan</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#991b1b' }}>{kalanTutar.toLocaleString('tr-TR')} ₺</div>
                 </div>
              </div>

           </div>
        </div>
      </div>

      {/* ─── SEKME BUTONLARI ─── */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '2px solid #f1f5f9', marginBottom: '24px' }}>
         <button onClick={() => setActiveTab('proforma')} style={{ padding: '12px 0', border: 'none', background: 'none', color: activeTab === 'proforma' ? '#0f172a' : '#94a3b8', fontSize: '15px', fontWeight: 800, cursor: 'pointer', borderBottom: activeTab === 'proforma' ? '3px solid #0f172a' : '3px solid transparent' }}>Proforma & Parça</button>
         <button onClick={() => setActiveTab('odeme')} style={{ padding: '12px 0', border: 'none', background: 'none', color: activeTab === 'odeme' ? '#0f172a' : '#94a3b8', fontSize: '15px', fontWeight: 800, cursor: 'pointer', borderBottom: activeTab === 'odeme' ? '3px solid #0f172a' : '3px solid transparent' }}>Ödemeler ve Kasa ({odemeler.length})</button>
         <button onClick={() => setActiveTab('notlar')} style={{ padding: '12px 0', border: 'none', background: 'none', color: activeTab === 'notlar' ? '#0f172a' : '#94a3b8', fontSize: '15px', fontWeight: 800, cursor: 'pointer', borderBottom: activeTab === 'notlar' ? '3px solid #0f172a' : '3px solid transparent' }}>Açıklama & Şikayet</button>
      </div>

      {/* ─── SEKME: PROFORMA ─── */}
      {activeTab === 'proforma' && (
         <div className="card animate-fadeIn" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
               <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>İşlem Kalemleri</h3>
               <button onClick={addNewRow} className="btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>{Icons.plus} Satır Ekle</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                     <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>TÜR</th>
                        <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>ÜRÜN / AÇIKLAMA</th>
                        <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'center' }}>MİKTAR</th>
                        <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'center' }}>KDV</th>
                        <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'right' }}>FİYAT</th>
                        <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'right' }}>TOPLAM</th>
                        <th style={{ padding: '14px 20px', width: '90px' }}></th>
                     </tr>
                  </thead>
                  <tbody>
                     {islemler.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: r._isEditing ? '#eff6ff' : 'transparent' }}>
                           <td style={{ padding: '12px 20px' }}>
                              {r._isEditing ? (
                                 <select value={r.islem_turu} onChange={e => setRow(i, { islem_turu: e.target.value })} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '100%' }}>
                                    <option value="parca">Parça</option>
                                    <option value="iscilik">İşçilik</option>
                                 </select>
                              ) : <span style={{ fontSize: '12px', padding: '4px 8px', background: '#f1f5f9', borderRadius: '4px', fontWeight: 700 }}>{r.islem_turu.toUpperCase()}</span>}
                           </td>
                           <td style={{ padding: '12px 20px' }}>
                              {r._isEditing ? (
                                 r.islem_turu === 'parca' ? (
                                    <SmartProductSearch value={r._searchValue || r.aciklama} onChange={v => setRow(i, { _searchValue: v, aciklama: v })} onSelect={stok => setRow(i, { stok_id: stok.id, aciklama: stok.ad, birim_fiyat: stok.s_fiyat, birim: stok.birim || 'Adet', kdv_oran: stok.kdv_oran ?? 20 })} placeholder="Parça Kodu / İsmi" />
                                 ) : <input type="text" value={r.aciklama} onChange={e => setRow(i, { aciklama: e.target.value })} style={{ padding: '6px 12px', width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                              ) : <span style={{ fontWeight: 600, fontSize: '13px' }}>{r.aciklama}</span>}
                           </td>
                           <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                              {r._isEditing ? (
                                 <div style={{ display: 'flex', gap: '4px' }}>
                                    <input type="number" min="0.01" step="0.01" value={r.miktar} onChange={e => setRow(i, { miktar: parseFloat(e.target.value) || 0 })} style={{ width: '60px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center' }} />
                                    <select value={r.birim} onChange={e => setRow(i, { birim: e.target.value })} style={{ padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px' }}><option>Adet</option><option>Saat</option></select>
                                 </div>
                              ) : <span style={{ fontWeight: 700 }}>{r.miktar} <span style={{ fontSize: '11px', color: '#64748b' }}>{r.birim}</span></span>}
                           </td>
                           <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                              {r._isEditing ? (
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                    <select value={r.kdv_oran} onChange={e => setRow(i, { kdv_oran: parseInt(e.target.value) })} style={{ padding: '4px', border: '1px solid #e2e8f0', borderRadius: '6px' }}><option value="0">%0</option><option value="10">%10</option><option value="20">%20</option></select>
                                    <label style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={r.kdv_dahil} onChange={e => setRow(i, { kdv_dahil: e.target.checked })} /> Dahil</label>
                                 </div>
                              ) : <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>%{r.kdv_oran} {r.kdv_dahil ? '(Inc)' : '(Exc)'}</span>}
                           </td>
                           <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                              {r._isEditing ? (
                                 <input type="number" step="0.01" value={r.birim_fiyat} onChange={e => setRow(i, { birim_fiyat: parseFloat(e.target.value) || 0 })} style={{ width: '80px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'right' }} />
                               ) : <span style={{ fontWeight: 700 }}>{r.birim_fiyat.toLocaleString('tr-TR')} ₺</span>}
                           </td>
                           <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                               {(() => {
                                 const base = r.miktar * r.birim_fiyat
                                 const total = r.kdv_dahil ? base : base * (1 + r.kdv_oran / 100)
                                 return total.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' ₺'
                               })()}
                           </td>
                           <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                              {r._isEditing ? (
                                 <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => saveRow(i)} style={{ padding: '6px 10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>Kaydet</button>
                                    <button onClick={() => { if(r._isNew) { const copy = [...islemler]; copy.splice(i, 1); setIslemler(copy) } else setRow(i, { _isEditing: false }) }} style={{ padding: '6px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>X</button>
                                 </div>
                              ) : (
                                 <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => setRow(i, { _isEditing: true })} style={{ padding: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', color: '#64748b' }}>Edit</button>
                                    <button onClick={() => setConfirmModal({ open: true, config: 'islem_sil', targetId: r.id || null })} style={{ padding: '6px', background: '#fef2f2', border: 'none', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }}>Sil</button>
                                 </div>
                              )}
                           </td>
                        </tr>
                     ))}
                     {islemler.length === 0 && <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Henüz proforma / servis kalemi eklenmedi.</td></tr>}
                  </tbody>
               </table>
            </div>

            <div style={{ padding: '24px', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '32px' }}>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Ara Toplam</div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>{finance.araToplam.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺</div>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>KDV Toplamı</div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>{finance.toplamKDV.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺</div>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 800, textTransform: 'uppercase' }}>Genel Toplam</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#3b82f6' }}>{finance.genelToplam.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺</div>
               </div>
            </div>
         </div>
      )}

      {/* ─── SEKME: ÖDEMELER ─── */}
      {activeTab === 'odeme' && (
         <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
               <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Yeni Ödeme Al</h3>
               <form onSubmit={handleOdemeAl} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Tutar ₺</label>
                     <input type="number" step="0.01" required value={odemeForm.tutar} onChange={e => setOdemeForm({...odemeForm, tutar: e.target.value})} style={{ width: '100%', padding: '12px', fontSize: '18px', fontWeight: 900, border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                  </div>
                  <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Ödeme Şekli</label>
                     <select value={odemeForm.odeme_sekli} onChange={e => setOdemeForm({...odemeForm, odeme_sekli: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px' }}>
                        <option>Nakit</option><option>Kredi Kartı</option><option>EFT / Havale</option>
                     </select>
                  </div>
                  <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Hedef Kasa *</label>
                     <select required value={odemeForm.kasa_id} onChange={e => setOdemeForm({...odemeForm, kasa_id: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px' }}>
                        <option value="">Kasa Seçin</option>
                        {kasalar.map(k => <option key={k.id} value={k.id}>{k.kasa_adi} ({k.kasa_turu})</option>)}
                     </select>
                  </div>
                  <div>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Açıklama</label>
                     <input type="text" value={odemeForm.aciklama} onChange={e => setOdemeForm({...odemeForm, aciklama: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px' }} placeholder="Varsayılan: Servis tahsilatı" />
                  </div>
                  <button type="submit" disabled={saving || !odemeForm.tutar || !odemeForm.kasa_id} className="btn-primary" style={{ padding: '14px', borderRadius: '10px', fontSize: '15px' }}>{saving ? 'İşleniyor...' : 'Ödemeyi Kaydet'}</button>
                  {kalanTutar <= 0 && <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700, textAlign: 'center', marginTop: '4px' }}>Tüm bakiye kapatılmıştır.</div>}
               </form>
            </div>
            
            <div className="card" style={{ overflow: 'hidden' }}>
               <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 800 }}>Ödeme Geçmişi (Kasa)</div>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                     <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Tarih</th>
                        <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Açıklama / Şekil</th>
                        <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'right' }}>Tutar</th>
                     </tr>
                  </thead>
                  <tbody>
                     {odemeler.map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                           <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600 }}>{new Date(o.islem_tarihi).toLocaleDateString()}</td>
                           <td style={{ padding: '16px 24px' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{o.aciklama}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{o.odeme_sekli}</div>
                           </td>
                           <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: o.tur === 'gelir' ? '#166534' : '#991b1b' }}>
                              {o.tur === 'gelir' ? '+' : '-'}{o.tutar.toLocaleString('tr-TR')} ₺
                           </td>
                        </tr>
                     ))}
                     {odemeler.length === 0 && <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Geçmiş ödeme bulunmuyor.</td></tr>}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {/* ─── SEKME: NOTLAR ─── */}
      {activeTab === 'notlar' && (
         <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800 }}>Şikayet Özeti</h3>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', color: '#475569', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
               {servis.sikayet || 'Belirtilmemiş'}
            </div>

            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800 }}>Yapılan İşlemler / Servis Raporu</h3>
            <textarea rows={8} style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }} placeholder="Değiştirilen kritik parçalar, arıza tespiti ve müşteriye verilen tavsiyeleri buraya yazın..." value={yapilanIslemNotu} onChange={e => setYapilanIslemNotu(e.target.value)} />
            <div style={{ textAlign: 'right', marginTop: '16px' }}>
               <button onClick={handleYapilanIslemKaydet} disabled={saving} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '8px' }}>{saving ? 'Kaydediliyor...' : 'Notları Kaydet'}</button>
            </div>
         </div>
      )}

      {/* ─── DANGER ZONE ─── */}
      <div style={{ marginTop: '60px', padding: '24px', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
            <h4 style={{ margin: 0, color: '#991b1b', fontSize: '16px', fontWeight: 800 }}>İş Emrini Sil</h4>
            <p style={{ margin: '4px 0 0', color: '#b91c1c', fontSize: '13px' }}>Servis kaydı, parça düşümleri ve kasa işlemleri birlikte silinir.</p>
         </div>
         <button onClick={() => setConfirmModal({ open: true, config: 'sil', targetId: null })} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Kalıcı Olarak Sil</button>
      </div>

      <ConfirmModal
         isOpen={confirmModal.open}
         onClose={() => setConfirmModal({ open: false, config: 'sil', targetId: null })}
         title={confirmModal.config === 'sil' ? "İş Emrini Sil" : confirmModal.config === 'islem_sil' ? 'Satırı Sil' : 'Faturaya Dönüştür'}
         message={
            confirmModal.config === 'sil' ? "Bu iş emrini ve bağlı tüm kasa/stok hareketlerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz." :
            confirmModal.config === 'islem_sil' ? "Bu parçayı/işçiliği proformadan silmek istiyor musunuz? Parçaysa stok iade edilecek." :
            "Bu servis kaydını satış faturasına dönüştürmek üzeresiniz. Fatura oluşturulduktan sonra fatura detay ekranına yönlendirileceksiniz."
         }
         confirmText={confirmModal.config === 'fatura' ? 'Dönüştür' : 'Evet, Sil'}
         type={confirmModal.config === 'fatura' ? 'success' : 'danger'}
         onConfirm={() => {
            if (confirmModal.config === 'sil') handleServisSil()
            if (confirmModal.config === 'islem_sil' && confirmModal.targetId) deleteIslem(confirmModal.targetId)
            if (confirmModal.config === 'fatura') handleFaturayaDonustur()
         }}
      />

      <div style={{ display: 'none' }}>
         <ServisIsEmri ref={printRef} servis={servis} islemler={islemler} />
      </div>
    </div>
  )
}
