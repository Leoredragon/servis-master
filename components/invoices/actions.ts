'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInvoice(formData: FormData) {
    const supabase = await createClient()

    const invoiceNo = formData.get('invoiceNo') as string
    const customerId = formData.get('customerId') as string
    const serviceId = formData.get('serviceId') as string || null
    const paymentType = formData.get('paymentType') as string // nakit, kredi_karti, havale, acik_hesap
    const cashRegisterId = formData.get('cashRegisterId') as string || null
    const bankAccountId = formData.get('bankAccountId') as string || null
    
    const description = formData.get('description') as string
    const quantityVal = formData.get('quantity')
    const unitPriceVal = formData.get('unitPrice')
    const grandTotalVal = formData.get('grandTotal')

    const quantity = quantityVal ? parseInt(quantityVal as string) : 1
    const unitPrice = unitPriceVal ? parseFloat(unitPriceVal as string) : 0
    const grandTotal = grandTotalVal ? parseFloat(grandTotalVal as string) : 0

    // 1. Validations
    if (!invoiceNo || !customerId) {
        return { success: false, message: 'Fatura numarası ve müşteri seçimi zorunludur.' }
    }

    // Kurumsal için vergi kontrolü
    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('type, tax_number, tax_office')
        .eq('id', customerId)
        .single()

    if (customerError) {
        return { success: false, message: 'Müşteri bilgileri doğrulanamadı.' }
    }

    if (customer && customer.type === 'kurumsal') {
        if (!customer.tax_number || !customer.tax_office) {
            return { success: false, message: 'Kurumsal müşteriler için Vergi Dairesi ve Vergi No / TCKN bilgileri tanımlanmış olmalıdır.' }
        }
    }

    // 2. Faturayı Ekle
    // Durum belirleme: Açık Hesap ise 'bekliyor', nakit/kart/havale ise 'ödendi'
    const status = paymentType === 'acik_hesap' ? 'bekliyor' : 'ödendi'

    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
            invoice_no: invoiceNo,
            customer_id: customerId,
            service_id: serviceId,
            invoice_type: 'satış',
            payment_type: paymentType,
            status,
            issue_date: new Date().toISOString(),
            grand_total: grandTotal,
        }])
        .select()
        .single()

    if (invoiceError) {
        return { success: false, message: 'Fatura oluşturulamadı: ' + invoiceError.message }
    }

    // 3. Fatura Kalemini Ekle
    const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert([{
            invoice_id: invoice.id,
            description: description || 'Hizmet Bedeli',
            quantity,
            unit_price: unitPrice,
            total_price: quantity * unitPrice,
        }])

    if (itemsError) {
        return { success: false, message: 'Fatura kalemleri oluşturulamadı: ' + itemsError.message }
    }

    // 4. Finansal Hareketi Ekle (Transaction)
    const transactionData: any = {
        customer_id: customerId,
        invoice_id: invoice.id,
        type: 'gelir',
        payment_method: paymentType,
        amount: grandTotal,
        description: `Fatura Satışı: ${invoiceNo}`
    }

    if (paymentType === 'nakit') {
        transactionData.cash_register_id = cashRegisterId
    } else if (paymentType === 'kredi_karti' || paymentType === 'havale') {
        transactionData.bank_account_id = bankAccountId
    }

    const { error: transactionError } = await supabase
        .from('transactions')
        .insert([transactionData])

    if (transactionError) {
        return { success: false, message: 'Finansal işlem hareketi kaydedilemedi: ' + transactionError.message }
    }

    revalidatePath('/invoices')
    revalidatePath('/finance')
    return { success: true, data: invoice }
}
