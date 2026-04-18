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

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: s_res } = await supabase.from('servis_karti')
      .select('id, servis_no, cari_id, arac_id, gelis_kmsi, sikayet, teknisyen, durum, odeme_durumu, giris_tarihi, toplam_tutar, arac(id, plaka, marka, model, yil), cari_kart(id, yetkili)')
      .order('giris_tarihi', { ascending: false })
      .limit(300) // Optimal limit
      
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

    // Optimistic Update
    const updated = [...servisler]
    updated[sIdx] = { ...updated[sIdx], durum: newDurum }
    setServisler(updated)

    // DB Update
    const { error } = await supabase.from('servis_karti').update({ durum: newDurum }).eq('id', activeId)
    if (error) fetchData() // Revert on error
  }

  return (
    <div className="animate-fadeIn" style={{ width: '100%', padding: '0 32px 32px' }}>
      
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Servis Yönetimi</h1>
          <p style={{ color: '#64748b', fontSize: '15px', margin: '6px 0 0', fontWeight: 500 }}>Aktif servis operasyonlarınızı iş akışından takip edin.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
            <button onClick={() => handleViewToggle('kanban')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: viewMode === 'kanban' ? '#fff' : 'transparent', color: viewMode === 'kanban' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: viewMode === 'kanban' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: '0.2s' }}>
               📋 İş Akışı
            </button>
            <button onClick={() => handleViewToggle('list')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: '0.2s' }}>
               ☰ Liste
            </button>
          </div>
          <Link href="/servis-kayitlari/yeni" className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
             + Yeni İş Emri Aç
          </Link>
        </div>
      </div>

      {/* ─── ÖZET KARTLAR ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
         <div className="card" style={{ padding: '20px', borderLeft: '4px solid #64748b' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tümü</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>{summary.toplam}</div>
         </div>
         <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>İşlemdekiler</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#3b82f6', marginTop: '6px' }}>{summary.aktif}</div>
         </div>
         <div className="card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bugün Giren</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#8b5cf6', marginTop: '6px' }}>{summary.bugun}</div>
         </div>
         <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Teslime Hazır</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#10b981', marginTop: '6px' }}>{summary.hazir}</div>
         </div>
         <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ödeme Bekleyen</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#ef4444', marginTop: '6px' }}>{summary.odemeBekleyen}</div>
         </div>
      </div>

      {viewMode === 'list' && (
         <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none' }}>
           {['Tümü', ...IS_AKISI].map(f => (
             <button key={f} onClick={() => setAktifTab(f)} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: aktifTab === f ? '#0f172a' : '#fff', color: aktifTab === f ? '#fff' : '#64748b', boxShadow: aktifTab === f ? '0 4px 12px rgba(15,23,42,0.15)' : '0 1px 3px rgba(0,0,0,0.02)', border: aktifTab === f ? 'none' : '1px solid #e2e8f0', transition: 'all 0.2s' }}>
               {f}
             </button>
           ))}
         </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}><div className="skeleton" style={{ height: '400px', borderRadius: '20px' }}></div></div>
      ) : viewMode === 'kanban' ? (
        <div style={{ overflowX: 'auto', paddingBottom: '24px' }}>
           <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
             <div style={{ display: 'flex', gap: '20px', minWidth: 'max-content' }}>
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
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '16px', alignItems: 'center', background: '#fafbfc' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <input type="text" placeholder="İş Emri No, Müşteri, Plaka ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['İş Emri No', 'Müşteri / Plaka', 'Giriş Tarihi', 'Teknisyen', 'Tutar', 'Ödeme', 'Süreç', ''].map(h => (
                    <th key={h} style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((s, idx) => {
                  const bdg = durumBadge(s.durum)
                  const odemeRenk = s.odeme_durumu === 'Ödendi' ? '#166534' : (s.odeme_durumu === 'Kısmi Ödendi' ? '#854d0e' : '#991b1b')
                  const odemeBg = s.odeme_durumu === 'Ödendi' ? '#dcfce7' : (s.odeme_durumu === 'Kısmi Ödendi' ? '#fef9c3' : '#fee2e2')

                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ fontWeight: 800, color: '#3b82f6', fontFamily: 'monospace', background: '#eff6ff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                          {s.servis_no}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{s.cari_kart?.yetkili || '—'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginTop: '2px' }}>{s.arac?.plaka || '—'}</div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                        {new Date(s.giris_tarihi).toLocaleDateString('tr-TR')}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                        {s.teknisyen || '—'}
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 900, color: '#0f172a', fontSize: '14px' }}>
                        {(s.toplam_tutar || 0).toLocaleString('tr-TR')} ₺
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                         <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 800, color: odemeRenk, background: odemeBg }}>{s.odeme_durumu || 'Ödenmedi'}</span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 800, color: bdg.color, background: bdg.background }}>{s.durum}</span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <Link href={`/servis-kayitlari/${s.id}`} style={{ padding: '8px 12px', background: '#f8fafc', color: '#3b82f6', borderRadius: '8px', fontSize: '13px', fontWeight: 800, textDecoration: 'none', border: '1px solid #e2e8f0' }}>Aç</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '16px 24px' }}>
            <Pagination totalItems={filtered.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}
    </div>
  )
}