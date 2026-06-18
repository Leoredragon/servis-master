import { createClient } from "@/lib/supabase/server"
import DashboardOverview from "@/components/dashboard/DashboardOverview"

export default async function DashboardPage() {
    const supabase = await createClient()

    // 1. Kasaları çek
    const { data: cashRegisters } = await supabase
        .from('cash_registers')
        .select('*')

    // 2. Banka hesaplarını çek
    const { data: bankAccounts } = await supabase
        .from('bank_accounts')
        .select('*')

    // 3. Müşteri bakiyelerini ve tiplerini çek (silinmemiş olanlar)
    const { data: customers } = await supabase
        .from('customers')
        .select('id, first_name, last_name, phone, type, balance')
        .eq('is_deleted', false)

    // 4. Finansal hareketleri çek
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false })

    // 5. Servis kayıtlarını detaylarıyla çek (silinmemiş olanlar)
    const { data: serviceRecords } = await supabase
        .from('service_records')
        .select('*, customers(first_name, last_name), vehicles(plate, brand, model)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

    // 6. Stok durumlarını çek (silinmemiş olanlar)
    const { data: stockCards } = await supabase
        .from('stock_cards')
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true })

    // 7. Bugünkü / Yaklaşan randevuları çek (Bugün ve sonrası, silinmemiş olanlar)
    const todayStr = new Date()
    todayStr.setHours(0, 0, 0, 0)

    const { data: appointments } = await supabase
        .from('appointments')
        .select('*, customers(first_name, last_name, phone)')
        .eq('is_deleted', false)
        .gte('appointment_date', todayStr.toISOString())
        .order('appointment_date', { ascending: true })

    // 8. Açık faturaları çek (is_deleted = false, status != 'ödendi', en yakın vadeye göre sıralı)
    const { data: openInvoices } = await supabase
        .from('invoices')
        .select('*, customers(first_name, last_name, phone)')
        .eq('is_deleted', false)
        .neq('status', 'ödendi')
        .order('due_date', { ascending: true })

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Yönetim Paneli</h2>
                <p className="text-sm text-zinc-500 mt-1">
                    İşletmenizin operasyonel ve finansal nabzını anlık olarak izleyin.
                </p>
            </div>

            <DashboardOverview
                cashRegisters={cashRegisters || []}
                bankAccounts={bankAccounts || []}
                customers={customers || []}
                transactions={transactions || []}
                serviceRecords={serviceRecords || []}
                stockCards={stockCards || []}
                appointments={appointments || []}
                openInvoices={openInvoices || []}
            />
        </div>
    )
}