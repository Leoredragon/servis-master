'use server'

import { createClient } from '@/lib/supabase/server'
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

    const { error } = await supabase
        .from('vehicles')
        .insert([
            {
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