"use client"

import { supabase } from '../lib/supabase'
import { useEffect, useState, useCallback } from 'react'
import SlideOver from '../components/SlideOver'
import ConfirmModal from '../components/ConfirmModal'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import CariSec from '../components/CariSec'

// SVG İkonları
const icons = {
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  plus: 'M12 5v14M5 12h14',
  trash: 'M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  history: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  more: 'M12 12h.01M12 12h.01M12 12h.01 M12 5h.01 M12 19h.01',
  bank: 'M3 21h18 M3 10h18 M5 6l7-3 7 3 M4 10v11 M11 10v11 M15 10v11 M20 10v11',
  user: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z',
  alert: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
}

const Icon = ({ d, size = 18, color = 'currentColor' }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const inputStyle = { width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }

export default function CekSenetYonetimi() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'Alınan' | 'Verilen'>('Alınan')
  const [arama, setArama] = useState('')
  
  // State: Kasalar & Cariler (Formlar için)
  const [kasalar, setKasalar] = useState<any[]>([])
  const [cariler, setCariler] = useState<any[]>([])

  // Modallar/Paneller
  const [formPanel, setFormPanel] = useState(false)
  const [tahsilModal, setTahsilModal] = useState<{ open: boolean, item: any | null }>({ open: false, item: null })
  const [ciroModal, setCiroModal] = useState<{ open: boolean, item: any | null }>({ open: false, item: null })
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: number | null }>({ open: false, id: null })
  
  // Form State
  const [form, setForm] = useState({
    id: null as number | null,
    evrak_turu: 'Çek',
    islem_yonu: 'Müşteriden Alınan',
    belge_no: '',
    vade_tarihi: new Date().toISOString().split('T')[0],
    tutar: '',
    cari_id: '',
    aciklama: ''
  })
  
  const [tahsilForm, setTahsilForm] = useState({ kasa_id: '', tarih: new Date().toISOString().split('T')[0] })
  const [ciroForm, setCiroForm] = useState({ cari_id: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'}|null>(null)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Sayfalama
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: evraklar, error } = await supabase
      .from('cek_senet')
      .select('*, cari:cari_kart!cari_id(yetkili), ciro_cari:cari_kart!ciro_edilen_cari_id(yetkili)')
      .order('vade_tarihi', { ascending: true })
    
    if (error) {
      console.error(error)
      showToast('Veriler yüklenemedi: ' + error.message, 'error')
    } else setData(evraklar || [])

    const [cRes, kRes] = await Promise.all([
      supabase.from('cari_kart').select('id, yetkili').order('yetkili'),
      supabase.from('kasalar').select('id, kasa_adi').order('kasa_adi')
    ])
    setCariler(cRes.data || [])
    setKasalar(kRes.data || [])
    
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    let res = data.filter(item => 
      activeTab === 'Alınan' ? item.islem_yonu === 'Müşteriden Alınan' : item.islem_yonu === 'Firmamızın Verdiği'
    )
    if (arama) {
      const q = arama.toLowerCase()
      res = res.filter(item => 
        item.belge_no?.toLowerCase().includes(q) || 
        item.cari?.yetkili?.toLowerCase().includes(q) ||
        item.aciklama?.toLowerCase().includes(q)
      )
    }
    setFiltered(res)
    setCurrentPage(1)
  }, [data, activeTab, arama])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasyon
    const newErrors: Record<string, boolean> = {}
    if (!form.cari_id) newErrors.cari_id = true
    if (!form.tutar || parseFloat(form.tutar.toString()) <= 0) newErrors.tutar = true
    if (!form.belge_no) newErrors.belge_no = true
    
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      showToast('Lütfen zorunlu alanları eksiksiz ve doğru doldurunuz.', 'error')
      return
    }

    setSaving(true)
    
    try {
      const userRes = await supabase.auth.getUser()
      const tenant_id = userRes.data.user?.id

      const payload: any = {
        tenant_id,
        evrak_turu: form.evrak_turu,
        belge_no: form.belge_no,
        vade_tarihi: form.vade_tarihi,
        tutar: parseFloat(form.tutar.toString()),
        cari_id: parseInt(form.cari_id.toString()),
        aciklama: form.aciklama,
        islem_yonu: activeTab === 'Alınan' ? 'Müşteriden Alınan' : 'Firmamızın Verdiği',
        kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
        subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
      }
      
      if (!form.id) {
        payload.durum = 'Bekliyor'
      }
      
      let error
      if (form.id) {
         const { error: err } = await supabase.from('cek_senet').update(payload).eq('id', form.id)
         error = err
      } else {
         const { error: err } = await supabase.from('cek_senet').insert([payload])
         error = err
      }

      if (error) throw error

      showToast(form.id ? 'Evrak güncellendi' : 'Yeni evrak kaydedildi')
      setFormPanel(false)
      fetchData()
    } catch (err: any) {
      console.error('Save error:', err)
      showToast('Hata: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTahsilEt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tahsilModal.item || !tahsilForm.kasa_id) return
    setSaving(true)

    const item = tahsilModal.item
    const yeniDurum = item.islem_yonu === 'Müşteriden Alınan' ? 'Tahsil Edildi' : 'Ödendi'

    // 1. Kasa hareketi ekle
    const { error: kError } = await supabase.from('kasa_hareket').insert([{
      kasa_id: parseInt(tahsilForm.kasa_id),
      tur: item.islem_yonu === 'Müşteriden Alınan' ? 'gelir' : 'gider',
      tutar: item.tutar,
      kategori: 'Çek/Senet Tahsilatı',
      aciklama: `${item.evrak_turu} Tahsilatı: ${item.belge_no || ''} (${item.cari?.yetkili || ''})`,
      islem_tarihi: tahsilForm.tarih,
      kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
      subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
    }])

    if (kError) { alert('Hata: ' + kError.message); setSaving(false); return }

    // 2. Evrak durumunu güncelle
    const { error: sError } = await supabase.from('cek_senet').update({ durum: yeniDurum }).eq('id', item.id)
    
    setSaving(false)
    if (sError) alert('Hata: ' + sError.message)
    else {
      setTahsilModal({ open: false, item: null })
      fetchData()
    }
  }

  const handleCiroEt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ciroModal.item || !ciroForm.cari_id) return
    setSaving(true)

    const { error } = await supabase.from('cek_senet').update({
      durum: 'Ciro Edildi',
      ciro_edilen_cari_id: parseInt(ciroForm.cari_id)
    }).eq('id', ciroModal.item.id)

    setSaving(false)
    if (error) alert('Hata: ' + error.message)
    else {
      setCiroModal({ open: false, item: null })
      fetchData()
    }
  }

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('cek_senet').delete().eq('id', id)
    if (error) alert('Silinemedi: ' + error.message)
    else {
      setConfirmDelete({ open: false, id: null })
      fetchData()
    }
  }

  const getVadeLabel = (vadeStr: string, durum: string) => {
    if (durum !== 'Bekliyor') return null
    const vade = new Date(vadeStr)
    const bugun = new Date()
    bugun.setHours(0,0,0,0)
    const fark = Math.ceil((vade.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24))

    if (fark < 0) return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontWeight: 800 }}>
        <Icon d={icons.alert} size={14} color="#ef4444" /> {Math.abs(fark)} Gün Geçti
      </span>
    )
    if (fark <= 3) return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 800 }}>
        <Icon d={icons.history} size={14} color="#f59e0b" /> {fark === 0 ? 'Bugün!' : fark + ' Gün Kaldı'}
      </span>
    )
    return <span style={{ color: '#64748b' }}>{fark} Gün Var</span>
  }

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', padding: '0 32px 32px' }}>
      
      {toast && (
        <div style={{ 
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999, 
          background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', 
          padding: '14px 24px', borderRadius: '16px', fontSize: '15px', fontWeight: 700, 
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)', animation: 'modalSlideIn 0.2s ease-out',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{ 
            width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Icon d={toast.type === 'success' ? icons.check : icons.alert} size={14} color="#fff" />
          </div>
          {toast.msg}
        </div>
      )}

      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Çek & Senet Yönetimi</h1>
          <p style={{ color: '#64748b', fontSize: '15px', margin: '4px 0 0', fontWeight: 500 }}>Vadeli alacak ve borçlarınızı buradan takip edin</p>
        </div>
        <button 
          onClick={() => {
            setForm({ id: null, evrak_turu: 'Çek', islem_yonu: activeTab === 'Alınan' ? 'Müşteriden Alınan' : 'Firmamızın Verdiği', belge_no: '', vade_tarihi: new Date().toISOString().split('T')[0], tutar: '', cari_id: '', aciklama: '' })
            setFormPanel(true)
          }}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '10px', background: '#3b82f6', color: '#fff', 
            padding: '14px 24px', borderRadius: '16px', fontWeight: 800, fontSize: '15px', 
            border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(59,130,246,0.3)' 
          }}
        >
          <Icon d={icons.plus} size={20} /> Yeni Evrak Kaydı
        </button>
      </div>

      {/* ─── Filtreler & Sekmeler ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
          {['Alınan', 'Verilen'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                padding: '10px 24px', borderRadius: '10px', border: 'none',
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#0f172a' : '#64748b',
                fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                boxShadow: activeTab === tab ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'Alınan' ? 'Alınan (Alacaklar)' : 'Verilen (Borçlar)'}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input 
            type="text" placeholder="No, cari veya açıklama ara..." value={arama} onChange={e => setArama(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '44px', background: '#f8fafc', border: '1px solid #e2e8f0' }} 
          />
        </div>
      </div>

      {/* ─── Liste Tablosu ─── */}
      <div style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Tür / No', 'Cari Bilgisi', 'Vade Tarihi', 'Durum', 'Tutar', 'İşlem'].map(h => (
                <th key={h} style={{ padding: '18px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3,4,5].map(i => (
                <tr key={i}><td colSpan={6} style={{ padding: '24px', textAlign: 'center' }}><div style={{ height: '30px', background: '#f1f5f9', borderRadius: '8px', animate: 'pulse 1.5s infinite' }} /></td></tr>
              ))
            ) : paginated.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.evrak_turu === 'Çek' ? '#3b82f6' : '#7c3aed' }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{item.evrak_turu}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>#{item.belge_no || 'No Yok'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{item.cari?.yetkili || '—'}</div>
                  {item.durum === 'Ciro Edildi' && (
                    <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
                      ↳ Ciro: {item.ciro_cari?.yetkili || '...'}
                    </div>
                  )}
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{new Date(item.vade_tarihi).toLocaleDateString('tr-TR')}</div>
                  <div style={{ fontSize: '11px', marginTop: '2px' }}>{getVadeLabel(item.vade_tarihi, item.durum)}</div>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <span style={{ 
                    padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 800,
                    background: item.durum === 'Bekliyor' ? '#fff7ed' : (item.durum === 'Tahsil Edildi' || item.durum === 'Ödendi' ? '#ecfdf5' : '#f1f5f9'),
                    color: item.durum === 'Bekliyor' ? '#c2410c' : (item.durum === 'Tahsil Edildi' || item.durum === 'Ödendi' ? '#065f46' : '#475569'),
                    border: '1px solid currentColor', opacity: 0.8
                  }}>
                    {item.durum}
                  </span>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                    {item.tutar?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span style={{ fontSize: '12px' }}>₺</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {item.durum === 'Bekliyor' && (
                      <>
                        <button 
                          onClick={() => { setTahsilForm({ ...tahsilForm, kasa_id: '' }); setTahsilModal({ open: true, item }) }}
                          title={activeTab === 'Alınan' ? 'Tahsil Et' : 'Ödendi Yap'}
                          style={{ padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#10b981' }}
                        >
                          <Icon d={icons.check} size={18} />
                        </button>
                        {activeTab === 'Alınan' && (
                          <button 
                            onClick={() => { setCiroForm({ cari_id: '' }); setCiroModal({ open: true, item }) }}
                            title="Ciro Et"
                            style={{ padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#3b82f6' }}
                          >
                            <Icon d={icons.history} size={18} />
                          </button>
                        )}
                      </>
                    )}
                    <button 
                      onClick={() => setConfirmDelete({ open: true, id: item.id })}
                      style={{ padding: '8px', borderRadius: '10px', border: '1px solid #fee2e2', background: '#fff5f5', cursor: 'pointer', color: '#ef4444' }}
                    >
                      <Icon d={icons.trash} size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filtered.length === 0 && !loading && (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <Icon d={icons.alert} size={48} />
            <p style={{ marginTop: '12px', fontWeight: 600 }}>Sonuç bulunamadı</p>
          </div>
        )}

        <Pagination 
          totalItems={filtered.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ─── SlideOver: Yeni/Düzenle ─── */}
      <SlideOver isOpen={formPanel} onClose={() => setFormPanel(false)} title={form.id ? "Evrak Düzenle" : "Yeni Evrak Girişi"}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Evrak Türü</label>
              <select style={inputStyle} value={form.evrak_turu} onChange={e => setForm({ ...form, evrak_turu: e.target.value })}>
                <option value="Çek">Çek</option>
                <option value="Senet">Senet</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Belge No</label>
              <input 
                style={{ ...inputStyle, border: errors.belge_no ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0' }} 
                placeholder="Örn: 102345"
                value={form.belge_no} onChange={e => { setForm({ ...form, belge_no: e.target.value }); if(errors.belge_no) setErrors({...errors, belge_no: false}) }} 
              />
              {errors.belge_no && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginTop: '4px', display: 'block' }}>Evrak numarası gereklidir</span>}
            </div>
          </div>

          <div>
            <label style={labelStyle}>{activeTab === 'Alınan' ? 'Müşteri (Alınan Cari)' : 'Tedarikçi (Verilen Cari)'}</label>
            <CariSec 
              value={form.cari_id} 
              onChange={id => { setForm({ ...form, cari_id: id }); if(errors.cari_id) setErrors({...errors, cari_id: false}) }} 
              placeholder="Cari seçin veya yeni oluşturun..."
            />
            {errors.cari_id && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginTop: '4px', display: 'block' }}>Lütfen bir cari seçiniz</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Tutar (₺)</label>
              <input 
                type="number" step="0.01" 
                style={{ ...inputStyle, fontSize: '18px', fontWeight: 800, color: '#0f172a', border: errors.tutar ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0' }} 
                value={form.tutar} onChange={e => { setForm({ ...form, tutar: e.target.value }); if(errors.tutar) setErrors({...errors, tutar: false}) }} 
              />
              {errors.tutar && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginTop: '4px', display: 'block' }}>Geçerli bir tutar giriniz</span>}
            </div>
            <div>
              <label style={labelStyle}>Vade Tarihi</label>
              <input type="date" required style={inputStyle} value={form.vade_tarihi} onChange={e => setForm({ ...form, vade_tarihi: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Açıklama</label>
            <textarea rows={3} style={{ ...inputStyle, resize: 'none' }} value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} />
          </div>

          <button type="submit" disabled={saving} style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}>
            {saving ? 'Kaydediliyor...' : (<><Icon d={icons.check} size={20} color="#fff" /> Evrakı Kaydet</>)}
          </button>
        </form>
      </SlideOver>

      {/* ─── Modal: Tahsil Et ─── */}
      <Modal isOpen={tahsilModal.open} onClose={() => setTahsilModal({ open: false, item: null })} title={tahsilModal.item?.islem_yonu === 'Müşteriden Alınan' ? 'Tahsilat İşlemi' : 'Ödeme İşlemi'} size="sm">
        <form onSubmit={handleTahsilEt} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>İŞLEM TUTARI</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{tahsilModal.item?.tutar?.toLocaleString('tr-TR')} ₺</div>
          </div>
          <div>
            <label style={labelStyle}>Hangi Hesaba? (Kasa/Banka)</label>
            <select required style={inputStyle} value={tahsilForm.kasa_id} onChange={e => setTahsilForm({ ...tahsilForm, kasa_id: e.target.value })}>
              <option value="">Seçiniz...</option>
              {kasalar.map(k => <option key={k.id} value={k.id}>{k.kasa_adi}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>İşlem Tarihi</label>
            <input type="date" required style={inputStyle} value={tahsilForm.tarih} onChange={e => setTahsilForm({ ...tahsilForm, tarih: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
            {saving ? 'İşleniyor...' : (activeTab === 'Alınan' ? 'Tahsilatı Tamamla' : 'Ödemeyi Tamamla')}
          </button>
        </form>
      </Modal>

      {/* ─── Modal: Ciro Et ─── */}
      <Modal isOpen={ciroModal.open} onClose={() => setCiroModal({ open: false, item: null })} title="Evrak Ciro (Devir) İşlemi" size="sm">
        <form onSubmit={handleCiroEt} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
            Bu çek/senet başka bir firmaya devredilecek. Lütfen ciro edilecek firmayı seçin.
          </div>
          <div>
            <label style={labelStyle}>Ciro Edilecek Cari</label>
            <select required style={inputStyle} value={ciroForm.cari_id} onChange={e => setCiroForm({ ...ciroForm, cari_id: e.target.value })}>
              <option value="">Firmayı Seçin...</option>
              {cariler.map(c => <option key={c.id} value={c.id}>{c.yetkili}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
            {saving ? 'İşleniyor...' : (<><Icon d={icons.check} size={18} color="#fff" /> Ciro İşlemini Onayla</>)}
          </button>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={() => confirmDelete.id && handleDelete(confirmDelete.id)}
        type="danger"
        title="Evrak Kaydını Sil"
        message="Bu çek/senet kaydını silmek istediğinizden emin misiniz? Bu işlem finansal verileri etkileyebilir."
      />

    </div>
  )
}
