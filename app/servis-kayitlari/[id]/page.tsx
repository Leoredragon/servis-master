"use client"

import { supabase } from '@/app/lib/supabase'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ConfirmModal from '@/app/components/ConfirmModal'
import Modal from '@/app/components/Modal'
import SlideOver from '@/app/components/SlideOver'
import SmartProductSearch, { StokItem } from '@/app/components/SmartProductSearch'

/* ─── Sabitler ─── */
const IS_AKISI = [
  'Araç Kabul', 'Arıza Tespiti', 'Onay Bekliyor', 'İşlemde', 'Kalite Kontrol', 'Teslime Hazır'
]

const DURUM_RENKLER: Record<string, [string, string]> = {
  'Araç Kabul':     ['#374151', '#f3f4f6'],
  'Arıza Tespiti':  ['#0284c7', '#e0f2fe'],
  'Onay Bekliyor':  ['#c2410c', '#ffedd5'],
  'İşlemde':        ['#4338ca', '#e0e7ff'],
  'Kalite Kontrol': ['#7e22ce', '#f3e8ff'],
  'Teslime Hazır':  ['#15803d', '#dcfce7'],
}

/* ─── SVG İkonları ─── */
const Icons = {
  back: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.334 1.334 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.333 2a1.886 1.886 0 012.667 2.667l-8.667 8.666L2 14l.667-3.333 8.666-8.667z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  x: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  save: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M12.667 14H3.333A1.333 1.333 0 012 12.667V3.333A1.333 1.333 0 013.333 2h7.334L14 5.333v7.334A1.333 1.333 0 0112.667 14z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11.333 14V9.333H4.667V14M4.667 2v3.333h5.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  wrench: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  file: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  wallet: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 012-2h12V4a2 2 0 00-2-2H4a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2h-3"/><path d="M22 13h-4a2 2 0 00-2 2v2a2 2 0 002 2h4"/></svg>,
  payment: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
}

/* ─── Tip tanımları ─── */
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
  toplam_tutar: number
  stok?: { ad: string; kod: string } | null
  _isEditing?: boolean
  _isNew?: boolean
  _searchValue?: string
}

export default function ServisDetay() {
  const params   = useParams()
  const router   = useRouter()
  const servisId = params.id as string

  /* ─── State ─── */
  const [servis, setServis]     = useState<any>(null)
  const [islemler, setIslemler] = useState<IslemRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState<{ msg: string; type: 'success'|'error'|'info' } | null>(null)

  const [confirmData, setConfirmData] = useState<{ open: boolean; type: 'islem' | 'servis'; itemId: number | null }>({
    open: false, type: 'islem', itemId: null
  })

  /* ─── Ödeme State ─── */
  const [odemePanel, setOdemePanel] = useState(false)
  const [kasalar, setKasalar] = useState<any[]>([])
  const [odemeForm, setOdemeForm] = useState({ 
    kasa_id: '',
    tutar: '',
    aciklama: '', 
    tarih: new Date().toISOString().split('T')[0],
    odeme_sekli: 'Nakit',
    vade_tarihi: new Date().toISOString().split('T')[0],
    belge_no: '',
    // Taksit alanları
    pesinat: '0',
    pesinat_kasa_id: '',
    taksit_sayisi: '3',
    ilk_vade: new Date().toISOString().split('T')[0]
  })


  /* ─── Toast ─── */
  const showToast = useCallback((msg: string, type: 'success'|'error'|'info' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  /* ─── Veri çekme ─── */
  const fetchData = useCallback(async () => {
    const [servisRes, islemRes] = await Promise.all([
      supabase.from('servis_karti').select(`*, arac(*), cari_kart(*)`).eq('id', servisId).single(),
      supabase.from('servis_islem').select(`*, stok(ad,kod)`).eq('servis_karti_id', servisId).order('id'),
    ])

    const sData = servisRes.data
    const iData = (islemRes.data || []).map((row: any) => ({
      ...row,
      birim: row.birim || 'Adet',
      kdv_oran: row.kdv_oran ?? 20,
    }))

    setServis(sData)
    setIslemler(iData)
    setLoading(false)

    // toplam_tutar senkronizasyonu
    if (sData) {
      const calTotal = iData.reduce((sum: number, i: any) => {
        const base = (i.miktar || 0) * (i.birim_fiyat || 0)
        const kdv = base * ((i.kdv_oran ?? 18) / 100)
        return sum + base + kdv
      }, 0)
      if (Math.abs((sData.toplam_tutar || 0) - calTotal) > 0.01) {
        await supabase.from('servis_karti').update({ toplam_tutar: calTotal }).eq('id', servisId)
        setServis({ ...sData, toplam_tutar: calTotal })
      }
    }
  }, [servisId])

  useEffect(() => {
    if (!servisId) return
    fetchData()
    // Kasaları çek (ödeme paneli için)
    supabase.from('kasalar').select('*').eq('aktif_mi', true).then(({ data }) => setKasalar(data || []))
  }, [servisId, fetchData])

  /* ─── Ödeme Al ─── */
  const handleOdemeAl = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const isTaksit = odemeForm.odeme_sekli === 'Taksitlendirme'
    if (!isTaksit && (!odemeForm.kasa_id || !odemeForm.tutar)) return
    if (isTaksit && (!odemeForm.tutar || !odemeForm.taksit_sayisi)) return
    
    setSaving(true)

    try {
      const miktar = parseFloat(odemeForm.tutar)
      const genelToplam = finance.genelToplam

      if (isTaksit) {
        const pesinat = parseFloat(odemeForm.pesinat || '0')
        const taksitSayisi = parseInt(odemeForm.taksit_sayisi)
        const kalanTutar = miktar - pesinat
        
        // 1. Peşinat varsa kasaya işle
        if (pesinat > 0 && odemeForm.pesinat_kasa_id) {
          await supabase.from('kasa_hareket').insert([{
            kasa_id: parseInt(odemeForm.pesinat_kasa_id),
            servis_id: parseInt(servisId),
            tur: 'gelir',
            tutar: pesinat,
            kategori: 'Servis Peşinatı',
            aciklama: `SRV-${servis.servis_no} nolu servis peşinatı`,
            islem_tarihi: odemeForm.tarih,
            odeme_sekli: 'Nakit',
            kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
            subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
          }])
        }

        // 2. Taksitleri oluştur (Yuvarlama farkı son taksite)
        const birimTaksit = Math.floor((kalanTutar / taksitSayisi) * 100) / 100
        const taksitlerArray = []
        let ilkVadeDate = new Date(odemeForm.ilk_vade)

        for (let i = 0; i < taksitSayisi; i++) {
          const vDate = new Date(ilkVadeDate)
          vDate.setMonth(vDate.getMonth() + i)
          
          let tTutar = birimTaksit
          if (i === taksitSayisi - 1) {
            tTutar = Math.round((kalanTutar - (birimTaksit * (taksitSayisi - 1))) * 100) / 100
          }

          taksitlerArray.push({
            cari_id: servis.cari_id,
            servis_id: parseInt(servisId),
            taksit_sirasi: `${i + 1}/${taksitSayisi}`,
            vade_tarihi: vDate.toISOString().split('T')[0],
            tutar: tTutar,
            durum: 'Bekliyor',
            aciklama: `${servis.arac?.plaka} - Taksitlendirme`,
            kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
            subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
          })
        }

        const { error: tError } = await supabase.from('taksitler').insert(taksitlerArray)
        if (tError) throw tError

        // Servis kartını güncelle (Taksitlendirilmiş tutarı ödenen sayalım mı? 
        // Esnaf mantığında "Açık Hesap" kapatılmış sayılır ama kasa girişi taksit takipten gelir.)
        const yeniOdenen = (servis.odenen_tutar || 0) + miktar
        let durum = yeniOdenen >= genelToplam - 0.01 ? 'Ödendi' : 'Kısmi Ödendi'
        
        await supabase.from('servis_karti').update({
          odenen_tutar: yeniOdenen,
          odeme_durumu: durum
        }).eq('id', servisId)

      } else {
        // Normal Ödeme Akışı (Nakit, Kart, Çek vb.)
        const yeniOdenen = (servis.odenen_tutar || 0) + miktar
        let durum = yeniOdenen >= genelToplam - 0.01 ? 'Ödendi' : 'Kısmi Ödendi'
        if (yeniOdenen <= 0) durum = 'Bekliyor'

        const isCheckOrBill = odemeForm.odeme_sekli === 'Çek' || odemeForm.odeme_sekli === 'Senet'

        if (isCheckOrBill) {
          const { error: csError } = await supabase.from('cek_senet').insert([{
            evrak_turu: odemeForm.odeme_sekli,
            islem_yonu: 'Müşteriden Alınan',
            belge_no: odemeForm.belge_no,
            vade_tarihi: odemeForm.vade_tarihi,
            tutar: miktar,
            cari_id: servis.cari_id,
            servis_id: parseInt(servisId),
            durum: 'Bekliyor',
            aciklama: odemeForm.aciklama || `SRV-${servis.servis_no} nolu servis alacağı`,
            kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
            subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
          }])
          if (csError) throw csError
        } else {
          const { error: hError } = await supabase.from('kasa_hareket').insert([{
            kasa_id: parseInt(odemeForm.kasa_id),
            servis_id: parseInt(servisId),
            tur: 'gelir',
            tutar: miktar,
            kategori: 'Servis Ödemesi',
            aciklama: odemeForm.aciklama || `SRV-${servis.servis_no} nolu servis ödemesi`,
            islem_tarihi: odemeForm.tarih,
            odeme_sekli: odemeForm.odeme_sekli,
            kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
            subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
          }])
          if (hError) throw hError
        }

        await supabase.from('servis_karti').update({
          odenen_tutar: yeniOdenen,
          odeme_durumu: durum
        }).eq('id', servisId)
      }

      showToast('İşlem başarıyla tamamlandı')
      setOdemePanel(false)
      setOdemeForm({ ...odemeForm, tutar: '', aciklama: '', pesinat: '0' })
      fetchData()
    } catch (err: any) {
      console.error('Payment Error:', err)
      showToast('Hata: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }


  /* ─── Finansal Hesaplamalar ─── */
  const finance = useMemo(() => {
    const persistedRows = islemler.filter(r => !r._isNew)
    const araToplam = persistedRows.reduce((sum, r) => sum + (r.miktar * r.birim_fiyat), 0)
    const toplamKDV = persistedRows.reduce((sum, r) => sum + (r.miktar * r.birim_fiyat * (r.kdv_oran / 100)), 0)
    return {
      araToplam,
      toplamKDV,
      genelToplam: araToplam + toplamKDV,
      parcaSayisi: persistedRows.filter(r => r.islem_turu === 'parca').length,
      iscilikSayisi: persistedRows.filter(r => r.islem_turu === 'iscilik').length,
    }
  }, [islemler])

  /* ─── Satır Ekleme (inline) ─── */
  const handleSatirEkle = () => {
    const hasNewRow = islemler.some(r => r._isNew)
    if (hasNewRow) return
    setIslemler(prev => [...prev, {
      servis_karti_id: parseInt(servisId),
      stok_id: null,
      islem_turu: 'parca',
      aciklama: '',
      miktar: 1,
      birim: 'Adet',
      birim_fiyat: 0,
      kdv_oran: 20,
      toplam_tutar: 0,
      _isNew: true,
      _isEditing: true,
      _searchValue: '',
    }])
  }

  /* ─── Yeni satır kaydet ─── */
  const handleYeniSatirKaydet = async (row: IslemRow) => {
    const toplamTutar = row.miktar * row.birim_fiyat
    const { error } = await supabase.from('servis_islem').insert([{
      servis_karti_id: parseInt(servisId),
      stok_id: row.stok_id,
      islem_turu: row.islem_turu,
      aciklama: row.aciklama,
      miktar: row.miktar,
      birim: row.birim,
      birim_fiyat: row.birim_fiyat,
      kdv_oran: row.kdv_oran,
      toplam_tutar: toplamTutar,
    }])

    if (!error && row.islem_turu === 'parca' && row.stok_id) {
       // Stok düşümü
       await supabase.from('stok_hareket').insert([{
         stok_id: row.stok_id,
         servis_id: parseInt(servisId),
         hareket_turu: 'Çıkış',
         miktar: row.miktar,
         birim_fiyat: row.birim_fiyat,
         notlar: 'Servis kaydına parça eklendi'
       }])
       await supabase.rpc('update_stok_miktar', { s_id: row.stok_id, degisim: -row.miktar })
    }

    setSaving(false)
    if (error) { showToast('Hata: ' + error.message, 'error'); return }
    showToast('Satır eklendi')
    await fetchData()
  }

  /* ─── Satır düzenleme başlat ─── */
  const handleDuzenlemeBaslat = (idx: number) => {
    setIslemler(prev => prev.map((r, i) => i === idx ? { ...r, _isEditing: true, _searchValue: r.aciklama } : r))
  }

  /* ─── Satır düzenleme kaydet ─── */
  const handleDuzenlemeKaydet = async (row: IslemRow) => {
    if (!row.id) return
    setSaving(true)

    // Diff için eski kaydı al
    const { data: oldData } = await supabase.from('servis_islem').select('*').eq('id', row.id).single()
    
    const toplamTutar = row.miktar * row.birim_fiyat
    const { error } = await supabase.from('servis_islem').update({
      islem_turu: row.islem_turu,
      aciklama: row.aciklama,
      stok_id: row.stok_id,
      miktar: row.miktar,
      birim: row.birim,
      birim_fiyat: row.birim_fiyat,
      kdv_oran: row.kdv_oran,
      toplam_tutar: toplamTutar,
    }).eq('id', row.id)

    if (!error && oldData && row.islem_turu === 'parca' && row.stok_id) {
        // Miktar değişimi hesapla
        const degisim = oldData.miktar - row.miktar
        if (degisim !== 0) {
           await supabase.from('stok_hareket').insert([{
             stok_id: row.stok_id,
             servis_id: parseInt(servisId),
             hareket_turu: degisim > 0 ? 'Giriş' : 'Çıkış',
             miktar: Math.abs(degisim),
             notlar: 'Servis parçası güncellendi (Miktar değişimi)'
           }])
           await supabase.rpc('update_stok_miktar', { s_id: row.stok_id, degisim: degisim })
        }
    }

    setSaving(false)
    if (error) { showToast('Hata: ' + error.message, 'error'); return }
    showToast('Satır güncellendi')
    await fetchData()
  }

  /* ─── Düzenleme iptal ─── */
  const handleDuzenlemeIptal = (idx: number) => {
    setIslemler(prev => {
      const row = prev[idx]
      if (row._isNew) return prev.filter((_, i) => i !== idx)
      return prev.map((r, i) => i === idx ? { ...r, _isEditing: false } : r)
    })
  }

  /* ─── Row field güncelleyici ─── */
  const updateRowField = (idx: number, field: string, value: any) => {
    setIslemler(prev => prev.map((r, i) => {
      if (i !== idx) return r
      const updated = { ...r, [field]: value }
      // miktar veya birim_fiyat değiştiğinde toplam_tutar güncelle
      if (field === 'miktar' || field === 'birim_fiyat') {
        updated.toplam_tutar = (updated.miktar || 0) * (updated.birim_fiyat || 0)
      }
      return updated
    }))
  }

  /* ─── SmartProductSearch seçimi ─── */
  const handleProductSelect = (idx: number, item: StokItem) => {
    setIslemler(prev => prev.map((r, i) => {
      if (i !== idx) return r
      return {
        ...r,
        stok_id: item.id,
        aciklama: item.ad,
        birim: item.birim || 'Adet',
        birim_fiyat: item.s_fiyat || 0,
        kdv_oran: item.kdv_oran ?? 18,
        toplam_tutar: (r.miktar || 1) * (item.s_fiyat || 0),
        _searchValue: item.ad,
      }
    }))
  }

  /* ─── İşlem Sil ─── */
  const handleIslemSil = async (islemId: number) => {
    // Stok iadesi için kaydı çek
    const { data: row } = await supabase.from('servis_islem').select('*').eq('id', islemId).single()

    const { error } = await supabase.from('servis_islem').delete().eq('id', islemId)
    
    if (!error && row && row.islem_turu === 'parca' && row.stok_id) {
       await supabase.from('stok_hareket').insert([{
         stok_id: row.stok_id,
         servis_id: parseInt(servisId),
         hareket_turu: 'Giriş',
         miktar: row.miktar,
         notlar: 'Parça servis kaydından silindi (İade)'
       }])
       await supabase.rpc('update_stok_miktar', { s_id: row.stok_id, degisim: row.miktar })
    }

    if (error) { showToast('Silinemedi: ' + error.message, 'error'); return }
    showToast('İşlem silindi', 'info')
    await fetchData()
  }

  /* ─── Servis Sil ─── */
  const handleServisSil = async () => {
    setSaving(true)
    const { error } = await supabase.from('servis_karti').delete().eq('id', servisId)
    if (error) {
      showToast('Silinemedi: ' + error.message, 'error')
      setSaving(false)
      return
    }
    router.push('/servis-kayitlari')
  }

  /* ─── Durum güncelleme ─── */
  const durumGuncelle = async (yeniDurum: string) => {
    await supabase.from('servis_karti').update({ durum: yeniDurum }).eq('id', servisId)
    setServis({ ...servis, durum: yeniDurum })
    showToast(`Durum "${yeniDurum}" olarak güncellendi`)
  }

  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem' }}>
      <div className="spinner" />
    </div>
  )

  if (!servis) return (
    <div className="empty-state">
      <div style={{ color: '#94a3b8', marginBottom: '1rem' }}>{Icons.wrench}</div>
      <div className="empty-state-title">Servis kaydı bulunamadı</div>
      <button className="btn-secondary" onClick={() => router.back()} style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        {Icons.back} Geri
      </button>
    </div>
  )

  const currentDurum = servis.durum || 'Araç Kabul'
  const [durumColor, durumBg] = DURUM_RENKLER[currentDurum] || DURUM_RENKLER['Araç Kabul']

  return (
    <div className="animate-fadeIn">
      {/* ─── Toast ─── */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && Icons.check}
            {toast.type === 'error' && Icons.x}
            {toast.type === 'info' && Icons.file}
            <span style={{ marginLeft: '4px' }}>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* ─── Breadcrumb ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '6px 10px', background: 'none', border: '1px solid #e2e8f0',
            borderRadius: '8px', color: '#64748b', cursor: 'pointer', fontSize: '13px',
            fontWeight: 600, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#e2e8f0' }}
        >
          {Icons.back} Geri
        </button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <Link href="/servis-kayitlari" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>Servis Kayıtları</Link>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ color: '#0f172a', fontWeight: 700 }}>SRV-{servis.servis_no || servis.id}</span>
      </div>

      {/* ─── Header Card ─── */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          {/* Sol */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}>
                {Icons.wrench}
              </div>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                  SRV-{servis.servis_no || servis.id}
                </h1>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0', fontWeight: 500 }}>
                  {servis.cari_kart?.yetkili || 'Müşteri bilgisi yok'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => setConfirmData({ open: true, type: 'servis', itemId: null })}
                style={{
                  padding: '7px 14px', background: '#fef2f2', color: '#dc2626',
                  border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                {Icons.trash} İş Emrini Sil
              </button>
            </div>
          </div>

          {/* Sağ - Durum */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Ödeme Durumu Badgesi */}
              <span style={{
                fontSize: '11px', padding: '4px 10px', borderRadius: '6px', fontWeight: 800,
                background: servis.odeme_durumu === 'Ödendi' ? '#dcfce7' : (servis.odeme_durumu === 'Kısmi Ödendi' ? '#fef9c3' : '#f1f5f9'),
                color: servis.odeme_durumu === 'Ödendi' ? '#166534' : (servis.odeme_durumu === 'Kısmi Ödendi' ? '#854d0e' : '#64748b'),
                border: '1px solid currentColor', opacity: 0.8
              }}>
                {servis.odeme_durumu || 'Bekliyor'}
              </span>
              <span style={{
                fontSize: '13px', padding: '8px 18px',
                borderRadius: '9999px', fontWeight: 700,
                background: durumBg, color: durumColor,
                border: `1.5px solid ${durumColor}25`,
                boxShadow: `0 2px 8px ${durumColor}15`,
              }}>
                {currentDurum}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {IS_AKISI.map(d => {
                const isActive = currentDurum === d
                const [color] = DURUM_RENKLER[d] || ['#64748b', '#f1f5f9']
                return (
                  <button
                    key={d}
                    onClick={() => durumGuncelle(d)}
                    style={{
                      fontSize: '11px', padding: '6px 12px',
                      background: isActive ? color : '#fff',
                      color: isActive ? '#fff' : '#64748b',
                      border: isActive ? `1.5px solid ${color}` : '1.5px solid #e2e8f0',
                      fontWeight: 700, borderRadius: '8px', cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isActive ? `0 3px 8px ${color}35` : 'none',
                      opacity: 1,
                    }}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Detay Grid */}
        <div style={{ padding: '20px 28px', borderTop: '1px solid #f1f5f9' }}>
          <div className="detail-grid">
            {[
              { label: 'Müşteri',      value: servis.cari_kart?.yetkili || '—' },
              { label: 'Araç',         value: `${servis.arac?.plaka || ''} — ${servis.arac?.marka || ''} ${servis.arac?.model || ''}` },
              { label: 'Giriş Tarihi', value: new Date(servis.giris_tarihi).toLocaleDateString('tr-TR') },
              { label: 'Geliş KM',     value: servis.gelis_kmsi ? servis.gelis_kmsi.toLocaleString('tr-TR') + ' km' : '—' },
              { label: 'Teknisyen',    value: servis.teknisyen || '—' },
              { label: 'Şikayet',      value: servis.sikayet || '—' },
            ].map(item => (
              <div className="detail-item" key={item.label}>
                <div className="detail-label">{item.label}</div>
                <div className="detail-value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── İşlemler Tablosu ─── */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {Icons.file}
            <h2 style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', margin: 0 }}>Proforma Detayları</h2>
          </div>
          <button
            className="btn-primary"
            onClick={handleSatirEkle}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {Icons.plus} Satır Ekle
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="compact-table">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Tür</th>
                <th style={{ minWidth: '150px' }}>Ürün / İşlem Adı</th>
                <th style={{ textAlign: 'center', width: '70px' }}>Miktar</th>
                <th style={{ textAlign: 'center', width: '85px' }}>Birim</th>
                <th style={{ textAlign: 'right', width: '110px' }}>Birim Fiyat</th>
                <th style={{ textAlign: 'center', width: '75px' }}>KDV (%)</th>
                <th style={{ textAlign: 'right', width: '130px' }}>Satır Toplamı</th>
                <th style={{ textAlign: 'center', width: '90px' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {islemler.map((row, idx) => {
                const satırNet = row.miktar * row.birim_fiyat
                const satırKDV = satırNet * (row.kdv_oran / 100)
                const satırToplam = satırNet + satırKDV

                if (row._isEditing) {
                  return (
                    <tr key={row.id || `new-${idx}`} style={{ background: '#fafbff' }}>
                      {/* Tür */}
                      <td>
                        <select
                          value={row.islem_turu}
                          onChange={e => updateRowField(idx, 'islem_turu', e.target.value)}
                          style={{ padding: '7px 8px', fontSize: '12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', width: '100%' }}
                        >
                          <option value="parca">Parça</option>
                          <option value="iscilik">İşçilik</option>
                        </select>
                      </td>
                      {/* Ürün / İşlem Adı */}
                      <td>
                        {row.islem_turu === 'parca' ? (
                          <SmartProductSearch
                            value={row._searchValue || ''}
                            onChange={(val) => {
                              updateRowField(idx, '_searchValue', val)
                              updateRowField(idx, 'aciklama', val)
                            }}
                            onSelect={(item) => handleProductSelect(idx, item)}
                            placeholder="Ürün adı veya kodu..."
                          />
                        ) : (
                          <input
                            type="text"
                            value={row.aciklama}
                            onChange={e => updateRowField(idx, 'aciklama', e.target.value)}
                            placeholder="İşçilik açıklaması..."
                            style={{ padding: '8px 12px', fontSize: '13px', border: '1.5px solid #e2e8f0', borderRadius: '8px', width: '100%' }}
                          />
                        )}
                      </td>
                      {/* Miktar */}
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={row.miktar}
                          onChange={e => updateRowField(idx, 'miktar', parseFloat(e.target.value) || 0)}
                          style={{ padding: '7px 8px', fontSize: '13px', textAlign: 'center', border: '1.5px solid #e2e8f0', borderRadius: '8px', width: '100%' }}
                        />
                      </td>
                      {/* Birim */}
                      <td>
                        <select
                          value={row.birim}
                          onChange={e => updateRowField(idx, 'birim', e.target.value)}
                          style={{ padding: '7px 8px', fontSize: '12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', width: '100%' }}
                        >
                          <option value="Adet">Adet</option>
                          <option value="Saat">Saat</option>
                          <option value="Metre">Metre</option>
                          <option value="Litre">Litre</option>
                          <option value="Kg">Kg</option>
                          <option value="Takım">Takım</option>
                        </select>
                      </td>
                      {/* Birim Fiyat */}
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.birim_fiyat}
                          onChange={e => updateRowField(idx, 'birim_fiyat', parseFloat(e.target.value) || 0)}
                          style={{ padding: '7px 8px', fontSize: '13px', textAlign: 'right', border: '1.5px solid #e2e8f0', borderRadius: '8px', width: '100%' }}
                        />
                      </td>
                      {/* KDV */}
                      <td>
                        <select
                          value={row.kdv_oran}
                          onChange={e => updateRowField(idx, 'kdv_oran', parseInt(e.target.value))}
                          style={{ padding: '7px 8px', fontSize: '12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', width: '100%' }}
                        >
                          <option value={0}>%0</option>
                          <option value={1}>%1</option>
                          <option value={10}>%10</option>
                          <option value={20}>%20</option>
                        </select>
                      </td>
                      {/* Satır Toplamı */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                          {satırToplam.toFixed(2)} ₺
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          (KDV: {satırKDV.toFixed(2)} ₺)
                        </div>
                      </td>
                      {/* Aksiyon */}
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => row._isNew ? handleYeniSatirKaydet(row) : handleDuzenlemeKaydet(row)}
                            disabled={saving}
                            style={{
                              padding: '6px 10px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0',
                              borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s',
                            }}
                          >
                            {Icons.check}
                          </button>
                          <button
                            onClick={() => handleDuzenlemeIptal(idx)}
                            style={{
                              padding: '6px 10px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0',
                              borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s',
                            }}
                          >
                            {Icons.x}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                // Normal (okuma) modu
                return (
                  <tr key={row.id} style={{ transition: 'background 0.15s' }}>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700,
                        background: row.islem_turu === 'parca' ? '#e0f2fe' : '#fef3c7',
                        color: row.islem_turu === 'parca' ? '#0369a1' : '#92400e',
                      }}>
                        {row.islem_turu === 'parca' ? 'Parça' : 'İşçilik'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{row.aciklama}</div>
                      {row.stok?.kod && <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>{row.stok.kod}</div>}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.miktar}</td>
                    <td style={{ textAlign: 'center', color: '#64748b', fontSize: '13px' }}>{row.birim || 'Adet'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.birim_fiyat?.toFixed(2)} ₺</td>
                    <td style={{ textAlign: 'center', color: '#64748b', fontSize: '13px' }}>%{row.kdv_oran ?? 18}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{satırToplam.toFixed(2)} ₺</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>KDV: {satırKDV.toFixed(2)} ₺</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleDuzenlemeBaslat(idx)}
                          style={{
                            padding: '5px 8px', background: '#e0f2fe', color: '#0284c7', border: 'none',
                            borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                            transition: 'all 0.15s',
                          }}
                          title="Düzenle"
                        >
                          {Icons.edit}
                        </button>
                        <button
                          onClick={() => setConfirmData({ open: true, type: 'islem', itemId: row.id! })}
                          style={{
                            padding: '5px 8px', background: '#fee2e2', color: '#dc2626', border: 'none',
                            borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                            transition: 'all 0.15s',
                          }}
                          title="Sil"
                        >
                          {Icons.trash}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {islemler.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ color: '#cbd5e1', marginBottom: '12px' }}>{Icons.file}</div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#64748b' }}>Henüz işlem eklenmemiş</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Proforma faturaya satır eklemek için yukarıdaki butonu kullanın</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Canlı Finansal Özet ─── */}
      {islemler.filter(r => !r._isNew).length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <div style={{
            background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
            padding: '24px 32px', minWidth: '340px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              Finansal Özet
            </div>

            {/* Ara Toplam */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Ara Toplam</span>
              <span style={{ fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>{finance.araToplam.toFixed(2)} ₺</span>
            </div>

            {/* KDV */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Toplam KDV</span>
              <span style={{ fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>{finance.toplamKDV.toFixed(2)} ₺</span>
            </div>

            {/* Genel Toplam */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 4px' }}>
              <span style={{ fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>Genel Toplam</span>
              <span style={{
                fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {finance.genelToplam.toFixed(2)} ₺
              </span>
            </div>

            {/* Ödenen / Kalan */}
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Ödenen Tutar</span>
                <span style={{ fontSize: '13px', color: '#059669', fontWeight: 700 }}>{(servis?.odenen_tutar || 0).toFixed(2)} ₺</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Kalan Borç</span>
                <span style={{ fontSize: '13px', color: (finance.genelToplam - (servis?.odenen_tutar || 0)) > 0 ? '#ef4444' : '#64748b', fontWeight: 700 }}>
                  {Math.max(0, finance.genelToplam - (servis?.odenen_tutar || 0)).toFixed(2)} ₺
                </span>
              </div>

              {/* Ödeme Al Butonu - YENİ KONUM */}
              <button
                onClick={() => {
                  const kalan = finance.genelToplam - (servis.odenen_tutar || 0)
                  setOdemeForm({ ...odemeForm, tutar: kalan > 0 ? kalan.toString() : '' })
                  setOdemePanel(true)
                }}
                style={{
                  width: '100%', padding: '12px', background: '#059669', color: '#fff',
                  border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 800,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(5,150,105,0.2)', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {Icons.wallet} Ödeme Al (Tahsilat)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ConfirmModal ─── */}
      {/* ─── Ödeme Al SlideOver ─── */}
      {/* ─── Ödeme Al Modal (Popup) ─── */}
      <Modal
        isOpen={odemePanel}
        onClose={() => setOdemePanel(false)}
        title="Ödeme Tahsilatı"
        subtitle={`SRV-${servis?.servis_no || servis?.id} ödeme kaydı`}
        size="sm"
      >
        <form onSubmit={handleOdemeAl} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 28px 24px' }}>
          <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #dcfce7', textAlign: 'center' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#166534', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Tahsilat Tutarı
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#10b981' }}>₺</span>
              <input
                type="number" step="0.01" required placeholder="0.00" autoFocus
                style={{
                  width: '180px', border: 'none', background: 'transparent',
                  fontSize: '36px', fontWeight: 900, color: '#10b981', textAlign: 'left', outline: 'none'
                }}
                value={odemeForm.tutar} onChange={e => setOdemeForm({ ...odemeForm, tutar: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Hesap (Kasa/Banka) Seçimi</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <select
                required
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '14px' }}
                value={odemeForm.kasa_id}
                onChange={e => setOdemeForm({ ...odemeForm, kasa_id: e.target.value })}
              >
                <option value="">Hesap Seçin...</option>
                {kasalar.map(k => <option key={k.id} value={k.id}>{k.kasa_adi} ({(k.guncel_bakiye || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)</option>)}
              </select>
              <select
                required
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '14px' }}
                value={odemeForm.odeme_sekli}
                onChange={e => setOdemeForm({ ...odemeForm, odeme_sekli: e.target.value })}
              >
                <option value="Nakit">Nakit</option>
                <option value="Kredi Kartı">Kredi Kartı</option>
                <option value="Havale/EFT">Havale/EFT</option>
                <option value="Çek">Çek</option>
                <option value="Senet">Senet</option>
                <option value="Taksitlendirme">Taksitlendirme (Elden)</option>
              </select>
            </div>
          </div>

          {odemeForm.odeme_sekli === 'Taksitlendirme' && (
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Peşinat (Opsiyonel)</label>
                  <input
                    type="number" step="0.01"
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    value={odemeForm.pesinat}
                    onChange={e => setOdemeForm({ ...odemeForm, pesinat: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Peşinat Hesabı</label>
                  <select
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    value={odemeForm.pesinat_kasa_id}
                    onChange={e => setOdemeForm({ ...odemeForm, pesinat_kasa_id: e.target.value })}
                    required={parseFloat(odemeForm.pesinat) > 0}
                  >
                    <option value="">Seçiniz...</option>
                    {kasalar.map(k => <option key={k.id} value={k.id}>{k.kasa_adi} ({(k.guncel_bakiye||0).toLocaleString('tr-TR')} ₺)</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Taksit Sayısı</label>
                  <input
                    type="number" min="2" max="24"
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    value={odemeForm.taksit_sayisi}
                    onChange={e => setOdemeForm({ ...odemeForm, taksit_sayisi: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>İlk Taksit Tarihi</label>
                  <input
                    type="date"
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    value={odemeForm.ilk_vade}
                    onChange={e => setOdemeForm({ ...odemeForm, ilk_vade: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Ödeme Tarihi</label>
              <input
                type="date"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                value={odemeForm.tarih}
                onChange={e => setOdemeForm({ ...odemeForm, tarih: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Kısa Not</label>
              <input
                type="text"
                placeholder="Örn: Nakit tahsilat"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                value={odemeForm.aciklama}
                onChange={e => setOdemeForm({ ...odemeForm, aciklama: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit" disabled={saving || kasalar.length === 0}
            style={{
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
              background: '#10b981', color: '#fff', fontSize: '16px', fontWeight: 800,
              cursor: 'pointer', boxShadow: '0 8px 20px rgba(16,185,129,0.3)', transition: 'all 0.2s'
            }}
          >
            {saving ? 'Kaydediliyor...' : '✓ Tahsilatı Kaydet'}
          </button>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmData.open}
        onClose={() => setConfirmData({ open: false, type: 'islem', itemId: null })}
        onConfirm={() => {
          if (confirmData.type === 'islem' && confirmData.itemId) handleIslemSil(confirmData.itemId)
          else handleServisSil()
        }}
        type="danger"
        title={confirmData.type === 'islem' ? "İşlemi Sil" : "Servis Kaydını Sil"}
        message={confirmData.type === 'islem'
          ? "Bu işlemi (parça/işçilik) silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          : "Bu servis kaydını ve içindeki tüm işlemleri tamamen silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve finansal kayıtları etkileyebilir."}
      />

      <style>{`
        .compact-table th, .compact-table td {
          padding: 8px 12px !important;
          font-size: 13px;
        }
        .compact-table select, .compact-table input {
          font-size: 13px !important;
          padding: 5px 8px !important;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
