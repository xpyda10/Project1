CREATE TABLE IF NOT EXISTS products(id text PRIMARY KEY, data jsonb NOT NULL, position integer NOT NULL);
CREATE TABLE IF NOT EXISTS users(id text PRIMARY KEY, email text NOT NULL, name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS sessions(token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS carts(id text PRIMARY KEY, items jsonb NOT NULL DEFAULT '[]', updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS orders(id uuid PRIMARY KEY, owner text NOT NULL, user_id text REFERENCES users(id), email text NOT NULL, shipping jsonb NOT NULL, subtotal integer NOT NULL CHECK(subtotal>=0), shipping_total integer NOT NULL CHECK(shipping_total>=0), total integer NOT NULL CHECK(total=subtotal+shipping_total), request_hash text NOT NULL, email_status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS orders_owner_idx ON orders(owner);
CREATE TABLE IF NOT EXISTS order_items(order_id uuid REFERENCES orders(id) ON DELETE CASCADE, product_id text NOT NULL REFERENCES products(id), name text NOT NULL, unit_price integer NOT NULL CHECK(unit_price>=0), quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 10), PRIMARY KEY(order_id,product_id));
