'use server'

import { createClient, getCompanyId } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCustomer(formData: FormData) {
    const supabase = await createClient()

    // Sütun adı artık 'type' olduğu için burası sorunsuz çalışacak
    const type = formData.get('type') as string
    let customer_code = formData.get('customerCode') as string
    const first_name = formData.get('firstName') as string
    const last_name = formData.get('lastName') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const city = formData.get('city') as string
    const district = formData.get('district') as string
    const address = formData.get('address') as string
    const notes = formData.get('notes') as string
    
    const tax_office = formData.get('taxOffice') as string
    const tax_number = formData.get('taxNumber') as string
    const discountRateVal = formData.get('discountRate')
    const discount_rate = discountRateVal ? parseFloat(discountRateVal as string) : 0
    const group_id = formData.get('groupId') as string || null

    const companyCheck = await getCompanyId()
    if (!companyCheck.success) {
        return { success: false, message: companyCheck.message }
    }

    // Şirkete özel otomatik müşteri kodu üretimi
    if (!customer_code) {
        const { data: lastCustomer } = await supabase
            .from('customers')
            .select('customer_code')
            .eq('company_id', companyCheck.companyId)
            .ilike('customer_code', 'MÜŞ-%')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (lastCustomer?.customer_code) {
            const lastNumberMatch = lastCustomer.customer_code.match(/MÜŞ-(\d+)/)
            if (lastNumberMatch && lastNumberMatch[1]) {
                const nextNumber = parseInt(lastNumberMatch[1], 10) + 1
                customer_code = `MÜŞ-${nextNumber.toString().padStart(3, '0')}`
            } else {
                customer_code = 'MÜŞ-001'
            }
        } else {
            customer_code = 'MÜŞ-001'
        }
    }

    const { data, error } = await supabase
        .from('customers')
        .insert([
            {
                company_id: companyCheck.companyId,
                type, // Artık veritabanındaki sütun adıyla birebir eşleşiyor ('bireysel' | 'kurumsal' | 'personel')
                customer_code,
                first_name,
                last_name: last_name || null,
                phone,
                email: email || null,
                city: city || null,
                district: district || null,
                address: address || null,
                notes: notes || null,
                tax_office: tax_office || null,
                tax_number: tax_number || null,
                discount_rate,
                group_id: group_id && group_id !== 'none' ? group_id : null,
            },
        ])
        .select()
        .single()

    if (error) {
        console.error('Müşteri eklenirken hata oluştu:', error.message)
        return { success: false, message: 'Müşteri kaydedilemedi: ' + error.message }
    }

    revalidatePath('/customers')
    return { success: true, data }
}

export async function getCustomerGroups() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('customer_groups')
        .select('*')
        .order('name', { ascending: true })
    if (error) {
        console.error('Müşteri grupları getirilemedi:', error.message)
        return []
    }
    return data || []
}

export async function createCustomerGroup(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const discountRateVal = formData.get('discountRate')
    const discount_rate = discountRateVal ? parseFloat(discountRateVal as string) : 0

    if (!name) {
        return { success: false, message: 'Grup adı gereklidir.' }
    }

    const companyCheck = await getCompanyId()
    if (!companyCheck.success) {
        return { success: false, message: companyCheck.message }
    }

    const { data, error } = await supabase
        .from('customer_groups')
        .insert([{ company_id: companyCheck.companyId, name, discount_rate }])
        .select()
        .single()

    if (error) {
        console.error('Müşteri grubu eklenirken hata:', error.message)
        return { success: false, message: 'Grup eklenemedi: ' + error.message }
    }

    revalidatePath('/customers')
    return { success: true, data }
}

export async function deleteCustomerGroup(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('customer_groups')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Müşteri grubu silinirken hata:', error.message)
        return { success: false, message: 'Grup silinemedi: ' + error.message }
    }

    revalidatePath('/customers')
    return { success: true }
}

export async function updateCustomerGroup(id: string, name: string, discountRate: number) {
    const supabase = await createClient()

    if (!name || !name.trim()) {
        return { success: false, message: 'Grup adı gereklidir.' }
    }

    const { data, error } = await supabase
        .from('customer_groups')
        .update({ name: name.trim(), discount_rate: discountRate })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Müşteri grubu güncellenirken hata:', error.message)
        return { success: false, message: 'Grup güncellenemedi: ' + error.message }
    }

    revalidatePath('/customers')
    return { success: true, data }
}

export async function deleteCustomer(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('customers')
        .update({ is_deleted: true })
        .eq('id', id)

    if (error) {
        console.error('Müşteri silinirken hata:', error.message)
        return { success: false, message: 'Müşteri silinemedi: ' + error.message }
    }

    revalidatePath('/customers')
    return { success: true }
}

export async function updateCustomer(id: string, formData: FormData) {
    const supabase = await createClient()

    const type = formData.get('type') as string
    const customer_code = formData.get('customerCode') as string
    const first_name = formData.get('firstName') as string
    const last_name = formData.get('lastName') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const city = formData.get('city') as string
    const district = formData.get('district') as string
    const address = formData.get('address') as string
    const notes = formData.get('notes') as string
    const tax_office = formData.get('taxOffice') as string
    const tax_number = formData.get('taxNumber') as string
    const discountRateVal = formData.get('discountRate')
    const discount_rate = discountRateVal ? parseFloat(discountRateVal as string) : 0
    const group_id_raw = formData.get('groupId') as string

    if (!first_name || !phone) {
        return { success: false, message: 'Ad ve telefon zorunludur.' }
    }

    const { data, error } = await supabase
        .from('customers')
        .update({
            type,
            first_name: first_name.trim(),
            last_name: last_name?.trim() || null,
            phone: phone.trim(),
            email: email?.trim() || null,
            city: city?.trim() || null,
            district: district?.trim() || null,
            address: address?.trim() || null,
            notes: notes?.trim() || null,
            tax_office: tax_office?.trim() || null,
            tax_number: tax_number?.trim() || null,
            discount_rate,
            group_id: group_id_raw && group_id_raw !== 'none' ? group_id_raw : null,
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Müşteri güncellenirken hata:', error.message)
        return { success: false, message: 'Müşteri güncellenemedi: ' + error.message }
    }

    revalidatePath('/customers')
    return { success: true, data }
}

export async function getCustomer360Data(customerId: string) {
    const supabase = await createClient()
    const companyCheck = await getCompanyId()

    // 1. Fetch customer details
    const { data: customer } = await supabase
        .from('customers')
        .select('*, customer_groups(name)')
        .eq('id', customerId)
        .single()

    // 2. Fetch vehicles
    const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

    // 3. Fetch service records
    const { data: services } = await supabase
        .from('service_records')
        .select('*, vehicles(brand, model, plate), service_items(unit_price, quantity)')
        .eq('customer_id', customerId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

    // 4. Fetch transactions
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*, cash_registers(name), bank_accounts(name)')
        .eq('customer_id', customerId)
        .order('transaction_date', { ascending: false })

    // 5. Fetch cash registers and bank accounts
    let cashRegisters = []
    let bankAccounts = []
    
    if (companyCheck.success) {
        const { data: cr } = await supabase
            .from('cash_registers')
            .select('id, name')
            .eq('company_id', companyCheck.companyId)
            .order('name', { ascending: true })
        
        cashRegisters = cr || []

        const { data: ba } = await supabase
            .from('bank_accounts')
            .select('id, name')
            .eq('company_id', companyCheck.companyId)
            .order('name', { ascending: true })
            
        bankAccounts = ba || []
    }

    return {
        customer,
        vehicles: vehicles || [],
        services: services || [],
        transactions: transactions || [],
        cashRegisters: cashRegisters || [],
        bankAccounts: bankAccounts || []
    }
}