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
import { MoreHorizontal, Search, Trash2, Edit, FileText } from "lucide-react"
import { deleteServiceRecord } from "./actions"
import { toast } from "sonner"
import Link from "next/link"

interface ServiceRecord {
    id: string
    service_code: string
    service_type: string
    priority: string
    status: string
    entry_mileage: number | null
    created_at: string
    customers: {
        first_name: string
        last_name: string | null
    } | null
    vehicles: {
        brand: string
        model: string
        plate: string
    } | null
    service_items: {
        unit_price: number
        quantity: number
    }[]
}

interface ServicesTableProps {
    services: ServiceRecord[]
}

export default function ServicesTable({ services }: ServicesTableProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    // Filter services based on search query
    const filteredServices = services.filter((service) => {
        const query = searchQuery.toLowerCase()
        const code = service.service_code.toLowerCase()
        const customerName = service.customers
            ? `${service.customers.first_name} ${service.customers.last_name || ""}`.toLowerCase()
            : ""
        const vehicleInfo = service.vehicles
            ? `${service.vehicles.brand} ${service.vehicles.model} ${service.vehicles.plate}`.toLowerCase()
            : ""
        const status = service.status.toLowerCase()
        const type = service.service_type.toLowerCase()

        return (
            code.includes(query) ||
            customerName.includes(query) ||
            vehicleInfo.includes(query) ||
            status.includes(query) ||
            type.includes(query)
        )
    })

    // Pagination calculations
    const totalPages = Math.ceil(filteredServices.length / pageSize) || 1
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedServices = filteredServices.slice(startIndex, endIndex)

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`"${code}" kodlu servis kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
            return
        }

        try {
            const res = await deleteServiceRecord(id)
            if (res.success) {
                toast.success("Servis kaydı başarıyla silindi.")
                if (paginatedServices.length === 1 && currentPage > 1) {
                    setCurrentPage(prev => prev - 1)
                }
            } else {
                toast.error(res.message || "Servis kaydı silinirken hata oluştu.")
            }
        } catch (error) {
            console.error(error)
            toast.error("İşlem gerçekleştirilemedi.")
        }
    }

    const handleEdit = () => {
        toast.info("Servis kaydı düzenleme özelliği yakında eklenecektir.")
    }

    // Date formatter
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            return date.toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "short",
                year: "numeric",
            })
        } catch {
            return "-"
        }
    }

    // Status map
    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case "araç kabul":
                return "Araç Kabul"
            case "islemde":
            case "işlemde":
                return "İşlemde"
            case "beklemede":
                return "Beklemede"
            case "tamamlandi":
            case "tamamlandı":
                return "Tamamlandı"
            default:
                return status
        }
    }

    // Service type map
    const getTypeText = (type: string) => {
        switch (type.toLowerCase()) {
            case "bakim":
            case "bakım":
                return "Periyodik Bakım"
            case "tamir":
                return "Onarım / Tamir"
            case "muayene":
                return "Muayene Hazırlık"
            case "modifikasyon":
                return "Modifikasyon"
            default:
                return type
        }
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative w-full max-w-sm">
                <Input
                    placeholder="Servis kodu, müşteri, plaka veya durum ara..."
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
            {filteredServices.length > 0 ? (
                <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-50/50">
                            <TableRow>
                                <TableHead className="w-[120px] font-medium">Servis Kodu</TableHead>
                                <TableHead className="font-medium">Müşteri</TableHead>
                                <TableHead className="font-medium">Araç Bilgisi</TableHead>
                                <TableHead className="font-medium">Giriş Tarihi</TableHead>
                                <TableHead className="font-medium">Servis Tipi</TableHead>
                                <TableHead className="font-medium">Durum</TableHead>
                                <TableHead className="text-right font-medium">Toplam Tutar</TableHead>
                                <TableHead className="w-[80px] text-right pr-6 font-medium">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedServices.map((service) => {
                                const totalCost = service.service_items?.reduce(
                                    (sum, item) => sum + (item.unit_price * item.quantity),
                                    0
                                ) || 0

                                return (
                                    <TableRow key={service.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <TableCell className="font-medium text-zinc-900 text-xs">
                                            <Link href={`/services/${service.id}`} className="text-blue-600 hover:underline">
                                                {service.service_code}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-zinc-900">
                                            {service.customers 
                                                ? `${service.customers.first_name} ${service.customers.last_name || ""}` 
                                                : "Bilinmeyen Müşteri"}
                                        </TableCell>
                                        <TableCell className="text-xs text-zinc-500 font-medium">
                                            {service.vehicles 
                                                ? `${service.vehicles.brand} ${service.vehicles.model} (${service.vehicles.plate})` 
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="text-xs text-zinc-500">{formatDate(service.created_at)}</TableCell>
                                        <TableCell className="text-xs text-zinc-600">{getTypeText(service.service_type)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    service.status.toLowerCase() === "tamamlandi" || service.status.toLowerCase() === "tamamlandı"
                                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[10px] px-1.5 py-0.5"
                                                        : service.status.toLowerCase() === "araç kabul"
                                                        ? "bg-blue-50 text-blue-700 hover:bg-blue-50 text-[10px] px-1.5 py-0.5"
                                                        : "bg-amber-50 text-amber-700 hover:bg-amber-50 text-[10px] px-1.5 py-0.5"
                                                }
                                            >
                                                {getStatusText(service.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-zinc-900 text-xs">
                                            {totalCost > 0 
                                                ? `${totalCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺` 
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-zinc-400 hover:text-zinc-600">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white border border-zinc-200 shadow-md rounded-md p-1 min-w-32 z-50">
                                                    <DropdownMenuItem asChild className="text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 cursor-pointer">
                                                        <Link href={`/services/${service.id}`} className="flex items-center gap-1.5 w-full">
                                                            <FileText className="w-3.5 h-3.5 text-zinc-500" />
                                                            <span>📄 Detaylar</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={handleEdit} className="text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 cursor-pointer">
                                                        <Edit className="w-3.5 h-3.5 text-zinc-500" />
                                                        <span>✏️ Düzenle</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleDelete(service.id, service.service_code)}
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                        <span>🗑️ Sil</span>
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
                                Toplam {filteredServices.length} kayıttan {startIndex + 1}-{Math.min(endIndex, filteredServices.length)} arası gösteriliyor
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
                    <p className="text-zinc-400 text-sm">Arama kriterlerinize uygun aktif servis kaydı bulunamadı.</p>
                </div>
            )}
        </div>
    )
}
