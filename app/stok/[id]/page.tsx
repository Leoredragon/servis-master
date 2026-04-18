"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import StokHareketiModal from '../../components/StokHareketiModal'
import ConfirmModal from '../../components/ConfirmModal'

const GRUPLAR = [
  "Filtre ve Bakım", "Mekanik/Motor", "Elektrik", "Kaporta/Aksesuar", "Sarf Malzeme", "Lastik/Jant", "Madeni Yağ", "Diğer"
]
const BIRIMLER = ["Adet", "Litre", "Set", "Kg", "Metre", "Takım"]
const inputStyle = { width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', background: '#fff' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }

export default function StokDetay() {
  const { id } = useParams()
  const router = useRouter()

  const [stok, setStok] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'bilgi' | 'hareket'>('bilgi')

  const [hareketModal, setHareketModal] = useState(false)
  const [confirmSil, setConfirmSil] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const { data: sData } = await supabase.from('stok').select('*').eq('id', id).single()
    if (sData) {
       setStok(sData)
       const { data: hData } = await supabase.from('stok_hareket').select('*').eq('stok_id', id).order('islem_tarihi', { ascending: false }).limit(50)
       setHistory(hData || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.target as HTMLFormElement)
    const formDataObj: any = Object.fromEntries(formData.entries())

    const payload = {
      ad: formDataObj.ad,
      kod: formDataObj.kod || null,
      barkod: formDataObj.barkod || null,
      grup: formDataObj.grup,
      birim: formDataObj.birim,
      a_fiyat: parseFloat(formDataObj.a_fiyat) || 0,
      s_fiyat: parseFloat(formDataObj.s_fiyat) || 0,
      kdv_oran: formDataObj.kdv_oran.toString(),
      kritik_seviye: parseFloat(formDataObj.kritik_seviye) || 10,
      aciklama: formDataObj.aciklama,
    }

    const { error } = await supabase.from('stok').update(payload).eq('id', id)
    if (error) alert(error.message)
    else fetchData()
    setSaving(false)
  }

  const handleDelete = async () => {
    await supabase.from('stok_hareket').delete().eq('stok_id', id)
    await supabase.from('stok').delete().eq('id', id)
    router.push('/stok')
  }

  if (loading) return <div style={{ padding: '60px' }}><div className="skeleton" style={{ height: '500px', borderRadius: '24px' }}></div></div>
  if (!stok) return <div style={{ padding: '60px', textAlign: 'center' }}>Ürün bulunamadı.</div>

  const stokDurum = stok.miktar <= 0 ? 'Stoksuz' : stok.miktar <= (stok.kritik_seviye || 10) ? 'Kritik' : 'Normal'
  const durumRenk = stokDurum === 'Stoksuz' ? '#ef4444' : stokDurum === 'Kritik' ? '#f59f00' : '#10b981'

  // Geçmiş Net Miktar
  let giren = 0, cikan = 0
  history.forEach(h => {
     if (h.hareket_turu.includes('Giriş') || h.hareket_turu.includes('İade')) giren += h.miktar
     if (h.hareket_turu.includes('Çıkış')) cikan += h.miktar
  })

  return (
    <div className="animate-fadeIn" style={{ width: '100%', padding: '0 32px 32px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={() => router.push('/stok')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← Stok Listesi
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setHareketModal(true)} className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px' }}>Hareket Girişi/Çıkışı Yap</button>
        </div>
      </div>

      {/* Header Info Card */}
      <div className="card" style={{ padding: '32px 40px', marginBottom: '24px', display: 'flex', gap: '40px', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
         <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: durumRenk }}></div>
         
         <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px', fontWeight: 800, color: '#64748b' }}>
               {stok.grup}
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>{stok.ad}</h2>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, fontFamily: 'monospace' }}>KOD: {stok.kod || 'Yok'} | BARKOD: {stok.barkod || 'Yok'}</div>
         </div>

         <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', textAlign: 'center', minWidth: '130px' }}>
               <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Mevcut Miktar</div>
               <div style={{ fontSize: '32px', fontWeight: 900, color: durumRenk }}>{stok.miktar} <span style={{ fontSize: '14px', color: '#64748b' }}>{stok.birim}</span></div>
            </div>
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', textAlign: 'center', minWidth: '130px' }}>
               <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Stok Değeri (Alış)</div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: '#3b82f6', marginTop: '4px' }}>{((stok.miktar || 0) * (stok.a_fiyat || 0)).toLocaleString('tr-TR')} ₺</div>
            </div>
         </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '2px solid #f1f5f9', marginBottom: '32px' }}>
         <button onClick={() => setActiveTab('bilgi')} style={{ padding: '12px 0', border: 'none', background: 'none', color: activeTab === 'bilgi' ? '#0f172a' : '#94a3b8', fontSize: '15px', fontWeight: 800, cursor: 'pointer', borderBottom: activeTab === 'bilgi' ? '3px solid #0f172a' : '3px solid transparent' }}>Ürün Bilgilerini Düzenle</button>
         <button onClick={() => setActiveTab('hareket')} style={{ padding: '12px 0', border: 'none', background: 'none', color: activeTab === 'hareket' ? '#0f172a' : '#94a3b8', fontSize: '15px', fontWeight: 800, cursor: 'pointer', borderBottom: activeTab === 'hareket' ? '3px solid #0f172a' : '3px solid transparent' }}>Hareket Geçmişi ({history.length})</button>
      </div>

      {activeTab === 'bilgi' && (
         <div className="card">
            <form onSubmit={handleUpdate} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                     <label style={labelStyle}>Ürün Adı *</label>
                     <input required name="ad" defaultValue={stok.ad} style={inputStyle} />
                  </div>
                  <div>
                     <label style={labelStyle}>Stok Kodu</label>
                     <input name="kod" defaultValue={stok.kod} style={inputStyle} />
                  </div>
                  <div>
                     <label style={labelStyle}>Barkod</label>
                     <input name="barkod" defaultValue={stok.barkod} style={inputStyle} />
                  </div>
                  <div>
                     <label style={labelStyle}>Kategori / Grup</label>
                     <select name="grup" defaultValue={stok.grup} style={inputStyle}>
                        {GRUPLAR.map(g => <option key={g} value={g}>{g}</option>)}
                     </select>
                  </div>
                  <div>
                     <label style={labelStyle}>Birim</label>
                     <select name="birim" defaultValue={stok.birim} style={inputStyle}>
                        {BIRIMLER.map(b => <option key={b} value={b}>{b}</option>)}
                     </select>
                  </div>
                  <div>
                     <label style={labelStyle}>Alış Fiyatı (₺)</label>
                     <input type="number" step="0.01" name="a_fiyat" defaultValue={stok.a_fiyat} style={inputStyle} />
                  </div>
                  <div>
                     <label style={labelStyle}>Satış Fiyatı (₺)</label>
                     <input type="number" step="0.01" name="s_fiyat" defaultValue={stok.s_fiyat} style={inputStyle} />
                  </div>
                  <div>
                     <label style={labelStyle}>KDV Oranı</label>
                     <select name="kdv_oran" defaultValue={stok.kdv_oran || "20"} style={inputStyle}>
                        <option value="0">%0</option><option value="1">%1</option><option value="10">%10</option><option value="20">%20</option>
                     </select>
                  </div>
                  <div>
                     <label style={labelStyle}>Kritik Stok Seviyesi</label>
                     <input type="number" step="0.01" name="kritik_seviye" defaultValue={stok.kritik_seviye} style={inputStyle} />
                  </div>
               </div>
               
               <div>
                  <label style={labelStyle}>Açıklama</label>
                  <textarea name="aciklama" defaultValue={stok.aciklama} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
               </div>

               <div style={{ textAlign: 'right', marginTop: '16px' }}>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '14px 32px', borderRadius: '12px' }}>
                     {saving ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                  </button>
               </div>
            </form>
         </div>
      )}

      {activeTab === 'hareket' && (
         <div className="card" style={{ padding: '24px' }}>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
               <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>SON 50 HAREKETTE KESİNLEŞMİŞ GİRİŞ</div>
                  <div style={{ fontSize: '18px', color: '#16a34a', fontWeight: 900 }}>+ {giren} {stok.birim}</div>
               </div>
               <div style={{ width: '1px', background: '#e2e8f0' }}></div>
               <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>SON 50 HAREKETTE KESİNLEŞMİŞ ÇIKIŞ</div>
                  <div style={{ fontSize: '18px', color: '#ef4444', fontWeight: 900 }}>- {cikan} {stok.birim}</div>
               </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                     <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#64748b' }}>Tarih</th>
                     <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#64748b' }}>Hareket Türü</th>
                     <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#64748b', textAlign: 'center' }}>Miktar</th>
                     <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#64748b' }}>Açıklama / Fiyat</th>
                  </tr>
               </thead>
               <tbody>
                  {history.map(h => {
                     const isGiris = h.hareket_turu.includes('Giriş') || h.hareket_turu.includes('İade')
                     const isDüzeltme = h.hareket_turu === 'Düzeltme'
                     return (
                        <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                           <td style={{ padding: '16px', fontSize: '13px', fontWeight: 600 }}>{new Date(h.islem_tarihi).toLocaleString('tr-TR')}</td>
                           <td style={{ padding: '16px' }}>
                              <span style={{ 
                                 padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                                 background: isDüzeltme ? '#e0f2fe' : (isGiris ? '#dcfce7' : '#fee2e2'),
                                 color: isDüzeltme ? '#0284c7' : (isGiris ? '#16a34a' : '#dc2626')
                              }}>{h.hareket_turu}</span>
                           </td>
                           <td style={{ padding: '16px', textAlign: 'center', fontSize: '15px', fontWeight: 900, color: isDüzeltme ? '#3b82f6' : (isGiris ? '#166534' : '#991b1b') }}>
                              {isDüzeltme ? '' : (isGiris ? '+' : '-')}{h.miktar} {stok.birim}
                           </td>
                           <td style={{ padding: '16px' }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                                 {h.aciklama || 'Belirtilmedi'}
                                 {h.servis_id && <Link href={`/servis-kayitlari/${h.servis_id}`} style={{ marginLeft: '8px', color: '#3b82f6', textDecoration: 'none', fontSize: '12px' }}>[SRV Aç]</Link>}
                              </div>
                              {h.birim_fiyat && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>İşlem Fiyatı: {h.birim_fiyat} ₺</div>}
                           </td>
                        </tr>
                     )
                  })}
                  {history.length === 0 && <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Kayıtlı hareket bulunmuyor.</td></tr>}
               </tbody>
            </table>
         </div>
      )}

      <div style={{ marginTop: '60px', padding: '24px', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
            <h4 style={{ margin: 0, color: '#991b1b', fontSize: '16px', fontWeight: 800 }}>Stok Kartını Kalıcı Olarak Sil</h4>
            <p style={{ margin: '4px 0 0', color: '#b91c1c', fontSize: '13px' }}>Bu işlem bu ürünü ve ilgili tüm hareket geçmişini siler. Geri alınamaz.</p>
         </div>
         <button onClick={() => setConfirmSil(true)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Ürünü Sil</button>
      </div>

      <ConfirmModal
         isOpen={confirmSil}
         onClose={() => setConfirmSil(false)}
         title="Ürünü Sil"
         message="Tüm sistemden bu ürün ve ürünün tüm 'Stok Hareketi' fişleri kalıcı olarak silinecektir. Onaylıyor musunuz?"
         confirmText="Evet, Kalıcı Olarak Sil"
         type="danger"
         onConfirm={handleDelete}
      />

      {hareketModal && (
         <StokHareketiModal
            isOpen={true}
            onClose={() => setHareketModal(false)}
            onSuccess={fetchData}
            stokId={stok.id}
            stokAd={stok.ad}
            mevcutMiktar={stok.miktar}
         />
      )}

    </div>
  )
}
