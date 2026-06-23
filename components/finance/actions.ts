'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCashRegister(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string

    if (!name) {
        return { success: false, message: 'Kasa adı girilmelidir.' }
    }

    const { data, error } = await supabase
        .from('cash_registers')
        .insert([{ name, balance: 0 }])
        .select()
        .single()

    if (error) {
        return { success: false, message: 'Kasa oluşturulamadı: ' + error.message }
    }

    revalidatePath('/finance')
    return { success: true, data }
}

export async function createBankAccount(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const accountNumber = formData.get('accountNumber') as string
    const iban = formData.get('iban') as string

    if (!name) {
        return { success: false, message: 'Banka adı girilmelidir.' }
    }

    const { data, error } = await supabase
        .from('bank_accounts')
        .insert([{
            name,
            account_number: accountNumber || null,
            iban: iban || null,
            balance: 0
        }])
        .select()
        .single()

    if (error) {
        return { success: false, message: 'Banka hesabı oluşturulamadı: ' + error.message }
    }

    revalidatePath('/finance')
    return { success: true, data }
}

export async function createTransaction(formData: FormData) {
    const supabase = await createClient()

    const customerId = formData.get('customerId') as string || null
    let type = formData.get('type') as string // 'gelir' | 'gider'
    let paymentMethod = formData.get('paymentMethod') as string // 'nakit' | 'kredi_karti' | 'havale' | 'acik_hesap'
    let cashRegisterId = formData.get('cashRegisterId') as string || null
    let bankAccountId = formData.get('bankAccountId') as string || null
    const amountVal = formData.get('amount')
    const description = formData.get('description') as string
    const dateVal = formData.get('transactionDate') as string

    const amount = amountVal ? parseFloat(amountVal as string) : 0
    const transactionDate = dateVal ? new Date(dateVal).toISOString() : new Date().toISOString()

    if (!type || !paymentMethod || amount <= 0) {
        return { success: false, message: 'İşlem tipi, ödeme yöntemi ve sıfırdan büyük tutar zorunludur.' }
    }

    // Force constraints for customer transactions
    if (customerId) {
        if (paymentMethod === 'acik_hesap') {
            type = 'gelir'
            cashRegisterId = null
            bankAccountId = null
        } else if (['nakit', 'kredi_karti', 'havale'].includes(paymentMethod)) {
            type = 'gelir'
            if (paymentMethod === 'nakit') {
                if (!cashRegisterId) {
                    return { success: false, message: 'Nakit işlemleri için kasa seçilmelidir.' }
                }
                bankAccountId = null
            } else {
                if (!bankAccountId) {
                    return { success: false, message: 'Banka işlemleri için banka hesabı seçilmelidir.' }
                }
                cashRegisterId = null
            }
        }
    } else {
        // For general/non-customer transactions
        if (paymentMethod === 'nakit' && !cashRegisterId) {
            return { success: false, message: 'Nakit işlemleri için kasa seçilmelidir.' }
        }
        if (['kredi_karti', 'havale'].includes(paymentMethod) && !bankAccountId) {
            return { success: false, message: 'Banka işlemleri için banka hesabı seçilmelidir.' }
        }
    }

    const transactionData: any = {
        customer_id: customerId,
        type,
        payment_method: paymentMethod,
        amount,
        description,
        transaction_date: transactionDate,
        cash_register_id: paymentMethod === 'nakit' ? cashRegisterId : null,
        bank_account_id: ['kredi_karti', 'havale'].includes(paymentMethod) ? bankAccountId : null,
    }

    const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single()

    if (error) {
        return { success: false, message: 'İşlem kaydedilemedi: ' + error.message }
    }

    revalidatePath('/finance')
    revalidatePath('/customers')
    return { success: true, data }
}

export async function updateTransaction(id: string, data: {
    description: string
    amount: number
    transactionDate: string
    paymentMethod: string
    cashRegisterId?: string | null
    bankAccountId?: string | null
}) {
    const supabase = await createClient()
    const { description, amount, transactionDate, paymentMethod, cashRegisterId, bankAccountId } = data

    if (amount <= 0) {
        return { success: false, message: 'Tutar sıfırdan büyük olmalıdır.' }
    }

    const { error } = await supabase
        .from('transactions')
        .update({
            description,
            amount,
            transaction_date: new Date(transactionDate).toISOString(),
            payment_method: paymentMethod,
            cash_register_id: paymentMethod === 'nakit' ? cashRegisterId : null,
            bank_account_id: ['kredi_karti', 'havale'].includes(paymentMethod) ? bankAccountId : null,
        })
        .eq('id', id)

    if (error) {
        return { success: false, message: 'İşlem güncellenemedi: ' + error.message }
    }

    revalidatePath('/finance')
    revalidatePath('/customers')
    return { success: true }
}

export async function deleteTransaction(id: string) {
    const supabase = await createClient()

    // Önce işlemin detaylarını alıp faturaya bağlı mı kontrol et
    const { data: txData, error: fetchError } = await supabase
        .from('transactions')
        .select('invoice_id')
        .eq('id', id)
        .single()

    if (fetchError) {
        return { success: false, message: 'İşlem detayları alınamadı: ' + fetchError.message }
    }

    // Eğer bağlı bir fatura varsa önce onu sil (Supabase cascade kurmadıysa manuel sileriz)
    if (txData && txData.invoice_id) {
        const { error: invoiceError } = await supabase
            .from('invoices')
            .delete()
            .eq('id', txData.invoice_id)
        
        if (invoiceError) {
            return { success: false, message: 'Bağlı fatura silinemedi: ' + invoiceError.message }
        }
    }

    // Sonra ana işlemi sil
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

    if (error) {
        return { success: false, message: 'İşlem silinemedi: ' + error.message }
    }

    revalidatePath('/finance')
    revalidatePath('/customers')
    revalidatePath('/invoices')
    return { success: true }
}
