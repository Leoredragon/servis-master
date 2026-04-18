"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface StokItem {
  id: number
  ad: string
  kod: string | null
  barkod: string | null
  birim: string
  s_fiyat: number
  kdv_oran: number
  miktar: number
  kritik_seviye: number
}

interface SmartProductSearchProps {
  value: string
  onChange: (value: string) => void
  onSelect: (item: StokItem) => void
  disabled?: boolean
  placeholder?: string
}

export default function SmartProductSearch({
  value,
  onChange,
  onSelect,
  disabled = false,
  placeholder = 'Ürün adı veya kodu yazın...'
}: SmartProductSearchProps) {
  const [results, setResults] = useState<StokItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const searchStok = useCallback(async (query: string) => {
    if (query.length < 1) {
      setResults([])
      setIsOpen(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('stok')
      .select('id, ad, kod, barkod, birim, s_fiyat, kdv_oran, miktar, kritik_seviye')
      .or(`ad.ilike.%${query}%,kod.ilike.%${query}%,barkod.ilike.%${query}%`)
      .order('ad')
      .limit(8)
    setResults(data || [])
    setIsOpen(true)
    setLoading(false)
    setActiveIndex(-1)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchStok(val), 300)
  }

  const handleSelect = (item: StokItem) => {
    onChange(item.ad)
    onSelect(item)
    setIsOpen(false)
    setResults([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape') setIsOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(results[activeIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (value.length >= 1 && results.length > 0) setIsOpen(true) }}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1.5px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '13px',
          outline: 'none',
          background: disabled ? '#f8fafc' : '#fff',
          color: '#0f172a',
          fontFamily: 'inherit',
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
        }}
      />
      {loading && (
        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
          <div style={{ width: '14px', height: '14px', border: '2px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 100,
          maxHeight: '240px',
          overflowY: 'auto',
          animation: 'fadeIn 0.15s ease',
        }}>
          {results.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(idx)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                background: idx === activeIndex ? '#eff6ff' : '#fff',
                borderBottom: idx < results.length - 1 ? '1px solid #f8fafc' : 'none',
                transition: 'background 0.1s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{item.ad}</div>
                {item.kod && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>{item.kod}</div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: (item.miktar <= (item.kritik_seviye || 0)) ? '#ef4444' : '#64748b' }}>
                  {item.miktar <= (item.kritik_seviye || 0) && '⚠️ '}{item.miktar} {item.birim}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                  {item.s_fiyat?.toFixed(2)} ₺
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && !loading && value.length >= 1 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 100,
          padding: '14px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Stokta bulunamadı</div>
          <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 700 }}>Manuel olarak devam edebilirsiniz</div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }`}</style>
    </div>
  )
}
