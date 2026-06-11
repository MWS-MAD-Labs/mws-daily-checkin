# Komodo Stack Setup — mws-daily-checkin

## Stack Configuration

| Field | Value |
|---|---|
| Stack Name | `mws-daily-checkin` |
| Source | **Manual** (not linked_repo) |
| Registry | GHCR (`ghcr.io/mws-mad-labs`) |
| Webhook Secret | Set via Komodo → Stack → Webhook |

---

## Docker Compose (paste into Komodo → Stack → Compose)

```yaml
services:
  backend:
    image: ghcr.io/mws-mad-labs/mws-daily-checkin-be:staging
    container_name: mws-daily-checkin-be
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      MONGODB_URI: ${MONGODB_URI}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      SESSION_SECRET: ${SESSION_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GOOGLE_REDIRECT_URL: ${GOOGLE_REDIRECT_URL}
      GOOGLE_AI_API_KEY: ${GOOGLE_AI_API_KEY}
      GOOGLE_AI_MODEL: gemini-flash-latest
      AI_ANALYSIS_ENABLED: "true"
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
      CORS_ORIGINS: ${CORS_ORIGINS}
      SLACK_BOT_TOKEN: ${SLACK_BOT_TOKEN}
      SLACK_APP_TOKEN: ${SLACK_APP_TOKEN}
      SLACK_SIGNING_SECRET: ${SLACK_SIGNING_SECRET}
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: "587"
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      SMTP_FROM: ${SMTP_FROM}
      RATE_LIMIT_WINDOW: "15"
      RATE_LIMIT_MAX_REQUESTS: "600"
    networks:
      - daily-checkin-net
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:3001/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s

  frontend:
    image: ghcr.io/mws-mad-labs/mws-daily-checkin-fe:staging
    container_name: mws-daily-checkin-fe
    restart: unless-stopped
    ports:
      - "8081:80"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - daily-checkin-net

networks:
  daily-checkin-net:
    name: mws-daily-checkin-net
    driver: bridge
```

---

## GitHub Secrets to set in the repo

In GitHub → `MWS-MAD-Labs/mws-daily-checkin` → Settings → Secrets → Actions:

| Secret Name | Value |
|---|---|
| `KOMODO_WEBHOOK_SECRET` | Same as the webhook secret on the Komodo stack |
| `KOMODO_WEBHOOK_URL` | The Komodo webhook URL for the `mws-daily-checkin` stack |

---

## Environment Variables di Komodo

Di Komodo → Stack `mws-daily-checkin` → Environment:

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
SESSION_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=https://checkin-stg.mws.web.id/auth/google/callback
GOOGLE_AI_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=https://checkin-stg.mws.web.id
CORS_ORIGINS=https://checkin-stg.mws.web.id
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...
SMTP_USER=no-reply@millennia21.id
SMTP_PASS=...
SMTP_FROM=no-reply@millennia21.id
```

---

## Deploy Flow

```
Push to main
  → GH Actions: test-be + test-fe (parallel)
  → GH Actions: build-be + build-fe (parallel, after tests)
  → GH Actions: deploy (trigger Komodo webhook)
  → Komodo: docker compose pull → docker compose up -d
  → Service accessible at: http://103.164.111.186:8081
```

## Domain Setup (Cloudflare)

Add DNS record:
- Type: A
- Name: `checkin-stg`
- Value: `103.164.111.186`
- Proxy: ON (orange cloud)
- SSL: Full (strict)

Akses: `https://checkin-stg.mws.web.id`
