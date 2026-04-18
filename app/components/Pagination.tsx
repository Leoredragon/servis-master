"use client"

import React from 'react'

interface PaginationProps {
  totalItems: number
  pageSize: number
  currentPage: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export default function Pagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  if (totalItems === 0) return null

  return (
    <div style={{ 
      padding: '16px 24px', 
      borderTop: '1px solid #f1f5f9', 
      background: '#fafbfc', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      gap: '20px',
      flexWrap: 'wrap'
    }}>
      {/* Page Size Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Satır Sayısı:</span>
        <select 
          value={pageSize} 
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{ 
            padding: '6px 12px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0', 
            background: '#fff', 
            fontSize: '13px', 
            fontWeight: 700, 
            color: '#0f172a',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {[20, 50, 100, 200].map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
          {totalItems} kayıt arasından {startItem}-{endItem} gösteriliyor
        </span>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ 
            padding: '8px 12px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0', 
            background: currentPage === 1 ? '#f8fafc' : '#fff', 
            color: currentPage === 1 ? '#cbd5e1' : '#64748b',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 700,
            transition: 'all 0.2s'
          }}
        >
          ◀
        </button>
        
        <div style={{ 
          padding: '8px 16px', 
          background: '#fff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px', 
          fontSize: '13px', 
          fontWeight: 800, 
          color: '#0f172a' 
        }}>
          {currentPage} / {totalPages}
        </div>

        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{ 
            padding: '8px 12px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0', 
            background: currentPage >= totalPages ? '#f8fafc' : '#fff', 
            color: currentPage >= totalPages ? '#cbd5e1' : '#64748b',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 700,
            transition: 'all 0.2s'
          }}
        >
          ▶
        </button>
      </div>
    </div>
  )
}
