"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import ConfirmModal from '@/app/components/ConfirmModal'
import PrintButton from '@/app/components/print/PrintButton'
import FaturaBaski from '@/app/components/print/FaturaBaski'

const Icons = {
  back: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  print: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  cancel: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
}

export default function FaturaDetayPage() {
  const router = useRouter()
  const { id } = useParams()
  const printRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [fatura, setFatura] = useState<any>(null)
  const [kalemler, setKalemler] = useState<any[]>([])
  const [updating, setUpdating] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    try {
      const { data: fData } = await supabase.from('fatura').select('*, cari_kart(*)').eq('id', id).single()
      const { data: kData } = await supabase.from('fat_isl').select('*').eq('fatura_id', id)
      
      setFatura(fData)
      setKalemler(kData || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  const handleCancelAction = async () => {
    setUpdating(true)
    try {
      const { error } = await supabase.from('fatura').update({ odeme_durumu: 'İptal Edildi' }).eq('id', parseInt(id as string))
      if (error) throw error
      await fetchDetail()
    } catch (err: any) {
      alert('Hata: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <div style={{ padding: '80px', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: '80px', width: '100%', marginBottom: '24px', borderRadius: '16px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
         <div className="skeleton" style={{ height: '400px', borderRadius: '16px' }} />
         <div className="skeleton" style={{ height: '400px', borderRadius: '16px' }} />
      </div>
    </div>
  )

  return (
    <div className="animate-fadeIn" style={{ padding: '0 32px' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.back()} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{Icons.back}</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>{fatura?.evrak_no}</h1>
              <span style={{ 
                padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800,
                background: fatura?.fatura_turu === 'Satış' ? '#dcfce7' : '#fee2e2',
                color: fatura?.fatura_turu === 'Satış' ? '#166534' : '#991b1b'
              }}>
                {fatura?.fatura_turu?.toUpperCase()} FATURASI
              </span>
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Düzenleme Tarihi: {new Date(fatura?.fat_tarih).toLocaleDateString('tr-TR')}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <PrintButton contentRef={printRef} fileName={`Fatura_${fatura?.evrak_no || 'Belge'}`} />
          {fatura?.odeme_durumu !== 'İptal Edildi' && (
            <button 
              onClick={() => setCancelModal(true)} 
              disabled={updating} 
              className="btn-secondary" 
              style={{ color: '#ef4444', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              {Icons.cancel} {updating ? 'İşleniyor...' : 'İptal Et'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Customer / Detail Card */}
          <div className="card">
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px', padding: '32px' }}>
               <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Müşteri Bilgileri</h4>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{fatura?.cari_kart?.yetkili}</div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{fatura?.cari_kart?.tel || 'Telefon belirtilmemiş'}</div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>{fatura?.cari_kart?.sehir || ''} {fatura?.cari_kart?.ilce || ''}</div>
               </div>
               <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fatura Durumu</h4>
                  <div style={{ 
                    padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, width: 'fit-content',
                    background: fatura?.odeme_durumu === 'Ödendi' ? '#f0fdf4' : (fatura?.odeme_durumu === 'İptal Edildi' ? '#fef2f2' : '#f8fafc'),
                    color: fatura?.odeme_durumu === 'Ödendi' ? '#15803d' : (fatura?.odeme_durumu === 'İptal Edildi' ? '#dc2626' : '#64748b'),
                  }}>
                    {fatura?.odeme_durumu || 'Bekliyor'}
                  </div>
               </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="card">
            <div className="card-header">Fatura Kalemleri</div>
            <div className="card-body" style={{ padding: 0 }}>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Açıklama</th>
                      <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', width: '100px', textTransform: 'uppercase' }}>Miktar</th>
                      <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', width: '120px', textTransform: 'uppercase' }}>Birim Fiyat</th>
                      <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', width: '80px', textTransform: 'uppercase' }}>KDV</th>
                      <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', width: '120px', textTransform: 'uppercase' }}>Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kalemler.length === 0 && (
                       <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>Fatura kalem bilgisi bulunamadı.</td></tr>
                    )}
                    {kalemler.map((k, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600 }}>{k.aciklama}</td>
                        <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '14px' }}>{k.miktar} {k.birim}</td>
                        <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '14px' }}>{k.birim_fiyat?.toLocaleString('tr-TR')} ₺</td>
                        <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#64748b' }}>%{k.kdv_oran}</td>
                        <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '15px', fontWeight: 800 }}>{k.toplam_tutar?.toLocaleString('tr-TR')} ₺</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>

        {/* Totals Summary Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '24px' }}>
           <div className="card">
              <div className="card-header">Finansal Özet</div>
              <div className="card-body" style={{ padding: '24px' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                       <span style={{ color: '#64748b' }}>Ara Toplam</span>
                       <span style={{ fontWeight: 700 }}>{fatura?.toplam?.toLocaleString('tr-TR')} ₺</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                       <span style={{ color: '#64748b' }}>KDV Tutarı</span>
                       <span style={{ fontWeight: 700 }}>{fatura?.kdv?.toLocaleString('tr-TR')} ₺</span>
                    </div>
                    <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <span style={{ fontSize: '16px', fontWeight: 800 }}>GENEL TOPLAM</span>
                       <span style={{ fontSize: '20px', fontWeight: 900, color: '#3b82f6' }}>{fatura?.gtoplam?.toLocaleString('tr-TR')} ₺</span>
                    </div>
                 </div>

                 {fatura?.aciklama && (
                    <div style={{ marginTop: '32px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                       <h5 style={{ margin: '0 0 8px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Notlar</h5>
                       <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>{fatura.aciklama}</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        onConfirm={handleCancelAction}
        title="Faturayı İptal Et"
        message="Bu faturayı iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve cari bakiyeyi etkiler."
        type="danger"
        confirmText="Evet, İptal Et"
      />
      
      <div style={{ display: 'none' }}>
         <FaturaBaski ref={printRef} fatura={fatura} kalemler={kalemler} />
      </div>
    </div>
  )
}
