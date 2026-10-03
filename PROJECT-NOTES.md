# NOVA — bootcamp shop

A premium laptop storefront built with React, TypeScript and Vinext (Next.js-compatible routing). Neon Postgres stores products, carts, customers, sessions and orders. Google OpenID Connect provides login. Mailgun sends order confirmations.

## Start here

1. Install Node.js 22.13+.
2. Open a terminal in this folder and run `npm ci`.
3. Copy `.env.example` to `.env`.
4. Run `npm run dev` and open http://localhost:5173.

Without credentials you can browse and test a clearly labelled demo checkout. Demo state is temporary and is not database persistence. No payment is collected: this assignment implements order checkout, not a payment gateway.

## 1. Neon

1. Create a project at https://console.neon.tech.
2. Copy the PostgreSQL connection string into `DATABASE_URL` in `.env`. Keep the SSL settings in the URL.
3. Run `npm run db:setup`. This creates tables and inserts the four configurable laptops. It is safe to run again; it does not delete existing orders.
4. Restart the server. The storefront now loads products from Neon and saves carts and orders there.

## 2. Google Cloud Console

1. Create a project at https://console.cloud.google.com.
2. Open Google Auth Platform. Configure Branding, Audience and Data Access for `openid`, `email`, and `profile`.
3. While in Testing, add your own Google account and your instructor's account as test users.
4. Under Clients, create an OAuth client of type Web application.
5. Add this exact authorized redirect URI: `http://localhost:5173/api/auth/google/callback`.
6. Copy the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
7. Generate a secret using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and set `SESSION_SECRET`.
8. Set `APP_URL=http://localhost:5173`. Restart and test Sign in with Google.

Use localhost consistently, not 127.0.0.1. Production requires its exact HTTPS URL in APP_URL and its `/api/auth/google/callback` URI registered in Google. Google uses a server-side code exchange; the app validates signature, audience, issuer, expiry, nonce and state. Sessions are stored in Neon with only a hashed random token; the browser receives an HttpOnly cookie.

## 3. Mailgun

1. Create an account at https://www.mailgun.com and open Sending / Domains.
2. For a quick class demo, use the sandbox domain and authorize your test recipient's email. The recipient must accept Mailgun's verification email.
3. Set `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` and `MAILGUN_FROM` (for example `NOVA <orders@YOUR_SANDBOX_DOMAIN>`).
4. Use `MAILGUN_REGION=US`, or `EU` for an EU-region domain.
5. Restart, then check out using an authorized recipient address.

For a custom domain, verify the DNS records Mailgun provides. Mailgun acceptance means queued, not guaranteed inbox delivery; check Mailgun logs. An email failure never removes an order or asks the shopper to place it twice. The confirmation page provides an email retry action.

## Submission checklist

- Browse the Everyday, Creative and Gaming ranges. Configure the processor, RAM and SSD, then verify the price changes.
- Add two different builds of one laptop to the bag; verify they stay separate, then change quantity or remove one.
- Reload with Neon configured and verify the cart remains.
- Sign in with your Google test user, then sign out.
- Submit an order; inspect orders and order_items in Neon.
- Verify the Mailgun confirmation arrives for an authorized recipient.
- Demonstrate empty cart, invalid input and success states on desktop/mobile.
- Run `npm run typecheck`, `npm test`, and `npm run build`.

## Hosting

The project runs locally and includes Cloudflare-compatible build output support for Sites hosting. To activate integrations on a compatible host, configure the same environment variables as encrypted runtime secrets and set APP_URL to that origin. Never put secrets in source code, NEXT_PUBLIC variables, screenshots or Git. Before sharing a hosted version with your instructor, verify its access settings and register the hosted Google callback URL.

## Architecture and limitations

See `lib/server.ts` for persistence and identity, `app/api/shop/route.ts` for checkout, and `app/api/auth/google` for OAuth. `lib/validation.ts` owns order validation and totals. Prices are integer cents and are always read and recomputed by the server. SQL uses parameters. Order creation is transactional and idempotent, using a checkout request key. Address and order-line snapshots preserve purchase details when products change.

This is a classroom concept, not a production payment system. There is no payment processing, inventory reservation, tax calculation, refunds or shipping-provider integration. Dummy prices are in USD. Shipping is complimentary on every laptop. Email sends can be retried; Mailgun does not guarantee exactly-once delivery after an ambiguous network timeout.

## Original product imagery

Three original laptop renders were made with the built-in image-generation tool. They are fictional NOVA products; specifications, performance claims, and prices are sample project data, not real manufacturer offers or verified benchmark results. WebP assets in public/images are optimized copies of the generated PNGs.

- nova-studio: graphite 16-inch laptop, three-quarter view, black studio backdrop, orange abstract display, premium product campaign photography, no logos or interface text.
- nova-air: silver ultrathin laptop, three-quarter view, pale gray backdrop, icy blue abstract display, soft shadow, no logos or interface text.
- nova-arc: graphite gaming laptop, restrained violet keyboard lighting and abstract screen, pale gray backdrop, no logos or interface text.

## Official references

- Neon driver: https://neon.com/docs/serverless/serverless-driver
- Google OpenID Connect: https://developers.google.com/identity/openid-connect/openid-connect
- Mailgun HTTP sending: https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/send-http

## Laptop configuration implementation

The catalog in lib/catalog.ts defines the only allowed processor, memory and SSD options for each model. Upgrade prices are integer cents. The server rejects incompatible or fabricated selections and recomputes totals from its own catalog. Each bag line is keyed by model plus all specification IDs. The checkout saves readable specification snapshots in order_items.configuration; Mailgun emails include these exact snapshots.

Run npm run db:setup after upgrading from the homewares project. The idempotent migration in db/laptop-configurations.sql preserves existing orders, changes the order-item key to support multiple builds of one laptop, and adds the configuration snapshot. Older products remain in the database to preserve historical order references but are excluded from the active laptop catalog. Obsolete cart items are not displayed.

Demo mode remains temporary and is intentionally not described as persistence. Connect your Neon, Google and Mailgun credentials to test the live integrations.


