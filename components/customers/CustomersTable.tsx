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
import { MoreHorizontal, Search, Trash2, Edit } from "lucide-react"
import { deleteCustomer } from "./actions"
import { toast } from "sonner"
import Customer360Dialog from "./Customer360Dialog"
import EditCustomerDialog from "./EditCustomerDialog"

interface CustomerWithGroup {
    id: string
    customer_code: string
    first_name: string
    last_name: string | null
    phone: string
    email: string | null
    type: string
    discount_rate: number
    city?: string | null
    district?: string | null
    address?: string | null
    notes?: string | null
    tax_office?: string | null
    tax_number?: string | null
    group_id?: string | null
    customer_groups: {
        id?: string
        name: string
    } | null
}

interface CustomersTableProps {
    customers: CustomerWithGroup[]
}

export default function CustomersTable({ customers }: CustomersTableProps) {
    const searchParams = useSearchParams()
    const customerIdParam = searchParams.get("id")

    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [selected360CustomerId, setSelected360CustomerId] = useState<string | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)

    useEffect(() => {
        if (customerIdParam) {
            setSelected360CustomerId(customerIdParam)
            setSheetOpen(true)
        }
    }, [customerIdParam])

    // Edit dialog state
    const [editTargetCustomer, setEditTargetCustomer] = useState<CustomerWithGroup | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)

    // Filter customers based on search query
    const filteredCustomers = customers.filter((customer) => {
        const query = searchQuery.toLowerCase()
        const fullName = `${customer.first_name} ${customer.last_name || ""}`.toLowerCase()
        const code = customer.customer_code.toLowerCase()
        const phone = customer.phone.toLowerCase()
        const email = (customer.email || "").toLowerCase()
        const groupName = (customer.customer_groups?.name || "").toLowerCase()
        const taxNo = (customer.tax_number || "").toLowerCase()

        return (
            fullName.includes(query) ||
            code.includes(query) ||
            phone.includes(query) ||
            email.includes(query) ||
            groupName.includes(query) ||
            taxNo.includes(query)
        )
    })

    // Pagination calculations
    const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex)

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`"${name}" adlı müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
            return
        }

        try {
            const res = await deleteCustomer(id)
            if (res.success) {
                toast.success("Müşteri başarıyla silindi.")
                // Reset page if needed
                if (paginatedCustomers.length === 1 && currentPage > 1) {
                    setCurrentPage(prev => prev - 1)
                }
            } else {
                toast.error(res.message || "Müşteri silinirken hata oluştu.")
            }
        } catch (error) {
            console.error(error)
            toast.error("İşlem gerçekleştirilemedi.")
        }
    }

    const handleEditClick = (customer: CustomerWithGroup) => {
        setEditTargetCustomer(customer)
        setEditDialogOpen(true)
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative w-full max-w-sm">
                <Input
                    placeholder="Müşteri adı, kodu, telefon veya grup ara..."
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
            {filteredCustomers.length > 0 ? (
                <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-50/50">
                            <TableRow>
                                <TableHead className="w-[120px] font-medium">Müşteri Kodu</TableHead>
                                <TableHead className="font-medium">Ad Soyad / Firma</TableHead>
                                <TableHead className="font-medium">Telefon</TableHead>
                                <TableHead className="font-medium">E-posta</TableHead>
                                <TableHead className="font-medium">Müşteri Tipi</TableHead>
                                <TableHead className="font-medium">Grup</TableHead>
                                <TableHead className="font-medium">İskonto Oranı</TableHead>
                                <TableHead className="w-[80px] text-right pr-6 font-medium">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedCustomers.map((customer) => (
                                <TableRow 
                                    key={customer.id} 
                                    className="hover:bg-zinc-50/50 transition-colors cursor-pointer"
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement
                                        if (target.closest('[data-slot="dropdown-menu-trigger"]') || target.closest('[data-slot="dropdown-menu-content"]')) {
                                            return
                                        }
                                        setSelected360CustomerId(customer.id)
                                        setSheetOpen(true)
                                    }}
                                >
                                    <TableCell className="font-medium text-zinc-900 text-xs">{customer.customer_code}</TableCell>
                                    <TableCell className="font-medium text-zinc-900 text-xs">
                                        <div>
                                            {customer.first_name} {customer.last_name || ""}
                                        </div>
                                        {customer.type === "kurumsal" && (customer.tax_office || customer.tax_number) && (
                                            <div className="text-[10px] text-zinc-400 font-normal mt-0.5">
                                                {customer.tax_office && `${customer.tax_office} V.D.`}
                                                {customer.tax_office && customer.tax_number && " / "}
                                                {customer.tax_number && `VKN: ${customer.tax_number}`}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-zinc-500 text-xs">{customer.phone}</TableCell>
                                    <TableCell className="text-zinc-500 text-xs">{customer.email || "-"}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={
                                                customer.type === "kurumsal"
                                                    ? "bg-blue-50 text-blue-700 hover:bg-blue-50 text-[10px] px-1.5 py-0.5"
                                                    : customer.type === "personel"
                                                    ? "bg-purple-50 text-purple-700 hover:bg-purple-50 text-[10px] px-1.5 py-0.5"
                                                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-100 text-[10px] px-1.5 py-0.5"
                                            }
                                        >
                                            {customer.type === "kurumsal" 
                                                ? "Kurumsal" 
                                                : customer.type === "personel" 
                                                ? "Personel" 
                                                : "Bireysel"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {customer.customer_groups?.name ? (
                                            <Badge variant="outline" className="bg-zinc-50 text-zinc-700 border-zinc-200 text-[10px] px-1.5 py-0.5">
                                                {customer.customer_groups.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-zinc-400 text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-zinc-500 font-medium text-xs">
                                        {customer.discount_rate && customer.discount_rate > 0 ? (
                                            <span className="text-emerald-600">%{customer.discount_rate}</span>
                                        ) : (
                                            <span className="text-zinc-400">%0</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-zinc-400 hover:text-zinc-600">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-white border border-zinc-200 shadow-md rounded-md p-1 min-w-32 z-50">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleEditClick(customer)
                                                    }}
                                                    className="text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 cursor-pointer"
                                                >
                                                    <Edit className="w-3.5 h-3.5 text-zinc-500" />
                                                    <span>Düzenle</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={() => handleDelete(customer.id, `${customer.first_name} ${customer.last_name || ""}`)}
                                                    className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                    <span>Sil</span>
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
                                Toplam {filteredCustomers.length} kayıttan {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} arası gösteriliyor
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
                    <p className="text-zinc-400 text-sm">Arama kriterlerinize uygun müşteri bulunamadı.</p>
                </div>
            )}
            {/* Customer 360 Dialog */}
            <Customer360Dialog
                customerId={selected360CustomerId}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
            />
            {/* Edit Customer Dialog */}
            {editTargetCustomer && (
                <EditCustomerDialog
                    customer={editTargetCustomer}
                    open={editDialogOpen}
                    onOpenChange={(isOpen) => {
                        setEditDialogOpen(isOpen)
                        if (!isOpen) setEditTargetCustomer(null)
                    }}
                />
            )}
        </div>
    )
}
