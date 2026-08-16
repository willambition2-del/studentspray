# Production Environment Variables & Configuration Inventory

## 1. Overview
This document specifies all runtime environment variables, validation rules, security requirements, and recommended permissions for deploying the Quran Forum Platform to production.

---

## 2. Backend Environment Variables (NestJS)

| Variable Name | Type | Required | Default / Format | Description |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | `string` | **Yes** | `production` | Environment mode (`development`, `test`, `production`). In `production`, Swagger is disabled, memory fallback is forbidden, and cookies require HTTPS. |
| `PORT` | `number` | **Yes** | `4000` | HTTP port on which the NestJS API server listens. |
| `DATABASE_URL` | `string` | **Yes** | `postgresql://user:pass@host:5432/dbname?schema=public` | Production PostgreSQL connection URI with credentials. |
| `REDIS_HOST` | `string` | **Yes** | — (e.g. `redis-prod.internal`) | Hostname or IP of the production Redis server. |
| `REDIS_PORT` | `number` | No | `6379` | Port for Redis server. |
| `REDIS_PASSWORD` | `string` | No | — | Password for Redis AUTH in production. |
| `REDIS_DB` | `number` | No | `0` | Redis logical database index. |
| `REDIS_ALLOW_MEMORY_FALLBACK` | `boolean` | No | `false` | **Enforced `false` in production** to prevent silent data desynchronization. |
| `CORS_ORIGINS` | `string` | **Yes** | e.g. `https://admin.example.com,https://app.example.com` | Comma-separated list of allowed HTTPS origins. Wildcard `*` is strictly forbidden. |
| `JWT_ACCESS_SECRET` | `string` | **Yes** | Min 32 characters | High-entropy cryptographic secret for signing short-lived access tokens. |
| `JWT_ACCESS_TTL` | `string` | No | `15m` | Lifetime of access token (e.g., `15m`). |
| `JWT_ISSUER` | `string` | No | `quran-forum-api` | Token issuer identifier. |
| `JWT_AUDIENCE` | `string` | No | `quran-forum-clients` | Token audience identifier. |
| `REFRESH_TOKEN_HASH_SECRET` | `string` | **Yes** | Min 32 characters | High-entropy secret used for HMAC-SHA256 hashing of refresh tokens in the database. |
| `REFRESH_TOKEN_TTL_DAYS` | `number` | No | `30` | Refresh token lifespan in days. |
| `AUTH_COOKIE_NAME` | `string` | No | `qf_refresh` | Name of the HttpOnly session refresh cookie. |
| `AUTH_COOKIE_SAME_SITE` | `string` | No | `strict` | SameSite cookie policy (`strict`, `lax`, `none`). |
| `TRUST_PROXY` | `boolean` | No | `true` | Set to `true` when running behind Nginx / Cloudflare reverse proxy for accurate IP tracking. |
| `FCM_ENABLED` | `boolean` | No | `false` | Enable Firebase Cloud Messaging push dispatch. |
| `FIREBASE_PROJECT_ID` | `string` | If FCM enabled | — | Firebase project identifier. |
| `FIREBASE_CLIENT_EMAIL` | `string` | If FCM enabled | — | Firebase Service Account client email. |
| `FIREBASE_PRIVATE_KEY` | `string` | If FCM enabled | — | Firebase Service Account private RSA key (with `\n` line breaks). |
| `PDF_FONT_PATH` | `string` | No | e.g. `/usr/share/fonts/arabic/Amiri-Regular.ttf` | Absolute path to regular Arabic TTF font. |
| `PDF_BOLD_FONT_PATH` | `string` | No | e.g. `/usr/share/fonts/arabic/Amiri-Bold.ttf` | Absolute path to bold Arabic TTF font. |

---

## 3. Frontend Web Environment Variables (Vite Admin SPA)

| Variable Name | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | **Yes** in Prod | `http://localhost:4000/api/v1` | Public HTTPS URL pointing to the NestJS API endpoint (e.g. `https://api.example.com/api/v1`). |

---

## 4. Mobile Environment Variables (Flutter)

| Dart Define Flag | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `API_BASE_URL` | **Yes** in Prod | `http://10.0.2.2:4000/api/v1` | Public HTTPS URL for the API backend (passed via `--dart-define=API_BASE_URL=https://api.example.com/api/v1`). |

---

## 5. PostgreSQL Production User Permissions Recommendation

In production, avoid running the application as a PostgreSQL `SUPERUSER`. Create a dedicated application user with scoped permissions:

```sql
CREATE USER quran_forum_app WITH PASSWORD 'STRONG_RANDOMLY_GENERATED_PASSWORD';
GRANT CONNECT ON DATABASE quran_forum TO quran_forum_app;
GRANT USAGE ON SCHEMA public TO quran_forum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO quran_forum_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO quran_forum_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO quran_forum_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO quran_forum_app;
```
