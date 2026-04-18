"use client"

import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import Pagination from '../components/Pagination'
import CariSec from '../components/CariSec'

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '9px', fontSize: '14px', outline: 'none', color: '#0f172a', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }

export default function Faturalar() {
  const [hareketler, setHareketler] = useState<any[]>([])
  const [filtered,  setFiltered]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [arama,     setArama]     = useState('')
  const [filtre,    setFiltre]    = useState('Tümü')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [modalAcik, setModalAcik] = useState(false)
  const [duzenleModal, setDuzenleModal] = useState<{ acik: boolean, fatura: any }>({ acik: false, fatura: null })
  const [confirmData, setConfirmData] = useState<{ open: boolean, item: any }>({ open: false, item: null })
  const [saving, setSaving] = useState(false)
  const [odemePanel, setOdemePanel] = useState(false)
  const [kasalar, setKasalar] = useState<any[]>([])
  const [odemeForm, setOdemeForm] = useState({ fId: null as number | null, kasa_id: '', tutar: '', aciklama: '', tarih: new Date().toISOString().split('T')[0] })
  const [yeniForm, setYeniForm] = useState({ cari_id: '', evrak_no: '', fat_tarih: new Date().toISOString().split('T')[0], fatura_turu: 'Satış', gtoplam: '' })

  const fetchData = async () => {
    setLoading(true)
    const { data: faturalar } = await supabase
      .from('fatura')
      .select('*, cari_kart(*)')
      .gte('fat_tarih', dateRange.start)
      .lte('fat_tarih', dateRange.end)
      .order('fat_tarih', { ascending: false })

    const { data: kasa } = await supabase
      .from('kasa_hareket')
      .select('*')
      .gte('islem_tarihi', dateRange.start)
      .lte('islem_tarihi', dateRange.end)
      .order('islem_tarihi', { ascending: false })
    
    const mappedFaturalar = (faturalar || []).map(f => ({
      id: `f-${f.id}`,
      dbId: f.id,
      source: 'fatura',
      tarih: f.fat_tarih,
      no: f.evrak_no || `FAT-${f.id}`,
      cari: f.cari_kart?.yetkili || '—',
      tur: f.fatura_turu || 'Satış',
      tutar: f.gtoplam || 0,
      kdv: f.kdv || 0,
      ara_toplam: f.toplam || 0,
      isPositive: ['Tahsilat', 'Alacak'].includes(f.fatura_turu || ''),
      servis_id: f.servis_id,
      odeme_durumu: f.odeme_durumu || 'Bekliyor',
      odenen_tutar: f.odenen_tutar || 0,
    }))

    const mappedKasa = (kasa || []).map(k => ({
      id: `k-${k.id}`,
      dbId: k.id,
      source: 'kasa',
      tarih: k.islem_tarihi,
      no: `MAN-${k.id}`,
      cari: k.aciklama || 'Kasa Hareketi',
      tur: k.tur === 'gelir' ? 'Gelir' : 'Gider',
      tutar: k.tutar || 0,
      kdv: 0,
      ara_toplam: k.tutar || 0,
      isPositive: k.tur === 'gelir',
      kategori: k.kategori,
      servis_id: k.servis_id
    }))

    const combined = [...mappedFaturalar, ...mappedKasa].sort((a, b) => 
      new Date(b.tarih).getTime() - new Date(a.tarih).getTime()
    )

    setHareketler(combined)
    setFiltered(combined)
    setLoading(false)
    setCurrentPage(1)
  }

  useEffect(() => {
    fetchData()
    supabase.from('kasalar').select('*').eq('aktif_mi', true).then(({ data }) => setKasalar(data || []))
  }, [])

  useEffect(() => {
    const q = arama.toLowerCase()
    let res = hareketler

    if (filtre !== 'Tümü') {
      if (filtre === 'Tahsilat') res = res.filter(h => ['Tahsilat', 'Alacak'].includes(h.tur))
      else if (filtre === 'Borç') res = res.filter(h => h.tur === 'Borç')
      else if (filtre === 'Servis İşlemi') res = res.filter(h => h.servis_id !== null)
      else if (filtre === 'Fatura') res = res.filter(h => h.source === 'fatura' && ['Satış', 'Alış'].includes(h.tur))
      else if (filtre === 'Gelir') res = res.filter(h => h.tur === 'Gelir')
      else if (filtre === 'Gider') res = res.filter(h => h.tur === 'Gider')
    }
    
    res = !q ? res : res.filter(f =>
      (f.no || '').toLowerCase().includes(q) ||
      (f.cari || '').toLowerCase().includes(q)
    )
    
    setFiltered(res)
    setCurrentPage(1)
  }, [arama, filtre, hareketler])

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)

  const handleSil = async (item: any) => {
    const table = item.source === 'fatura' ? 'fatura' : 'kasa_hareket'
    const { error } = await supabase.from(table).delete().eq('id', item.dbId)
    
    if (error) { alert('Hata: ' + error.message) }
    else { fetchData() }
  }

  const handleGuncelle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!duzenleModal.fatura) return
    setSaving(true)
    const { error } = await supabase.from('fatura').update({
      evrak_no: duzenleModal.fatura.evrak_no,
      fat_tarih: duzenleModal.fatura.fat_tarih,
      fatura_turu: duzenleModal.fatura.fatura_turu,
      gtoplam: parseFloat(duzenleModal.fatura.gtoplam)
    }).eq('id', duzenleModal.fatura.id)
    
    setSaving(false)
    if (error) { alert('Hata: ' + error.message) }
    else {
      setDuzenleModal({ acik: false, fatura: null })
      fetchData()
    }
  }

  const handleYeniKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!yeniForm.cari_id || !yeniForm.gtoplam) return
    setSaving(true)
    
    try {
      const { error } = await supabase.from('fatura').insert([{
        cari_id: parseInt(yeniForm.cari_id),
        evrak_no: yeniForm.evrak_no,
        fat_tarih: yeniForm.fat_tarih,
        fatura_turu: yeniForm.fatura_turu,
        gtoplam: parseFloat(yeniForm.gtoplam),
        odeme_durumu: 'Bekliyor',
        kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
        subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
      }])
      
      if (error) throw error
      setModalAcik(false)
      setYeniForm({ cari_id: '', evrak_no: '', fat_tarih: new Date().toISOString().split('T')[0], fatura_turu: 'Satış', gtoplam: '' })
      await fetchData()
    } catch (err: any) {
      alert('Hata: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleOdemeAl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!odemeForm.fId || !odemeForm.kasa_id || !odemeForm.tutar) return
    setSaving(true)

    const miktar = parseFloat(odemeForm.tutar)
    const fatura = hareketler.find(h => h.id === `f-${odemeForm.fId}`)
    if (!fatura) return

    const yeniOdenen = (fatura.odenen_tutar || 0) + miktar
    const genelToplam = fatura.tutar

    let durum = 'Kısmi Ödendi'
    if (yeniOdenen >= genelToplam - 0.01) durum = 'Ödendi'
    if (yeniOdenen <= 0) durum = 'Bekliyor'

    // 1. Kasa hareketi ekle
    const { error: hError } = await supabase.from('kasa_hareket').insert([{
      kasa_id: parseInt(odemeForm.kasa_id),
      fatura_id: odemeForm.fId, // Fatura ile ilişkilendir
      tur: 'gelir',
      tutar: miktar,
      kategori: 'Tahsilat',
      aciklama: odemeForm.aciklama || `${fatura.no} nolu fatura tahsilatı`,
      islem_tarihi: odemeForm.tarih,
      kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
      subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
    }])

    if (hError) { alert('Hata: ' + hError.message); setSaving(false); return }

    // 2. Fatura tablosunu güncelle
    const { error: sError } = await supabase.from('fatura').update({
      odenen_tutar: yeniOdenen,
      odeme_durumu: durum
    }).eq('id', odemeForm.fId)

    setSaving(false)
    if (sError) { alert('Hata: ' + sError.message); return }

    setOdemePanel(false)
    setOdemeForm({ ...odemeForm, fId: null, tutar: '', aciklama: '' })
    fetchData()
  }

  const genelToplam = filtered.reduce((s, f) => s + (f.gtoplam || 0), 0)

  return (
    <div style={{ width: '100%', padding: '0 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>Faturalar ve Finans Akışı</h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '6px 0 0', fontWeight: 500 }}>{hareketler.length} finansal hareket kayıtlı</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setModalAcik(true)} style={{ display: 'inline-flex', alignItems: 'center', background: '#3b82f6', color: '#fff', padding: '11px 22px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
            + Yeni Fatura
          </button>
        </div>
      </div>

      {/* Özet */}
      {filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Gösterilen Hareket', value: filtered.length.toString(), color: '#0f172a' },
            { label: 'Toplam Tutar',  value: genelToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺', color: '#059669' },
            { label: 'Ortalama İşlem', value: (genelToplam/filtered.length).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺', color: '#3b82f6' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.07),0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{s.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07),0 4px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filters & Dates */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', flex: 1 }}>
              {['Tümü', 'Tahsilat', 'Borç', 'Servis İşlemi', 'Fatura', 'Gelir', 'Gider'].map(f => (
                <button
                  key={f}
                  onClick={() => setFiltre(f)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                    background: filtre === f ? '#3b82f6' : '#f8fafc',
                    color: filtre === f ? '#fff' : '#64748b',
                    border: '1px solid', borderColor: filtre === f ? '#3b82f6' : '#e2e8f0',
                    cursor: 'pointer', transition: '0.2s', whiteSpace: 'nowrap'
                  }}
                >{f}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 4px rgba(59,130,246,0.05)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '2px' }}>BAŞLANGIÇ</span>
                <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, color: '#0f172a', outline: 'none' }} />
              </div>
              <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '2px' }}>BİTİŞ</span>
                <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, color: '#0f172a', outline: 'none' }} />
              </div>
              <button 
                onClick={fetchData} 
                className="bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-100"
                style={{ padding: '8px 16px', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginLeft: '8px', transition: 'all 0.2s' }}
              >
                Uygula
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </span>
              <input type="text" placeholder="No, açıklama veya müşteri..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStyle, paddingLeft: '36px', height: '44px' }} />
            </div>
            <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>{filtered.length} Hareket listeleniyor</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}><div style={{ width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%' }} /></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['No','Detay / Açıklama','Tarih','Kaynak / Tür','Durum','Tutar','Genel Toplam','İşlemler'].map(h => (
                    <th key={h} style={{ padding: '14px 24px', textAlign: h === 'Tutar' || h === 'Genel Toplam' || h === 'İşlemler' ? 'right' : 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '2px solid #eef2f7' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((f, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f8fafc', background: idx%2===0?'#fff':'#fafbfc' }}>
                    <td style={{ padding: '14px 24px', fontWeight: 700, fontFamily: 'monospace', fontSize: '13px', color: '#64748b' }}>{f.no}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{f.cari}</div>
                      {f.kategori && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{f.kategori}</div>}
                    </td>
                    <td style={{ padding: '14px 24px', color: '#64748b', fontSize: '13px', fontWeight: 500 }}>{new Date(f.tarih).toLocaleDateString('tr-TR')}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ background: f.source==='fatura'?'#eff6ff':'#f1f5f9', color: f.source==='fatura'?'#3b82f6':'#64748b', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>{f.source.toUpperCase()}</span>
                        <span style={{ color: '#0f172a', fontSize: '12px', fontWeight: 700 }}>{f.tur}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      {f.source === 'fatura' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ 
                            background: f.odeme_durumu === 'Ödendi' ? '#dcfce7' : (f.odeme_durumu === 'Kısmi Ödendi' ? '#fef9c3' : '#f1f5f9'),
                            color: f.odeme_durumu === 'Ödendi' ? '#166534' : (f.odeme_durumu === 'Kısmi Ödendi' ? '#854d0e' : '#64748b'),
                            padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, width: 'fit-content'
                          }}>
                            {f.odeme_durumu}
                          </span>
                          {f.odenen_tutar > 0 && f.odeme_durumu !== 'Ödendi' && (
                            <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700 }}>
                              {f.odenen_tutar.toLocaleString('tr-TR')} ₺ Ödendi
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'right', color: '#64748b', fontSize: '13px' }}>{f.ara_toplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                    <td style={{ padding: '14px 24px', textAlign: 'right', fontWeight: 900, color: f.isPositive ? '#10b981' : '#ef4444', fontSize: '15px' }}>
                      {f.isPositive ? '+' : '-'}{f.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {f.source === 'fatura' && (
                          <>
                            {f.odeme_durumu !== 'Ödendi' && (
                              <button 
                                onClick={() => setOdemeForm({ ...odemeForm, fId: f.dbId, tutar: (f.tutar - f.odenen_tutar).toString() })} 
                                onFocus={() => setOdemePanel(true)}
                                style={{ padding: '6px 10px', background: '#ecfdf5', color: '#059669', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                💸 Öde
                              </button>
                            )}
                            <button onClick={() => setDuzenleModal({ acik: true, fatura: { ...f, id: f.dbId, gtoplam: f.tutar } })} style={{ padding: '6px 10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Düzenle</button>
                          </>
                        )}
                        <button onClick={() => setConfirmData({ open: true, item: f })} style={{ padding: '6px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Sil</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && <tr><td colSpan={8} style={{ padding: '80px', textAlign: 'center' }}><div style={{ fontWeight: 700, color: '#94a3b8' }}>Belirtilen kriterlerde kayıt bulunamadı.</div></td></tr>}
              </tbody>
            </table>
          )}
        </div>

        <Pagination 
          totalItems={filtered.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        />
      </div>

      {/* ─── YENİ FATURA MODALI ─── */}
      <Modal isOpen={modalAcik} onClose={() => setModalAcik(false)} title="Yeni Fatura Oluştur" size="sm">
        <form onSubmit={handleYeniKaydet} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Müşteri Seçimi</label>
            <CariSec value={yeniForm.cari_id} onChange={id => setYeniForm({ ...yeniForm, cari_id: id })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Evrak No</label>
              <input type="text" placeholder="FAT-0001" style={inputStyle} value={yeniForm.evrak_no} onChange={e => setYeniForm({ ...yeniForm, evrak_no: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Tarih</label>
              <input type="date" style={inputStyle} value={yeniForm.fat_tarih} onChange={e => setYeniForm({ ...yeniForm, fat_tarih: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Fatura Türü</label>
              <select style={inputStyle} value={yeniForm.fatura_turu} onChange={e => setYeniForm({ ...yeniForm, fatura_turu: e.target.value })}>
                <option value="Satış">Satış Faturası</option>
                <option value="Alış">Alış Faturası</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Toplam Tutar (₺)</label>
              <input type="number" step="0.01" required placeholder="0.00" style={{ ...inputStyle, fontWeight: 700 }} value={yeniForm.gtoplam} onChange={e => setYeniForm({ ...yeniForm, gtoplam: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ marginTop: '8px', padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.2)' }}>
            {saving ? 'Kaydediliyor...' : 'Faturayı Kaydet'}
          </button>
        </form>
      </Modal>

      {/* ─── DÜZENLEME MODALI ─── */}
      <Modal isOpen={duzenleModal.acik} onClose={() => setDuzenleModal({ acik: false, fatura: null })} title="İşlemi Düzenle" subtitle="Fatura veya manuel hareket detaylarını güncelleyin" size="sm">
        {duzenleModal.fatura && (
          <form onSubmit={handleGuncelle}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Evrak / Fatura No</label>
                <input type="text" value={duzenleModal.fatura.evrak_no || ''} onChange={e => setDuzenleModal({ ...duzenleModal, fatura: { ...duzenleModal.fatura, evrak_no: e.target.value } })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Tarih</label>
                <input type="date" value={duzenleModal.fatura.fat_tarih ? duzenleModal.fatura.fat_tarih.split('T')[0] : ''} onChange={e => setDuzenleModal({ ...duzenleModal, fatura: { ...duzenleModal.fatura, fat_tarih: e.target.value } })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>İşlem Türü</label>
                <select value={duzenleModal.fatura.fatura_turu || ''} onChange={e => setDuzenleModal({ ...duzenleModal, fatura: { ...duzenleModal.fatura, fatura_turu: e.target.value } })} style={inputStyle}>
                  <option value="Satış">Satış</option>
                  <option value="Tahsilat">Tahsilat</option>
                  <option value="Borç">Borç</option>
                  <option value="Alacak">Alacak</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Toplam Tutar (₺)</label>
                <input type="number" step="0.01" value={duzenleModal.fatura.gtoplam || 0} onChange={e => setDuzenleModal({ ...duzenleModal, fatura: { ...duzenleModal.fatura, gtoplam: e.target.value } })} style={inputStyle} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', background: '#fafbfc', borderRadius: '0 0 16px 16px' }}>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Güncelleniyor...' : '✓ Değişiklikleri Kaydet'}
              </button>
              <button type="button" onClick={() => setDuzenleModal({ acik: false, fatura: null })} style={{ padding: '12px 20px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─── Ödeme Al Modal ─── */}
      {odemePanel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: '#fff', width: '420px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
               <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Hızlı Tahsilat</h3>
               <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Ödeme detaylarını girerek bakiyeyi güncelleyin.</p>
            </div>
            <form onSubmit={handleOdemeAl} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', letterSpacing: '0.05em' }}>TAHSİLAT TUTARI</span>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>
                  <input type="number" step="0.01" required value={odemeForm.tutar} onChange={e => setOdemeForm({ ...odemeForm, tutar: e.target.value })} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 900, outline: 'none', color: '#10b981' }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Kasa / Banka</label>
                <select required style={inputStyle} value={odemeForm.kasa_id} onChange={e => setOdemeForm({ ...odemeForm, kasa_id: e.target.value })}>
                  <option value="">Seçiniz...</option>
                  {kasalar.map(k => <option key={k.id} value={k.id}>{k.kasa_adi} ({(k.guncel_bakiye || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tarih</label>
                <input type="date" required style={inputStyle} value={odemeForm.tarih} onChange={e => setOdemeForm({ ...odemeForm, tarih: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
                  {saving ? 'Kaydediliyor...' : '✓ Tahsilatı Onayla'}
                </button>
                <button type="button" onClick={() => setOdemePanel(false)} style={{ padding: '14px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmData.open}
        onClose={() => setConfirmData({ open: false, item: null })}
        onConfirm={() => handleSil(confirmData.item)}
        type="danger"
        title="İşlemi Sil"
        message={confirmData.item?.servis_id 
          ? "DİKKAT: Bu işlem bir servis kaydına ait ödeme verisidir. Silerseniz servisin ödeme durumu etkilenebilir. Devam etmek istiyor musunuz?" 
          : "Bu finansal hareketi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."}
      />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}