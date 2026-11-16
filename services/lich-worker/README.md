# lich-api (Cloudflare Worker)

Optional services for `/vi/lich-am/` on deeplyai.app. The static site works without them; each
feature below stays hidden until `PUBLIC_LICH_API` is set when the site is built.

| Endpoint | Used by |
|---|---|
| `GET /v1/weather?lat=&lon=` | "Thời tiết tại vị trí của tôi" on `/vi/lich-am/thoi-tiet/` (coordinates rounded to 0.01°, cached 30 min) |
| `GET /v1/market` | Gold (SJC via PNJ) and VN-Index cards on `/vi/lich-am/ty-gia/`, only for sources listed in `MARKET_SOURCES` |
| `GET /v1/push/key`, `POST /v1/push/subscribe`, `POST /v1/push/unsubscribe`, `GET /v1/push/message` | `/vi/lich-am/tien-ich/thong-bao/` and the service worker |
| Cron `0 23 * * *` (06:00 Vietnam) | Sends the morning reminders: rằm / mùng 1 and the chosen city's weather |

## Deploy (about 10 minutes)

1. Create a free Cloudflare account, then from this folder:
   ```bash
   npm install
   npx wrangler login
   npx wrangler kv namespace create PUSH
   ```
   Put the printed `id` into `wrangler.toml` (`[[kv_namespaces]]`).
2. Generate Web Push keys and store the private one as a secret:
   ```bash
   npm run vapid
   npx wrangler secret put VAPID_PRIVATE_JWK
   ```
   Paste the public key into `VAPID_PUBLIC_KEY` in `wrangler.toml`.
3. Only if you have confirmed you may use them, list extra market sources in `MARKET_SOURCES`
   (`pnj`, `vndirect`). Exchange rates (Vietcombank) are always on.
4. `npx wrangler deploy` and note the URL, e.g. `https://lich-api.<account>.workers.dev`.
5. Build the site with `PUBLIC_LICH_API=<that URL>` (add it as an environment variable in the
   GitHub Actions build step, or a repository variable read there).

## iCloud (read-only) on the web

`/vi/lich-am/tien-ich/icloud/` reads the app's CloudKit data with CloudKit JS. It needs no Worker:

1. CloudKit Console › container `iCloud.com.deeplyai.LichViet` › Tokens & Keys › new **API token**,
   sign-in callback "Post Message", allowed origin `https://deeplyai.app`.
2. Make sure the app's schema is deployed to Production.
3. Build the site with `PUBLIC_CLOUDKIT_TOKEN=<token>` (and `PUBLIC_CLOUDKIT_ENV=development` to
   test against the development environment first). Test with test Apple IDs before announcing it.
