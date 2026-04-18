"use client"

import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Modal from '../../components/Modal'

const DURUM_RENKLER: Record<string, [string, string]> = {
  'Tamamlandı':     ['#065f46', '#d1fae5'],
  'Hazır':          ['#065f46', '#d1fae5'],
  'İşlemde':        ['#92400e', '#fef3c7'],
  'Parça Bekliyor': ['#991b1b', '#fee2e2'],
  'Müşteri Onayı':  ['#5b21b6', '#ede9fe'],
  'Teslim Edildi':  ['#1e40af', '#dbeafe'],
  'Girildi':        ['#374151', '#f3f4f6'],
}

const inp: React.CSSProperties = { width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none', color: '#1e293b', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }
const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }

export default function MusteriDetay() {
  const params   = useParams()
  const router   = useRouter()
  const searchParams = useSearchParams()
  const id       = params.id

  const [musteri, setMusteri]   = useState<any>(null)
  const [araclar, setAraclar]   = useState<any[]>([])
  const [servisler, setServisler] = useState<any[]>([])
  const [faturalar, setFaturalar] = useState<any[]>([])
  const [cekler,     setCekler]     = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  
  const [activeTab, setActiveTab] = useState<'araclar' | 'servisler' | 'finans'>('araclar')
  
  // Araç Modal
  const [aracModal, setAracModal] = useState(false)
  const [aracForm, setAracForm] = useState({ plaka: '', marka: '', model: '', yil: '', sase_no: '', renk: '' })
  
  const [hareketModal, setHareketModal] = useState({ acik: false, tip: 'Borç' as 'Borç' | 'Tahsilat' })
  const [hareketForm, setHareketForm] = useState({ tutar: '', aciklama: '' })

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'}|null>(null)

  const showToast = (msg: string, type: 'success'|'error' = 'success') => { setToast({msg, type}); setTimeout(() => setToast(null), 3500) }

  const loadData = async () => {
    if (!id) return
    const [musteriRes, aracRes, servisRes, faturaRes, cekRes] = await Promise.all([
      supabase.from('cari_kart').select('*').eq('id', id).single(),
      supabase.from('arac').select('*').eq('cari_id', id),
      supabase.from('servis_karti').select(`*, arac(plaka, marka, model)`).eq('cari_id', id).order('giris_tarihi', { ascending: false }),
      supabase.from('fatura').select('*').eq('cari_id', id).order('fat_tarih', { ascending: false }),
      supabase.from('cek_senet').select('*').or(`cari_id.eq.${id},ciro_edilen_cari_id.eq.${id}`).order('vade_tarihi', { ascending: false })
    ])
    
    const mData = musteriRes.data
    const fData = faturaRes.data || []
    const cData = cekRes.data || []

    if (mData) {
      const servisT = (servisRes.data || []).reduce((acc: number, s: any) => acc + (s.toplam_tutar || 0), 0)
      
      const faturaBorc = fData.filter(f => f.fatura_turu !== 'Tahsilat' && f.fatura_turu !== 'Alacak')
                              .reduce((acc, f) => acc + (f.gtoplam || 0), 0)
      
      const faturaTahsilat = fData.filter(f => f.fatura_turu === 'Tahsilat' || f.fatura_turu === 'Alacak')
                                  .reduce((acc, f) => acc + (f.gtoplam || 0), 0)
      
      // Çek/Senet etkisi: 
      // Bizim alacaklandığımız evraklar (Ondan aldıklarımız)
      const cekTahsilat = cData.filter(c => c.cari_id === parseInt(id as string))
                               .reduce((acc, c) => acc + (c.tutar || 0), 0)
      
      // Tedarikçiye ciro ettiğimiz veya borcumuz için verdiğimiz evraklar (Bizden ona gidenler)
      const cekBorcAzalis = cData.filter(c => c.ciro_edilen_cari_id === parseInt(id as string))
                                 .reduce((acc, c) => acc + (c.tutar || 0), 0)

      mData.toplamBorc = servisT + faturaBorc
      mData.toplamTahsilat = faturaTahsilat + cekTahsilat + cekBorcAzalis
      mData.bakiye = mData.toplamBorc - mData.toplamTahsilat
    }

    setMusteri(mData)
    setAraclar(aracRes.data || [])
    setServisler(servisRes.data || [])
    setFaturalar(fData)
    setCekler(cData)
    setLoading(false)

    if (searchParams.get('arac_ekle') === 'true' && (aracRes.data || []).length === 0) {
      setAracModal(true)
    }
  }

  useEffect(() => { loadData() }, [id])

  const handleAracKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aracForm.plaka.trim() || !aracForm.marka.trim() || !aracForm.model.trim()) {
      showToast('Plaka, marka ve model zorunludur', 'error')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('arac').insert([{
      cari_id: id,
      plaka: aracForm.plaka.trim(),
      marka: aracForm.marka.trim(),
      model: aracForm.model.trim(),
      yil:   aracForm.yil.trim() || null,
      sase_no: aracForm.sase_no.trim() || null,
      renk: aracForm.renk.trim() || null
    }])
    setSaving(false)
    if (error) { showToast('Hata: ' + error.message, 'error'); return }
    showToast('Araç başarıyla eklendi')
    setAracModal(false)
    setAracForm({ plaka: '', marka: '', model: '', yil: '', sase_no: '', renk: '' })
    await loadData()
  }

  const acHareketModal = (tip: 'Borç' | 'Tahsilat') => {
    setHareketForm({ tutar: '', aciklama: '' })
    setHareketModal({ acik: true, tip })
  }

  const handleHareketKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hareketForm.tutar || parseFloat(hareketForm.tutar) <= 0) {
      showToast('Geçerli bir tutar giriniz', 'error'); return
    }
    setSaving(true)
    const { error } = await supabase.from('fatura').insert([{
      cari_id: id,
      fatura_turu: hareketModal.tip,
      gtoplam: parseFloat(hareketForm.tutar),
      evrak_no: hareketForm.aciklama || (hareketModal.tip === 'Borç' ? 'BORC-' : 'TAH-') + Date.now().toString().slice(-6),
      fat_tarih: new Date().toISOString(),
      toplam: parseFloat(hareketForm.tutar),
      kdv: 0
    }])
    setSaving(false)
    if (error) { showToast('Hata: ' + error.message, 'error'); return }
    showToast('Finansal hareket kaydedildi')
    setHareketModal({ acik: false, tip: 'Borç' })
    await loadData()
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px', fontSize: '18px', color: '#64748b' }}>Profil Yükleniyor...</div>
  }

  if (!musteri) {
    return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px', gap: '20px' }}>
      <div style={{ fontSize: '48px' }}>🔍</div>
      <h2 style={{ color: '#0f172a' }}>Müşteri Bulunamadı</h2>
      <button onClick={() => router.push('/musteriler')} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Geri Dön</button>
    </div>
  }

  const tip = musteri.vergi_no ? 'Kurumsal' : 'Bireysel'
  const telLink = (musteri.cep || musteri.tel || '').replace(/\s+/g, '')
  
  // Finans Mock
  const hasBorc = Math.random() > 0.5
  const bakiye = hasBorc ? Math.floor(Math.random() * 8000) + 1200 : 0
  const harcama = Math.floor(Math.random() * 20000) + 5000

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px 0' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, background: toast.type==='error'?'#ef4444':'#10b981', color: '#fff', padding: '14px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', animation: 'modalSlideIn 0.2s ease-out' }}>
          {toast.msg}
        </div>
      )}

      {/* Üst Kısım: Geri & Başlık */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => router.push('/musteriler')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', padding: '10px', borderRadius: '10px', cursor: 'pointer', color: '#475569', transition: 'background 0.2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Müşteri Detayı</h1>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>ID: #{musteri.id}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '28px', alignItems: 'start' }}>
        
        {/* SOL PANEL: Sabit Bilgiler */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: '#fff', padding: '28px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#4f46e5', fontWeight: 800, marginBottom: '20px' }}>
              {musteri.yetkili.substring(0,2).toUpperCase()}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>{musteri.yetkili}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
               <span style={{ padding: '4px 10px', background: tip === 'Kurumsal' ? '#f5f3ff' : '#e0f2fe', color: tip === 'Kurumsal' ? '#7c3aed' : '#0284c7', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>{tip} Müşteri</span>
            </div>
            
            <div style={{ height: '1px', width: '100%', background: '#f1f5f9', margin: '24px 0' }}></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '10px', color: '#64748b' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>İletişim</div>
                  <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {musteri.cep || musteri.tel || 'Yok'}
                    {telLink && (
                      <a href={`https://wa.me/90${telLink.replace(/^0/,'')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', padding: '4px', background: '#ecfccb', color: '#4d7c0f', borderRadius: '6px' }} title="WhatsApp'tan Yaz">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                      </a>
                    )}
                  </div>
                  {musteri.mail && <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{musteri.mail}</div>}
                </div>
              </div>

              {tip === 'Kurumsal' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '10px', color: '#64748b' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Vergi Bilgileri</div>
                    <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>{musteri.vergi_dairesi} VD.</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>Vergi No: {musteri.vergi_no}</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '10px', color: '#64748b' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Adres</div>
                  <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500, marginTop: '2px', lineHeight: 1.4 }}>{musteri.adres || 'Bilinmiyor'}</div>
                </div>
              </div>
              
            </div>
            
            <div style={{ height: '1px', width: '100%', background: '#f1f5f9', margin: '24px 0' }}></div>
            
            {/* Finansal Özet */}
            <div style={{ width: '100%', textAlign: 'left', background: '#f8fafc', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '16px' }}>Finansal Özet</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>Toplam Borç</span>
                <span style={{ fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>₺ {(musteri?.toplamBorc || 0).toLocaleString('tr-TR')}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>Toplam Tahsilat</span>
                <span style={{ fontSize: '15px', color: '#10b981', fontWeight: 700 }}>₺ {(musteri?.toplamTahsilat || 0).toLocaleString('tr-TR')}</span>
              </div>
              
              <div style={{ height: '1px', width: '100%', background: '#e2e8f0', margin: '12px 0' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>Güncel Bakiye</span>
                <span style={{ fontSize: '18px', color: (musteri?.bakiye || 0) > 0 ? '#ef4444' : (musteri?.bakiye || 0) < 0 ? '#10b981' : '#64748b', fontWeight: 800 }}>
                  ₺ {Math.abs(musteri?.bakiye || 0).toLocaleString('tr-TR')}
                  {(musteri?.bakiye || 0) > 0 && <span style={{ fontSize: '12px', marginLeft: '6px' }}>(Borç)</span>}
                  {(musteri?.bakiye || 0) < 0 && <span style={{ fontSize: '12px', marginLeft: '6px' }}>(Alacak)</span>}
                  {(musteri?.bakiye || 0) === 0 && <span style={{ fontSize: '12px', marginLeft: '6px' }}>(Dengede)</span>}
                </span>
              </div>
            </div>
            
          </div>
        </div>

        {/* SAĞ PANEL: Sekmeler (Tabs) */}
        <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          
          {/* Tab Navigation */}
          <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', padding: '0 12px' }}>
            <button onClick={() => setActiveTab('araclar')} style={{ padding: '20px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'araclar' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'araclar' ? '#3b82f6' : '#64748b', fontSize: '15px', fontWeight: activeTab === 'araclar' ? 800 : 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              Kayıtlı Araçları ({araclar.length})
            </button>
            <button onClick={() => setActiveTab('servisler')} style={{ padding: '20px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'servisler' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'servisler' ? '#3b82f6' : '#64748b', fontSize: '15px', fontWeight: activeTab === 'servisler' ? 800 : 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              Servis Geçmişi ({servisler.length})
            </button>
            <button onClick={() => setActiveTab('finans')} style={{ padding: '20px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'finans' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'finans' ? '#3b82f6' : '#64748b', fontSize: '15px', fontWeight: activeTab === 'finans' ? 800 : 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              Finans ve Faturalar
            </button>
          </div>

          <div style={{ padding: '32px', flex: 1, background: '#fafbfc', borderRadius: '0 0 20px 20px' }}>
            
            {/* Sekme 1: Araçlar */}
            {activeTab === 'araclar' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Araçlar</h3>
                  <button onClick={() => setAracModal(true)} style={{ padding: '10px 18px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Yeni Araç Ekle
                  </button>
                </div>
                {araclar.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#94a3b8' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h10l1.4-3h1.3l.3 3z"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="15.5" cy="17.5" r="2.5"/></svg>
                    </div>
                    <div style={{ marginTop: '16px', fontWeight: 700, color: '#0f172a', fontSize: '16px' }}>Kayıtlı araç yok</div>
                    <div style={{ marginTop: '8px', color: '#64748b', fontSize: '14px' }}>Müşteriye hemen yeni bir araç ekleyerek işlem başlatabilirsiniz.</div>
                    <button onClick={() => setAracModal(true)} style={{ marginTop: '20px', padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>Hemen Ekle</button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                    {araclar.map(a => (
                      <div key={a.id} style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', position: 'relative' }}>
                        <div style={{ display: 'inline-flex', background: '#f8fafc', border: '1.5px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', color: '#0f172a', fontWeight: 800, fontSize: '18px', letterSpacing: '1px', marginBottom: '16px', fontFamily: 'monospace' }}>
                          {a.plaka}
                        </div>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#334155', fontWeight: 700 }}>{a.marka} {a.model} {a.yil && `(${a.yil})`}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Renk</div>
                            <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500, marginTop: '2px' }}>{a.renk || 'Bilinmiyor'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Şasi No</div>
                            <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500, marginTop: '2px', fontFamily: 'monospace' }}>{a.sase_no || 'Bilinmiyor'}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                           <button onClick={() => { window.location.href = `/?modal=servis&cari_id=${id}&arac_id=${a.id}` }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>
                             Servis Aç
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sekme 2: Servis Geçmişi */}
            {activeTab === 'servisler' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 24px 0' }}>Servis Geçmişi</h3>
                {servisler.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#94a3b8' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    </div>
                    <div style={{ marginTop: '16px', fontWeight: 700, color: '#0f172a', fontSize: '16px' }}>Kayıt bulunamadı</div>
                  </div>
                ) : (
                  <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Servis No / Araç</th>
                          <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Giriş Tarihi</th>
                          <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Durum</th>
                          <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tutar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {servisler.map((s, idx) => {
                          const d = DURUM_RENKLER[s.durum] || DURUM_RENKLER['Girildi']
                          return (
                            <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                              <td style={{ padding: '16px 24px' }}>
                                <Link href={`/servis-kayitlari/${s.id}`} style={{ fontWeight: 800, color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}>
                                  {s.servis_no || `#${s.id}`}
                                </Link>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
                                  <span style={{ fontWeight: 700, color: '#334155' }}>{s.arac?.plaka}</span> · {s.arac?.marka}
                                </div>
                              </td>
                              <td style={{ padding: '16px 24px', color: '#475569', fontSize: '13px', fontWeight: 500 }}>
                                {new Date(s.giris_tarihi).toLocaleDateString('tr-TR')}
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                <span style={{ display: 'inline-flex', padding: '5px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, color: d[0], background: d[1] }}>
                                  {s.durum || 'Girildi'}
                                </span>
                              </td>
                              <td style={{ padding: '16px 24px', fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                                ₺ {s.toplam_tutar > 0 ? s.toplam_tutar.toLocaleString('tr-TR') : '---'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sekme 3: Finans ve Faturalar */}
            {activeTab === 'finans' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Finansal Hareketler</h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => acHareketModal('Borç')} style={{ padding: '10px 18px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Cariyi Borçlandır
                    </button>
                    <button onClick={() => acHareketModal('Tahsilat')} style={{ padding: '10px 18px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Cariyi Alacaklandır
                    </button>
                  </div>
                </div>

                {faturalar.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#94a3b8' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '16px' }}>Finansal hareket bulunamadı</div>
                    <div style={{ marginTop: '8px', color: '#64748b', fontSize: '14px' }}>Müşteri için manuel borç/alacak kaydı veya fatura oluşturun.</div>
                  </div>
                ) : (
                  <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tarih / Evrak</th>
                          <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>İşlem Türü</th>
                          <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Tutar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faturalar.map((f, idx) => (
                          <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{new Date(f.fat_tarih).toLocaleDateString('tr-TR')}</div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{f.evrak_no || `#${f.id}`}</div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, background: (f.fatura_turu === 'Tahsilat' || f.fatura_turu === 'Alacak') ? '#f0fdf4' : '#fef2f2', color: (f.fatura_turu === 'Tahsilat' || f.fatura_turu === 'Alacak') ? '#16a34a' : '#dc2626' }}>
                                {f.fatura_turu}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, fontSize: '15px', color: (f.fatura_turu === 'Tahsilat' || f.fatura_turu === 'Alacak') ? '#16a34a' : '#0f172a' }}>
                              {(f.fatura_turu === 'Tahsilat' || f.fatura_turu === 'Alacak') ? '-' : '+'} {f.gtoplam?.toLocaleString('tr-TR')} ₺
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Çek & Senet Bölümü */}
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '32px 0 24px 0' }}>Çek & Senetler</h3>
                {cekler.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ color: '#94a3b8', fontSize: '14px' }}>Cari ile ilişkili çek veya senet bulunamadı.</div>
                  </div>
                ) : (
                  <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Vade / Tür</th>
                          <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>İşlem</th>
                          <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Durum</th>
                          <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Tutar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cekler.map((c, idx) => {
                          const isEndorsedToHim = c.ciro_edilen_cari_id === parseInt(id as string)
                          return (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                              <td style={{ padding: '16px 24px' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{new Date(c.vade_tarihi).toLocaleDateString('tr-TR')}</div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{c.evrak_turu} No: {c.belge_no || '-'}</div>
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                  {isEndorsedToHim ? 'Ciro Edilen (Bizden Ona)' : 'Müşteri Evrakı (Ondan Bize)'}
                                </div>
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                                  {c.durum}
                                </span>
                              </td>
                              <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                                {c.tutar?.toLocaleString('tr-TR')} ₺
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>

      </div>

      {/* ── YENİ ARAÇ MODALI ── */}
      <Modal isOpen={aracModal} onClose={() => setAracModal(false)} title="Müşteriye Yeni Araç Ekle" subtitle="Plaka, marka ve model zorunludur" size="md">
        <form onSubmit={handleAracKaydet}>
          <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Plaka <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={{ ...inp, textTransform: 'uppercase' }} placeholder="34 ABC 123" value={aracForm.plaka} onChange={e => setAracForm({ ...aracForm, plaka: e.target.value })} required />
              </div>
              
              <div>
                <label style={lbl}>Marka <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inp} placeholder="Renault" value={aracForm.marka} onChange={e => setAracForm({ ...aracForm, marka: e.target.value })} required />
              </div>

              <div>
                <label style={lbl}>Model <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inp} placeholder="Clio" value={aracForm.model} onChange={e => setAracForm({ ...aracForm, model: e.target.value })} required />
              </div>

              <div>
                <label style={lbl}>Yıl (Opsiyonel)</label>
                <input style={inp} placeholder="2022" value={aracForm.yil} onChange={e => setAracForm({ ...aracForm, yil: e.target.value })} />
              </div>

              <div>
                <label style={lbl}>Renk (Opsiyonel)</label>
                <input style={inp} placeholder="Beyaz" value={aracForm.renk} onChange={e => setAracForm({ ...aracForm, renk: e.target.value })} />
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Şasi No (Opsiyonel)</label>
                <input style={inp} placeholder="VF123..." value={aracForm.sase_no} onChange={e => setAracForm({ ...aracForm, sase_no: e.target.value })} />
              </div>
            </div>
          </div>
          <div style={{ padding: '18px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '14px', background: '#fafbfc', borderRadius: '0 0 16px 16px' }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
              {saving ? 'Ekleniyor...' : 'Aracı Kaydet'}
            </button>
            <button type="button" onClick={() => setAracModal(false)} style={{ padding: '14px 24px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>
              İptal
            </button>
          </div>
        </form>
      </Modal>

      {/* ── HAREKET MODALI (BORÇ/ALACAK) ── */}
      <Modal isOpen={hareketModal.acik} onClose={() => setHareketModal({ acik: false, tip: 'Borç' })} title={hareketModal.tip === 'Borç' ? 'Cariyi Borçlandır' : 'Cariyi Alacaklandır'} subtitle="Manuel finansal işlem kaydı oluştur" size="sm">
        <form onSubmit={handleHareketKaydet}>
          <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={lbl}>İşlem Tutarı <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input type="number" step="0.01" placeholder="0.00" value={hareketForm.tutar} onChange={e => setHareketForm({ ...hareketForm, tutar: e.target.value })} style={{ ...inp, paddingRight: '40px', fontSize: '18px', fontWeight: 800 }} required />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#94a3b8' }}>₺</span>
              </div>
            </div>
            <div>
              <label style={lbl}>Açıklama / Evrak No</label>
              <input style={inp} placeholder="Örn: Nakit Tahsilat" value={hareketForm.aciklama} onChange={e => setHareketForm({ ...hareketForm, aciklama: e.target.value })} />
            </div>
            <div style={{ padding: '12px', background: hareketModal.tip === 'Borç' ? '#fff1f2' : '#f0fdf4', borderRadius: '10px', fontSize: '13px', color: hareketModal.tip === 'Borç' ? '#991b1b' : '#166534', fontWeight: 600 }}>
              {hareketModal.tip === 'Borç' ? '⚠️ Bu işlem müşterinin borç bakiyesini ARTIRACAKTIR.' : '✓ Bu işlem müşterinin borç bakiyesini AZALTACAKTIR (Tahsilat).'}
            </div>
          </div>
          <div style={{ padding: '18px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '14px', background: '#fafbfc', borderRadius: '0 0 16px 16px' }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '14px', background: hareketModal.tip === 'Borç' ? '#dc2626' : '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Kaydediliyor...' : 'İşlemi Onayla'}
            </button>
            <button type="button" onClick={() => setHareketModal({ acik: false, tip: 'Borç' })} style={{ padding: '14px 24px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>İptal</button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
