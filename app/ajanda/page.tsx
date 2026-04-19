"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import CariSec from '../components/CariSec'

const Icons = {
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  chevronLeft: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  chevronRight: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  trash: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6L18 20a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
}

const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"]
const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]

const COLOR_MAP: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  red: '#ef4444',
  purple: '#a855f7',
  orange: '#f97316',
}

interface Randevu {
  id: number
  baslik: string
  aciklama: string
  tarih: string
  saat: string
  durum: string
  renk: string
  cari_id: number | null
  cari_kart?: { yetkili: string; tel: string }
}

export default function AjandaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0])
  const [randevular, setRandevular] = useState<Randevu[]>([])
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [form, setForm] = useState({
     baslik: '',
     aciklama: '',
     tarih: new Date().toISOString().split('T')[0],
     saat: '10:00',
     durum: 'Bekliyor',
     renk: 'blue',
     cari_id: null as number | null
  })

  // Veri Çekme
  const fetchData = useCallback(async () => {
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth() + 1
    const pM = m.toString().padStart(2, '0')
    const nextM = m === 12 ? '01' : (m + 1).toString().padStart(2, '0')
    const nextY = m === 12 ? y + 1 : y

    const cDateString = `${y}-${pM}-01`
    const nDateString = `${nextY}-${nextM}-01`

    // O ayki verileri çek
    const { data } = await supabase
       .from('ajanda')
       .select('*, cari_kart(yetkili, tel)')
       .gte('tarih', cDateString)
       .lt('tarih', nDateString)
       .order('saat', { ascending: true })

    setRandevular(data || [])
  }, [currentDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Takvim Lojik
  const y = currentDate.getFullYear()
  const m = currentDate.getMonth()
  
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  let firstDay = new Date(y, m, 1).getDay()
  if (firstDay === 0) firstDay = 7 // Pazarı sona at
  firstDay -= 1 // 0-indeksli Pzt yap
  
  const prevMonthDays = new Date(y, m, 0).getDate()

  const handlePrevMonth = () => setCurrentDate(new Date(y, m - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(y, m + 1, 1))
  const handleToday = () => {
     const today = new Date()
     setCurrentDate(today)
     setActiveDate(today.toISOString().split('T')[0])
  }

  // Fonksiyonlar
  const openModal = (dateStr: string, r?: Randevu) => {
     if (r) {
        setEditingId(r.id)
        setForm({
           baslik: r.baslik, aciklama: r.aciklama || '', tarih: r.tarih, 
           saat: r.saat || '10:00', durum: r.durum, renk: r.renk || 'blue', cari_id: r.cari_id
        })
     } else {
        setEditingId(null)
        setForm({ ...form, tarih: dateStr, baslik: '', aciklama: '', cari_id: null, durum: 'Bekliyor' })
     }
     setModalOpen(true)
  }

  const saveRandevu = async (e: React.FormEvent) => {
     e.preventDefault()
     if (editingId) {
        await supabase.from('ajanda').update(form).eq('id', editingId)
     } else {
        await supabase.from('ajanda').insert([form])
     }
     setModalOpen(false)
     fetchData()
  }

  const deleteRandevu = async (id: number) => {
     if (!confirm("Randevuyu silmek istediğinize emin misiniz?")) return
     await supabase.from('ajanda').delete().eq('id', id)
     setModalOpen(false)
     fetchData()
  }

  // Seçili tarihin listesi
  const selectedList = randevular.filter(r => r.tarih === activeDate)

  return (
    <div className="animate-fadeIn">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ajanda & Takvim</h1>
          <p className="page-subtitle">Müşteri randevuları, servis tarihleri ve iş programlaması</p>
        </div>
        <button onClick={() => openModal(activeDate)} className="btn-primary">
          {Icons.plus} Yeni Randevu
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
         
         {/* SOL: TAKVİM GRID */}
         <div className="card">
            <div className="card-header" style={{ padding: '20px 24px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0f172a', width: '160px' }}>{AYLAR[m]} {y}</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                     <button onClick={handlePrevMonth} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex' }}>{Icons.chevronLeft}</button>
                     <button onClick={handleToday} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}>Bugün</button>
                     <button onClick={handleNextMonth} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex' }}>{Icons.chevronRight}</button>
                  </div>
               </div>
            </div>
            <div className="card-body" style={{ padding: '24px' }}>
               
               {/* Gün Başlıkları */}
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px' }}>
                  {GUNLER.map(g => (
                     <div key={g} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{g}</div>
                  ))}
               </div>

               {/* Takvim Hücreleri */}
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {/* Önceki ayın günleri */}
                  {Array(firstDay).fill(null).map((_, i) => (
                     <div key={`prev-${i}`} style={{ minHeight: '100px', padding: '8px', border: '1px solid #f1f5f9', borderRadius: '12px', background: '#f8fafc', color: '#cbd5e1', fontSize: '14px', fontWeight: 600 }}>
                        {prevMonthDays - firstDay + i + 1}
                     </div>
                  ))}

                  {/* Geçerli ayın günleri */}
                  {Array(daysInMonth).fill(null).map((_, i) => {
                     const gun = i + 1
                     const gunStr = gun.toString().padStart(2, '0')
                     const ayStr = (m + 1).toString().padStart(2, '0')
                     const fullDate = `${y}-${ayStr}-${gunStr}`
                     
                     const isToday = new Date().toISOString().split('T')[0] === fullDate
                     const isSelected = activeDate === fullDate
                     
                     // Bu güne ait badge'ler
                     const dayRands = randevular.filter(r => r.tarih === fullDate)

                     return (
                        <div 
                           key={gun} 
                           onClick={() => setActiveDate(fullDate)}
                           style={{ 
                              minHeight: '100px', padding: '8px', border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0', 
                              borderRadius: '12px', cursor: 'pointer', transition: '0.15s',
                              background: isSelected ? '#eff6ff' : (isToday ? '#f0fdf4' : '#fff'),
                              boxShadow: isSelected ? '0 4px 12px rgba(59,130,246,0.1)' : 'none'
                           }}
                        >
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ 
                                 width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                 borderRadius: '50%', fontSize: '13px', fontWeight: 800,
                                 background: isToday ? '#22c55e' : (isSelected ? '#3b82f6' : 'transparent'),
                                 color: (isToday || isSelected) ? '#fff' : '#0f172a'
                              }}>
                                 {gun}
                              </span>
                              {dayRands.length > 0 && <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{dayRands.length} İş</span>}
                           </div>

                           <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {dayRands.slice(0,3).map(r => (
                                 <div key={r.id} style={{ fontSize: '10px', fontWeight: 700, padding: '4px 6px', borderRadius: '4px', background: `${COLOR_MAP[r.renk || 'blue']}15`, color: COLOR_MAP[r.renk || 'blue'], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {r.saat?.substring(0,5)} {r.baslik}
                                 </div>
                              ))}
                              {dayRands.length > 3 && <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, paddingLeft: '4px' }}>+{dayRands.length - 3} daha...</div>}
                           </div>
                        </div>
                     )
                  })}
               </div>
            </div>
         </div>

         {/* SAĞ: GÜNÜN DETAYI */}
         <div className="card" style={{ position: 'sticky', top: '24px' }}>
            <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
               <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icons.calendar}
                  {new Date(activeDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
               </h3>
               <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Seçili Günün Programı</div>
            </div>
            
            <div className="card-body" style={{ padding: 0 }}>
               {selectedList.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                     <div style={{ fontSize: '14px', fontWeight: 600 }}>Bu güne ait iş programı yok.</div>
                     <button onClick={() => openModal(activeDate)} className="btn-ghost" style={{ marginTop: '12px' }}>+ Ekle</button>
                  </div>
               ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                     {selectedList.map(r => (
                        <div key={r.id} onClick={() => openModal(r.tarih, r)} style={{ 
                           padding: '16px 24px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s', position: 'relative' 
                        }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                           <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '4px', background: COLOR_MAP[r.renk || 'blue'] }}></div>
                           
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: COLOR_MAP[r.renk || 'blue'] }}>
                                 {Icons.clock} {r.saat?.substring(0,5)}
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: r.durum === 'Geldi' ? '#dcfce7' : (r.durum === 'İptal' ? '#fee2e2' : '#f1f5f9'), color: r.durum === 'Geldi' ? '#166534' : (r.durum === 'İptal' ? '#991b1b' : '#475569') }}>
                                 {r.durum}
                              </span>
                           </div>
                           
                           <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{r.baslik}</div>
                           
                           {r.cari_kart && (
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>🏢 {r.cari_kart.yetkili} • {r.cari_kart.tel}</div>
                           )}
                           
                           {r.aciklama && (
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', padding: '8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                                 {r.aciklama}
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* ─── MODAL ─── */}
      {modalOpen && (
         <>
            <div onClick={() => setModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, animation: 'fadeIn 0.2s' }}></div>
            <div style={{ 
               position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
               background: '#fff', width: '90%', maxWidth: '500px', borderRadius: '20px', 
               boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', zIndex: 1001, animation: 'fadeIn 0.3s' 
            }}>
               <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{editingId ? 'Randevuyu Düzenle' : 'Yeni Randevu'}</h3>
                  <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer' }}>&times;</button>
               </div>
               
               <form onSubmit={saveRandevu} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                     <div style={{ flex: 1 }}>
                        <label className="form-label">Tarih <span className="required">*</span></label>
                        <input type="date" required value={form.tarih} onChange={e => setForm({...form, tarih: e.target.value})} />
                     </div>
                     <div style={{ width: '120px' }}>
                        <label className="form-label">Saat <span className="required">*</span></label>
                        <input type="time" required value={form.saat} onChange={e => setForm({...form, saat: e.target.value})} />
                     </div>
                  </div>

                  <div>
                     <label className="form-label">İş / Randevu Başlığı <span className="required">*</span></label>
                     <input type="text" required placeholder="Örn: Yağ Bakımı, Motor Kontrolü" value={form.baslik} onChange={e => setForm({...form, baslik: e.target.value})} />
                  </div>

                  <div>
                     <label className="form-label">Müşteri (Opsiyonel)</label>
                     <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px' }}>
                        <CariSec onSelect={(cari) => setForm({...form, cari_id: cari ? cari.id : null})} error="" />
                     </div>
                     <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Takvime tıklanıldığında doğrudan cariye ait bilgileri gösterir.</div>
                  </div>

                  <div>
                     <label className="form-label">Açıklama / Notlar</label>
                     <textarea rows={3} placeholder="Varsa servis notları veya hatırlatmalar..." value={form.aciklama} onChange={e => setForm({...form, aciklama: e.target.value})} />
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                     <div style={{ flex: 1 }}>
                        <label className="form-label">Durum</label>
                        <select value={form.durum} onChange={e => setForm({...form, durum: e.target.value})}>
                           <option>Bekliyor</option>
                           <option>Geldi</option>
                           <option>İptal</option>
                        </select>
                     </div>
                     <div style={{ flex: 1 }}>
                        <label className="form-label">Renk Kodu</label>
                        <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
                           {Object.entries(COLOR_MAP).map(([name, hex]) => (
                              <button key={name} type="button" onClick={() => setForm({...form, renk: name})} style={{ 
                                 width: '28px', height: '28px', borderRadius: '50%', background: hex, border: 'none', cursor: 'pointer',
                                 boxShadow: form.renk === name ? `0 0 0 3px #fff, 0 0 0 5px ${hex}` : 'none',
                                 transform: form.renk === name ? 'scale(1.1)' : 'scale(1)', transition: '0.1s'
                              }} />
                           ))}
                        </div>
                     </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
                     {editingId ? (
                        <button type="button" onClick={() => deleteRandevu(editingId)} className="btn-ghost" style={{ color: '#ef4444' }}>
                           {Icons.trash} Sil
                        </button>
                     ) : <div/>}
                     <button type="submit" className="btn-primary" style={{ padding: '12px 32px', fontSize: '15px' }}>
                        {editingId ? 'Güncelle' : 'Kaydet'}
                     </button>
                  </div>
               </form>
            </div>
         </>
      )}

    </div>
  )
}
