"use client"

import { supabase } from '../lib/supabase'
import { useEffect, useState, useCallback, useMemo } from 'react'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import SlideOver from '../components/SlideOver'
import CariSec from '../components/CariSec'

// SVG İkonları
const Icons = {
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  check: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  alert: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  history: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
}

const inputStyle = { width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }

export default function TaksitTakip() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'Gecikenler' | 'Bu Ay' | 'Tümü'>('Bu Ay')
  const [arama, setArama] = useState('')
  const [kasalar, setKasalar] = useState<any[]>([])
  const [cariler, setCariler] = useState<any[]>([])
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'}|null>(null)

  // Kayıt/Düzenleme State
  const [formOpen, setFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    id: null as number | null,
    cari_id: '',
    tutar: '',
    aciklama: '',
    // Toplu Üretim Alanları
    pesinat: '0',
    pesinat_kasa_id: '',
    taksit_sayisi: '3',
    ilk_vade: new Date().toISOString().split('T')[0],
    vade_tarihi: new Date().toISOString().split('T')[0] // Tekil düzenleme için
  })

  // Diğer Modallar
  const [tahsilModal, setTahsilModal] = useState<{ open: boolean, item: any | null }>({ open: false, item: null })
  const [tahsilForm, setTahsilForm] = useState({ kasa_id: '', tutar: '', tarih: new Date().toISOString().split('T')[0] })
  const [confirmData, setConfirmData] = useState<{ open: boolean, id: number | null }>({ open: false, id: null })
  const [saving, setSaving] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: res }, { data: cData }, { data: kData }] = await Promise.all([
        supabase.from('taksitler').select('*, cari_kart(yetkili), servis_karti(servis_no, arac:arac_id(plaka))').order('vade_tarihi', { ascending: true }),
        supabase.from('cari_kart').select('id, yetkili').order('yetkili'),
        supabase.from('kasalar').select('*').order('kasa_adi')
      ])
      setData(res || [])
      setCariler(cData || [])
      setKasalar(kData || [])
    } catch (err: any) {
      showToast('Veriler yüklenemedi: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = useMemo(() => {
    const bugun = new Date()
    bugun.setHours(0,0,0,0)
    const ayBası = new Date(bugun.getFullYear(), bugun.getMonth(), 1)
    const aySonu = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0)

    let list = data.filter(item => {
      const vade = new Date(item.vade_tarihi)
      if (activeTab === 'Gecikenler') return item.durum !== 'Ödendi' && vade < bugun
      if (activeTab === 'Bu Ay') return item.durum !== 'Ödendi' && vade >= ayBası && vade <= aySonu
      return true
    })

    if (arama) {
      const q = arama.toLowerCase()
      list = list.filter(item => 
        item.cari_kart?.yetkili?.toLowerCase().includes(q) || 
        item.servis_karti?.arac?.plaka?.toLowerCase().includes(q) ||
        item.aciklama?.toLowerCase().includes(q)
      )
    }
    return list
  }, [data, activeTab, arama])

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // ─── Kaydet / Güncelle (Bulk Logic) ───
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isEditing && form.id) {
        // Tekil Düzenleme
        const { error } = await supabase.from('taksitler').update({
          cari_id: parseInt(form.cari_id),
          tutar: parseFloat(form.tutar),
          vade_tarihi: form.vade_tarihi,
          aciklama: form.aciklama
        }).eq('id', form.id)
        if (error) throw error
        showToast('Taksit güncellendi')
      } else {
        // Toplu Oluşturma (Bulk Creation)
        const anaTutarı = parseFloat(form.tutar)
        const pesinat = parseFloat(form.pesinat || '0')
        const taksitSayısı = parseInt(form.taksit_sayisi)
        const kalanTutarı = anaTutarı - pesinat

        // 1. Peşinat varsa kasaya işle
        if (pesinat > 0 && form.pesinat_kasa_id) {
          await supabase.from('kasa_hareket').insert([{
            kasa_id: parseInt(form.pesinat_kasa_id),
            tur: 'gelir',
            tutar: pesinat,
            kategori: 'Manuel Peşinat',
            aciklama: `Manuel taksitlendirme peşinatı`,
            islem_tarihi: new Date().toISOString().split('T')[0],
            kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
            subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
          }])
        }

        // 2. Taksitleri oluştur (Yuvarlama farkı sonuncu taksite)
        const birimTaksit = Math.floor((kalanTutarı / taksitSayısı) * 100) / 100
        const taksitlerArray = []
        let ilkVadeDate = new Date(form.ilk_vade)

        for (let i = 0; i < taksitSayısı; i++) {
          const vDate = new Date(ilkVadeDate)
          vDate.setMonth(vDate.getMonth() + i)
          
          let tTutar = birimTaksit
          if (i === taksitSayısı - 1) {
            tTutar = Math.round((kalanTutarı - (birimTaksit * (taksitSayısı - 1))) * 100) / 100
          }

          taksitlerArray.push({
            cari_id: parseInt(form.cari_id),
            taksit_sirasi: `${i + 1}/${taksitSayısı}`,
            vade_tarihi: vDate.toISOString().split('T')[0],
            tutar: tTutar,
            durum: 'Bekliyor',
            aciklama: form.aciklama || 'Manuel Taksitlendirme',
            kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
            subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
          })
        }

        const { error: tError } = await supabase.from('taksitler').insert(taksitlerArray)
        if (tError) throw tError
        showToast(`${taksitSayısı} adet taksit oluşturuldu`)
      }

      setFormOpen(false)
      fetchData()
    } catch (err: any) {
      showToast('Hata: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmData.id) return
    setSaving(true)
    try {
      const { error } = await supabase.from('taksitler').delete().eq('id', confirmData.id)
      if (error) throw error
      showToast('Kayıt silindi')
      setConfirmData({ open: false, id: null })
      fetchData()
    } catch (err: any) {
      showToast('Hata: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTahsilEt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tahsilModal.item || !tahsilForm.kasa_id || !tahsilForm.tutar) return
    setSaving(true)
    try {
      const item = tahsilModal.item
      const miktar = parseFloat(tahsilForm.tutar)
      const yeni = (parseFloat(item.odenen_tutar || '0')) + miktar
      const durum = yeni >= item.tutar - 0.01 ? 'Ödendi' : 'Kısmi Ödendi'

      await supabase.from('kasa_hareket').insert([{
        kasa_id: parseInt(tahsilForm.kasa_id),
        tur: 'gelir', tutar: miktar, kategori: 'Taksit Tahsilatı',
        aciklama: `${item.taksit_sirasi} nolu taksit tahsilatı`,
        islem_tarihi: tahsilForm.tarih,
        kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
        subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
      }])
      await supabase.from('taksitler').update({ odenen_tutar: yeni, durum }).eq('id', item.id)

      showToast('Tahsilat işlendi')
      setTahsilModal({ open: false, item: null })
      fetchData()
    } catch (err: any) {
      showToast('Hata: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', padding: '0 32px 32px' }}>
      
      {toast && (
        <div style={{ 
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999, 
          background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', 
          padding: '14px 24px', borderRadius: '16px', fontSize: '15px', fontWeight: 700, 
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          {toast.type === 'success' ? Icons.check : Icons.alert} {toast.msg}
        </div>
      )}

      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Taksit Takip Sistemi</h1>
          <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 500 }}>Bakiye ve taksit yönetimini kolayca gerçekleştirin</p>
        </div>
        <button 
          onClick={() => {
            setIsEditing(false)
            setForm({ id: null, cari_id: '', tutar: '', aciklama: '', pesinat: '0', pesinat_kasa_id: '', taksit_sayisi: '3', ilk_vade: new Date().toISOString().split('T')[0], vade_tarihi: '' })
            setFormOpen(true)
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 28px', borderRadius: '16px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}
        >
          {Icons.plus} Yeni Taksit Kaydı
        </button>
      </div>

      {/* ─── Filter Bar ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
          {['Gecikenler', 'Bu Ay', 'Tümü'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: activeTab === tab ? '#fff' : 'transparent', color: activeTab === tab ? (tab === 'Gecikenler' ? '#ef4444' : '#0f172a') : '#64748b', fontWeight: 800, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
              {tab}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{Icons.search}</span>
          <input type="text" placeholder="Hızlı ara..." value={arama} onChange={e => setArama(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '44px', background: '#f8fafc' }} />
        </div>
      </div>

      {/* ─── Table ─── */}
      <div style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Müşteri / Araç', 'Taksit', 'Vade Tarihi', 'Kalan Tutar', 'Durum', 'İşlemler'].map(h => (
                <th key={h} style={{ padding: '18px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && paginated.map((item, idx) => {
              const kalan = (item.tutar || 0) - (parseFloat(item.odenen_tutar || '0'))
              const statusColor = item.durum === 'Ödendi' ? '#10b981' : (item.durum === 'Kısmi Ödendi' ? '#3b82f6' : '#f59e0b')
              const isOverdue = new Date(item.vade_tarihi) < new Date() && item.durum !== 'Ödendi'

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '18px 24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{item.cari_kart?.yetkili || '—'}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.servis_karti?.arac?.plaka || 'Plaka Yok'}</div>
                  </td>
                  <td style={{ padding: '18px 24px' }}>
                    <span style={{ padding: '4px 10px', background: '#eff6ff', color: '#3b82f6', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>{item.taksit_sirasi}</span>
                  </td>
                  <td style={{ padding: '18px 24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: isOverdue ? '#ef4444' : '#0f172a' }}>{new Date(item.vade_tarihi).toLocaleDateString('tr-TR')}</div>
                  </td>
                  <td style={{ padding: '18px 24px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>{kalan.toLocaleString('tr-TR')} ₺</div>
                  </td>
                  <td style={{ padding: '18px 24px' }}>
                    <span style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, background: statusColor + '15', color: statusColor }}>{item.durum}</span>
                  </td>
                  <td style={{ padding: '18px 24px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {item.durum !== 'Ödendi' && (
                        <button onClick={() => { setTahsilForm({ ...tahsilForm, tutar: kalan.toString() }); setTahsilModal({ open: true, item }) }}
                          style={{ padding: '8px 12px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                          Tahsil
                        </button>
                      )}
                      <button onClick={() => {
                        setIsEditing(true)
                        setForm({ ...form, id: item.id, cari_id: item.cari_id.toString(), tutar: item.tutar.toString(), vade_tarihi: item.vade_tarihi, aciklama: item.aciklama || '' })
                        setFormOpen(true)
                      }} style={{ padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '8px', color: '#64748b', cursor: 'pointer' }}>{Icons.edit}</button>
                      <button onClick={() => setConfirmData({ open: true, id: item.id })} style={{ padding: '8px', background: '#fef2f2', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}>{Icons.trash}</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination totalItems={filtered.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </div>

      {/* ─── SlideOver: Kayıt/Düzenleme ─── */}
      <SlideOver isOpen={formOpen} onClose={() => setFormOpen(false)} title={isEditing ? 'Taksit Düzenle' : 'Yeni Taksitlendirme (Toplu)'}>
        <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Müşteri Seçimi</label>
            <CariSec 
              value={form.cari_id} 
              onChange={id => setForm({ ...form, cari_id: id })} 
              placeholder="Müşteri adını yazın veya yeni ekleyin..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>{isEditing ? 'Taksit Tutarı' : 'Toplam Tutar (Bölünecek)'}</label>
              <input type="number" step="0.01" required style={{ ...inputStyle, fontSize: '18px', fontWeight: 800 }} value={form.tutar} onChange={e => setForm({ ...form, tutar: e.target.value })} />
            </div>
            {isEditing && (
              <div>
                <label style={labelStyle}>Vade Tarihi</label>
                <input type="date" required style={inputStyle} value={form.vade_tarihi} onChange={e => setForm({ ...form, vade_tarihi: e.target.value })} />
              </div>
            )}
          </div>

          {!isEditing && (
             <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                   <div>
                      <label style={labelStyle}>Peşinat (Opsiyonel)</label>
                      <input type="number" step="0.01" style={inputStyle} value={form.pesinat} onChange={e => setForm({...form, pesinat: e.target.value})} />
                   </div>
                   <div>
                      <label style={labelStyle}>Peşinat Kasası</label>
                      <select style={inputStyle} value={form.pesinat_kasa_id} onChange={e => setForm({...form, pesinat_kasa_id: e.target.value})} required={parseFloat(form.pesinat) > 0}>
                         <option value="">Seçiniz...</option>
                         {kasalar.map(k => <option key={k.id} value={k.id}>{k.kasa_adi}</option>)}
                      </select>
                   </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                   <div>
                      <label style={labelStyle}>Taksit Sayısı</label>
                      <input type="number" min="2" max="24" style={inputStyle} value={form.taksit_sayisi} onChange={e => setForm({...form, taksit_sayisi: e.target.value})} />
                   </div>
                   <div>
                      <label style={labelStyle}>İlk Vade</label>
                      <input type="date" style={inputStyle} value={form.ilk_vade} onChange={e => setForm({...form, ilk_vade: e.target.value})} />
                   </div>
                </div>
             </div>
          )}

          <div>
            <label style={labelStyle}>Açıklama / Not</label>
            <textarea rows={3} style={{ ...inputStyle, resize: 'none' }} value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} />
          </div>

          <button type="submit" disabled={saving} style={{ 
            marginTop: '20px', width: '100%', padding: '16px', borderRadius: '16px', 
            background: '#3b82f6', color: '#fff', fontSize: '16px', fontWeight: 800, cursor: 'pointer',
            border: 'none', boxShadow: '0 8px 20px rgba(59,130,246,0.2)' 
          }}>
            {saving ? 'İşleniyor...' : (isEditing ? 'Değişiklikleri Kaydet' : 'Taksitleri Oluştur')}
          </button>
        </form>
      </SlideOver>

      {/* ─── Modals ─── */}
      <Modal isOpen={tahsilModal.open} onClose={() => setTahsilModal({ open: false, item: null })} title="Taksit Tahsilatı" size="sm">
        <form onSubmit={handleTahsilEt} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>ÖDENECEK TUTAR</div>
            <div style={{ fontSize: '24px', fontWeight: 900 }}>{((tahsilModal.item?.tutar || 0) - (parseFloat(tahsilModal.item?.odenen_tutar || '0'))).toLocaleString('tr-TR')} ₺</div>
          </div>
          <input type="number" step="0.01" required style={{ ...inputStyle, fontSize: '18px', fontWeight: 800 }} value={tahsilForm.tutar} onChange={e => setTahsilForm({ ...tahsilForm, tutar: e.target.value })} max={tahsilModal.item?.tutar - (tahsilModal.item?.odenen_tutar || 0)} />
          <select required style={inputStyle} value={tahsilForm.kasa_id} onChange={e => setTahsilForm({ ...tahsilForm, kasa_id: e.target.value })}>
             <option value="">Hesap Seçiniz...</option>
             {kasalar.map(k => <option key={k.id} value={k.id}>{k.kasa_adi} ({(k.guncel_bakiye||0).toLocaleString('tr-TR')} ₺)</option>)}
          </select>
          <input type="date" required style={inputStyle} value={tahsilForm.tarih} onChange={e => setTahsilForm({ ...tahsilForm, tarih: e.target.value })} />
          <button type="submit" disabled={saving} style={{ padding: '14px', borderRadius: '12px', background: '#3b82f6', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}>{saving ? 'İşleniyor...' : 'Tahsilatı Onayla'}</button>
        </form>
      </Modal>

      <ConfirmModal isOpen={confirmData.open} title="Taksit Sil" message="Bu taksit kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz." onConfirm={handleDelete} onClose={() => setConfirmData({ open: false, id: null })} />

    </div>
  )
}
