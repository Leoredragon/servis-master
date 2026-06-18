-- ====================================================================
-- SERVIS MASTER TEMİZLİK VE DEMO HESAP KURULUM SCRIPT'I
-- ====================================================================
-- Bu scripti Supabase Dashboard -> SQL Editor sayfasına yapıştırıp 
-- RUN diyerek çalıştırın.
--
-- Bu script şunları yapacaktır:
-- 1. admin@servismaster.com (Super Admin) dışındaki tüm kullanıcıları auth.users tablosundan silecektir.
-- 2. Tüm işlemleri, servis kayıtlarını, müşterileri ve araçları silecektir (Veritabanı sıfırlanacaktır).
-- 3. Yeni kullanıcı kaydolduğunda otomatik olarak "Peşin Satışlar" adında varsayılan bir müşteri oluşturan trigger'ı güncelleyecektir.
-- 4. demo@servismaster.app adında temiz bir demo hesabı oluşturacaktır (Şifre: Demo1234!).
-- ====================================================================

DO $$
DECLARE
    admin_user_id UUID;
    demo_user_id UUID;
    demo_email VARCHAR := 'demo@servismaster.app';
    demo_password VARCHAR := 'Demo1234!';
    demo_full_name VARCHAR := 'Demo Kullanıcı';
    default_customer_id UUID := gen_random_uuid();
BEGIN
    -- 1. ADMIN USER ID'YI BUL VE KAYDET (Silinmesini önlemek için)
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@servismaster.com';
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin kullanıcısı (admin@servismaster.com) bulunamadı! Lütfen önce admin hesabının açık olduğundan emin olun.';
    END IF;

    -- 2. TÜM HAREKET, SERVİS, FATURA VE MÜŞTERİ VERİLERİNİ TEMİZLE
    DELETE FROM appointments;
    DELETE FROM transactions;
    DELETE FROM invoice_items;
    DELETE FROM invoices;
    DELETE FROM service_items;
    DELETE FROM service_records;
    DELETE FROM vehicles;
    DELETE FROM stock_movements;
    DELETE FROM stock_cards;
    DELETE FROM customers;
    
    -- Kasa ve Banka bakiyelerini sıfırla
    UPDATE cash_registers SET balance = 0;
    UPDATE bank_accounts SET balance = 0;

    -- 3. ADMIN DIŞINDAKİ TÜM KULLANICILARI AUTH.USERS'DAN KALDIR
    -- (ON DELETE CASCADE kısıtlamaları profiles tablosundaki kayıtlarını da otomatik silecektir)
    DELETE FROM auth.users WHERE email != 'admin@servismaster.com';

    -- 4. DEMO KULLANICISINI OLUŞTUR (Şifre ile)
    demo_user_id := gen_random_uuid();
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
        demo_user_id,
        'authenticated',
        'authenticated',
        demo_email,
        crypt(demo_password, gen_salt('bf', 10)),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', demo_full_name),
        now(),
        now()
    );

    -- Not: auth.users tablosuna kayıt girdiğimizde handle_new_user tetiklenecektir.
    -- Ancak demo kullanıcısının profil bilgilerini garantiye almak için el ile de güncelleyelim.
    UPDATE public.profiles 
    SET role = 'user', package_name = 'Başlangıç', status = 'active', full_name = demo_full_name
    WHERE id = demo_user_id;

    RAISE NOTICE 'Admin dışındaki tüm veriler ve kullanıcılar temizlendi. Yeni demo hesabı oluşturuldu: % (Şifre: %)', demo_email, demo_password;
END;
$$;

-- 5. YENİ KULLANICI TETİKLEYİCİSİNİ GÜNCELLE
-- Artık yeni bir kullanıcı kaydolduğunda otomatik olarak profilinin yanı sıra
-- ona özel "Peşin Satışlar" müşterisi de oluşturulacaktır.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    default_cust_id UUID := gen_random_uuid();
BEGIN
    -- Profil oluştur
    INSERT INTO public.profiles (id, email, full_name, role, package_name)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        CASE WHEN new.email = 'admin@servismaster.com' THEN 'admin' ELSE 'user' END,
        'Başlangıç'
    );

    -- Admin olmayan kullanıcılar için varsayılan "Peşin Satışlar" müşterisi oluştur
    IF new.email != 'admin@servismaster.com' THEN
        INSERT INTO public.customers (
            id,
            customer_code,
            first_name,
            last_name,
            phone,
            email,
            address,
            city,
            district,
            tax_number,
            tax_office,
            company_name,
            type,
            notes,
            discount_rate,
            balance,
            created_by
        ) VALUES (
            default_cust_id,
            'PEŞİN-001',
            'Peşin Satışlar',
            '',
            '05000000000',
            'pesin@servismaster.app',
            'Genel Mağaza',
            'İstanbul',
            'Merkez',
            NULL,
            NULL,
            'Peşin Satışlar',
            'bireysel',
            'Hızlı/peşin satışlar için varsayılan sistem müşterisidir.',
            0,
            0,
            new.id
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
