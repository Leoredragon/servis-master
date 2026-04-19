"use client"

import React, { RefObject } from 'react'
import { useReactToPrint } from 'react-to-print'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface PrintButtonProps {
  contentRef: RefObject<HTMLDivElement>
  fileName: string
}

const Icons = {
  pdf: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  print: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
}

export default function PrintButton({ contentRef, fileName }: PrintButtonProps) {
  // react-to-print kullanımı
  const handlePrint = useReactToPrint({
    contentRef: contentRef as any,
    documentTitle: fileName,
  })

  // PDF Oluşturma (html2canvas + jsPDF)
  const handleDownloadPdf = async () => {
    if (!contentRef.current) return
    
    // Geçici olarak yazdırılacak alana arka plan beyaz ekle
    const element = contentRef.current
    const prevBg = element.style.backgroundColor
    element.style.backgroundColor = '#ffffff'

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${fileName}.pdf`)
    } catch (error) {
      console.error("PDF oluşturulurken hata:", error)
      alert("PDF oluşturulurken bir hata oluştu.")
    } finally {
      element.style.backgroundColor = prevBg
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }} className="no-print">
      <button 
        onClick={handlePrint}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
          background: '#eff6ff', color: '#2563eb', border: '1.5px solid #bfdbfe',
          borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: '0.2s'
        }}
      >
        {Icons.print} Yazdır
      </button>
      
      <button 
         onClick={handleDownloadPdf}
         style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
          background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca',
          borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: '0.2s'
        }}
      >
        {Icons.pdf} PDF İndir
      </button>
    </div>
  )
}
