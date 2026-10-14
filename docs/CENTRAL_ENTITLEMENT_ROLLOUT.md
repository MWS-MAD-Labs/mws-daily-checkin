> **Update (shared session).** Daily Check-in no longer has its own sign-in, sign-out or session. It reads the Hub's
> shared session (an access token in a cookie on the parent domain, see the Hub README) and asks Central what the person
> may do here. The settings that belonged to the old relay flow (`HUB_INTERNAL_SECRET`, `HUB_SSO_PUBLIC_KEY`,
> `HUB_STATE_COOKIE_PATH`, `HUB_REPLAY_STORE`, `HUB_SSO_JWKS_URL`) are not used any more; `HUB_BASE_URL`,
> `CENTRAL_ORGANIZATION_ID` and the Central API settings are. The entitlement rules below still apply.

# Central Entitlement Rollout

Daily Check-in is a single-tenant, Hub-only application. Hub relay tokens must contain a signed `entitlement` object with `id`, `application_id`, `organization_id`, `role`, `permissions`, and `version`. The application id must be `daily-checkin`; the organization must equal `CENTRAL_ORGANIZATION_ID` (the older `CENTRAL_ENTITLEMENT_ORGANIZATION_ID` is still read).

## Dependency Compatibility

`mws-central-auth` v0.6.0 was requested but the `v0.6.0` Git tag is not published. Both packages remain pinned to the reproducible `v0.5.3` Git tag. The local compatibility layer validates the entitlement contract with Zod after the package verifies the signature and standard relay claims. The local exchange client sends `state` to Hub because v0.5.3 does not export `HubExchangeClient`.

## Backfill Input

Set `CENTRAL_ENTITLEMENT_BACKFILL_FILE` to a protected JSON file:

```json
[
  {
    "central_person_id": "person-id",
    "source": "employee",
    "entitlement": {
      "id": "entitlement-id",
      "application_id": "daily-checkin",
      "organization_id": "organization-id",
      "role": "staff",
      "permissions": ["checkin.self.read", "checkin.self.submit"],
      "version": 1
    }
  }
]
```

Run `npm run backfill:entitlements:dry` first. Resolve every missing person and validation error, then run `npm run backfill:entitlements`. Re-running either command is idempotent. Changed projections increment `sessionVersion` so old sessions cannot retain stale authorization.

## Deployment Order

1. Startup calls `HubRelayReplay.createIndexes()` before the HTTP listener opens. A missing/invalid unique `jti` or TTL `expiresAt` index fails initialization and the process refuses traffic.
2. Configure `HUB_BASE_URL`, `HUB_INTERNAL_SECRET`, a Hub public key or working JWKS URL, `CENTRAL_ORGANIZATION_ID` (the older `CENTRAL_ENTITLEMENT_ORGANIZATION_ID` is still read), and `HUB_REPLAY_STORE=mongo`.
3. Export entitlement records from Central/Hub and complete the dry-run and apply backfill.
4. Deploy this application. All Hub logins are immediately strict: invalid app, organization, permission vocabulary, stale entitlement version, missing projection, replay-store failure, or state mismatch fails closed.
5. Verify employee and student launches, `/auth/me`, permission-denied routes, logout, and replay rejection.
6. Enable the Hub application gate only after the backfill and application verification are complete.

Local password hashes are intentionally retained for a later destructive cleanup, but `POST /auth/login` now returns HTTP 410.
