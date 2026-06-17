import { createClient } from "@/lib/supabase/server"
import FinanceDashboard from "@/components/finance/FinanceDashboard"

export default async function FinancePage() {
    const supabase = await createClient()

    // 1. Kasaları çek
    const { data: cashRegisters } = await supabase
        .from('cash_registers')
        .select('*')
        .order('name', { ascending: true })

    // 2. Bankaları çek
    const { data: bankAccounts } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('name', { ascending: true })

    // 3. Müşterileri çek
    const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .order('first_name', { ascending: true })

    // 4. Son cari hareketleri çek
    const { data: transactions } = await supabase
        .from('transactions')
        .select(`
            *,
            customers(first_name, last_name, phone),
            cash_registers(name),
            bank_accounts(name)
        `)
        .order('transaction_date', { ascending: false })

    return (
        <FinanceDashboard
            initialCashRegisters={cashRegisters || []}
            initialBankAccounts={bankAccounts || []}
            initialCustomers={customers || []}
            initialTransactions={transactions || []}
        />
    )
}
