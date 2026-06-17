-- Bu SQL kodlarını Supabase Dashboard -> SQL Editor sayfasına yapıştırıp RUN (çalıştır) diyerek kaydedin.
-- Bu sayede randevu tablosu oluşturulur ve servis kayıtları tablosuna randevu ilişkisi eklenir.

-- 1. Randevular Tablosunu Oluştur
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'planlandı',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Servis Kayıtları Tablosuna Randevu İlişkisi (Foreign Key) Ekle
ALTER TABLE service_records 
ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL;
