# Production Deployment & Infrastructure Guide

## 1. Prerequisites
- **Server**: Linux (Ubuntu 22.04 LTS / Debian 12 recommended)
- **Runtimes**: Node.js 20+ LTS, Docker & Docker Compose
- **Database**: PostgreSQL 15+ instance with connection pooling
- **Cache & Realtime**: Redis 7+ instance with persistent AOF / RDB
- **Domain & SSL**: Valid domain with TLS certificates (Let's Encrypt / Certbot)
- **Reverse Proxy**: Nginx 1.22+ or equivalent edge gateway

---

## 2. Deployment Sequence (Step-by-Step)

```text
1. Provision PostgreSQL & Redis
           │
2. Configure Environment (.env on server, not committed to git)
           │
3. Build Multi-Stage Docker Image (`backend/Dockerfile`)
           │
4. Apply Migrations: `npx prisma migrate deploy`
           │
5. Bootstrap Initial General Manager (CLI script)
           │
6. Start Backend Container (`node dist/main.js`)
           │
7. Verify Health Endpoint: `GET /api/v1/health` (HTTP 200)
           │
8. Build & Deploy React Admin Static Bundle (`npm run build` -> Nginx root)
           │
9. Configure Nginx Reverse Proxy & TLS (`infra/nginx/quran-forum.conf.example`)
           │
10. Build & Sign Mobile App: `flutter build apk --release --dart-define=API_BASE_URL=https://...`
```

---

## 3. Database Migration Deployment Command

In production, **never** run `prisma db push` or `prisma migrate dev`.
Use the non-destructive deployment migration command:

```bash
cd backend
npx prisma migrate deploy
```

---

## 4. Production Start Command

The NestJS backend runs compiled JavaScript in production:

```bash
# Direct process
NODE_ENV=production node dist/main.js

# Docker container
docker run -d \
  --name quran-forum-backend \
  --restart unless-stopped \
  -p 4000:4000 \
  --env-file .env.production \
  quran-forum-backend:latest
```

---

## 5. Rollback Strategy

### Application Rollback
- Re-tag and deploy previous stable Docker image tag (e.g. `quran-forum-backend:v1.0.0`).
- For Web Admin SPA, point Nginx root to previous release artifact directory.

### Database Rollback
- Database schema changes with breaking column drops must **never** be rolled back blindly.
- In catastrophic data corruption scenarios, execute safe database restoration from the latest verified `.dump` backup using `scripts/restore-db.sh <backup_file> <DATABASE_URL> --clean`.
