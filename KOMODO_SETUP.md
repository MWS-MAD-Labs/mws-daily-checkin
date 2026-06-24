# Komodo Stack Setup - mws-daily-checkin

Daily Check-in is served at the root path of the unified MWS app.

| Environment | Branch | Image tag | Public URL | Komodo stack |
|---|---|---|---|---|
| Staging | `staging` | `staging` | `https://app-stg.mws.web.id` | `mws-daily-checkin` |
| Production | `main` | `production` | `https://app.millenniaws.sch.id` | `mws-daily-checkin-production` |

The stack is manual compose in Komodo. Komodo does not build images; GitHub
Actions builds BE/FE images, pushes them to GHCR, then calls the stack webhook.

## Staging Stack

Use the existing staging stack if it already exists:

| Field | Value |
|---|---|
| Stack name | `mws-daily-checkin` |
| Source | Manual compose |
| Branch that triggers it | `staging` |
| Images | `ghcr.io/mws-mad-labs/mws-daily-checkin-{be,fe}:staging` |
| Gateway network | `mws-unified` |
| Gateway hostname | `https://app-stg.mws.web.id` |

Compose reference is also available in the gateway repo:
`mws-gateway/deploy/daily-checkin.compose.yml`.

Required GitHub Actions secrets:

| Secret name | Notes |
|---|---|
| `KOMODO_STAGING_WEBHOOK_URL` | Preferred staging webhook URL |
| `KOMODO_STAGING_WEBHOOK_SECRET` | Preferred staging webhook secret |
| `KOMODO_WEBHOOK_URL` | Legacy fallback, currently supported |
| `KOMODO_WEBHOOK_SECRET` | Legacy fallback, currently supported |

## Production Stack

Production/main is deployed from a dedicated Komodo stack:

| Field | Value |
|---|---|
| Stack name | `mws-daily-checkin-production` |
| Komodo stack id | `6a3b865d1309552867cc4200` |
| Source | Git repo |
| Repo | `MWS-MAD-Labs/mws-daily-checkin` |
| Branch | `main` |
| Run directory | `deploy` |
| Compose file | `production.compose.yml` |
| Images | `ghcr.io/mws-mad-labs/mws-daily-checkin-{be,fe}:production` |
| Gateway network | `mws-unified-prod` |
| Gateway hostname | `https://app.millenniaws.sch.id` |
| Webhook URL | `https://komo.mws.web.id/listener/github/stack/mws-daily-checkin-production/deploy` |

Deploy the production gateway first so the external Docker network
`mws-unified-prod` exists.

Required GitHub Actions secrets:

| Secret name | Notes |
|---|---|
| `KOMODO_PRODUCTION_WEBHOOK_URL` | Optional override for the production stack webhook URL |
| `KOMODO_PRODUCTION_WEBHOOK_SECRET` | Preferred production stack webhook secret |
| `KOMODO_STAGING_WEBHOOK_SECRET` / `KOMODO_WEBHOOK_SECRET` | Supported fallback when the production stack uses the existing webhook secret |

## Environment Variables

Set these in the Komodo stack Environment field. Keep secrets out of the repo.

### Staging

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
SESSION_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=https://app-stg.mws.web.id/auth/google/callback
GOOGLE_AI_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=https://app-stg.mws.web.id
CORS_ORIGINS=https://app-stg.mws.web.id
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...
SMTP_USER=no-reply@millennia21.id
SMTP_PASS=...
SMTP_FROM=no-reply@millennia21.id
```

### Production

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
SESSION_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=https://app.millenniaws.sch.id/auth/google/callback
GOOGLE_AI_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=https://app.millenniaws.sch.id
CORS_ORIGINS=https://app.millenniaws.sch.id
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...
SMTP_USER=no-reply@millennia21.id
SMTP_PASS=...
SMTP_FROM=no-reply@millennia21.id
```

## Deploy Flow

```text
Push to staging
  -> GitHub Actions: staging quality gates
  -> Build BE/FE images tagged :staging
  -> Trigger Komodo stack mws-daily-checkin
  -> Gateway serves https://app-stg.mws.web.id/

Push to main
  -> GitHub Actions: production quality gates
  -> Build BE/FE images tagged :production
  -> Trigger Komodo stack mws-daily-checkin-production
  -> Gateway serves https://app.millenniaws.sch.id/
```
