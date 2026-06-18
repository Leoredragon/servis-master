"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Trash2, Edit, Package } from "lucide-react"
import { deleteStock } from "./actions"
import { toast } from "sonner"

interface StockCard {
    id: string
    stock_code: string
    name: string
    category: string | null
    brand: string | null
    barcode: string | null
    unit: string | null
    purchase_price: number | null
    sale_price: number | null
    vat_rate: number
    min_stock: number | null
    current_stock: number
    location: string | null
    notes: string | null
}

interface StockTableProps {
    stocks: StockCard[]
}

export default function StockTable({ stocks }: StockTableProps) {
    const searchParams = useSearchParams()
    const searchQueryParam = searchParams.get("search")

    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    useEffect(() => {
        if (searchQueryParam) {
            setSearchQuery(searchQueryParam)
            setCurrentPage(1)
        }
    }, [searchQueryParam])

    // Filter stocks based on search query
    const filteredStocks = stocks.filter((stock) => {
        const query = searchQuery.toLowerCase()
        const code = stock.stock_code.toLowerCase()
        const name = stock.name.toLowerCase()
        const category = (stock.category || "").toLowerCase()
        const brand = (stock.brand || "").toLowerCase()
        const barcode = (stock.barcode || "").toLowerCase()
        const location = (stock.location || "").toLowerCase()

        return (
            code.includes(query) ||
            name.includes(query) ||
            category.includes(query) ||
            brand.includes(query) ||
            barcode.includes(query) ||
            location.includes(query)
        )
    })

    // Pagination calculations
    const totalPages = Math.ceil(filteredStocks.length / pageSize) || 1
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedStocks = filteredStocks.slice(startIndex, endIndex)

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`"${name}" adlı stok kartını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
            return
        }

        try {
            const res = await deleteStock(id)
            if (res.success) {
                toast.success("Stok kartı başarıyla silindi.")
                if (paginatedStocks.length === 1 && currentPage > 1) {
                    setCurrentPage(prev => prev - 1)
                }
            } else {
                toast.error(res.message || "Stok kartı silinirken hata oluştu.")
            }
        } catch (error) {
            console.error(error)
            toast.error("İşlem gerçekleştirilemedi.")
        }
    }

    const handleEdit = () => {
        toast.info("Stok kartı düzenleme özelliği yakında eklenecektir.")
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative w-full max-w-sm">
                <Input
                    placeholder="Stok kodu, ürün adı, marka veya kategori ara..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                    }}
                    className="pl-9 border-zinc-200 focus-visible:ring-blue-500 bg-white text-xs h-9"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            </div>

            {/* Table Area */}
            {filteredStocks.length > 0 ? (
                <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-50/50">
                            <TableRow>
                                <TableHead className="w-[60px] font-medium">Simge</TableHead>
                                <TableHead className="w-[140px] font-medium">Stok Kodu (SKU)</TableHead>
                                <TableHead className="font-medium">Ürün / Parça Adı</TableHead>
                                <TableHead className="font-medium">Kategori</TableHead>
                                <TableHead className="font-medium">Marka</TableHead>
                                <TableHead className="text-center font-medium">Stok Miktarı</TableHead>
                                <TableHead className="text-right font-medium">Satış Fiyatı</TableHead>
                                <TableHead className="w-[120px] font-medium">Durum</TableHead>
                                <TableHead className="w-[80px] text-right pr-6 font-medium">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedStocks.map((stock) => {
                                const isCritical = stock.current_stock <= (stock.min_stock ?? 0)

                                return (
                                    <TableRow key={stock.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <TableCell>
                                            <div className="h-8 w-8 rounded bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-500">
                                                <Package className="w-4 h-4" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-zinc-600 text-xs">{stock.stock_code}</TableCell>
                                        <TableCell className="font-semibold text-zinc-900 text-xs">{stock.name}</TableCell>
                                        <TableCell className="text-zinc-500 text-xs">{stock.category || "-"}</TableCell>
                                        <TableCell className="text-zinc-500 text-xs">{stock.brand || "-"}</TableCell>
                                        <TableCell className="text-center font-semibold text-zinc-900 text-xs">
                                            {stock.current_stock} {stock.unit || "Adet"}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-zinc-900 text-xs">
                                            {stock.sale_price ? `${stock.sale_price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺` : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    isCritical
                                                        ? "bg-red-50 text-red-700 hover:bg-red-50 font-semibold text-[10px] px-1.5 py-0.5"
                                                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 font-semibold text-[10px] px-1.5 py-0.5"
                                                }
                                            >
                                                {isCritical ? "Kritik Stok!" : "Stokta Var"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-zinc-400 hover:text-zinc-600">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white border border-zinc-200 shadow-md rounded-md p-1 min-w-32 z-50">
                                                    <DropdownMenuItem onClick={handleEdit} className="text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 cursor-pointer">
                                                        <Edit className="w-3.5 h-3.5 text-zinc-500" />
                                                        <span>Düzenle</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleDelete(stock.id, stock.name)}
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                        <span>Sil</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    <div className="px-6 py-3 border-t border-zinc-150 flex items-center justify-between bg-zinc-50/50 text-xs text-zinc-500">
                        <div className="flex items-center gap-4">
                            <span>
                                Toplam {filteredStocks.length} kayıttan {startIndex + 1}-{Math.min(endIndex, filteredStocks.length)} arası gösteriliyor
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span>Satır sayısı:</span>
                                <Select
                                    value={pageSize.toString()}
                                    onValueChange={(val) => {
                                        setPageSize(parseInt(val))
                                        setCurrentPage(1)
                                    }}
                                >
                                    <SelectTrigger className="w-16 h-7 text-xs border-zinc-200 bg-white px-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="h-8 text-xs border-zinc-200 bg-white hover:bg-zinc-50 hover:text-zinc-900"
                            >
                                Önceki
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className="h-8 text-xs border-zinc-200 bg-white hover:bg-zinc-50 hover:text-zinc-900"
                            >
                                Sonraki
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-zinc-200 border-dashed rounded-lg p-12 text-center">
                    <p className="text-zinc-400 text-sm">Arama kriterlerinize uygun stok kartı bulunamadı.</p>
                </div>
            )}
        </div>
    )
}
