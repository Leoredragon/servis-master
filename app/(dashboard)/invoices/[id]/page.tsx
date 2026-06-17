import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Calendar, User, FileText, ChevronLeft, CreditCard } from "lucide-react"
import Link from "next/link"
import InvoiceDetailActions from "@/components/invoices/InvoiceDetailActions"

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Faturayı, müşteriyi ve fatura kalemlerini çek
    const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*, customers(*), invoice_items(*)')
        .eq('id', id)
        .single()

    if (error || !invoice) {
        return (
            <div className="p-8 text-center bg-white border border-zinc-200 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-zinc-900">Fatura Bulunamadı</h3>
                <p className="text-sm text-zinc-500 mt-1">İlgili fatura kaydı veritabanından silinmiş veya bulunamıyor olabilir.</p>
                <Button className="mt-4" asChild>
                    <Link href="/invoices">Faturalara Dön</Link>
                </Button>
            </div>
        )
    }

    const isPaid = invoice.status === "ödendi"
    const issueDate = invoice.issue_date 
        ? new Date(invoice.issue_date).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : "-"

    const paymentLabels: Record<string, string> = {
        "nakit": "Nakit (Kasa)",
        "kredi_karti": "Kredi Kartı",
        "havale": "EFT / Havale",
        "acik_hesap": "Açık Hesap (Cari)"
    }

    return (
        <>
            {/* Web Raporu (Yazdırma esnasında gizlenecek) */}
            <div className="space-y-6 print:hidden">
                {/* Geri Dön Butonu ve Başlık */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1.5">
                        <Link href="/invoices" className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-950 transition-colors">
                            <ChevronLeft className="w-3.5 h-3.5" /> Faturalara Geri Dön
                        </Link>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-zinc-400" /> Fatura: {invoice.invoice_no}
                            </h2>
                            <Badge
                                variant="secondary"
                                className={
                                    isPaid
                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 font-semibold"
                                        : "bg-amber-50 text-amber-700 hover:bg-amber-50 font-semibold"
                                }
                            >
                                {invoice.status?.toUpperCase()}
                            </Badge>

                            {/* Yazdırma ve WhatsApp Butonları */}
                            <InvoiceDetailActions
                                invoiceId={invoice.id}
                                invoiceNo={invoice.invoice_no}
                                customerName={`${invoice.customers?.first_name || ""} ${invoice.customers?.last_name || ""}`}
                                phone={invoice.customers?.phone || ""}
                                totalAmount={invoice.grand_total}
                                paymentType={invoice.payment_type}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Fatura İçerik Kartı */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm space-y-6">
                            <h3 className="text-lg font-bold text-zinc-900 border-b pb-2">Fatura Kalem Detayları</h3>
                            
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Açıklama</TableHead>
                                        <TableHead className="text-center w-24">Miktar</TableHead>
                                        <TableHead className="text-right w-32">Birim Fiyat</TableHead>
                                        <TableHead className="text-right w-32">Toplam Tutar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.invoice_items && invoice.invoice_items.length > 0 ? (
                                        invoice.invoice_items.map((item: any) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-semibold text-zinc-900">{item.description}</TableCell>
                                                <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{item.unit_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</TableCell>
                                                <TableCell className="text-right font-bold text-zinc-950">
                                                    {item.total_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-zinc-400">
                                                Bu faturaya ait kalem bulunamadı.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            <div className="flex justify-end pt-4 border-t border-zinc-100">
                                <div className="text-right space-y-1">
                                    <span className="text-xs text-zinc-400 font-bold uppercase">Genel Toplam (KDV Dahil)</span>
                                    <p className="text-3xl font-extrabold text-zinc-900">
                                        {invoice.grand_total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sağ Taraf: Fatura & Müşteri Özet Kartları */}
                    <div className="space-y-6">
                        {/* Fatura Bilgileri */}
                        <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <CreditCard className="w-5 h-5 text-zinc-400" />
                                <h3 className="text-base font-bold text-zinc-900">Ödeme & Tarih</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-xs text-zinc-450 font-bold uppercase">Fatura Kesim Tarihi</p>
                                    <p className="font-semibold text-zinc-800 mt-0.5">{issueDate}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-450 font-bold uppercase">Ödeme Tipi</p>
                                    <p className="font-semibold text-zinc-850 mt-0.5">
                                        {paymentLabels[invoice.payment_type] || invoice.payment_type}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Müşteri Bilgileri */}
                        <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <User className="w-5 h-5 text-zinc-400" />
                                <h3 className="text-base font-bold text-zinc-900">Müşteri Cari</h3>
                            </div>
                            {invoice.customers ? (
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-xs text-zinc-450 font-bold uppercase">Ad Soyad / Ünvan</p>
                                        <p className="font-bold text-zinc-950 mt-0.5">
                                            {invoice.customers.first_name} {invoice.customers.last_name || ""}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-450 font-bold uppercase">Telefon</p>
                                        <p className="text-zinc-700 mt-0.5">{invoice.customers.phone || "-"}</p>
                                    </div>
                                    {invoice.customers.type === "kurumsal" && (
                                        <>
                                            <div>
                                                <p className="text-xs text-zinc-450 font-bold uppercase">Vergi Dairesi</p>
                                                <p className="text-zinc-700 mt-0.5">{invoice.customers.tax_office || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-zinc-450 font-bold uppercase">Vergi No / TCKN</p>
                                                <p className="text-zinc-700 mt-0.5">{invoice.customers.tax_number || "-"}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-450">İlişkili müşteri bulunamadı.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* A4 Yazıcı Dostu Fatura Çıktı Tasarımı (Sadece yazdırma esnasında görünecektir) */}
            <div className="hidden print:block w-full text-zinc-900 font-sans p-4 space-y-8" style={{ minHeight: '297mm', width: '100%' }}>
                {/* Print Header */}
                <div className="flex justify-between items-start border-b border-zinc-300 pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-blue-600">OMES</h1>
                        <p className="text-xs text-zinc-500 mt-1">Teknik Servis ve Operasyon Yönetim Sistemi</p>
                    </div>
                    <div className="text-right space-y-1">
                        <h2 className="text-xl font-bold tracking-wide">SATIŞ FATURASI</h2>
                        <p className="text-sm font-semibold text-zinc-700">Fatura No: {invoice.invoice_no}</p>
                        <p className="text-xs text-zinc-500">
                            Tarih: {new Date(invoice.created_at).toLocaleDateString('tr-TR')}
                        </p>
                        {/* Dinamik QR Kod Entegrasyonu */}
                        <div className="mt-2 flex justify-end">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`http://localhost:3000/invoices/${invoice.id}`)}`} 
                                alt="QR Code" 
                                className="w-16 h-16 border border-zinc-200 p-0.5 rounded bg-white" 
                            />
                        </div>
                    </div>
                </div>

                {/* Fatura Cari Kartları */}
                <div className="grid grid-cols-2 gap-6 border border-zinc-200 rounded-lg p-5">
                    <div className="space-y-1.5">
                        <h3 className="font-bold text-xs text-zinc-400 uppercase tracking-wider border-b pb-1">Fatura Alıcısı</h3>
                        <p className="text-sm"><strong>Müşteri:</strong> {invoice.customers?.first_name} {invoice.customers?.last_name || ""}</p>
                        <p className="text-sm"><strong>Telefon:</strong> {invoice.customers?.phone || "-"}</p>
                        <p className="text-sm"><strong>E-posta:</strong> {invoice.customers?.email || "-"}</p>
                        {invoice.customers?.type === "kurumsal" && (
                            <>
                                <p className="text-sm"><strong>Vergi Dairesi:</strong> {invoice.customers?.tax_office || "-"}</p>
                                <p className="text-sm"><strong>VKN / TCKN:</strong> {invoice.customers?.tax_number || "-"}</p>
                            </>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="font-bold text-xs text-zinc-400 uppercase tracking-wider border-b pb-1">Fatura Detayları</h3>
                        <p className="text-sm"><strong>Ödeme Türü:</strong> {paymentLabels[invoice.payment_type] || invoice.payment_type}</p>
                        <p className="text-sm"><strong>Fatura Durumu:</strong> {invoice.status === "ödendi" ? "Tahsil Edildi (Ödendi)" : "Ödeme Bekleniyor (Açık Hesap)"}</p>
                    </div>
                </div>

                {/* Fatura Kalem Tablosu */}
                <div className="space-y-2">
                    <h3 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">Fatura Detayları (Ürün & Hizmetler)</h3>
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b-2 border-zinc-300 bg-zinc-50 text-zinc-700">
                                <th className="py-2 px-3 font-semibold">Açıklama / Detay</th>
                                <th className="py-2 px-3 text-center w-20 font-semibold">Miktar</th>
                                <th className="py-2 px-3 text-right w-28 font-semibold">Birim Fiyat</th>
                                <th className="py-2 px-3 text-right w-28 font-semibold">Toplam Fiyat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {invoice.invoice_items && invoice.invoice_items.length > 0 ? (
                                invoice.invoice_items.map((item: any) => (
                                    <tr key={item.id} className="text-zinc-800">
                                        <td className="py-2.5 px-3">{item.description}</td>
                                        <td className="py-2.5 px-3 text-center font-medium">{item.quantity}</td>
                                        <td className="py-2.5 px-3 text-right">{item.unit_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                        <td className="py-2.5 px-3 text-right font-semibold">{item.total_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-4 text-center text-zinc-400">Kalem bulunmamaktadır.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Finansal Toplam */}
                <div className="flex justify-end pt-4">
                    <div className="text-right space-y-1.5 w-64 border-t border-zinc-200 pt-3">
                        <div className="flex justify-between text-xs text-zinc-500 font-semibold uppercase">
                            <span>Genel Toplam</span>
                        </div>
                        <div className="text-2xl font-bold text-zinc-900">
                            {invoice.grand_total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </div>
                    </div>
                </div>

                {/* Print Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-20 mt-16">
                    <div className="text-center space-y-12">
                        <p className="text-xs font-bold text-zinc-500 uppercase border-b border-zinc-200 pb-1">Faturayı Düzenleyen / Kaşe</p>
                        <div className="h-12 flex items-end justify-center text-xs text-zinc-400 italic">İmza</div>
                    </div>
                    <div className="text-center space-y-12">
                        <p className="text-xs font-bold text-zinc-500 uppercase border-b border-zinc-200 pb-1">Faturayı Teslim Alan</p>
                        <div className="h-12 flex items-end justify-center text-xs text-zinc-400 italic">İsim / İmza</div>
                    </div>
                </div>
            </div>
        </>
    )
}
