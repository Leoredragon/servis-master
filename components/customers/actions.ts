'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCustomer(formData: FormData) {
    const supabase = await createClient()

    // Sütun adı artık 'type' olduğu için burası sorunsuz çalışacak
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
    const group_id = formData.get('groupId') as string || null

    const { data, error } = await supabase
        .from('customers')
        .insert([
            {
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

    const { data, error } = await supabase
        .from('customer_groups')
        .insert([{ name, discount_rate }])
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

export async function deleteCustomer(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Müşteri silinirken hata:', error.message)
        return { success: false, message: 'Müşteri silinemedi: ' + error.message }
    }

    revalidatePath('/customers')
    return { success: true }
}