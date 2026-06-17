'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createServiceRecord(formData: FormData) {
    const supabase = await createClient()

    const entryMileageVal = formData.get('entryMileage')
    const entry_mileage = entryMileageVal ? parseInt(entryMileageVal as string) : null

    // 1. Yeni servis kaydı oluştur
    const { data, error } = await supabase
        .from('service_records')
        .insert([{
            service_code: `SRV-${Date.now().toString().slice(-6)}`, // Basit bir kod üretici
            customer_id: formData.get('customerId'),
            vehicle_id: formData.get('vehicleId'),
            service_type: formData.get('serviceType'),
            priority: formData.get('priority'),
            status: 'araç kabul', // Başlangıç durumu "araç kabul"
            customer_complaint: formData.get('complaint'),
            entry_mileage,
            fuel_level: formData.get('fuelLevel') || null,
            damage_assessment: formData.get('damageAssessment') || null,
        }])
        .select()
        .single()

    if (error) {
        console.error('Servis kaydı oluşturulamadı:', error.message)
        throw new Error(error.message)
    }

    revalidatePath('/services')
    return { success: true, id: data.id }
}

export async function updateServiceStatus(serviceId: string, status: string) {
    if (status === 'tamamlandı') {
        return await completeService(serviceId)
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('service_records')
        .update({ status })
        .eq('id', serviceId)

    if (error) {
        console.error('Servis durumu güncellenemedi:', error.message)
        throw new Error(error.message)
    }

    revalidatePath(`/services/${serviceId}`)
    revalidatePath('/services')
    return { success: true }
}

export async function completeService(serviceId: string) {
    const supabase = await createClient()

    // 1. Servisi tamamla
    const { error: serviceUpdateError } = await supabase
        .from('service_records')
        .update({ status: 'tamamlandı' })
        .eq('id', serviceId)

    if (serviceUpdateError) {
        console.error('Servis tamamlanamadı:', serviceUpdateError.message)
        throw new Error(serviceUpdateError.message)
    }

    // 2. Servis kalemlerini çek
    const { data: items, error: itemsError } = await supabase
        .from('service_items')
        .select('*')
        .eq('service_id', serviceId)

    if (itemsError) {
        console.error('Servis kalemleri çekilemedi:', itemsError.message)
        throw new Error(itemsError.message)
    }

    // 3. Her kalem için stok çıkışı yap
    if (items && items.length > 0) {
        for (const item of items) {
            if (item.stock_id) {
                // Stoktan düş (Supabase RPC ile)
                const { error: rpcError } = await supabase.rpc('decrement_stock', {
                    stock_id_input: item.stock_id,
                    quantity_input: item.quantity
                })

                if (rpcError) {
                    console.error(`Stok düşürülemedi (stock_id: ${item.stock_id}):`, rpcError.message)
                    // Hatanın tamamını kesmemesi için continue diyebiliriz veya hata fırlatabiliriz. Genelde fırlatmak daha güvenlidir.
                    throw new Error(rpcError.message)
                }

                // Hareket kaydı oluştur
                const { error: movementError } = await supabase
                    .from('stock_movements')
                    .insert([{
                        stock_id: item.stock_id,
                        movement_type: 'çıkış',
                        quantity: item.quantity,
                        reference_type: 'servis',
                        reference_id: serviceId
                    }])

                if (movementError) {
                    console.error('Stok hareketi kaydedilemedi:', movementError.message)
                    throw new Error(movementError.message)
                }
            }
        }
    }

    revalidatePath(`/services/${serviceId}`)
    revalidatePath('/services')
    revalidatePath('/stock')
    return { success: true }
}
