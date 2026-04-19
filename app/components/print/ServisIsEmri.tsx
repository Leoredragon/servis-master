"use client"

import React, { forwardRef, useEffect, useState } from 'react'

interface FirmData {
  firma_adi?: string
  vergi_no?: string
  vergi_dairesi?: string
  tel?: string
  adres?: string
}

interface ServisIsEmriProps {
  servis: any
  islemler: any[]
}

const ServisIsEmri = forwardRef<HTMLDivElement, ServisIsEmriProps>(({ servis, islemler }, ref) => {
  const [firmData, setFirmData] = useState<FirmData>({})

  useEffect(() => {
    try {
      const data = localStorage.getItem('sm_firm_data')
      if (data) setFirmData(JSON.parse(data))
    } catch(e) {}
  }, [])

  if (!servis) return null

  // Tablo hesaplamaları
  let araToplam = 0
  let kdvToplami = 0
  let genelToplam = 0
  islemler.forEach(isl => {
     let lineTutar = isl.miktar * isl.birim_fiyat
     if (isl.kdv_dahil) {
        genelToplam += lineTutar
        let base = lineTutar / (1 + (isl.kdv_oran || 20)/100)
        araToplam += base
        kdvToplami += (lineTutar - base)
     } else {
        araToplam += lineTutar
        let vergi = lineTutar * ((isl.kdv_oran || 20)/100)
        kdvToplami += vergi
        genelToplam += (lineTutar + vergi)
     }
  })

  return (
    <div ref={ref} className="print-area" style={{ 
      width: '210mm', minHeight: '297mm', padding: '15mm', 
      background: '#fff', color: '#000', fontSize: '12px', boxSizing: 'border-box',
      fontFamily: '"Inter", sans-serif', position: 'relative'
    }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2563eb', paddingBottom: '10px', marginBottom: '20px' }}>
         <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ width: '70px', height: '70px', background: '#f1f5f9', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#94a3b8', fontSize: '14px' }}>
               LOGO
            </div>
            <div>
               <h2 style={{ margin: '0 0 5px', fontSize: '18px', fontWeight: 900, color: '#1e293b' }}>{firmData.firma_adi || 'Servis Master Demo Firma'}</h2>
               <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
                  {firmData.vergi_dairesi ? `VD: ${firmData.vergi_dairesi}` : ''} {firmData.vergi_no ? `| V.No: ${firmData.vergi_no}` : ''} <br/>
                  {firmData.tel ? `Tel: ${firmData.tel}` : ''} <br/>
                  {firmData.adres || 'Örnek Sanayi Sitesi, 1. Cad. No:1'}
               </div>
            </div>
         </div>
         <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: '0 0 5px', fontSize: '24px', fontWeight: 900, color: '#1e3a8a', letterSpacing: '-0.5px' }}>SERVİS İŞ EMRİ</h1>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{servis.servis_no}</div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
               Tarih: {new Date(servis.giris_tarihi).toLocaleDateString('tr-TR')} <br/>
               Durum: <strong>{servis.durum}</strong>
            </div>
         </div>
      </div>

      {/* MÜŞTERİ & ARAÇ BİLGİLERİ */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
         {/* Müşteri Kutusu */}
         <div style={{ flex: 1, border: '1px solid #cbd5e1', padding: '10px', borderRadius: '4px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase' }}>Müşteri Bilgileri</div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>{servis.cari_id?.yetkili || 'Belirtilmedi'}</div>
            <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.5 }}>
               Grup: {servis.cari_id?.grup || '-'}<br/>
               Telefon: {servis.cari_id?.tel || '-'} {servis.cari_id?.cep ? `/ ${servis.cari_id.cep}` : ''}<br/>
               Vergi: {servis.cari_id?.vergi_dairesi || '-'} / {servis.cari_id?.vergi_no || '-'}<br/>
               Adres: {servis.cari_id?.adres || '-'}
            </div>
         </div>
         
         {/* Araç Kutusu */}
         <div style={{ flex: 1, border: '1px solid #cbd5e1', padding: '10px', borderRadius: '4px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase' }}>Araç Bilgileri</div>
            <div style={{ fontWeight: 900, fontSize: '16px', color: '#1e3a8a', marginBottom: '2px', fontFamily: 'monospace' }}>{servis.arac_id?.plaka || 'PLAKASIZ'}</div>
            <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.5 }}>
               Marka/Model: {servis.arac_id?.marka} {servis.arac_id?.model} ({servis.arac_id?.yil})<br/>
               Renk: {servis.arac_id?.renk || '-'} | Geliş KM: {servis.gelis_kmsi || '-'} <br/>
               Motor No: {servis.arac_id?.motor_no || '-'}<br/>
               Şasi No: {servis.arac_id?.sasi_no || '-'}
            </div>
         </div>
      </div>

      {/* ŞİKAYET VE İŞLEM */}
      <div style={{ marginBottom: '20px' }}>
         <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px', marginBottom: '10px' }}>
            <strong style={{ fontSize: '11px', color: '#64748b' }}>Müşteri Şikayeti:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#0f172a' }}>{servis.sikayet || 'Belirtilmedi'}</p>
         </div>
         <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px' }}>
            <strong style={{ fontSize: '11px', color: '#64748b' }}>Yapılan İşlem / Arıza Tespiti:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#0f172a' }}>{servis.yapilan_islem || 'Henüz bir işlem/not girilmedi.'}</p>
         </div>
      </div>

      {/* PARÇALAR TABLOSU */}
      <div style={{ marginBottom: '20px' }}>
         <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '6px' }}>Kullanılan Parçalar ve İşçilik</div>
         <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '11px' }}>
            <thead>
               <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '6px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>#</th>
                  <th style={{ padding: '6px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>Açıklama</th>
                  <th style={{ padding: '6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>Tür</th>
                  <th style={{ padding: '6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>Miktar</th>
                  <th style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Birim Fiyat</th>
                  <th style={{ padding: '6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>KDV</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Tutar</th>
               </tr>
            </thead>
            <tbody>
               {islemler.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '10px', textAlign: 'center' }}>İşlem eklenmedi.</td></tr>
               )}
               {islemler.map((isl, idx) => {
                  let tutar = 0
                  if(isl.kdv_dahil) tutar = isl.miktar * isl.birim_fiyat
                  else tutar = (isl.miktar * isl.birim_fiyat) * (1 + (isl.kdv_oran||0)/100)
                  return (
                     <tr key={isl.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 !== 0 ? '#f8fafc' : '#fff' }}>
                        <td style={{ padding: '6px', borderRight: '1px solid #e2e8f0' }}>{idx+1}</td>
                        <td style={{ padding: '6px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{isl.aciklama}</td>
                        <td style={{ padding: '6px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{isl.islem_turu}</td>
                        <td style={{ padding: '6px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{isl.miktar} {isl.birim}</td>
                        <td style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>{isl.birim_fiyat?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                        <td style={{ padding: '6px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>%{isl.kdv_oran || 20}</td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                     </tr>
                  )
               })}
            </tbody>
         </table>
      </div>

      {/* ÖZET VE ÖDEME */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
         <div style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', maxWidth: '250px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Tahsilat Bilgisi</div>
            <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
               <span>Durum:</span>
               <strong>{servis.odeme_durumu}</strong>
            </div>
            <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
               <span>Ödenen:</span>
               <strong>{servis.odenen_tutar?.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</strong>
            </div>
            <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
               <span>Kalan:</span>
               <strong>{(genelToplam - (servis.odenen_tutar || 0)).toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</strong>
            </div>
         </div>

         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ width: '250px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                  <span>Ara Toplam:</span>
                  <span>{araToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #cbd5e1' }}>
                  <span>KDV Toplamı:</span>
                  <span>{kdvToplami.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, padding: '8px', marginTop: '6px', background: '#1e3a8a', color: '#fff', borderRadius: '4px' }}>
                  <span>Genel Toplam:</span>
                  <span>{genelToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
               </div>
            </div>
         </div>
      </div>

      {/* FOOTER */}
      <div style={{ position: 'absolute', bottom: '15mm', left: '15mm', right: '15mm' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '11px', color: '#64748b' }}>Teslim Alan Müşteri</div>
               <div style={{ marginTop: '20px', borderBottom: '1px solid #000', width: '150px' }}></div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '9px', color: '#94a3b8' }}>
               Bu belge Servis Master Pro ile oluşturulmuştur. <br/>
               Sayfa 1 / 1
            </div>
            <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '11px', color: '#64748b' }}>Servis Yetkilisi / Teknisyen</div>
               <div style={{ marginTop: '20px', borderBottom: '1px solid #000', width: '150px' }}></div>
            </div>
         </div>
      </div>

    </div>
  )
})

ServisIsEmri.displayName = 'ServisIsEmri'

export default ServisIsEmri
