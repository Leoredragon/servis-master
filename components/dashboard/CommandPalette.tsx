"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { User, Car, Package, Search } from "lucide-react"

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{
    customers: any[]
    vehicles: any[]
    stocks: any[]
  }>({ customers: [], vehicles: [], stocks: [] })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    
    const handleCustomOpen = () => setOpen(true)
    window.addEventListener("open-global-search", handleCustomOpen)
    
    return () => {
      document.removeEventListener("keydown", down)
      window.removeEventListener("open-global-search", handleCustomOpen)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults({ customers: [], vehicles: [], stocks: [] })
      return
    }

    if (query.trim().length === 0) {
      setResults({ customers: [], vehicles: [], stocks: [] })
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()

      try {
        const [custRes, vehRes, stockRes] = await Promise.all([
          supabase
            .from('customers')
            .select('id, first_name, last_name, phone, customer_code, tax_number')
            .eq('is_deleted', false)
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%,tax_number.ilike.%${query}%,customer_code.ilike.%${query}%`)
            .limit(5),
          supabase
            .from('vehicles')
            .select('id, plate, brand, model, chassis_number')
            .eq('is_deleted', false)
            .or(`plate.ilike.%${query}%,chassis_number.ilike.%${query}%`)
            .limit(5),
          supabase
            .from('stock_cards')
            .select('id, name, stock_code, barcode')
            .eq('is_deleted', false)
            .or(`name.ilike.%${query}%,stock_code.ilike.%${query}%,barcode.ilike.%${query}%`)
            .limit(5)
        ])

        setResults({
          customers: custRes.data || [],
          vehicles: vehRes.data || [],
          stocks: stockRes.data || []
        })
      } catch (err) {
        console.error("Global search error:", err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query, open])

  const handleSelect = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={setOpen} 
      title="Global Arama" 
      description="Müşteri, araç veya stok arayın..."
      className="max-w-[550px] bg-white border border-zinc-200 rounded-xl shadow-2xl p-0"
    >
      <Command className="bg-white rounded-xl">
        <CommandInput 
          placeholder="Müşteri adı, plaka, stok kodu veya vergi numarası yazın..." 
          value={query}
          onValueChange={setQuery}
          className="border-b border-zinc-100 text-sm h-12 px-4 bg-white"
        />
        <CommandList className="max-h-[300px] overflow-y-auto p-2 bg-white">
          {loading && (
            <div className="p-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
              <Search className="w-3.5 h-3.5 animate-spin" />
              <span>Aranıyor...</span>
            </div>
          )}
          
          {!loading && query.trim().length > 0 && 
           results.customers.length === 0 && 
           results.vehicles.length === 0 && 
           results.stocks.length === 0 && (
             <CommandEmpty className="p-4 text-center text-xs text-zinc-400">Sonuç bulunamadı.</CommandEmpty>
           )}

          {!loading && results.customers.length > 0 && (
            <CommandGroup heading="Müşteriler" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1.5">
              {results.customers.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`customer-${c.id}`}
                  onSelect={() => handleSelect(`/customers?id=${c.id}`)}
                  className="flex items-center gap-2.5 cursor-pointer p-2.5 hover:bg-zinc-50 rounded-md text-zinc-700 hover:text-zinc-900 transition-colors"
                >
                  <User className="w-4 h-4 text-zinc-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-900">{c.first_name} {c.last_name || ""}</span>
                    <span className="text-[10px] text-zinc-500 normal-case font-normal mt-0.5">Kod: {c.customer_code} | Tel: {c.phone}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!loading && results.vehicles.length > 0 && (
            <CommandGroup heading="Araçlar" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1.5 mt-2">
              {results.vehicles.map((v) => (
                <CommandItem
                  key={v.id}
                  value={`vehicle-${v.id}`}
                  onSelect={() => handleSelect(`/vehicles?search=${v.plate}`)}
                  className="flex items-center gap-2.5 cursor-pointer p-2.5 hover:bg-zinc-50 rounded-md text-zinc-700 hover:text-zinc-900 transition-colors"
                >
                  <Car className="w-4 h-4 text-zinc-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-900">{v.plate}</span>
                    <span className="text-[10px] text-zinc-500 normal-case font-normal mt-0.5">{v.brand} {v.model} {v.chassis_number ? `| Şasi: ${v.chassis_number}` : ""}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!loading && results.stocks.length > 0 && (
            <CommandGroup heading="Stok Kartları" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1.5 mt-2">
              {results.stocks.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`stock-${s.id}`}
                  onSelect={() => handleSelect(`/stock?search=${s.stock_code}`)}
                  className="flex items-center gap-2.5 cursor-pointer p-2.5 hover:bg-zinc-50 rounded-md text-zinc-700 hover:text-zinc-900 transition-colors"
                >
                  <Package className="w-4 h-4 text-zinc-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-900">{s.name}</span>
                    <span className="text-[10px] text-zinc-500 normal-case font-normal mt-0.5">Kod: {s.stock_code} {s.barcode ? `| Barkod: ${s.barcode}` : ""}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
