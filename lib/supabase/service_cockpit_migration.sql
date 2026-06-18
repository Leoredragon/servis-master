-- Bu SQL sorgularını Supabase Dashboard -> SQL Editor sayfasına yapıştırıp RUN (çalıştır) diyerek kaydedin.

-- 1. Arıza Ağacı (Fault Codes) Tablosu
CREATE TABLE IF NOT EXISTS fault_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    solution TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Arıza Kodları Tohumlama (Seed Data)
INSERT INTO fault_codes (category, code, solution) VALUES
('Motor', 'P0101', 'Hava akış sensörü (MAF) arızalı veya kirli. MAF sensörünü temizleyin veya değiştirin.'),
('Motor', 'P0300', 'Rastgele/Çoklu silindir ateşleme hatası. Buji ve ateşleme bobinlerini kontrol edin.'),
('Motor', 'P0301', 'Silindir 1 ateşleme hatası. Buji, enjektör veya ateşleme bobinini kontrol edin.'),
('Motor', 'P0420', 'Katalizör sistemi verimliliği eşik değerinin altında. Egzoz sızıntılarını ve katalitik konvertörü kontrol edin.'),
('Fren', 'BRK-01', 'Fren hidrolik seviyesi düşük veya fren balataları aşınmış. Balataları değiştirin ve hidrolik seviyesini tamamlayın.'),
('Fren', 'BRK-02', 'ABS tekerlek hız sensör hatası. ABS sensör soketlerini temizleyin, gerekirse sensörü değiştirin.'),
('Şanzıman', 'P0700', 'Şanzıman kontrol sistemi arızası. Şanzıman yağı seviyesini, soketleri ve selenoid valfleri kontrol edin.'),
('Elektrik', 'ELE-01', 'Akü şarj gerilimi yetersiz (Alternatör hatası). Alternatör şarj dinamosunu ve gergi kayışını kontrol edin.'),
('Elektrik', 'ELE-02', 'Far ve aydınlatma grubu röle/sigorta hatası. İlgili sigorta kutusunu ve ampulleri kontrol edin.'),
('Süspansiyon', 'SUS-01', 'Amortisör sızıntısı veya rotil aşınması. İlgili amortisörü ve salıncak burçlarını kontrol edip yenileyin.')
ON CONFLICT (code) DO NOTHING;

-- 2. Stok Tablosuna Rezervasyon Alanı Ekleme
ALTER TABLE stock_cards ADD COLUMN IF NOT EXISTS reserved_stock INTEGER DEFAULT 0 NOT NULL;

-- 3. Stok Rezervasyon ve Düşüş Tetikleyicileri (Triggers)

-- 3.1 Servis Kalemi Değiştiğinde Stok Rezervasyon Tetikleyicisi
CREATE OR REPLACE FUNCTION process_service_item_stock_change()
RETURNS TRIGGER AS $$
DECLARE
  v_status VARCHAR(50);
BEGIN
  -- İlişkili servis kaydının güncel durumunu al
  SELECT status INTO v_status FROM service_records WHERE id = COALESCE(NEW.service_id, OLD.service_id);
  
  -- Servis tamamlanmışsa artık bu tetikleyici stok rezervasyonunu değiştirmez (tamamlandığında kesin çıkış yapılmıştır)
  IF v_status = 'tamamlandı' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Ekleme Durumu (INSERT)
  IF (TG_OP = 'INSERT') THEN
    IF NEW.stock_id IS NOT NULL THEN
      -- Stok rezerve et: Kullanılabilir (current) stoktan düş, rezerve (reserved) stoğa ekle
      UPDATE stock_cards 
      SET current_stock = current_stock - NEW.quantity,
          reserved_stock = reserved_stock + NEW.quantity
      WHERE id = NEW.stock_id;
    END IF;

  -- Güncelleme Durumu (UPDATE)
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Eski parça iptal edildi, yeni parça eklendiyse
    IF OLD.stock_id IS NOT NULL AND NEW.stock_id IS NULL THEN
      UPDATE stock_cards 
      SET current_stock = current_stock + OLD.quantity,
          reserved_stock = reserved_stock - OLD.quantity
      WHERE id = OLD.stock_id;
    
    -- Parça atanmamışken yeni parça eklendiyse
    ELSIF NEW.stock_id IS NOT NULL AND OLD.stock_id IS NULL THEN
      UPDATE stock_cards 
      SET current_stock = current_stock - NEW.quantity,
          reserved_stock = reserved_stock + NEW.quantity
      WHERE id = NEW.stock_id;
      
    -- Parça kartı veya miktar değiştiyse
    ELSIF NEW.stock_id IS NOT NULL AND OLD.stock_id IS NOT NULL THEN
      IF OLD.stock_id = NEW.stock_id THEN
        -- Aynı parça, sadece miktar farkını ayarla
        UPDATE stock_cards 
        SET current_stock = current_stock - (NEW.quantity - OLD.quantity),
            reserved_stock = reserved_stock + (NEW.quantity - OLD.quantity)
        WHERE id = NEW.stock_id;
      ELSE
        -- Farklı parça: eskisini iade et, yenisini rezerve et
        UPDATE stock_cards 
        SET current_stock = current_stock + OLD.quantity,
            reserved_stock = reserved_stock - OLD.quantity
        WHERE id = OLD.stock_id;
        
        UPDATE stock_cards 
        SET current_stock = current_stock - NEW.quantity,
            reserved_stock = reserved_stock + NEW.quantity
        WHERE id = NEW.stock_id;
      END IF;
    END IF;

  -- Silme Durumu (DELETE)
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.stock_id IS NOT NULL THEN
      -- Rezervasyonu iptal et ve kullanılabilir stoğa iade et
      UPDATE stock_cards 
      SET current_stock = current_stock + OLD.quantity,
          reserved_stock = reserved_stock - OLD.quantity
      WHERE id = OLD.stock_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Silinip yeniden yüklenme olasılığına karşı temizle
DROP TRIGGER IF EXISTS trg_service_item_stock_change ON service_items;
CREATE TRIGGER trg_service_item_stock_change
AFTER INSERT OR UPDATE OR DELETE ON service_items
FOR EACH ROW EXECUTE FUNCTION process_service_item_stock_change();


-- 3.2 Servis Statüsü Değiştiğinde (Tamamlandı veya İptal) Kesin Çıkış Tetikleyicisi
CREATE OR REPLACE FUNCTION process_service_record_status_change()
RETURNS TRIGGER AS $$
DECLARE
  item_rec RECORD;
BEGIN
  -- Statü 'tamamlandı' yapıldığında: Rezervasyonu kesin çıkışa dönüştür
  IF NEW.status = 'tamamlandı' AND OLD.status != 'tamamlandı' THEN
    FOR item_rec IN SELECT * FROM service_items WHERE service_id = NEW.id LOOP
      IF item_rec.stock_id IS NOT NULL THEN
        -- Rezerve stoktan düş (zaten current_stock'tan rezervasyon anında düşülmüştü)
        UPDATE stock_cards 
        SET reserved_stock = reserved_stock - item_rec.quantity
        WHERE id = item_rec.stock_id;

        -- Kesin çıkış için stok hareket kaydı (stock_movements) oluştur
        INSERT INTO stock_movements (stock_id, movement_type, quantity, reference_type, reference_id)
        VALUES (item_rec.stock_id, 'çıkış', item_rec.quantity, 'servis', NEW.id);
      END IF;
    END LOOP;
  
  -- Statü 'iptal' yapıldığında: Rezerve edilen tüm parçaları kullanılabilir stoğa iade et
  ELSIF NEW.status = 'iptal' AND OLD.status != 'iptal' AND OLD.status != 'tamamlandı' THEN
    FOR item_rec IN SELECT * FROM service_items WHERE service_id = NEW.id LOOP
      IF item_rec.stock_id IS NOT NULL THEN
        UPDATE stock_cards 
        SET current_stock = current_stock + item_rec.quantity,
            reserved_stock = reserved_stock - item_rec.quantity
        WHERE id = item_rec.stock_id;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_record_status_change ON service_records;
CREATE TRIGGER trg_service_record_status_change
AFTER UPDATE OF status ON service_records
FOR EACH ROW EXECUTE FUNCTION process_service_record_status_change();


-- 4. Supabase Storage "service_media" Bucket Kurulumu:
-- NOT: storage.objects tablosu Supabase'in sistem tablosu olduğu için doğrudan SQL ile değiştirildiğinde "must be owner of table objects" hatası verebilir.
-- Bu nedenle, dosya yükleme sisteminin çalışması için aşağıdaki adımları Supabase Dashboard üzerinden görsel olarak gerçekleştirin:
--
-- Adımlar:
-- 1. Supabase Dashboard -> Storage sekmesine gidin.
-- 2. "Create a new bucket" butonuna tıklayıp ismini 'service_media' yapın.
-- 3. Bucket ayarlarından "Public bucket" seçeneğini aktif edin (Genel erişime açık).
-- 4. Bucket için "Policies" (RLS Politikaları) kısmına tıklayın:
--    - SELECT (Okuma), INSERT (Yükleme) ve DELETE (Silme) işlemleri için herkese izin verecek şekilde (ya da giriş yapmış kullanıcılara özel) politikaları oluşturun.

