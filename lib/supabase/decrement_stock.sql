-- Bu SQL fonksiyonunu Supabase Dashboard -> SQL Editor sayfasına yapıştırıp RUN (çalıştır) diyerek kaydedin.
-- Bu sayede servis tamamlandığında parça stok düşüşü veri tabanı düzeyinde güvenli şekilde yapılır.

CREATE OR REPLACE FUNCTION decrement_stock(stock_id_input UUID, quantity_input INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE stock_cards
  SET current_stock = current_stock - quantity_input
  WHERE id = stock_id_input;
END;
$$ LANGUAGE plpgsql;
