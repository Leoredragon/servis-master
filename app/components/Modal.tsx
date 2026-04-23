"use client"

import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ isOpen, onClose, title, subtitle, children, size = 'md' }: ModalProps) {
  // ESC tuşuyla kapatma özelliği kaldırıldı (Sadece çarpıdan veya iptal'den kapanacak)
  // Scroll kilidi
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const widths = { sm: '440px', md: '600px', lg: '760px' }

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(15, 23, 42, 0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '18px',
          width: '100%',
          maxWidth: widths[size],
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06)',
          animation: 'modalSlideIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '22px 28px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
          flexShrink: 0,
          background: '#fafbfc',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none',
              borderRadius: '8px', width: '32px', height: '32px',
              cursor: 'pointer', fontSize: '16px', color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.15s',
              fontWeight: 700,
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px) }
          to   { opacity: 1; transform: scale(1)    translateY(0) }
        }
      `}</style>
    </div>
  )
}
