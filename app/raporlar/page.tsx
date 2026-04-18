"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const Icons = {
  excel: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  chart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  service: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  stock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 1 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  trendingUp: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  trendingDown: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
}

const exportToCSV = (data: any[], fileNamePrefix: string) => {
  if (data.length === 0) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(obj => Object.values(obj).join(',')).join('\n')
  const csvContent = "\ufeff" + headers + '\n' + rows
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  const dateStr = new Date().toISOString().split('T')[0]
  link.setAttribute("href", url)
  link.setAttribute("download", `${fileNamePrefix}-${dateStr}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function RaporlarPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  const [data, setData] = useState<any>({
    services: [],
    stocks: [],
    stockMovements: [],
    customers: []
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [srv, stk, mov, cur] = await Promise.all([
      supabase.from('servis_karti').select('*, cari_kart(yetkili, tel), arac(plaka, marka, model)').gte('giris_tarihi', dateRange.start).lte('giris_tarihi', dateRange.end + 'T23:59:59'),
      supabase.from('stok').select('*'),
      supabase.from('stok_hareket').select('*, stok(ad)').gte('islem_tarihi', dateRange.start).lte('islem_tarihi', dateRange.end + 'T23:59:59'),
      supabase.from('cari_kart').select('*, arac(count), servis_karti(count, toplam_tutar)')
    ])

    setData({
      services: srv.data || [],
      stocks: stk.data || [],
      stockMovements: mov.data || [],
      customers: cur.data || []
    })
    setLoading(false)
  }, [dateRange])

  useEffect(() => { fetchData() }, [fetchData])

  // --- Tab 1: Genel Özet Calculations ---
  const generalSummary = useMemo(() => {
    const s = data.services
    const totalCiro = s.reduce((acc: number, curr: any) => acc + (curr.toplam_tutar || 0), 0)
    const completedCount = s.filter((x: any) => x.durum === 'Tamamlandı' || x.durum === 'Teslim Edildi').length
    const avgService = s.length > 0 ? totalCiro / s.length : 0

    // Marka Dağılımı
    const brands: any = {}
    s.forEach((x: any) => {
      const b = x.arac?.marka || 'Bilinmeyen'
      brands[b] = (brands[b] || 0) + 1
    })
    const topBrands = Object.entries(brands).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5)

    // Top Customers in Period
    const custs: any = {}
    s.forEach((x: any) => {
      const c = x.cari_kart?.yetkili || 'Bilinmeyen'
      custs[c] = (custs[c] || 0) + (x.toplam_tutar || 0)
    })
    const topCustomers = Object.entries(custs).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5)

    return { totalCiro, totalCount: s.length, completedCount, avgService, topBrands, topCustomers }
  }, [data.services])

  // --- Tab 2: Technician Calculations ---
  const technicianStats = useMemo(() => {
    const techMap: any = {}
    data.services.forEach((s: any) => {
      const t = s.teknisyen || 'Atanmamış'
      if (!techMap[t]) techMap[t] = { count: 0, ciro: 0 }
      techMap[t].count++
      techMap[t].ciro += (s.toplam_tutar || 0)
    })
    return Object.entries(techMap).sort((a: any, b: any) => b[1].ciro - a[1].ciro)
  }, [data.services])

  // --- Tab 3: Stock Calculations ---
  const stockSummary = useMemo(() => {
    const totalValue = data.stocks.reduce((acc: number, curr: any) => acc + (curr.miktar * (curr.a_fiyat || 0)), 0)
    const criticalItems = data.stocks.filter((s: any) => s.miktar <= (s.kritik_seviye || 5))
    
    // Usage ranking
    const usage: any = {}
    data.stockMovements.filter((m: any) => m.hareket_turu.includes('Çıkış') || m.hareket_turu.includes('Servis')).forEach((m: any) => {
      const name = m.stok?.ad || 'Bilinmeyen'
      usage[name] = (usage[name] || 0) + (m.miktar || 0)
    })
    const mostUsed = Object.entries(usage).sort((a: any, b: any) => b[1] - a[1]).slice(0, 8)

    return { totalValue, criticalCount: criticalItems.length, mostUsed }
  }, [data.stocks, data.stockMovements])

  // --- Render Helpers ---
  const renderTabHeader = () => (
    <div style={{ display: 'flex', gap: '8px', background: '#fff', padding: '6px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '32px', width: 'fit-content' }}>
      {[
        { id: 0, label: 'Genel Özet', icon: Icons.chart },
        { id: 1, label: 'Servis Raporları', icon: Icons.service },
        { id: 2, label: 'Stok Raporları', icon: Icons.stock },
        { id: 3, label: 'Müşteri Raporları', icon: Icons.users }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', border: 'none',
            background: activeTab === tab.id ? '#0f172a' : 'transparent',
            color: activeTab === tab.id ? '#fff' : '#64748b',
            borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  )

  const renderStatsRow = (stats: any[]) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
      {stats.map((s, idx) => (
        <div key={idx} className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: s.color }}></div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '8px' }}>{s.value}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
             {s.trend && <span style={{ color: s.trend > 0 ? '#10b981' : '#ef4444' }}>{s.trend > 0 ? Icons.trendingUp : Icons.trendingDown}</span>}
             {s.subLabel}
          </div>
        </div>
      ))}
    </div>
  )

  if (loading) return <div style={{ padding: '40px' }}><div className="skeleton" style={{ height: '60px', width: '200px', marginBottom: '32px' }} /><div className="skeleton" style={{ height: '120px', width: '100%', marginBottom: '24px' }} /><div className="skeleton" style={{ height: '400px', width: '100%' }} /></div>

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Raporlar ve Analizler</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Verilerinizi analiz edin ve geleceği planlayın.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              {Icons.calendar}
              <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', fontWeight: 600 }} />
              <span style={{ color: '#cbd5e1' }}>—</span>
              <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', fontWeight: 600 }} />
           </div>
           <button 
             onClick={() => {
               if (activeTab === 1) exportToCSV(data.services.map((s:any) => ({ No: s.servis_no, Cari: s.cari_kart?.yetkili, Arac: s.arac?.plaka, Tutar: s.toplam_tutar, Durum: s.durum })), 'servis-raporu')
               else if (activeTab === 2) exportToCSV(data.stocks, 'stok-raporu')
               else if (activeTab === 3) exportToCSV(data.customers.map((c:any) => ({ Isim: c.yetkili, Tel: c.tel, Sehir: c.sehir })), 'musteri-raporu')
             }}
             className="btn-primary" 
             style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#059669' }}
            >
              {Icons.excel} Excel'e Aktar
           </button>
        </div>
      </div>

      {renderTabHeader()}

      {/* TAB 1: GENEL ÖZET */}
      {activeTab === 0 && (
        <div className="animate-fadeIn">
           {renderStatsRow([
             { label: 'TOPLAM CİRO', value: generalSummary.totalCiro.toLocaleString('tr-TR') + ' ₺', color: '#3b82f6', subLabel: 'Seçili dönem toplamı' },
             { label: 'TOPLAM SERVİS', value: generalSummary.totalCount, color: '#8b5cf6', subLabel: 'Kayıtlı toplam adet' },
             { label: 'TAMAMLANAN', value: generalSummary.completedCount, color: '#10b981', subLabel: 'Teslim edilen araçlar' },
             { label: 'ORT. SERVİS BEDELİ', value: Math.round(generalSummary.avgService).toLocaleString('tr-TR') + ' ₺', color: '#f59e0b', subLabel: 'Hizmet başı ortalama' }
           ])}

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div className="card">
                 <div className="card-header">En Çok Servis Yapılan Markalar</div>
                 <div className="card-body">
                    {generalSummary.topBrands.map(([brand, count]: any) => (
                      <div key={brand} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ width: '100px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{brand}</div>
                        <div style={{ flex: 1, background: '#f1f5f9', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                           <div style={{ background: '#3b82f6', height: '100%', width: `${(count / generalSummary.totalCount) * 100}%` }}></div>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#64748b' }}>{count} Adet</div>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="card">
                 <div className="card-header">En Değerli Müşteriler (Dönemlik)</div>
                 <div className="card-body">
                    {generalSummary.topCustomers.map(([name, amount]: any) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                         <span style={{ fontSize: '14px', fontWeight: 600 }}>{name}</span>
                         <span style={{ fontSize: '15px', fontWeight: 800, color: '#059669' }}>{amount.toLocaleString('tr-TR')} ₺</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* TAB 2: SERVİS RAPORLARI */}
      {activeTab === 1 && (
        <div className="animate-fadeIn">
           <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
              <div className="card" style={{ padding: 0 }}>
                 <div className="card-header" style={{ padding: '20px 24px' }}>Detaylı Servis Listesi</div>
                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                       <tr>
                          <th style={{ textAlign: 'left', padding: '14px 24px', fontSize: '11px', color: '#94a3b8' }}>NO / ARAÇ</th>
                          <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: '11px', color: '#94a3b8' }}>MÜŞTERİ</th>
                          <th style={{ textAlign: 'right', padding: '14px 24px', fontSize: '11px', color: '#94a3b8' }}>TUTAR</th>
                       </tr>
                    </thead>
                    <tbody>
                       {data.services.map((s: any) => (
                         <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '16px 24px' }}>
                               <div style={{ fontSize: '14px', fontWeight: 700 }}>{s.servis_no}</div>
                               <div style={{ fontSize: '12px', color: '#64748b' }}>{s.arac?.marka} - {s.arac?.plaka}</div>
                            </td>
                            <td style={{ padding: '16px 12px', fontSize: '13px', fontWeight: 600 }}>{s.cari_kart?.yetkili}</td>
                            <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800 }}>{s.toplam_tutar?.toLocaleString('tr-TR')} ₺</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              <div className="card">
                 <div className="card-header">Teknisyen Performansı</div>
                 <div className="card-body">
                    {technicianStats.map(([tech, stats]: any) => (
                      <div key={tech} style={{ padding: '16px', border: '1px solid #f1f5f9', borderRadius: '12px', marginBottom: '12px' }}>
                         <div style={{ fontWeight: 800, fontSize: '15px' }}>{tech}</div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px' }}>
                            <span style={{ color: '#64748b' }}>{stats.count} Servis</span>
                            <span style={{ fontWeight: 700, color: '#3b82f6' }}>{stats.ciro.toLocaleString('tr-TR')} ₺</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* TAB 3: STOK RAPORLARI */}
      {activeTab === 2 && (
        <div className="animate-fadeIn">
           {renderStatsRow([
             { label: 'DEPO DEĞERİ (ALIŞ)', value: stockSummary.totalValue.toLocaleString('tr-TR') + ' ₺', color: '#10b981', subLabel: 'Mevcut tüm envanter' },
             { label: 'KRİTİK STOK', value: stockSummary.criticalCount, color: '#ef4444', subLabel: 'Acil sipariş gerektiren' },
             { label: 'HAREKET SAYISI', value: data.stockMovements.length, color: '#3b82f6', subLabel: 'Seçili dönem içi işlem' },
             { label: 'TOPLAM ÜRÜN', value: data.stocks.length, color: '#f59e0b', subLabel: 'Kayıtlı stok kartı' }
           ])}

           <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
              <div className="card" style={{ padding: 0 }}>
                 <div className="card-header" style={{ padding: '20px 24px' }}>Stok Durum Tablosu</div>
                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                       <tr>
                          <th style={{ textAlign: 'left', padding: '14px 24px', fontSize: '11px', color: '#94a3b8' }}>ÜRÜN ADI</th>
                          <th style={{ textAlign: 'center', padding: '14px 12px', fontSize: '11px', color: '#94a3b8' }}>MEVCUT</th>
                          <th style={{ textAlign: 'right', padding: '14px 24px', fontSize: '11px', color: '#94a3b8' }}>DEĞER (ALIŞ)</th>
                       </tr>
                    </thead>
                    <tbody>
                       {data.stocks.slice(0, 15).map((s: any) => (
                         <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 24px' }}>
                               <div style={{ fontSize: '13px', fontWeight: 700 }}>{s.ad}</div>
                               <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.kod}</div>
                            </td>
                            <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                               <span style={{ 
                                 fontWeight: 800, color: s.miktar <= (s.kritik_seviye || 5) ? '#ef4444' : '#0f172a',
                                 background: s.miktar <= (s.kritik_seviye || 5) ? '#fef2f2' : 'transparent',
                                 padding: '4px 8px', borderRadius: '6px'
                               }}>{s.miktar} {s.birim}</span>
                            </td>
                            <td style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 600 }}>{(s.miktar * (s.a_fiyat || 0)).toLocaleString('tr-TR')} ₺</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="card">
                 <div className="card-header">En Çok Kullanılan Parçalar</div>
                 <div className="card-body">
                    {stockSummary.mostUsed.map(([name, miktar]: any) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                         <span style={{ fontSize: '14px', fontWeight: 600 }}>{name}</span>
                         <span style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6' }}>{miktar} Adet</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* TAB 4: MÜŞTERİ RAPORLARI */}
      {activeTab === 3 && (
        <div className="animate-fadeIn">
           <div className="card" style={{ padding: 0 }}>
              <div className="card-header" style={{ padding: '20px 24px' }}>Müşteri Analiz Tablosu</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '14px 24px', fontSize: '11px', color: '#94a3b8' }}>MÜŞTERİ BİLGİSİ</th>
                    <th style={{ textAlign: 'center', padding: '14px 12px', fontSize: '11px', color: '#94a3b8' }}>ARAÇ SAYISI</th>
                    <th style={{ textAlign: 'center', padding: '14px 12px', fontSize: '11px', color: '#94a3b8' }}>SERVİS ADEDİ</th>
                    <th style={{ textAlign: 'right', padding: '14px 24px', fontSize: '11px', color: '#94a3b8' }}>TOPLAM HARCAMA</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customers.map((c: any) => {
                    const totalSrv = c.servis_karti?.length || 0
                    const totalHarcama = c.servis_karti?.reduce((acc: number, curr: any) => acc + (curr.toplam_tutar || 0), 0) || 0
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 24px' }}>
                           <div style={{ fontSize: '14px', fontWeight: 700 }}>{c.yetkili}</div>
                           <div style={{ fontSize: '11px', color: '#64748b' }}>{c.sehir} • {c.tel}</div>
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700 }}>{c.arac?.length || 0}</td>
                        <td style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700 }}>{totalSrv}</td>
                        <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 900, color: '#059669' }}>{totalHarcama.toLocaleString('tr-TR')} ₺</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
           </div>
        </div>
      )}

      <style>{`
        .card-header { padding: 18px 24px; border-bottom: 1px solid #f1f5f9; font-weight: 800; color: #0f172a; font-size: 15px; }
        .form-label { display: block; font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
      `}</style>
    </div>
  )
}
