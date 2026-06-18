-- ====================================================================
-- SERVIS MASTER MOCK VERI TOHUMLAMA (SEED) SCRIPT'I
-- ====================================================================
-- Bu scripti Supabase -> SQL Editor sayfasında çalıştırarak, 
-- gerçek kurumsal/bireysel senaryolara uygun, 2-3 aylık (Nisan - Haziran 2026) 
-- hareket geçmişi olan zengin bir test hesabı oluşturabilirsiniz.
--
-- NOT: E-posta ve Şifreyi aşağıdaki DO bloğunun başında değiştirebilirsiniz.
-- Eğer bu e-posta ile kayıtlı bir hesap yoksa otomatik oluşturulacaktır.
-- Eğer varsa, mevcut hesaba ait eski test verileri silinip sıfırdan yüklenecektir.

DO $$
DECLARE
    -- 1. HEDEF TEST HESABI BILGILERI (İstediğiniz gibi güncelleyebilirsiniz)
    target_email VARCHAR := 'kurumsal@servismaster.com'; 
    target_password VARCHAR := 'ServisMaster123!';
    target_full_name VARCHAR := 'Servis Master Test A.Ş.';
    
    target_user_id UUID;
    is_new_user BOOLEAN := FALSE;

    -- Gruplar
    group_bireysel_id UUID;
    group_kurumsal_id UUID;
    group_vip_id UUID;
    group_personel_id UUID;

    -- Kasalar ve Bankalar
    register_id UUID;
    bank_id UUID;

    -- Müşteri UUID Tanımları (İlişkiler için sabit UUID'ler üretiyoruz)
    cust_aras_id UUID := 'a1111111-1111-1111-1111-111111111111';
    cust_esen_id UUID := 'a2222222-2222-2222-2222-222222222222';
    cust_global_id UUID := 'a3333333-3333-3333-3333-333333333333';
    cust_ahmet_id UUID := 'a4444444-4444-4444-4444-444444444444';
    cust_mustafa_id UUID := 'a5555555-5555-5555-5555-555555555555';
    cust_ayse_id UUID := 'a6666666-6666-6666-6666-666666666666';

    -- Araç UUID Tanımları
    veh_transit1_id UUID := 'b1111111-1111-1111-1111-111111111111';
    veh_transit2_id UUID := 'b2222222-2222-2222-2222-222222222222';
    veh_sprinter_id UUID := 'b3333333-3333-3333-3333-333333333333';
    veh_doblo_id UUID := 'b4444444-4444-4444-4444-444444444444';
    veh_golf_id UUID := 'b5555555-5555-5555-5555-555555555555';
    veh_megane_id UUID := 'b6666666-6666-6666-6666-666666666666';
    veh_i20_id UUID := 'b7777777-7777-7777-7777-777777777777';

    -- Stok Kartı UUID Tanımları
    stock_balata_id UUID := 'c1111111-1111-1111-1111-111111111111';
    stock_yag_id UUID := 'c2222222-2222-2222-2222-222222222222';
    stock_yag_filtresi_id UUID := 'c3333333-3333-3333-3333-333333333333';
    stock_hava_filtresi_id UUID := 'c4444444-4444-4444-4444-444444444444';
    stock_mazot_filtresi_id UUID := 'c5555555-5555-5555-5555-555555555555';
    stock_buji_id UUID := 'c6666666-6666-6666-6666-666666666666';
    stock_disk_id UUID := 'c7777777-7777-7777-7777-777777777777';
    stock_silecek_id UUID := 'c8888888-8888-8888-8888-888888888888';
    stock_polen_id UUID := 'c9999999-9999-9999-9999-999999999999';
    stock_antifriz_id UUID := 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    -- Servis UUID Tanımları
    srv1_id UUID := 'd1111111-1111-1111-1111-111111111111';
    srv2_id UUID := 'd2222222-2222-2222-2222-222222222222';
    srv3_id UUID := 'd3333333-3333-3333-3333-333333333333';
    srv4_id UUID := 'd4444444-4444-4444-4444-444444444444';
    srv5_id UUID := 'd5555555-5555-5555-5555-555555555555';
    srv6_id UUID := 'd6666666-6666-6666-6666-666666666666';
    srv7_id UUID := 'd7777777-7777-7777-7777-777777777777';
    srv8_id UUID := 'd8888888-8888-8888-8888-888888888888';
    srv9_id UUID := 'd9999999-9999-9999-9999-999999999999';

    -- Fatura UUID Tanımları
    inv1_id UUID := 'e1111111-1111-1111-1111-111111111111';
    inv2_id UUID := 'e2222222-2222-2222-2222-222222222222';
    inv3_id UUID := 'e3333333-3333-3333-3333-333333333333';
    inv4_id UUID := 'e4444444-4444-4444-4444-444444444444';
    inv5_id UUID := 'e5555555-5555-5555-5555-555555555555';
    inv6_id UUID := 'e6666666-6666-6666-6666-666666666666';
    inv7_id UUID := 'e7777777-7777-7777-7777-777777777777';

    -- Sayaç ve Kontroller için
    temp_count INTEGER;

BEGIN
    -- 2. KULLANICI KONTROLÜ / OLUŞTURMA
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NULL THEN
        is_new_user := TRUE;
        target_user_id := gen_random_uuid();
        
        -- auth.users tablosuna kullanıcı ekle
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            target_user_id,
            'authenticated',
            'authenticated',
            target_email,
            crypt(target_password, gen_salt('bf', 10)),
            now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('full_name', target_full_name),
            now(),
            now()
        );

        -- NOT: auth.users insert edildiğinde handle_new_user trigger'ı profiles tablosuna da ekler.
        -- Ancak profiles'daki verileri garanti etmek için el ile update edelim
        UPDATE public.profiles 
        SET role = 'user', package_name = 'Pro', status = 'active', full_name = target_full_name
        WHERE id = target_user_id;

        RAISE NOTICE 'Kullanıcı bulunamadı, şifresi "%" olan yeni bir hesap oluşturuldu: %', target_password, target_email;
    ELSE
        RAISE NOTICE 'Mevcut test kullanıcısı bulundu (ID: %). Eski test verileri temizleniyor...', target_user_id;
    END IF;

    -- 3. ESKİ TEST VERİLERİNİ TEMİZLE (Kullanıcıya özel)
    -- Cascading olmayan veya kısıtlamalara takılabilecek cari hareketleri temizle
    DELETE FROM transactions WHERE customer_id IN (SELECT id FROM customers WHERE created_by = target_user_id);
    DELETE FROM transactions WHERE invoice_id IN (SELECT id FROM invoices WHERE created_by = target_user_id);
    DELETE FROM transactions WHERE description LIKE '[Test]%';

    DELETE FROM stock_movements WHERE stock_id IN (SELECT id FROM stock_cards WHERE created_by = target_user_id);
    DELETE FROM appointments WHERE created_by = target_user_id;
    DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE created_by = target_user_id);
    DELETE FROM invoices WHERE created_by = target_user_id;
    DELETE FROM service_items WHERE service_id IN (SELECT id FROM service_records WHERE created_by = target_user_id);
    DELETE FROM service_records WHERE created_by = target_user_id;
    DELETE FROM vehicles WHERE customer_id IN (SELECT id FROM customers WHERE created_by = target_user_id);
    DELETE FROM stock_cards WHERE created_by = target_user_id;
    DELETE FROM customers WHERE created_by = target_user_id;

    -- 4. KASA VE BANKALARI KONTROL ET / OLUŞTUR
    SELECT id INTO register_id FROM cash_registers WHERE name = 'Merkez Kasa' LIMIT 1;
    IF register_id IS NULL THEN
        INSERT INTO cash_registers (name, balance) VALUES ('Merkez Kasa', 0) RETURNING id INTO register_id;
    END IF;

    SELECT id INTO bank_id FROM bank_accounts WHERE name = 'Merkez Banka Hesabı' LIMIT 1;
    IF bank_id IS NULL THEN
        INSERT INTO bank_accounts (name, account_number, iban, balance) 
        VALUES ('Merkez Banka Hesabı', '34105020', 'TR000000000000000000000000', 0) 
        RETURNING id INTO bank_id;
    END IF;

    -- 5. MÜŞTERİ GRUPLARINI KONTROL ET VE AL
    SELECT id INTO group_bireysel_id FROM customer_groups WHERE name = 'Bireysel' LIMIT 1;
    IF group_bireysel_id IS NULL THEN
        INSERT INTO customer_groups (name, discount_rate) VALUES ('Bireysel', 0) RETURNING id INTO group_bireysel_id;
    END IF;
    
    SELECT id INTO group_kurumsal_id FROM customer_groups WHERE name = 'Kurumsal' LIMIT 1;
    IF group_kurumsal_id IS NULL THEN
        INSERT INTO customer_groups (name, discount_rate) VALUES ('Kurumsal', 0) RETURNING id INTO group_kurumsal_id;
    END IF;

    SELECT id INTO group_vip_id FROM customer_groups WHERE name = 'VIP' LIMIT 1;
    IF group_vip_id IS NULL THEN
        INSERT INTO customer_groups (name, discount_rate) VALUES ('VIP', 15) RETURNING id INTO group_vip_id;
    END IF;

    SELECT id INTO group_personel_id FROM customer_groups WHERE name = 'Personel' LIMIT 1;
    IF group_personel_id IS NULL THEN
        INSERT INTO customer_groups (name, discount_rate) VALUES ('Personel', 25) RETURNING id INTO group_personel_id;
    END IF;

    -- 6. STOK KARTLARINI EKLE
    INSERT INTO stock_cards (
        id, stock_code, name, category, brand, model, barcode, unit, 
        purchase_price, sale_price, vat_rate, min_stock, current_stock, reserved_stock, location, supplier, notes, created_by
    ) VALUES 
    (stock_balata_id, 'STK-001', 'Ön Fren Balatası', 'Fren Sistemi', 'Bosch', 'Ford Transit Uyumlu', '8690001001', 'adet', 1200, 1800, 20, 10, 45, 0, 'Raf A-3', 'Yıldız Otomotiv', 'Kaliteli fren balatası.', target_user_id),
    (stock_yag_id, 'STK-002', 'Motor Yağı 5W-30 4L', 'Madeni Yağlar', 'Castrol', 'Edge C3', '8690001002', 'adet', 800, 1200, 20, 15, 30, 0, 'Raf B-1', 'Castrol Türkiye', 'Tam sentetik motor yağı.', target_user_id),
    (stock_yag_filtresi_id, 'STK-003', 'Yağ Filtresi', 'Filtreler', 'Mann Filter', 'HU 7002', '8690001003', 'adet', 150, 250, 20, 20, 85, 0, 'Raf C-1', 'Yıldız Otomotiv', 'Uzun ömürlü yağ filtresi.', target_user_id),
    (stock_hava_filtresi_id, 'STK-004', 'Hava Filtresi', 'Filtreler', 'Fil Filter', 'HP 2045', '8690001004', 'adet', 180, 300, 20, 20, 75, 0, 'Raf C-2', 'Yıldız Otomotiv', 'Standart hava filtresi.', target_user_id),
    (stock_mazot_filtresi_id, 'STK-005', 'Mazot Filtresi', 'Filtreler', 'Bosch', 'Transit 2.0 EcoBlue', '8690001005', 'adet', 350, 550, 20, 10, 38, 0, 'Raf C-3', 'Yıldız Otomotiv', 'Dizel yakıt filtresi.', target_user_id),
    (stock_buji_id, 'STK-006', 'Buji Seti (4 Adet)', 'Ateşleme Grubu', 'NGK', 'Laser Platinum', '8690001006', 'adet', 400, 650, 20, 5, 18, 0, 'Raf D-1', 'Özen Otomotiv', 'Orijinal buji takımı.', target_user_id),
    (stock_disk_id, 'STK-007', 'Ön Fren Diski Set', 'Fren Sistemi', 'Brembo', 'Vented 300mm', '8690001007', 'adet', 2500, 3800, 20, 5, 12, 0, 'Raf A-1', 'Yıldız Otomotiv', 'Performans fren diski.', target_user_id),
    (stock_silecek_id, 'STK-008', 'Silecek Takımı', 'Aksesuar', 'Valeo', 'Silencio', '8690001008', 'adet', 200, 350, 20, 15, 58, 0, 'Raf E-1', 'Özen Otomotiv', 'Sessiz muz silecek seti.', target_user_id),
    (stock_polen_id, 'STK-009', 'Polen Filtresi Karbonlu', 'Filtreler', 'Mann Filter', 'FP 26009', '8690001009', 'adet', 220, 380, 20, 20, 72, 0, 'Raf C-4', 'Yıldız Otomotiv', 'Alerjen ve koku önleyici.', target_user_id),
    (stock_antifriz_id, 'STK-010', 'Antifriz Kırmızı 3L', 'Sıvı Grubu', 'Shell', 'Helix Organic', '8690001010', 'adet', 250, 400, 20, 10, 48, 0, 'Raf F-2', 'Yıldız Otomotiv', 'Organik kırmızı antifriz.', target_user_id);

    -- 7. MÜŞTERİLERİ EKLE (Bakiye 0, Cari hareketler otomatik güncelleyecek)
    INSERT INTO customers (
        id, customer_code, first_name, last_name, phone, email, address, city, district, 
        tax_number, tax_office, company_name, type, notes, discount_rate, balance, group_id, created_by
    ) VALUES
    (cust_aras_id, 'MŞ-1001', 'Aras Kargo', 'A.Ş.', '02123334455', 'filo@araskargo.com', 'Rüzgarlıbahçe Mah. Kavacık', 'İstanbul', 'Beykoz', '0790001234', 'Boğaziçi VD.', 'Aras Kargo A.Ş.', 'kurumsal', 'Lojistik filo müşterisi.', 10, 0, group_kurumsal_id, target_user_id),
    (cust_esen_id, 'MŞ-1002', 'Esen Lojistik', 'Ltd. Şti.', '03124445566', 'destek@esenlojistik.com', 'Ostim Sanayi Sitesi 12. Cadde', 'Ankara', 'Yenimahalle', '3820005678', 'Kızılbey VD.', 'Esen Lojistik Limited Şirketi', 'kurumsal', 'Dağıtım filosu.', 15, 0, group_vip_id, target_user_id),
    (cust_global_id, 'MŞ-1003', 'Global Hızlı Dağıtım', 'A.Ş.', '02325556677', 'info@globalhizli.com', 'Atatürk Organize Sanayi Bölgesi', 'İzmir', 'Çiğli', '4050009999', 'Çiğli VD.', 'Global Hızlı Dağıtım Anonim Şirketi', 'kurumsal', 'E-ticaret dağıtım ortağı.', 10, 0, group_kurumsal_id, target_user_id),
    (cust_ahmet_id, 'MŞ-1004', 'Ahmet', 'Yılmaz', '05321112233', 'ahmet.yilmaz@gmail.com', 'Bağdat Caddesi No:45 D:8', 'İstanbul', 'Kadıköy', NULL, NULL, NULL, 'bireysel', 'Düzenli şahsi müşteri.', 0, 0, group_bireysel_id, target_user_id),
    (cust_mustafa_id, 'MŞ-1005', 'Mustafa', 'Kaya', '05422223344', 'mustafa.kaya@hotmail.com', 'Karanfil Sokak No:12/4', 'Ankara', 'Çankaya', NULL, NULL, NULL, 'bireysel', 'Tavsiye ile gelen müşteri.', 0, 0, group_bireysel_id, target_user_id),
    (cust_ayse_id, 'MŞ-1006', 'Ayşe', 'Demir', '05523334455', 'ayse.demir@yahoo.com', 'Mithatpaşa Cad. 120/5', 'İzmir', 'Konak', NULL, NULL, NULL, 'bireysel', 'Hassas araç sahibi.', 0, 0, group_bireysel_id, target_user_id);

    -- 8. ARAÇLARI EKLE
    INSERT INTO vehicles (
        id, customer_id, brand, model, year, plate, chassis_number, engine_number, mileage, color, fuel_type, notes
    ) VALUES
    (veh_transit1_id, cust_aras_id, 'Ford', 'Transit 350L', 2022, '34 ARS 123', 'WFOXXXXXXXXXXXX01', 'ENGXXXXXX01', 145000, 'Beyaz', 'Dizel', 'Dağıtım aracı, ağır yük taşır.'),
    (veh_transit2_id, cust_aras_id, 'Ford', 'Transit Custom', 2021, '34 ARS 456', 'WFOXXXXXXXXXXXX02', 'ENGXXXXXX02', 188000, 'Beyaz', 'Dizel', 'Kurye aracı, motor yorulmuş.'),
    (veh_sprinter_id, cust_esen_id, 'Mercedes-Benz', 'Sprinter 516 CDI', 2023, '06 ESN 89', 'WDBXXXXXXXXXXXX03', 'OM6XXXXXX03', 85000, 'Gümüş Gri', 'Dizel', 'VIP Kurye ve Lojistik aracı. Temiz.'),
    (veh_doblo_id, cust_global_id, 'Fiat', 'Doblo Cargo 1.6', 2020, '35 GLB 789', 'ZFAXXXXXXXXXXXX04', 'MULTXXXXXX04', 210000, 'Kırmızı', 'Dizel', 'Kurye aracı, düzenli bakım gerekir.'),
    (veh_golf_id, cust_ahmet_id, 'Volkswagen', 'Golf 1.6 TDI', 2018, '34 AY 999', 'WVWXXXXXXXXXXXX05', 'CLHXXXXXX05', 124000, 'Mavi', 'Dizel', 'Şahsi araç. Titizlikle bakılır.'),
    (veh_megane_id, cust_mustafa_id, 'Renault', 'Megane 1.5 dCi', 2019, '34 MK 555', 'VF1XXXXXXXXXXXX06', 'K9KXXXXXX06', 156000, 'Beyaz', 'Dizel', 'Şahsi aile aracı.'),
    (veh_i20_id, cust_ayse_id, 'Hyundai', 'i20 1.4 MPI', 2022, '06 AD 111', 'NLHXXXXXXXXXXXX07', 'G4FXXXXXX07', 42000, 'Kırmızı', 'Benzin', 'Otomatik vites, bakımları yetkili servis dışında ilk kez burada.');

    -- 9. NISAN 2026 SERVIS VE HAREKETLERI
    -- SRV-001: Esen Lojistik Sprinter - Fren Balatası Değişimi
    INSERT INTO service_records (
        id, service_code, customer_id, vehicle_id, service_type, priority, entry_date, exit_date, status, 
        description, customer_complaint, diagnosis, solution, total_cost, discount, total_net, warranty, created_by, entry_mileage, fuel_level, damage_assessment
    ) VALUES (
        srv1_id, 'SRV-2026-001', cust_esen_id, veh_sprinter_id, 'tamir', 'normal', '2026-04-03 09:00:00+03', '2026-04-03 17:00:00+03', 'tamamlandı',
        'Fren balataları aşınmış, disklerde çizik yok. Ön fren balatası değiştirildi.', 'Fren yaparken gıcırtı sesi geliyor, fren mesafesi uzadı.',
        'Ön fren balatası bitmiş seviyede.', 'Ön balatalar yenilendi.', 2800, 420, 2380, true, target_user_id, 83500, '3/4', 'Sağ arka çamurluk çizik'
    );
    INSERT INTO service_items (service_id, stock_id, item_type, description, quantity, unit_price, vat_rate, total_price)
    VALUES (srv1_id, stock_balata_id, 'parça', 'Ön Fren Balatası (Bosch)', 1, 1800, 20, 2160);
    INSERT INTO service_items (service_id, stock_id, item_type, description, quantity, unit_price, vat_rate, total_price)
    VALUES (srv1_id, NULL, 'işçilik', 'Fren Balatası Montaj İşçiliği', 1, 1000, 20, 1200);

    -- Fatura ve Cari Hareketi (Banka Havalesi ile Ödendi)
    INSERT INTO invoices (
        id, invoice_no, customer_id, service_id, invoice_type, payment_type, status, issue_date, due_date, subtotal, vat_total, discount_total, grand_total, paid_amount, notes, created_by
    ) VALUES (
        inv1_id, 'FTR202600001', cust_esen_id, srv1_id, 'satış', 'havale', 'ödendi', '2026-04-03 17:30:00+03', '2026-04-03 17:30:00+03', 2333.33, 466.67, 420.00, 2380, 2380, 'Fren balatası bedeli havale alındı.', target_user_id
    );
    INSERT INTO invoice_items (invoice_id, stock_id, description, quantity, unit_price, vat_rate, total_price)
    VALUES (inv1_id, stock_balata_id, 'Ön Fren Balatası (Bosch) ve Fren İşçilik Bedeli', 1, 2380, 0, 2380);
    
    INSERT INTO transactions (customer_id, invoice_id, bank_account_id, type, payment_method, amount, description, transaction_date)
    VALUES (cust_esen_id, inv1_id, bank_id, 'gelir', 'havale', 2380, '[Test] Fatura Satışı: FTR202600001', '2026-04-03 17:40:00+03');

    -- SRV-002: Ahmet Yılmaz Golf - Periyodik Bakım
    INSERT INTO service_records (
        id, service_code, customer_id, vehicle_id, service_type, priority, entry_date, exit_date, status, 
        description, customer_complaint, diagnosis, solution, total_cost, discount, total_net, warranty, created_by, entry_mileage, fuel_level, damage_assessment
    ) VALUES (
        srv2_id, 'SRV-2026-002', cust_ahmet_id, veh_golf_id, 'bakim', 'normal', '2026-04-10 08:30:00+03', '2026-04-10 14:00:00+03', 'tamamlandı',
        '120.000 KM periyodik bakımı yapıldı. Yağ, yağ filtresi, hava filtresi ve polen filtresi değiştirildi.', 'Periyodik bakım zamanı geldi.',
        'Bakım zamanı aşılmış, yağ kirli.', 'Filtreler ve motor yağı değiştirildi, genel sıvı seviyeleri tamamlandı.', 2930, 0, 2930, true, target_user_id, 124000, 'Full', 'Yok'
    );
    INSERT INTO service_items (service_id, stock_id, item_type, description, quantity, unit_price, vat_rate, total_price) VALUES
    (srv2_id, stock_yag_id, 'parça', 'Motor Yağı 5W-30 4L (Castrol)', 1, 1200, 20, 1440),
    (srv2_id, stock_yag_filtresi_id, 'parça', 'Yağ Filtresi (Mann)', 1, 250, 20, 300),
    (srv2_id, stock_hava_filtresi_id, 'parça', 'Hava Filtresi (Fil Filter)', 1, 300, 20, 360),
    (srv2_id, stock_polen_id, 'parça', 'Polen Filtresi Karbonlu (Mann)', 1, 380, 20, 456),
    (srv2_id, NULL, 'işçilik', 'Periyodik Bakım İşçiliği', 1, 800, 20, 960);

    -- Fatura ve Cari Hareketi (Kredi Kartı ile Ödendi)
    INSERT INTO invoices (
        id, invoice_no, customer_id, service_id, invoice_type, payment_type, status, issue_date, due_date, subtotal, vat_total, discount_total, grand_total, paid_amount, notes, created_by
    ) VALUES (
        inv2_id, 'FTR202600002', cust_ahmet_id, srv2_id, 'satış', 'kredi_karti', 'ödendi', '2026-04-10 14:15:00+03', '2026-04-10 14:15:00+03', 2441.67, 488.33, 0.00, 2930, 2930, 'Periyodik bakım kredi kartı tahsilatı.', target_user_id
    );
    INSERT INTO invoice_items (invoice_id, stock_id, description, quantity, unit_price, vat_rate, total_price)
    VALUES (inv2_id, NULL, 'Periyodik Bakım Hizmeti Paket Bedeli', 1, 2930, 0, 2930);
    
    INSERT INTO transactions (customer_id, invoice_id, bank_account_id, type, payment_method, amount, description, transaction_date)
    VALUES (cust_ahmet_id, inv2_id, bank_id, 'gelir', 'kredi_karti', 2930, '[Test] Fatura Satışı: FTR202600002', '2026-04-10 14:20:00+03');

    -- Nisan Ayı Genel Giderler (Kira)
    INSERT INTO transactions (bank_account_id, type, payment_method, amount, description, transaction_date)
    VALUES (bank_id, 'gider', 'havale', 15000, '[Test] Dükkan Nisan Ayı Kira Bedeli', '2026-04-15 11:00:00+03');

    -- SRV-003: Mustafa Kaya Megane - Buji ve Silecek Değişimi
    INSERT INTO service_records (
        id, service_code, customer_id, vehicle_id, service_type, priority, entry_date, exit_date, status, 
        description, customer_complaint, diagnosis, solution, total_cost, discount, total_net, warranty, created_by, entry_mileage, fuel_level, damage_assessment
    ) VALUES (
        srv3_id, 'SRV-2026-003', cust_mustafa_id, veh_megane_id, 'tamir', 'normal', '2026-04-22 10:00:00+03', '2026-04-22 16:00:00+03', 'tamamlandı',
        'Buji takımı eskimiş, silecekler aşınmış. İkisi de yenisiyle değiştirildi.', 'Motor tekleme yapıyor, silecekler camı iyi silmiyor.',
        'Ateşleme zayıflamış buji ömrü dolmuş.', 'Buji takımı ve silecek seti değiştirildi.', 1400, 0, 1400, true, target_user_id, 156000, '1/2', 'Sol ön kapıda ufak göçük'
    );
    INSERT INTO service_items (service_id, stock_id, item_type, description, quantity, unit_price, vat_rate, total_price) VALUES
    (srv3_id, stock_buji_id, 'parça', 'Buji Seti 4lü (NGK)', 1, 650, 20, 780),
    (srv3_id, stock_silecek_id, 'parça', 'Silecek Takımı (Valeo)', 1, 350, 20, 420),
    (srv3_id, NULL, 'işçilik', 'Montaj İşçiliği', 1, 400, 20, 480);

    -- Fatura ve Cari Hareketi (Nakit ile Ödendi)
    INSERT INTO invoices (
        id, invoice_no, customer_id, service_id, invoice_type, payment_type, status, issue_date, due_date, subtotal, vat_total, discount_total, grand_total, paid_amount, notes, created_by
    ) VALUES (
        inv3_id, 'FTR202600003', cust_mustafa_id, srv3_id, 'satış', 'nakit', 'ödendi', '2026-04-22 16:30:00+03', '2026-04-22 16:30:00+03', 1166.67, 233.33, 0.00, 1400, 1400, 'Buji ve silecek nakit ödeme.', target_user_id
    );
    INSERT INTO invoice_items (invoice_id, stock_id, description, quantity, unit_price, vat_rate, total_price)
    VALUES (inv3_id, NULL, 'Buji Takımı ve Silecek Değişim Bedeli', 1, 1400, 0, 1400);

    INSERT INTO transactions (customer_id, invoice_id, cash_register_id, type, payment_method, amount, description, transaction_date)
    VALUES (cust_mustafa_id, inv3_id, register_id, 'gelir', 'nakit', 1400, '[Test] Fatura Satışı: FTR202600003', '2026-04-22 16:35:00+03');


    -- 10. MAYIS 2026 SERVIS VE HAREKETLERI
    -- SRV-004: Aras Kargo Transit 1 - Fren Balata ve Disk Değişimi
    INSERT INTO service_records (
        id, service_code, customer_id, vehicle_id, service_type, priority, entry_date, exit_date, status, 
        description, customer_complaint, diagnosis, solution, total_cost, discount, total_net, warranty, created_by, entry_mileage, fuel_level, damage_assessment
    ) VALUES (
        srv4_id, 'SRV-2026-004', cust_aras_id, veh_transit1_id, 'tamir', 'normal', '2026-05-05 08:30:00+03', '2026-05-05 18:00:00+03', 'tamamlandı',
        'Ön fren balatası ve ön fren disk seti yenisiyle değiştirildi. Kurumsal filo iskontosu uygulandı.', 'Fren yapınca titreme yapıyor ve zayıf tutuyor.',
        'Diskler aşırı ısınmadan dolayı eğrilmiş ve balatalar bitmiş.', 'Fren diski takımı ve balatalar değiştirildi. Kaliper temizliği yapıldı.', 13200, 1320, 11880, true, target_user_id, 145000, 'Full', 'Yok'
    );
    INSERT INTO service_items (service_id, stock_id, item_type, description, quantity, unit_price, vat_rate, total_price) VALUES
    (srv4_id, stock_balata_id, 'parça', 'Ön Fren Balatası (Bosch)', 2, 1800, 20, 4320),
    (srv4_id, stock_disk_id, 'parça', 'Ön Fren Diski Set (Brembo)', 2, 3800, 20, 9120),
    (srv4_id, NULL, 'işçilik', 'Fren Disk ve Balata İşçiliği', 1, 2000, 20, 2400);

    -- Fatura ve Cari Hareketi (Havale ile Ödendi)
    INSERT INTO invoices (
        id, invoice_no, customer_id, service_id, invoice_type, payment_type, status, issue_date, due_date, subtotal, vat_total, discount_total, grand_total, paid_amount, notes, created_by
    ) VALUES (
        inv4_id, 'FTR202600004', cust_aras_id, srv4_id, 'satış', 'havale', 'ödendi', '2026-05-05 18:30:00+03', '2026-05-05 18:30:00+03', 9900.00, 1980.00, 1320.00, 11880, 11880, 'Aras Kargo disk-balata havale tahsilatı.', target_user_id
    );
    INSERT INTO invoice_items (invoice_id, stock_id, description, quantity, unit_price, vat_rate, total_price)
    VALUES (inv4_id, NULL, 'Fren Balata ve Disk Değişim Hizmet Bedeli', 1, 11880, 0, 11880);

    INSERT INTO transactions (customer_id, invoice_id, bank_account_id, type, payment_method, amount, description, transaction_date)
    VALUES (cust_aras_id, inv4_id, bank_id, 'gelir', 'havale', 11880, '[Test] Fatura Satışı: FTR202600004', '2026-05-05 18:40:00+03');

    -- Mayıs Ayı Genel Gider - Toptan Parça Alımı (Gider)
    INSERT INTO transactions (bank_account_id, type, payment_method, amount, description, transaction_date)
    VALUES (bank_id, 'gider', 'havale', 8000, '[Test] Yıldız Otomotiv Toptan Yedek Parça Alımı', '2026-05-12 14:00:00+03');

    -- SRV-005: Ayşe Demir i20 - Periyodik Bakım ve Antifriz Yenileme
    INSERT INTO service_records (
        id, service_code, customer_id, vehicle_id, service_type, priority, entry_date, exit_date, status, 
        description, customer_complaint, diagnosis, solution, total_cost, discount, total_net, warranty, created_by, entry_mileage, fuel_level, damage_assessment
    ) VALUES (
        srv5_id, 'SRV-2026-005', cust_ayse_id, veh_i20_id, 'bakim', 'düşük', '2026-05-18 09:30:00+03', '2026-05-18 15:30:00+03', 'tamamlandı',
        'Motor yağı, yağ filtresi değiştirildi. Soğutma suyuna kırmızı antifriz eklendi. Genel kontroller yapıldı.', 'Yıllık bakım yapılacak, antifriz kontrol edilecek.',
        'Motor yağı kararmış, soğutma suyu antifriz oranı düşük.', 'Periyodik bakım yapıldı, antifriz 3L Shell eklenerek yenilendi.', 2200, 0, 2200, true, target_user_id, 42000, '1/4', 'Arka tamponda hafif sürtme izi'
    );
    INSERT INTO service_items (service_id, stock_id, item_type, description, quantity, unit_price, vat_rate, total_price) VALUES
    (srv5_id, stock_yag_id, 'parça', 'Motor Yağı 5W-30 (Castrol)', 1, 1200, 20, 1440),
    (srv5_id, stock_antifriz_id, 'parça', 'Antifriz Kırmızı 3L (Shell)', 1, 400, 20, 480),
    (srv5_id, NULL, 'işçilik', 'Bakım ve Antifriz İşçiliği', 1, 600, 20, 720);

    -- Fatura ve Cari Hareketi (Kredi Kartı ile Ödendi)
    INSERT INTO invoices (
        id, invoice_no, customer_id, service_id, invoice_type, payment_type, status, issue_date, due_date, subtotal, vat_total, discount_total, grand_total, paid_amount, notes, created_by
    ) VALUES (
        inv5_id, 'FTR202600005', cust_ayse_id, srv5_id, 'satış', 'kredi_karti', 'ödendi', '2026-05-18 16:00:00+03', '2026-05-18 16:00:00+03', 1833.33, 366.67, 0.00, 2200, 2200, 'Kredi kartı ile tahsilat.', target_user_id
    );
    INSERT INTO invoice_items (invoice_id, stock_id, description, quantity, unit_price, vat_rate, total_price)
    VALUES (inv5_id, NULL, 'Periyodik Bakım ve Antifriz Hizmet Bedeli', 1, 2200, 0, 2200);

    INSERT INTO transactions (customer_id, invoice_id, bank_account_id, type, payment_method, amount, description, transaction_date)
    VALUES (cust_ayse_id, inv5_id, bank_id, 'gelir', 'kredi_karti', 2200, '[Test] Fatura Satışı: FTR202600005', '2026-05-18 16:05:00+03');

    -- Mayıs Ayı Genel Giderler (Kira & Elektrik)
    INSERT INTO transactions (bank_account_id, type, payment_method, amount, description, transaction_date)
    VALUES (bank_id, 'gider', 'havale', 15000, '[Test] Dükkan Mayıs Ayı Kira Bedeli', '2026-05-15 11:00:00+03');

    INSERT INTO transactions (cash_register_id, type, payment_method, amount, description, transaction_date)
    VALUES (register_id, 'gider', 'nakit', 3200, '[Test] Dükkan Mayıs Ayı Elektrik Faturası', '2026-05-25 15:30:00+03');


    -- 11. HAZIRAN 2026 SERVIS VE HAREKETLERI (Günümüze yakın)
    -- SRV-006: Global Hızlı Dağıtım Doblo - Mazot Filtresi ve Yağ Bakımı
    INSERT INTO service_records (
        id, service_code, customer_id, vehicle_id, service_type, priority, entry_date, exit_date, status, 
        description, customer_complaint, diagnosis, solution, total_cost, discount, total_net, warranty, created_by, entry_mileage, fuel_level, damage_assessment
    ) VALUES (
        srv6_id, 'SRV-2026-006', cust_global_id, veh_doblo_id, 'bakim', 'normal', '2026-06-02 08:30:00+03', '2026-06-02 17:00:00+03', 'tamamlandı',
        'Mazot filtresi, yağ filtresi ve motor yağı değiştirildi. Filtre grubu yenilendi.', 'Geç çalışma sorunu var, bakım zamanı geldi.',
        'Mazot filtresi tıkanmaya başlamış.', 'Filtreler ve yağ değiştirildi. Enjektör temizleyici katkı eklendi.', 2800, 420, 2380, true, target_user_id, 210000, '1/2', 'Kaporta ezikler mevcut (sol arka kapı)'
    );
    INSERT INTO service_items (service_id, stock_id, item_type, description, quantity, unit_price, vat_rate, total_price) VALUES
    (srv6_id, stock_yag_id, 'parça', 'Motor Yağı 5W-30 (Castrol)', 1, 1200, 20, 1440),
    (srv6_id, stock_yag_filtresi_id, 'parça', 'Yağ Filtresi (HU 7002)', 1, 250, 20, 300),
    (srv6_id, stock_mazot_filtresi_id, 'parça', 'Mazot Filtresi (Bosch)', 1, 550, 20, 660),
    (srv6_id, NULL, 'işçilik', 'Filtre ve Periyodik Bakım İşçiliği', 1, 800, 20, 960);

    -- Fatura ve Cari Hareketi (Havale ile Ödendi)
    INSERT INTO invoices (
        id, invoice_no, customer_id, service_id, invoice_type, payment_type, status, issue_date, due_date, subtotal, vat_total, discount_total, grand_total, paid_amount, notes, created_by
    ) VALUES (
        inv6_id, 'FTR202600006', cust_global_id, srv6_id, 'satış', 'havale', 'ödendi', '2026-06-02 17:30:00+03', '2026-06-02 17:30:00+03', 2333.33, 466.67, 420.00, 2380, 2380, 'Global Hızlı Dağıtım havale ödeme.', target_user_id
    );
    INSERT INTO invoice_items (invoice_id, stock_id, description, quantity, unit_price, vat_rate, total_price)
    VALUES (inv6_id, NULL, 'Mazot Filtresi ve Yağ Değişim Hizmet Bedeli', 1, 2380, 0, 2380);

    INSERT INTO transactions (customer_id, invoice_id, bank_account_id, type, payment_method, amount, description, transaction_date)
    VALUES (cust_global_id, inv6_id, bank_id, 'gelir', 'havale', 2380, '[Test] Fatura Satışı: FTR202600006', '2026-06-02 17:40:00+03');

    -- SRV-007: Aras Kargo Transit 2 - Alternatör Revizyonu (Açık Hesap / Borçlandırıldı)
    INSERT INTO service_records (
        id, service_code, customer_id, vehicle_id, service_type, priority, entry_date, exit_date, status, 
        description, customer_complaint, diagnosis, solution, total_cost, discount, total_net, warranty, created_by, entry_mileage, fuel_level, damage_assessment
    ) VALUES (
        srv7_id, 'SRV-2026-007', cust_aras_id, veh_transit2_id, 'tamir', 'acil', '2026-06-08 09:00:00+03', '2026-06-08 18:00:00+03', 'tamamlandı',
        'Alternatör şarj dinamosu sökülerek iç konvertör ve kömür grubu yenilendi.', 'Akü lambası yanıyor, araç çalışmıyor, şarj etmiyor.',
        'Alternatör kömürleri bitmiş ve şarj dinamosu arızalı.', 'Alternatör revizyonu yapıldı ve şarj gerilimi 14.2V olarak ölçüldü.', 5000, 500, 4500, true, target_user_id, 188000, '1/4', 'Yok'
    );
    INSERT INTO service_items (service_id, stock_id, item_type, description, quantity, unit_price, vat_rate, total_price) VALUES
    (srv7_id, NULL, 'parça', 'Alternatör Kömür ve Diyot Grubu', 1, 3500, 20, 4200),
    (srv7_id, NULL, 'işçilik', 'Alternatör Revizyon ve Sök-Tak İşçiliği', 1, 1500, 20, 1800);

    -- Fatura ve Cari Hareketi (AÇIK HESAP - Tahsil Edilmedi, Cari Borç Yansıdı)
    INSERT INTO invoices (
        id, invoice_no, customer_id, service_id, invoice_type, payment_type, status, issue_date, due_date, subtotal, vat_total, discount_total, grand_total, paid_amount, notes, created_by
    ) VALUES (
        inv7_id, 'FTR202600007', cust_aras_id, srv7_id, 'satış', 'acik_hesap', 'bekliyor', '2026-06-08 18:30:00+03', '2026-07-08 18:30:00+03', 3750.00, 750.00, 500.00, 4500, 0, 'Cari hesap borcuna yansıtıldı, fatura vadesi 30 gün.', target_user_id
    );
    INSERT INTO invoice_items (invoice_id, stock_id, description, quantity, unit_price, vat_rate, total_price)
    VALUES (inv7_id, NULL, 'Alternatör Revizyon Bedeli (Açık Hesap)', 1, 4500, 0, 4500);

    -- Açık hesap işlemi cariyi borçlandırır.
    INSERT INTO transactions (customer_id, invoice_id, type, payment_method, amount, description, transaction_date)
    VALUES (cust_aras_id, inv7_id, 'gelir', 'acik_hesap', 4500, '[Test] Fatura Satışı (Cari Borç): FTR202600007', '2026-06-08 18:40:00+03');

    -- Haziran Ayı Genel Gider - Dükkan Kirası (Gider)
    INSERT INTO transactions (bank_account_id, type, payment_method, amount, description, transaction_date)
    VALUES (bank_id, 'gider', 'havale', 15000, '[Test] Dükkan Haziran Ayı Kira Bedeli', '2026-06-15 11:00:00+03');


    -- 12. AKTİF SÜREN VE PLANLANAN İŞLEMLER (Dashboard Kokpit İçin)
    -- SRV-008: Ahmet Yılmaz Golf - Motor Tekleme Sorunu (İşlemde/Onarımda)
    INSERT INTO service_records (
        id, service_code, customer_id, vehicle_id, service_type, priority, entry_date, exit_date, status, 
        description, customer_complaint, diagnosis, solution, total_cost, discount, total_net, warranty, created_by, entry_mileage, fuel_level, damage_assessment
    ) VALUES (
        srv8_id, 'SRV-2026-008', cust_ahmet_id, veh_golf_id, 'tamir', 'acil', '2026-06-15 10:00:00+03', NULL, 'işlemde',
        'Motor tekleme yapıyor. Silindir 1 bobini ve buji kontrolleri sürüyor.', 'Motor lambası yanıp sönüyor, araç sarsıntılı çalışıyor.',
        'Silindir 1 ateşleme bobini düzensiz akım veriyor.', 'İşlem devam ediyor.', 0, 0, 0, NULL, target_user_id, 124500, '1/4', 'Yok'
    );
    -- SRV-009: Esen Lojistik Sprinter - Amortisör Hatası (Beklemede)
    INSERT INTO service_records (
        id, service_code, customer_id, vehicle_id, service_type, priority, entry_date, exit_date, status, 
        description, customer_complaint, diagnosis, solution, total_cost, discount, total_net, warranty, created_by, entry_mileage, fuel_level, damage_assessment
    ) VALUES (
        srv9_id, 'SRV-2026-009', cust_esen_id, veh_sprinter_id, 'tamir', 'normal', '2026-06-17 14:00:00+03', NULL, 'beklemede',
        'Sağ ön amortisörde sızıntı var. Parça siparişi verildi, bekleniyor.', 'Ön taraftan takırtı sesi geliyor.',
        'Sağ ön amortisör patlamış.', 'Parça bekleniyor.', 0, 0, 0, NULL, target_user_id, 85200, 'Full', 'Temiz'
    );


    -- 13. BUGÜNKÜ VE GELECEKTEKİ RANDEVULAR
    -- Randevu 1: Mustafa Kaya (Bugün)
    INSERT INTO appointments (
        id, customer_id, vehicle_id, title, description, appointment_date, duration, status, reminder_sent, created_by, is_deleted
    ) VALUES (
        gen_random_uuid(), cust_mustafa_id, veh_megane_id, 'Fren Disk Kontrolü', 'Araç sahibi frende hafif ses duyduğunu belirtti, kontrol edilecek.', now() + interval '1 hour', '1 Saat', 'planlandı', false, target_user_id, false
    );

    -- Randevu 2: Ayşe Demir (Gelecek - 2 gün sonra)
    INSERT INTO appointments (
        id, customer_id, vehicle_id, title, description, appointment_date, duration, status, reminder_sent, created_by, is_deleted
    ) VALUES (
        gen_random_uuid(), cust_ayse_id, veh_i20_id, 'Klima Gaz Dolumu ve Genel Kontrol', 'Yazlık klima bakımı yapılacak.', now() + interval '2 days', '45 Dakika', 'planlandı', false, target_user_id, false
    );

    -- Randevu 3: Aras Kargo (Gelecek - 5 gün sonra)
    INSERT INTO appointments (
        id, customer_id, vehicle_id, title, description, appointment_date, duration, status, reminder_sent, created_by, is_deleted
    ) VALUES (
        gen_random_uuid(), cust_aras_id, veh_transit2_id, '190.000 KM Ağır Bakım', 'Zincir seti ve genel motor bakımları.', now() + interval '5 days', '4 Saat', 'planlandı', false, target_user_id, false
    );

    -- 14. STOK REZERVASYONLARINI MANUEL AYARLA (Servislerin güncel durumuna göre)
    -- stock_balata: 1 adet Nisan srv1'de tamamlandı (stoktan düştü), 2 adet Mayıs srv4'te tamamlandı (stoktan düştü).
    -- Toplamda 3 adet satıldı. Kalan stok: 45 - 3 = 42 adet olarak ayarlayalım.
    UPDATE stock_cards SET current_stock = 42, reserved_stock = 0 WHERE id = stock_balata_id;

    -- stock_yag: 1 adet Nisan srv2 (tamamlandı), 1 adet Mayıs srv5 (tamamlandı), 1 adet Haziran srv6 (tamamlandı).
    -- Toplamda 3 adet satıldı. Kalan stok: 30 - 3 = 27 adet.
    UPDATE stock_cards SET current_stock = 27, reserved_stock = 0 WHERE id = stock_yag_id;

    -- stock_yag_filtresi: 1 nisan, 1 haziran. Kalan: 85 - 2 = 83.
    UPDATE stock_cards SET current_stock = 83, reserved_stock = 0 WHERE id = stock_yag_filtresi_id;

    -- stock_hava_filtresi: 1 nisan. Kalan: 75 - 1 = 74.
    UPDATE stock_cards SET current_stock = 74, reserved_stock = 0 WHERE id = stock_hava_filtresi_id;

    -- stock_mazot_filtresi: 1 haziran. Kalan: 38 - 1 = 37.
    UPDATE stock_cards SET current_stock = 37, reserved_stock = 0 WHERE id = stock_mazot_filtresi_id;

    -- stock_buji: 1 buji seti nisan. Kalan: 18 - 1 = 17.
    UPDATE stock_cards SET current_stock = 17, reserved_stock = 0 WHERE id = stock_buji_id;

    -- stock_disk: 2 disk mayıs srv4. Kalan: 12 - 2 = 10.
    UPDATE stock_cards SET current_stock = 10, reserved_stock = 0 WHERE id = stock_disk_id;

    -- stock_silecek: 1 silecek nisan srv3. Kalan: 58 - 1 = 57.
    UPDATE stock_cards SET current_stock = 57, reserved_stock = 0 WHERE id = stock_silecek_id;

    -- stock_polen: 1 polen nisan srv2. Kalan: 72 - 1 = 71.
    UPDATE stock_cards SET current_stock = 71, reserved_stock = 0 WHERE id = stock_polen_id;

    -- stock_antifriz: 1 antifriz mayıs srv5. Kalan: 48 - 1 = 47.
    UPDATE stock_cards SET current_stock = 47, reserved_stock = 0 WHERE id = stock_antifriz_id;

    -- 15. STOK HAREKETLERİNİ MANUEL EKLE
    INSERT INTO stock_movements (stock_id, movement_type, quantity, reference_type, reference_id, created_by, created_at)
    VALUES 
    (stock_balata_id, 'çıkış', 1, 'servis', srv1_id, target_user_id, '2026-04-03 17:00:00+03'),
    (stock_balata_id, 'çıkış', 2, 'servis', srv4_id, target_user_id, '2026-05-05 18:00:00+03'),
    (stock_yag_id, 'çıkış', 1, 'servis', srv2_id, target_user_id, '2026-04-10 14:00:00+03'),
    (stock_yag_id, 'çıkış', 1, 'servis', srv5_id, target_user_id, '2026-05-18 15:30:00+03'),
    (stock_yag_id, 'çıkış', 1, 'servis', srv6_id, target_user_id, '2026-06-02 17:00:00+03'),
    (stock_yag_filtresi_id, 'çıkış', 1, 'servis', srv2_id, target_user_id, '2026-04-10 14:00:00+03'),
    (stock_yag_filtresi_id, 'çıkış', 1, 'servis', srv6_id, target_user_id, '2026-06-02 17:00:00+03'),
    (stock_hava_filtresi_id, 'çıkış', 1, 'servis', srv2_id, target_user_id, '2026-04-10 14:00:00+03'),
    (stock_mazot_filtresi_id, 'çıkış', 1, 'servis', srv6_id, target_user_id, '2026-06-02 17:00:00+03'),
    (stock_buji_id, 'çıkış', 1, 'servis', srv3_id, target_user_id, '2026-04-22 16:00:00+03'),
    (stock_disk_id, 'çıkış', 2, 'servis', srv4_id, target_user_id, '2026-05-05 18:00:00+03'),
    (stock_silecek_id, 'çıkış', 1, 'servis', srv3_id, target_user_id, '2026-04-22 16:00:00+03'),
    (stock_polen_id, 'çıkış', 1, 'servis', srv2_id, target_user_id, '2026-04-10 14:00:00+03'),
    (stock_antifriz_id, 'çıkış', 1, 'servis', srv5_id, target_user_id, '2026-05-18 15:30:00+03');

    RAISE NOTICE 'Test verileri başarıyla tohumlandı. Hesap e-postası: %', target_email;
END $$;
