# Sandbox UX Features Design

**Date:** 2026-06-13
**Branch:** feat/sandbox
**Status:** Approved

## Problem

`sandbox.flexprice.io` users have no visual signal they are in sandbox mode, can accidentally try to create production environments, and have no one-click path back to production. All UX changes must be zero-impact for existing prod deployments.

## Activation

Sandbox UX is **derived automatically** from `VITE_ALLOWED_ENV_TYPES`. No extra flag needed.

```
isSandboxMode = allowedEnvTypes.length > 0
             && allowedEnvTypes.every(t => t === ENVIRONMENT_TYPE.DEVELOPMENT)
```

| `VITE_ALLOWED_ENV_TYPES` | `isSandboxMode` | Effect |
|---|---|---|
| *(empty / unset)* | `false` | no change — existing behaviour |
| `["development","production"]` | `false` | no change |
| `["production"]` | `false` | no change |
| `["development"]` | `true` | sandbox UX active |

Existing deployments that do not set `VITE_ALLOWED_ENV_TYPES` are completely unaffected.

## Config Changes — `src/config/config.ts`

Add two fields to `RestrictionsConfig`:

```ts
interface RestrictionsConfig {
  rawEnvs: string;
  allowedEnvTypes: ENVIRONMENT_TYPE[];
  isSandboxMode: boolean;   // derived — true only when allowedEnvTypes === ["development"]
  productionUrl: string;    // from VITE_PRODUCTION_URL; empty string when unset
}
```

Wire in `config.restrictions`:
```ts
restrictions: {
  rawEnvs: ...,
  allowedEnvTypes: parseAllowedEnvTypes(import.meta.env.VITE_ALLOWED_ENV_TYPES),
  isSandboxMode: isSandboxDeployment(parseAllowedEnvTypes(import.meta.env.VITE_ALLOWED_ENV_TYPES)),
  productionUrl: import.meta.env.VITE_PRODUCTION_URL ?? '',
},
```

Add pure helper (export for testing):
```ts
export function isSandboxDeployment(allowedEnvTypes: ENVIRONMENT_TYPE[]): boolean {
  return allowedEnvTypes.length > 0 &&
    allowedEnvTypes.every((t) => t === ENVIRONMENT_TYPE.DEVELOPMENT);
}
```

## Feature 1 — Sandbox Badge (`EnvironmentSelector`)

When `config.restrictions.isSandboxMode` is `true`, render an amber chip between the tenant row and the env picker inside `EnvironmentSelector`. When `false`, render nothing (no DOM node).

Placement (within existing component layout):
```
[FP] Flexprice          ← existing tenant row
● SANDBOX               ← new amber chip, isSandboxMode only
[⬡ My Dev Env    ⌄]   ← existing env picker
```

Chip style: small amber pill consistent with the existing dev-environment yellow palette (`text-amber-700 bg-amber-50 border-amber-300`).

## Feature 2 — "Go to Production" Link (`EnvironmentSelector`)

When `isSandboxMode === true` AND `config.restrictions.productionUrl` is non-empty, render a subtle "Go to Production →" anchor at the bottom of the env picker `SelectContent` dropdown (below the existing Add / Copy buttons).

Clicking navigates to `productionUrl` in the **same tab** (`window.location.href = productionUrl`) — it is a domain switch, not a supplementary page.

If either condition is false, the link does not render. No broken or loading state needed.

## Feature 3 — `EnvironmentCreator` Type Selector Filtered

When `isSandboxMode === true`, filter `environmentTypeOptions` to only include types present in `config.restrictions.allowedEnvTypes`. If only one type remains after filtering, hide the type `<Select>` entirely and keep the internal state defaulted to that single type.

When `isSandboxMode === false`: no change — full type list as today.

## `.env.example`

Add after `VITE_ALLOWED_ENV_TYPES`:
```bash
# Production dashboard URL shown as "Go to Production" link in sandbox mode.
# Only used when VITE_ALLOWED_ENV_TYPES=["development"] (sandbox mode active).
VITE_PRODUCTION_URL=
```

## Out of Scope

- `EnvironmentCopier` — intentionally unchanged (shows all types regardless of mode)
- Page `<title>` prefix — left for a future iteration
- Analytics isolation — already handled by `config.app.isProd` in `MainLayout`
- Any routing or API changes

## Backwards Compatibility

All three features are guarded by `isSandboxMode`, which is `false` whenever `VITE_ALLOWED_ENV_TYPES` is absent or contains more than just `["development"]`. Existing prod deployments see zero change.
