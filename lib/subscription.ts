import { createAdminClient } from './supabase/server'

export const MAX_CUSTOMERS_DEMO = 20
export const MAX_SERVICES_DEMO = 20

export async function checkCustomerLimit(companyId: string): Promise<boolean> {
    const adminSupabase = createAdminClient()

    // Şirket paketini kontrol et
    const { data: company, error: companyError } = await adminSupabase
        .from('companies')
        .select('plan_type')
        .eq('id', companyId)
        .single()

    if (companyError || !company) return false

    // Pro paketse limit yok
    if (company.plan_type === 'pro') return true

    // Demo paketse müşteri sayısını kontrol et
    const { count, error } = await adminSupabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_deleted', false)

    if (error) return false

    return (count || 0) < MAX_CUSTOMERS_DEMO
}
