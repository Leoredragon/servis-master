"use client"

import { useEffect, useState } from 'react'

interface SlideOverProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
}

export default function SlideOver({ isOpen, onClose, title, subtitle, children }: SlideOverProps) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setActive(true)
      document.body.style.overflow = 'hidden'
    } else {
      const timer = setTimeout(() => setActive(false), 300)
      document.body.style.overflow = ''
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!active && !isOpen) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, overflow: 'hidden' }}>
      {/* Overlay */}
      <div 
        onClick={onClose}
        style={{ 
          position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', 
          backdropFilter: 'blur(2px)', transition: 'opacity 0.3s ease',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none'
        }} 
      />
      
      {/* Panel */}
      <div style={{ 
        position: 'absolute', top: 0, bottom: 0, right: 0, width: '100%', maxWidth: '440px',
        background: '#fff', boxShadow: '-10px 0 40px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', height: '100%',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: '#fafbfc' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>{title}</h2>
            {subtitle && <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>{subtitle}</p>}
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', 
              color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
