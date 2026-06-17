import { createClient } from "@/lib/supabase/server"
import NewStockDialog from "@/components/stock/NewStockDialog"
import StockTable from "@/components/stock/StockTable"
import { EmptyState } from "@/components/ui/empty-state"

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

export default async function StockPage() {
    const supabase = await createClient()

    // Supabase'den envanter verilerini çekiyoruz (created_at DESC sıralı)
    const { data } = await supabase
        .from('stock_cards')
        .select('*')
        .order('created_at', { ascending: false })

    const stocks = data as unknown as StockCard[] | null

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

            {/* Tablo Alanı */}
            {stocks && stocks.length > 0 ? (
                <StockTable stocks={stocks} />
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