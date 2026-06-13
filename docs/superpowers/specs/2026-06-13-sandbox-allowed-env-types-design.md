# Sandbox: Allowed Environment Types Config

**Date:** 2026-06-13  
**Branch:** feat/sandbox  
**Status:** Approved

## Problem

Flexprice is introducing a sandbox deployment at `sandbox.flexprice.io` (API: `sandbox.api.flexprice.io`). The sandbox deployment should only surface `development`-type environments in the environment switcher — production environments must not appear there. The production deployment continues to show all environment types.

## Solution

A new build-time env var `VITE_ALLOWED_ENV_TYPES` declares which `ENVIRONMENT_TYPE` values are visible in the UI. If unset or empty, all types are shown (fully backwards-compatible). The filter is applied once in `useEnvironment` so every consumer automatically sees the filtered list.

## Config

**`VITE_ALLOWED_ENV_TYPES`** — comma-separated list of `ENVIRONMENT_TYPE` values.

| Deployment | Value |
|------------|-------|
| Sandbox (`sandbox.flexprice.io`) | `development` |
| Production | `` (empty — show all) |

Parsing: split on `,`, trim whitespace, cast to `ENVIRONMENT_TYPE[]`. Invalid values are silently dropped.

## Changes

### `src/config/config.ts`

- Add `allowedEnvTypes: ENVIRONMENT_TYPE[]` to `RestrictionsConfig`.
- Add `parseAllowedEnvTypes()` that reads `VITE_ALLOWED_ENV_TYPES`. Returns `[]` (allow all) when the var is absent or empty.
- Wire into `config.restrictions.allowedEnvTypes`.

### `src/hooks/useEnvironment.ts`

- After fetching environments from the API, apply the filter:
  ```ts
  const allowed = config.restrictions.allowedEnvTypes;
  const visible = allowed.length === 0
    ? data
    : data.filter(env => allowed.includes(env.type));
  ```
- The `activeEnvId` fallback (auto-select first env on load / when stored id is invalid) runs against `visible`, not the raw list — prevents a sandbox deployment from ever activating a prod environment.
- All return values (`environments`, `activeEnvironment`, `isDevelopment`, `isProduction`) are derived from the filtered set.

### `.env.example`

Add the new variable with a comment:
```bash
# Allowed environment types (comma-separated: development,production)
# Empty = all types shown. Sandbox deployments set this to "development".
VITE_ALLOWED_ENV_TYPES=
```

## Out of Scope

- `EnvironmentCopier` — intentionally unchanged; it continues to show all environment types regardless of the allowed-types config.
- API URL routing — `VITE_API_URL` is set per-deployment in infrastructure config, not managed here.
- Backend enforcement — the backend validates that sandbox API calls don't hit prod environments; that is a backend concern.

## Backwards Compatibility

`VITE_ALLOWED_ENV_TYPES` defaults to empty → all environments shown → zero behaviour change for existing deployments.
