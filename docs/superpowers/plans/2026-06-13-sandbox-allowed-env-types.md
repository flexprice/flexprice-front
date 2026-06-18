# Sandbox: Allowed Environment Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `VITE_ALLOWED_ENV_TYPES` config that filters which environment types appear in the sidebar environment switcher, so the sandbox deployment (`sandbox.flexprice.io`) can be configured to only show `development` environments.

**Architecture:** A pure `parseAllowedEnvTypes()` function reads the env var and returns a typed array; this gets wired into `config.restrictions.allowedEnvTypes`. The `useEnvironment` hook applies the filter after fetching from the API. Empty = show all (backwards compatible).

**Tech Stack:** React 18, TypeScript, Vite (`import.meta.env`), TanStack Query, Vitest

---

## File Map

| File | Change |
|------|--------|
| `src/config/config.ts` | Add `allowedEnvTypes` to `RestrictionsConfig`, add + export `parseAllowedEnvTypes()` |
| `src/config/config.allowedEnvTypes.test.ts` | New — unit tests for `parseAllowedEnvTypes()` |
| `src/hooks/useEnvironment.ts` | Filter fetched environments by `config.restrictions.allowedEnvTypes` |
| `.env.example` | Add `VITE_ALLOWED_ENV_TYPES=` with comment |

---

## Task 1: Add `parseAllowedEnvTypes` to config

**Files:**
- Modify: `src/config/config.ts`

The `ENVIRONMENT_TYPE` enum lives in `src/models/Environment.ts` and is already imported via the `useEnvironment` hook. Import it in config.ts too, then add the interface field and parser.

- [ ] **Step 1: Update `RestrictionsConfig` interface**

In `src/config/config.ts`, find the `RestrictionsConfig` interface (currently has one field `rawEnvs: string`) and add the new field. Also add the import for `ENVIRONMENT_TYPE` at the top of the file:

```ts
// Add this import near the top of config.ts (after existing imports)
import { ENVIRONMENT_TYPE } from '@/models/Environment';
```

Update the interface:

```ts
interface RestrictionsConfig {
  rawEnvs: string;
  allowedEnvTypes: ENVIRONMENT_TYPE[];  // [] means "show all"
}
```

- [ ] **Step 2: Add `parseAllowedEnvTypes` function**

Add this function in `src/config/config.ts`, right before the `export const config` block. Export it so it can be unit-tested:

```ts
export function parseAllowedEnvTypes(raw?: string): ENVIRONMENT_TYPE[] {
  if (!raw?.trim()) return [];
  const valid = new Set(Object.values(ENVIRONMENT_TYPE));
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => valid.has(s as ENVIRONMENT_TYPE)) as ENVIRONMENT_TYPE[];
}
```

- [ ] **Step 3: Wire into `config.restrictions`**

In the `export const config` block, update the `restrictions` field:

```ts
restrictions: {
  rawEnvs: import.meta.env.VITE_RESTRICTED_ENVS ?? '',
  allowedEnvTypes: parseAllowedEnvTypes(import.meta.env.VITE_ALLOWED_ENV_TYPES),
},
```

---

## Task 2: Unit tests for `parseAllowedEnvTypes`

**Files:**
- Create: `src/config/config.allowedEnvTypes.test.ts`

- [ ] **Step 1: Write the tests**

Create `src/config/config.allowedEnvTypes.test.ts` with this content:

```ts
import { describe, it, expect } from 'vitest';
import { parseAllowedEnvTypes } from './config';
import { ENVIRONMENT_TYPE } from '@/models/Environment';

describe('parseAllowedEnvTypes', () => {
  it('returns [] when raw is undefined', () => {
    expect(parseAllowedEnvTypes(undefined)).toEqual([]);
  });

  it('returns [] when raw is empty string', () => {
    expect(parseAllowedEnvTypes('')).toEqual([]);
  });

  it('returns [] when raw is only whitespace', () => {
    expect(parseAllowedEnvTypes('   ')).toEqual([]);
  });

  it('parses a single valid type', () => {
    expect(parseAllowedEnvTypes('development')).toEqual([ENVIRONMENT_TYPE.DEVELOPMENT]);
  });

  it('parses two valid types', () => {
    const result = parseAllowedEnvTypes('development,production');
    expect(result).toContain(ENVIRONMENT_TYPE.DEVELOPMENT);
    expect(result).toContain(ENVIRONMENT_TYPE.PRODUCTION);
    expect(result).toHaveLength(2);
  });

  it('trims whitespace around values', () => {
    expect(parseAllowedEnvTypes(' development , production ')).toHaveLength(2);
  });

  it('silently drops unknown values', () => {
    expect(parseAllowedEnvTypes('development,sandbox,unknown')).toEqual([ENVIRONMENT_TYPE.DEVELOPMENT]);
  });

  it('returns [] when all values are unknown', () => {
    expect(parseAllowedEnvTypes('sandbox,bogus')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (function not yet exported or not yet written if doing TDD order)**

```bash
npx vitest run src/config/config.allowedEnvTypes.test.ts
```

If Task 1 is already done, they should PASS. If not, expect import errors.

- [ ] **Step 3: Run tests — expect PASS**

After Task 1 is complete:

```bash
npx vitest run src/config/config.allowedEnvTypes.test.ts
```

Expected output: all 8 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/config/config.ts src/config/config.allowedEnvTypes.test.ts
git commit -m "feat(config): add parseAllowedEnvTypes and VITE_ALLOWED_ENV_TYPES support"
```

---

## Task 3: Filter environments in `useEnvironment`

**Files:**
- Modify: `src/hooks/useEnvironment.ts`

The hook currently returns all environments from the API. We filter by `config.restrictions.allowedEnvTypes` before deriving any state from the list. The active-env fallback (auto-select first) must also use the filtered list.

- [ ] **Step 1: Add config import**

At the top of `src/hooks/useEnvironment.ts`, add:

```ts
import { config } from '@/config/config';
```

(The `ENVIRONMENT_TYPE` import is already present via `import Environment, { ENVIRONMENT_TYPE } from '@/models/Environment';`)

- [ ] **Step 2: Apply filter after fetching**

In the `useQuery` block, the query function currently returns `res.environments`. Change the `queryFn` to filter before returning:

```ts
queryFn: async () => {
  const res = await EnvironmentApi.getAllEnvironments();
  const allowed = config.restrictions.allowedEnvTypes;
  if (allowed.length === 0) return res.environments;
  return res.environments.filter((env) => allowed.includes(env.type));
},
```

This means `data` throughout the hook already contains only visible environments, so the `activeEnvId` fallback (`data[0].id`) and all derived values automatically use the filtered set. No other changes needed in the hook.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useEnvironment.ts
git commit -m "feat(environments): filter by allowedEnvTypes config"
```

---

## Task 4: Update `.env.example`

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add the new variable**

Open `.env.example` and add after the `VITE_RESTRICTED_ENVS` line:

```bash
# Allowed environment types shown in the sidebar switcher (comma-separated: development,production)
# Empty = all types shown. Sandbox deployments set this to "development".
VITE_ALLOWED_ENV_TYPES=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore(env): document VITE_ALLOWED_ENV_TYPES"
```

---

## Verification

- [ ] **Manual: prod-like (no filter)**

  Set `VITE_ALLOWED_ENV_TYPES=` in your local `.env`. Start dev server (`npm run dev`). Open the sidebar environment switcher — both development and production environments should appear.

- [ ] **Manual: sandbox mode**

  Set `VITE_ALLOWED_ENV_TYPES=development` in your local `.env`. Restart dev server. Open the switcher — only `development`-type environments should appear. If your account only has production environments, the switcher should be empty (or show the "none available" message).

- [ ] **Run full test suite**

  ```bash
  npx vitest run
  ```

  Expected: all existing tests pass plus the 8 new `parseAllowedEnvTypes` tests.
