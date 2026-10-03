# NOVA — Vercel edition

This folder is the GitHub/Vercel version of the NOVA laptop store.

## Start locally

1. Install Node.js 22.13 or newer.
2. Run `npm ci`.
3. Copy `.env.example` to `.env` and add your own credentials when ready.
4. Run `npm run dev` and open http://localhost:5174.

Without credentials, the store provides a temporary demo bag and demo checkout. No email is sent and no order is saved in demo mode.

## Automatic deployment

Import this repository into Vercel. The included vercel.json selects Next.js and the build command. The repository root must be this folder. Pushes to the production branch trigger deployment through Vercel's Git integration.

First deploy in demo mode to obtain a stable production URL. Then add the variables from .env.example in Vercel Project Settings > Environment Variables for Production. Set APP_URL to that HTTPS URL without a trailing slash. Redeploy after changing variables.

## Neon

Create a Neon project and copy its connection string into DATABASE_URL in your local .env. Run `npm run db:setup` once to create tables, apply the laptop migration, and seed products. Add the same DATABASE_URL to Vercel. Do not run database setup during every deployment.

## Google sign-in

Create a Google Cloud project, configure Google Auth Platform, add your test users, and create a Web application OAuth client. Register `http://localhost:5174/api/auth/google/callback` for local testing and `https://YOUR-VERCEL-DOMAIN/api/auth/google/callback` for production. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to each environment. Generate SESSION_SECRET with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

APP_URL must match the URL used in the browser. Use localhost consistently when testing locally. Use the stable production domain for the submission; changing Vercel preview URLs are not automatically registered with Google.

## Mailgun

Use a sandbox sending domain for the classroom demo. Add the destination email as an authorized recipient and accept its verification email. Add MAILGUN_API_KEY (a domain sending key), MAILGUN_DOMAIN, MAILGUN_FROM, and MAILGUN_REGION (US or EU). For example, MAILGUN_FROM is `NOVA <postmaster@YOUR_SANDBOX_DOMAIN>`. A verified custom sending domain is required to send to general recipients.

## Verify before submission

Run `npm test` and `npm run build`. Sign in with Google, configure a laptop, refresh to check the saved bag, submit an order, inspect Neon orders and order_items, and verify the Mailgun email.

Never commit .env or paste credentials into chat. No payment is collected. Hardware, prices, and three original AI-generated product renders are fictional student-project data. Original imagery and configuration details are documented in PROJECT-NOTES.md.
