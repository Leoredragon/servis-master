"use client"

import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import SlideOver from '../components/SlideOver'
import ConfirmModal from '../components/ConfirmModal'
import Pagination from '../components/Pagination'

const KATEGORILER = ['Kira', 'MaaÅŸ', 'YakÄ±t', 'Yemek', 'Yedek ParÃ§a', 'Fatura', 'Vergi', 'DiÄŸer']
const HESAPLAR = ['Nakit Kasa', 'Banka', 'Kredi KartÄ±']

const inputStyle = { width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' as const }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }

export default function GelirGider() {
  const [hareketler, setHareketler] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [panel, setPanel] = useState<{ open: boolean, tur: 'gelir' | 'gider' }>({ open: false, tur: 'gelir' })
  const [kasalar, setKasalar] = useState<any[]>([])
  const [form, setForm] = useState({
    tutar: '', kategori: 'DiÄŸer', kasa_id: '', aciklama: '', islem_tarihi: new Date().toISOString().split('T')[0]
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmData, setConfirmData] = useState<{ open: boolean, item: any }>({ open: false, item: null })
  const [saving, setSaving] = useState(false)
  
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('kasa_hareket')
      .select('*, kasalar(kasa_adi)')
      .gte('islem_tarihi', dateRange.start)
      .lte('islem_tarihi', dateRange.end)
      .order('islem_tarihi', { ascending: false })
      .order('id', { ascending: false })
    
    if (error) console.error(error)
    setHareketler(data || [])

    const { data: kData } = await supabase.from('kasalar').select('*').eq('aktif_mi', true)
    setKasalar(kData || [])
    setLoading(false)
    setCurrentPage(1)
  }

  useEffect(() => { fetchData() }, [dateRange])

  const handleEkle = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const payload = {
      tur: panel.tur,
      tutar: parseFloat(form.tutar),
      kategori: form.kategori,
      kasa_id: form.kasa_id || null,
      aciklama: form.aciklama,
      islem_tarihi: form.islem_tarihi
    }

    const { error } = editingId 
      ? await supabase.from('kasa_hareket').update(payload).eq('id', editingId)
      : await supabase.from('kasa_hareket').insert([{
          ...payload,
          kullaniciadi: (await supabase.auth.getUser()).data.user?.email || 'admin', // TODO: Oturum bilgisinden dinamik alÄ±nacak
          subeadi:      'Merkez', // TODO: KullanÄ±cÄ± ÅŸubesinden dinamik alÄ±nacak
        }])
    
    setSaving(false)
    if (error) { alert('Hata: ' + error.message); return }
    
    setPanel({ ...panel, open: false })
    setEditingId(null)
    setForm({ tutar: '', kategori: 'DiÄŸer', kasa_id: kasalar[0]?.id || '', aciklama: '', islem_tarihi: new Date().toISOString().split('T')[0] })
    fetchData()
  }

  const handleSil = async (item: any) => {
    const { error } = await supabase.from('kasa_hareket').delete().eq('id', item.id)
    if (error) { alert('Hata: ' + error.message) }
    else { fetchData() }
  }

  const handleDuzenle = (item: any) => {
    setEditingId(item.id)
    setForm({
      tutar: item.tutar.toString(),
      kategori: item.kategori,
      kasa_id: item.kasa_id || '',
      aciklama: item.aciklama || '',
      islem_tarihi: item.islem_tarihi
    })
    setPanel({ open: true, tur: item.tur })
  }

  const gelirToplami = hareketler.filter(h => h.tur === 'gelir').reduce((s, h) => s + (h.tutar || 0), 0)
  const giderToplami = hareketler.filter(h => h.tur === 'gider').reduce((s, h) => s + (h.tutar || 0), 0)
  const netKasa = gelirToplami - giderToplami

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Gelir & Gider YÃ¶netimi</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', fontWeight: 500 }}>Ä°ÅŸletmenizin nakit akÄ±ÅŸÄ±nÄ± ve harcamalarÄ±nÄ± takip edin</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => { setPanel({ open: true, tur: 'gelir' }); setForm({ ...form, kategori: 'Servis KazancÄ±' })}}
            style={{ 
              padding: '12px 24px', background: '#10b981', color: '#fff', border: 'none', 
              borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: '8px' 
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 0 }}>+</span> Gelir GiriÅŸi
          </button>
          <button 
            onClick={() => { setPanel({ open: true, tur: 'gider' }); setForm({ ...form, kategori: 'Gider' })}}
            style={{ 
              padding: '12px 24px', background: '#ef4444', color: '#fff', border: 'none', 
              borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', gap: '8px' 
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 0 }}>-</span> Gider Ã‡Ä±kÄ±ÅŸÄ±
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        {[
          { label: 'TOPLAM GELÄ°R', value: gelirToplami.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' â‚º', color: '#10b981', bg: '#ecfdf5', icon: 'â†‘' },
          { label: 'TOPLAM GÄ°DER', value: giderToplami.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' â‚º', color: '#ef4444', bg: '#fef2f2', icon: 'â†“' },
          { label: 'NET KASA',     value: netKasa.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' â‚º', color: 'var(--primary)', bg: 'var(--primary-light)', icon: 'ğŸ’°' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '20px', top: '20px', fontSize: '24px', opacity: 0.2 }}>{stat.icon}</div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '1.2px' }}>{stat.label}</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: stat.color, marginTop: '12px', letterSpacing: '-1px' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Date Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#fff', padding: '16px 24px', borderRadius: '24px', border: '1px solid #f1f5f9', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#f8fafc', padding: '8px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '2px' }}>BAÅLANGIÃ‡</span>
              <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} style={{ border: 'none', background: 'transparent', fontSize: '14px', fontWeight: 700, color: '#0f172a', outline: 'none' }} />
            </div>
            <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '2px' }}>BÄ°TÄ°Å</span>
              <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} style={{ border: 'none', background: 'transparent', fontSize: '14px', fontWeight: 700, color: '#0f172a', outline: 'none' }} />
            </div>
          </div>
          <button 
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700"
            style={{ padding: '12px 24px', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}
          >
            SÃ¼zgeÃ§ten GeÃ§ir
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Son Hareketler</h2>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{hareketler.length} kayÄ±t listeleniyor</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Tarih', 'TÃ¼r', 'Kategori', 'AÃ§Ä±klama', 'Hesap / Kasa', 'Tutar', 'Ä°ÅŸlemler'].map(h => (
                  <th key={h} style={{ padding: '16px 24px', textAlign: h === 'Tutar' || h === 'Ä°ÅŸlemler' ? 'right' : 'left', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    <td style={{ padding: '18px 24px' }}><div className="skeleton" style={{ height: '18px', width: '80%' }} /></td>
                    <td style={{ padding: '18px 24px' }}><div className="skeleton" style={{ height: '36px', width: '36px', borderRadius: '10px' }} /></td>
                    <td style={{ padding: '18px 24px' }}><div className="skeleton" style={{ height: '18px', width: '100px' }} /></td>
                    <td style={{ padding: '18px 24px' }}><div className="skeleton" style={{ height: '18px', width: '200px' }} /></td>
                    <td style={{ padding: '18px 24px' }}><div className="skeleton" style={{ height: '24px', width: '100px', borderRadius: '8px' }} /></td>
                    <td style={{ padding: '18px 24px', textAlign: 'right' }}><div className="skeleton" style={{ height: '22px', width: '100px', marginLeft: 'auto' }} /></td>
                    <td style={{ padding: '18px 24px', textAlign: 'right' }}><div className="skeleton" style={{ height: '32px', width: '80px', marginLeft: 'auto' }} /></td>
                  </tr>
                ))
              ) : hareketler.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((h, idx) => (
                <tr key={h.id} style={{ borderBottom: '1px solid #f8fafc', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '18px 24px', fontSize: '14px', color: '#64748b', fontWeight: 500 }}>{new Date(h.islem_tarihi).toLocaleDateString('tr-TR')}</td>
                  <td style={{ padding: '18px 24px' }}>
                    <div style={{ 
                      width: '36px', height: '36px', borderRadius: '10px', 
                      background: h.tur === 'gelir' ? '#ecfdf5' : '#fef2f2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: h.tur === 'gelir' ? '#10b981' : '#ef4444',
                      fontSize: '18px', fontWeight: 800
                    }}>
                      {h.tur === 'gelir' ? 'â†‘' : 'â†“'}
                    </div>
                  </td>
                  <td style={{ padding: '18px 24px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{h.kategori}</div>
                  </td>
                  <td style={{ padding: '18px 24px', color: '#64748b', fontSize: '14px', fontWeight: 500 }}>{h.aciklama || 'â€”'}</td>
                  <td style={{ padding: '18px 24px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, padding: '6px 10px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', textTransform: 'uppercase' }}>
                      {h.kasalar?.kasa_adi || h.hesap || 'â€”'}
                    </span>
                  </td>
                  <td style={{ padding: '18px 24px', textAlign: 'right', fontWeight: 900, fontSize: '16px', color: h.tur === 'gelir' ? '#10b981' : '#ef4444', letterSpacing: '-0.5px' }}>
                    {h.tur === 'gelir' ? '+' : '-'}{h.tutar?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} â‚º
                  </td>
                  <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleDuzenle(h)} style={{ padding: '6px 10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>DÃ¼zenle</button>
                      <button onClick={() => setConfirmData({ open: true, item: h })} style={{ padding: '6px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && hareketler.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '100px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>ğŸ“Š</div>
                  <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: '15px' }}>HenÃ¼z bir hareket kaydÄ± bulunmuyor.</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalItems={hareketler.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        />
      </div>

      {/* SlideOver Panel Form */}
      <SlideOver 
        isOpen={panel.open} 
        onClose={() => { setPanel({ ...panel, open: false }); setEditingId(null); }} 
        title={editingId ? 'KaydÄ± DÃ¼zenle' : (panel.tur === 'gelir' ? 'Gelir GiriÅŸi' : 'Gider Ã‡Ä±kÄ±ÅŸÄ±')}
        subtitle={editingId ? 'KayÄ±t detaylarÄ±nÄ± gÃ¼ncelleyin.' : `${panel.tur === 'gelir' ? 'Kasa veya bankaya' : 'Kasadan veya bankadan'} yapÄ±lacak iÅŸlem detaylarÄ±nÄ± girin.`}
      >
        <form onSubmit={handleEkle} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div style={{ background: panel.tur === 'gelir' ? '#ecfdf5' : '#fef2f2', padding: '24px', borderRadius: '20px', textAlign: 'center' }}>
            <label style={{ ...labelStyle, textAlign: 'center', color: panel.tur === 'gelir' ? '#065f46' : '#991b1b' }}>Ä°ÅLEM TUTARI</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ position: 'absolute', left: '20px', fontSize: '24px', fontWeight: 800, color: panel.tur === 'gelir' ? '#10b981' : '#ef4444' }}>â‚º</span>
              <input 
                type="number" step="0.01" required placeholder="0,00" autoFocus
                style={{ 
                  width: '100%', padding: '16px 20px 16px 50px', border: 'none', background: 'transparent',
                  fontSize: '42px', fontWeight: 900, color: panel.tur === 'gelir' ? '#10b981' : '#ef4444',
                  textAlign: 'center', outline: 'none'
                }}
                value={form.tutar} onChange={e => setForm({ ...form, tutar: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Kategori</label>
              <select style={inputStyle} value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })}>
                {panel.tur === 'gelir' ? (
                  <>
                    <option value="Servis KazancÄ±">Servis KazancÄ±</option>
                    <option value="SatÄ±ÅŸ">SatÄ±ÅŸ</option>
                    <option value="DiÄŸer">DiÄŸer</option>
                  </>
                ) : (
                  KATEGORILER.map(k => <option key={k} value={k}>{k}</option>)
                )}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Tarih</label>
                <input type="date" style={inputStyle} value={form.islem_tarihi} onChange={e => setForm({ ...form, islem_tarihi: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Kasa / Banka HesabÄ±</label>
                <select style={inputStyle} value={form.kasa_id} onChange={e => setForm({ ...form, kasa_id: e.target.value })}>
                  <option value="">SeÃ§iniz...</option>
                  {kasalar.map(k => (
                    <option key={k.id} value={k.id}>
                      {k.kasa_adi} ({(k.guncel_bakiye || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} â‚º)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>AÃ§Ä±klama</label>
              <textarea 
                rows={4} style={{ ...inputStyle, resize: 'none' }} 
                placeholder="Ä°ÅŸlem detayÄ±, fatura no vb..." 
                value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button 
              type="submit" disabled={saving}
              style={{ 
                width: '100%', padding: '16px', borderRadius: '16px', border: 'none', 
                background: panel.tur === 'gelir' ? '#10b981' : '#ef4444', 
                color: '#fff', fontSize: '16px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: `0 8px 20px ${panel.tur === 'gelir' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {saving ? 'Kaydediliyor...' : `âœ“ ${panel.tur === 'gelir' ? 'Gelir GiriÅŸi' : 'Gider Ã‡Ä±kÄ±ÅŸÄ±'} Kaydet`}
            </button>
          </div>
        </form>
      </SlideOver>

      <ConfirmModal 
        isOpen={confirmData.open}
        onClose={() => setConfirmData({ open: false, item: null })}
        onConfirm={() => handleSil(confirmData.item)}
        type="danger"
        title="KaydÄ± Sil"
        message={confirmData.item?.servis_id 
          ? "DÄ°KKAT: Bu iÅŸlem bir servis kaydÄ±na ait Ã¶deme verisidir. Silerseniz servisin Ã¶deme durumu etkilenebilir. Devam etmek istiyor musunuz?" 
          : "Bu gelir/gider kaydÄ±nÄ± silmek istediÄŸinizden emin misiniz? Bu iÅŸlem geri alÄ±namaz."}
      />
      <style>{`
        .spinner { width: 36px; height: 36px; border: 4px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
