'use server'

import { createClient, getCompanyId } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createServiceRecord(formData: FormData) {
    try {
        const supabase = await createClient()

        const customerId = formData.get('customerId') as string || null
        const vehicleId = formData.get('vehicleId') as string || null

        if (!customerId || customerId.trim() === "") {
            return { success: false, error: 'Müşteri seçimi zorunludur.' }
        }
        if (!vehicleId || vehicleId.trim() === "") {
            return { success: false, error: 'Araç seçimi zorunludur.' }
        }

        const entryMileageVal = formData.get('entryMileage') as string
        const parsedMileage = entryMileageVal ? parseInt(entryMileageVal, 10) : NaN
        const entry_mileage = isNaN(parsedMileage) ? null : parsedMileage

        const companyCheck = await getCompanyId()
        if (!companyCheck.success) {
            return { success: false, error: companyCheck.message }
        }

        // 1. Yeni servis kaydı oluştur
        const { data, error } = await supabase
            .from('service_records')
            .insert([{
                company_id: companyCheck.companyId,
                service_code: `SRV-${Date.now().toString().slice(-6)}`, // Basit bir kod üretici
                customer_id: customerId,
                vehicle_id: vehicleId,
                service_type: formData.get('serviceType') as string || null,
                priority: formData.get('priority') as string || null,
                status: 'araç kabul', // Başlangıç durumu "araç kabul"
                customer_complaint: formData.get('complaint') as string || null,
                entry_mileage,
                fuel_level: formData.get('fuelLevel') || null,
                damage_assessment: formData.get('damageAssessment') || null,
            }])
            .select()
            .single()

        if (error) {
            console.error('Servis kaydı oluşturulamadı:', error.message)
            return { success: false, error: error.message }
        }

        revalidatePath('/services')
        return { success: true, id: data.id }
    } catch (error: any) {
        console.error("Servis Kayıt Hatası:", error)
        return { success: false, error: error.message || 'Servis kaydı oluşturulurken bilinmeyen bir hata oluştu.' }
    }
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

    // Servisi tamamla (Stok düşüşleri ve hareketleri tetikleyiciler (triggers) tarafından arka planda otomatik yönetilecektir)
    const { error: serviceUpdateError } = await supabase
        .from('service_records')
        .update({ status: 'tamamlandı' })
        .eq('id', serviceId)

    if (serviceUpdateError) {
        console.error('Servis tamamlanamadı:', serviceUpdateError.message)
        throw new Error(serviceUpdateError.message)
    }

    revalidatePath(`/services/${serviceId}`)
    revalidatePath('/services')
    revalidatePath('/stock')
    return { success: true }
}

export async function addServiceItemAction(data: {
    serviceId: string
    stockId?: string | null
    description: string
    quantity: number
    unitPrice: number
    itemType: 'parça' | 'işçilik'
}) {
    const supabase = await createClient()
    const { serviceId, stockId, description, quantity, unitPrice, itemType } = data

    const companyCheck = await getCompanyId()
    if (!companyCheck.success) {
        return { success: false, error: companyCheck.message }
    }

    const { data: item, error } = await supabase
        .from('service_items')
        .insert([{
            company_id: companyCheck.companyId,
            service_id: serviceId,
            stock_id: stockId || null,
            item_type: itemType,
            description,
            quantity,
            unit_price: unitPrice,
            total_price: quantity * unitPrice
        }])
        .select()
        .single()

    if (error) {
        console.error('Servis kalemi eklenemedi:', error.message)
        return { success: false, error: error.message }
    }

    revalidatePath(`/services/${serviceId}`)
    return { success: true, item }
}

export async function updateServiceItemAction(itemId: string, serviceId: string, data: {
    description: string
    quantity: number
    unitPrice: number
}) {
    const supabase = await createClient()
    const { description, quantity, unitPrice } = data

    const { data: item, error } = await supabase
        .from('service_items')
        .update({
            description,
            quantity,
            unit_price: unitPrice,
            total_price: quantity * unitPrice
        })
        .eq('id', itemId)
        .select()
        .single()

    if (error) {
        console.error('Servis kalemi güncellenemedi:', error.message)
        return { success: false, error: error.message }
    }

    revalidatePath(`/services/${serviceId}`)
    return { success: true, item }
}

export async function deleteServiceItemAction(itemId: string, serviceId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('service_items')
        .delete()
        .eq('id', itemId)

    if (error) {
        console.error('Servis kalemi silinemedi:', error.message)
        return { success: false, error: error.message }
    }

    revalidatePath(`/services/${serviceId}`)
    return { success: true }
}

export async function deleteServiceRecord(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('service_records')
        .update({ is_deleted: true })
        .eq('id', id)

    if (error) {
        console.error('Servis kaydı silinirken hata:', error.message)
        return { success: false, message: 'Servis kaydı silinemedi: ' + error.message }
    }

    revalidatePath('/services')
    return { success: true }
}

export async function updateServiceRecord(id: string, data: {
    customerId: string
    vehicleId: string
    entryMileage: any
    fuelLevel: string | null
    damageAssessment: string | null
}) {
    try {
        const supabase = await createClient()
        let parsedMileage: number | null = null
        if (data.entryMileage !== undefined && data.entryMileage !== null && data.entryMileage !== '') {
            const num = parseInt(String(data.entryMileage), 10)
            parsedMileage = isNaN(num) ? null : num
        }

        const { error } = await supabase
            .from('service_records')
            .update({
                customer_id: data.customerId,
                vehicle_id: data.vehicleId,
                entry_mileage: parsedMileage,
                fuel_level: data.fuelLevel || null,
                damage_assessment: data.damageAssessment || null
            })
            .eq('id', id)

        if (error) {
            console.error('Servis kaydı güncellenemedi:', error.message)
            return { success: false, error: error.message }
        }

        revalidatePath(`/services/${id}`)
        revalidatePath('/services')
        return { success: true }
    } catch (error: any) {
        console.error("Servis Güncelleme Hatası:", error)
        return { success: false, error: error.message || 'Servis kaydı güncellenirken bilinmeyen bir hata oluştu.' }
    }
}

export async function addServiceStage(data: {
    serviceId: string
    stageName: string
    description: string
    personnelName: string
}) {
    const supabase = await createClient()
    const { serviceId, stageName, description, personnelName } = data

    const companyCheck = await getCompanyId()
    if (!companyCheck.success) {
        return { success: false, message: companyCheck.message }
    }

    const { data: stage, error } = await supabase
        .from('service_stages')
        .insert([{
            company_id: companyCheck.companyId,
            service_id: serviceId,
            stage_name: stageName,
            description,
            personnel_name: personnelName
        }])
        .select()
        .single()

    if (error) {
        console.error('Servis aşaması eklenemedi:', error.message)
        return { success: false, message: error.message }
    }

    revalidatePath(`/services/${serviceId}`)
    return { success: true, data: stage }
}

