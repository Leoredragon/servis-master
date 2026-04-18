"use client"

import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import Pagination from '../components/Pagination'

const inp: React.CSSProperties = { width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none', color: '#1e293b', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }
const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }

export default function Musteriler() {
  const router = useRouter()
  const [musteriler, setMusteriler] = useState<any[]>([])
  const [filtered,   setFiltered]   = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [arama,      setArama]      = useState('')
  const [filtreTip,  setFiltreTip]  = useState('Hepsi')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize,   setPageSize]   = useState(20)
  
  const [modalAcik,  setModalAcik]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [toast,      setToast]      = useState<{msg: string, type: 'success'|'error'}|null>(null)
  const [editingId,  setEditingId]  = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: number | null }>({ open: false, id: null })
  const [confirmArac,   setConfirmArac]   = useState<{ open: boolean, musterId: number | null }>({ open: false, musterId: null })

  const [form, setForm] = useState({
    tip: 'Bireysel',
    yetkili: '', tel: '', cep: '', mail: '', adres: '', vergi_no: '', vergi_dairesi: ''
  })

  const showToast = (msg: string, type: 'success'|'error' = 'success') => { setToast({msg, type}); setTimeout(() => setToast(null), 3500) }

  const loadMusteriler = async () => {
    const { data, error } = await supabase
      .from('cari_kart')
      .select('*, arac(id), servis_karti(toplam_tutar), fatura(gtoplam, fatura_turu)')
      .order('yetkili')
    
    if (!error) { 
      const mapped = (data || []).map(m => {
        const servisToplami = (m.servis_karti || []).reduce((acc: number, s: any) => acc + (s.toplam_tutar || 0), 0)
        const faturaToplami = (m.fatura || []).reduce((acc: number, f: any) => {
          if (f.fatura_turu === 'Tahsilat' || f.fatura_turu === 'Alacak') return acc - (f.gtoplam || 0)
          return acc + (f.gtoplam || 0)
        }, 0)
        return { ...m, bakiye: servisToplami + faturaToplami, tip: m.vergi_no ? 'Kurumsal' : 'Bireysel' }
      })
      setMusteriler(mapped) 
      setFiltered(mapped) 
    }
    setLoading(false)
  }

  useEffect(() => { loadMusteriler() }, [])

  useEffect(() => {
    const q = arama.toLowerCase()
    let res = musteriler
    if (filtreTip === 'Bireysel') res = res.filter(m => m.tip === 'Bireysel')
    if (filtreTip === 'Kurumsal') res = res.filter(m => m.tip === 'Kurumsal')
    if (filtreTip === 'Borcu Olanlar') res = res.filter(m => m.bakiye > 0)
    res = !q ? res : res.filter(m =>
      (m.yetkili || '').toLowerCase().includes(q) ||
      (m.tel     || '').toLowerCase().includes(q) ||
      (m.cep     || '').toLowerCase().includes(q) ||
      (m.mail    || '').toLowerCase().includes(q) ||
      (m.vergi_no|| '').toLowerCase().includes(q)
    )
    setFiltered(res)
    setCurrentPage(1)
  }, [arama, filtreTip, musteriler])

  const handleSil = async (id: number) => {
    const { error } = await supabase.from('cari_kart').delete().eq('id', id)
    if (error) { showToast('Silinemedi: ' + error.message, 'error'); return }
    showToast('Müşteri silindi')
    await loadMusteriler()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.yetkili.trim()) { showToast('Müşteri Adı/Ünvan zorunludur', 'error'); return }
    if (!form.tel.trim() && !form.cep.trim()) { showToast('En az bir telefon numarası girmelisiniz', 'error'); return }
    if (form.tip === 'Kurumsal' && (!form.vergi_no || !form.vergi_dairesi)) {
      showToast('Kurumsal müşteriler için Vergi No ve Dairesi zorunludur', 'error'); return
    }
    setSaving(true)
    if (editingId) {
      const { error } = await supabase.from('cari_kart').update({
        yetkili:       form.yetkili.trim(),
        tel:           form.tel     || null,
        cep:           form.cep     || null,
        mail:          form.mail    || null,
        adres:         form.adres   || null,
        vergi_no:      form.vergi_no || null,
        vergi_dairesi: form.vergi_dairesi || null,
      }).eq('id', editingId)
      setSaving(false)
      if (error) { showToast('Hata: ' + error.message, 'error'); return }
      showToast('Müşteri güncellendi')
      setModalAcik(false)
      await loadMusteriler()
    } else {
      const { data, error } = await supabase.from('cari_kart').insert([{
        yetkili:       form.yetkili.trim(),
        tel:           form.tel     || null,
        cep:           form.cep     || null,
        mail:          form.mail    || null,
        adres:         form.adres   || null,
        vergi_no:      form.vergi_no || null,
        vergi_dairesi: form.vergi_dairesi || null,
        kullaniciadi:  'admin', // TODO: Oturum bilgisinden dinamik alınacak
        subeadi:       'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
      }]).select().single()
      setSaving(false)
      if (error) { showToast('Hata: ' + error.message, 'error'); return }
      showToast('Müşteri başarıyla eklendi')
      setModalAcik(false)
      setConfirmArac({ open: true, musterId: data.id })
    }
  }

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div style={{ width: '100%', padding: '0 32px', display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '32px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, background: toast.type==='error'?'#ef4444':'#10b981', color: '#fff', padding: '14px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', animation: 'modalSlideIn 0.2s ease-out' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Müşteriler</h1>
          <p style={{ color: '#64748b', fontSize: '15px', margin: '4px 0 0', fontWeight: 500 }}>{musteriler.length} kayıtlı müşteri bulunuyor</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({ tip: 'Bireysel', yetkili: '', tel: '', cep: '', mail: '', adres: '', vergi_no: '', vergi_dairesi: '' }); setModalAcik(true) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#3b82f6', color: '#fff', padding: '14px 24px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)', transition: 'background 0.2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Yeni Müşteri Ekle
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" placeholder="Ad, telefon, e-posta veya vergi no ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inp, paddingLeft: '44px', paddingRight: '16px', height: '100%', fontSize: '15px' }} />
        </div>
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
          {['Hepsi', 'Bireysel', 'Kurumsal', 'Borcu Olanlar'].map(f => (
            <button key={f} onClick={() => setFiltreTip(f)} style={{ background: filtreTip === f ? '#fff' : 'transparent', color: filtreTip === f ? '#0f172a' : '#64748b', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: filtreTip === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>Yükleniyor...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['ID', 'Ad Soyad / Ünvan', 'İletişim', 'Tip', 'Güncel Bakiye', 'İşlemler'].map(h => (
                    <th key={h} style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((m, idx) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '13px', fontWeight: 700 }}>#{m.id}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <Link href={`/musteriler/${m.id}`} style={{ fontWeight: 800, color: '#0f172a', textDecoration: 'none', fontSize: '15px' }}>
                        {m.yetkili || '(İsimsiz)'}
                      </Link>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
                        {Array.isArray(m.arac) ? m.arac.length : 0} Kayıtlı Araç
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: '14px', color: '#334155', fontWeight: 600 }}>{m.cep || m.tel || 'Bilinmiyor'}</div>
                      {m.mail && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{m.mail}</div>}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: m.tip === 'Kurumsal' ? '#7c3aed' : '#0ea5e9', background: m.tip === 'Kurumsal' ? '#f5f3ff' : '#e0f2fe' }}>
                        {m.tip}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: m.bakiye > 0 ? '#ef4444' : m.bakiye < 0 ? '#10b981' : '#64748b' }}>
                        {Math.abs(m.bakiye).toLocaleString('tr-TR')} ₺
                        {m.bakiye > 0 && <span style={{ fontSize: '11px', display: 'block', fontWeight: 600, opacity: 0.8 }}>Borç</span>}
                        {m.bakiye < 0 && <span style={{ fontSize: '11px', display: 'block', fontWeight: 600, opacity: 0.8 }}>Alacak</span>}
                        {m.bakiye === 0 && <span style={{ fontSize: '11px', display: 'block', fontWeight: 600, opacity: 0.8 }}>Dengede</span>}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <Link href={`/musteriler/${m.id}`} style={{ display: 'inline-flex', padding: '8px 14px', background: '#f1f5f9', color: '#3b82f6', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', transition: 'background 0.2s' }}> Profil </Link>
                        <button onClick={() => setConfirmDelete({ open: true, id: m.id })} style={{ padding: '8px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}> Sil </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '64px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#475569', fontSize: '15px' }}>Müşteri bulunamadı</div>
                    <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>Arama kriterlerine uyan kayıt yok.</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <Pagination 
          totalItems={filtered.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        />
      </div>

      <Modal isOpen={modalAcik} onClose={() => setModalAcik(false)} title={editingId ? "Müşteriyi Düzenle" : "Hızlı Müşteri Ekle"} subtitle="Sadece gerekli alanları doldurup işlemi hızlandırın" size="md">
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={lbl}>Müşteri Tipi</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                {['Bireysel', 'Kurumsal'].map(tip => (
                  <label key={tip} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', border: `2px solid ${form.tip === tip ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '10px', cursor: 'pointer', background: form.tip === tip ? '#eff6ff' : '#fff' }}>
                    <input type="radio" value={tip} checked={form.tip === tip} onChange={() => setForm({...form, tip})} style={{ accentColor: '#3b82f6', width: '18px', height: '18px' }} />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{tip} Müşteri</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Ad Soyad veya Ünvan *</label>
                <input style={inp} autoFocus placeholder="Örn: Ahmet Yılmaz" value={form.yetkili} onChange={e => setForm({ ...form, yetkili: e.target.value })} required />
              </div>
              <div>
                <label style={lbl}>Cep Telefonu *</label>
                <input style={inp} type="tel" placeholder="0532 000 00 00" value={form.cep} onChange={e => setForm({ ...form, cep: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>E-posta (Opsiyonel)</label>
                <input style={inp} type="email" placeholder="ornek@mail.com" value={form.mail} onChange={e => setForm({ ...form, mail: e.target.value })} />
              </div>
            </div>
            {form.tip === 'Kurumsal' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Kurumsal Bilgiler</span>
                </div>
                <div>
                  <label style={lbl}>Vergi Dairesi *</label>
                  <input style={inp} type="text" placeholder="Kadıköy VD" value={form.vergi_dairesi} onChange={e => setForm({ ...form, vergi_dairesi: e.target.value })} required={form.tip === 'Kurumsal'} />
                </div>
                <div>
                  <label style={lbl}>Vergi No *</label>
                  <input style={inp} type="text" placeholder="1234567890" value={form.vergi_no} onChange={e => setForm({ ...form, vergi_no: e.target.value })} required={form.tip === 'Kurumsal'} />
                </div>
              </div>
            )}
            <div>
              <label style={lbl}>Açık Adres (Opsiyonel)</label>
              <textarea style={{ ...inp, resize: 'vertical' as const }} rows={2} placeholder="Şehir, İlçe, Mahalle detayları..." value={form.adres} onChange={e => setForm({ ...form, adres: e.target.value })} />
            </div>
          </div>
          <div style={{ padding: '18px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '14px', background: '#fafbfc', borderRadius: '0 0 16px 16px' }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
              {saving ? 'İşleniyor...' : (editingId ? 'Güncelle' : 'Kaydet ve Devam Et')}
            </button>
            <button type="button" onClick={() => setModalAcik(false)} style={{ padding: '14px 24px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}> İptal </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={() => confirmDelete.id && handleSil(confirmDelete.id)}
        type="danger"
        title="Müşteriyi Sil"
        message="Bu müşteriyi ve bağlı tüm verilerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      />

      <ConfirmModal 
        isOpen={confirmArac.open}
        onClose={() => { setConfirmArac({ open: false, musterId: null }); loadMusteriler(); }}
        onConfirm={() => router.push(`/musteriler/${confirmArac.musterId}?arac_ekle=true`)}
        type="info"
        title="Müşteri Kaydedildi"
        message="Bu müşteriye hemen bir araç eklemek ister misiniz?"
        confirmText="Evet, Araç Ekle"
        cancelText="Daha Sonra"
      />
    </div>
  )
}