-- 1. Eski profiles tablosunu temizle ve yeniden oluştur
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    package_name VARCHAR(100) DEFAULT 'Başlangıç',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RLS Aktifleştir (Sadece adminlerin veya service_role'ün erişmesini sağlamak için)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Herkes kendi profilini görebilir
CREATE POLICY "Kullanıcılar kendi profillerini görebilir" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Sonsuz döngüyü (recursion) önlemek için SECURITY DEFINER fonksiyon oluştur
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sadece adminler tüm profilleri görebilir/düzenleyebilir
CREATE POLICY "Adminler tüm profilleri yönetebilir" ON public.profiles
    USING (public.is_admin());

-- 3. Yeni kullanıcı kaydolduğunda otomatik profil oluşturan trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, package_name)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        CASE WHEN new.email = 'admin@servismaster.com' THEN 'admin' ELSE 'user' END,
        'Başlangıç'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger'ı bağla
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Mevcut auth.users tablosundaki kullanıcıları profiles tablosuna aktar (Backfill)
INSERT INTO public.profiles (id, email, full_name, role, package_name)
SELECT 
    id, 
    email, 
    coalesce(raw_user_meta_data->>'full_name', ''),
    CASE WHEN email = 'admin@servismaster.com' THEN 'admin' ELSE 'user' END,
    'Başlangıç'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
