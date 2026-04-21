"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import ConfirmModal from '../components/ConfirmModal'
import Pagination from '../components/Pagination'
import { useRouter } from 'next/navigation'
import CustomerCardModal from '../components/CustomerCardModal'

const Icons = {
  plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  user: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
}

export default function Musteriler() {
  const router = useRouter()
  const [musteriler, setMusteriler] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('Tümü')
  const [groups, setGroups] = useState<string[]>([])
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Modals
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: number | null }>({ open: false, id: null })
  const [cardOpen, setCardOpen] = useState(false)
  const [selectedCariId, setSelectedCariId] = useState<number | null>(null)

  // Summary Data
  const [summary, setSummary] = useState({ toplamMusteri: 0, toplamArac: 0, buAyYeni: 0, aktifServis: 0 })

  const fetchVeriler = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cari_kart')
      .select('*, arac(id), servis_karti(durum, giris_tarihi)')
      .order('id', { ascending: false })
    
    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    const mapped = (data || []).map(m => {
      const servisler = m.servis_karti || []
      const aktifS = servisler.filter((s:any) => s.durum === 'İşlemde').length
      
      let sonIslem = null
      if (servisler.length > 0) {
        sonIslem = servisler.sort((a:any, b:any) => new Date(b.giris_tarihi).getTime() - new Date(a.giris_tarihi).getTime())[0].giris_tarihi
      }

      return {
        ...m,
        aracSayisi: m.arac ? m.arac.length : 0,
        servisSayisi: servisler.length,
        aktifServisCount: aktifS,
        sonIslemTarihi: sonIslem
      }
    })

    setMusteriler(mapped)

    // Calculate Summary
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    let buAy = 0
    // Currently cari_kart doesn't have created_at usually, if it doesn't we'll just show 0 or assume id increment over time. 
    // We will estimate based on id logic or omit. We'll skip exact buAyYeni if no timestamp
    
    let tArac = 0
    let tAktif = 0
    const uniqueGroups = new Set<string>()

    mapped.forEach(m => {
      tArac += m.aracSayisi
      tAktif += m.aktifServisCount
      if (m.grup) uniqueGroups.add(m.grup)
    })

    setSummary({
      toplamMusteri: mapped.length,
      toplamArac: tArac,
      buAyYeni: 0, // Fallback
      aktifServis: tAktif
    })
    
    setGroups(Array.from(uniqueGroups).sort())
    setLoading(false)
  }, [])

  useEffect(() => { fetchVeriler() }, [fetchVeriler])

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchQuery) }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Filtering Logic
  const filteredMusteriler = useMemo(() => {
    let res = musteriler
    if (selectedGroup !== 'Tümü') res = res.filter(x => x.grup === selectedGroup)
    if (debouncedSearch) {
      const qs = debouncedSearch.toLowerCase()
      res = res.filter(x => 
        (x.yetkili || '').toLowerCase().includes(qs) || 
        (x.tel || '').toLowerCase().includes(qs) ||
        (x.cep || '').toLowerCase().includes(qs) ||
        (x.mail || '').toLowerCase().includes(qs) ||
        (x.vergi_no || '').toLowerCase().includes(qs)
      )
    }
    return res
  }, [musteriler, selectedGroup, debouncedSearch])

  const paginatedMusteriler = filteredMusteriler.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleDelete = async () => {
    if (!confirmDelete.id) return
    const { error } = await supabase.from('cari_kart').delete().eq('id', confirmDelete.id)
    if (error) alert(error.message)
    else {
      setConfirmDelete({ open: false, id: null })
      fetchVeriler()
    }
  }

  return (
    <div className="animate-fadeIn" style={{ width: '100%', padding: '0 32px' }}>
      
      {/* ─── HEADER YAPI ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
           <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>Müşteri Yönetimi</h1>
           <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Tüm müşteri, filo ve bireysel portföyünüzü yönetin.</p>
        </div>
        <button onClick={() => router.push('/musteriler/yeni')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', borderRadius: '12px' }}>
           {Icons.plus} Yeni Müşteri
        </button>
      </div>

      {/* ─── ÖZET KARTLAR ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
           <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Toplam Müşteri</div>
           <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{summary.toplamMusteri}</div>
        </div>
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
           <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Toplam Araç</div>
           <div style={{ fontSize: '28px', fontWeight: 800, color: '#3b82f6' }}>{summary.toplamArac}</div>
        </div>
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
           <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Aktif Servis (İşlemde)</div>
           <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>{summary.aktifServis}</div>
        </div>
      </div>

      {/* ─── TABLO BÖLÜMÜ ─── */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', padding: '24px' }}>
         {/* FİLTRELER */}
         <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
               <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{Icons.search}</span>
               <input placeholder="İsim, Tel, E-posta veya Vergi No ara..." style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select style={{ width: '200px', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
               <option value="Tümü">Tüm Gruplar</option>
               {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
         </div>

         {/* TABLO */}
         <div style={{ margin: '0 -24px -24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                     <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '50px' }}>#</th>
                     <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Müşteri Adı / Ünvan</th>
                     <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>İletişim Bilgileri</th>
                     <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Araçlar</th>
                     <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Toplam Servis</th>
                     <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Son İşlem</th>
                     <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>İşlemler</th>
                  </tr>
               </thead>
               <tbody>
                  {loading ? (
                     [1,2,3,4].map(i => <tr key={i}><td colSpan={7} style={{ padding: '24px' }}><div className="skeleton" style={{ height: '30px', width: '100%' }} /></td></tr>)
                  ) : paginatedMusteriler.length === 0 ? (
                     <tr><td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Müşteri kaydı bulunamadı.</td></tr>
                  ) : paginatedMusteriler.map(m => (
                     <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} className="hover-row" onClick={() => { setSelectedCariId(m.id); setCardOpen(true); }}>
                        <td style={{ padding: '16px 24px', fontWeight: 600, color: '#94a3b8', fontSize: '13px' }}>{m.id}</td>
                        <td style={{ padding: '16px 24px' }}>
                           <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{m.yetkili}</div>
                           {m.grup && <span style={{ display: 'inline-block', padding: '2px 8px', background: '#f1f5f9', color: '#64748b', fontSize: '11px', fontWeight: 700, borderRadius: '4px', marginTop: '4px' }}>{m.grup}</span>}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                           <div style={{ fontSize: '14px', color: '#334155', fontWeight: 600 }}>{m.cep || m.tel || '---'}</div>
                           {m.mail && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{m.mail}</div>}
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, color: m.aracSayisi > 0 ? '#3b82f6' : '#94a3b8', fontSize: '14px' }}>
                           {m.aracSayisi}
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '14px' }}>
                           {m.servisSayisi}
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                           {m.sonIslemTarihi ? new Date(m.sonIslemTarihi).toLocaleDateString('tr-TR') : '—'}
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                           <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button onClick={() => { setSelectedCariId(m.id); setCardOpen(true); }} style={{ padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#3b82f6', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                 {Icons.user}
                              </button>
                              <Link href={`/musteriler/yeni?id=${m.id}`} style={{ padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                 {Icons.edit}
                              </Link>
                              <button onClick={() => setConfirmDelete({ open: true, id: m.id })} style={{ padding: '8px', background: '#fef2f2', border: 'none', borderRadius: '8px', color: '#ef4444', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                 {Icons.trash}
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
      
      <div style={{ marginTop: '24px' }}>
        <Pagination totalItems={filteredMusteriler.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </div>

      <ConfirmModal 
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Müşteriyi Sil"
        message="Bu müşteriyi silmek istediğinizden emin misiniz? Müşteriye ait tüm geçmiş kayıtlar (eğer veritabanı kaskad silmeyi destekliyorsa) veri kaybına yol açabilir."
        type="danger"
        confirmText="Evet, Sil"
      />

      <CustomerCardModal 
        isOpen={cardOpen} 
        onClose={() => setCardOpen(false)} 
        cariId={selectedCariId} 
      />
    </div>
  )
}