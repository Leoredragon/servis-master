'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createStock(formData: FormData) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('stock_cards')
        .insert([{
            stock_code: formData.get('stockCode'),
            name: formData.get('name'),
            category: formData.get('category'),
            brand: formData.get('brand'),
            barcode: formData.get('barcode'),
            unit: formData.get('unit'),
            purchase_price: formData.get('purchasePrice'),
            sale_price: formData.get('salePrice'),
            vat_rate: formData.get('vatRate'),
            min_stock: formData.get('minStock'),
            current_stock: formData.get('currentStock'),
            location: formData.get('location'),
            notes: formData.get('notes'),
        }])

    if (error) {
        console.error('Stok kaydedilemedi:', error.message)
        return { success: false, message: `Stok kaydedilemedi: ${error.message}` }
    }
    revalidatePath('/stock')
    return { success: true, message: 'Stok kartı başarıyla oluşturuldu!' }
}