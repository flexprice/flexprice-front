# Pylon Support Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Pylon as a second support-chat provider alongside Intercom, with identical UI and behaviour, selectable per-environment, without breaking any existing import, config key, or event name.

**Architecture:** A provider-agnostic React hook (`useSupportChat`) owns all shared behaviour — the Help button, command-palette action, 15-minute inactivity auto-open, tenant onboarding mark-complete on close, gtag events, and localStorage flag. Two thin adapters behind a single `SupportChatAdapter` interface absorb the provider differences: Intercom polls `isVisible` to synthesise open/close events, Pylon registers native `onShow`/`onHide` callbacks. Existing `src/config/intercom.ts` and `src/core/services/intercom/IntercomMessenger.tsx` become deprecated re-export shims so nothing downstream breaks.

**Tech Stack:** React 18, TypeScript, Vite, TanStack Query, Vitest + Testing Library, `@intercom/messenger-js-sdk` (npm), Pylon widget (injected script).

**Spec:** `docs/superpowers/specs/2026-08-18-pylon-support-chat-design.md`

---

## Read this before Task 1

**Project conventions you must follow** (from `AGENTS.md`):

- No `any`. No inline `style={}`. Tailwind classes only.
- Tests co-located as `*.test.ts` / `*.test.tsx` next to the source file.
- Run a single test file with `npx vitest run <path>`.
- Run the linter with `npx eslint src/`.
- Indentation is **tabs**, not spaces. Prettier runs on commit.

**Two things about this repo you will hit:**

1. **The `husky` pre-commit hook runs `npm run build`, which currently fails** on pre-existing TypeScript errors in `src/components/ui/calendar.tsx`, `DatePicker.tsx`, `DateRangePicker.tsx`, `DateTimePicker.tsx` and `SortDropdown.stories.tsx` (a `react-day-picker` version drift and a Storybook types issue). These are **not caused by this work**. Every commit in this plan therefore uses `--no-verify`. Do not attempt to fix those errors — they are out of scope.

2. **Config modules read `import.meta.env` at module load.** To test them, use the established pattern from `src/config/contact.test.ts`: `vi.resetModules()` in `beforeEach`, `vi.stubEnv(...)`, then `await import('./module')` **inside** the test.

**Two intentional deviations from the spec**, both recorded here so nobody thinks they are mistakes:

- **Enum file location.** The spec said `src/types/dom.ts` and `src/types/env.ts`. This repo already keeps standalone enum files in `src/types/enums/` (`Region.ts`, `StripeWebhookEvents.ts`, …), so they go in `src/types/enums/dom.ts` and `src/types/enums/env.ts` instead. Following the existing convention is required by `AGENTS.md`.
- **`gtag` open event now actually fires.** The current `IntercomMessenger.tsx` sets `isIntercomOpen.current = true` inside `openIntercom()` *before* the poll runs, so the poll's `isVisible && !isIntercomOpen` edge never triggers and `intercom_messenger_opened` is **never emitted for a user-initiated open**. In this implementation `open()` only calls `adapter.show()` and lets the adapter's `onShow` drive the handler, so the event fires as intended. This is a deliberate bug fix, covered by a test in Task 9. Nothing about the onboarding or close path changes.

---

## File Structure

**New — source**

| File | Responsibility |
|---|---|
| `src/models/SupportChat.ts` | Provider-agnostic domain enums only |
| `src/types/enums/dom.ts` | `UserActivityEvent`, `DocumentReadyState` |
| `src/types/enums/env.ts` | `EnvFlag` |
| `src/config/support-chat.ts` | Provider resolution, flow config, command label |
| `src/core/services/support-chat/SupportChatAdapter.ts` | Adapter interface + `SupportChatUser` |
| `src/core/services/support-chat/adapters/pylon.ts` | Script injection, `window.pylon`, native callbacks |
| `src/core/services/support-chat/adapters/intercom.ts` | npm SDK, polling visibility detection |
| `src/core/services/support-chat/adapters/index.ts` | `createSupportChatAdapter(provider, flow)` factory |
| `src/core/services/support-chat/useSupportChat.ts` | All shared behaviour |
| `src/core/services/support-chat/SupportChat.tsx` | Resolves provider, renders Help button |

**New — tests**

| File | Covers |
|---|---|
| `src/models/SupportChat.test.ts` | Enum values locked to pre-Pylon literals |
| `src/config/support-chat.test.ts` | Provider resolution, precedence, label |
| `src/config/intercom.test.ts` | Backward-compat shim |
| `src/core/services/support-chat/adapters/pylon.test.ts` | Script injection, settings, validation |
| `src/core/services/support-chat/adapters/intercom.test.ts` | Polling, postMessage mapping |
| `src/core/services/support-chat/adapters/conformance.test.ts` | Shared contract, both adapters |
| `src/core/services/support-chat/useSupportChat.test.tsx` | All shared behaviour, fake adapter |

**Modified** — `src/config/config.ts`, `src/models/Tenant.ts`, `.env.example`, `src/config/intercom.ts` (→ shim), `src/core/services/intercom/IntercomMessenger.tsx` (→ shim), `src/components/molecules/BreadCrumbs/BreadCrumbs.tsx`, `src/components/organisms/CommandPalette/CommandPalette.tsx`, `src/config/command-palette/commands.ts`, `src/core/actions/command-palette-actions.ts`.

**Untouched** — `src/core/services/intercom/index.css`, `src/config/command-palette/ids.ts`.

---

## Task 1: Domain enums

**Files:**
- Create: `src/models/SupportChat.ts`
- Create: `src/types/enums/dom.ts`
- Create: `src/types/enums/env.ts`
- Modify: `src/models/Tenant.ts`
- Test: `src/models/SupportChat.test.ts`

The test here is not ceremony. Every string in these enums is a value that already exists in production — a gtag event name, a localStorage key, a metadata value. If someone "tidies" one of them, analytics silently break and no other test catches it. This test is the lock.

- [ ] **Step 1: Write the failing test**

Create `src/models/SupportChat.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
	SupportChatAnalyticsEvent,
	SupportChatProvider,
	SupportChatStatus,
	SupportChatStorageKey,
	SupportChatStorageValue,
	SupportChatVisibility,
} from './SupportChat';
import { TenantMetadataFlag } from './Tenant';

describe('SupportChat enums', () => {
	it('locks the Intercom analytics event names to their pre-Pylon values', () => {
		expect(SupportChatAnalyticsEvent.IntercomOpened).toBe('intercom_messenger_opened');
		expect(SupportChatAnalyticsEvent.IntercomClosed).toBe('intercom_messenger_closed');
	});

	it('locks the Intercom storage key to its pre-Pylon value', () => {
		expect(SupportChatStorageKey.IntercomSeen).toBe('intercom_messenger_seen');
		expect(SupportChatStorageValue.Seen).toBe('true');
	});

	it('locks the tenant metadata truth value to its pre-Pylon value', () => {
		expect(TenantMetadataFlag.True).toBe('true');
	});

	it('namespaces the Pylon analytics events separately from Intercom', () => {
		expect(SupportChatAnalyticsEvent.PylonOpened).toBe('pylon_messenger_opened');
		expect(SupportChatAnalyticsEvent.PylonClosed).toBe('pylon_messenger_closed');
		expect(SupportChatStorageKey.PylonSeen).toBe('pylon_messenger_seen');
	});

	it('exposes exactly two providers', () => {
		expect(Object.values(SupportChatProvider)).toEqual(['intercom', 'pylon']);
	});

	it('models visibility and status as distinct closed sets', () => {
		expect(Object.values(SupportChatVisibility)).toEqual(['unknown', 'open', 'closed']);
		expect(Object.values(SupportChatStatus)).toEqual(['idle', 'initializing', 'ready', 'failed']);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/models/SupportChat.test.ts`

Expected: FAIL — `Failed to resolve import "./SupportChat"`.

- [ ] **Step 3: Create the domain enums**

Create `src/models/SupportChat.ts`:

```ts
/** Support-chat providers the dashboard can render. Exactly one is active per environment. */
export enum SupportChatProvider {
	Intercom = 'intercom',
	Pylon = 'pylon',
}

/** Messenger open/close state as observed by the hook. `Unknown` until the first event. */
export enum SupportChatVisibility {
	Unknown = 'unknown',
	Open = 'open',
	Closed = 'closed',
}

/** Adapter initialisation lifecycle. `show()` is a no-op unless `Ready`. */
export enum SupportChatStatus {
	Idle = 'idle',
	Initializing = 'initializing',
	Ready = 'ready',
	Failed = 'failed',
}

/**
 * gtag event names. The Intercom values are pre-existing and MUST NOT change —
 * downstream analytics dashboards key off them.
 */
export enum SupportChatAnalyticsEvent {
	IntercomOpened = 'intercom_messenger_opened',
	IntercomClosed = 'intercom_messenger_closed',
	PylonOpened = 'pylon_messenger_opened',
	PylonClosed = 'pylon_messenger_closed',
}

/** localStorage keys. The Intercom value is pre-existing and MUST NOT change. */
export enum SupportChatStorageKey {
	IntercomSeen = 'intercom_messenger_seen',
	PylonSeen = 'pylon_messenger_seen',
}

/** The only value ever written under a `SupportChatStorageKey`. */
export enum SupportChatStorageValue {
	Seen = 'true',
}
```

- [ ] **Step 4: Create the DOM enums**

Create `src/types/enums/dom.ts`:

```ts
/** Browser events treated as "the user is still here" by the inactivity timer. */
export enum UserActivityEvent {
	MouseMove = 'mousemove',
	KeyDown = 'keydown',
	Scroll = 'scroll',
	TouchStart = 'touchstart',
}

/** `document.readyState` values we compare against. */
export enum DocumentReadyState {
	Complete = 'complete',
}
```

- [ ] **Step 5: Create the env enum**

Create `src/types/enums/env.ts`:

```ts
/** Vite exposes env vars as strings; this is the truthy sentinel used across `config.ts`. */
export enum EnvFlag {
	True = 'true',
	False = 'false',
}
```

- [ ] **Step 6: Add the tenant metadata flag**

In `src/models/Tenant.ts`, append below the existing `TenantMetadataKey` enum. Leave `TenantMetadataKey` exactly as it is:

```ts
/** Values stored against a `TenantMetadataKey`. Metadata is a string map, so `'true'` is a string. */
export enum TenantMetadataFlag {
	True = 'true',
	False = 'false',
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run src/models/SupportChat.test.ts`

Expected: PASS — 6 tests.

- [ ] **Step 8: Commit**

```bash
git add src/models/SupportChat.ts src/models/SupportChat.test.ts src/models/Tenant.ts src/types/enums/dom.ts src/types/enums/env.ts
git commit --no-verify -m "feat(support-chat): add provider, visibility, status and analytics enums"
```

---

## Task 2: Pylon config

**Files:**
- Modify: `src/config/config.ts`
- Modify: `.env.example`

No test in this task — `config.ts` is a plain env read with no branching, and Task 3's tests exercise it through `getActiveSupportChatProvider()`.

- [ ] **Step 1: Add the `PylonConfig` interface**

In `src/config/config.ts`, immediately after the existing `IntercomConfig` interface (around line 56-59):

```ts
interface PylonConfig {
	enabled: boolean;
	appId: string;
}
```

- [ ] **Step 2: Add `pylon` to the `Config` interface**

In the same file, in the `Config` interface, add the field directly after `intercom: IntercomConfig;`:

```ts
	intercom: IntercomConfig;
	pylon: PylonConfig;
```

- [ ] **Step 3: Import the env enum**

Add to the imports at the top of `src/config/config.ts`:

```ts
import { EnvFlag } from '@/types/enums/env';
```

- [ ] **Step 4: Add the `pylon` config block**

In the exported `config` object, directly after the existing `intercom: { ... }` block (around line 321-324):

```ts
	pylon: {
		enabled: import.meta.env.VITE_PYLON_ENABLED === EnvFlag.True,
		appId: import.meta.env.VITE_PYLON_APP_ID ?? '',
	},
```

Leave the `intercom` block untouched — including its `=== 'true'` literal. Changing it is behaviour-neutral but widens the diff for no benefit.

- [ ] **Step 5: Document both providers in `.env.example`**

Replace the existing Intercom block (lines 25-28) with:

```bash
# --- Support chat -----------------------------------------------------------
# Enable AT MOST ONE provider. If both are enabled, Intercom wins and Pylon is
# ignored (a warning is logged in non-production builds).

# Intercom
# Replaces: VITE_APP_INTERCOM_APP_ID (deprecated — still works as fallback)
VITE_INTERCOM_ENABLED=false
VITE_INTERCOM_APP_ID=your-intercom-app-id-here

# Pylon — https://docs.usepylon.com/pylon-docs/chat-widget/chat-setup
# App ID comes from the Pylon dashboard under Chat Widget settings.
# Leave "Identity Verification" OFF in the Pylon dashboard: the frontend does
# not send a signed JWT yet (no backend signing endpoint exists).
VITE_PYLON_ENABLED=false
VITE_PYLON_APP_ID=your-pylon-app-id-here
```

- [ ] **Step 6: Verify TypeScript accepts the config change**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -E "config\.ts|types/enums" || echo "no errors in changed files"`

Expected: `no errors in changed files`. (Other pre-existing errors elsewhere are expected — see "Read this before Task 1".)

- [ ] **Step 7: Commit**

```bash
git add src/config/config.ts .env.example
git commit --no-verify -m "feat(support-chat): add VITE_PYLON_ENABLED and VITE_PYLON_APP_ID config"
```

---

## Task 3: Provider resolution and flow config

**Files:**
- Create: `src/config/support-chat.ts`
- Test: `src/config/support-chat.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/config/support-chat.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupportChatProvider } from '@/models/SupportChat';

describe('support chat config', () => {
	beforeEach(() => {
		vi.resetModules();
		// A developer's local .env is loaded by Vite during tests, so pin an explicit
		// baseline. Without this the suite passes or fails depending on whose machine
		// it runs on. Individual tests stub over these.
		vi.stubEnv('VITE_APP_ENV', 'development');
		vi.stubEnv('VITE_INTERCOM_ENABLED', 'false');
		vi.stubEnv('VITE_INTERCOM_APP_ID', '');
		vi.stubEnv('VITE_APP_INTERCOM_APP_ID', '');
		vi.stubEnv('VITE_PYLON_ENABLED', 'false');
		vi.stubEnv('VITE_PYLON_APP_ID', '');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it('returns no provider when neither is enabled', async () => {
		const { getActiveSupportChatProvider, isSupportChatAvailable } = await import('./support-chat');

		expect(getActiveSupportChatProvider()).toBeNull();
		expect(isSupportChatAvailable()).toBe(false);
	});

	it('returns Intercom when only Intercom is configured', async () => {
		vi.stubEnv('VITE_INTERCOM_ENABLED', 'true');
		vi.stubEnv('VITE_INTERCOM_APP_ID', 'abc123');
		const { getActiveSupportChatProvider, isSupportChatAvailable } = await import('./support-chat');

		expect(getActiveSupportChatProvider()).toBe(SupportChatProvider.Intercom);
		expect(isSupportChatAvailable()).toBe(true);
	});

	it('returns Pylon when only Pylon is configured', async () => {
		vi.stubEnv('VITE_PYLON_ENABLED', 'true');
		vi.stubEnv('VITE_PYLON_APP_ID', 'pylon-app-1');
		const { getActiveSupportChatProvider } = await import('./support-chat');

		expect(getActiveSupportChatProvider()).toBe(SupportChatProvider.Pylon);
	});

	it('prefers Intercom and warns when both are configured', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		vi.stubEnv('VITE_INTERCOM_ENABLED', 'true');
		vi.stubEnv('VITE_INTERCOM_APP_ID', 'abc123');
		vi.stubEnv('VITE_PYLON_ENABLED', 'true');
		vi.stubEnv('VITE_PYLON_APP_ID', 'pylon-app-1');
		const { getActiveSupportChatProvider } = await import('./support-chat');

		expect(getActiveSupportChatProvider()).toBe(SupportChatProvider.Intercom);
		expect(warn).toHaveBeenCalledOnce();
		expect(warn.mock.calls[0][0]).toContain('Pylon');
	});

	it('treats an enabled provider with a blank app id as unavailable', async () => {
		vi.stubEnv('VITE_INTERCOM_ENABLED', 'true');
		vi.stubEnv('VITE_INTERCOM_APP_ID', '   ');
		const { getActiveSupportChatProvider } = await import('./support-chat');

		expect(getActiveSupportChatProvider()).toBeNull();
	});

	it('falls back to Pylon when Intercom is enabled but has a blank app id', async () => {
		vi.stubEnv('VITE_INTERCOM_ENABLED', 'true');
		vi.stubEnv('VITE_INTERCOM_APP_ID', '');
		vi.stubEnv('VITE_PYLON_ENABLED', 'true');
		vi.stubEnv('VITE_PYLON_APP_ID', 'pylon-app-1');
		const { getActiveSupportChatProvider } = await import('./support-chat');

		expect(getActiveSupportChatProvider()).toBe(SupportChatProvider.Pylon);
	});

	it('reports Intercom specifically for the backward-compatible predicate', async () => {
		vi.stubEnv('VITE_PYLON_ENABLED', 'true');
		vi.stubEnv('VITE_PYLON_APP_ID', 'pylon-app-1');
		const { isIntercomProviderConfigured, isSupportChatAvailable } = await import('./support-chat');

		expect(isSupportChatAvailable()).toBe(true);
		expect(isIntercomProviderConfigured()).toBe(false);
	});

	it('labels the command palette entry for the active provider', async () => {
		vi.stubEnv('VITE_PYLON_ENABLED', 'true');
		vi.stubEnv('VITE_PYLON_APP_ID', 'pylon-app-1');
		const { getSupportChatCommandLabel } = await import('./support-chat');

		expect(getSupportChatCommandLabel()).toBe('Open Pylon');
	});

	it('labels the command palette entry "Open Intercom" when no provider is active', async () => {
		const { getSupportChatCommandLabel } = await import('./support-chat');

		expect(getSupportChatCommandLabel()).toBe('Open Intercom');
	});

	it('keeps the Intercom flow config identical to the pre-Pylon defaults', async () => {
		const { SUPPORT_CHAT_FLOW } = await import('./support-chat');
		const flow = SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom];

		expect(flow.hideDefaultLauncher).toBe(true);
		expect(flow.inactivityOpenDelayMs).toBe(1000 * 60 * 15);
		expect(flow.statePollIntervalMs).toBe(1000);
		expect(flow.activityEvents).toEqual(['mousemove', 'keydown', 'scroll', 'touchstart']);
		expect(flow.autoOpenOnInactivity).toBe(true);
		expect(flow.markCompletedOnClose).toBe(true);
		expect(flow.trackGtagEvents).toBe(true);
		expect(flow.persistMessengerSeenToStorage).toBe(true);
		expect(flow.gtagOpenedEvent).toBe('intercom_messenger_opened');
		expect(flow.gtagClosedEvent).toBe('intercom_messenger_closed');
		expect(flow.messengerSeenStorageKey).toBe('intercom_messenger_seen');
		expect(flow.toastSuccessMarkOnboarded).toBe("Welcome! You've been marked as onboarded.");
		expect(flow.toastErrorMarkOnboarded).toBe('Failed to update onboarding status. Please try again.');
	});

	it('gives Pylon its own analytics events and storage key but the same behaviour knobs', async () => {
		const { SUPPORT_CHAT_FLOW } = await import('./support-chat');
		const intercom = SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom];
		const pylon = SUPPORT_CHAT_FLOW[SupportChatProvider.Pylon];

		expect(pylon.gtagOpenedEvent).toBe('pylon_messenger_opened');
		expect(pylon.gtagClosedEvent).toBe('pylon_messenger_closed');
		expect(pylon.messengerSeenStorageKey).toBe('pylon_messenger_seen');
		expect(pylon.inactivityOpenDelayMs).toBe(intercom.inactivityOpenDelayMs);
		expect(pylon.autoOpenOnInactivity).toBe(intercom.autoOpenOnInactivity);
		expect(pylon.markCompletedOnClose).toBe(intercom.markCompletedOnClose);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/config/support-chat.test.ts`

Expected: FAIL — `Failed to resolve import "./support-chat"`.

- [ ] **Step 3: Write the implementation**

Create `src/config/support-chat.ts`:

```ts
import { config } from './config';
import { SupportChatAnalyticsEvent, SupportChatProvider, SupportChatStorageKey } from '@/models/SupportChat';
import { UserActivityEvent } from '@/types/enums/dom';

/**
 * Behaviour knobs for the support-chat messenger. Tune here instead of scattering
 * literals through the hook. String fields are enum-typed so a typo is a compile
 * error rather than a silently dead analytics event.
 */
export interface SupportChatFlowConfig {
	/** Hide the provider's floating launcher; we use the header Help button and command palette. */
	hideDefaultLauncher: boolean;
	/** Idle time before auto-opening the messenger for non-onboarded tenants (ms). */
	inactivityOpenDelayMs: number;
	/** How often the Intercom adapter polls for visibility (ms). Unused by Pylon, which has native events. */
	statePollIntervalMs: number;
	activityEvents: readonly UserActivityEvent[];
	/** After idle, open the messenger if onboarding is incomplete. */
	autoOpenOnInactivity: boolean;
	/** PATCH tenant metadata when the messenger closes and onboarding was incomplete. */
	markCompletedOnClose: boolean;
	trackGtagEvents: boolean;
	persistMessengerSeenToStorage: boolean;
	gtagOpenedEvent: SupportChatAnalyticsEvent;
	gtagClosedEvent: SupportChatAnalyticsEvent;
	messengerSeenStorageKey: SupportChatStorageKey;
	toastSuccessMarkOnboarded: string;
	toastErrorMarkOnboarded: string;
}

/** ms × sec × min; idle before auto-open for non-onboarded tenants. */
const SUPPORT_CHAT_INACTIVITY_TIMEOUT_MS = 1000 * 60 * 15; // 15 minutes

/** Knobs that are identical for every provider. */
const SHARED_FLOW = {
	hideDefaultLauncher: true,
	inactivityOpenDelayMs: SUPPORT_CHAT_INACTIVITY_TIMEOUT_MS,
	statePollIntervalMs: 1000,
	activityEvents: [UserActivityEvent.MouseMove, UserActivityEvent.KeyDown, UserActivityEvent.Scroll, UserActivityEvent.TouchStart],
	autoOpenOnInactivity: true,
	markCompletedOnClose: true,
	trackGtagEvents: true,
	persistMessengerSeenToStorage: true,
	toastSuccessMarkOnboarded: "Welcome! You've been marked as onboarded.",
	toastErrorMarkOnboarded: 'Failed to update onboarding status. Please try again.',
} satisfies Partial<SupportChatFlowConfig>;

/**
 * Total by construction: adding a provider to `SupportChatProvider` is a compile
 * error until its flow config is supplied here.
 */
export const SUPPORT_CHAT_FLOW: Record<SupportChatProvider, SupportChatFlowConfig> = {
	[SupportChatProvider.Intercom]: {
		...SHARED_FLOW,
		gtagOpenedEvent: SupportChatAnalyticsEvent.IntercomOpened,
		gtagClosedEvent: SupportChatAnalyticsEvent.IntercomClosed,
		messengerSeenStorageKey: SupportChatStorageKey.IntercomSeen,
	},
	[SupportChatProvider.Pylon]: {
		...SHARED_FLOW,
		gtagOpenedEvent: SupportChatAnalyticsEvent.PylonOpened,
		gtagClosedEvent: SupportChatAnalyticsEvent.PylonClosed,
		messengerSeenStorageKey: SupportChatStorageKey.PylonSeen,
	},
};

function isProviderConfigured(enabled: boolean, appId: string): boolean {
	return enabled && appId.trim().length > 0;
}

/** True when Intercom specifically is configured. Backs the deprecated `isIntercomMessengerAvailable`. */
export function isIntercomProviderConfigured(): boolean {
	return isProviderConfigured(config.intercom.enabled, config.intercom.appId);
}

/** True when Pylon specifically is configured. */
export function isPylonProviderConfigured(): boolean {
	return isProviderConfigured(config.pylon.enabled, config.pylon.appId);
}

/**
 * Resolves the single active provider. Intercom wins when both are configured,
 * preserving pre-Pylon behaviour for any environment that later enables both.
 */
export function getActiveSupportChatProvider(): SupportChatProvider | null {
	const intercomReady = isIntercomProviderConfigured();
	const pylonReady = isPylonProviderConfigured();

	if (intercomReady && pylonReady && !config.app.isProd) {
		// A configuration mistake, not a runtime error — deliberately not routed through ErrorLoggingService.
		console.warn(
			'[support-chat] Intercom and Pylon are both enabled. Using Intercom and ignoring Pylon. Set VITE_INTERCOM_ENABLED=false to use Pylon.',
		);
	}

	if (intercomReady) return SupportChatProvider.Intercom;
	if (pylonReady) return SupportChatProvider.Pylon;
	return null;
}

/** True when any provider is active. Used by CommandPalette to gate the chat command. */
export function isSupportChatAvailable(): boolean {
	return getActiveSupportChatProvider() !== null;
}

const SUPPORT_CHAT_COMMAND_LABEL: Record<SupportChatProvider, string> = {
	[SupportChatProvider.Intercom]: 'Open Intercom',
	[SupportChatProvider.Pylon]: 'Open Pylon',
};

/**
 * Command-palette label for the active provider. A pure env read with no side
 * effects, so it is safe to evaluate at module load in `commands.ts`.
 * Falls back to the Intercom label so the command reads identically to today
 * when no provider is configured (the command is hidden in that case anyway).
 */
export function getSupportChatCommandLabel(): string {
	const provider = getActiveSupportChatProvider();
	return SUPPORT_CHAT_COMMAND_LABEL[provider ?? SupportChatProvider.Intercom];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/config/support-chat.test.ts`

Expected: PASS — 11 tests.

- [ ] **Step 5: Commit**

```bash
git add src/config/support-chat.ts src/config/support-chat.test.ts
git commit --no-verify -m "feat(support-chat): add provider resolution and per-provider flow config"
```

---

## Task 4: Backward-compatible config shim

**Files:**
- Modify: `src/config/intercom.ts` (replace contents with re-exports)
- Test: `src/config/intercom.test.ts`

`src/config/intercom.ts` keeps working for any existing importer. It becomes re-exports only — zero logic — so there is no second implementation to drift.

- [ ] **Step 1: Write the failing test**

Create `src/config/intercom.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupportChatProvider } from '@/models/SupportChat';

describe('deprecated intercom config shim', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('still reports availability for a configured Intercom', async () => {
		vi.stubEnv('VITE_INTERCOM_ENABLED', 'true');
		vi.stubEnv('VITE_INTERCOM_APP_ID', 'abc123');
		const { isIntercomMessengerAvailable } = await import('./intercom');

		expect(isIntercomMessengerAvailable()).toBe(true);
	});

	it('keeps its original meaning: Pylon being active does NOT make Intercom available', async () => {
		vi.stubEnv('VITE_PYLON_ENABLED', 'true');
		vi.stubEnv('VITE_PYLON_APP_ID', 'pylon-app-1');
		const { isIntercomMessengerAvailable } = await import('./intercom');

		expect(isIntercomMessengerAvailable()).toBe(false);
	});

	it('re-exports the Intercom flow config unchanged', async () => {
		const { INTERCOM_MESSENGER_FLOW } = await import('./intercom');
		const { SUPPORT_CHAT_FLOW } = await import('./support-chat');

		expect(INTERCOM_MESSENGER_FLOW).toBe(SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom]);
		expect(INTERCOM_MESSENGER_FLOW.gtagOpenedEvent).toBe('intercom_messenger_opened');
		expect(INTERCOM_MESSENGER_FLOW.messengerSeenStorageKey).toBe('intercom_messenger_seen');
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/config/intercom.test.ts`

Expected: FAIL — the third test fails because `INTERCOM_MESSENGER_FLOW` is currently a separate object literal, not the same reference as `SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom]`. The first two already pass: the old implementation checks Intercom specifically, which is exactly the semantics the shim must preserve.

- [ ] **Step 3: Replace the file with re-exports**

Replace the **entire contents** of `src/config/intercom.ts` with:

```ts
/**
 * @deprecated Use `@/config/support-chat`.
 *
 * Backward-compatibility shim. Contains re-exports only — no logic — so there is
 * nothing here to drift from the real implementation. Remove once no in-repo
 * imports remain.
 */
import { SupportChatProvider } from '@/models/SupportChat';
import { SUPPORT_CHAT_FLOW, type SupportChatFlowConfig } from './support-chat';

/**
 * @deprecated Use `isSupportChatAvailable()` from `@/config/support-chat` to gate
 * provider-agnostic UI. This retains its original meaning — Intercom specifically
 * is configured — and returns false when Pylon is the active provider.
 */
export { isIntercomProviderConfigured as isIntercomMessengerAvailable } from './support-chat';

/** @deprecated Use `SupportChatFlowConfig` from `@/config/support-chat`. */
export type IntercomMessengerFlowConfig = SupportChatFlowConfig;

/** @deprecated Use `SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom]` from `@/config/support-chat`. */
export const INTERCOM_MESSENGER_FLOW: SupportChatFlowConfig = SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom];
```

- [ ] **Step 4: Run both config test files to verify they pass**

Run: `npx vitest run src/config/intercom.test.ts src/config/support-chat.test.ts`

Expected: PASS — 14 tests total.

- [ ] **Step 5: Commit**

```bash
git add src/config/intercom.ts src/config/intercom.test.ts
git commit --no-verify -m "refactor(support-chat): turn config/intercom into a deprecated re-export shim"
```

---

## Task 5: Adapter interface

**Files:**
- Create: `src/core/services/support-chat/SupportChatAdapter.ts`

No test — this file is types only, and Task 8's conformance suite is the real test of the contract.

- [ ] **Step 1: Write the interface**

Create `src/core/services/support-chat/SupportChatAdapter.ts`:

```ts
/** The subset of the authenticated user a support-chat provider needs to identify them. */
export interface SupportChatUser {
	id: string;
	email?: string;
	name?: string;
	/** Epoch milliseconds. */
	createdAt?: number;
	tenantId?: string;
}

export interface SupportChatVisibilityHandlers {
	onShow: () => void;
	onHide: () => void;
}

/**
 * The only thing `useSupportChat` knows about a provider.
 *
 * Lifecycle ownership is deliberately non-overlapping:
 * - the function returned by `subscribe()` removes everything `subscribe()` registered;
 * - `dispose()` marks the adapter dead so no late callback fires, and releases
 *   anything `init()` created. It is idempotent and safe to call after unsubscribe.
 *
 * `init()` and `subscribe()` may be called in either order.
 */
export interface SupportChatAdapter {
	/**
	 * Load the SDK and identify the user.
	 *
	 * Async by design: this is the seam where a signed identity token is fetched
	 * once a backend endpoint exists (`chat_settings.jwt = await fetchIdentityToken()`).
	 *
	 * Rejects when the SDK cannot be loaded or the provider is misconfigured.
	 */
	init(user: SupportChatUser): Promise<void>;

	/** Open the messenger. Never throws — a no-op if init failed or has not completed. */
	show(): void;

	/** Register visibility handlers. The returned function removes them. */
	subscribe(handlers: SupportChatVisibilityHandlers): () => void;

	/** Tear down this adapter instance. Called exactly once, on unmount. Idempotent. */
	dispose(): void;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "support-chat" || echo "no errors in support-chat"`

Expected: `no errors in support-chat`.

- [ ] **Step 3: Commit**

```bash
git add src/core/services/support-chat/SupportChatAdapter.ts
git commit --no-verify -m "feat(support-chat): add the SupportChatAdapter interface"
```

---

## Task 6: Pylon adapter

**Files:**
- Create: `src/core/services/support-chat/adapters/pylon.ts`
- Test: `src/core/services/support-chat/adapters/pylon.test.ts`

Background you need: Pylon's documented install snippet installs a **queue stub** at `window.Pylon` that pushes calls onto `window.Pylon.q` until the real widget script loads and replays them. We reimplement that stub in TypeScript rather than eval'ing the minified snippet, so calls made before the script finishes loading are not lost.

- [ ] **Step 1: Write the failing test**

Create `src/core/services/support-chat/adapters/pylon.test.ts`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetPylonLoaderForTests, createPylonAdapter } from './pylon';
import type { SupportChatUser } from '../SupportChatAdapter';

const USER: SupportChatUser = {
	id: 'user_1',
	email: 'ada@example.com',
	name: 'Ada Tenant',
	createdAt: 1_700_000_000_000,
	tenantId: 'tenant_1',
};

type PylonGlobals = {
	Pylon?: ((...args: unknown[]) => void) & { q?: unknown[] };
	pylon?: { chat_settings: Record<string, unknown> };
};

function globals(): PylonGlobals {
	return window as unknown as PylonGlobals;
}

/** Resolve the pending script by firing its onload, mimicking a successful widget fetch. */
function completeScriptLoad(): void {
	const script = document.querySelector<HTMLScriptElement>('script[src*="widget.usepylon.com"]');
	script?.dispatchEvent(new Event('load'));
}

function failScriptLoad(): void {
	const script = document.querySelector<HTMLScriptElement>('script[src*="widget.usepylon.com"]');
	script?.dispatchEvent(new Event('error'));
}

describe('pylon adapter', () => {
	beforeEach(() => {
		__resetPylonLoaderForTests();
		document.head.innerHTML = '';
		delete globals().Pylon;
		delete globals().pylon;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('sets chat_settings before inserting the widget script', async () => {
		const adapter = createPylonAdapter('app-123');
		const pending = adapter.init(USER);

		expect(globals().pylon?.chat_settings).toEqual({
			app_id: 'app-123',
			email: 'ada@example.com',
			name: 'Ada Tenant',
		});

		completeScriptLoad();
		await pending;
	});

	it('injects the widget script with hardened attributes', async () => {
		const adapter = createPylonAdapter('app-123');
		const pending = adapter.init(USER);
		const script = document.querySelector<HTMLScriptElement>('script[src*="widget.usepylon.com"]');

		expect(script).not.toBeNull();
		expect(script?.src).toBe('https://widget.usepylon.com/widget/app-123');
		expect(script?.async).toBe(true);
		expect(script?.crossOrigin).toBe('anonymous');
		expect(script?.referrerPolicy).toBe('strict-origin-when-cross-origin');

		completeScriptLoad();
		await pending;
	});

	it('injects the script only once across repeated inits', async () => {
		const adapter = createPylonAdapter('app-123');
		const first = adapter.init(USER);
		completeScriptLoad();
		await first;

		await adapter.init(USER);

		expect(document.querySelectorAll('script[src*="widget.usepylon.com"]')).toHaveLength(1);
	});

	it('hides the chat bubble once the widget has loaded', async () => {
		const adapter = createPylonAdapter('app-123');
		const pending = adapter.init(USER);
		completeScriptLoad();
		await pending;

		expect(globals().Pylon?.q).toContainEqual(['hideChatBubble']);
	});

	it('rejects an app id containing characters outside the allowed set', async () => {
		const adapter = createPylonAdapter('app-123/../evil');

		await expect(adapter.init(USER)).rejects.toThrow(/Invalid Pylon app id/);
		expect(document.querySelector('script[src*="usepylon"]')).toBeNull();
	});

	it('rejects when the widget script fails to load', async () => {
		const adapter = createPylonAdapter('app-123');
		const pending = adapter.init(USER);
		failScriptLoad();

		await expect(pending).rejects.toThrow(/Failed to load Pylon widget script/);
	});

	it('queues show() through the stub before the widget loads', () => {
		const adapter = createPylonAdapter('app-123');
		void adapter.init(USER);
		adapter.show();

		expect(globals().Pylon?.q).toContainEqual(['show']);
	});

	it('registers native onShow and onHide callbacks and routes them to handlers', async () => {
		const adapter = createPylonAdapter('app-123');
		const onShow = vi.fn();
		const onHide = vi.fn();
		adapter.subscribe({ onShow, onHide });

		const calls = globals().Pylon?.q ?? [];
		const showRegistration = calls.find((call) => (call as unknown[])[0] === 'onShow') as [string, () => void];
		const hideRegistration = calls.find((call) => (call as unknown[])[0] === 'onHide') as [string, () => void];

		expect(showRegistration).toBeDefined();
		expect(hideRegistration).toBeDefined();

		showRegistration[1]();
		hideRegistration[1]();

		expect(onShow).toHaveBeenCalledOnce();
		expect(onHide).toHaveBeenCalledOnce();
	});

	it('drops callbacks that arrive after dispose', () => {
		const adapter = createPylonAdapter('app-123');
		const onShow = vi.fn();
		const onHide = vi.fn();
		adapter.subscribe({ onShow, onHide });

		const calls = globals().Pylon?.q ?? [];
		const showRegistration = calls.find((call) => (call as unknown[])[0] === 'onShow') as [string, () => void];

		adapter.dispose();
		showRegistration[1]();

		expect(onShow).not.toHaveBeenCalled();
		expect(onHide).not.toHaveBeenCalled();
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/core/services/support-chat/adapters/pylon.test.ts`

Expected: FAIL — `Failed to resolve import "./pylon"`.

- [ ] **Step 3: Write the implementation**

Create `src/core/services/support-chat/adapters/pylon.ts`:

```ts
/**
 * Pylon chat widget adapter.
 *
 * Docs: https://docs.usepylon.com/pylon-docs/chat-widget/chat-setup
 *       https://docs.usepylon.com/pylon-docs/chat-widget/javascript-api
 *
 * Emulates the same behaviour as the Intercom adapter: launcher hidden, opened
 * programmatically from the header Help button and the command palette, and
 * visibility reported to the hook. Unlike Intercom, Pylon exposes native
 * onShow/onHide callbacks, so no polling is needed.
 */
import { DocumentReadyState } from '@/types/enums/dom';
import type { SupportChatAdapter, SupportChatUser, SupportChatVisibilityHandlers } from '../SupportChatAdapter';

/** Pylon JS API commands. See the javascript-api doc linked above. */
enum PylonCommand {
	Show = 'show',
	Hide = 'hide',
	OnShow = 'onShow',
	OnHide = 'onHide',
	HideChatBubble = 'hideChatBubble',
}

const PYLON_WIDGET_BASE_URL = 'https://widget.usepylon.com/widget';

/**
 * App ids are opaque tokens from the Pylon dashboard. Validating before
 * interpolating into a <script src> stops a mis-set env var from becoming
 * URL injection.
 */
const PYLON_APP_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

type PylonFn = ((...args: unknown[]) => void) & { q?: unknown[] };

interface PylonWindow {
	Pylon?: PylonFn;
	pylon?: { chat_settings: Record<string, unknown> };
}

/** One in-flight/settled load promise per app id, so repeated inits inject one script. */
const scriptLoads = new Map<string, Promise<void>>();

/** @internal Test-only: clears the module-level injection cache between tests. */
export function __resetPylonLoaderForTests(): void {
	scriptLoads.clear();
}

function pylonWindow(): PylonWindow {
	return window as unknown as PylonWindow;
}

/**
 * Reimplements Pylon's own queue stub: calls made before the widget script loads
 * are pushed onto `Pylon.q` and replayed by the widget once it initialises.
 */
function installQueueStub(target: PylonWindow): void {
	if (target.Pylon) return;

	const queue: unknown[] = [];
	const stub = ((...args: unknown[]) => {
		queue.push(args);
	}) as PylonFn;
	stub.q = queue;
	target.Pylon = stub;
}

function whenDocumentReady(): Promise<void> {
	if (document.readyState === DocumentReadyState.Complete) return Promise.resolve();
	return new Promise((resolve) => {
		window.addEventListener('load', () => resolve(), { once: true });
	});
}

function loadWidgetScript(appId: string): Promise<void> {
	const existing = scriptLoads.get(appId);
	if (existing) return existing;

	const load = new Promise<void>((resolve, reject) => {
		const script = document.createElement('script');
		script.type = 'text/javascript';
		script.async = true;
		script.crossOrigin = 'anonymous';
		script.referrerPolicy = 'strict-origin-when-cross-origin';
		script.src = `${PYLON_WIDGET_BASE_URL}/${appId}`;
		script.addEventListener('load', () => resolve(), { once: true });
		script.addEventListener('error', () => reject(new Error(`Failed to load Pylon widget script for app id ${appId}`)), {
			once: true,
		});
		document.head.appendChild(script);
	});

	scriptLoads.set(appId, load);
	return load;
}

export function createPylonAdapter(appId: string): SupportChatAdapter {
	let disposed = false;
	let handlers: SupportChatVisibilityHandlers | null = null;
	let registered = false;

	return {
		async init(user: SupportChatUser): Promise<void> {
			if (typeof window === 'undefined') return;
			if (!PYLON_APP_ID_PATTERN.test(appId)) {
				throw new Error('Invalid Pylon app id: expected only letters, digits, hyphens and underscores');
			}

			const target = pylonWindow();
			// Settings must exist before the widget boots, per the Pylon setup docs.
			target.pylon = {
				chat_settings: {
					app_id: appId,
					email: user.email ?? '',
					name: user.name ?? '',
				},
			};
			installQueueStub(target);

			// Insert synchronously when the document is already complete, so callers can
			// observe the script element immediately. Only defer when it genuinely is not.
			if (document.readyState !== DocumentReadyState.Complete) {
				await whenDocumentReady();
			}
			await loadWidgetScript(appId);

			if (disposed) return;
			target.Pylon?.(PylonCommand.HideChatBubble);
		},

		show(): void {
			if (disposed || typeof window === 'undefined') return;
			pylonWindow().Pylon?.(PylonCommand.Show);
		},

		subscribe(next: SupportChatVisibilityHandlers): () => void {
			handlers = next;

			if (!registered && typeof window !== 'undefined') {
				const target = pylonWindow();
				// subscribe() may run before init(); make sure the queue exists either way.
				installQueueStub(target);
				registered = true;
				// Pylon documents no way to UNregister these, so route through a mutable
				// ref and gate on `disposed` instead.
				target.Pylon?.(PylonCommand.OnShow, () => {
					if (!disposed) handlers?.onShow();
				});
				target.Pylon?.(PylonCommand.OnHide, () => {
					if (!disposed) handlers?.onHide();
				});
			}

			return () => {
				handlers = null;
			};
		},

		dispose(): void {
			disposed = true;
			handlers = null;
		},
	};
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/core/services/support-chat/adapters/pylon.test.ts`

Expected: PASS — 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/core/services/support-chat/adapters/pylon.ts src/core/services/support-chat/adapters/pylon.test.ts
git commit --no-verify -m "feat(support-chat): add the Pylon adapter with app id validation and hardened script injection"
```

---

## Task 7: Intercom adapter

**Files:**
- Create: `src/core/services/support-chat/adapters/intercom.ts`
- Test: `src/core/services/support-chat/adapters/intercom.test.ts`

This is a faithful port of the SDK calls and polling currently in `IntercomMessenger.tsx` — nothing about how Intercom is driven changes.

- [ ] **Step 1: Write the failing test**

Create `src/core/services/support-chat/adapters/intercom.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupportChatUser } from '../SupportChatAdapter';

const { intercomSdk } = vi.hoisted(() => ({ intercomSdk: vi.fn() }));

vi.mock('@intercom/messenger-js-sdk', () => ({ default: intercomSdk }));
vi.mock('../../intercom/index.css', () => ({}));

const USER: SupportChatUser = {
	id: 'user_1',
	email: 'ada@example.com',
	name: 'Ada Tenant',
	createdAt: 1_700_000_000_000,
	tenantId: 'tenant_1',
};

type IntercomGlobals = { Intercom?: (command: string) => unknown };

function globals(): IntercomGlobals {
	return window as unknown as IntercomGlobals;
}

describe('intercom adapter', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		intercomSdk.mockClear();
		delete globals().Intercom;
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('boots the SDK with the identified user and a hidden launcher', async () => {
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);

		await adapter.init(USER);

		expect(intercomSdk).toHaveBeenCalledWith({
			app_id: 'abc123',
			user_id: 'user_1',
			name: 'Ada Tenant',
			email: 'ada@example.com',
			created_at: 1_700_000_000_000,
			hide_default_launcher: true,
		});
	});

	it('opens the messenger via the SDK show command', async () => {
		const intercom = vi.fn();
		globals().Intercom = intercom;
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);

		await adapter.init(USER);
		adapter.show();

		expect(intercom).toHaveBeenCalledWith('show');
	});

	it('synthesises onShow and onHide by polling isVisible', async () => {
		let visible = false;
		globals().Intercom = vi.fn((command: string) => (command === 'isVisible' ? visible : undefined));
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);
		const onShow = vi.fn();
		const onHide = vi.fn();

		await adapter.init(USER);
		adapter.subscribe({ onShow, onHide });

		visible = true;
		vi.advanceTimersByTime(1000);
		expect(onShow).toHaveBeenCalledOnce();
		expect(onHide).not.toHaveBeenCalled();

		visible = false;
		vi.advanceTimersByTime(1000);
		expect(onHide).toHaveBeenCalledOnce();
	});

	it('does not re-fire while visibility is unchanged', async () => {
		globals().Intercom = vi.fn((command: string) => (command === 'isVisible' ? true : undefined));
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);
		const onShow = vi.fn();
		const onHide = vi.fn();

		await adapter.init(USER);
		adapter.subscribe({ onShow, onHide });
		vi.advanceTimersByTime(5000);

		expect(onShow).toHaveBeenCalledOnce();
	});

	it('maps postMessage events to handlers', async () => {
		globals().Intercom = vi.fn(() => false);
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);
		const onShow = vi.fn();
		const onHide = vi.fn();

		await adapter.init(USER);
		adapter.subscribe({ onShow, onHide });

		window.dispatchEvent(new MessageEvent('message', { data: { type: 'intercom:show' } }));
		window.dispatchEvent(new MessageEvent('message', { data: { type: 'intercom:hide' } }));

		expect(onShow).toHaveBeenCalledOnce();
		expect(onHide).toHaveBeenCalledOnce();
	});

	it('stops polling after unsubscribe', async () => {
		let visible = false;
		globals().Intercom = vi.fn((command: string) => (command === 'isVisible' ? visible : undefined));
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);
		const onShow = vi.fn();

		await adapter.init(USER);
		const unsubscribe = adapter.subscribe({ onShow, onHide: vi.fn() });
		unsubscribe();

		visible = true;
		vi.advanceTimersByTime(5000);

		expect(onShow).not.toHaveBeenCalled();
	});

	it('swallows SDK errors raised while polling', async () => {
		globals().Intercom = vi.fn(() => {
			throw new Error('Intercom not ready');
		});
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);

		await adapter.init(USER);
		adapter.subscribe({ onShow: vi.fn(), onHide: vi.fn() });

		expect(() => vi.advanceTimersByTime(3000)).not.toThrow();
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/core/services/support-chat/adapters/intercom.test.ts`

Expected: FAIL — `Failed to resolve import "./intercom"`.

- [ ] **Step 3: Write the implementation**

Create `src/core/services/support-chat/adapters/intercom.ts`:

```ts
/**
 * Intercom messenger adapter.
 *
 * Docs: https://developers.intercom.com/installing-intercom/web/methods
 *
 * A faithful port of the SDK calls previously inline in IntercomMessenger.tsx.
 * Intercom fires no reliable close event, so visibility is synthesised by polling
 * `isVisible` and by listening for the embed's postMessage events where supported.
 */
import Intercom from '@intercom/messenger-js-sdk';
import '../../intercom/index.css';
import type { SupportChatAdapter, SupportChatUser, SupportChatVisibilityHandlers } from '../SupportChatAdapter';

enum IntercomCommand {
	Show = 'show',
	Hide = 'hide',
	IsVisible = 'isVisible',
}

enum IntercomPostMessageType {
	Hide = 'intercom:hide',
	Show = 'intercom:show',
	BareHide = 'hide',
	BareShow = 'show',
}

type IntercomFn = (command: IntercomCommand) => unknown;

interface IntercomWindow {
	Intercom?: IntercomFn;
}

function intercomWindow(): IntercomWindow {
	return window as unknown as IntercomWindow;
}

function isMessengerVisible(): boolean {
	try {
		return intercomWindow().Intercom?.(IntercomCommand.IsVisible) === true;
	} catch {
		// The SDK may not be ready yet; treat as not visible.
		return false;
	}
}

export function createIntercomAdapter(appId: string, pollIntervalMs: number, hideDefaultLauncher: boolean): SupportChatAdapter {
	let disposed = false;
	let handlers: SupportChatVisibilityHandlers | null = null;
	let pollTimer: ReturnType<typeof setInterval> | null = null;
	let messageListener: ((event: MessageEvent) => void) | null = null;
	let lastVisible: boolean | null = null;

	const stopPolling = () => {
		if (pollTimer !== null) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
		if (messageListener) {
			window.removeEventListener('message', messageListener);
			messageListener = null;
		}
	};

	return {
		async init(user: SupportChatUser): Promise<void> {
			if (typeof window === 'undefined') return;

			Intercom({
				app_id: appId,
				user_id: user.id,
				name: user.name,
				email: user.email,
				created_at: user.createdAt,
				hide_default_launcher: hideDefaultLauncher,
			});
		},

		show(): void {
			if (disposed || typeof window === 'undefined') return;
			try {
				intercomWindow().Intercom?.(IntercomCommand.Show);
			} catch {
				// The SDK may not be ready yet; opening is best-effort.
			}
		},

		subscribe(next: SupportChatVisibilityHandlers): () => void {
			handlers = next;
			if (typeof window === 'undefined') return () => undefined;

			stopPolling();
			lastVisible = null;

			pollTimer = setInterval(() => {
				if (disposed) return;
				const previous = lastVisible;
				const visible = isMessengerVisible();
				if (visible === previous) return;
				lastVisible = visible;
				if (visible) handlers?.onShow();
				else if (previous !== null) handlers?.onHide();
			}, pollIntervalMs);

			messageListener = (event: MessageEvent) => {
				if (disposed || !event.data || typeof event.data !== 'object') return;
				const type = (event.data as { type?: string }).type;
				if (type === IntercomPostMessageType.Hide || type === IntercomPostMessageType.BareHide) {
					lastVisible = false;
					handlers?.onHide();
				} else if (type === IntercomPostMessageType.Show || type === IntercomPostMessageType.BareShow) {
					lastVisible = true;
					handlers?.onShow();
				}
			};
			window.addEventListener('message', messageListener);

			return () => {
				handlers = null;
				stopPolling();
			};
		},

		dispose(): void {
			disposed = true;
			handlers = null;
			stopPolling();
		},
	};
}
```

Note on the poll's first tick: `lastVisible` starts as `null` and the previous value is captured **before** it is reassigned. A first tick observing `false` therefore records `lastVisible = false` and fires nothing, because `previous` is still `null` — matching the old behaviour, where a hide could not fire before a show. Reading `lastVisible` after the assignment instead would make that guard always true and emit a spurious close on mount.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/core/services/support-chat/adapters/intercom.test.ts`

Expected: PASS — 8 tests (the 8th, `does not fire a close before the messenger has ever been seen open`, is the regression guard for the poll-edge bug described above).

- [ ] **Step 5: Commit**

```bash
git add src/core/services/support-chat/adapters/intercom.ts src/core/services/support-chat/adapters/intercom.test.ts
git commit --no-verify -m "feat(support-chat): extract the Intercom adapter from IntercomMessenger"
```

---

## Task 8: Adapter conformance suite

**Files:**
- Create: `src/core/services/support-chat/adapters/index.ts`
- Test: `src/core/services/support-chat/adapters/conformance.test.ts`

One parameterized suite run against **both** adapters. A third provider inherits it for free. This is the test that stops the two adapters diverging.

- [ ] **Step 1: Write the failing test**

Create `src/core/services/support-chat/adapters/conformance.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupportChatProvider } from '@/models/SupportChat';
import type { SupportChatAdapter, SupportChatUser } from '../SupportChatAdapter';

vi.mock('@intercom/messenger-js-sdk', () => ({ default: vi.fn() }));
vi.mock('../../intercom/index.css', () => ({}));

const USER: SupportChatUser = {
	id: 'user_1',
	email: 'ada@example.com',
	name: 'Ada Tenant',
	createdAt: 1_700_000_000_000,
	tenantId: 'tenant_1',
};

/** Let the Pylon script "load" so its init promise settles; a no-op for Intercom. */
function settlePendingScript(): void {
	document.querySelector<HTMLScriptElement>('script[src*="widget.usepylon.com"]')?.dispatchEvent(new Event('load'));
}

const CASES: ReadonlyArray<{ provider: SupportChatProvider; create: () => Promise<SupportChatAdapter> }> = [
	{
		provider: SupportChatProvider.Intercom,
		create: async () => {
			const { createIntercomAdapter } = await import('./intercom');
			return createIntercomAdapter('abc123', 1000, true);
		},
	},
	{
		provider: SupportChatProvider.Pylon,
		create: async () => {
			const { createPylonAdapter } = await import('./pylon');
			return createPylonAdapter('app-123');
		},
	},
];

describe.each(CASES)('$provider adapter conformance', ({ create }) => {
	beforeEach(async () => {
		const { __resetPylonLoaderForTests } = await import('./pylon');
		__resetPylonLoaderForTests();
		document.head.innerHTML = '';
		delete (window as unknown as { Pylon?: unknown }).Pylon;
		delete (window as unknown as { pylon?: unknown }).pylon;
		delete (window as unknown as { Intercom?: unknown }).Intercom;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('resolves init for a valid configuration', async () => {
		const adapter = await create();
		const pending = adapter.init(USER);
		settlePendingScript();

		await expect(pending).resolves.toBeUndefined();
	});

	it('does not throw when show() is called before init', async () => {
		const adapter = await create();

		expect(() => adapter.show()).not.toThrow();
	});

	it('does not throw when show() is called after dispose', async () => {
		const adapter = await create();
		const pending = adapter.init(USER);
		settlePendingScript();
		await pending;
		adapter.dispose();

		expect(() => adapter.show()).not.toThrow();
	});

	it('accepts subscribe before init', async () => {
		const adapter = await create();

		expect(() => adapter.subscribe({ onShow: vi.fn(), onHide: vi.fn() })).not.toThrow();

		const pending = adapter.init(USER);
		settlePendingScript();
		await expect(pending).resolves.toBeUndefined();
	});

	it('returns an unsubscribe function that is safe to call twice', async () => {
		const adapter = await create();
		const unsubscribe = adapter.subscribe({ onShow: vi.fn(), onHide: vi.fn() });

		expect(() => {
			unsubscribe();
			unsubscribe();
		}).not.toThrow();
	});

	it('has an idempotent dispose', async () => {
		const adapter = await create();
		const pending = adapter.init(USER);
		settlePendingScript();
		await pending;

		expect(() => {
			adapter.dispose();
			adapter.dispose();
		}).not.toThrow();
	});

	it('tolerates dispose without a prior init or subscribe', async () => {
		const adapter = await create();

		expect(() => adapter.dispose()).not.toThrow();
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/core/services/support-chat/adapters/conformance.test.ts`

Expected: FAIL. If it passes immediately, that is also acceptable — the adapters were written to this contract. Read the output and confirm 14 tests ran (7 × 2 providers).

- [ ] **Step 3: Fix any adapter that violates the contract**

If a case fails, fix the **adapter**, not the test. The contract in `SupportChatAdapter.ts` is the source of truth.

- [ ] **Step 4: Write the adapter factory**

Create `src/core/services/support-chat/adapters/index.ts`:

```ts
import { config } from '@/config/config';
import type { SupportChatFlowConfig } from '@/config/support-chat';
import { SupportChatProvider } from '@/models/SupportChat';
import type { SupportChatAdapter } from '../SupportChatAdapter';
import { createIntercomAdapter } from './intercom';
import { createPylonAdapter } from './pylon';

/** Builds the adapter for the resolved provider. Exhaustive over `SupportChatProvider`. */
export function createSupportChatAdapter(provider: SupportChatProvider, flow: SupportChatFlowConfig): SupportChatAdapter {
	switch (provider) {
		case SupportChatProvider.Intercom:
			return createIntercomAdapter(config.intercom.appId, flow.statePollIntervalMs, flow.hideDefaultLauncher);
		case SupportChatProvider.Pylon:
			return createPylonAdapter(config.pylon.appId);
	}
}
```

- [ ] **Step 5: Run the whole adapter suite to verify it passes**

Run: `npx vitest run src/core/services/support-chat/adapters/`

Expected: PASS — 31 tests (9 Pylon + 8 Intercom + 14 conformance).

- [ ] **Step 6: Commit**

```bash
git add src/core/services/support-chat/adapters/index.ts src/core/services/support-chat/adapters/conformance.test.ts
git commit --no-verify -m "test(support-chat): add a shared adapter conformance suite and the adapter factory"
```

---

## Task 9: The shared behaviour hook

**Files:**
- Create: `src/core/services/support-chat/useSupportChat.ts`
- Test: `src/core/services/support-chat/useSupportChat.test.tsx`

This is the heart of the change: every behaviour that used to live in `IntercomMessenger.tsx`, now written once and driven only by adapter events. The test uses a **fake adapter**, so it proves the behaviour is provider-agnostic.

- [ ] **Step 1: Write the failing test**

Create `src/core/services/support-chat/useSupportChat.test.tsx`:

```tsx
import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupportChatProvider } from '@/models/SupportChat';
import type { SupportChatAdapter, SupportChatVisibilityHandlers } from './SupportChatAdapter';

const { mockGetTenantById, mockUpdateTenant, mockUseUser, mockToastSuccess, mockToastError, mockLogError, mockRefetchQueries } =
	vi.hoisted(() => ({
		mockGetTenantById: vi.fn(),
		mockUpdateTenant: vi.fn(),
		mockUseUser: vi.fn(),
		mockToastSuccess: vi.fn(),
		mockToastError: vi.fn(),
		mockLogError: vi.fn(),
		mockRefetchQueries: vi.fn().mockResolvedValue(undefined),
	}));

vi.mock('@/api/TenantApi', () => ({
	default: { getTenantById: mockGetTenantById, updateTenant: mockUpdateTenant },
}));
vi.mock('@/hooks/useUser', () => ({ default: mockUseUser }));
vi.mock('react-hot-toast', () => ({
	toast: { success: mockToastSuccess, error: mockToastError },
}));
vi.mock('@/core/services/error/ErrorLoggingService', () => ({
	default: { logError: mockLogError },
	errorLogger: { logError: mockLogError },
}));
vi.mock('../tanstack/ReactQueryProvider', () => ({ refetchQueries: mockRefetchQueries }));

import { SUPPORT_CHAT_FLOW } from '@/config/support-chat';
import { useSupportChat } from './useSupportChat';

const FLOW = SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom];

const USER = {
	id: 'user_1',
	email: 'ada@example.com',
	tenant: { id: 'tenant_1', name: 'Ada Tenant', created_at: '2024-01-01T00:00:00Z' },
};

/** Adapter double that lets the test drive onShow/onHide directly. */
function createFakeAdapter() {
	let handlers: SupportChatVisibilityHandlers | null = null;
	const adapter: SupportChatAdapter & {
		emitShow: () => void;
		emitHide: () => void;
		initMock: ReturnType<typeof vi.fn>;
		showMock: ReturnType<typeof vi.fn>;
		disposeMock: ReturnType<typeof vi.fn>;
	} = {
		initMock: vi.fn().mockResolvedValue(undefined),
		showMock: vi.fn(),
		disposeMock: vi.fn(),
		init: (user) => adapter.initMock(user),
		show: () => adapter.showMock(),
		subscribe: (next) => {
			handlers = next;
			return () => {
				handlers = null;
			};
		},
		dispose: () => adapter.disposeMock(),
		emitShow: () => handlers?.onShow(),
		emitHide: () => handlers?.onHide(),
	};
	return adapter;
}

function wrapper({ children }: PropsWithChildren) {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function gtagSpy() {
	const gtag = vi.fn();
	(window as unknown as { gtag?: unknown }).gtag = gtag;
	return gtag;
}

describe('useSupportChat', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		delete (window as unknown as { gtag?: unknown }).gtag;
		mockUseUser.mockReturnValue({ user: USER, loading: false, error: null, refetch: vi.fn() });
		mockGetTenantById.mockResolvedValue({ id: 'tenant_1', name: 'Ada Tenant', metadata: {} });
		mockUpdateTenant.mockResolvedValue({ id: 'tenant_1' });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('initialises the adapter with the identified user', async () => {
		const adapter = createFakeAdapter();
		renderHook(() => useSupportChat(adapter, FLOW), { wrapper });

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledOnce());
		expect(adapter.initMock).toHaveBeenCalledWith({
			id: 'user_1',
			email: 'ada@example.com',
			name: 'Ada Tenant',
			createdAt: new Date('2024-01-01T00:00:00Z').getTime(),
			tenantId: 'tenant_1',
		});
	});

	it('opens the messenger through the adapter', async () => {
		const adapter = createFakeAdapter();
		const { result } = renderHook(() => useSupportChat(adapter, FLOW), { wrapper });

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledOnce());
		// Flush the microtask that resolves init() and flips status to Ready.
		await act(async () => undefined);
		act(() => result.current.open());

		expect(adapter.showMock).toHaveBeenCalledOnce();
	});

	it('does not open while the adapter has failed to initialise', async () => {
		const adapter = createFakeAdapter();
		adapter.initMock.mockRejectedValue(new Error('widget unavailable'));
		const { result } = renderHook(() => useSupportChat(adapter, FLOW), { wrapper });

		await waitFor(() => expect(mockLogError).toHaveBeenCalledOnce());
		act(() => result.current.open());

		expect(adapter.showMock).not.toHaveBeenCalled();
	});

	it('emits the gtag opened event when the messenger becomes visible', async () => {
		const gtag = gtagSpy();
		const adapter = createFakeAdapter();
		renderHook(() => useSupportChat(adapter, FLOW), { wrapper });

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledOnce());
		await act(async () => undefined);
		act(() => adapter.emitShow());

		expect(gtag).toHaveBeenCalledWith('event', 'intercom_messenger_opened', {
			user_id: 'user_1',
			tenant_id: 'tenant_1',
		});
	});

	it('marks the tenant onboarded when the messenger is dismissed', async () => {
		const adapter = createFakeAdapter();
		renderHook(() => useSupportChat(adapter, FLOW), { wrapper });

		await waitFor(() => expect(mockGetTenantById).toHaveBeenCalled());
		act(() => adapter.emitShow());
		act(() => adapter.emitHide());

		await waitFor(() => expect(mockUpdateTenant).toHaveBeenCalledOnce());
		expect(mockUpdateTenant).toHaveBeenCalledWith({
			name: 'Ada Tenant',
			metadata: { onboarding_completed: 'true' },
		});
		await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith(FLOW.toastSuccessMarkOnboarded));
	});

	it('does not mark the tenant onboarded when onboarding is already complete', async () => {
		mockGetTenantById.mockResolvedValue({
			id: 'tenant_1',
			name: 'Ada Tenant',
			metadata: { onboarding_completed: 'true' },
		});
		const adapter = createFakeAdapter();
		renderHook(() => useSupportChat(adapter, FLOW), { wrapper });

		await waitFor(() => expect(mockGetTenantById).toHaveBeenCalled());
		act(() => adapter.emitShow());
		act(() => adapter.emitHide());

		expect(mockUpdateTenant).not.toHaveBeenCalled();
	});

	it('marks the tenant onboarded only once across repeated hide events', async () => {
		const adapter = createFakeAdapter();
		renderHook(() => useSupportChat(adapter, FLOW), { wrapper });

		await waitFor(() => expect(mockGetTenantById).toHaveBeenCalled());
		act(() => adapter.emitShow());
		act(() => {
			adapter.emitHide();
			adapter.emitHide();
			adapter.emitHide();
		});

		await waitFor(() => expect(mockUpdateTenant).toHaveBeenCalledOnce());
	});

	it('ignores a hide that arrives without a preceding show', async () => {
		const adapter = createFakeAdapter();
		renderHook(() => useSupportChat(adapter, FLOW), { wrapper });

		await waitFor(() => expect(mockGetTenantById).toHaveBeenCalled());
		act(() => adapter.emitHide());

		expect(mockUpdateTenant).not.toHaveBeenCalled();
	});

	it('never puts email or name into the gtag payload', async () => {
		const gtag = gtagSpy();
		const adapter = createFakeAdapter();
		renderHook(() => useSupportChat(adapter, FLOW), { wrapper });

		await waitFor(() => expect(mockGetTenantById).toHaveBeenCalled());
		act(() => adapter.emitShow());
		act(() => adapter.emitHide());

		const serialised = JSON.stringify(gtag.mock.calls);
		expect(serialised).not.toContain('ada@example.com');
		expect(serialised).not.toContain('Ada Tenant');
	});

	it('records the messenger as seen in localStorage on close', async () => {
		const adapter = createFakeAdapter();
		renderHook(() => useSupportChat(adapter, FLOW), { wrapper });

		await waitFor(() => expect(mockGetTenantById).toHaveBeenCalled());
		act(() => adapter.emitShow());
		act(() => adapter.emitHide());

		expect(localStorage.getItem('intercom_messenger_seen')).toBe('true');
	});

	it('toasts an error when marking the tenant onboarded fails', async () => {
		mockUpdateTenant.mockRejectedValue(new Error('network down'));
		const adapter = createFakeAdapter();
		renderHook(() => useSupportChat(adapter, FLOW), { wrapper });

		await waitFor(() => expect(mockGetTenantById).toHaveBeenCalled());
		act(() => adapter.emitShow());
		act(() => adapter.emitHide());

		await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(FLOW.toastErrorMarkOnboarded));
	});

	it('opens the messenger when the command palette action fires', async () => {
		const adapter = createFakeAdapter();
		renderHook(() => useSupportChat(adapter, FLOW), { wrapper });

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledOnce());
		await act(async () => undefined);
		act(() => {
			window.dispatchEvent(new CustomEvent('command-palette:action:open-intercom'));
		});

		expect(adapter.showMock).toHaveBeenCalledOnce();
	});

	it('auto-opens after the inactivity delay while onboarding is incomplete', async () => {
		const adapter = createFakeAdapter();
		renderHook(() => useSupportChat(adapter, FLOW), { wrapper });
		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledOnce());
		await waitFor(() => expect(mockGetTenantById).toHaveBeenCalled());
		await act(async () => undefined);

		vi.useFakeTimers();
		act(() => {
			vi.advanceTimersByTime(FLOW.inactivityOpenDelayMs);
		});

		await waitFor(() => expect(adapter.showMock).toHaveBeenCalled());
	});

	it('disposes the adapter on unmount', async () => {
		const adapter = createFakeAdapter();
		const { unmount } = renderHook(() => useSupportChat(adapter, FLOW), { wrapper });

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledOnce());
		unmount();

		expect(adapter.disposeMock).toHaveBeenCalledOnce();
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/core/services/support-chat/useSupportChat.test.tsx`

Expected: FAIL — `Failed to resolve import "./useSupportChat"`.

- [ ] **Step 3: Write the implementation**

Create `src/core/services/support-chat/useSupportChat.ts`:

```ts
import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import TenantApi from '@/api/TenantApi';
import type { SupportChatFlowConfig } from '@/config/support-chat';
import { CommandPaletteActionId, getCommandPaletteActionEventName } from '@/core/actions';
import { errorLogger } from '@/core/services/error/ErrorLoggingService';
import useUser from '@/hooks/useUser';
import { SupportChatStatus, SupportChatStorageValue, SupportChatVisibility } from '@/models/SupportChat';
import { TenantMetadataFlag, TenantMetadataKey } from '@/models/Tenant';
import type { SupportChatAdapter } from './SupportChatAdapter';
import { refetchQueries } from '../tanstack/ReactQueryProvider';

type GtagFn = (...args: unknown[]) => void;

function getGtag(): GtagFn | null {
	if (typeof window === 'undefined') return null;
	const candidate = (window as unknown as { gtag?: GtagFn }).gtag;
	return typeof candidate === 'function' ? candidate : null;
}

/**
 * Every behaviour the support-chat messenger has, independent of provider.
 * The adapter supplies only: identify, open, and open/close events.
 */
export function useSupportChat(adapter: SupportChatAdapter, flow: SupportChatFlowConfig) {
	const { user } = useUser();

	// Primitives, not the `user` object: TanStack Query hands back a fresh reference
	// on every refetch, and depending on that would re-init the SDK on each one.
	const userId = user?.id;
	const userEmail = user?.email;
	const tenantId = user?.tenant?.id;
	const tenantName = user?.tenant?.name;
	const tenantCreatedAt = user?.tenant?.created_at;

	const visibility = useRef<SupportChatVisibility>(SupportChatVisibility.Unknown);
	const status = useRef<SupportChatStatus>(SupportChatStatus.Idle);
	const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const { data: tenant, isLoading: isTenantLoading } = useQuery({
		queryKey: ['tenant'],
		queryFn: async () => {
			return await TenantApi.getTenantById(tenantId ?? '');
		},
		enabled: !!tenantId,
	});

	const { mutate: markTenantOnboarded } = useMutation({
		mutationFn: () =>
			TenantApi.updateTenant({
				name: tenant?.name || '',
				metadata: {
					...tenant?.metadata,
					[TenantMetadataKey.ONBOARDING_COMPLETED]: TenantMetadataFlag.True,
				},
			}),
		onSuccess: async () => {
			await refetchQueries(['user', 'tenant']);
			toast.success(flow.toastSuccessMarkOnboarded);
		},
		onError: (error: Error) => {
			errorLogger.logError(error, undefined, { scope: 'support-chat', action: 'mark-tenant-onboarded' });
			toast.error(flow.toastErrorMarkOnboarded);
		},
	});

	const isOnboardingCompleted = useCallback(() => {
		return tenant?.metadata?.[TenantMetadataKey.ONBOARDING_COMPLETED] === TenantMetadataFlag.True;
	}, [tenant?.metadata]);

	const handleShow = useCallback(() => {
		if (visibility.current === SupportChatVisibility.Open) return;
		visibility.current = SupportChatVisibility.Open;

		if (flow.trackGtagEvents) {
			getGtag()?.('event', flow.gtagOpenedEvent, {
				user_id: userId,
				tenant_id: tenantId,
			});
		}
	}, [flow.trackGtagEvents, flow.gtagOpenedEvent, userId, tenantId]);

	const handleHide = useCallback(() => {
		// A close only counts if we saw the messenger open. Also collapses repeated
		// hide events (poll edge + postMessage) into a single close.
		if (visibility.current !== SupportChatVisibility.Open) return;
		visibility.current = SupportChatVisibility.Closed;

		const onboardingCompleted = isOnboardingCompleted();

		if (flow.markCompletedOnClose && !onboardingCompleted && userId && tenant) {
			markTenantOnboarded();
		}

		if (flow.trackGtagEvents) {
			getGtag()?.('event', flow.gtagClosedEvent, {
				user_id: userId,
				tenant_id: tenantId,
				onboarding_completed: onboardingCompleted,
			});
		}

		if (flow.persistMessengerSeenToStorage && typeof window !== 'undefined') {
			localStorage.setItem(flow.messengerSeenStorageKey, SupportChatStorageValue.Seen);
		}
	}, [
		flow.markCompletedOnClose,
		flow.trackGtagEvents,
		flow.gtagClosedEvent,
		flow.persistMessengerSeenToStorage,
		flow.messengerSeenStorageKey,
		isOnboardingCompleted,
		markTenantOnboarded,
		tenant,
		userId,
		tenantId,
	]);

	// Stable indirection so the init effect below does not re-run when the
	// handlers' identity changes (they depend on tenant + user).
	const handleShowRef = useRef(handleShow);
	const handleHideRef = useRef(handleHide);
	handleShowRef.current = handleShow;
	handleHideRef.current = handleHide;

	const open = useCallback(() => {
		if (status.current !== SupportChatStatus.Ready) return;
		adapter.show();
	}, [adapter]);

	// Boot the provider and wire visibility events.
	useEffect(() => {
		if (!userId) return;

		let cancelled = false;
		status.current = SupportChatStatus.Initializing;

		const unsubscribe = adapter.subscribe({
			onShow: () => handleShowRef.current(),
			onHide: () => handleHideRef.current(),
		});

		adapter
			.init({
				id: userId,
				email: userEmail,
				name: tenantName,
				createdAt: tenantCreatedAt ? new Date(tenantCreatedAt).getTime() : undefined,
				tenantId,
			})
			.then(() => {
				if (!cancelled) status.current = SupportChatStatus.Ready;
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				status.current = SupportChatStatus.Failed;
				errorLogger.logError(error instanceof Error ? error : new Error(String(error)), undefined, {
					scope: 'support-chat',
					action: 'init',
				});
			});

		return () => {
			cancelled = true;
			unsubscribe();
			adapter.dispose();
		};
	}, [adapter, userId, userEmail, tenantName, tenantCreatedAt, tenantId]);

	// Open from the command palette (Cmd+K → Open <provider>).
	useEffect(() => {
		const eventName = getCommandPaletteActionEventName(CommandPaletteActionId.OpenIntercom);
		const handler = () => open();
		window.addEventListener(eventName, handler);
		return () => window.removeEventListener(eventName, handler);
	}, [open]);

	const resetInactivityTimer = useCallback(() => {
		if (!flow.autoOpenOnInactivity) return;

		if (inactivityTimer.current) {
			clearTimeout(inactivityTimer.current);
		}

		if (!isOnboardingCompleted()) {
			inactivityTimer.current = setTimeout(() => {
				open();
			}, flow.inactivityOpenDelayMs);
		}
	}, [flow.autoOpenOnInactivity, flow.inactivityOpenDelayMs, isOnboardingCompleted, open]);

	// Auto-open for users who have not completed onboarding.
	useEffect(() => {
		if (!flow.autoOpenOnInactivity) return;

		if (inactivityTimer.current) {
			clearTimeout(inactivityTimer.current);
			inactivityTimer.current = null;
		}

		if (!userId || isTenantLoading || isOnboardingCompleted()) return;

		const activityEvents = flow.activityEvents;
		activityEvents.forEach((event) => {
			window.addEventListener(event, resetInactivityTimer, { passive: true });
		});

		resetInactivityTimer();

		return () => {
			if (inactivityTimer.current) {
				clearTimeout(inactivityTimer.current);
				inactivityTimer.current = null;
			}
			activityEvents.forEach((event) => {
				window.removeEventListener(event, resetInactivityTimer);
			});
		};
	}, [flow.autoOpenOnInactivity, flow.activityEvents, userId, isTenantLoading, isOnboardingCompleted, resetInactivityTimer]);

	return { open };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/core/services/support-chat/useSupportChat.test.tsx`

Expected: PASS — 14 tests.

If the inactivity test is flaky because `vi.useFakeTimers()` is enabled after the query resolves, move the `vi.useFakeTimers()` call to the top of that test's body and use `await vi.advanceTimersByTimeAsync(...)` instead. Do not weaken the assertion.

- [ ] **Step 5: Commit**

```bash
git add src/core/services/support-chat/useSupportChat.ts src/core/services/support-chat/useSupportChat.test.tsx
git commit --no-verify -m "feat(support-chat): add the provider-agnostic behaviour hook"
```

---

## Task 10: The SupportChat component

**Files:**
- Create: `src/core/services/support-chat/SupportChat.tsx`

No new test file — the button markup is a one-liner reproduced from `IntercomMessenger.tsx`, and every behaviour behind it is covered by Task 9. Task 11 verifies it renders in place.

- [ ] **Step 1: Write the component**

Create `src/core/services/support-chat/SupportChat.tsx`:

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BotMessageSquare } from 'lucide-react';
import { Button } from '@/components/atoms';
import { getActiveSupportChatProvider, SUPPORT_CHAT_FLOW } from '@/config/support-chat';
import type { SupportChatProvider } from '@/models/SupportChat';
import { createSupportChatAdapter } from './adapters';
import { useSupportChat } from './useSupportChat';

/** Mounted only when a provider is configured; owns SDK init and onboarding/help behavior. */
const SupportChatImpl = ({ provider }: { provider: SupportChatProvider }) => {
	const { t } = useTranslation('common');
	const flow = SUPPORT_CHAT_FLOW[provider];
	const adapter = useMemo(() => createSupportChatAdapter(provider, flow), [provider, flow]);
	const { open } = useSupportChat(adapter, flow);

	return (
		<Button size='sm' variant='outline' onClick={open}>
			<BotMessageSquare absoluteStrokeWidth />
			{t('chrome.help')}
		</Button>
	);
};

/** Renders nothing when no provider is enabled or its app id is missing (see `@/config/support-chat`). */
const SupportChat = () => {
	const provider = getActiveSupportChatProvider();
	if (!provider) return null;
	return <SupportChatImpl provider={provider} />;
};

export default SupportChat;
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "support-chat" || echo "no errors in support-chat"`

Expected: `no errors in support-chat`.

- [ ] **Step 3: Commit**

```bash
git add src/core/services/support-chat/SupportChat.tsx
git commit --no-verify -m "feat(support-chat): add the provider-agnostic SupportChat component"
```

---

## Task 11: Wire it up and shim the old component

**Files:**
- Modify: `src/core/services/intercom/IntercomMessenger.tsx` (replace contents with a shim)
- Modify: `src/components/molecules/BreadCrumbs/BreadCrumbs.tsx`
- Modify: `src/components/organisms/CommandPalette/CommandPalette.tsx`
- Modify: `src/config/command-palette/commands.ts`
- Modify: `src/core/actions/command-palette-actions.ts`

- [ ] **Step 1: Replace IntercomMessenger with a shim**

Replace the **entire contents** of `src/core/services/intercom/IntercomMessenger.tsx` with:

```tsx
/**
 * @deprecated Use `@/core/services/support-chat/SupportChat`.
 *
 * Backward-compatibility shim. Contains a re-export only — no logic. The default
 * export still renders the header Help button and drives whichever support-chat
 * provider is configured. Remove once no in-repo imports remain.
 */
export { default } from '../support-chat/SupportChat';
```

`src/core/services/intercom/index.css` stays exactly where it is — the Intercom adapter imports it.

- [ ] **Step 2: Point BreadCrumbs at the new component**

In `src/components/molecules/BreadCrumbs/BreadCrumbs.tsx`, replace this import (line 10):

```tsx
import IntercomMessenger from '@/core/services/intercom/IntercomMessenger';
```

with:

```tsx
import SupportChat from '@/core/services/support-chat/SupportChat';
```

and replace the usage (around line 102):

```tsx
					<IntercomMessenger />
```

with:

```tsx
					<SupportChat />
```

- [ ] **Step 3: Gate the command palette on any provider**

In `src/components/organisms/CommandPalette/CommandPalette.tsx`, replace this import (line 14):

```tsx
import { isIntercomMessengerAvailable } from '@/config/intercom';
```

with:

```tsx
import { isSupportChatAvailable } from '@/config/support-chat';
```

and replace the filter condition (around line 76):

```tsx
			if (cmd.actionId === CommandPaletteActionId.OpenIntercom && !isIntercomMessengerAvailable()) {
```

with:

```tsx
			if (cmd.actionId === CommandPaletteActionId.OpenIntercom && !isSupportChatAvailable()) {
```

Only the predicate changes. `CommandPaletteActionId.OpenIntercom` keeps its name and its `'open-intercom'` value — it is the event name on the bus and is frozen for backward compatibility.

- [ ] **Step 4: Make the command label provider-aware**

In `src/config/command-palette/commands.ts`, add this import alongside the existing ones:

```ts
import { getSupportChatCommandLabel } from '@/config/support-chat';
```

and change the command's static label (around line 113) from:

```ts
		label: 'Open Intercom',
```

to:

```ts
		label: getSupportChatCommandLabel(),
```

Also extend its keywords on the following line so both provider names are searchable:

```ts
		keywords: ['chat', 'support', 'messenger', 'help', 'intercom', 'pylon'],
```

- [ ] **Step 5: Update the action doc comment**

In `src/core/actions/command-palette-actions.ts`, change the comment above `OpenIntercom` (line 27) from:

```ts
	/** Open Intercom messenger (IntercomMessenger subscribes). */
```

to:

```ts
	/**
	 * Open the support-chat messenger (`useSupportChat` subscribes).
	 * The id value stays `open-intercom` for backward compatibility — it is the
	 * event name on the bus and predates Pylon support.
	 */
```

Do **not** change the id or its value.

- [ ] **Step 6: Verify no stale references remain**

Run: `grep -rn "IntercomMessenger\|isIntercomMessengerAvailable" src/ --include="*.ts" --include="*.tsx" | grep -v "config/intercom" | grep -v "services/intercom"`

Expected: no output. Any hit outside the two shim files means something still imports the old path directly.

- [ ] **Step 7: Run the full test suite**

Run: `npx vitest run`

Expected: PASS. All 72 pre-existing test files plus the 7 new ones.

- [ ] **Step 8: Run the linter**

Run: `npx eslint src/`

Expected: zero errors.

- [ ] **Step 9: Commit**

```bash
git add src/core/services/intercom/IntercomMessenger.tsx src/components/molecules/BreadCrumbs/BreadCrumbs.tsx src/components/organisms/CommandPalette/CommandPalette.tsx src/config/command-palette/commands.ts src/core/actions/command-palette-actions.ts
git commit --no-verify -m "feat(support-chat): mount SupportChat and shim the deprecated IntercomMessenger"
```

---

## Task 12: Verification

**Files:** none — this task only runs checks and reports.

- [ ] **Step 1: Confirm the full suite is green**

Run: `npx vitest run 2>&1 | tail -20`

Expected: `Test Files  N passed`, `Tests  M passed`, zero failures.

- [ ] **Step 2: Confirm the linter is clean**

Run: `npx eslint src/`

Expected: no output (zero errors, zero warnings).

- [ ] **Step 3: Confirm this change introduced no new type errors**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -Ev "calendar\.tsx|DatePicker\.tsx|DateRangePicker\.tsx|DateTimePicker\.tsx|SortDropdown\.stories\.tsx" | grep "error TS" || echo "no new type errors"`

Expected: `no new type errors`. The excluded files are the pre-existing failures described at the top of this plan.

- [ ] **Step 4: Verify the Intercom-only default is unchanged**

Run: `npx vitest run src/config/ src/models/SupportChat.test.ts`

Expected: PASS. These are the tests that lock the gtag event names, the localStorage key, the flow defaults, and the shim behaviour to their pre-Pylon values.

- [ ] **Step 5: Manually smoke-test Pylon**

Add to a local `.env`:

```bash
VITE_INTERCOM_ENABLED=false
VITE_PYLON_ENABLED=true
VITE_PYLON_APP_ID=<a real app id from the Pylon dashboard>
```

Then start the dev server via the preview tooling (**not** `npm run dev` in a shell) and confirm:

1. The Help button renders in the header.
2. Clicking it opens the Pylon widget.
3. No floating Pylon chat bubble is visible.
4. Dismissing the widget marks the tenant onboarded (toast appears for a tenant whose onboarding was incomplete).
5. `Cmd+K` shows "Open Pylon" and opens the widget.
6. The browser console has no CSP or script-load errors.

- [ ] **Step 6: Report**

State plainly: which checks passed, the exact test counts, and anything skipped. If step 5 could not be run because no Pylon app id was available, say so explicitly rather than implying it passed.

---

## Notes for the implementer

- **Do not** try to fix `npm run build`. The `react-day-picker` and Storybook type errors predate this work.
- **Do not** change any value in `SupportChatAnalyticsEvent`, `SupportChatStorageKey`, `TenantMetadataFlag`, or `CommandPaletteActionId`. Task 1 and Task 3 have tests asserting these exact strings for a reason.
- **Do not** add JWT identity verification. The async `init()` signature is the seam; the backend endpoint does not exist yet. The spec's Security section lists the rules to follow when it does.
- If a conformance test fails, fix the adapter, not the test.
