'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAppointment(formData: FormData) {
    const supabase = await createClient()

    const { error } = await supabase.from('appointments').insert([{
        customer_id: formData.get('customerId'),
        vehicle_id: formData.get('vehicleId'),
        title: formData.get('title'),
        appointment_date: formData.get('appointmentDate'), // ISO formatında tarih
        status: 'planlandı',
    }])

    if (error) {
        console.error('Randevu oluşturulamadı:', error.message)
        throw new Error(error.message)
    }

    revalidatePath('/appointments')
    revalidatePath('/')
    return { success: true }
}
