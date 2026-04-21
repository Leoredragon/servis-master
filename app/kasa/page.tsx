"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'

const Icons = {
  plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  wallet: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  bank: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  history: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
  edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}

const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fff', color: '#0f172a' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }

export default function KasaYonetimi() {
  const [kasalar, setKasalar] = useState<any[]>([])
  const [hareketler, setHareketler] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedKasaId, setSelectedKasaId] = useState<string>('all')
  const [filterTur, setFilterTur] = useState('Tümü')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Modals
  const [yeniKasaModal, setYeniKasaModal] = useState(false)
  const [hareketModal, setHareketModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Forms
  const [kasaForm, setKasaForm] = useState({ kasa_adi: '', kasa_turu: 'Nakit', acilis_bakiyesi: '0', banka_adi: '', sube_kodu: '', iban: '' })
  const [hareketForm, setHareketForm] = useState({
    hareket_tur: 'Gelir',
    kasa_id: '',
    hedef_kasa_id: '', // Sadece transfer
    kategori: 'Servis Geliri',
    aciklama: '',
    hesap: '',
    odeme_sekli: 'Nakit',
    tutar: '',
    tarih: new Date().toISOString().split('T')[0]
  })

  // Data Fetching
  const fetchVeriler = useCallback(async () => {
    setLoading(true)
    // 1. Kasalar
    const { data: kasalarData } = await supabase.from('kasalar').select('*').eq('aktif_mi', true).order('kasa_adi')
    setKasalar(kasalarData || [])

    // 2. Hareketler
    let query = supabase.from('kasa_hareket').select('*')
      .gte('islem_tarihi', dateRange.start)
      .lte('islem_tarihi', dateRange.end + 'T23:59:59')
      .order('islem_tarihi', { ascending: false })
      .order('id', { ascending: false })
    
    if (selectedKasaId !== 'all') {
      query = query.eq('kasa_id', selectedKasaId)
    }
    
    const { data: hareketlerData } = await query
    setHareketler(hareketlerData || [])
    setLoading(false)
  }, [dateRange, selectedKasaId])

  useEffect(() => { fetchVeriler() }, [fetchVeriler])

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchQuery) }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Filtering Logic
  const filteredHareketler = useMemo(() => {
    let res = hareketler
    if (filterTur !== 'Tümü') res = res.filter(x => x.tur?.toLowerCase() === filterTur.toLowerCase())
    if (debouncedSearch) {
      const qs = debouncedSearch.toLowerCase()
      res = res.filter(x => (x.aciklama || '').toLowerCase().includes(qs) || (x.kategori || '').toLowerCase().includes(qs))
    }
    return res
  }, [hareketler, filterTur, debouncedSearch])

  const paginatedHareketler = filteredHareketler.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const topBakiye = kasalar.reduce((acc, curr) => acc + (curr.guncel_bakiye || 0), 0)

  // Handlers
  const kaydetKasa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kasaForm.kasa_adi) return
    setIsSaving(true)
    const initialBalance = parseFloat(kasaForm.acilis_bakiyesi) || 0

    const { error } = await supabase.from('kasalar').insert([{
      kasa_adi: kasaForm.kasa_adi,
      kasa_turu: kasaForm.kasa_turu,
      acilis_bakiyesi: initialBalance,
      guncel_bakiye: initialBalance,
      banka_adi: kasaForm.kasa_turu === 'Banka' ? kasaForm.banka_adi : null,
      sube_kodu: kasaForm.kasa_turu === 'Banka' ? kasaForm.sube_kodu : null,
      iban: kasaForm.kasa_turu === 'Banka' ? kasaForm.iban : null
    }])

    setIsSaving(false)
    if (error) alert(error.message)
    else {
      setYeniKasaModal(false)
      setKasaForm({ kasa_adi: '', kasa_turu: 'Nakit', acilis_bakiyesi: '0', banka_adi: '', sube_kodu: '', iban: '' })
      fetchVeriler()
    }
  }

  const kaydetHareket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hareketForm.kasa_id || !hareketForm.tutar) return
    setIsSaving(true)
    const tutar = parseFloat(hareketForm.tutar) || 0
    const fromKasa = kasalar.find(k => k.id.toString() === hareketForm.kasa_id)

    try {
      if (hareketForm.hareket_tur === 'Transfer') {
        if (!hareketForm.hedef_kasa_id || hareketForm.kasa_id === hareketForm.hedef_kasa_id) {
          throw new Error('Farklı bir hedef kasa seçmelisiniz.')
        }
        const toKasa = kasalar.find(k => k.id.toString() === hareketForm.hedef_kasa_id)

        // 1. Çıkış Hareketi
        await supabase.from('kasa_hareket').insert([{
          kasa_id: fromKasa.id,
          tur: 'gider',
          kategori: 'Transfer',
          aciklama: `Transfer -> ${toKasa?.kasa_adi}. ${hareketForm.aciklama}`,
          tutar: tutar,
          islem_tarihi: hareketForm.tarih,
          odeme_sekli: hareketForm.odeme_sekli
        }])
        
        // 2. Giriş Hareketi
        await supabase.from('kasa_hareket').insert([{
          kasa_id: toKasa.id,
          tur: 'gelir',
          kategori: 'Transfer',
          aciklama: `Transfer <- ${fromKasa?.kasa_adi}. ${hareketForm.aciklama}`,
          tutar: tutar,
          islem_tarihi: hareketForm.tarih,
          odeme_sekli: hareketForm.odeme_sekli
        }])

        // 3. Bakiyeleri Güncelle
        await supabase.from('kasalar').update({ guncel_bakiye: (fromKasa.guncel_bakiye || 0) - tutar }).eq('id', fromKasa.id)
        await supabase.from('kasalar').update({ guncel_bakiye: (toKasa.guncel_bakiye || 0) + tutar }).eq('id', toKasa.id)

      } else {
        // Normal Gelir / Gider
        const dbTur = hareketForm.hareket_tur.toLowerCase() // 'gelir' veya 'gider'
        
        await supabase.from('kasa_hareket').insert([{
          kasa_id: fromKasa.id,
          tur: dbTur,
          kategori: hareketForm.kategori,
          aciklama: hareketForm.aciklama,
          hesap: hareketForm.hesap,
          tutar: tutar,
          islem_tarihi: hareketForm.tarih,
          odeme_sekli: hareketForm.odeme_sekli
        }])

        // Bakiye Güncelle
        const yeniBakiye = dbTur === 'gelir' ? (fromKasa.guncel_bakiye || 0) + tutar : (fromKasa.guncel_bakiye || 0) - tutar
        await supabase.from('kasalar').update({ guncel_bakiye: yeniBakiye }).eq('id', fromKasa.id)
      }

      setHareketModal(false)
      setHareketForm({ ...hareketForm, aciklama: '', hesap: '', tutar: '' })
      fetchVeriler()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="animate-fadeIn" style={{ width: '100%', padding: '0 32px' }}>
      
      {/* ─── HEADER YAPI ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
           <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>Cüzdanlar & Finans</h1>
           <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Bankalar, POS cihazları ve nakit kasalarınızdaki toplam durum.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
           <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', padding: '10px 20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Toplam Nakit Varlığı</span>
              <span style={{ fontSize: '20px', fontWeight: 900, color: topBakiye >= 0 ? '#10b981' : '#ef4444' }}>{topBakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
           </div>
           <button onClick={() => setYeniKasaModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', borderRadius: '12px' }}>
              {Icons.plus} Yeni Kasa
           </button>
        </div>
      </div>

      {/* ─── KASA KARTLARI ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {loading ? (
           [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '16px' }} />)
        ) : kasalar.map(kasa => (
           <div key={kasa.id} className="card hover-row" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                       width: '40px', height: '40px', borderRadius: '10px', 
                       background: kasa.kasa_turu === 'Banka' ? '#eff6ff' : '#ecfdf5',
                       color: kasa.kasa_turu === 'Banka' ? '#3b82f6' : '#10b981',
                       display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                       {kasa.kasa_turu === 'Banka' ? Icons.bank : Icons.wallet}
                    </div>
                    <div>
                       <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{kasa.kasa_adi}</div>
                       <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{kasa.kasa_turu} Hesabı</div>
                    </div>
                 </div>
              </div>
              <div>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '2px' }}>Güncel Bakiye</div>
                 <div style={{ fontSize: '24px', fontWeight: 900, color: kasa.guncel_bakiye >= 0 ? '#10b981' : '#ef4444', letterSpacing: '-0.5px' }}>
                    {(kasa.guncel_bakiye || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                 </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                 <button 
                   onClick={() => { setSelectedKasaId(kasa.id.toString()); document.getElementById('hareketler')?.scrollIntoView({ behavior: 'smooth' }) }} 
                   style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                 >
                   {Icons.history} Hareketler
                 </button>
                 {/* Düzenle butonu placeholder (şimdilik popup veya düzenlemesi eklenmedi ama tasarımda yer ayrıldı) */}
                 <button style={{ padding: '8px 12px', borderRadius: '8px', background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0', cursor: 'not-allowed' }}>{Icons.edit}</button>
              </div>
           </div>
        ))}
      </div>

      {/* ─── HAREKETLER BÖLÜMÜ ─── */}
      <div id="hareketler" style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', padding: '24px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
               <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Kasa Hareketleri</h2>
               <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Seçilen kriterlere ait finansal geçmiş işlemleri görüntüleyin.</p>
            </div>
            <button onClick={() => setHareketModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               {Icons.plus} Yeni Hareket
            </button>
         </div>

         {/* FİLTRELER */}
         <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <select style={{ ...inputStyle, width: '200px' }} value={selectedKasaId} onChange={e => setSelectedKasaId(e.target.value)}>
               <option value="all">Tüm Kasalar</option>
               {kasalar.map(k => <option key={k.id} value={k.id}>{k.kasa_adi}</option>)}
            </select>
            
            <div style={{ display: 'flex', background: '#f8fafc', padding: '4px', borderRadius: '10px', flexShrink: 0, border: '1px solid #e2e8f0' }}>
               {['Tümü', 'Gelir', 'Gider', 'Transfer'].map(tab => (
                 <button key={tab} onClick={() => setFilterTur(tab)}
                   style={{ padding: '8px 16px', border: 'none', background: filterTur === tab ? '#fff' : 'transparent', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: filterTur === tab ? '#0f172a' : '#64748b', boxShadow: filterTur === tab ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                 >{tab}</button>
               ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '4px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
               <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} style={{ border: 'none', background: 'none', fontSize: '12px', fontWeight: 600, outline: 'none' }} />
               <span style={{ color: '#cbd5e1' }}>—</span>
               <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} style={{ border: 'none', background: 'none', fontSize: '12px', fontWeight: 600, outline: 'none' }} />
            </div>

            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
               <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{Icons.search}</span>
               <input placeholder="Açıklama veya kategori ara..." style={{ ...inputStyle, paddingLeft: '38px' }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
         </div>

         {/* TABLO */}
         <div style={{ margin: '0 -24px -24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                     <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Kasa & Tarih</th>
                     <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Açıklama / Hesap</th>
                     <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Kategori</th>
                     <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ödeme Şekli</th>
                     <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tutar</th>
                  </tr>
               </thead>
               <tbody>
                  {loading ? (
                     [1,2,3].map(i => <tr key={i}><td colSpan={5} style={{ padding: '24px' }}><div className="skeleton" style={{ height: '30px', width: '100%' }} /></td></tr>)
                  ) : paginatedHareketler.length === 0 ? (
                     <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Bu kriterlere uygun kasa hareketi bulunamadı.</td></tr>
                  ) : paginatedHareketler.map(h => {
                     const isIncome = h.tur === 'gelir'
                     const k = kasalar.find(x => x.id === h.kasa_id)
                     return (
                        <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                           <td style={{ padding: '16px 24px' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{k?.kasa_adi}</div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{new Date(h.islem_tarihi).toLocaleDateString('tr-TR')}</div>
                           </td>
                           <td style={{ padding: '16px 24px' }}>
                              <div style={{ fontWeight: 600, color: '#334155', fontSize: '14px' }}>{h.aciklama || '—'}</div>
                              {h.hesap && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Hesap: {h.hesap}</div>}
                              {h.servis_id && (
                                <Link href={`/servis-kayitlari/${h.servis_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', fontWeight: 800, background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '4px', textDecoration: 'none' }}>
                                   {Icons.link} Servis Bağlantısı
                                </Link>
                              )}
                           </td>
                           <td style={{ padding: '16px 24px' }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'inline-block' }}>{h.kategori}</div>
                           </td>
                           <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{h.odeme_sekli}</span>
                           </td>
                           <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <div style={{ fontSize: '16px', fontWeight: 900, color: isIncome ? '#059669' : '#dc2626' }}>
                                 {isIncome ? '+' : '-'}{h.tutar?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                              </div>
                           </td>
                        </tr>
                     )
                  })}
               </tbody>
            </table>
         </div>
      </div>
      
      <div style={{ marginTop: '24px' }}>
        <Pagination totalItems={filteredHareketler.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </div>

      {/* ─── MODALLAR ─── */}
      <Modal isOpen={yeniKasaModal} onClose={() => setYeniKasaModal(false)} title="Yeni Kasa / Banka Ekle" size="md">
         <form onSubmit={kaydetKasa} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <div>
                  <label style={labelStyle}>Kasa Adı *</label>
                  <input required style={inputStyle} value={kasaForm.kasa_adi} onChange={e => setKasaForm({...kasaForm, kasa_adi: e.target.value})} placeholder="Örn: Garanti Bankası" />
               </div>
               <div>
                  <label style={labelStyle}>Kasa Türü</label>
                  <select style={inputStyle} value={kasaForm.kasa_turu} onChange={e => setKasaForm({...kasaForm, kasa_turu: e.target.value})}>
                     <option value="Nakit">Nakit Müşteri Kasası</option>
                     <option value="Banka">Banka / Şirket Hesabı</option>
                  </select>
               </div>
            </div>

            {kasaForm.kasa_turu === 'Banka' && (
               <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                     <div>
                        <label style={labelStyle}>Banka Adı</label>
                        <input style={inputStyle} value={kasaForm.banka_adi} onChange={e => setKasaForm({...kasaForm, banka_adi: e.target.value})} />
                     </div>
                     <div>
                        <label style={labelStyle}>Şube Kodu</label>
                        <input style={inputStyle} value={kasaForm.sube_kodu} onChange={e => setKasaForm({...kasaForm, sube_kodu: e.target.value})} />
                     </div>
                  </div>
                  <div>
                     <label style={labelStyle}>IBAN TR...</label>
                     <input style={inputStyle} value={kasaForm.iban} onChange={e => setKasaForm({...kasaForm, iban: e.target.value})} />
                  </div>
               </div>
            )}

            <div>
               <label style={labelStyle}>Açılış / Mevcut Bakiye (₺)</label>
               <input type="number" step="0.01" required style={{...inputStyle, fontWeight: 800, color: '#0f172a', fontSize: '18px'}} value={kasaForm.acilis_bakiyesi} onChange={e => setKasaForm({...kasaForm, acilis_bakiyesi: e.target.value})} />
            </div>

            <button type="submit" disabled={isSaving} className="btn-primary" style={{ padding: '14px', fontSize: '15px' }}>
               {isSaving ? 'Kaydediliyor...' : 'Hesabı Aktifleştir'}
            </button>
         </form>
      </Modal>

      <Modal isOpen={hareketModal} onClose={() => setHareketModal(false)} title="Yeni Finansal Hareket / Transfer" size="md">
         <form onSubmit={kaydetHareket} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '6px', borderRadius: '12px' }}>
               {['Gelir', 'Gider', 'Transfer'].map(t => (
                  <button key={t} type="button" onClick={() => setHareketForm({...hareketForm, hareket_tur: t})}
                     style={{ flex: 1, padding: '10px', border: 'none', background: hareketForm.hareket_tur === t ? '#fff' : 'transparent', borderRadius: '8px', fontSize: '14px', fontWeight: 700, color: hareketForm.hareket_tur === t ? '#0f172a' : '#64748b', cursor: 'pointer', boxShadow: hareketForm.hareket_tur === t ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
                     {t}
                  </button>
               ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <div>
                  <label style={labelStyle}>{hareketForm.hareket_tur === 'Transfer' ? 'Çıkış Yapılacak Kasa' : 'İlgili Kasa'}</label>
                  <select required style={inputStyle} value={hareketForm.kasa_id} onChange={e => setHareketForm({...hareketForm, kasa_id: e.target.value})}>
                     <option value="">Kasa Seçin...</option>
                     {kasalar.map(k => <option key={k.id} value={k.id}>{k.kasa_adi} ({k.guncel_bakiye} ₺)</option>)}
                  </select>
               </div>
               
               {hareketForm.hareket_tur === 'Transfer' ? (
                 <div>
                    <label style={labelStyle}>Hedef (Giriş) Kasa</label>
                    <select required style={inputStyle} value={hareketForm.hedef_kasa_id} onChange={e => setHareketForm({...hareketForm, hedef_kasa_id: e.target.value})}>
                       <option value="">Kasa Seçin...</option>
                       {kasalar.map(k => <option key={k.id} value={k.id}>{k.kasa_adi} ({k.guncel_bakiye} ₺)</option>)}
                    </select>
                 </div>
               ) : (
                 <div>
                    <label style={labelStyle}>Kategori</label>
                    <select required style={inputStyle} value={hareketForm.kategori} onChange={e => setHareketForm({...hareketForm, kategori: e.target.value})}>
                       <option value="Servis Geliri">Servis Geliri</option>
                       <option value="Satış">Satış / Genel</option>
                       <option value="Maaş">Maaş - SGK Ödemeleri</option>
                       <option value="Kira">Kira Gideri</option>
                       <option value="Fatura">Fatura / Kurum Ödemeleri</option>
                       <option value="Diğer">Diğer</option>
                    </select>
                 </div>
               )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <div>
                  <label style={labelStyle}>Tarih</label>
                  <input type="date" required style={inputStyle} value={hareketForm.tarih} onChange={e => setHareketForm({...hareketForm, tarih: e.target.value})} />
               </div>
               <div>
                  <label style={labelStyle}>Ödeme Şekli</label>
                  <select required style={inputStyle} value={hareketForm.odeme_sekli} onChange={e => setHareketForm({...hareketForm, odeme_sekli: e.target.value})}>
                     <option value="Nakit">Nakit</option>
                     <option value="Kredi Kartı">Kredi Kartı / POS</option>
                     <option value="Havale/EFT">Havale / EFT / Fast</option>
                     <option value="Çek">Çek / Senet</option>
                  </select>
               </div>
            </div>

            <div>
               <label style={labelStyle}>Tutar (₺)</label>
               <input type="number" step="0.01" required style={{...inputStyle, fontWeight: 900, fontSize: '20px', color: hareketForm.hareket_tur === 'Gider' ? '#dc2626' : '#10b981'}} placeholder="0.00" value={hareketForm.tutar} onChange={e => setHareketForm({...hareketForm, tutar: e.target.value})} />
            </div>

            <div>
               <label style={labelStyle}>Açıklama / Karşı Hesap</label>
               <input style={{...inputStyle, marginBottom: '8px'}} placeholder="Karşı Taraf (Cari) veya Firma" value={hareketForm.hesap} onChange={e => setHareketForm({...hareketForm, hesap: e.target.value})} />
               <textarea rows={2} style={inputStyle} placeholder="İşleme ait kısa açıklama girin..." value={hareketForm.aciklama} onChange={e => setHareketForm({...hareketForm, aciklama: e.target.value})} />
            </div>

            <button type="submit" disabled={isSaving} className="btn-primary" style={{ padding: '14px', fontSize: '15px' }}>
               {isSaving ? 'İşleniyor...' : 'Hareketi / Transferi Tamamla'}
            </button>
         </form>
      </Modal>
    </div>
  )
}
