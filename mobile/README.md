# NOVA for Android

Native React Native / Expo SDK 57 application for the existing NOVA shop.
The app reads the live catalogue, saves the cart, and submits demo orders through
the same `https://nova-shop-eight-mu.vercel.app/api/shop` endpoint as the website.
No database, Google, or email-provider secret belongs in this app.

## Run on a physical Android phone

1. Install **Expo Go** from Google Play. SDK 57 is required; update Expo Go if prompted.
2. On the computer, open a terminal in this `mobile` folder and run `npm ci`, then `npm start`.
3. Put the phone and computer on the same Wi-Fi. In Expo Go, choose **Scan QR code** and scan the terminal QR.
4. Open **Account → Continue with Google**. The phone opens NOVA in Chrome.
5. Sign in with the same Google account used on the website. Compare the connection code, choose **Connect my Android app**, then return to Expo Go.
6. Open **Your bag**. Keep the app visible while adding a configured laptop on the website.

If Wi-Fi blocks device access, use `npx expo start --tunnel` (requires the Expo tunnel dependency), or connect the phone by USB and use `adb reverse tcp:8081 tcp:8081` with the localhost Expo URL. Do not change any Vercel secrets.

Google's project currently uses Testing mode. The account must be listed as an OAuth test user. Existing approved NOVA test accounts continue to work without a second Google client.

## Optional installable APK

Expo Go runs the actual native app for the class demonstration. To create an APK that runs independently of the development computer, sign into an Expo account and run:

```sh
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

The `preview` build in `eas.json` produces an Android APK. The Expo CLI will prompt to link/create the Expo project. Review any account terms yourself. This repository does not claim an APK or Play Store release has been built.

## How accounts and carts work

- Google sign-in uses the website's existing OAuth flow in the system browser.
- The app generates a random proof, sends its SHA-256 challenge, and receives a signed ten-minute pairing ticket. The browser must explicitly approve the matching code.
- Only the app holding the original proof can redeem the approved ticket. Redemption and session creation happen in one SQL statement, once only.
- The seven-day mobile session is saved in Expo SecureStore and sent as a bearer token. Website sessions remain HttpOnly cookies. Both resolve to the same `users.id` and account cart key.
- Browser writes still require the correct Origin. A bearer token is validated before allowing native access.
- Both clients subscribe to `/api/cart-events`. Vercel streams database snapshots approximately once per second, with reconnect after each bounded stream. This is near-real-time: normally 1–2 seconds, depending on connection speed, not a zero-latency guarantee.
- Sync stops while the app is backgrounded and reconnects on return. Offline updates are not silently queued. Writes include the previous bag and reject stale changes instead of overwriting another device.
- Signing out on one device revokes that session, clears its visible account bag, and leaves other devices signed in.
- A guest bag is adopted on Google sign-in if the account has no bag yet. An existing account bag takes priority.

## Server setup for another deployment

Run `db/mobile.sql` once against the existing Neon database, or run the root `npm run db:setup` setup. The production NOVA database migration was applied during development. Existing Vercel variables are reused; no mobile secret or extra Google redirect is required. Change `SITE` in `src/shop.tsx` if you deploy to a different canonical URL.

## Checks

```sh
npm run typecheck
npm run lint
npx expo export --platform android
```

Root `npm test` checks server pricing, shared account ownership, user isolation, invalid native credentials, browser origin protection, and pairing proof enforcement.

## Physical-phone acceptance record

**Status: pending physical Android verification.** A successful bundle or browser test is not a phone test.

Record your phone model, Android version, date, and the results below. Use screen recordings/screenshots with no passwords, API keys, or tokens visible.

| Test | Expected | Result |
| --- | --- | --- |
| Google login | Same name/email on website and Android | Pending |
| Web → phone | Add Air 14 with 32 GB RAM; identical build/quantity appears without refresh | Pending |
| Phone → web | Increase quantity on phone; website updates without refresh | Pending |
| Separate configurations | Add same laptop with another SSD; two separate lines | Pending |
| App restart | Account and saved bag restored | Pending |
| Reconnection | Turn phone Wi-Fi off/on; current bag restores on reconnect | Pending |
| Simultaneous changes | One stale write is rejected; neither silently overwrites newer bag | Pending |
| Sign out | Phone bag clears; website stays signed in; sign back in to restore bag | Pending |

Use the existing approved test email for demo order confirmations. Resend's onboarding sender is restricted to the account owner's email until a sending domain is verified.
