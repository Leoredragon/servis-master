import NewCustomerDialog from "@/components/customers/NewCustomerDialog"
import ManageGroupsSheet from "@/components/customers/ManageGroupsSheet"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/ui/empty-state"

interface CustomerWithGroup {
    id: string
    customer_code: string
    first_name: string
    last_name: string | null
    phone: string
    email: string | null
    type: string
    discount_rate: number
    tax_office?: string
    tax_number?: string
    customer_groups: {
        name: string
    } | null
}

export default async function CustomersPage() {
    const supabase = await createClient()

    // Supabase'den tüm müşterileri ve grupları çekiyoruz
    const { data, error } = await supabase
        .from('customers')
        .select('*, customer_groups(name)')
        .order('created_at', { ascending: false })

    const customers = data as unknown as CustomerWithGroup[] | null

    if (error) {
        console.error("Müşteriler çekilirken hata oluştu:", error.message)
    }

    return (
        <div className="space-y-6">
            {/* Sayfa Üst Bilgisi ve Aksiyonlar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Müşteriler</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Müşteri kayıtlarını, iletişim bilgilerini ve geçmiş operasyon özetlerini buradan takip edin.
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <ManageGroupsSheet />
                    <NewCustomerDialog />
                </div>
            </div>

            {/* Tablo Alanı */}
            {customers && customers.length > 0 ? (
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
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map((customer) => (
                                <TableRow key={customer.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <TableCell className="font-medium text-zinc-900">{customer.customer_code}</TableCell>
                                    <TableCell className="font-medium text-zinc-900">
                                        <div>
                                            {customer.first_name} {customer.last_name || ""}
                                        </div>
                                        {customer.type === "kurumsal" && (customer.tax_office || customer.tax_number) && (
                                            <div className="text-xs text-zinc-400 font-normal mt-0.5">
                                                {customer.tax_office && `${customer.tax_office} V.D.`}
                                                {customer.tax_office && customer.tax_number && " / "}
                                                {customer.tax_number && `VKN: ${customer.tax_number}`}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-zinc-500">{customer.phone}</TableCell>
                                    <TableCell className="text-zinc-500">{customer.email || "-"}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={
                                                customer.type === "kurumsal"
                                                    ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                                                    : customer.type === "personel"
                                                    ? "bg-purple-50 text-purple-700 hover:bg-purple-50"
                                                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-100"
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
                                            <Badge variant="outline" className="bg-zinc-50 text-zinc-700 border-zinc-200">
                                                {customer.customer_groups.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-zinc-400 text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-zinc-500 font-medium">
                                        {customer.discount_rate && customer.discount_rate > 0 ? (
                                            <span className="text-emerald-600">%{customer.discount_rate}</span>
                                        ) : (
                                            <span className="text-zinc-400">-%0</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-600">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <EmptyState
                    iconName="users"
                    title="Müşteri Bulunamadı"
                    description="Sistemde kayıtlı müşteri bulunmuyor. Yeni bir müşteri ekleyerek işe başlayın."
                />
            )}
        </div>
    )
}