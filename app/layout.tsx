"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './globals.css'

// ─── SVG İkonları ────────────────────────────────
const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const icons = {
  dashboard:  'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V12h6v10',
  customers:  'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
  service:    'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
  invoice:    'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  stock:      'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 001 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
  collapse:   'M15 18l-6-6 6-6',
  expand:     'M9 18l6-6-6-6',
  bell:       'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  finance:    'M12 1v22 M17 5l-5-5-5 5 M7 19l5 5 5-5',
  cash:       'M3 6h18v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z M7 10h10 M7 14h10',
  bank:       'M3 21h18 M3 10h18 M5 6l7-3 7 3 M4 10v11 M11 10v11 M15 10v11 M20 10v11',
  check:      'M2 17h20 M2 7h20 M5 12h14',
  list:       'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
  order:      'M9 12l2 2 4-4 M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  reports:    'M18 20V10 M12 20V4 M6 20v-6',
  extra:      'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z',
  support:    'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
}

const menuGroups = [
  {
    title: 'Ana Menü',
    items: [
      { path: '/',                 name: 'Anasayfa',         icon: icons.dashboard  },
      { path: '/musteriler',       name: 'Müşteriler',       icon: icons.customers  },
      { path: '/servis-kayitlari', name: 'Servis Kayıtları', icon: icons.service    },
    ]
  },
  {
    title: 'Finansal Yönetim',
    items: [
      { path: '/faturalar',        name: 'Faturalar',        icon: icons.invoice    },
      { path: '/gelir-gider',      name: 'Gelir Gider',      icon: icons.finance    },
      { path: '/kasa',             name: 'Kasa & Banka',     icon: icons.cash       },
      { path: '/cek-senet',        name: 'Çek Senet',        icon: icons.check      },
      { path: '/taksit-takip',     name: 'Taksit Takip',     icon: icons.list       },
    ]
  },
  {
    title: 'Operasyonel',
    items: [
      { path: '/stok',             name: 'Stok Yönetimi',    icon: icons.stock      },
      { path: '/teklif-siparis',   name: 'Teklif Sipariş',   icon: icons.order      },
      { path: '/raporlar',         name: 'Raporlar',         icon: icons.reports    },
    ]
  },
  {
    title: 'Sistem',
    items: [
      { path: '/ek-moduller',      name: 'Ek Modüller',      icon: icons.extra      },
      { path: '/canli-destek',     name: 'Canlı Destek',     icon: icons.support    },
    ]
  }
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const pathname = usePathname()
  const isActive = (path: string) => path === '/' ? pathname === '/' : pathname.startsWith(path)

  return (
    <html lang="tr">
      <head>
        <title>Servis Master Pro</title>
        <meta name="description" content="Profesyonel Teknik Servis Yönetim Sistemi" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Inter', sans-serif", background: '#f0f2f5' }}>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          
          {/* ─── Sidebar ─── */}
          <aside style={{
            width: collapsed ? '72px' : '256px',
            minWidth: collapsed ? '72px' : '256px',
            background: 'linear-gradient(175deg, #0d1b2a 0%, #132040 55%, #0d1929 100%)',
            display: 'flex', flexDirection: 'column',
            transition: 'width 0.26s cubic-bezier(0.4,0,0.2,1), min-width 0.26s cubic-bezier(0.4,0,0.2,1)',
            overflow: 'hidden',
            boxShadow: '4px 0 28px rgba(0,0,0,0.22)',
            position: 'relative', zIndex: 10,
          }}>
            {/* Logo */}
            <div style={{
              height: '64px', display: 'flex', alignItems: 'center',
              padding: '0 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              gap: '12px', flexShrink: 0,
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59,130,246,0.45)',
                color: '#fff',
              }}>
                <Icon d={icons.service} size={18} />
              </div>
              {!collapsed && (
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '14px', letterSpacing: '-0.2px', lineHeight: 1 }}>SERVIS</div>
                  <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '10px', letterSpacing: '2.5px', marginTop: '2px' }}>MASTER PRO</div>
                </div>
              )}
              <button onClick={() => setCollapsed(!collapsed)} style={{
                marginLeft: 'auto', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', color: '#64748b',
                borderRadius: '8px', width: '28px', height: '28px',
                cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                <Icon d={collapsed ? icons.expand : icons.collapse} size={14} />
              </button>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
              {menuGroups.map(group => (
                <div key={group.title} style={{ marginBottom: '16px' }}>
                  {!collapsed && (
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px', textTransform: 'uppercase', padding: '8px 12px', marginBottom: '4px' }}>
                      {group.title}
                    </div>
                  )}
                  {group.items.map(item => {
                    const active = isActive(item.path)
                    return (
                      <Link key={item.path} href={item.path} title={collapsed ? item.name : undefined} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: `10px ${collapsed ? '0' : '12px'}`,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        borderRadius: '10px', marginBottom: '1px',
                        textDecoration: 'none', transition: 'all 0.15s',
                        background: active ? 'linear-gradient(90deg,rgba(59,130,246,0.2)0%,rgba(59,130,246,0.05)100%)' : 'transparent',
                        borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
                        color: active ? '#60a5fa' : '#94a3b8',
                      }}>
                        <span style={{ flexShrink: 0, display: 'flex', color: active ? '#60a5fa' : 'rgba(255,255,255,0.25)' }}>
                          <Icon d={item.icon} size={18} />
                        </span>
                        {!collapsed && (
                          <span style={{ fontWeight: active ? 600 : 500, fontSize: '13px', whiteSpace: 'nowrap', color: active ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                            {item.name}
                          </span>
                        )}
                        {active && !collapsed && (
                          <span style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                        )}
                      </Link>
                    )
                  })}
                </div>
              ))}
            </nav>

            {/* Bottom */}
            <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              {!collapsed ? (
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ color: '#475569', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px' }}>Sistem Durumu</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                    <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>Aktif</span>
                    <span style={{ marginLeft: 'auto', color: '#475569', fontSize: '11px' }}>v1.0</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '3px', marginTop: '10px' }}>
                    <div style={{ background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', width: '70%', height: '100%', borderRadius: '4px' }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                </div>
              )}
            </div>
          </aside>

          {/* ─── Main ─── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Top Bar */}
            <header style={{
              height: '68px', background: '#ffffff',
              borderBottom: '1px solid #e8ecf0',
              display: 'flex', alignItems: 'center', padding: '0 28px', gap: '20px',
              flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'sticky', top: 0, zIndex: 50
            }}>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '16px', letterSpacing: '-0.3px', minWidth: '130px' }}>
                {menuGroups.flatMap(g => g.items).find(m => isActive(m.path))?.name || 'Panel'}
              </div>

              <div style={{ flex: 1 }}></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: 'auto' }}>
                <button title="Bildirimler" style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '6px', transition: 'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='#0f172a'} onMouseLeave={e=>e.currentTarget.style.color='#64748b'}>
                  <Icon d={icons.bell} size={20} />
                  <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#ef4444', border: '2px solid #fff', borderRadius: '50%' }}></span>
                </button>
                
                <div style={{ height: '32px', width: '1px', background: '#e2e8f0' }}></div>

                <div style={{ position: 'relative' }}>
                  <div 
                    onClick={() => setProfileOpen(!profileOpen)}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', padding: '4px 8px', borderRadius: '12px', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Yönetici</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '14px', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}>
                      A
                    </div>
                  </div>

                  {/* Profile Dropdown */}
                  {profileOpen && (
                    <>
                      <div onClick={() => setProfileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }}></div>
                      <div style={{ 
                        position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: '220px', 
                        background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', 
                        border: '1px solid #f1f5f9', overflow: 'hidden', zIndex: 101, animation: 'slideInDown 0.2s ease-out' 
                      }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                          <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>Hoş Geldiniz, Ali</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>admin@servismaster.com</div>
                        </div>
                        <div style={{ padding: '8px' }}>
                          {[
                            { label: 'Kullanıcı Ayarları', icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z' },
                            { label: 'Firma Bilgileri',    icon: 'M3 21h18 M3 7v14 M21 7v14 M9 21V11h6v10 M2 7l10-4 10 4' },
                            { label: 'Hesap Bilgileri',    icon: 'M12 1v22 M17 5l-5-5-5 5 M7 19l5 5 5-5' },
                          ].map(opt => (
                            <button key={opt.label} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#3b82f6'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'inherit'; }}>
                              <Icon d={opt.icon} size={16} />
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'inherit' }}>{opt.label}</span>
                            </button>
                          ))}
                        </div>
                        <div style={{ padding: '8px', borderTop: '1px solid #f1f5f9' }}>
                          <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', color: '#ef4444', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Icon d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" size={16} />
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>Çıkış Yap</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* Page */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#f0f2f5' }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}