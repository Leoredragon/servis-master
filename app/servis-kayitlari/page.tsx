"use client"

import { supabase } from '../lib/supabase'
import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Pagination from '../components/Pagination'
import { useRouter } from 'next/navigation'
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Servis = {
  id: number; servis_no: string; cari_id: number; arac_id: number;
  gelis_kmsi: number; sikayet: string; teknisyen: string; durum: string; odeme_durumu: string;
  giris_tarihi: string; toplam_tutar: number;
  arac?: { id: number; plaka: string; marka: string; model: string; yil: string }
  cari_kart?: { id: number; yetkili: string }
}

const IS_AKISI = [
  'Araç Kabul', 'Arıza Tespiti', 'Onay Bekliyor', 'İşlemde', 'Kalite Kontrol', 'Teslime Hazır', 'Teslim Edildi'
]
const AKIS_RENKLER: Record<string, [string, string]> = {
  'Araç Kabul':     ['#374151', '#f3f4f6'],
  'Arıza Tespiti':  ['#0284c7', '#e0f2fe'],
  'Onay Bekliyor':  ['#c2410c', '#ffedd5'],
  'İşlemde':        ['#4338ca', '#e0e7ff'],
  'Kalite Kontrol': ['#7e22ce', '#f3e8ff'],
  'Teslime Hazır':  ['#15803d', '#dcfce7'],
  'Teslim Edildi':  ['#0f172a', '#e2e8f0'],
}

const durumBadge = (durum: string) => {
  const r = AKIS_RENKLER[durum] || ['#64748b', '#f1f5f9']
  return { color: r[0], background: r[1] }
}

// ─── KANBAN BİLEŞENLERİ ───
function KanbanCard({ servis }: { servis: Servis }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: servis.id,
    data: { type: 'Servis', servis }
  })
  const router = useRouter()

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: '#fff',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: isDragging ? '0 20px 25px -5px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
    cursor: 'grab',
    marginBottom: '12px',
    touchAction: 'none'
  }

  // Odeme durumu styling
  const odemeRenk = servis.odeme_durumu === 'Ödendi' ? '#166534' : (servis.odeme_durumu === 'Kısmi Ödendi' ? '#854d0e' : '#991b1b')
  const odemeBg = servis.odeme_durumu === 'Ödendi' ? '#dcfce7' : (servis.odeme_durumu === 'Kısmi Ödendi' ? '#fef9c3' : '#fee2e2')

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onDoubleClick={() => router.push(`/servis-kayitlari/${servis.id}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#4f46e5', background: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #c7d2fe' }}>
          {servis.servis_no}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
          {servis.arac?.plaka}
        </span>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{servis.arac?.marka} {servis.arac?.model}</div>
        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{servis.cari_kart?.yetkili}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f8fafc' }}>
        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>
          {new Date(servis.giris_tarihi).toLocaleDateString('tr-TR')}
        </div>
        <span style={{ fontSize: '11px', fontWeight: 800, background: odemeBg, color: odemeRenk, padding: '2px 8px', borderRadius: '4px', opacity: 0.9 }}>
          {(servis.toplam_tutar || 0).toLocaleString('tr-TR')} ₺
        </span>
      </div>
    </div>
  )
}

function KanbanColumn({ title, servisler, color }: { title: string; servisler: Servis[]; color: [string, string] }) {
  const { setNodeRef } = useSortable({ id: title })

  return (
    <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '16px', display: 'flex', flexDirection: 'column', minHeight: '600px', minWidth: '320px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: color[0] }} />
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{title}</h3>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', background: '#e2e8f0', padding: '2px 10px', borderRadius: '10px' }}>
          {servisler.length}
        </span>
      </div>

      <div ref={setNodeRef} style={{ flex: 1 }}>
        <SortableContext items={servisler.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {servisler.map(s => <KanbanCard key={s.id} servis={s} />)}
        </SortableContext>
        {servisler.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center', border: '2px dashed #cbd5e1', borderRadius: '16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
            Kayıt Yok
          </div>
        )}
      </div>
    </div>
  )
}

export default function ServisKayitlariListesi() {
  const [servisler, setServisler] = useState<Servis[]>([])
  const [loading, setLoading] = useState(true)
  const [arama, setArama] = useState('')
  const [debouncedArama, setDebouncedArama] = useState('')
  const [aktifTab, setAktifTab] = useState('Tümü')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  
  // SMS Modalı state
  const [smsModalServis, setSmsModalServis] = useState<Servis | null>(null)
  const [smsSending, setSmsSending] = useState(false)
  const [smsMessage, setSmsMessage] = useState('')
  const [smsPhone, setSmsPhone] = useState('')
  
  // Görünüm Cache (Varsayılan liste ama cache var)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')

  useEffect(() => {
    const saved = localStorage.getItem('servis_view_mode')
    if (saved === 'list' || saved === 'kanban') setViewMode(saved)
  }, [])

  const handleViewToggle = (mode: 'list'|'kanban') => {
    setViewMode(mode)
    localStorage.setItem('servis_view_mode', mode)
  }

  const [summary, setSummary] = useState({ toplam: 0, aktif: 0, bugun: 0, hazir: 0, odemeBekleyen: 0 })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: s_res } = await supabase.from('servis_karti')
      .select('id, servis_no, cari_id, arac_id, gelis_kmsi, sikayet, teknisyen, durum, odeme_durumu, giris_tarihi, toplam_tutar, arac(id, plaka, marka, model, yil), cari_kart(id, yetkili)')
      .order('giris_tarihi', { ascending: false })
      .limit(300)
      
    const list = (s_res as any) || []
    setServisler(list)

    const aktifSet = new Set(['Araç Kabul', 'Arıza Tespiti', 'Onay Bekliyor', 'İşlemde', 'Kalite Kontrol'])
    const todayStr = new Date().toISOString().split('T')[0]

    setSummary({
      toplam: list.length,
      aktif: list.filter((s:any) => aktifSet.has(s.durum)).length,
      bugun: list.filter((s:any) => s.giris_tarihi.startsWith(todayStr)).length,
      hazir: list.filter((s:any) => s.durum === 'Teslime Hazır').length,
      odemeBekleyen: list.filter((s:any) => (s.odeme_durumu === 'Ödenmedi' || s.odeme_durumu === 'Kısmi Ödendi') && s.durum === 'Tamamlandı').length
    })

    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedArama(arama) }, 300)
    return () => clearTimeout(handler)
  }, [arama])

  const filtered = useMemo(() => {
    const q = debouncedArama.toLowerCase()
    let list = servisler
    if (aktifTab !== 'Tümü') list = list.filter(s => s.durum === aktifTab)
    if (q) {
      list = list.filter(s => 
        (s.servis_no || '').toLowerCase().includes(q) ||
        (s.cari_kart?.yetkili || '').toLowerCase().includes(q) ||
        (s.arac?.plaka || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [debouncedArama, aktifTab, servisler])

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const newDurum = over.id as string

    const sIdx = servisler.findIndex(s => s.id === activeId)
    if (sIdx === -1 || servisler[sIdx].durum === newDurum) return

    const updated = [...servisler]
    updated[sIdx] = { ...updated[sIdx], durum: newDurum }
    setServisler(updated)

    const { error } = await supabase.from('servis_karti').update({ durum: newDurum }).eq('id', activeId)
    if (error) {
      fetchData()
    } else {
      if (newDurum === 'Teslime Hazır' || newDurum === 'Tamamlandı') {
        const trg = updated[sIdx]
        setSmsModalServis(trg)
        const { data: cData } = await supabase.from('cari_kart').select('cep').eq('id', trg.cari_id).single()
        setSmsPhone(cData?.cep || '')
        setSmsMessage(`Sayın ${trg.cari_kart?.yetkili}, ${trg.arac?.plaka} plakalı aracınızın servis işlemleri tamamlanmıştır. Borcunuz: ${trg.toplam_tutar || 0} TL. İyi günler dileriz.`)
      }
    }
  }

  async function handleSendSms() {
    if (!smsPhone || !smsMessage) return alert('Telefon veya mesaj eksik!')
    setSmsSending(true)
    try {
       const res = await fetch('/api/sms', {
         method: 'POST',
         body: JSON.stringify({ alici: smsPhone, mesaj: smsMessage, modulInfo: 'Servis İşlemi' })
       })
       const out = await res.json()
       if(out.success) {
         alert('SMS başarıyla gönderildi!')
         setSmsModalServis(null)
       } else {
         alert('Hata: ' + out.error)
       }
    } catch(err:any) {
       alert('Beklenmeyen Hata: ' + err.message)
    } finally {
       setSmsSending(false)
    }
  }

  return (
    <div className="animate-fadeIn" style={{ width: '100%', padding: isMobile ? '0 0 24px' : '0 32px 32px' }}>
      
      <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent: 'space-between', marginBottom: isMobile ? '20px' : '32px', flexDirection: isMobile ? 'column' : 'row', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Servis Yönetimi</h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0', fontWeight: 500 }}>Aktif servis operasyonlarını iş akışından takip edin.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
            <button onClick={() => handleViewToggle('kanban')} style={{ flex: isMobile ? 1 : 'none', padding: '10px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'kanban' ? '#fff' : 'transparent', color: viewMode === 'kanban' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: '0.2s' }}>İş Akışı</button>
            <button onClick={() => handleViewToggle('list')} style={{ flex: isMobile ? 1 : 'none', padding: '10px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: '0.2s' }}>Liste</button>
          </div>
          <Link href="/servis-kayitlari/yeni" className="btn-primary" style={{ height: '48px', justifyContent: 'center', padding: '0 20px', borderRadius: '12px', fontSize: '14px', textDecoration: 'none' }}>
             + Yeni İş Emri
          </Link>
        </div>
      </div>

      {/* ─── ÖZET KARTLAR ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: isMobile ? '10px' : '16px', marginBottom: '32px' }}>
         <div className="card" style={{ padding: isMobile ? '12px' : '20px', borderLeft: '4px solid #64748b' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tümü</div>
            <div style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{summary.toplam}</div>
         </div>
         <div className="card" style={{ padding: isMobile ? '12px' : '20px', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>İşlemde</div>
            <div style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 900, color: '#3b82f6', marginTop: '4px' }}>{summary.aktif}</div>
         </div>
         <div className="card" style={{ padding: isMobile ? '12px' : '20px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bugün</div>
            <div style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 900, color: '#8b5cf6', marginTop: '4px' }}>{summary.bugun}</div>
         </div>
         <div className="card" style={{ padding: isMobile ? '12px' : '20px', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Hazır</div>
            <div style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>{summary.hazir}</div>
         </div>
      </div>

      {viewMode === 'list' && (
         <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
           {['Tümü', ...IS_AKISI].map(f => (
             <button key={f} onClick={() => setAktifTab(f)} style={{ whiteSpace: 'nowrap', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: aktifTab === f ? '#0f172a' : '#fff', color: aktifTab === f ? '#fff' : '#64748b', border: '1px solid #e2e8f0' }}>
               {f}
             </button>
           ))}
         </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}><div className="skeleton" style={{ height: '300px', borderRadius: '20px' }}></div></div>
      ) : viewMode === 'kanban' ? (
        <div style={{ overflowX: 'auto', paddingBottom: '24px', WebkitOverflowScrolling: 'touch' }}>
           <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
             <div style={{ display: 'flex', gap: isMobile ? '12px' : '20px', minWidth: isMobile ? '100%' : 'max-content', flexDirection: isMobile ? 'column' : 'row' }}>
               {IS_AKISI.map(durum => (
                 <KanbanColumn 
                   key={durum} 
                   title={durum} 
                   servisler={servisler.filter(s => s.durum === durum)} 
                   color={AKIS_RENKLER[durum]}
                 />
               ))}
             </div>
           </DndContext>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input type="text" placeholder="No, Müşteri veya Plaka ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                   <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>İş Emri No</th>
                   <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Müşteri / Plaka</th>
                   {!isMobile && (
                     <>
                        <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Giriş Tarihi</th>
                        <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Teknisyen</th>
                        <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Tutar</th>
                     </>
                   )}
                   <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Süreç</th>
                   <th style={{ padding: '16px 20px' }}></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => {
                  const bdg = durumBadge(s.durum)
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontWeight: 800, color: '#3b82f6', fontFamily: 'monospace', background: '#eff6ff', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                           #{s.servis_no}
                        </span>
                        {isMobile && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{new Date(s.giris_tarihi).toLocaleDateString('tr-TR')}</div>}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{s.cari_kart?.yetkili || '—'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginTop: '2px' }}>{s.arac?.plaka || '—'}</div>
                      </td>
                      {!isMobile && (
                        <>
                          <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>{new Date(s.giris_tarihi).toLocaleDateString('tr-TR')}</td>
                          <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>{s.teknisyen || '—'}</td>
                          <td style={{ padding: '16px 20px', fontWeight: 900, color: '#0f172a', fontSize: '14px' }}>{(s.toplam_tutar || 0).toLocaleString('tr-TR')} ₺</td>
                        </>
                      )}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 800, color: bdg.color, background: bdg.background, whiteSpace: 'nowrap' }}>{s.durum}</span>
                        {isMobile && s.toplam_tutar > 0 && <div style={{ fontSize: '11px', fontWeight: 900, marginTop: '4px' }}>{s.toplam_tutar.toLocaleString('tr-TR')} ₺</div>}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <Link href={`/servis-kayitlari/${s.id}`} style={{ padding: '8px 12px', background: '#f8fafc', color: '#3b82f6', borderRadius: '8px', fontSize: '13px', fontWeight: 800, textDecoration: 'none', border: '1px solid #e2e8f0' }}>Aç</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '16px' }}>
            <Pagination totalItems={filtered.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
          </div>
        </div>
      )}
e} currentPage={currentPage} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
          </div>
        </div>
      )}

      {/* SMS Modalı */}
      {smsModalServis && (
         <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} className="animate-fadeIn">
            <div style={{ background: '#fff', padding: '32px', borderRadius: '24px', width: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                 </div>
                 <div>
                   <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Otomatik SMS</h3>
                   <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Araç teslim durumu güncellendi.</p>
                 </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div>
                   <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Alıcı Telefon No (Cari Kart):</label>
                   <input type="text" value={smsPhone} onChange={e=>setSmsPhone(e.target.value)} placeholder="+905551234567" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} />
                 </div>
                 <div>
                   <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Mesaj İçeriği:</label>
                   <textarea value={smsMessage} onChange={e=>setSmsMessage(e.target.value)} rows={4} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }} />
                 </div>
               </div>

               <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                 <button onClick={() => setSmsModalServis(null)} disabled={smsSending} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                 <button onClick={handleSendSms} disabled={smsSending} style={{ flex: 1, padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                   {smsSending ? 'Gönderiliyor...' : 'SMS Gönder'}
                 </button>
               </div>
            </div>
         </div>
      )}
    </div>
  )
}