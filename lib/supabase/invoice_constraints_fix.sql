-- Bu SQL kodlarını Supabase Dashboard -> SQL Editor sayfasına yapıştırıp RUN (çalıştır) diyerek kaydedin.
-- Bu sayede faturalar tablosundaki ödeme yöntemi ve durum kısıtlamaları genişletilerek esnek finansal işlemlere izin verilir.

-- 1. Eski kısıtlamaları kaldır (varsa)
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_type_check;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- 2. Yeni genişletilmiş ödeme yöntemi kısıtlamasını ekle
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_type_check 
CHECK (payment_type IN (
  'nakit', 
  'kredi_karti', 
  'kredi kartı', 
  'kredi karti', 
  'havale', 
  'eft', 
  'eft/havale', 
  'havale/eft', 
  'acik_hesap', 
  'açık hesap', 
  'açık_hesap', 
  'cari', 
  'parcali', 
  'parçalı'
));

-- 3. Yeni genişletilmiş fatura durumu kısıtlamasını ekle
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check 
CHECK (status IN (
  'ödendi', 
  'taslak', 
  'bekliyor', 
  'beklemede', 
  'kısmi_ödendi', 
  'kısmi', 
  'ödenmedi'
));
