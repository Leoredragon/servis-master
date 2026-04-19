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

interface FaturaBaskiProps {
  fatura: any
  kalemler: any[]
}

const FaturaBaski = forwardRef<HTMLDivElement, FaturaBaskiProps>(({ fatura, kalemler }, ref) => {
  const [firmData, setFirmData] = useState<FirmData>({})

  useEffect(() => {
    try {
      const data = localStorage.getItem('sm_firm_data')
      if (data) setFirmData(JSON.parse(data))
    } catch(e) {}
  }, [])

  if (!fatura) return null

  const isSatis = fatura.fatura_turu === 'Satış'
  const baslik = isSatis ? "SATIŞ FATURASI" : "ALIŞ FATURASI"
  
  // Satici / Alici bilgileri ataması
  const satici = isSatis ? firmData : fatura.cari_id
  const alici = isSatis ? fatura.cari_id : firmData

  const formatCari = (c: any) => ({
     isim: c?.firma_adi || c?.yetkili || 'Belirtilmedi',
     vd: c?.vergi_dairesi || '-',
     vno: c?.vergi_no || '-',
     tel: c?.tel || '-',
     adres: c?.adres || '-'
  })

  const saticiData = formatCari(satici)
  const aliciData = formatCari(alici)

  // KDV oranlarına göre gruplama örneği
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
    <div ref={ref} className="print-area" style={{ 
      width: '210mm', minHeight: '297mm', padding: '15mm', 
      background: '#fff', color: '#000', fontSize: '12px', boxSizing: 'border-box',
      fontFamily: '"Inter", sans-serif', position: 'relative'
    }}>
      
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid #1e3a8a', paddingBottom: '15px', marginBottom: '20px' }}>
         <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ width: '80px', height: '80px', background: '#f8fafc', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#94a3b8', fontSize: '16px' }}>
               LOGO
            </div>
            <div>
               <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{firmData.firma_adi || 'Servis Master A.Ş.'}</h2>
               <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                  VD: {firmData.vergi_dairesi || '-'} | V.No: {firmData.vergi_no || '-'}<br/>
                  Tel: {firmData.tel || '-'}<br/>
                  {firmData.adres || 'Adres bilgisi girilmemiştir.'}
               </div>
            </div>
         </div>
         <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: 900, color: '#1e3a8a' }}>{baslik}</h1>
            <table style={{ marginLeft: 'auto', fontSize: '11px', textAlign: 'right' }}>
               <tbody>
                  <tr><td style={{ color: '#64748b', paddingRight: '12px' }}>Fatura No:</td><td style={{ fontWeight: 'bold', fontSize: '14px' }}>{fatura.evrak_no}</td></tr>
                  <tr><td style={{ color: '#64748b', paddingRight: '12px' }}>Fatura Tarihi:</td><td style={{ fontWeight: 'bold' }}>{new Date(fatura.fat_tarih).toLocaleDateString('tr-TR')}</td></tr>
                  <tr><td style={{ color: '#64748b', paddingRight: '12px' }}>Düzenleme Z.:</td><td style={{ fontWeight: 'bold' }}>{new Date(fatura.created_at || fatura.fat_tarih).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</td></tr>
               </tbody>
            </table>
         </div>
      </div>

      {/* TARAFLAR */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
         <div style={{ flex: 1 }}>
            <div style={{ padding: '6px 10px', background: '#f8fafc', borderTop: '2px solid #94a3b8', borderBottom: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold', color: '#475569', letterSpacing: '0.5px' }}>SAYIN (ALICI)</div>
            <div style={{ padding: '10px' }}>
               <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>{aliciData.isim}</div>
               <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.5 }}>
                  VD: {aliciData.vd} / V.No: {aliciData.vno}<br/>
                  Tel: {aliciData.tel}<br/>
                  Adres: {aliciData.adres}
               </div>
            </div>
         </div>
         <div style={{ width: '1px', background: '#e2e8f0' }}></div>
         <div style={{ flex: 1 }}>
            <div style={{ padding: '6px 10px', background: '#f8fafc', borderTop: '2px solid #94a3b8', borderBottom: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold', color: '#475569', letterSpacing: '0.5px' }}>SATICI</div>
            <div style={{ padding: '10px' }}>
               <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>{saticiData.isim}</div>
               <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.5 }}>
                  VD: {saticiData.vd} / V.No: {saticiData.vno}<br/>
                  Tel: {saticiData.tel}<br/>
                  Adres: {saticiData.adres}
               </div>
            </div>
         </div>
      </div>

      {/* KALEMLER */}
      <div style={{ minHeight: '130mm' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
               <tr style={{ background: '#1e3a8a', color: '#fff' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', width: '30px' }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Ürün / Hizmet Açıklaması</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '70px' }}>Miktar</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: '90px' }}>Birim Fiyat</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '50px' }}>KDV</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: '90px' }}>KDV Tutarı</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: '100px' }}>Toplam Tutar</th>
               </tr>
            </thead>
            <tbody>
               {kalemler.map((kalem, i) => {
                  let lineTotal = kalem.miktar * kalem.birim_fiyat
                  let vergi = kalem.kdv_dahil ? (lineTotal - (lineTotal / (1 + (kalem.kdv_oran || 20)/100))) : (lineTotal * ((kalem.kdv_oran || 20)/100))
                  let gTotal = kalem.kdv_dahil ? lineTotal : lineTotal + vergi
                  let unitP = kalem.kdv_dahil ? (kalem.birim_fiyat / (1 + (kalem.kdv_oran || 20)/100)) : kalem.birim_fiyat

                  return (
                     <tr key={kalem.id} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 !== 0 ? '#f8fafc' : '#fff' }}>
                        <td style={{ padding: '8px 10px' }}>{i+1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>{kalem.aciklama}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{kalem.miktar} <span style={{ fontSize:'9px', color:'#64748b' }}>{kalem.birim}</span></td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{unitP.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>%{kalem.kdv_oran}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>{vergi.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>{gTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                     </tr>
                  )
               })}
            </tbody>
         </table>
      </div>

      {/* ALT ÖZET */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '20px' }}>
         {/* Notlar & Banka */}
         <div style={{ flex: 1, paddingRight: '30px' }}>
            <div style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '6px', fontSize: '11px', marginBottom: '15px', minHeight: '60px' }}>
               <strong style={{ color: '#475569', display: 'block', marginBottom: '4px' }}>Notlar / Açıklamalar:</strong>
               {fatura.aciklama || 'Bu fatura kapsamında not bulunmamaktadır.'}
            </div>
            
            <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
               <strong>Ödeme Durumu:</strong> {fatura.odeme_durumu} <br/>
               <strong>Banka Bilgileri:</strong> {firmData.banka_adi || 'Belirtilmedi'} <br/>
               <strong>IBAN:</strong> {firmData.iban || 'Belirtilmedi'}
            </div>
         </div>

         {/* Toplam Kutusu */}
         <div style={{ width: '300px', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
               <span style={{ color: '#475569' }}>Ara Toplam:</span>
               <span style={{ fontWeight: 'bold' }}>{(fatura.toplam || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
            </div>
            
            <div style={{ padding: '12px 15px', borderBottom: '1px solid #cbd5e1' }}>
               {Object.entries(kdvGruplari).map(([oran, tutar]) => (
                  <div key={oran} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#475569' }}>
                     <span>Hesaplanan KDV (%{oran}):</span>
                     <span>{tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                  </div>
               ))}
            </div>

            <div style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', background: '#1e3a8a', color: '#fff', alignItems: 'center' }}>
               <span style={{ fontSize: '14px', fontWeight: 'bold' }}>GENEL TOPLAM:</span>
               <span style={{ fontWeight: 900 }}>{(fatura.gtoplam || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
            </div>
         </div>
      </div>

      {/* FOOTER İMZA & KAŞE */}
      <div style={{ position: 'absolute', bottom: '15mm', left: '15mm', right: '15mm' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'left', fontSize: '9px', color: '#94a3b8' }}>
               Mali değeri yoktur, bilgilendirme amaçlıdır. <br/>
               Bu fatura Servis Master Pro ile düzenlenmiştir.
            </div>
            <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '40px' }}>Düzenleyen (Kaşe / İmza)</div>
               <div style={{ borderBottom: '1px dotted #000', width: '200px' }}></div>
            </div>
         </div>
      </div>

    </div>
  )
})

FaturaBaski.displayName = 'FaturaBaski'

export default FaturaBaski
