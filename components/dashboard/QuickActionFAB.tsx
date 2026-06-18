"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, UserPlus, Wrench, FilePlus } from "lucide-react"

export default function QuickActionFAB() {
    const [open, setOpen] = useState(false)
    const fabRef = useRef<HTMLDivElement>(null)

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const actions = [
        {
            label: "Yeni Servis Aç",
            icon: Wrench,
            onClick: () => {
                setOpen(false)
                window.dispatchEvent(new CustomEvent("open-new-service"))
            },
            color: "bg-blue-600 hover:bg-blue-700 text-white"
        },
        {
            label: "Yeni Müşteri Ekle",
            icon: UserPlus,
            onClick: () => {
                setOpen(false)
                window.dispatchEvent(new CustomEvent("open-new-customer"))
            },
            color: "bg-emerald-600 hover:bg-emerald-700 text-white"
        },
        {
            label: "Yeni Fatura Kes",
            icon: FilePlus,
            onClick: () => {
                setOpen(false)
                window.dispatchEvent(new CustomEvent("open-new-invoice"))
            },
            color: "bg-purple-600 hover:bg-purple-700 text-white"
        }
    ]

    return (
        <div ref={fabRef} className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 print:hidden">
            {/* Action Items List */}
            {open && (
                <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    {actions.map((act, index) => (
                        <div key={index} className="flex items-center gap-2 group cursor-pointer">
                            <span className="bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {act.label}
                            </span>
                            <button
                                onClick={act.onClick}
                                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${act.color}`}
                                title={act.label}
                            >
                                <act.icon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Main FAB Toggle */}
            <button
                onClick={() => setOpen(!open)}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl text-white font-bold bg-zinc-900 hover:bg-zinc-850 active:scale-95 transition-all duration-300 cursor-pointer ${
                    open ? "rotate-45" : ""
                }`}
                title="Hızlı İşlemler"
            >
                <Plus className="w-6 h-6" />
            </button>
        </div>
    )
}
