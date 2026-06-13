# Sandbox UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sandbox mode UX (badge, production link, creator restriction) that activates automatically when `VITE_ALLOWED_ENV_TYPES=["development"]` and is completely invisible to all existing deployments.

**Architecture:** A pure `isSandboxDeployment()` helper derives a boolean from the already-parsed `allowedEnvTypes` array; this boolean + `productionUrl` are stored in `config.restrictions` and consumed directly by the two UI components that need them. No new context, no new hooks.

**Tech Stack:** React 18, TypeScript, Vite (`import.meta.env`), Tailwind CSS, Radix UI Select, Vitest

---

## File Map

| File | Change |
|------|--------|
| `src/config/config.ts` | Add `isSandboxDeployment()` helper, extend `RestrictionsConfig`, wire into `config.restrictions` |
| `src/config/config.allowedEnvTypes.test.ts` | Add `isSandboxDeployment` tests |
| `src/components/molecules/EnvironmentSelector/EnvironmentSelector.tsx` | Sandbox badge + "Go to Production" link |
| `src/components/molecules/EnvironmentCreator/EnvironmentCreator.tsx` | Filter type options to `allowedEnvTypes` in sandbox mode |
| `.env.example` | Document `VITE_PRODUCTION_URL` |

---

## Task 1: `isSandboxDeployment` helper + config fields

**Files:**
- Modify: `src/config/config.ts`
- Modify: `src/config/config.allowedEnvTypes.test.ts`

### Step 1 — Add tests for `isSandboxDeployment`

Add a new `describe` block at the bottom of `src/config/config.allowedEnvTypes.test.ts`. Update the import line to also import `isSandboxDeployment`:

```ts
import { describe, it, expect } from 'vitest';
import { parseAllowedEnvTypes, isSandboxDeployment } from './config';
import { ENVIRONMENT_TYPE } from '@/models/Environment';
```

Append this block after the existing `parseAllowedEnvTypes` describe:

```ts
describe('isSandboxDeployment', () => {
	it('returns false for empty array', () => {
		expect(isSandboxDeployment([])).toBe(false);
	});

	it('returns true when only development', () => {
		expect(isSandboxDeployment([ENVIRONMENT_TYPE.DEVELOPMENT])).toBe(true);
	});

	it('returns false when both types present', () => {
		expect(isSandboxDeployment([ENVIRONMENT_TYPE.DEVELOPMENT, ENVIRONMENT_TYPE.PRODUCTION])).toBe(false);
	});

	it('returns false when only production', () => {
		expect(isSandboxDeployment([ENVIRONMENT_TYPE.PRODUCTION])).toBe(false);
	});
});
```

- [ ] **Step 2: Run tests — expect FAIL** (function not exported yet)

```bash
cd /Users/omkar/Developer/source-code/flexprice/flexprice-front && npx vitest run src/config/config.allowedEnvTypes.test.ts 2>&1 | tail -10
```

Expected: import error — `isSandboxDeployment` is not exported from `./config`.

- [ ] **Step 3: Add `isSandboxDeployment` to `src/config/config.ts`**

Add the exported helper immediately after the `parseAllowedEnvTypes` function (before `export const config`):

```ts
export function isSandboxDeployment(allowedEnvTypes: ENVIRONMENT_TYPE[]): boolean {
	return allowedEnvTypes.length > 0 && allowedEnvTypes.every((t) => t === ENVIRONMENT_TYPE.DEVELOPMENT);
}
```

- [ ] **Step 4: Extend `RestrictionsConfig` interface**

Find the `RestrictionsConfig` interface (currently has `rawEnvs` and `allowedEnvTypes`) and add the two new fields:

```ts
interface RestrictionsConfig {
	rawEnvs: string;
	allowedEnvTypes: ENVIRONMENT_TYPE[]; // [] means "show all"
	isSandboxMode: boolean; // true only when allowedEnvTypes === ["development"]
	productionUrl: string; // from VITE_PRODUCTION_URL; '' when unset
}
```

- [ ] **Step 5: Extract `allowedEnvTypes` const and wire into `config.restrictions`**

The current `restrictions` block in `export const config` calls `parseAllowedEnvTypes` inline. Extract it to a module-level const (like `appEnv` above) so it can be reused without calling the function twice, then add the two new fields:

Replace the current `restrictions` block:
```ts
// Before the export const config block, add:
const allowedEnvTypes = parseAllowedEnvTypes(import.meta.env.VITE_ALLOWED_ENV_TYPES);
```

Update the `restrictions` field in `export const config`:
```ts
restrictions: {
	rawEnvs: import.meta.env.VITE_RESTRICTED_ENVS ?? '',
	allowedEnvTypes,
	isSandboxMode: isSandboxDeployment(allowedEnvTypes),
	productionUrl: import.meta.env.VITE_PRODUCTION_URL ?? '',
},
```

- [ ] **Step 6: Run tests — expect all pass**

```bash
cd /Users/omkar/Developer/source-code/flexprice/flexprice-front && npx vitest run src/config/config.allowedEnvTypes.test.ts 2>&1 | tail -10
```

Expected: 13 tests pass (9 existing + 4 new).

- [ ] **Step 7: Verify TypeScript**

```bash
cd /Users/omkar/Developer/source-code/flexprice/flexprice-front && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/omkar/Developer/source-code/flexprice/flexprice-front && git add src/config/config.ts src/config/config.allowedEnvTypes.test.ts && git commit -m "feat(config): add isSandboxDeployment helper and isSandboxMode/productionUrl to config"
```

---

## Task 2: Sandbox badge + "Go to Production" link in `EnvironmentSelector`

**Files:**
- Modify: `src/components/molecules/EnvironmentSelector/EnvironmentSelector.tsx`

The component already imports `config` indirectly via `useEnvironment`. Add a direct import and read `isSandboxMode` and `productionUrl` from it. Then add two conditional renders — no structural changes to existing JSX.

- [ ] **Step 1: Add `config` import**

At the top of `src/components/molecules/EnvironmentSelector/EnvironmentSelector.tsx`, add after the existing imports:

```ts
import { config } from '@/config/config';
```

- [ ] **Step 2: Read sandbox config at top of component**

Inside `EnvironmentSelector` (after the existing `const { environments, ... } = useEnvironment()` line), add:

```ts
const { isSandboxMode, productionUrl } = config.restrictions;
```

- [ ] **Step 3: Add the sandbox badge**

The badge goes between the closing `</div>` of the tenant row and the opening `<Select>` tag. The current JSX structure is:

```tsx
{/* Tenant */}
<div className='w-full mt-2 flex items-center justify-between gap-2'>
  ...
</div>

{/* Environment picker (colored box) */}
<Select ...>
```

Insert the badge between them:

```tsx
{/* Sandbox mode badge */}
{isSandboxMode && sidebarOpen && (
  <div className='mt-2 flex items-center gap-1.5 px-1'>
    <span className='h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0' />
    <span className='text-[11px] font-semibold uppercase tracking-widest text-amber-700'>Sandbox</span>
  </div>
)}
```

`sidebarOpen` is already destructured from `useSidebar()` at the top of the component — hide the badge when the sidebar is collapsed (icon-only mode) to avoid layout overflow.

- [ ] **Step 4: Add the "Go to Production" link**

Inside `SelectContent`, after the closing `</div>` of the Add/Copy buttons block (the `<div className='flex flex-col gap-1.5 m-2 ...'>` block), add:

```tsx
{isSandboxMode && productionUrl && (
  <a
    href={productionUrl}
    className='flex items-center justify-center gap-1.5 mx-2 mb-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 border-t border-border pt-2'
  >
    <ExternalLink className='h-3 w-3' />
    Go to Production
  </a>
)}
```

Add `ExternalLink` to the existing lucide-react import line:

```ts
import { Blocks, Rocket, Server, ChevronsUpDown, Plus, Copy, Pencil, ExternalLink } from 'lucide-react';
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd /Users/omkar/Developer/source-code/flexprice/flexprice-front && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/omkar/Developer/source-code/flexprice/flexprice-front && git add src/components/molecules/EnvironmentSelector/EnvironmentSelector.tsx && git commit -m "feat(sandbox): add sandbox badge and production link to EnvironmentSelector"
```

---

## Task 3: Filter `EnvironmentCreator` type options in sandbox mode

**Files:**
- Modify: `src/components/molecules/EnvironmentCreator/EnvironmentCreator.tsx`

When `isSandboxMode` is true, filter the type options to only those in `allowedEnvTypes`. If only one type remains, hide the `<Select>` entirely (the type state already defaults to `ENVIRONMENT_TYPE.DEVELOPMENT` which is correct for sandbox).

- [ ] **Step 1: Add `config` import**

Add after existing imports in `src/components/molecules/EnvironmentCreator/EnvironmentCreator.tsx`:

```ts
import { config } from '@/config/config';
```

- [ ] **Step 2: Read sandbox config at top of component**

Inside `EnvironmentCreator`, after the `const queryClient = useQueryClient();` line, add:

```ts
const { isSandboxMode, allowedEnvTypes } = config.restrictions;
```

- [ ] **Step 3: Update `environmentTypeOptions` useMemo to filter by `allowedEnvTypes`**

The current `useMemo` always returns both options. Replace it with a version that filters when `isSandboxMode`:

```ts
const environmentTypeOptions = useMemo(() => {
	const allOptions = [
		{
			value: ENVIRONMENT_TYPE.DEVELOPMENT,
			label: t('environment.types.sandbox'),
			description: t('environment.types.sandboxDescription'),
		},
		{
			value: ENVIRONMENT_TYPE.PRODUCTION,
			label: t('environment.types.production'),
			description: t('environment.types.productionDescription'),
		},
	];
	if (!isSandboxMode || allowedEnvTypes.length === 0) return allOptions;
	return allOptions.filter((opt) => allowedEnvTypes.includes(opt.value as ENVIRONMENT_TYPE));
}, [isSandboxMode, allowedEnvTypes, t]);
```

- [ ] **Step 4: Hide type `<Select>` when only one option**

Find the `<Select>` for the environment type (the one with `label={t('environment.creator.typeLabel')}`). Wrap it in a conditional so it only renders when there are multiple choices:

```tsx
{environmentTypeOptions.length > 1 && (
  <Select
    label={t('environment.creator.typeLabel')}
    placeholder={t('environment.creator.typePlaceholder')}
    options={environmentTypeOptions}
    value={type}
    onChange={(value) => setType(value as ENVIRONMENT_TYPE)}
    disabled={isPending}
  />
)}
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd /Users/omkar/Developer/source-code/flexprice/flexprice-front && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/omkar/Developer/source-code/flexprice/flexprice-front && git add src/components/molecules/EnvironmentCreator/EnvironmentCreator.tsx && git commit -m "feat(sandbox): restrict EnvironmentCreator type options to allowedEnvTypes in sandbox mode"
```

---

## Task 4: Document `VITE_PRODUCTION_URL` in `.env.example`

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add the new variable**

Open `.env.example` and find the `VITE_ALLOWED_ENV_TYPES=` block. Add the following immediately after it:

```bash
# Production dashboard URL shown as "Go to Production" link when in sandbox mode.
# Only rendered when VITE_ALLOWED_ENV_TYPES=["development"] (sandbox mode active).
# Example: VITE_PRODUCTION_URL=https://app.flexprice.io
VITE_PRODUCTION_URL=
```

- [ ] **Step 2: Commit**

```bash
cd /Users/omkar/Developer/source-code/flexprice/flexprice-front && git add .env.example && git commit -m "chore(env): document VITE_PRODUCTION_URL"
```

---

## Verification

- [ ] **Run full test suite**

```bash
cd /Users/omkar/Developer/source-code/flexprice/flexprice-front && npx vitest run 2>&1 | tail -8
```

Expected: 13 tests pass in `config.allowedEnvTypes.test.ts`; no new failures introduced.

- [ ] **Manual: sandbox mode on**

In your local `.env`, set:
```
VITE_ALLOWED_ENV_TYPES=["development"]
VITE_PRODUCTION_URL=https://app.flexprice.io
```

Restart dev server (`npm run dev`). Open sidebar — amber "Sandbox" dot + label should appear below the tenant name. Open the env picker dropdown — "Go to Production" link should appear at the bottom. Open "Add Environment" — the type selector should be hidden (development is the only option, silently selected).

- [ ] **Manual: sandbox mode off (backwards compat)**

Set `VITE_ALLOWED_ENV_TYPES=` (empty). Restart. No badge, no production link, type selector shows both options as before.
