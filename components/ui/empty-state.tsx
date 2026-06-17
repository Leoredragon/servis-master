"use client"

import { Users, Car, FileText, Package, HelpCircle, LucideIcon } from "lucide-react"
import { Button } from "./button"

interface EmptyStateProps {
  iconName: "users" | "car" | "file-text" | "package"
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  car: Car,
  "file-text": FileText,
  package: Package,
}

export function EmptyState({ iconName, title, description, actionLabel, onAction }: EmptyStateProps) {
  const Icon = iconMap[iconName] || HelpCircle
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-zinc-200 rounded-lg bg-zinc-50/50">
      <div className="p-3 bg-white rounded-full shadow-sm mb-4">
        <Icon className="w-6 h-6 text-zinc-400" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="text-sm text-zinc-500 mt-1 max-w-sm">{description}</p>
      {onAction && actionLabel && (
        <Button onClick={onAction} className="mt-6" variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
