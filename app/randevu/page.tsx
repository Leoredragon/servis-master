"use client"

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import CariSec from '../components/CariSec'

// Ä°konlar
const Icons = {
  calendar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  list:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  plus:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  chevronL: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevronR: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  trash:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  edit:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  search:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
}

const COLORS = [
  { id: 'mavi',    label: 'Mavi',    val: '#3b82f6', bg: '#eff6ff' },
  { id: 'kirmizi', label: 'KÄ±rmÄ±zÄ±', val: '#ef4444', bg: '#fef2f2' },
  { id: 'yesil',   label: 'YeÅŸil',   val: '#22c55e', bg: '#f0fdf4' },
  { id: 'sari',    label: 'SarÄ±',    val: '#eab308', bg: '#fefce8' },
  { id: 'mor',     label: 'Mor',     val: '#a855f7', bg: '#faf5ff' },
  { id: 'turuncu', label: 'Turuncu', val: '#f97316', bg: '#fff7ed' },
]

const DURUMLAR = ['Bekliyor', 'TamamlandÄ±', 'Ä°ptal']

export default function RandevuPage() {
  const [view, setView] = useState<'calendar'|'list'>('calendar')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Takvim Durumu
  const bugun = new Date()
  const [currYear, setCurrYear] = useState(bugun.getFullYear())
  const [currMonth, setCurrMonth] = useState(bugun.getMonth())

  // Form (Yeni / DÃ¼zenle)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  // GÃ¼n Detay ModalÄ± (Takvimde gÃ¼ne tÄ±klanÄ±nca)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [form, setForm] = useState({
    baslik: '', aciklama: '', tarih: '', saat: '', cari_id: '', durum: 'Bekliyor', renk: '#3b82f6'
  })

  // Silme Onay
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number|null>(null)

  // Filtreler (Liste Ä°Ã§in)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('TÃ¼mÃ¼')

  const loadData = async () => {
    setLoading(true)
    const { data: randevular } = await supabase
      .from('ajanda')
      .select('*, cari_kart(yetkili, tel)')
      .order('tarih', { ascending: true })
      .order('saat', { ascending: true })
    if (randevular) setData(randevular)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // â”€â”€â”€ YardÄ±mcÄ± Fonksiyonlar â”€â”€â”€
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const formatTarih = (y: number, m: number, d: number) => `${y}-${String(m+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const aylar = ["Ocak", "Åubat", "Mart", "Nisan", "MayÄ±s", "Haziran", "Temmuz", "AÄŸustos", "EylÃ¼l", "Ekim", "KasÄ±m", "AralÄ±k"]
  const gunler = ["Pts", "Sal", "Ã‡ar", "Per", "Cum", "Cmt", "Paz"]

  // Start Day Offset (Mon=0)
  const firstDay = new Date(currYear, currMonth, 1).getDay()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = getDaysInMonth(currYear, currMonth)
  
  const calGrid = []
  for (let i = 0; i < startOffset; i++) calGrid.push(null)
  for (let i = 1; i <= daysInMonth; i++) calGrid.push(i)
  while (calGrid.length % 7 !== 0) calGrid.push(null)

  const prevMonth = () => {
    if (currMonth === 0) { setCurrMonth(11); setCurrYear(y => y - 1) }
    else setCurrMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currMonth === 11) { setCurrMonth(0); setCurrYear(y => y + 1) }
    else setCurrMonth(m => m + 1)
  }
  const goToday = () => {
    setCurrYear(bugun.getFullYear())
    setCurrMonth(bugun.getMonth())
  }

  // â”€â”€â”€ Ä°statistikler â”€â”€â”€
  const bugununTarihi = formatTarih(bugun.getFullYear(), bugun.getMonth(), bugun.getDate())
  
  // Bu hafta hesaplama (Pzt-Paz)
  const dayOfWeek = bugun.getDay() === 0 ? 6 : bugun.getDay() - 1 // 0=Mon, 6=Sun
  const startOfWeek = new Date(bugun)
  startOfWeek.setDate(bugun.getDate() - dayOfWeek)
  const startStr = formatTarih(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate())
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  const endStr = formatTarih(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate())

  const stats = {
    bugun: data.filter(d => d.tarih === bugununTarihi).length,
    buHafta: data.filter(d => d.tarih >= startStr && d.tarih <= endStr).length,
    bekleyen: data.filter(d => d.durum === 'Bekliyor').length,
    tamamlanan: data.filter(d => d.durum === 'TamamlandÄ±').length,
  }

  // â”€â”€â”€ Form Ä°ÅŸlemleri â”€â”€â”€
  const openNew = () => {
    setForm({ baslik: '', aciklama: '', tarih: bugununTarihi, saat: '09:00', cari_id: '', durum: 'Bekliyor', renk: '#3b82f6' })
    setEditingItem(null)
    setIsModalOpen(true)
  }
  const openEdit = (item: any) => {
    setForm({
      baslik: item.baslik || '',
      aciklama: item.aciklama || '',
      tarih: item.tarih || bugununTarihi,
      saat: item.saat || '09:00',
      cari_id: item.cari_id ? String(item.cari_id) : '',
      durum: item.durum || 'Bekliyor',
      renk: item.renk || '#3b82f6'
    })
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form, 
      cari_id: form.cari_id ? parseInt(form.cari_id) : null,
      kullaniciadi: (await supabase.auth.getUser()).data.user?.email || 'admin',
      subeadi: 'Merkez'
    }

    if (editingItem) {
      await supabase.from('ajanda').update(payload).eq('id', editingItem.id)
    } else {
      await supabase.from('ajanda').insert([payload])
    }
    setIsModalOpen(false)
    loadData()
  }

  const handleDelete = async () => {
    if (deletingId) {
      await supabase.from('ajanda').delete().eq('id', deletingId)
      setIsDeleteOpen(false)
      setIsModalOpen(false) // form kapanmalÄ± ki bug oluÅŸmasÄ±n
      setEditingItem(null)
      loadData()
    }
  }

  // â”€â”€â”€ Liste Filtreleme (useMemo + debounced-like search) â”€â”€â”€
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (statusFilter !== 'TÃ¼mÃ¼' && item.durum !== statusFilter) return false
      if (search) {
        const s = search.toLowerCase()
        const bas = (item.baslik || '').toLowerCase()
        const mus = (item.cari_kart?.yetkili || '').toLowerCase()
        if (!bas.includes(s) && !mus.includes(s)) return false
      }
      return true
    })
  }, [data, search, statusFilter])


  // â”€â”€â”€ Render â”€â”€â”€
  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER & TOGGLES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Randevu & Ajanda</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', fontWeight: 500 }}>PlanlamalarÄ±nÄ±zÄ± takip edin ve yÃ¶netin.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <div style={{ background: '#e2e8f0', padding: '4px', borderRadius: '10px', display: 'flex' }}>
            <button
              onClick={() => setView('calendar')}
              style={{
                background: view === 'calendar' ? '#fff' : 'transparent',
                color: view === 'calendar' ? '#0f172a' : '#64748b',
                boxShadow: view === 'calendar' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              {Icons.calendar} Takvim
            </button>
            <button
              onClick={() => setView('list')}
              style={{
                background: view === 'list' ? '#fff' : 'transparent',
                color: view === 'list' ? '#0f172a' : '#64748b',
                boxShadow: view === 'list' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              {Icons.list} Liste
            </button>
          </div>

          <button onClick={openNew} style={{
            background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px',
            borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
          }}>
            {Icons.plus} Yeni Randevu
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <StatCard title="BugÃ¼nkÃ¼" val={stats.bugun} col="#3b82f6" />
        <StatCard title="Bu Hafta" val={stats.buHafta} col="#a855f7" />
        <StatCard title="Bekleyen" val={stats.bekleyen} col="#eab308" />
        <StatCard title="Tamamlanan" val={stats.tamamlanan} col="#22c55e" />
      </div>

      {/* MAIN CONTAINER */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {view === 'calendar' ? (
          // TAKVÄ°M GÃ–RÃœNÃœMÃœ
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
               <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>{aylar[currMonth]} {currYear}</h2>
               <div style={{ display: 'flex', gap: '8px' }}>
                 <button onClick={goToday} style={{ border: '1px solid #e2e8f0', background: '#fff', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', color: '#475569' }}>BugÃ¼n</button>
                 <div style={{ display: 'flex', gap: '4px' }}>
                   <button onClick={prevMonth} style={{ border: '1px solid #e2e8f0', background: '#fff', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>{Icons.chevronL}</button>
                   <button onClick={nextMonth} style={{ border: '1px solid #e2e8f0', background: '#fff', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>{Icons.chevronR}</button>
                 </div>
               </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
              {gunler.map(g => (
                <div key={g} style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#64748b' }}>{g}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f1f5f9', gap: '1px' }}>
              {calGrid.map((day, ix) => {
                const dateStr = day ? formatTarih(currYear, currMonth, day) : ''
                const dayItems = dateStr ? data.filter(d => d.tarih === dateStr) : []
                const isToday = dateStr === bugununTarihi

                return (
                  <div key={ix} 
                       onClick={() => { if(dateStr) setSelectedDate(dateStr) }}
                       style={{ 
                         background: day ? '#fff' : '#f8fafc', 
                         minHeight: '120px', padding: '8px',
                         cursor: day ? 'pointer' : 'default',
                         position: 'relative'
                       }}>
                    {day && (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ 
                           width: '24px', height: '24px', borderRadius: '50%', 
                           background: isToday ? '#3b82f6' : 'transparent', 
                           color: isToday ? '#fff' : '#475569',
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           fontWeight: isToday ? 800 : 700, fontSize: '13px',
                           marginBottom: '8px'
                        }}>
                          {day}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          {dayItems.slice(0, 3).map((item, idxx) => (
                            <div key={idxx} 
                                 onClick={(e) => { e.stopPropagation(); openEdit(item) }}
                                 style={{ 
                                    background: COLORS.find(c => c.val === item.renk)?.bg || '#eff6ff', 
                                    borderLeft: `3px solid ${item.renk || '#3b82f6'}`,
                                    padding: '4px 6px', borderRadius: '4px', fontSize: '11px', 
                                    fontWeight: 600, color: '#0f172a',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    transition: 'transform 0.1s'
                                 }}
                                 onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                 onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              {item.saat} - {item.baslik}
                            </div>
                          ))}
                          {dayItems.length > 3 && (
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textAlign: 'center', marginTop: 'auto', background: '#f1f5f9', padding: '2px', borderRadius: '4px' }}>
                              +{dayItems.length - 3} Randevu
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          // LÄ°STE GÃ–RÃœNÃœMÃœ
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', background: '#fafbfc' }}>
               <div style={{ position: 'relative', width: '280px' }}>
                 <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}>{Icons.search}</span>
                 <input 
                   placeholder="BaÅŸlÄ±k veya mÃ¼ÅŸteri ara..." 
                   value={search} onChange={e => setSearch(e.target.value)}
                   style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '13px' }}
                 />
               </div>
               <select 
                 value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                 style={{ padding: '10px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '13px', background: '#fff', cursor: 'pointer' }}
               >
                 <option value="TÃ¼mÃ¼">TÃ¼m Durumlar</option>
                 <option value="Bekliyor">Bekliyor</option>
                 <option value="TamamlandÄ±">TamamlandÄ±</option>
                 <option value="Ä°ptal">Ä°ptal</option>
               </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tarih / Saat</th>
                      <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>BaÅŸlÄ±k & AÃ§Ä±klama</th>
                      <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MÃ¼ÅŸteri</th>
                      <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Durum</th>
                      <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Ä°ÅŸlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Randevu bulunamadÄ±.</td></tr>
                    ) : filteredData.map(item => {
                      const bg = item.durum === 'Bekliyor' ? '#eab308' : item.durum === 'TamamlandÄ±' ? '#22c55e' : '#ef4444'
                      const isPast = item.tarih < bugununTarihi
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: isPast && item.durum !== 'TamamlandÄ±' ? 0.6 : 1, transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px 24px' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.renk, flexShrink: 0 }} />
                               <div>
                                 <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{new Date(item.tarih).toLocaleDateString('tr-TR')}</div>
                                 <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{item.saat}</div>
                               </div>
                             </div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                             <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{item.baslik}</div>
                             <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.aciklama || '-'}</div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                             {item.cari_kart ? (
                               <>
                                 <div style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6', cursor: 'pointer' }} onClick={() => window.location.href=`/musteriler/${item.cari_id}`}>{item.cari_kart.yetkili}</div>
                                 <div style={{ fontSize: '11px', color: '#64748b' }}>{item.cari_kart.tel}</div>
                               </>
                             ) : <span style={{ fontSize: '13px', color: '#94a3b8' }}>Belirtilmedi</span>}
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{ background: `${bg}15`, color: bg, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>{item.durum}</span>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <button onClick={() => openEdit(item)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>Ä°ncele</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </div>

      {/* â”€â”€â”€ YENÄ° / DÃœZENLE MODALI â”€â”€â”€ */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Randevu DetayÄ±" : "Yeni Randevu OluÅŸtur"} size="md">
        <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>BaÅŸlÄ±k *</label>
              <input required value={form.baslik} onChange={e => setForm({...form, baslik: e.target.value})} style={{ width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none' }} placeholder="Ã–rn: YÄ±llÄ±k BakÄ±m GÃ¶rÃ¼ÅŸmesi" />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>MÃ¼ÅŸteri (Ä°steÄŸe BaÄŸlÄ±)</label>
              <CariSec value={form.cari_id} onChange={id => setForm({...form, cari_id: id})} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Tarih *</label>
              <input type="date" required value={form.tarih} onChange={e => setForm({...form, tarih: e.target.value})} style={{ width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', color: '#0f172a' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Saat *</label>
              <input type="time" required value={form.saat} onChange={e => setForm({...form, saat: e.target.value})} style={{ width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', color: '#0f172a' }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>AÃ§Ä±klama / Notlar</label>
              <textarea value={form.aciklama} onChange={e => setForm({...form, aciklama: e.target.value})} rows={3} style={{ width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', resize: 'vertical' }} placeholder="Ekstra bilgileri buraya yazabilirsiniz..." />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block' }}>Durum</label>
              <select value={form.durum} onChange={e => setForm({...form, durum: e.target.value})} style={{ padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: '#fff' }}>
                 {DURUMLAR.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block' }}>Etiket Rengi</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '43px' }}>
                {COLORS.map(c => (
                  <button key={c.id} type="button" onClick={() => setForm({...form, renk: c.val})} style={{
                    width: '24px', height: '24px', borderRadius: '50%', background: c.val, border: 'none', cursor: 'pointer',
                    boxShadow: form.renk === c.val ? `0 0 0 3px #fff, 0 0 0 5px ${c.val}` : 'none',
                    transition: 'all 0.15s'
                  }} title={c.label} />
                ))}
              </div>
            </div>
          </div>

          {editingItem && editingItem.cari_id && (
            <div style={{ padding: '12px 16px', background: '#eff6ff', borderRadius: '10px', border: '1px dashed #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>Tarihi geldiÄŸinde hÄ±zlÄ±ca iÅŸleme alabilirsiniz.</div>
              <button type="button" onClick={() => window.location.href=`/servis-kayitlari/yeni?cari_id=${editingItem.cari_id}`} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>Servis AÃ§</button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
             {editingItem ? (
               <button type="button" onClick={() => { setDeletingId(editingItem.id); setIsDeleteOpen(true); }} style={{ color: '#ef4444', background: '#fef2f2', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 {Icons.trash} Sil
               </button>
             ) : <div/>}
             <div style={{ display: 'flex', gap: '10px' }}>
               <button type="button" onClick={() => setIsModalOpen(false)} style={{ color: '#475569', background: '#f1f5f9', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Ä°ptal</button>
               <button type="submit" disabled={!form.baslik || !form.tarih || !form.saat} style={{ color: '#fff', background: '#3b82f6', border: 'none', padding: '10px 30px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: (!form.baslik || !form.tarih || !form.saat) ? 'not-allowed' : 'pointer', opacity: (!form.baslik || !form.tarih || !form.saat) ? 0.6 : 1 }}>Kaydet</button>
             </div>
          </div>
        </form>
      </Modal>

      {/* â”€â”€â”€ GÃœN DETAY MODALI (Sadece Liste gÃ¶steren mini popup gibi) â”€â”€â”€ */}
      <Modal isOpen={!!selectedDate} onClose={() => setSelectedDate(null)} title={`${selectedDate ? new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} RandevularÄ±`} size="md">
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fafbfc' }}>
          {selectedDate && data.filter(d => d.tarih === selectedDate).length === 0 && (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Bu gÃ¼ne ait randevu yok.</div>
          )}
          {selectedDate && data.filter(d => d.tarih === selectedDate).map((item, idx) => (
            <div key={item.id || idx} style={{ background: '#fff', border: '1px solid #f1f5f9', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ width: '4px', height: '40px', borderRadius: '4px', background: item.renk }} />
                 <div>
                   <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{item.saat} - {item.baslik}</div>
                   <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.cari_kart?.yetkili || 'Bilinmiyor'}</div>
                 </div>
               </div>
               <button onClick={() => { setSelectedDate(null); openEdit(item); }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#3b82f6', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Ä°ncele</button>
            </div>
          ))}
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button onClick={() => { setForm({...form, tarih: selectedDate!, saat: '09:00', baslik: ''}); setEditingItem(null); setSelectedDate(null); setIsModalOpen(true); }} style={{ color: '#3b82f6', background: 'transparent', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>+ Bu GÃ¼ne Randevu Ekle</button>
          </div>
        </div>
      </Modal>

      {/* â”€â”€â”€ SÄ°L ONAY MODALI â”€â”€â”€ */}
      <ConfirmModal 
        isOpen={isDeleteOpen}
        title="Randevuyu Sil"
        message="Bu randevuyu silmek istediÄŸinize emin misiniz? Bu iÅŸlem geri alÄ±namaz."
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />

    </div>
  )
}

function StatCard({ title, val, col }: { title: string, val: number, col: string }) {
  return (
    <div className="card" style={{ padding: '20px', borderLeft: `4px solid ${col}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>{title}</div>
        <div style={{ background: `${col}15`, width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: col }}>
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 4h-2V3a1 1 0 00-2 0v1H9V3a1 1 0 00-2 0v1H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10z"/></svg>
        </div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '8px 0 0' }}>{val}</div>
    </div>
  )
}
