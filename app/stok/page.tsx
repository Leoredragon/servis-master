"use client"

import { supabase } from '../lib/supabase'
import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import ConfirmModal from '../components/ConfirmModal'
import Pagination from '../components/Pagination'
import StokHareketiModal from '../components/StokHareketiModal'
import StockCardModal from '../components/StockCardModal'
import { useRouter } from 'next/navigation'

const Icons = {
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  list: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  box: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  arrowUpDown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
}

export default function StokYonetimi() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [gruplar, setGruplar] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Filtreler
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedGrup, setSelectedGrup] = useState('Tümü')
  const [durumFiltre, setDurumFiltre] = useState('Tümü') // Tümü, Normal, Kritik, Stoksuz

  // Görünüm & Sayfalama
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 24

  // Modals
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: number | null }>({ open: false, id: null })
  const [hareketModal, setHareketModal] = useState<{ open: boolean, stok: any }>({ open: false, stok: null })
  const [selectedStokId, setSelectedStokId] = useState<number | null>(null)

  // İlk yükleme ve localstorage algılama
  useEffect(() => {
    const vm = localStorage.getItem('stok_view') as any
    if (vm === 'table' || vm === 'grid') setViewMode(vm)
  }, [])

  const handleSetView = (v: 'table'|'grid') => {
    setViewMode(v)
    localStorage.setItem('stok_view', v)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('stok').select('*').order('ad')
    setItems(data || [])
    
    // Grupları derle (dinamik)
    const grps = Array.from(new Set((data || []).map(x => x.grup).filter(Boolean)))
    setGruplar(grps as string[])

    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(handler)
  }, [search])

  const handleDelete = async () => {
    if (!confirmDelete.id) return
    await supabase.from('stok_hareket').delete().eq('stok_id', confirmDelete.id)
    await supabase.from('stok').delete().eq('id', confirmDelete.id)
    setConfirmDelete({ open: false, id: null })
    fetchData()
  }

  // Stat hesaplama
  const stats = useMemo(() => {
     let tValue = 0, critical = 0, zero = 0
     items.forEach(i => {
        tValue += (i.miktar || 0) * (i.a_fiyat || 0)
        if (i.miktar <= 0) zero++
        else if (i.miktar <= (i.kritik_seviye || 10)) critical++
     })
     return { total: items.length, tValue, critical, zero }
  }, [items])

  // Filtreme
  const filteredItems = useMemo(() => {
    return items.filter(u => {
      const q = debouncedSearch.toLowerCase()
      const matchSearch = !q || (u.ad || '').toLowerCase().includes(q) || (u.kod || '').toLowerCase().includes(q) || (u.barkod || '').toLowerCase().includes(q)
      const matchGroup = selectedGrup === 'Tümü' || u.grup === selectedGrup
      
      let matchDurum = true
      if (durumFiltre === 'Stoksuz') matchDurum = u.miktar <= 0
      else if (durumFiltre === 'Kritik') matchDurum = u.miktar > 0 && u.miktar <= (u.kritik_seviye || 10)
      else if (durumFiltre === 'Normal') matchDurum = u.miktar > (u.kritik_seviye || 10)

      return matchSearch && matchGroup && matchDurum
    })
  }, [items, debouncedSearch, selectedGrup, durumFiltre])

  const paginated = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const getStyleForLevel = (m: number, c: number) => {
    if (m <= 0) return { bg: '#fee2e2', text: '#ef4444', label: 'Stoksuz' }
    if (m <= c) return { bg: '#fef3c7', text: '#d97706', label: 'Kritik' }
    return { bg: '#dcfce7', text: '#16a34a', label: 'Normal' }
  }

  return (
    <div className="animate-fadeIn" style={{ width: '100%', padding: '0 32px 32px' }}>
       
       <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Stok & Depo Yönetimi</h1>
            <p style={{ color: '#64748b', fontSize: '15px', margin: '6px 0 0', fontWeight: 500 }}>Filtreleri kullanarak veya arama yaparak stokları yönetin.</p>
          </div>
          <Link href="/stok/yeni" className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            {Icons.plus} Yeni Ürün Ekle
          </Link>
       </div>

       {/* KPi Cards */}
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
             <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Toplam Ürün Sayısı</div>
             <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>{stats.total}</div>
          </div>
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
             <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Toplam Stok Değeri</div>
             <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', marginTop: '6px' }}>{stats.tValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</div>
          </div>
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59f00' }}>
             <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Kritik Olanlar</div>
             <div style={{ fontSize: '28px', fontWeight: 900, color: '#d97706', marginTop: '6px' }}>{stats.critical}</div>
          </div>
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
             <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Sıfırlanan (Stoksuz)</div>
             <div style={{ fontSize: '28px', fontWeight: 900, color: '#ef4444', marginTop: '6px' }}>{stats.zero}</div>
          </div>
       </div>

       {/* Toolbar */}
       <div className="card" style={{ padding: '16px 24px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '14px', color: '#94a3b8' }}>{Icons.search}</span>
            <input 
              type="text" placeholder="Kod, ad veya barkod ile bulun..." 
              style={{ width: '100%', padding: '12px 16px 12px 42px', border: '1.5px solid #e2e8f0', borderRadius: '12px', outline: 'none', background: '#f8fafc' }}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <select style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontWeight: 600 }} value={selectedGrup} onChange={e => {setSelectedGrup(e.target.value); setCurrentPage(1)}}>
             <option value="Tümü">Tüm Gruplar</option>
             {gruplar.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontWeight: 600 }} value={durumFiltre} onChange={e => {setDurumFiltre(e.target.value); setCurrentPage(1)}}>
             {['Tümü', 'Normal', 'Kritik', 'Stoksuz'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
            <button onClick={() => handleSetView('table')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: viewMode === 'table' ? '#fff' : 'transparent', color: viewMode === 'table' ? '#3b82f6' : '#64748b', cursor: 'pointer', transition: '0.2s', boxShadow: viewMode === 'table' ? '0 2px 5px rgba(0,0,0,0.05)': 'none' }}>
               {Icons.list}
            </button>
            <button onClick={() => handleSetView('grid')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: viewMode === 'grid' ? '#fff' : 'transparent', color: viewMode === 'grid' ? '#3b82f6' : '#64748b', cursor: 'pointer', transition: '0.2s', boxShadow: viewMode === 'grid' ? '0 2px 5px rgba(0,0,0,0.05)': 'none' }}>
               {Icons.grid}
            </button>
          </div>
       </div>

       {loading ? (
          <div style={{ padding: '40px' }}><div className="skeleton" style={{ height: '400px', borderRadius: '24px' }}></div></div>
       ) : (
          <>
             {viewMode === 'table' ? (
                <div className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Resim</th>
                          <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Kod / Ad</th>
                          <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Grup</th>
                          <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Stok</th>
                          <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Fiyat (A/S)</th>
                          <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map(u => {
                           const lvl = getStyleForLevel(u.miktar, u.kritik_seviye || 10)
                           return (
                             <tr key={u.id} className="hover-row" style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setSelectedStokId(u.id)}>
                                <td style={{ padding: '12px 24px', width: '60px' }}>
                                   <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                      {u.resimyolu ? <img src={u.resimyolu} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} /> : Icons.box}
                                   </div>
                                </td>
                                <td style={{ padding: '12px 24px' }}>
                                   <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{u.ad}</div>
                                   <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>{u.kod || u.barkod || 'Kodsuz/Barkodsuz'}</div>
                                </td>
                                <td style={{ padding: '12px 24px' }}>
                                   <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', background: '#f8fafc', padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>{u.grup}</span>
                                </td>
                                <td style={{ padding: '12px 24px' }}>
                                   <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: lvl.bg, color: lvl.text, padding: '4px 10px', borderRadius: '8px', fontWeight: 800, fontSize: '13px' }}>
                                      {u.miktar} <span style={{ fontSize: '10px', opacity: 0.8 }}>{u.birim}</span>
                                   </div>
                                </td>
                                <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                                   <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>A: {(u.a_fiyat || 0).toLocaleString('tr-TR')} ₺</div>
                                   <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>S: {(u.s_fiyat || 0).toLocaleString('tr-TR')} ₺</div>
                                </td>
                                <td style={{ padding: '12px 24px' }} onClick={e => e.stopPropagation()}>
                                   <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                      <button onClick={() => setHareketModal({ open: true, stok: u })} style={{ padding: '8px', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', border: 'none', cursor: 'pointer' }} title="Stok Hareketi / Düzenle">{Icons.edit}</button>
                                      <button onClick={() => setConfirmDelete({ open: true, id: u.id })} style={{ padding: '8px', borderRadius: '8px', background: '#fef2f2', color: '#ef4444', border: 'none', cursor: 'pointer' }} title="Sil">{Icons.trash}</button>
                                   </div>
                                </td>
                             </tr>
                           )
                        })}
                        {paginated.length === 0 && <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Seçili kriterlere uygun kayıt bulunamadı.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
             ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                   {paginated.map(u => {
                      const lvl = getStyleForLevel(u.miktar, u.kritik_seviye || 10)
                      return (
                         <div key={u.id} className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setSelectedStokId(u.id)}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: lvl.text }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                               <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>{u.grup}</span>
                               <span style={{ fontSize: '11px', fontWeight: 800, color: lvl.text, background: lvl.bg, padding: '4px 8px', borderRadius: '6px' }}>{lvl.label}</span>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>{u.ad}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', fontWeight: 600, marginBottom: '20px' }}>{u.kod || u.barkod || 'Yok'}</div>
                            
                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                               <div>
                                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>MEVCUT</div>
                                  <div style={{ fontSize: '24px', fontWeight: 900, color: lvl.text }}>{u.miktar} <span style={{ fontSize: '12px', opacity: 0.8 }}>{u.birim}</span></div>
                               </div>
                               <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{(u.s_fiyat || 0).toLocaleString('tr-TR')} ₺</div>
                               </div>
                            </div>
                            <div style={{ borderTop: '1px solid #f1f5f9', margin: '16px -24px -24px', padding: '16px 24px', display: 'flex', gap: '8px', background: '#f8fafc' }} onClick={e => e.stopPropagation()}>
                               <button onClick={() => setHareketModal({ open: true, stok: u })} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Hareket Girişi</button>
                            </div>
                         </div>
                      )
                   })}
                </div>
             )}
             <div style={{ marginTop: '24px' }}>
                <Pagination totalItems={filteredItems.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} />
             </div>
          </>
       )}

       {hareketModal.open && hareketModal.stok && (
         <StokHareketiModal
           isOpen={true}
           onClose={() => setHareketModal({ open: false, stok: null })}
           onSuccess={() => { fetchData() }}
           stokId={hareketModal.stok.id}
           stokAd={hareketModal.stok.ad}
           mevcutMiktar={hareketModal.stok.miktar}
           resimYolu={hareketModal.stok.resimyolu}
         />
       )}

       <ConfirmModal
         isOpen={confirmDelete.open}
         onClose={() => setConfirmDelete({ open: false, id: null })}
         onConfirm={handleDelete}
         title="Ürünü ve Geçmişini Sil"
         message="Bu işlemi geri alamazsınız. Stok kaydı ve bu ürüne bağlı tüm hareket geçmişi kalıcı olarak silinecektir."
         type="danger"
       />

       <StockCardModal 
         isOpen={!!selectedStokId} 
         onClose={() => setSelectedStokId(null)} 
         stokId={selectedStokId} 
       />
    </div>
  )
}