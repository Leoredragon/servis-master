"use client"

import { supabase } from '../lib/supabase'
import { useEffect, useState, useCallback } from 'react'
import SlideOver from '../components/SlideOver'
import ConfirmModal from '../components/ConfirmModal'
import Pagination from '../components/Pagination'

// İkonlar ve Stiller
const icons = {
  cash: 'M3 6h18v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z M7 10h10 M7 14h10',
  bank: 'M3 21h18 M3 10h18 M5 6l7-3 7 3 M4 10v11 M11 10v11 M15 10v11 M20 10v11',
  pos: 'M6 18c-2 0-3-1-3-3s1-3 3-3 3 1 3 3-1 3-3 3z M18 18c-2 0-3-1-3-3s1-3 3-3 3 1 3 3-1 3-3 3z M3 6h18v6H3V6z',
  plus: 'M12 5v14M5 12h14',
  transfer: 'M7 10l5-5 5 5M7 14l5 5 5-5',
  info: 'M12 16h.01M12 8h.01M12 21a9 9 0 110-18 9 9 0 010 18z',
  trash: 'M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  history: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  check: 'M20 6L9 17l-5-5',
  card: 'M3 10h18M7 15h1M11 15h1',
  bank_card: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM2 10h20',
  bill: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
}

const Icon = ({ d, size = 18, color = 'currentColor' }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const inputStyle = { width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' as const }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }

export default function KasaYonetimi() {
  const [kasalar, setKasalar] = useState<any[]>([])
  const [selectedKasa, setSelectedKasa] = useState<any>(null)
  const [hareketler, setHareketler] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hareketLoading, setHareketLoading] = useState(false)
  
  // Modallar
  const [kasaPanel, setKasaPanel] = useState(false)
  const [transferPanel, setTransferPanel] = useState(false)
  const [confirmData, setConfirmData] = useState<{ open: boolean, type: 'kasa' | 'hareket', item: any }>({ open: false, type: 'kasa', item: null })
  
  // Formlar
  const [kasaForm, setKasaForm] = useState({ 
    kasa_adi: '', 
    kasa_turu: 'Nakit', 
    acilis_bakiyesi: '0',
    banka_adi: '',
    sube_kodu: '',
    iban: ''
  })
  const [transferForm, setTransferForm] = useState({ 
    from_id: '', 
    to_id: '', 
    tutar: '', 
    aciklama: '', 
    tarih: new Date().toISOString().split('T')[0],
    odeme_sekli: 'Havale/EFT'
  })
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  })
  const [saving, setSaving] = useState(false)
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchKasalar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('kasalar').select('*').order('kasa_adi')
    if (error) { console.error(error) }
    else {
      let activeKasalar = data
      if (data.length === 0) {
        const { data: newData, error: insertError } = await supabase.from('kasalar').insert([
          { 
            kasa_adi: 'Merkez Nakit', 
            kasa_turu: 'Nakit', 
            acilis_bakiyesi: 0,
            kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
            subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
          }
        ]).select()
        if (!insertError && newData) activeKasalar = newData
      }
      setKasalar(activeKasalar)
      if (!selectedKasa && activeKasalar.length > 0) {
        setSelectedKasa(activeKasalar[0])
      }
    }
    setLoading(false)
  }, [selectedKasa])

  const fetchHareketler = useCallback(async () => {
    if (!selectedKasa) return
    setHareketLoading(true)
    const { data, error } = await supabase
      .from('kasa_hareket')
      .select('*')
      .eq('kasa_id', selectedKasa.id)
      .gte('islem_tarihi', dateRange.start)
      .lte('islem_tarihi', dateRange.end)
      .order('islem_tarihi', { ascending: false })
      .order('id', { ascending: false })
    
    if (error) console.error(error)
    else setHareketler(data || [])
    setHareketLoading(false)
    setCurrentPage(1)
  }, [selectedKasa, dateRange])

  useEffect(() => { fetchKasalar() }, [])
  useEffect(() => { fetchHareketler() }, [fetchHareketler])

  const handleKasaKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('kasalar').insert([
      { 
        ...kasaForm, 
        acilis_bakiyesi: parseFloat(kasaForm.acilis_bakiyesi),
        kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
        subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
      }
    ])
    setSaving(false)
    if (error) alert('Hata: ' + error.message)
    else {
      setKasaPanel(false)
      setKasaForm({ 
        kasa_adi: '', kasa_turu: 'Nakit', acilis_bakiyesi: '0',
        banka_adi: '', sube_kodu: '', iban: ''
      })
      fetchKasalar()
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (transferForm.from_id === transferForm.to_id) { alert('Aynı hesaplar arası transfer yapılamaz.'); return }
    setSaving(true)
    
    const tutar = parseFloat(transferForm.tutar)
    const now = transferForm.tarih
    
    // Double entry logic
    const movements = [
      {
        kasa_id: transferForm.from_id,
        tur: 'gider',
        tutar: tutar,
        kategori: 'Transfer',
        aciklama: `Transfer -> ${kasalar.find(k => k.id.toString() === transferForm.to_id)?.kasa_adi}. ${transferForm.aciklama}`,
        islem_tarihi: now,
        odeme_sekli: transferForm.odeme_sekli,
        kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
        subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
      },
      {
        kasa_id: transferForm.to_id,
        tur: 'gelir',
        tutar: tutar,
        kategori: 'Transfer',
        aciklama: `Transfer <- ${kasalar.find(k => k.id.toString() === transferForm.from_id)?.kasa_adi}. ${transferForm.aciklama}`,
        islem_tarihi: now,
        odeme_sekli: transferForm.odeme_sekli,
        kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
        subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
      }
    ]

    const { error } = await supabase.from('kasa_hareket').insert(movements)
    setSaving(false)
    if (error) alert('Hata: ' + error.message)
    else {
      setTransferPanel(false)
      setTransferForm({ 
        from_id: '', to_id: '', tutar: '', aciklama: '', 
        tarih: new Date().toISOString().split('T')[0],
        odeme_sekli: 'Havale/EFT'
      })
      fetchKasalar()
      fetchHareketler()
    }
  }

  const handleKasaSil = async () => {
    if (!confirmData.item) return
    const { error } = await supabase.from('kasalar').delete().eq('id', confirmData.item.id)
    if (error) alert('Hata: ' + error.message)
    else {
      setConfirmData({ open: false, type: 'kasa', item: null })
      setSelectedKasa(null)
      fetchKasalar()
    }
  }

  const handleHareketSil = async () => {
    if (!confirmData.item) return
    const { error } = await supabase.from('kasa_hareket').delete().eq('id', confirmData.item.id)
    if (error) alert('Hata: ' + error.message)
    else {
      setConfirmData({ open: false, type: 'hareket', item: null })
      fetchHareketler()
    }
  }

  // Bakiye hesaplama (Basit gösterim için her kasanın anlık bakiyesi)
  // Gerçek projede bu bir veritabanı view'ı veya trigger ile güncellenen bir kolon olmalı
  // Burada UI tarafında hesaplıyoruz
  const getKasaBakiye = (kasaId: number) => {
    // Bu fonksiyon her renderda çalışacağı için optimize edilebilir
    // Ancak küçük veri setleri için sorun yaratmaz
    const kasa = kasalar.find(k => k.id === kasaId)
    if (!kasa) return 0
    return kasa.acilis_bakiyesi // Şimdilik açılış bakiyesi, hareketleri de eklemek lazım
  }

  const paginatedHareketler = hareketler.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div style={{ display: 'flex', gap: '24px', height: '100%', animate: 'fadeIn 0.4s ease-out' }}>
      
      {/* ─── SOL: Hesaplarım ─── */}
      <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Cüzdanlarım</h2>
          <button 
            onClick={() => setKasaPanel(true)}
            style={{ 
              width: '32px', height: '32px', borderRadius: '10px', background: '#3b82f6', 
              color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' 
            }}
          >
            <Icon d={icons.plus} size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>
          {loading ? (
            [1,2,3].map(i => <div key={i} style={{ height: '100px', background: '#fff', borderRadius: '20px', animate: 'pulse 1.5s infinite' }} />)
          ) : kasalar.map(kasa => {
            const isSelected = selectedKasa?.id === kasa.id
            const iconD = kasa.kasa_turu === 'Banka' ? icons.bank : (kasa.kasa_turu === 'POS' ? icons.pos : icons.cash)
            const iconColor = kasa.kasa_turu === 'Banka' ? '#3b82f6' : (kasa.kasa_turu === 'POS' ? '#7c3aed' : '#10b981')
            
            return (
              <div 
                key={kasa.id}
                onClick={() => setSelectedKasa(kasa)}
                style={{
                  background: isSelected ? '#fff' : 'rgba(255,255,255,0.6)',
                  padding: '20px',
                  borderRadius: '24px',
                  border: isSelected ? `2px solid ${iconColor}` : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected ? `0 12px 24px ${iconColor}15` : '0 2px 4px rgba(0,0,0,0.02)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {isSelected && <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', background: `${iconColor}08`, borderRadius: '0 0 0 100%' }} />}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ 
                    width: '42px', height: '42px', borderRadius: '12px', 
                    background: `${iconColor}15`, display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', color: iconColor 
                  }}>
                    <Icon d={iconD} size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{kasa.kasa_adi}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kasa.kasa_turu} Hesabı</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '4px' }}>GÜNCEL BAKİYE</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                      {(kasa.guncel_bakiye || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>₺</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── SAĞ: Hesap Hareketleri ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                {selectedKasa?.kasa_adi || 'Hesap'} Hareketleri
              </h2>
              {selectedKasa?.iban && (
                <span style={{ 
                  background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 800, 
                  padding: '4px 10px', borderRadius: '8px', border: '1px solid #dbeafe' 
                }}>
                  IBAN: {selectedKasa.iban}
                </span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, margin: '4px 0 0' }}>
              {selectedKasa?.banka_adi && `${selectedKasa.banka_adi} - `} {selectedKasa?.sube_kodu && `Şube: ${selectedKasa.sube_kodu} | `} Hesabınıza ait tüm para giriş ve çıkışları
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setTransferPanel(true)}
              style={{
                padding: '10px 20px', background: '#0f172a', color: '#fff', border: 'none',
                borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
              }}
            >
              <Icon d={icons.transfer} size={16} /> Para Transferi
            </button>
            <button 
              onClick={() => setConfirmData({ open: true, type: 'kasa', item: selectedKasa })}
              style={{
                width: '42px', height: '42px', background: '#fff', color: '#ef4444', 
                border: '1.5px solid #fee2e2', borderRadius: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Icon d={icons.trash} size={18} />
            </button>
          </div>
        </div>

        {/* Tarih Filtresi Çubuğu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', padding: '12px 20px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#f8fafc', padding: '6px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '2px' }}>BAŞLANGIÇ</span>
                <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 700, color: '#0f172a', outline: 'none' }} />
              </div>
              <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '2px' }}>BİTİŞ</span>
                <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 700, color: '#0f172a', outline: 'none' }} />
              </div>
            </div>
            <button 
              onClick={fetchHareketler}
              className="bg-blue-500 hover:bg-blue-600"
              style={{ padding: '10px 20px', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59,130,246,0.2)' }}
            >
              Uygula
            </button>
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>{hareketler.length} toplam hareket</div>
        </div>

        <div style={{ 
          background: '#fff', borderRadius: '32px', border: '1px solid #f1f5f9', 
          flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
        }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon d={icons.history} size={18} color="#64748b" />
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Son Hareketler</span>
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>{hareketler.length} Kayıt</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                  {['Tarih', 'İşlem Türü', 'Açıklama', 'Tutar', 'İşlem'].map(h => (
                    <th key={h} style={{ padding: '16px 24px', textAlign: h === 'Tutar' || h === 'İşlem' ? 'right' : 'left', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hareketLoading ? (
                   [1,2,3,4,5].map(i => (
                     <tr key={i}>
                       <td style={{ padding: '18px 24px' }}><div className="skeleton" style={{ height: '20px', width: '80%' }} /></td>
                       <td style={{ padding: '18px 24px' }}><div className="skeleton" style={{ height: '32px', width: '100px', borderRadius: '8px' }} /></td>
                       <td style={{ padding: '18px 24px' }}><div className="skeleton" style={{ height: '20px', width: '100%' }} /></td>
                       <td style={{ padding: '18px 24px' }}><div className="skeleton" style={{ height: '24px', width: '80px', marginLeft: 'auto' }} /></td>
                       <td style={{ padding: '18px 24px' }}><div className="skeleton" style={{ height: '28px', width: '28px', marginLeft: 'auto' }} /></td>
                     </tr>
                   ))
                ) : paginatedHareketler.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '100px 24px', textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>💸</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Hareket Bulunamadı</div>
                      <p style={{ fontSize: '13px', color: '#94a3b8', margin: '8px 0 0' }}>Bu hesaba ait henüz bir finansal işlem kaydedilmemiş.</p>
                    </td>
                  </tr>
                ) : paginatedHareketler.map((h, idx) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #f8fafc', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '18px 24px', fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
                      {new Date(h.islem_tarihi).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '8px', 
                          background: h.tur === 'gelir' ? '#ecfdf5' : '#fef2f2',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: h.tur === 'gelir' ? '#10b981' : '#ef4444'
                        }}>
                          {h.tur === 'gelir' ? '↑' : '↓'}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{h.kategori}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '10px', padding: '3px 8px', borderRadius: '6px', 
                          background: '#f1f5f9', color: '#64748b', fontWeight: 800, 
                          border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '4px' 
                        }}>
                          {h.odeme_sekli === 'Kredi Kartı' && <Icon d={icons.card} size={10} />}
                          {h.odeme_sekli === 'Çek' && <Icon d={icons.bill} size={10} />}
                          {h.odeme_sekli === 'Havale/EFT' && <Icon d={icons.bank_card} size={10} />}
                          {h.odeme_sekli || 'Nakit'}
                        </span>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{h.aciklama || '—'}</div>
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: h.tur === 'gelir' ? '#10b981' : '#ef4444' }}>
                        {h.tur === 'gelir' ? '+' : '-'}{h.tutar?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                      <button 
                        onClick={() => setConfirmData({ open: true, type: 'hareket', item: h })}
                        style={{ background: '#fef2f2', border: 'none', padding: '8px', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Icon d={icons.trash} size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalItems={hareketler.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* ─── MODALLAR ─── */}

      {/* Yeni Kasa / Banka Panel */}
      <SlideOver 
        isOpen={kasaPanel} 
        onClose={() => setKasaPanel(false)}
        title="Yeni Hesap Ekle"
        subtitle="Nakit kasa, banka hesabı veya POS cüzdanı tanımlayın."
      >
        <form onSubmit={handleKasaKaydet} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Hesap Adı</label>
            <input 
              required style={inputStyle} placeholder="Örn: Garanti Ana Hesap"
              value={kasaForm.kasa_adi} onChange={e => setKasaForm({ ...kasaForm, kasa_adi: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Hesap Türü</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {['Nakit', 'Banka', 'POS'].map(t => (
                <button
                  key={t} type="button"
                  onClick={() => setKasaForm({ ...kasaForm, kasa_turu: t })}
                  style={{
                    padding: '12px', borderRadius: '12px', border: '2px solid',
                    borderColor: kasaForm.kasa_turu === t ? '#3b82f6' : '#f1f5f9',
                    background: kasaForm.kasa_turu === t ? '#eff6ff' : '#fff',
                    color: kasaForm.kasa_turu === t ? '#1e40af' : '#64748b',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >{t}</button>
              ))}
            </div>
          </div>
          {(kasaForm.kasa_turu === 'Banka' || kasaForm.kasa_turu === 'POS') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={labelStyle}>Banka Adı</label>
                <input style={inputStyle} value={kasaForm.banka_adi} onChange={e => setKasaForm({ ...kasaForm, banka_adi: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Şube Kodu</label>
                  <input style={inputStyle} value={kasaForm.sube_kodu} onChange={e => setKasaForm({ ...kasaForm, sube_kodu: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>IBAN</label>
                  <input style={inputStyle} placeholder="TR..." value={kasaForm.iban} onChange={e => setKasaForm({ ...kasaForm, iban: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          <div>
            <label style={labelStyle}>Açılış Bakiyesi (₺)</label>
            <input 
              type="number" step="0.01" style={inputStyle}
              value={kasaForm.acilis_bakiyesi} onChange={e => setKasaForm({ ...kasaForm, acilis_bakiyesi: e.target.value })}
            />
          </div>
          <button 
            type="submit" disabled={saving}
            style={{ 
              marginTop: '10px', width: '100%', padding: '16px', borderRadius: '16px', border: 'none', 
              background: '#3b82f6', color: '#fff', fontSize: '16px', fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(59,130,246,0.3)'
            }}
          >
            {saving ? 'Kaydediliyor...' : 'Hesabı Oluştur'}
          </button>
        </form>
      </SlideOver>

      {/* Para Transferi Panel */}
      <SlideOver 
        isOpen={transferPanel} 
        onClose={() => setTransferPanel(false)}
        title="Para Transferi"
        subtitle="Hesaplarınız arasında hızlı bakiye aktarımı yapın."
      >
        <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Nereden (Çıkış)</label>
              <select 
                required style={inputStyle}
                value={transferForm.from_id} onChange={e => setTransferForm({ ...transferForm, from_id: e.target.value })}
              >
                <option value="">Hesap Seçin...</option>
                {kasalar.map(k => <option key={k.id} value={k.id}>{k.kasa_adi}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ↓
              </div>
            </div>
            <div>
              <label style={labelStyle}>Nereye (Giriş)</label>
              <select 
                required style={inputStyle}
                value={transferForm.to_id} onChange={e => setTransferForm({ ...transferForm, to_id: e.target.value })}
              >
                <option value="">Hedef Seçiniz...</option>
                {kasalar.map(k => <option key={k.id} value={k.id}>{k.kasa_adi} ({(k.guncel_bakiye || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Transfer Tutarı (₺)</label>
            <input 
              type="number" step="0.01" required style={{ ...inputStyle, fontSize: '24px', fontWeight: 900, textAlign: 'center' }}
              value={transferForm.tutar} onChange={e => setTransferForm({ ...transferForm, tutar: e.target.value })}
            />
          </div>

          <div>
            <label style={labelStyle}>Tarih & Ödeme Şekli</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <input type="date" style={inputStyle} value={transferForm.tarih} onChange={e => setTransferForm({ ...transferForm, tarih: e.target.value })} />
              <select 
                required style={inputStyle}
                value={transferForm.odeme_sekli} onChange={e => setTransferForm({ ...transferForm, odeme_sekli: e.target.value })}
              >
                <option value="Havale/EFT">Havale/EFT</option>
                <option value="Nakit">Nakit</option>
                <option value="Kredi Kartı">Kredi Kartı</option>
                <option value="Çek">Çek</option>
                <option value="Senet">Senet</option>
              </select>
            </div>
            <textarea 
              rows={3} style={{ ...inputStyle, resize: 'none' }} placeholder="Transfer sebebi..."
              value={transferForm.aciklama} onChange={e => setTransferForm({ ...transferForm, aciklama: e.target.value })}
            />
          </div>

          <button 
            type="submit" disabled={saving}
            style={{ 
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none', 
              background: '#0f172a', color: '#fff', fontSize: '16px', fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(15,23,42,0.3)'
            }}
          >
            {saving ? 'Aktarılıyor...' : 'Transferi Onayla'}
          </button>
        </form>
      </SlideOver>

      <ConfirmModal 
        isOpen={confirmData.open}
        onClose={() => setConfirmData({ ...confirmData, open: false })}
        onConfirm={confirmData.type === 'kasa' ? handleKasaSil : handleHareketSil}
        title={confirmData.type === 'kasa' ? 'Hesabı Sil' : 'Hareketi Sil'}
        message={confirmData.type === 'kasa' 
          ? `"${confirmData.item?.kasa_adi}" hesabını silmek istediğinizden emin misiniz? Bu işlem hesaba ait tüm geçmiş hareketleri de silebilir!` 
          : "Bu finansal hareketi silmek istediğinizden emin misiniz? İşlem geri alınamaz."}
        type="danger"
      />

      <style>{`
        .spinner { width: 24px; height: 24px; border: 3px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
      `}</style>

    </div>
  )
}
