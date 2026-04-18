"use client"

import { supabase } from '../lib/supabase'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import CariSec from '../components/CariSec'
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Servis = {
  id: number; servis_no: string; cari_id: number; arac_id: number;
  gelis_kmsi: number; sikayet: string; teknisyen: string; durum: string;
  giris_tarihi: string; toplam_tutar: number;
  arac?: { id: number; plaka: string; marka: string; model: string; yil: string }
  cari_kart?: { id: number; yetkili: string }
}
type Musteri = { id: number; yetkili: string }
type Arac    = { id: number; plaka: string; marka: string; model: string; yil: string; cari_id: number }

const IS_AKISI = [
  'Araç Kabul', 'Arıza Tespiti', 'Onay Bekliyor', 'İşlemde', 'Kalite Kontrol', 'Teslime Hazır'
]
const AKIS_RENKLER: Record<string, [string, string]> = {
  'Araç Kabul':     ['#374151', '#f3f4f6'],
  'Arıza Tespiti':  ['#92400e', '#fef3c7'],
  'Onay Bekliyor':  ['#b45309', '#fff7ed'],
  'İşlemde':        ['#1d4ed8', '#eff6ff'],
  'Kalite Kontrol': ['#7c3aed', '#f5f3ff'],
  'Teslime Hazır':  ['#059669', '#ecfdf5'],
}

const durumBadge = (durum: string) => {
  const r = AKIS_RENKLER[durum] || ['#64748b', '#f1f5f9']
  return { color: r[0], background: r[1] }
}

// ─── KANBAN BİLEŞENLERİ ───

function KanbanCard({ servis }: { servis: Servis }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: servis.id,
    data: { type: 'Servis', servis }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: '#fff',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    boxShadow: isDragging ? '0 20px 25px -5px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
    cursor: 'grab',
    marginBottom: '12px',
    touchAction: 'none' // Tabletlerde scroll ile çakışmaması için kritik
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
          #{servis.servis_no}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
          {servis.arac?.plaka}
        </span>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
          {servis.arac?.marka} {servis.arac?.model}
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
          {servis.cari_kart?.yetkili}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#64748b' }}>
            {servis.teknisyen ? servis.teknisyen[0].toUpperCase() : '?'}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
            {servis.teknisyen || 'Atanmadı'}
          </span>
        </div>
        <Link 
          href={`/servis-kayitlari/${servis.id}`} 
          onPointerDown={e => e.stopPropagation()} // Drag ile Link tıklamasını ayır
          style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textDecoration: 'none' }}
        >
          Detay →
        </Link>
      </div>
    </div>
  )
}

function KanbanColumn({ title, servisler, color }: { title: string; servisler: Servis[]; color: [string, string] }) {
  const { setNodeRef } = useSortable({
    id: title, // Kolonun ID'si durum adı olacak
  })

  return (
    <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '16px', display: 'flex', flexDirection: 'column', minHeight: '500px', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color[0] }} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>{title}</h3>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', background: '#fff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
          {servisler.length}
        </span>
      </div>

      <div ref={setNodeRef} style={{ flex: 1 }}>
        <SortableContext items={servisler.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {servisler.map(s => (
            <KanbanCard key={s.id} servis={s} />
          ))}
        </SortableContext>
        {servisler.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: '16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
             Araç Bulunmuyor
          </div>
        )}
      </div>
    </div>
  )
}

export default function ServisKayitlari() {
  const [servisler,  setServisler]  = useState<Servis[]>([])
  const [filtered,   setFiltered]   = useState<Servis[]>([])
  const [loading,    setLoading]    = useState(true)
  const [arama,      setArama]      = useState('')
  const [aktifTab,   setAktifTab]   = useState('Tümü')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize,   setPageSize]   = useState(20)
  const [viewMode,   setViewMode]   = useState<'list' | 'kanban'>('list')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200, // Tabletlerde kaydırma ile çakışmaması için
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const [musteriler, setMusteriler] = useState<Musteri[]>([])
  const [tumAraclar, setTumAraclar] = useState<Arac[]>([])
  const [seciliAraclar, setSeciliAraclar] = useState<Arac[]>([])
  const [modalAcik,  setModalAcik]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [toast,      setToast]      = useState<{msg: string, type: 'success'|'error'}|null>(null)

  const [form, setForm] = useState({
    cari_id: '', arac_id: '', gelis_kmsi: '', sikayet: '', teknisyen: '', durum: 'Araç Kabul'
  })

  const showToast = (msg: string, type: 'success'|'error' = 'success') => { setToast({msg, type}); setTimeout(() => setToast(null), 3000) }

  const fetchData = async () => {
    setLoading(true)
    const [s_res, m_res, a_res] = await Promise.all([
      supabase.from('servis_karti').select('*, arac(*), cari_kart(*)').order('giris_tarihi', { ascending: false }),
      supabase.from('cari_kart').select('id, yetkili').order('yetkili'),
      supabase.from('arac').select('*')
    ])
    setServisler(s_res.data || [])
    setFiltered(s_res.data || [])
    setMusteriler(m_res.data || [])
    setTumAraclar(a_res.data || [])
    setLoading(false)
  }

  useEffect(() => { 
    fetchData()
    const savedView = localStorage.getItem('servis_view_mode') as 'list' | 'kanban'
    if (savedView) setViewMode(savedView)
  }, [])

  const handleViewToggle = (mode: 'list' | 'kanban') => {
    setViewMode(mode)
    localStorage.setItem('servis_view_mode', mode)
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const newDurum = over.id as string

    // Aynı kolona bırakıldıysa işlem yapma
    const sIdx = servisler.findIndex(s => s.id === activeId)
    if (sIdx === -1 || servisler[sIdx].durum === newDurum) return

    // Optimistic Update
    const updated = [...servisler]
    updated[sIdx] = { ...updated[sIdx], durum: newDurum }
    setServisler(updated)

    // DB Sync
    const { error } = await supabase
      .from('servis_karti')
      .update({ durum: newDurum })
      .eq('id', activeId)
    
    if (error) {
      showToast('Hata: Durum güncellenemedi', 'error')
      fetchData() // Hata durumunda veriyi geri çek
    } else {
      showToast(`${updated[sIdx].servis_no} durumu güncellendi`)
    }
  }

  useEffect(() => {
    const q = arama.toLowerCase()
    let list = servisler
    if (aktifTab !== 'Tümü') list = list.filter(s => s.durum === aktifTab)
    if (q) {
      list = list.filter(s => 
        (s.servis_no || '').toLowerCase().includes(q) ||
        (s.cari_kart?.yetkili || '').toLowerCase().includes(q) ||
        (s.arac?.plaka || '').toLowerCase().includes(q)
      )
    }
    setFiltered(list)
    setCurrentPage(1)
  }, [arama, aktifTab, servisler])

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleYeniKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cari_id || !form.arac_id) { showToast('Müşteri ve Araç seçimi zorunludur', 'error'); return }
    setSaving(true)
    const { data, error } = await supabase.from('servis_karti').insert([{
      cari_id: parseInt(form.cari_id),
      arac_id: parseInt(form.arac_id),
      gelis_kmsi: parseInt(form.gelis_kmsi) || 0,
      sikayet: form.sikayet,
      teknisyen: form.teknisyen,
      durum: form.durum,
      servis_no: 'SRV-' + Math.floor(1000 + Math.random() * 9000)
    }]).select().single()
    setSaving(false)
    if (error) { showToast('Hata: ' + error.message, 'error'); return }
    setModalAcik(false)
    showToast('Yeni servis kaydı açıldı')
    await fetchData()
  }

  return (
    <div style={{ width: '100%', padding: '0 32px', display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '32px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, background: toast.type==='error'?'#ef4444':'#10b981', color: '#fff', padding: '14px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', animation: 'modalSlideIn 0.2s ease-out' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Servis Kayıtları</h1>
          <p style={{ color: '#64748b', fontSize: '15px', margin: '4px 0 0', fontWeight: 500 }}>Aktif ve geçmiş servis operasyonlarını yönetin</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', marginRight: '8px' }}>
            <button 
              onClick={() => handleViewToggle('list')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: '0.2s' }}
            >
              ☰ Liste
            </button>
            <button 
              onClick={() => handleViewToggle('kanban')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'kanban' ? '#fff' : 'transparent', color: viewMode === 'kanban' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: viewMode === 'kanban' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: '0.2s' }}
            >
              📋 Kanban
            </button>
          </div>
          <button onClick={() => setModalAcik(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#3b82f6', color: '#fff', padding: '14px 24px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
            + Yeni Servis Girişi
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        {['Tümü', ...IS_AKISI].map(f => (
          <button key={f} onClick={() => setAktifTab(f)} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: aktifTab === f ? '#0f172a' : '#fff', color: aktifTab === f ? '#fff' : '#64748b', boxShadow: aktifTab === f ? '0 4px 12px rgba(15,23,42,0.15)' : '0 1px 3px rgba(0,0,0,0.02)', border: aktifTab === f ? 'none' : '1px solid #e2e8f0', transition: 'all 0.2s' }}>
            {f}
          </button>
        ))}
      </div>

      {viewMode === 'list' ? (
        <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '16px', alignItems: 'center', background: '#fafbfc' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <input type="text" placeholder="İş Emri No, Müşteri, Plaka ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ width: '100%', padding: '11px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
            </div>
            <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#64748b', fontWeight: 600 }}>{filtered.length} İş Emri</span>
          </div>

          {loading ? (
            <div style={{ padding: '80px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>Yükleniyor...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['İş Emri No', 'Müşteri / Plaka', 'Giriş Tarihi', 'Atanan Teknisyen', 'Durum', 'Tutar', ''].map(h => (
                      <th key={h} style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s, idx) => {
                    const bdg = durumBadge(s.durum)
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx%2===0?'#fff':'#fafbfc' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ fontWeight: 800, color: '#3b82f6', fontFamily: 'monospace', background: '#eff6ff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>{s.servis_no}</span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{s.cari_kart?.yetkili || '—'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>{s.arac?.plaka || '—'}</div>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '14px' }}>{new Date(s.giris_tarihi).toLocaleDateString('tr-TR')}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600 }}>{s.teknisyen || 'Atanmadı'}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, color: bdg.color, background: bdg.background }}>{s.durum}</span>
                        </td>
                        <td style={{ padding: '16px 24px', fontWeight: 800 }}>{(s.toplam_tutar || 0).toLocaleString('tr-TR')} ₺</td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <Link href={`/servis-kayitlari/${s.id}`} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#0f172a', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>Detay →</Link>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '64px', textAlign: 'center', color: '#64748b' }}>Kayıt bulunamadı</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <Pagination 
            totalItems={filtered.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${IS_AKISI.length}, minmax(320px, 1fr))`, gap: '20px', overflowX: 'auto', paddingBottom: '20px', minHeight: '600px' }}>
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
      )}

      <Modal isOpen={modalAcik} onClose={() => setModalAcik(false)} title="Yeni Servis Kaydı" subtitle="Araç giriş işlemini başlatın" size="lg">
        <form onSubmit={handleYeniKaydet}>
          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Müşteri *</label>
              <CariSec 
                value={form.cari_id} 
                onChange={id => {
                  setForm({ ...form, cari_id: id, arac_id: '' })
                  setSeciliAraclar(tumAraclar.filter(a => a.cari_id === parseInt(id)))
                }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Araç *</label>
              <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} value={form.arac_id} onChange={e => setForm({ ...form, arac_id: e.target.value })} disabled={!form.cari_id}>
                <option value="">Araç Seçin</option>
                {seciliAraclar.map(a => <option key={a.id} value={a.id}>{a.plaka} - {a.marka} {a.model}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Şikayet / Talep</label>
              <textarea style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px' }} value={form.sikayet} onChange={e => setForm({ ...form, sikayet: e.target.value })} />
            </div>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', background: '#fafbfc' }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700 }}>{saving ? 'Kaydediliyor...' : 'Kaydı Oluştur'}</button>
            <button type="button" onClick={() => setModalAcik(false)} style={{ padding: '12px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>İptal</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}