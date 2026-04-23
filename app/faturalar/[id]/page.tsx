"use client"

import { useState, useEffect, use } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const Icons = {
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  print: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  hash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
}

export default function FaturaDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [fatura, setFatura] = useState<any>(null)
  const [kalemler, setKalemler] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const { data: fData, error: fErr } = await supabase
          .from('fatura')
          .select('*, cari_kart(*)')
          .eq('id', resolvedParams.id)
          .single()

        if (fErr) throw fErr
        setFatura(fData)

        const { data: kData, error: kErr } = await supabase
          .from('fat_isl')
          .select('*')
          .eq('fatura_id', resolvedParams.id)
          .order('id', { ascending: true })

        if (kErr) throw kErr
        setKalemler(kData || [])

      } catch (err: any) {
        console.error('Veri yükleme hatası:', err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="skeleton" style={{ height: '40px', width: '200px' }} />
        <div className="skeleton" style={{ height: '300px', width: '100%' }} />
      </div>
    )
  }

  if (!fatura) {
    return (
      <div style={{ padding: '80px', textAlign: 'center' }}>
        <h2 style={{ color: '#64748b' }}>Fatura bulunamadı.</h2>
        <Link href="/faturalar" style={{ color: '#3b82f6', fontWeight: 700, textDecoration: 'none', marginTop: '10px', display: 'inline-block' }}>Faturalara Dön</Link>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn" style={{ padding: '0 32px' }}>
      {/* Üst Bar / Geri Dönüş */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => router.push('/faturalar')} 
            style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
          >
            {Icons.back}
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Fatura Detayı</h1>
              <span style={{ 
                padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                background: fatura.fatura_turu === 'Satış' ? '#f0fdf4' : '#fef2f2',
                color: fatura.fatura_turu === 'Satış' ? '#15803d' : '#ef4444'
              }}>
                {fatura.fatura_turu}
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{fatura.evrak_no} numaralı faturanın detayları.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => window.print()} 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            {Icons.print} Yazdır / PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Sol Kolon: Fatura Başlık ve Kalemler */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Fatura Bilgi Özeti */}
          <div className="card">
            <div className="card-header">Fatura Bilgileri</div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <InfoItem icon={Icons.user} label="MÜŞTERİ / CARİ" value={fatura.cari_kart?.yetkili || '—'} subValue={fatura.cari_kart?.tel} />
              <InfoItem icon={Icons.calendar} label="FATURA TARİHİ" value={new Date(fatura.fat_tarih).toLocaleDateString('tr-TR')} />
              <InfoItem icon={Icons.hash} label="EVRAK NO" value={fatura.evrak_no} />
              <InfoItem 
                icon={Icons.hash} 
                label="ÖDEME DURUMU" 
                value={fatura.odeme_durumu || 'Bekliyor'} 
                color={fatura.odeme_durumu === 'Ödendi' ? '#10b981' : '#64748b'} 
              />
            </div>
          </div>

          {/* Kalemler Tablosu */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
               <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Fatura Kalemleri</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Açıklama</th>
                  <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '11px', color: '#94a3b8', width: '80px' }}>Miktar</th>
                  <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: '11px', color: '#94a3b8', width: '110px' }}>Birim Fiyat</th>
                  <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '11px', color: '#94a3b8', width: '90px' }}>KDV</th>
                  <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: '11px', color: '#94a3b8', width: '120px' }}>Toplam</th>
                </tr>
              </thead>
              <tbody>
                {kalemler.map((k, index) => (
                  <tr key={k.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{k.aciklama}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '14px' }}>{k.miktar} {k.birim}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '14px' }}>{k.birim_fiyat?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>%{k.kdv_oran}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '14px', fontWeight: 700 }}>{k.toplam_tutar?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sağ Kolon: Toplamlar ve Notlar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card shadow-sm" style={{ borderTop: `4px solid ${fatura.fatura_turu === 'Satış' ? '#10b981' : '#ef4444'}` }}>
            <div className="card-header">Fatura Özeti</div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Ara Toplam</span>
                  <span style={{ fontWeight: 700 }}>{fatura.toplam?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>KDV Toplam</span>
                  <span style={{ fontWeight: 700 }}>{fatura.kdv?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                </div>
                <div style={{ height: '1.5px', background: '#e2e8f0', margin: '8px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '16px' }}>GENEL TOPLAM</span>
                  <span style={{ color: '#3b82f6', fontWeight: 900, fontSize: '22px' }}>{fatura.gtoplam?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                </div>
              </div>

              {fatura.aciklama && (
                <div style={{ marginTop: '32px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Notlar / Açıklama</div>
                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{fatura.aciklama}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value, subValue, color }: any) {
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: color || '#1e293b', marginTop: '2px' }}>{value}</div>
        {subValue && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>{subValue}</div>}
      </div>
    </div>
  )
}
