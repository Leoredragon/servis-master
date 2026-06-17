import NewCustomerDialog from "@/components/customers/NewCustomerDialog"
import ManageGroupsDialog from "@/components/customers/ManageGroupsDialog"
import CustomersTable from "@/components/customers/CustomersTable"
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
    city: string | null
    district: string | null
    address: string | null
    notes: string | null
    tax_office: string | null
    tax_number: string | null
    group_id: string | null
    customer_groups: {
        id?: string
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
                    <ManageGroupsDialog />
                    <NewCustomerDialog />
                </div>
            </div>

            {/* Tablo Alanı */}
            {customers && customers.length > 0 ? (
                <CustomersTable customers={customers} />
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