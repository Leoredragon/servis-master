-- Bu SQL kodlarını Supabase Dashboard -> SQL Editor sayfasına yapıştırıp RUN (çalıştır) diyerek kaydedin.
-- Bu sayede servis kayıtlarına yeni detaylı kontrol alanları eklenir.

ALTER TABLE service_records 
ADD COLUMN IF NOT EXISTS entry_mileage INTEGER,
ADD COLUMN IF NOT EXISTS fuel_level VARCHAR(100),
ADD COLUMN IF NOT EXISTS damage_assessment TEXT;
