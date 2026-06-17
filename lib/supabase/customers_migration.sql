-- Bu SQL kodlarını Supabase Dashboard -> SQL Editor sayfasına yapıştırıp RUN (çalıştır) diyerek kaydedin.
-- Bu sayede müşteriler tablosuna yeni kurumsal ve iskonto alanları eklenir.

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS tax_office VARCHAR(100),
ADD COLUMN IF NOT EXISTS tax_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS discount_rate NUMERIC DEFAULT 0;
