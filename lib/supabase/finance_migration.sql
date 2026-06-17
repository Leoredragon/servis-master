-- Bu SQL kodlarını Supabase Dashboard -> SQL Editor sayfasına yapıştırıp RUN (çalıştır) diyerek kaydedin.
-- Bu sayede Kasa, Banka ve Cari Hareketler tabloları ve otomatik bakiye hesaplama tetikleyicileri oluşturulur.

-- 1. Kasalar Tablosu
CREATE TABLE IF NOT EXISTS cash_registers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    balance NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Banka Hesapları Tablosu
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100),
    iban VARCHAR(100),
    balance NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Müşteriler Tablosuna Bakiye Alanı Ekle (Eğer yoksa)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0 NOT NULL;

-- 4. Cari & Finans Hareketleri Tablosu
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    cash_register_id UUID REFERENCES cash_registers(id) ON DELETE SET NULL,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('gelir', 'gider')),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('nakit', 'kredi_karti', 'havale', 'acik_hesap')),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    description TEXT,
    transaction_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Otomatik Bakiye Güncelleme Fonksiyonu
CREATE OR REPLACE FUNCTION update_balances_on_transaction_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Eksi değerleri geri al (DELETE veya UPDATE durumunda)
    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
        -- Müşteri bakiyesi geri alma
        IF (OLD.customer_id IS NOT NULL) THEN
            IF (OLD.payment_method = 'acik_hesap') THEN
                IF (OLD.type = 'gelir') THEN
                    UPDATE customers SET balance = balance - OLD.amount WHERE id = OLD.customer_id;
                ELSIF (OLD.type = 'gider') THEN
                    UPDATE customers SET balance = balance + OLD.amount WHERE id = OLD.customer_id;
                END IF;
            ELSE
                IF (OLD.invoice_id IS NULL) THEN
                    IF (OLD.type = 'gelir') THEN
                        UPDATE customers SET balance = balance + OLD.amount WHERE id = OLD.customer_id;
                    ELSIF (OLD.type = 'gider') THEN
                        UPDATE customers SET balance = balance - OLD.amount WHERE id = OLD.customer_id;
                    END IF;
                END IF;
            END IF;
        END IF;

        -- Kasa bakiyesi geri alma
        IF (OLD.cash_register_id IS NOT NULL) THEN
            IF (OLD.type = 'gelir') THEN
                UPDATE cash_registers SET balance = balance - OLD.amount WHERE id = OLD.cash_register_id;
            ELSIF (OLD.type = 'gider') THEN
                UPDATE cash_registers SET balance = balance + OLD.amount WHERE id = OLD.cash_register_id;
            END IF;
        END IF;

        -- Banka bakiyesi geri alma
        IF (OLD.bank_account_id IS NOT NULL) THEN
            IF (OLD.type = 'gelir') THEN
                UPDATE bank_accounts SET balance = balance - OLD.amount WHERE id = OLD.bank_account_id;
            ELSIF (OLD.type = 'gider') THEN
                UPDATE bank_accounts SET balance = balance + OLD.amount WHERE id = OLD.bank_account_id;
            END IF;
        END IF;
    END IF;

    -- 2. Yeni değerleri uygula (INSERT veya UPDATE durumunda)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        -- Müşteri bakiyesi güncelleme
        IF (NEW.customer_id IS NOT NULL) THEN
            IF (NEW.payment_method = 'acik_hesap') THEN
                IF (NEW.type = 'gelir') THEN
                    UPDATE customers SET balance = balance + NEW.amount WHERE id = NEW.customer_id;
                ELSIF (NEW.type = 'gider') THEN
                    UPDATE customers SET balance = balance - NEW.amount WHERE id = NEW.customer_id;
                END IF;
            ELSE
                IF (NEW.invoice_id IS NULL) THEN
                    IF (NEW.type = 'gelir') THEN
                        UPDATE customers SET balance = balance - NEW.amount WHERE id = NEW.customer_id;
                    ELSIF (NEW.type = 'gider') THEN
                        UPDATE customers SET balance = balance + NEW.amount WHERE id = NEW.customer_id;
                    END IF;
                END IF;
            END IF;
        END IF;

        -- Kasa bakiyesi güncelleme
        IF (NEW.cash_register_id IS NOT NULL) THEN
            IF (NEW.type = 'gelir') THEN
                UPDATE cash_registers SET balance = balance + NEW.amount WHERE id = NEW.cash_register_id;
            ELSIF (NEW.type = 'gider') THEN
                UPDATE cash_registers SET balance = balance - NEW.amount WHERE id = NEW.cash_register_id;
            END IF;
        END IF;

        -- Banka bakiyesi güncelleme
        IF (NEW.bank_account_id IS NOT NULL) THEN
            IF (NEW.type = 'gelir') THEN
                UPDATE bank_accounts SET balance = balance + NEW.amount WHERE id = NEW.bank_account_id;
            ELSIF (NEW.type = 'gider') THEN
                UPDATE bank_accounts SET balance = balance - NEW.amount WHERE id = NEW.bank_account_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger Tanımı
DROP TRIGGER IF EXISTS trg_transactions_balance ON transactions;
CREATE TRIGGER trg_transactions_balance
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_balances_on_transaction_change();

-- 7. Varsayılan Kasa ve Banka Hesaplarını Ekle (Varsa dokunma)
-- Bu sorguları güvenle çalıştırabilirsiniz
INSERT INTO cash_registers (name, balance) 
SELECT 'Merkez Kasa', 0 
WHERE NOT EXISTS (SELECT 1 FROM cash_registers WHERE name = 'Merkez Kasa');

INSERT INTO bank_accounts (name, account_number, iban, balance) 
SELECT 'Merkez Banka Hesabı', '123456', 'TR000000000000000000000000', 0 
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts WHERE name = 'Merkez Banka Hesabı');
