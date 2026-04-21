"use client"

import React, { forwardRef, useEffect, useState } from 'react'

interface FirmData {
  firma_adi?: string
  vergi_no?: string
  vergi_dairesi?: string
  tel?: string
  adres?: string
  iban?: string
  banka_adi?: string
}

interface TeklifBaskiProps {
  teklif: any
  kalemler: any[]
  cari: any
}

const TeklifBaski = forwardRef<HTMLDivElement, TeklifBaskiProps>(({ teklif, kalemler, cari }, ref) => {
  const [firmData, setFirmData] = useState<FirmData>({})

  useEffect(() => {
    try {
      const data = localStorage.getItem('sm_firm_data')
      if (data) setFirmData(JSON.parse(data))
    } catch(e) {}
  }, [])

  if (!teklif) return null

  // KDV oranlarına göre gruplama
  const kdvGruplari: Record<number, number> = {}
  kalemler.forEach(k => {
     let lineTotal = k.miktar * k.birim_fiyat
     let vergi = 0
     if (k.kdv_dahil) {
        vergi = lineTotal - (lineTotal / (1 + (k.kdv_oran || 20)/100))
     } else {
        vergi = lineTotal * ((k.kdv_oran || 20)/100)
     }
     if(!kdvGruplari[k.kdv_oran || 20]) kdvGruplari[k.kdv_oran || 20] = 0
     kdvGruplari[k.kdv_oran || 20] += vergi
  })

  return (
    <div ref={ref} className="teklif-print-area" style={{ 
      width: '210mm', minHeight: '297mm', padding: '15mm', 
      background: '#fff', color: '#000', fontSize: '12px', boxSizing: 'border-box',
      fontFamily: '"Inter", sans-serif', position: 'relative'
    }}>
      
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid #3b82f6', paddingBottom: '15px', marginBottom: '25px' }}>
         <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ width: '80px', height: '80px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#94a3b8', fontSize: '16px' }}>
               LOGO
            </div>
            <div>
               <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{firmData.firma_adi || 'Servis Master Demo'}</h2>
               <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                  VD: {firmData.vergi_dairesi || '-'} | V.No: {firmData.vergi_no || '-'}<br/>
                  Tel: {firmData.tel || '-'}<br/>
                  {firmData.adres || 'Adres bilgisi girilmemiştir.'}
               </div>
            </div>
         </div>
         <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: 900, color: '#3b82f6' }}>TEKLİF FORMU</h1>
            <table style={{ marginLeft: 'auto', fontSize: '11px', textAlign: 'right' }}>
               <tbody>
                  <tr><td style={{ color: '#64748b', paddingRight: '12px' }}>Teklif No:</td><td style={{ fontWeight: 'bold', fontSize: '14px' }}>{teklif.teklif_no}</td></tr>
                  <tr><td style={{ color: '#64748b', paddingRight: '12px' }}>Düzenleme Tarihi:</td><td style={{ fontWeight: 'bold' }}>{new Date(teklif.tarih).toLocaleDateString('tr-TR')}</td></tr>
                  <tr><td style={{ color: '#64748b', paddingRight: '12px' }}>Geçerlilik Tarihi:</td><td style={{ fontWeight: 'bold', color: '#ef4444' }}>{teklif.gecerlilik_tarihi ? new Date(teklif.gecerlilik_tarihi).toLocaleDateString('tr-TR') : '-'}</td></tr>
               </tbody>
            </table>
         </div>
      </div>

      {/* MÜŞTERİ BİLGİLERİ */}
      <div style={{ marginBottom: '30px' }}>
         <div style={{ padding: '6px 12px', background: '#f8fafc', borderLeft: '4px solid #3b82f6', fontSize: '10px', fontWeight: 'bold', color: '#3b82f6', textTransform: 'uppercase', marginBottom: '10px' }}>Teklif Sunulan Müşteri</div>
         <div style={{ display: 'flex', gap: '30px' }}>
            <div style={{ flex: 1 }}>
               <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>{cari?.yetkili || 'Belirtilmedi'}</div>
               <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.6 }}>
                  {cari?.adres || 'Adres bilgisi mevcut değil.'}<br/>
                  {cari?.tel ? `Tel: ${cari.tel}` : ''} {cari?.mail ? `| E-posta: ${cari.mail}` : ''}
               </div>
            </div>
            <div style={{ width: '180px', fontSize: '11px', color: '#475569' }}>
               <strong>Vergi Dairesi:</strong> {cari?.vergi_dairesi || '-'}<br/>
               <strong>Vergi No:</strong> {cari?.vergi_no || '-'}
            </div>
         </div>
      </div>

      {/* TEKLİF KALEMLERİ */}
      <div style={{ minHeight: '120mm' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
               <tr style={{ background: '#3b82f6', color: '#fff' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', width: '30px' }}>#</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Ürün / Hizmet Açıklaması</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '70px' }}>Miktar</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', width: '90px' }}>Birim Fiyat</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>KDV</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', width: '100px' }}>Toplam Tutar</th>
               </tr>
            </thead>
            <tbody>
               {kalemler.map((kalem, i) => {
                  let lineTotal = kalem.miktar * kalem.birim_fiyat
                  let vergi = kalem.kdv_dahil ? (lineTotal - (lineTotal / (1 + (kalem.kdv_oran || 20)/100))) : (lineTotal * ((kalem.kdv_oran || 20)/100))
                  let gTotal = kalem.kdv_dahil ? lineTotal : lineTotal + vergi
                  let unitPrice = kalem.kdv_dahil ? (kalem.birim_fiyat / (1 + (kalem.kdv_oran || 20)/100)) : kalem.birim_fiyat

                  return (
                     <tr key={kalem.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 !== 0 ? '#f8fafc' : '#fff' }}>
                        <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{i+1}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{kalem.aciklama}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{kalem.miktar} <span style={{ fontSize:'9px', color:'#94a3b8' }}>{kalem.birim}</span></td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>{unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>%{kalem.kdv_oran}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>{gTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                     </tr>
                  )
               })}
            </tbody>
         </table>
      </div>

      {/* ÖZET VE NOTLAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
         <div style={{ flex: 1, paddingRight: '40px' }}>
            <div style={{ marginBottom: '20px' }}>
               <strong style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Teklif Notları & Koşullar:</strong>
               <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  {teklif.notlar || 'Bu teklif kapsamında ek bir not bulunmamaktadır.'}
               </div>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>
               * Teklifimiz geçerlilik tarihi sonuna kadar bağlayıcıdır. <br/>
               * Sipariş onayı sonrası teslimat takvimi netleşecektir.
            </div>
         </div>

         <div style={{ width: '280px' }}>
            <div style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
               <span style={{ color: '#64748b' }}>Ara Toplam:</span>
               <span style={{ fontWeight: 'bold' }}>{(teklif.toplam || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
            </div>
            
            <div style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
               {Object.entries(kdvGruplari).map(([oran, tutar]) => (
                  <div key={oran} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#64748b' }}>
                     <span>Hesaplanan KDV (%{oran}):</span>
                     <span>{tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                  </div>
               ))}
            </div>

            <div style={{ padding: '15px 0', display: 'flex', justifyContent: 'space-between', fontSize: '20px', color: '#0f172a', alignItems: 'center' }}>
               <span style={{ fontSize: '13px', fontWeight: 'bold' }}>GENEL TOPLAM:</span>
               <span style={{ fontWeight: 900, color: '#3b82f6' }}>{(teklif.genel_toplam || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
            </div>
         </div>
      </div>

      {/* FOOTER */}
      <div style={{ position: 'absolute', bottom: '15mm', left: '15mm', right: '15mm' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
            <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '40px' }}>Müşteri Onayı</div>
               <div style={{ borderBottom: '1px solid #cbd5e1', width: '180px' }}></div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '9px', color: '#94a3b8' }}>
               Bu belge Servis Master Pro ile oluşturulmuştur. <br/>
               Belge No: {teklif.teklif_no} | Sayfa 1 / 1
            </div>
            <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '40px' }}>Firma Yetkilisi</div>
               <div style={{ borderBottom: '1px solid #cbd5e1', width: '180px' }}></div>
            </div>
         </div>
      </div>

    </div>
  )
})

TeklifBaski.displayName = 'TeklifBaski'

export default TeklifBaski
