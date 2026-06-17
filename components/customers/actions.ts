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