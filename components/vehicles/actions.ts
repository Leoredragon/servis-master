'use server'

import { createClient, getCompanyId } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createVehicle(formData: FormData) {
    const supabase = await createClient()

    // Veritabanındaki gerçek sütun isimlerine göre eşleştiriyoruz
    const customer_id = formData.get('customerId') as string
    const plate = formData.get('plate') as string
    const brand = formData.get('brand') as string
    const model = formData.get('model') as string
    const year = formData.get('year') as string
    const chassis_number = formData.get('vin') as string
    const engine_number = formData.get('engineNo') as string
    const mileage = formData.get('currentKm') as string
    const notes = formData.get('notes') as string

    const companyCheck = await getCompanyId()
    if (!companyCheck.success) {
        throw new Error(companyCheck.message)
    }

    const { error } = await supabase
        .from('vehicles')
        .insert([
            {
                company_id: companyCheck.companyId,
                customer_id,
                plate,
                brand,
                model,
                year: year ? parseInt(year) : null,
                chassis_number: chassis_number || null, // Kodda 'vin' demiştik, burada veritabanı ismine çevirdik
                engine_number: engine_number || null,   // Kodda 'engine_no' demiştik
                mileage: mileage ? parseInt(mileage) : 0, // Kodda 'current_km' demiştik
                notes: notes || null,
            },
        ])

    if (error) {
        console.error('Araç eklenirken hata oluştu:', error.message)
        throw new Error(`Araç kaydedilemedi: ${error.message}`)
    }

    revalidatePath('/vehicles')
}

export async function deleteVehicle(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('vehicles')
        .update({ is_deleted: true })
        .eq('id', id)

    if (error) {
        console.error('Araç silinirken hata:', error.message)
        return { success: false, message: 'Araç silinemedi: ' + error.message }
    }

    revalidatePath('/vehicles')
    return { success: true }
}

export async function updateVehicle(id: string, formData: FormData) {
    const supabase = await createClient()

    const plate = formData.get('plate') as string
    const brand = formData.get('brand') as string
    const model = formData.get('model') as string
    const year = formData.get('year') as string
    const chassis_number = formData.get('vin') as string
    const engine_number = formData.get('engineNo') as string
    const mileage = formData.get('currentKm') as string
    const notes = formData.get('notes') as string

    if (!plate || !brand || !model) {
        return { success: false, message: 'Plaka, marka ve model zorunludur.' }
    }

    const { data, error } = await supabase
        .from('vehicles')
        .update({
            plate: plate.trim().toUpperCase(),
            brand: brand.trim(),
            model: model.trim(),
            year: year ? parseInt(year) : null,
            chassis_number: chassis_number?.trim() || null,
            engine_number: engine_number?.trim() || null,
            mileage: mileage ? parseInt(mileage) : 0,
            notes: notes?.trim() || null,
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Araç güncellenirken hata:', error.message)
        return { success: false, message: 'Araç güncellenemedi: ' + error.message }
    }

    revalidatePath('/vehicles')
    return { success: true, data }
}