"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import { MoreHorizontal, Search, Trash2, Edit, Bike } from "lucide-react"
import { deleteVehicle } from "./actions"
import { toast } from "sonner"

interface Vehicle {
    id: string
    plate: string
    brand: string
    model: string
    year: number | null
    mileage: number
    notes: string | null
    customers: {
        first_name: string
        last_name: string | null
    } | null
}

interface VehiclesTableProps {
    vehicles: Vehicle[]
}

export default function VehiclesTable({ vehicles }: VehiclesTableProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    // Filter vehicles based on search query
    const filteredVehicles = vehicles.filter((vehicle) => {
        const query = searchQuery.toLowerCase()
        const plate = vehicle.plate.toLowerCase()
        const brandModel = `${vehicle.brand} ${vehicle.model}`.toLowerCase()
        const ownerName = vehicle.customers
            ? `${vehicle.customers.first_name} ${vehicle.customers.last_name || ""}`.toLowerCase()
            : ""
        const year = (vehicle.year || "").toString()

        return (
            plate.includes(query) ||
            brandModel.includes(query) ||
            ownerName.includes(query) ||
            year.includes(query)
        )
    })

    // Pagination calculations
    const totalPages = Math.ceil(filteredVehicles.length / pageSize) || 1
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex)

    const handleDelete = async (id: string, plate: string) => {
        if (!confirm(`"${plate}" plakalı aracı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
            return
        }

        try {
            const res = await deleteVehicle(id)
            if (res.success) {
                toast.success("Araç başarıyla silindi.")
                if (paginatedVehicles.length === 1 && currentPage > 1) {
                    setCurrentPage(prev => prev - 1)
                }
            } else {
                toast.error(res.message || "Araç silinirken hata oluştu.")
            }
        } catch (error) {
            console.error(error)
            toast.error("İşlem gerçekleştirilemedi.")
        }
    }

    const handleEdit = () => {
        toast.info("Araç düzenleme özelliği yakında eklenecektir.")
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative w-full max-w-sm">
                <Input
                    placeholder="Plaka, marka, model veya araç sahibi ara..."
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
            {filteredVehicles.length > 0 ? (
                <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-50/50">
                            <TableRow>
                                <TableHead className="w-[80px] font-medium">Görsel</TableHead>
                                <TableHead className="w-[120px] font-medium">Plaka</TableHead>
                                <TableHead className="font-medium">Marka / Model</TableHead>
                                <TableHead className="font-medium">Yıl</TableHead>
                                <TableHead className="font-medium">Araç Sahibi</TableHead>
                                <TableHead className="font-medium">Mevcut KM</TableHead>
                                <TableHead className="w-[80px] text-right pr-6 font-medium">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedVehicles.map((vehicle) => (
                                <TableRow key={vehicle.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <TableCell>
                                        <div className="h-8 w-8 rounded bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-500">
                                            <Bike className="w-4 h-4" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-zinc-900 tracking-wide text-xs">{vehicle.plate}</TableCell>
                                    <TableCell className="font-medium text-xs text-zinc-800">{vehicle.brand} {vehicle.model}</TableCell>
                                    <TableCell className="text-zinc-500 text-xs">{vehicle.year || "-"}</TableCell>
                                    <TableCell className="text-zinc-500 text-xs">
                                        {vehicle.customers 
                                            ? `${vehicle.customers.first_name} ${vehicle.customers.last_name || ""}` 
                                            : 'Bilinmeyen Müşteri'}
                                    </TableCell>
                                    <TableCell className="text-zinc-650 font-medium text-xs">{vehicle.mileage ? `${vehicle.mileage.toLocaleString('tr-TR')} KM` : "0 KM"}</TableCell>
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
                                                    <span>✏️ Düzenle</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={() => handleDelete(vehicle.id, vehicle.plate)}
                                                    className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                    <span>🗑️ Sil</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    <div className="px-6 py-3 border-t border-zinc-150 flex items-center justify-between bg-zinc-50/50 text-xs text-zinc-500">
                        <div className="flex items-center gap-4">
                            <span>
                                Toplam {filteredVehicles.length} kayıttan {startIndex + 1}-{Math.min(endIndex, filteredVehicles.length)} arası gösteriliyor
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
                    <p className="text-zinc-400 text-sm">Arama kriterlerinize uygun araç bulunamadı.</p>
                </div>
            )}
        </div>
    )
}
