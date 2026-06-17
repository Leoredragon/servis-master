import { createClient } from "@/lib/supabase/server"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import NewInvoiceDialog from "@/components/invoices/NewInvoiceDialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, FileText } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import Link from "next/link"

export default async function InvoicesPage() {
    const supabase = await createClient()

    // Müşteri isimlerini de getirmek için join
    const { data: invoices } = await supabase
        .from('invoices')
        .select('*, customers(first_name, last_name)')
        .order('issue_date', { ascending: false })

    return (
        <div className="space-y-6">
            {/* Sayfa Üst Bilgisi ve Aksiyonlar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Faturalar</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Kesilen faturaları, tahsilat durumlarını ve finansal hareketlerinizi buradan takip edin.
                    </p>
                </div>

                <NewInvoiceDialog />
            </div>

            {/* Tablo Alanı */}
            {invoices && invoices.length > 0 ? (
                <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-50/50">
                            <TableRow>
                                <TableHead className="w-[60px] font-medium">Simge</TableHead>
                                <TableHead className="w-[140px] font-medium">Fatura No</TableHead>
                                <TableHead className="font-medium">Müşteri</TableHead>
                                <TableHead className="font-medium">Tarih</TableHead>
                                <TableHead className="font-medium">Ödeme Yöntemi</TableHead>
                                <TableHead className="font-medium">Durum</TableHead>
                                <TableHead className="text-right font-medium">Toplam Tutar</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice) => {
                                const formattedDate = invoice.issue_date
                                    ? new Date(invoice.issue_date).toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })
                                    : "-"

                                const isPaid = invoice.status === "ödendi"

                                return (
                                    <TableRow key={invoice.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <TableCell>
                                            <div className="h-8 w-8 rounded bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-500">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold text-zinc-900 tracking-wide">
                                            <Link href={`/invoices/${invoice.id}`} className="hover:underline text-blue-650 font-bold">
                                                {invoice.invoice_no}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {invoice.customers
                                                ? `${invoice.customers.first_name} ${invoice.customers.last_name}`
                                                : "Bilinmeyen Müşteri"}
                                        </TableCell>
                                        <TableCell className="text-zinc-500">{formattedDate}</TableCell>
                                        <TableCell className="text-zinc-500 capitalize">{invoice.payment_type || "-"}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    isPaid
                                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 font-medium"
                                                        : "bg-amber-50 text-amber-700 hover:bg-amber-50 font-medium"
                                                }
                                            >
                                                {invoice.status || "taslak"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-zinc-900">
                                            {invoice.grand_total ? `${invoice.grand_total} ₺` : "0 ₺"}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-600">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <EmptyState
                    iconName="file-text"
                    title="Fatura Bulunamadı"
                    description="Henüz kesilmiş bir fatura bulunmuyor. Tamamlanan servisler üzerinden fatura oluşturabilirsiniz."
                />
            )}
        </div>
    )
}