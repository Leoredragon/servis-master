import { createClient } from "@/lib/supabase/server"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import NewStockDialog from "@/components/stock/NewStockDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Package } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

export default async function StockPage() {
    const supabase = await createClient()
    const { data: stocks } = await supabase
        .from('stock_cards')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Stok Kartları</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Yedek parça stok miktarını, kritik seviyeleri ve malzeme maliyetlerini anlık olarak izleyin.
                    </p>
                </div>
                <NewStockDialog />
            </div>

            {stocks && stocks.length > 0 ? (
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
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stocks.map((stock) => {
                                const isCritical = stock.current_stock <= (stock.min_stock ?? 0)
                                return (
                                    <TableRow key={stock.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <TableCell>
                                            <div className="h-8 w-8 rounded bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-500">
                                                <Package className="w-4 h-4" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-zinc-600">{stock.stock_code}</TableCell>
                                        <TableCell className="font-medium text-zinc-900">{stock.name}</TableCell>
                                        <TableCell className="text-zinc-500">{stock.category || "-"}</TableCell>
                                        <TableCell className="text-zinc-500">{stock.brand || "-"}</TableCell>
                                        <TableCell className="text-center font-semibold text-zinc-900">
                                            {stock.current_stock} {stock.unit || "Adet"}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-zinc-900">
                                            {stock.sale_price ? `${stock.sale_price} ₺` : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    isCritical
                                                        ? "bg-red-50 text-red-700 hover:bg-red-50 font-medium"
                                                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 font-medium"
                                                }
                                            >
                                                {isCritical ? "Kritik Stok!" : "Stokta Var"}
                                            </Badge>
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
                    iconName="package"
                    title="Stok Kartı Bulunamadı"
                    description="Henüz bir stok kartı oluşturmadınız. Envanterinizi takip etmeye başlamak için yeni bir stok kartı ekleyin."
                />
            )}
        </div>
    )
}