"use client"

import { supabase } from '@/app/lib/supabase'
import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Modal from '@/app/components/Modal'
import ConfirmModal from '@/app/components/ConfirmModal'
import SlideOver from '@/app/components/SlideOver'
import Pagination from '@/app/components/Pagination'

/* ─── Sabitler ─── */
const GRUPLAR = [
  "Filtre ve Bakım", "Mekanik/Motor", "Elektrik", "Kaporta/Aksesuar", "Sarf Malzeme", "Lastik/Jant", "Madeni Yağ", "Diğer"
]

const BIRIMLER = ["Adet", "Litre", "Set", "Kg", "Metre", "Takım"]

const KDV_ORANLARI = [0, 1, 10, 20]

const Icons = {
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  box: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  trendingUp: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  alert: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  history: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
  in: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>,
  out: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="3" y2="21"/><path d="M11 18h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v7"/></svg>,
}

const inputStyle = { width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: 'all 0.2s', background: '#fff' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }

export default function StokYonetimi() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [stats, setStats] = useState({ totalProducts: 0, totalValue: 0, criticalCount: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('Hepsi')
  
  // Modal & SlideOver states
  const [modal, setModal] = useState<{ open: boolean, data: any }>({ open: false, data: null })
  const [slideOver, setSlideOver] = useState<{ open: boolean, item: any, history: any[] }>({ open: false, item: null, history: [] })
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: number | null }>({ open: false, id: null })
  const [movementModal, setMovementModal] = useState<{ open: boolean, type: 'Giriş' | 'Çıkış' }>({ open: false, type: 'Giriş' })
  const [movementForm, setMovementForm] = useState({ miktar: '', aciklama: '' })

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<any>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const showToast = useCallback((msg: string, type = 'success') => { 
    setToast({ msg, type }); 
    setTimeout(() => setToast(null), 3000) 
  }, [])

  /* ─── Veri Yükleme ─── */
  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('stok').select('*').order('ad').limit(50)
    if (error) { showToast('Hata: ' + error.message, 'error'); return }

    setItems(data || [])
    
    // Stats calculation
    const totalVal = (data || []).reduce((acc, curr) => acc + (curr.miktar * curr.a_fiyat), 0)
    const critical = (data || []).filter(u => u.miktar <= (u.kritik_seviye || 5)).length
    setStats({ totalProducts: data?.length || 0, totalValue: totalVal, criticalCount: critical })
    
    setLoading(false)
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  /* ─── Filtreleme ─── */
  const filteredItems = useMemo(() => {
    return items.filter(u => {
      const matchSearch = debouncedSearch === '' || 
        u.ad.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (u.kod || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (u.barkod || '').toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchGroup = selectedGroup === 'Hepsi' || u.grup === selectedGroup
      return matchSearch && matchGroup
    })
  }, [items, debouncedSearch, selectedGroup])

  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  /* ─── Ürün Kaydet (Yeni/Düzenle) ─── */
  const handleSave = useCallback(async (e: any) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.target)
    const formDataObj: any = Object.fromEntries(formData.entries())

    const payload = {
      ad: formDataObj.ad,
      kod: formDataObj.kod || null,
      barkod: formDataObj.barkod || null,
      grup: formDataObj.grup,
      birim: formDataObj.birim,
      a_fiyat: parseFloat(formDataObj.a_fiyat) || 0,
      s_fiyat: parseFloat(formDataObj.s_fiyat) || 0,
      kdv_oran: parseInt(formDataObj.kdv_oran),
      kritik_seviye: parseFloat(formDataObj.kritik_seviye) || 10,
      aciklama: formDataObj.aciklama,
      kullaniciadi: 'admin',
      subeadi: 'Merkez'
    }

    try {
      if (modal.data?.id) {
        // Düzenle
        const { error } = await supabase.from('stok').update(payload).eq('id', modal.data.id)
        if (error) throw error
        showToast('Ürün güncellendi')
      } else {
        // Yeni
        const { data: inserted, error } = await supabase.from('stok').insert([{ 
          ...payload, 
          miktar: parseFloat(formDataObj.miktar) || 0 
        }]).select().single()
        if (error) throw error

        // İlk hareket kaydı
        if (parseFloat(formDataObj.miktar) > 0) {
          await supabase.from('stok_hareket').insert([{
            stok_id: inserted.id,
            hareket_turu: 'Giriş',
            miktar: parseFloat(formDataObj.miktar),
            aciklama: 'Açılış bakiyesi'
          }])
        }
        showToast('Yeni ürün eklendi')
      }
      setModal({ open: false, data: null })
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }, [modal.data, fetchData, showToast])

  /* ─── Silme ─── */
  const handleDelete = useCallback(async () => {
    if (!confirmDelete.id) return
    const { error } = await supabase.from('stok').delete().eq('id', confirmDelete.id)
    if (error) showToast(error.message, 'error')
    else {
      showToast('Ürün silindi')
      fetchData()
    }
    setConfirmDelete({ open: false, id: null })
  }, [confirmDelete.id, fetchData, showToast])

  /* ─── Detay & Hareketler ─── */
  const openDetail = useCallback(async (item: any) => {
    setSlideOver({ open: true, item, history: [] })
    const { data } = await supabase
      .from('stok_hareket')
      .select('*')
      .eq('stok_id', item.id)
      .order('islem_tarihi', { ascending: false })
      .limit(5)
    setSlideOver(prev => ({ ...prev, item, history: data || [] }))
  }, [])

  /* ─── Manuel Hareket Ekle ─── */
  const handleMovementSubmit = useCallback(async (e: any) => {
    e.preventDefault()
    setSaving(true)
    const miktar = parseFloat(movementForm.miktar)
    const item = slideOver.item

    if (movementModal.type === 'Çıkış' && item.miktar < miktar) {
       showToast('Yetersiz stok!', 'error')
       setSaving(false)
       return
    }

    const degisim = movementModal.type === 'Giriş' ? miktar : -miktar

    try {
      const { error: hErr } = await supabase.from('stok_hareket').insert([{
        stok_id: item.id,
        hareket_turu: movementModal.type,
        miktar: miktar,
        aciklama: movementForm.aciklama
      }])
      if (hErr) throw hErr

      await supabase.rpc('update_stok_miktar', { s_id: item.id, degisim: degisim })
      
      showToast('Stok hareketi kaydedildi')
      setMovementModal({ open: false, type: 'Giriş' })
      setMovementForm({ miktar: '', aciklama: '' })
      
      // Refresh
      const { data: updatedItem } = await supabase.from('stok').select('*').eq('id', item.id).single()
      if (updatedItem) openDetail(updatedItem)
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }, [movementForm, movementModal.type, slideOver.item, openDetail, fetchData, showToast])

  return (
    <div style={{ padding: '0 40px', boxSizing: 'border-box' }}>
      {/* Custom Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#fff', padding: '16px 28px', borderRadius: '16px', fontWeight: 700,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)', animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>Yedek Parça & Stok</h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px', fontWeight: 500 }}>
            Tüm yedek parçaları, sarf malzemeleri ve stok hareketlerini buradan yönetebilirsiniz.
          </p>
        </div>
        <button
          onClick={() => setModal({ open: true, data: null })}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 28px', fontSize: '15px' }}
        >
          {Icons.plus} Yeni Ürün Ekle
        </button>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <StatCard icon={Icons.box} label="Toplam Ürün" value={stats.totalProducts} color="#3b82f6" subValue="Barkodlu/Barkodsuz karışık" />
        <StatCard icon={Icons.trendingUp} label="Stok Değeri (Alış)" value={stats.totalValue.toLocaleString('tr-TR') + ' ₺'} color="#10b981" subValue="Mevcut envanter yatırım tutarı" />
        <StatCard icon={Icons.alert} label="Kritik Stok" value={stats.criticalCount} color="#ef4444" subValue="Alarm seviyesindeki ürünler" warning />
      </div>

      {/* Toolbar */}
      <div style={{ background: '#fff', borderRadius: '24px', border: '1.5px solid #f1f5f9', padding: '20px 24px', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{Icons.search}</div>
          <input 
            type="text" 
            placeholder="Kod, ad veya barkod ile hızlı filtrele..." 
            style={{ ...inputStyle, paddingLeft: '48px', height: '48px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['Hepsi', ...GRUPLAR.slice(0, 4)].map(g => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              style={{
                padding: '8px 18px', border: '1.5px solid #e2e8f0', borderRadius: '12px',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                background: selectedGroup === g ? '#0f172a' : '#fff',
                color: selectedGroup === g ? '#fff' : '#64748b'
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Table Component */}
      <div style={{ background: '#fff', borderRadius: '24px', border: '1.5px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #f1f5f9' }}>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Kod / Ürün Adı</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Grup</th>
              <th style={{ padding: '20px 24px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Miktar</th>
              <th style={{ padding: '20px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Birim Fiyat (Alış/Satış)</th>
              <th style={{ padding: '20px 24px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="skeleton" style={{ height: '60px', marginBottom: '12px', width: '100%' }} />
                  ))}
                </td>
              </tr>
            ) : paginatedItems.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Ürün bulunamadı.</td></tr>
            ) : paginatedItems.map(item => (
              <tr 
                key={item.id} 
                className="hover-row"
                style={{ borderBottom: '1.5px solid #f1f5f9', cursor: 'pointer' }}
                onClick={() => openDetail(item)}
              >
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{item.ad}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>{item.kod || 'Kodsuz'} | {item.barkod || 'Barkodsuz'}</div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <span style={{ padding: '6px 12px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontSize: '12px', fontWeight: 700 }}>{item.grup}</span>
                </td>
                <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '12px', fontWeight: 900, fontSize: '15px',
                    background: item.miktar <= 0 ? '#fef2f2' : item.miktar <= item.kritik_seviye ? '#fff9db' : '#f0fdf4',
                    color: item.miktar <= 0 ? '#ef4444' : item.miktar <= item.kritik_seviye ? '#f59f00' : '#10b981'
                  }}>
                    {item.miktar} <span style={{ fontSize: '11px', opacity: 0.8 }}>{item.birim}</span>
                  </div>
                </td>
                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Alış: {item.a_fiyat?.toFixed(2)} ₺</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>Satış: {item.s_fiyat?.toFixed(2)} ₺</div>
                </td>
                <td style={{ padding: '20px 24px' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => setModal({ open: true, data: item })}
                      style={{ padding: '8px', background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >{Icons.edit}</button>
                    <button 
                      onClick={() => setConfirmDelete({ open: true, id: item.id })}
                      style={{ padding: '8px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >{Icons.trash}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <Pagination 
          totalItems={filteredItems.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Product Add/Edit Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? "Stok Kartını Düzenle" : "Yeni Stok Kartı Ekle"}
        size="md"
      >
        <form onSubmit={handleSave} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Ürün Adı *</label>
              <input name="ad" defaultValue={modal.data?.ad} required style={inputStyle} placeholder="Örn: 5W-30 Motor Yağı 4Lt" />
            </div>
            <div>
              <label style={labelStyle}>Stok Kodu</label>
              <input name="kod" defaultValue={modal.data?.kod} style={inputStyle} placeholder="ST-001" />
            </div>
            <div>
              <label style={labelStyle}>Barkod</label>
              <input name="barkod" defaultValue={modal.data?.barkod} style={inputStyle} placeholder="869..." />
            </div>
            <div>
              <label style={labelStyle}>Grup / Kategori</label>
              <select name="grup" defaultValue={modal.data?.grup || "Filtre ve Bakım"} style={inputStyle}>
                {GRUPLAR.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Birim</label>
              <select name="birim" defaultValue={modal.data?.birim || "Adet"} style={inputStyle}>
                {BIRIMLER.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Alış Fiyatı (₺)</label>
              <input name="a_fiyat" type="number" step="0.01" defaultValue={modal.data?.a_fiyat || 0} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Satış Fiyatı (₺)</label>
              <input name="s_fiyat" type="number" step="0.01" defaultValue={modal.data?.s_fiyat || 0} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>KDV Oranı</label>
              <select name="kdv_oran" defaultValue={modal.data?.kdv_oran || 20} style={inputStyle}>
                {KDV_ORANLARI.map(k => <option key={k} value={k}>%{k}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Kritik Stok Seviyesi</label>
              <input name="kritik_seviye" type="number" defaultValue={modal.data?.kritik_seviye || 10} style={inputStyle} />
            </div>
            {!modal.data && (
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Açılış Stok Miktarı</label>
                <input name="miktar" type="number" defaultValue={0} style={inputStyle} />
              </div>
            )}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Açıklama</label>
              <textarea name="aciklama" defaultValue={modal.data?.aciklama} style={{ ...inputStyle, height: '80px', resize: 'none' }} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary" style={{ width: '100%', padding: '16px' }}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </Modal>

      {/* Product Detail Modal (Formerly SlideOver) */}
      <Modal
        isOpen={slideOver.open}
        onClose={() => setSlideOver({ open: false, item: null, history: [] })}
        title={slideOver.item?.ad || 'Ürün Detayı'}
        subtitle={`${slideOver.item?.kod || 'KODSUZ'} | ${slideOver.item?.grup}`}
        size="md"
      >
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Mevcut Stok</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>{slideOver.item?.miktar} <span style={{ fontSize: '14px', color: '#64748b' }}>{slideOver.item?.birim}</span></div>
             </div>
             <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Satış Fiyatı</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#059669' }}>{slideOver.item?.s_fiyat?.toFixed(2)} <span style={{ fontSize: '14px' }}>₺</span></div>
             </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setMovementModal({ open: true, type: 'Giriş' })}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: '#f0fdf4', color: '#166534', border: '1.2px solid #bcf0da', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
            >{Icons.in} Stok Girişi</button>
            <button 
              onClick={() => setMovementModal({ open: true, type: 'Çıkış' })}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: '#fef2f2', color: '#991b1b', border: '1.2px solid #fecaca', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
            >{Icons.out} Stok Çıkışı</button>
          </div>

          {/* History List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ color: '#64748b' }}>{Icons.history}</div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Hareket Geçmişi</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
              {slideOver.history.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', border: '2px dashed #f1f5f9', borderRadius: '16px' }}>Henüz hareket kaydı bulunmuyor.</div>
              ) : (
                <>
                  {slideOver.history.map(h => (
                    <div key={h.id} style={{ padding: '16px', borderRadius: '16px', background: '#fff', border: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
                            background: h.hareket_turu.includes('Servis') ? '#eff6ff' : h.hareket_turu === 'Giriş' ? '#dcfce7' : h.hareket_turu === 'Çıkış' ? '#fee2e2' : '#f1f5f9',
                            color: h.hareket_turu.includes('Servis') ? '#2563eb' : h.hareket_turu === 'Giriş' ? '#15803d' : h.hareket_turu === 'Çıkış' ? '#991b1b' : '#475569'
                          }}>{h.hareket_turu}</span>
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{new Date(h.islem_tarihi).toLocaleDateString('tr-TR')} {new Date(h.islem_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#445164', fontWeight: 600 }}>{h.aciklama || '—'}</p>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: h.hareket_turu.includes('Giriş') || h.hareket_turu.includes('İade') ? '#059669' : '#ef4444' }}>
                        {h.hareket_turu.includes('Giriş') || h.hareket_turu.includes('İade') ? '+' : '-'}{h.miktar}
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <Link href="#" style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6', textDecoration: 'none' }}>Tüm Hareketleri Gör</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Manual Movement Modal */}
      <Modal
        isOpen={movementModal.open}
        onClose={() => setMovementModal({ open: false, type: 'Giriş' })}
        title={`Stok ${movementModal.type} İşlemi`}
        size="sm"
      >
        <form onSubmit={handleMovementSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Miktar ({slideOver.item?.birim})</label>
              <input 
                type="number" step="0.01" required autoFocus
                style={inputStyle} 
                value={movementForm.miktar}
                onChange={e => setMovementForm({ ...movementForm, miktar: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Açıklama / Not</label>
              <textarea 
                style={{ ...inputStyle, height: '80px', resize: 'none' }}
                value={movementForm.aciklama}
                onChange={e => setMovementForm({ ...movementForm, aciklama: e.target.value })}
              />
            </div>
            <button 
              type="submit" 
              disabled={saving} 
              className={movementModal.type === 'Giriş' ? 'btn-primary' : ''}
              style={{ 
                width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                background: movementModal.type === 'Giriş' ? '#10b981' : '#ef4444',
                color: '#fff', fontSize: '15px', fontWeight: 800, cursor: 'pointer'
              }}
            >
              {saving ? 'İşleniyor...' : `${movementModal.type} Yap`}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={handleDelete}
        type="danger"
        title="Ürünü Sil"
        message="Bu stok kartını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm stok geçmişi silinir."
      />

      <style>{`
        .hover-row:hover { background: #f8fafc !important; }
        @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  )
}

function StatCard({ icon, label, value, color, subValue, warning = false }: any) {
  return (
    <div style={{
      background: '#fff', padding: '24px', borderRadius: '24px', border: '1.5px solid #f1f5f9',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: color }}></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ color: color }}>{icon}</div>
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontWeight: 500 }}>{subValue}</div>
      {warning && value > 0 && <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#fef2f2', color: '#ef4444', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>DİKKAT</div>}
    </div>
  )
}