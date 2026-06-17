-- 1. Müşteri Grupları Tablosu
CREATE TABLE IF NOT EXISTS customer_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    discount_rate NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Müşteriler tablosuna grup bağlantısını ekle
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES customer_groups(id) ON DELETE SET NULL;

-- 3. Varsayılan grupları içeri aktar (Eğer daha önce eklenmemişse)
INSERT INTO customer_groups (name, discount_rate)
SELECT 'Bireysel', 0 WHERE NOT EXISTS (SELECT 1 FROM customer_groups WHERE name = 'Bireysel');

INSERT INTO customer_groups (name, discount_rate)
SELECT 'Kurumsal', 0 WHERE NOT EXISTS (SELECT 1 FROM customer_groups WHERE name = 'Kurumsal');

INSERT INTO customer_groups (name, discount_rate)
SELECT 'VIP', 15 WHERE NOT EXISTS (SELECT 1 FROM customer_groups WHERE name = 'VIP');

INSERT INTO customer_groups (name, discount_rate)
SELECT 'Personel', 25 WHERE NOT EXISTS (SELECT 1 FROM customer_groups WHERE name = 'Personel');
