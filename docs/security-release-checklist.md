# Security & Release Checklist

## 1. Authentication & Session Security
- [x] **Access Token Storage**: Stored exclusively in volatile memory (`src/lib/api/client.ts`, Flutter `TokenStorage`). Never written to `localStorage` or `sessionStorage`.
- [x] **Refresh Token Rotation**: Handled via `HttpOnly`, `SameSite=Strict`, `Secure` (in production) cookies on Web, and `FlutterSecureStorage` (hardware-backed Keystore/Keyring) on Mobile.
- [x] **Session Reuse Detection**: Server tracks refresh token rotation chain; reuse of an old token invalidates the entire session family.
- [x] **Password Hashing**: Argon2id with memory cost 65536, time cost 3, parallelism 1. Zero plaintext password storage or logging.
- [x] **Rate Limiting**: Global throttling (`120 req / 60s`) + strict auth lockout protection (`5 attempts / 15min lock`).

## 2. API & Network Hardening
- [x] **Helmet Security Headers**: Active on all HTTP responses (`X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `CSP`).
- [x] **CORS Origin Validation**: Strict whitelist parsed from `CORS_ORIGINS`. Wildcards forbidden in production.
- [x] **Payload Validation**: NestJS `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` prevents mass assignment.
- [x] **Error Response Sanitization**: Production error filter strips stack traces, SQL errors, internal filenames, and database driver messages.
- [x] **Swagger Documentation**: Automatically disabled in production (`NODE_ENV=production`).

## 3. Realtime & File Security
- [x] **Socket.IO Authentication**: JWT handshake authentication with room membership authorization guards.
- [x] **PDF Generation**: Server-side Arabic RTL PDF with configurable font paths (`PDF_FONT_PATH`, `PDF_BOLD_FONT_PATH`).
- [x] **CSV Export Security**: Formula injection mitigation sanitizes cells starting with `=`, `+`, `-`, `@`, `\t`, `\r`.
- [x] **Redis Production Safety**: In-memory fallback forbidden in `production`. Service health reports Redis status.

## 4. Mobile Security
- [x] **Android Cleartext Traffic**: HTTPS enforced in release builds.
- [x] **Local SQLite Isolation**: Drift database isolates cached records per `userId` to prevent data leakage across account switches.
