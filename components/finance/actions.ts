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
    const type = formData.get('type') as string // 'gelir' | 'gider'
    const paymentMethod = formData.get('paymentMethod') as string // 'nakit' | 'kredi_karti' | 'havale'
    const cashRegisterId = formData.get('cashRegisterId') as string || null
    const bankAccountId = formData.get('bankAccountId') as string || null
    const amountVal = formData.get('amount')
    const description = formData.get('description') as string
    const dateVal = formData.get('transactionDate') as string

    const amount = amountVal ? parseFloat(amountVal as string) : 0
    const transactionDate = dateVal ? new Date(dateVal).toISOString() : new Date().toISOString()

    if (!type || !paymentMethod || amount <= 0) {
        return { success: false, message: 'İşlem tipi, ödeme yöntemi ve sıfırdan büyük tutar zorunludur.' }
    }

    if (paymentMethod === 'nakit' && !cashRegisterId) {
        return { success: false, message: 'Nakit işlemleri için kasa seçilmelidir.' }
    }

    if ((paymentMethod === 'kredi_karti' || paymentMethod === 'havale') && !bankAccountId) {
        return { success: false, message: 'Banka işlemleri için banka hesabı seçilmelidir.' }
    }

    const transactionData: any = {
        customer_id: customerId,
        type,
        payment_method: paymentMethod,
        amount,
        description,
        transaction_date: transactionDate,
    }

    if (paymentMethod === 'nakit') {
        transactionData.cash_register_id = cashRegisterId
    } else if (paymentMethod === 'kredi_karti' || paymentMethod === 'havale') {
        transactionData.bank_account_id = bankAccountId
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
