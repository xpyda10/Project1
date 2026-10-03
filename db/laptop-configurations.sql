ALTER TABLE order_items ADD COLUMN IF NOT EXISTS configuration jsonb NOT NULL DEFAULT '{}';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_key text;
UPDATE order_items SET line_key=product_id WHERE line_key IS NULL;
ALTER TABLE order_items ALTER COLUMN line_key SET NOT NULL;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_pkey;
ALTER TABLE order_items ADD PRIMARY KEY(order_id,line_key);
