'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface InvoiceItemInput {
    description: string
    quantity: number
    unitPrice: number
    kdvRate?: string
}

interface CreateInvoiceInput {
    invoiceNo: string
    customerId: string
    serviceId?: string | null
    paymentType: 'nakit' | 'kredi_karti' | 'havale' | 'acik_hesap' | 'parçalı'
    cashRegisterId?: string | null
    bankAccountId?: string | null
    cashAmount?: number
    bankAmount?: number
    creditAmount?: number
    items: InvoiceItemInput[]
    notes?: string
}

export async function createInvoice(data: CreateInvoiceInput) {
    const supabase = await createClient()

    const {
        invoiceNo,
        customerId,
        serviceId = null,
        paymentType,
        cashRegisterId = null,
        bankAccountId = null,
        cashAmount = 0,
        bankAmount = 0,
        creditAmount = 0,
        items = [],
        notes = ''
    } = data

    // 1. Validations
    if (!invoiceNo || !customerId) {
        return { success: false, message: 'Fatura numarası ve müşteri seçimi zorunludur.' }
    }

    if (items.length === 0) {
        return { success: false, message: 'Faturaya en az bir kalem eklenmelidir.' }
    }

    // Kurumsal müşteri vergi doğrulama
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

    // Toplam tutarları hesapla
    let subtotal = 0
    let vatTotal = 0
    
    const preparedItems = items.map((item) => {
        const qty = Math.max(1, item.quantity)
        const price = Math.max(0, item.unitPrice)
        const rate = parseFloat(item.kdvRate || '20')
        const itemSubtotal = qty * price
        const itemVat = itemSubtotal * (rate / 100)
        
        subtotal += itemSubtotal
        vatTotal += itemVat

        return {
            description: item.description || 'Hizmet Bedeli',
            quantity: qty,
            unit_price: price,
            total_price: itemSubtotal + itemVat // total price including KDV for the item
        }
    })

    const grandTotal = subtotal + vatTotal

    // Durum ve Tahsil Edilen Tutarlar
    let status = 'ödendi'
    let finalPaidAmount = grandTotal

    if (paymentType === 'acik_hesap') {
        status = 'bekliyor'
        finalPaidAmount = 0
    } else if (paymentType === 'parçalı') {
        const totalPaid = cashAmount + bankAmount
        finalPaidAmount = totalPaid
        if (creditAmount <= 0) {
            status = 'ödendi'
        } else if (totalPaid > 0) {
            status = 'kısmi_ödendi'
        } else {
            status = 'bekliyor'
        }
    }

    // 2. Faturayı Ekle
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
            invoice_no: invoiceNo,
            customer_id: customerId,
            service_id: serviceId || null,
            invoice_type: 'satış',
            payment_type: paymentType,
            status,
            issue_date: new Date().toISOString(),
            subtotal,
            vat_total: vatTotal,
            grand_total: grandTotal,
            paid_amount: finalPaidAmount,
            notes
        }])
        .select()
        .single()

    if (invoiceError) {
        return { success: false, message: 'Fatura oluşturulamadı: ' + invoiceError.message }
    }

    // 3. Fatura Kalemlerini Ekle
    const preparedItemsWithInvoiceId = preparedItems.map(item => ({
        invoice_id: invoice.id,
        ...item
    }))

    const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(preparedItemsWithInvoiceId)

    if (itemsError) {
        // cleanup invoice if items insert fail
        await supabase.from('invoices').delete().eq('id', invoice.id)
        return { success: false, message: 'Fatura kalemleri oluşturulamadı: ' + itemsError.message }
    }

    // 4. Finansal Hareketleri Ekle (Transactions)
    if (paymentType === 'parçalı') {
        // Parçalı ödeme için işlemler
        if (cashAmount > 0) {
            const { error: cashErr } = await supabase
                .from('transactions')
                .insert([{
                    customer_id: customerId,
                    invoice_id: invoice.id,
                    cash_register_id: cashRegisterId,
                    type: 'gelir',
                    payment_method: 'nakit',
                    amount: cashAmount,
                    description: `Fatura Nakit Tahsilat (Fatura No: ${invoiceNo})`
                }])
            if (cashErr) console.error("Nakit transaction error:", cashErr.message)
        }

        if (bankAmount > 0) {
            const { error: bankErr } = await supabase
                .from('transactions')
                .insert([{
                    customer_id: customerId,
                    invoice_id: invoice.id,
                    bank_account_id: bankAccountId,
                    type: 'gelir',
                    payment_method: 'kredi_karti', // default to card for bank tx
                    amount: bankAmount,
                    description: `Fatura Banka/Kart Tahsilat (Fatura No: ${invoiceNo})`
                }])
            if (bankErr) console.error("Banka transaction error:", bankErr.message)
        }

        if (creditAmount > 0) {
            const { error: creditErr } = await supabase
                .from('transactions')
                .insert([{
                    customer_id: customerId,
                    invoice_id: invoice.id,
                    type: 'gelir',
                    payment_method: 'acik_hesap',
                    amount: creditAmount,
                    description: `Fatura Kalan Cari Hesap Borcu (Fatura No: ${invoiceNo})`
                }])
            if (creditErr) console.error("Açık hesap transaction error:", creditErr.message)
        }
    } else {
        // Tek ödeme için işlemler
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
            console.error('Finansal işlem hareketi kaydedilemedi:', transactionError.message)
        }
    }

    revalidatePath('/invoices')
    revalidatePath('/finance')
    return { success: true, data: invoice }
}
