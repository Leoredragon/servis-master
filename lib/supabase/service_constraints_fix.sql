-- Bu SQL kodlarını Supabase Dashboard -> SQL Editor sayfasına yapıştırıp RUN (çalıştır) diyerek kaydedin.
-- Bu sayede servis kayıtlarındaki check constraint (kontrol kısıtlamaları) güncellenerek
-- front-end tarafından gönderilen tüm durum, servis tipi ve öncelik değerleri desteklenir.

-- 1. Eski kısıtlamaları kaldır (varsa)
ALTER TABLE service_records DROP CONSTRAINT IF EXISTS service_records_service_type_check;
ALTER TABLE service_records DROP CONSTRAINT IF EXISTS service_records_status_check;
ALTER TABLE service_records DROP CONSTRAINT IF EXISTS service_records_priority_check;

-- 2. Uygulama tarafındaki değerlerle uyumlu yeni kısıtlamaları ekle
ALTER TABLE service_records ADD CONSTRAINT service_records_service_type_check 
  CHECK (service_type IN ('bakim', 'tamir', 'muayene', 'modifikasyon', 'bakım', 'onarım'));

ALTER TABLE service_records ADD CONSTRAINT service_records_status_check 
  CHECK (status IN (
    'araç kabul', 'ariza tespiti', 'parca bekleniyor', 
    'onarimda', 'kalite_kontrol', 'teslimata_hazir', 
    'tamamlandı', 'iptal', 'işlemde', 'beklemede'
  ));

ALTER TABLE service_records ADD CONSTRAINT service_records_priority_check 
  CHECK (priority IN ('dusuk', 'normal', 'yuksek', 'acil', 'düşük', 'yüksek'));
