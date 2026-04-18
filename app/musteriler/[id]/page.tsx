"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Modal from '../../components/Modal'

const Icons = {
  car: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h10l1.4-3h1.3l.3 3z"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="15.5" cy="17.5" r="2.5"/></svg>,
  tool: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  money: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  note: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
  phone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  mail: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  mapPin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  building: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
}

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }

export default function MusteriDetay() {
  const router = useRouter()
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [musteri, setMusteri] = useState<any>(null)
  
  // Tab verileri
  const [araclar, setAraclar] = useState<any[]>([])
  const [servisler, setServisler] = useState<any[]>([])
  const [finans, setFinans] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'araclar' | 'servisler' | 'finans' | 'notlar'>('araclar')
  
  // Modals & Forms
  const [aracModal, setAracModal] = useState(false)
  const [aracForm, setAracForm] = useState({ id: null, plaka: '', marka: '', model: '', yil: '', renk: '', km: '', motor_no: '', sasi_no: '' })
  const [notlar, setNotlar] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    
    // 1. Müşteri Kartı
    const { data: musteriData } = await supabase.from('cari_kart').select('*').eq('id', id).single()
    if (!musteriData) {
      setLoading(false)
      return
    }

    // 2. Araçları Getir
    const { data: aracData } = await supabase.from('arac').select('*').eq('cari_id', id)
    
    // 3. Servis Kayıtları
    const { data: servisData } = await supabase.from('servis_karti').select('*, arac(plaka, marka)').eq('cari_id', id).order('giris_tarihi', { ascending: false })
    
    // 4. Finans (Kasa Hareketlerinden Müşteri Adı ile eşleşenler)
    let finansData = []
    if (musteriData.yetkili) {
      // Eşleşme (ilike benzeri): Müşteri adını içeriyorsa getir.
      // DİKKAT: Tam eşleşme istiyorsanız eq kullanılabilir fakat like ('%ad%') daha güvenli olabilir.
      const searchName = `%${musteriData.yetkili.trim()}%`
      const { data: fData } = await supabase.from('kasa_hareket').select('*').ilike('hesap', searchName).order('islem_tarihi', { ascending: false })
      finansData = fData || []
    }

    setMusteri(musteriData)
    setNotlar(musteriData.aciklama || '')
    setAraclar(aracData || [])
    setServisler(servisData || [])
    setFinans(finansData)
    
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const topHarcama = servisler.reduce((acc, curr) => acc + (curr.toplam_tutar || 0), 0)
  const topTahsilat = finans.filter(f => f.tur === 'gelir').reduce((acc, c) => acc + (c.tutar || 0), 0)
  const topBorc = finans.filter(f => f.tur === 'gider').reduce((acc, c) => acc + (c.tutar || 0), 0)
  const musteriBakiye = topBorc - topTahsilat // Kasa gideri = ona ödediğimiz (biz borçluyuz). Kasa geliri = ondan tahsilat. Mantık değişebilir, genelde cari olarak servis harcaması müşteriyi borçlandırır. 
                                              // Bu durumda servis topHarcama borcudur. Kasa gelirleri tahsilattır.
  const gercekBakiye = topHarcama - topTahsilat

  const saveNote = async () => {
    setSavingNote(true)
    await supabase.from('cari_kart').update({ aciklama: notlar }).eq('id', id)
    fetchData()
    setSavingNote(false)
  }

  const saveArac = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aracForm.plaka) return

    const payload = {
      cari_id: id,
      plaka: aracForm.plaka.toUpperCase(),
      marka: aracForm.marka,
      model: aracForm.model,
      yil: aracForm.yil || null,
      renk: aracForm.renk || null,
      km: aracForm.km || null,
      motor_no: aracForm.motor_no || null,
      sasi_no: aracForm.sasi_no || null,
      kullaniciadi: 'admin',
      subeadi: 'Merkez'
    }

    if (aracForm.id) {
      await supabase.from('arac').update(payload).eq('id', aracForm.id)
    } else {
      await supabase.from('arac').insert([payload])
    }

    setAracModal(false)
    fetchData()
  }

  const deleteArac = async (aracId: number) => {
    if (!confirm('Aracı silmek istediğinize emin misiniz?')) return
    await supabase.from('arac').delete().eq('id', aracId)
    fetchData()
  }

  if (loading) return <div style={{ padding: '60px' }}><div className="skeleton" style={{ height: '400px', borderRadius: '16px' }} /></div>
  if (!musteri) return <div style={{ padding: '60px', textAlign: 'center' }}>Müşteri bulunamadı</div>

  return (
    <div className="animate-fadeIn" style={{ width: '100%', padding: '0 32px' }}>
      
      {/* ─── Header: Butonlar & Geri Dön ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
         <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ← Listeye Dön
         </button>
         <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => router.push(`/musteriler/yeni?id=${id}`)} className="btn-secondary" style={{ padding: '10px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 700 }}>
               Düzenle
            </button>
            <button onClick={() => { setAracForm({ id: null, plaka: '', marka: '', model: '', yil: '', renk: '', km: '', motor_no: '', sasi_no: '' }); setAracModal(true) }} className="btn-secondary" style={{ background: '#f8fafc', padding: '10px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 700 }}>
               Araç Ekle
            </button>
         </div>
      </div>

      {/* ─── ÜST ALAN: Profil Kimliği & Özet Kartları ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.2fr) 2fr', gap: '24px', marginBottom: '32px' }}>
         
         {/* Profil Sol Kart */}
         <div className="card" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', fontSize: '28px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               {musteri.yetkili.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
               <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{musteri.yetkili}</h2>
                  {musteri.grup && <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#64748b', fontSize: '11px', fontWeight: 700 }}>{musteri.grup}</span>}
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                     <span style={{ color: '#94a3b8' }}>{Icons.phone}</span> {musteri.cep || musteri.tel || 'Telefon yok'}
                  </div>
                  {musteri.mail && (
                     <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                        <span style={{ color: '#94a3b8' }}>{Icons.mail}</span> {musteri.mail}
                     </div>
                  )}
                  {musteri.vergi_no && (
                     <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                        <span style={{ color: '#94a3b8' }}>{Icons.building}</span> {musteri.vergi_dairesi} VD. - {musteri.vergi_no}
                     </div>
                  )}
                  {musteri.adres && (
                     <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                        <span style={{ color: '#94a3b8', marginTop: '2px' }}>{Icons.mapPin}</span> <span style={{ lineHeight: 1.4 }}>{musteri.adres}</span>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Sağ 3 Özet Kutu */}
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
               <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  {Icons.car}
               </div>
               <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>{araclar.length}</div>
               <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Toplam Araç</div>
            </div>

            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
               <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  {Icons.tool}
               </div>
               <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>{servisler.length}</div>
               <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Servis Kaydı</div>
            </div>

            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
               <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  {Icons.money}
               </div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{topHarcama.toLocaleString('tr-TR')} ₺</div>
               <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: '4px' }}>Toplam Harcama</div>
            </div>
         </div>
      </div>

      {/* ─── SEKME MANTIĞI ─── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #f1f5f9', marginBottom: '24px' }}>
         {[
           { id: 'araclar', label: `Araçlar (${araclar.length})`, icon: Icons.car },
           { id: 'servisler', label: `Servis Geçmişi (${servisler.length})`, icon: Icons.tool },
           { id: 'finans', label: 'Finansal Özet', icon: Icons.money },
           { id: 'notlar', label: 'Müşteri Notları', icon: Icons.note },
         ].map(tab => (
           <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
             style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', border: 'none', background: 'transparent', borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === tab.id ? '#3b82f6' : '#64748b', fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
             {tab.icon} {tab.label}
           </button>
         ))}
      </div>

      {/* ─── SEKME İÇERİKLERİ ─── */}
      <div style={{ minHeight: '400px' }}>
         
         {activeTab === 'araclar' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
               {araclar.map(a => (
                  <div key={a.id} className="card hover-row" style={{ padding: '24px', position: 'relative' }}>
                     <div style={{ display: 'inline-block', padding: '6px 12px', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '1px', marginBottom: '16px' }}>
                        {a.plaka}
                     </div>
                     <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setAracForm(a); setAracModal(true) }} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>Düzenle</button>
                        <button onClick={() => deleteArac(a.id)} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Sil</button>
                     </div>

                     <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>{a.marka} {a.model}</h3>
                     
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                        <div>
                           <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Yıl / Renk</div>
                           <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>{a.yil || '-'} / {a.renk || '-'}</div>
                        </div>
                        <div>
                           <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Kilometre</div>
                           <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>{a.km || '-'}</div>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                           <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Motor / Şasi No</div>
                           <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600, fontFamily: 'monospace' }}>{a.motor_no || '-'} / {a.sasi_no || '-'}</div>
                        </div>
                     </div>

                     <Link href={`/?modal=servis&cari_id=${id}&arac_id=${a.id}`} style={{ display: 'flex', justifyContent: 'center', padding: '10px', background: '#eff6ff', color: '#3b82f6', borderRadius: '10px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                        Servis Geçmişi & Aç
                     </Link>
                  </div>
               ))}
               {araclar.length === 0 && <div style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '16px' }}>Müşteriye ait sistemde tanımlı araç bulunmamaktadır.</div>}
            </div>
         )}

         {activeTab === 'servisler' && (
            <div className="card" style={{ overflow: 'hidden' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                     <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Servis No / Araç</th>
                        <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Giriş Tarihi</th>
                        <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Durum</th>
                        <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Tutar</th>
                     </tr>
                  </thead>
                  <tbody>
                     {servisler.map((s, i) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                           <td style={{ padding: '16px 24px' }}>
                              <Link href={`/servis-kayitlari/${s.id}`} style={{ fontWeight: 800, color: '#0f172a', textDecoration: 'none' }}>#{s.id} - {s.arac?.plaka}</Link>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{s.arac?.marka}</div>
                           </td>
                           <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                              {new Date(s.giris_tarihi).toLocaleDateString('tr-TR')}
                           </td>
                           <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                              <span style={{ 
                                padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                background: s.durum === 'Tamamlandı' ? '#dcfce7' : (s.durum === 'İşlemde' ? '#fef3c7' : '#f1f5f9'),
                                color: s.durum === 'Tamamlandı' ? '#166534' : (s.durum === 'İşlemde' ? '#92400e' : '#475569')
                              }}>
                                {s.durum}
                              </span>
                           </td>
                           <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                              {s.toplam_tutar > 0 ? `${s.toplam_tutar.toLocaleString('tr-TR')} ₺` : '—'}
                           </td>
                        </tr>
                     ))}
                     {servisler.length === 0 && <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Servis kaydı yok.</td></tr>}
                  </tbody>
               </table>
               <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                  <span>Toplam {servisler.length} Servis Kaydı</span>
                  <span>Maliyet: {topHarcama.toLocaleString('tr-TR')} ₺</span>
               </div>
            </div>
         )}

         {activeTab === 'finans' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  <div className="card" style={{ padding: '24px', borderLeft: '4px solid #10b981' }}>
                     <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Müşteriden Alınan (Tahsilat)</div>
                     <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981', marginTop: '8px' }}>{topTahsilat.toLocaleString('tr-TR')} ₺</div>
                  </div>
                  <div className="card" style={{ padding: '24px', borderLeft: '4px solid #ef4444' }}>
                     <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Oluşan Servis Maliyeti</div>
                     <div style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444', marginTop: '8px' }}>{topHarcama.toLocaleString('tr-TR')} ₺</div>
                  </div>
                  <div className="card" style={{ padding: '24px', background: gercekBakiye > 0 ? '#fef2f2' : '#ecfdf5' }}>
                     <div style={{ fontSize: '12px', fontWeight: 700, color: gercekBakiye > 0 ? '#ef4444' : '#10b981', textTransform: 'uppercase' }}>Anlık Bakiye Durumu</div>
                     <div style={{ fontSize: '24px', fontWeight: 900, color: gercekBakiye > 0 ? '#ef4444' : '#10b981', marginTop: '8px' }}>
                       {Math.abs(gercekBakiye).toLocaleString('tr-TR')} ₺ {gercekBakiye > 0 ? '(Müşteri Borçlu)' : '(Alacaklı / Sıfır)'}
                     </div>
                  </div>
               </div>

               <div className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 800, color: '#0f172a' }}>Kasa Hareketleri</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                           <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Tarih</th>
                           <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Açıklama / Kategori</th>
                           <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Hareket Türü</th>
                           <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Tutar</th>
                        </tr>
                     </thead>
                     <tbody>
                        {finans.map(f => (
                           <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>{new Date(f.islem_tarihi).toLocaleDateString('tr-TR')}</td>
                              <td style={{ padding: '16px 24px' }}>
                                 <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{f.aciklama || '—'}</div>
                                 <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{f.kategori}</div>
                              </td>
                              <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                 <span style={{ background: f.tur === 'gelir' ? '#dcfce7' : '#fef2f2', color: f.tur === 'gelir' ? '#166534' : '#991b1b', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                                    {f.tur}
                                 </span>
                              </td>
                              <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '15px', fontWeight: 800, color: f.tur === 'gelir' ? '#16a34a' : '#dc2626' }}>
                                 {f.tur === 'gelir' ? '+' : '-'}{f.tutar?.toLocaleString('tr-TR')} ₺
                              </td>
                           </tr>
                        ))}
                        {finans.length === 0 && <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Müşteri ile eşleşen kasa hareketi bulunamadı.</td></tr>}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {activeTab === 'notlar' && (
            <div className="card" style={{ padding: '24px' }}>
               <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>İç Yazışmalar & Notlar</h3>
               <textarea rows={8} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Müşteri hakkında özel talepler, kronik sorunları veya genel notlar buraya eklenebilir..." value={notlar} onChange={e => setNotlar(e.target.value)} />
               <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button onClick={saveNote} disabled={savingNote} className="btn-primary" style={{ padding: '12px 24px' }}>
                     {savingNote ? 'Kaydediliyor...' : 'Notları Kaydet'}
                  </button>
               </div>
            </div>
         )}
         
      </div>

      <Modal isOpen={aracModal} onClose={() => setAracModal(false)} title={aracForm.id ? "Aracı Düzenle" : "Yeni Araç Ekle"} size="md">
         <form onSubmit={saveArac} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
               <label style={labelStyle}>Müşteri Plakası *</label>
               <input required style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 900, fontSize: '18px', letterSpacing: '2px' }} placeholder="34 ABC 123" value={aracForm.plaka} onChange={e => setAracForm({...aracForm, plaka: e.target.value})} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <div>
                  <label style={labelStyle}>Marka *</label>
                  <input list="markaList" required style={inputStyle} placeholder="Örn: Honda" value={aracForm.marka} onChange={e => setAracForm({...aracForm, marka: e.target.value})} />
                  <datalist id="markaList">
                     <option value="Yamaha" />
                     <option value="Honda" />
                     <option value="Suzuki" />
                     <option value="Kawasaki" />
                     <option value="BMW" />
                     <option value="KTM" />
                     <option value="Triumph" />
                     <option value="TVS" />
                     <option value="Bajaj" />
                     <option value="Kymco" />
                     <option value="Sym" />
                  </datalist>
               </div>
               <div>
                  <label style={labelStyle}>Model *</label>
                  <input required style={inputStyle} placeholder="Örn: PCX 125" value={aracForm.model} onChange={e => setAracForm({...aracForm, model: e.target.value})} />
               </div>
               <div>
                  <label style={labelStyle}>Model Yılı</label>
                  <input type="number" style={inputStyle} placeholder="2024" value={aracForm.yil} onChange={e => setAracForm({...aracForm, yil: e.target.value})} />
               </div>
               <div>
                  <label style={labelStyle}>Renk</label>
                  <input style={inputStyle} placeholder="Mat Siyah" value={aracForm.renk} onChange={e => setAracForm({...aracForm, renk: e.target.value})} />
               </div>
               <div>
                  <label style={labelStyle}>Kilometre</label>
                  <input type="number" style={inputStyle} placeholder="15000" value={aracForm.km} onChange={e => setAracForm({...aracForm, km: e.target.value})} />
               </div>
               <div>
                  <label style={labelStyle}>Motor No</label>
                  <input style={inputStyle} value={aracForm.motor_no} onChange={e => setAracForm({...aracForm, motor_no: e.target.value})} />
               </div>
            </div>
            
            <div>
               <label style={labelStyle}>Şasi Numarası</label>
               <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={aracForm.sasi_no} onChange={e => setAracForm({...aracForm, sasi_no: e.target.value})} />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '14px', marginTop: '8px' }}>
               Araç Bilgilerini Kaydet
            </button>
         </form>
      </Modal>

    </div>
  )
}
