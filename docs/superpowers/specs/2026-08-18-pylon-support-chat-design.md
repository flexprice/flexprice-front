# Pylon Support Chat — Design

**Date:** 2026-08-18
**Status:** Approved, ready for implementation planning

## Problem

The dashboard supports exactly one support-chat provider: Intercom, hard-wired into
`src/core/services/intercom/IntercomMessenger.tsx`. We need Pylon as a second option, with
identical UI and behaviour, so that a production environment can enable one provider or the
other via environment configuration.

Two constraints govern the whole design:

1. **Typed enums only.** No literal string comparisons anywhere in new or rewritten code.
2. **Fully backward compatible.** Nothing existing is deleted, renamed, or has its value
   changed. With `VITE_PYLON_*` unset, the app behaves byte-identically to today — same gtag
   event names, same `localStorage` key, same 15-minute timer, same command-palette label.

## Current behaviour (must be preserved exactly)

`IntercomMessenger.tsx` owns a bundle of behaviour that is *not* Intercom-specific:

- Renders a "Help" button (`Button`, `BotMessageSquare`, i18n key `chrome.help`) in the
  `BreadCrumbs` header.
- Subscribes to the command-palette action `open-intercom` (Cmd+K → "Open Intercom").
- Auto-opens the messenger after 15 minutes of inactivity, but only while the tenant's
  `onboarding_completed` metadata is not `'true'`. Any of `mousemove`, `keydown`, `scroll`,
  `touchstart` resets the timer.
- On close: if onboarding was incomplete, PATCHes tenant metadata to
  `onboarding_completed: 'true'`, refetches `['user', 'tenant']`, and toasts success/failure.
- Emits gtag `intercom_messenger_opened` / `intercom_messenger_closed` with `user_id`,
  `tenant_id`, `onboarding_completed`.
- Writes `localStorage['intercom_messenger_seen'] = 'true'` on close.
- Hides Intercom's default launcher (`hide_default_launcher: true` plus CSS in `index.css`).

Only the last item, plus SDK init and open/close *detection*, is provider-specific.

## Decisions taken

| Question | Decision |
|---|---|
| Identity verification | **Ship without it.** No backend endpoint exists to sign a Pylon JWT. Design leaves an async seam (below). |
| Provider config | **Parallel env vars** mirroring Intercom: `VITE_PYLON_ENABLED`, `VITE_PYLON_APP_ID`. |
| Both enabled | **Intercom wins**, preserving today's behaviour. Warned at runtime. |
| Architecture | **Shared behaviour hook + thin provider adapters.** |

## Architecture

```
src/models/SupportChat.ts                    provider-agnostic domain enums
src/types/dom.ts                             UserActivityEvent, DocumentReadyState
src/types/env.ts                             EnvFlag
src/config/support-chat.ts                   provider resolution + flow config
src/core/services/support-chat/
├── SupportChatAdapter.ts                    adapter interface + SupportChatUser
├── adapters/intercom.ts                     npm SDK; polling-based visibility detection
├── adapters/pylon.ts                        script injection; native onShow/onHide
├── useSupportChat.ts                        ALL shared behaviour
└── SupportChat.tsx                          resolves adapter, renders Help button
```

### Adapter contract

`src/core/services/support-chat/SupportChatAdapter.ts`:

```ts
export interface SupportChatUser {
  id: string;
  email?: string;
  name?: string;
  createdAt?: number;
  tenantId?: string;
}

export interface SupportChatAdapter {
  /**
   * Load the SDK and identify the user.
   * Async by design: this is the seam where a signed identity token is fetched
   * once a backend endpoint exists. Rejects if the SDK cannot be loaded.
   */
  init(user: SupportChatUser): Promise<void>;

  /** Open the messenger. No-op (never throws) if init failed or has not completed. */
  show(): void;

  /** Register visibility handlers. The returned function removes those handlers only. */
  subscribe(handlers: { onShow: () => void; onHide: () => void }): () => void;

  /** Tear down the adapter instance. Called exactly once, on unmount. */
  dispose(): void;
}
```

**Lifecycle ownership is deliberately non-overlapping:** `subscribe()`'s return value removes
handlers; `dispose()` releases adapter-level resources (poll intervals, `disposed` flag). There
is no ambiguity about which teardown owns what.

### Lifecycle sequence

```
SupportChat mounts
  → getActiveSupportChatProvider()
      → null            → render null (identical to today when Intercom is disabled)
      → Intercom | Pylon → construct adapter
  → useSupportChat(adapter, flowConfig)
      → status = Initializing; await adapter.init(user)   [on user.id change]
          → resolve → status = Ready
          → reject  → status = Failed, ErrorLoggingService.logError, show() no-ops
      → adapter.subscribe({ onShow, onHide })
      → attach activity listeners + inactivity timer (if onboarding incomplete)
      → subscribe to command-palette action event
  → user opens (button / Cmd+K / inactivity) → adapter.show() → onShow
  → user dismisses                            → onHide → tenant PATCH + gtag + storage
SupportChat unmounts
  → unsubscribe handlers → remove listeners → clear timers → adapter.dispose()
```

### Adapter responsibilities

| Concern | Intercom adapter | Pylon adapter |
|---|---|---|
| Load | `@intercom/messenger-js-sdk` (npm) | inject `https://widget.usepylon.com/widget/{appId}` |
| Identify | `Intercom({ app_id, user_id, name, email, created_at })` | set `window.pylon.chat_settings` **before** script insert |
| Hide launcher | `hide_default_launcher: true` + existing `index.css` | `Pylon(PylonCommand.HideChatBubble)` |
| Open | `Intercom(IntercomCommand.Show)` | `Pylon(PylonCommand.Show)` |
| Visibility events | 1s poll of `IsVisible` + `postMessage` listener | native `Pylon(PylonCommand.OnShow / OnHide)` |

Intercom fires no reliable close event, hence the poll. Pylon fires `onHide` natively. Both
funnel into the same `onHide` handler, so **dismissing the Pylon widget marks the tenant
onboarded exactly as dismissing Intercom does.**

Pylon exposes no way to *un*register `onShow`/`onHide`. Its `subscribe` therefore registers once
and routes through a mutable handler ref; `dispose()` sets a `disposed` flag so late callbacks
after unmount are dropped.

`avatar_url`, `account_id`, and `account_external_id` are omitted — no source for them today.

## Typed enums

`src/models/SupportChat.ts` — provider-agnostic only:

```ts
export enum SupportChatProvider {
  Intercom = 'intercom',
  Pylon = 'pylon',
}

export enum SupportChatVisibility {
  Unknown = 'unknown',
  Open = 'open',
  Closed = 'closed',
}

export enum SupportChatStatus {
  Idle = 'idle',
  Initializing = 'initializing',
  Ready = 'ready',
  Failed = 'failed',
}

export enum SupportChatAnalyticsEvent {
  IntercomOpened = 'intercom_messenger_opened',
  IntercomClosed = 'intercom_messenger_closed',
  PylonOpened = 'pylon_messenger_opened',
  PylonClosed = 'pylon_messenger_closed',
}

export enum SupportChatStorageKey {
  IntercomSeen = 'intercom_messenger_seen',
  PylonSeen = 'pylon_messenger_seen',
}
```

Wire-protocol enums live **beside their adapter**, not in `models/` — they describe a
third-party SDK's call surface, not a domain concept:

```ts
// adapters/pylon.ts
enum PylonCommand {
  Show = 'show',
  Hide = 'hide',
  OnShow = 'onShow',
  OnHide = 'onHide',
  HideChatBubble = 'hideChatBubble',
}

// adapters/intercom.ts
enum IntercomCommand { Show = 'show', Hide = 'hide', IsVisible = 'isVisible' }
enum IntercomPostMessageType {
  Hide = 'intercom:hide',
  Show = 'intercom:show',
  BareHide = 'hide',
  BareShow = 'show',
}
```

`src/types/dom.ts` (new, shared):

```ts
export enum UserActivityEvent {
  MouseMove = 'mousemove',
  KeyDown = 'keydown',
  Scroll = 'scroll',
  TouchStart = 'touchstart',
}

export enum DocumentReadyState { Complete = 'complete' }
```

`src/types/env.ts` (new) — `EnvFlag` is a config concern, not a DOM one:

```ts
export enum EnvFlag { True = 'true', False = 'false' }
```

Applied to the new Pylon lines only. Existing `=== 'true'` reads in `config.ts` are left
untouched to keep the diff minimal and the change provably behaviour-neutral.

Additive to `src/models/Tenant.ts` (existing `TenantMetadataKey` untouched):

```ts
export enum TenantMetadataFlag { True = 'true', False = 'false' }
```

**Enum-typed config fields.** The flow config narrows its string fields from `string` to these
enums, so a typo becomes a compile error rather than a silently dead analytics event:

```ts
export interface SupportChatFlowConfig {
  hideDefaultLauncher: boolean;
  inactivityOpenDelayMs: number;
  statePollIntervalMs: number;
  activityEvents: readonly UserActivityEvent[];
  autoOpenOnInactivity: boolean;
  markCompletedOnClose: boolean;
  trackGtagEvents: boolean;
  persistMessengerSeenToStorage: boolean;
  gtagOpenedEvent: SupportChatAnalyticsEvent;
  gtagClosedEvent: SupportChatAnalyticsEvent;
  messengerSeenStorageKey: SupportChatStorageKey;
  toastSuccessMarkOnboarded: string;
  toastErrorMarkOnboarded: string;
}

export const SUPPORT_CHAT_FLOW: Record<SupportChatProvider, SupportChatFlowConfig>;
```

The `Record` is **total by construction** — adding a provider to the enum is a compile error
until its flow config is supplied. `SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom]` holds
today's exact values.

**Literal comparisons eliminated:**
`metadata === 'true'` → `TenantMetadataFlag.True`;
`event.data.type === 'intercom:hide'` → `IntercomPostMessageType.Hide`;
`window.Intercom('isVisible' | 'show')` → `IntercomCommand.*`;
`import.meta.env.VITE_PYLON_ENABLED === 'true'` → `EnvFlag.True`;
the `isIntercomOpen` / `hideEventTriggered` boolean pair → `SupportChatVisibility`.

### Visibility state machine

The current component tracks two booleans that must be kept in sync by hand. They collapse into
one enum:

```ts
// "fire hide exactly once per close" becomes a single readable guard
const handleHide = () => {
  if (visibility.current !== SupportChatVisibility.Open) return;
  visibility.current = SupportChatVisibility.Closed;
  // ...tenant PATCH, gtag, storage
};
```

## Configuration

`src/config/config.ts` — additive; `config.intercom` is untouched:

```ts
export interface PylonConfig {
  enabled: boolean;
  appId: string;
}

pylon: {
  enabled: import.meta.env.VITE_PYLON_ENABLED === EnvFlag.True,
  appId: import.meta.env.VITE_PYLON_APP_ID ?? '',
},
```

`src/config/support-chat.ts`:

```ts
/** Intercom takes precedence when both are enabled, preserving pre-Pylon behaviour. */
export function getActiveSupportChatProvider(): SupportChatProvider | null;

/** True when any provider is active. Used by CommandPalette to gate the chat command. */
export function isSupportChatAvailable(): boolean;
```

```ts
/** Command-palette label for the active provider. Pure env read, safe at module load. */
export function getSupportChatCommandLabel(): string;
```

A provider is active only when `enabled === true` **and** its app id is non-empty after trim.
When both are enabled, a `console.warn` naming the ignored provider is emitted in non-production
builds only (guarded by `config.app.isProd`) — this is a configuration mistake, not a runtime
error, so it does not go through `ErrorLoggingService`.

`SupportChat.tsx` constructs the adapter once via `useMemo` keyed on the resolved provider, so it
is never recreated across renders.

## Backward compatibility

Nothing is deleted, renamed, or revalued.

| Existing surface | Treatment |
|---|---|
| `src/config/intercom.ts` | **Kept** as a `@deprecated` re-export shim. `isIntercomMessengerAvailable()` **keeps its literal meaning** — Intercom specifically is active. `INTERCOM_MESSENGER_FLOW` re-exports `SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom]`, identical values. `IntercomMessengerFlowConfig` aliases `SupportChatFlowConfig`. |
| `src/core/services/intercom/IntercomMessenger.tsx` | **Kept** as `@deprecated export { default } from '../support-chat/SupportChat'`. |
| `src/core/services/intercom/index.css` | **Untouched**, imported by the Intercom adapter. |
| `CommandPaletteActionId.OpenIntercom = 'open-intercom'` | **Value frozen.** No alias added — a duplicate enum value would collide with the `COMMAND_PALETTE_ACTION_META` record keys. Doc comment updated only. |
| `CommandPaletteCommandId.actionOpenIntercom` | Unchanged. |
| `config.intercom` | Unchanged. `config.pylon` added alongside. |
| `VITE_INTERCOM_ENABLED` / `VITE_INTERCOM_APP_ID` / `VITE_APP_INTERCOM_APP_ID` | All honoured, same precedence. |

`CommandPalette.tsx` switches its gate from `isIntercomMessengerAvailable()` to the new
`isSupportChatAvailable()` — this is why the shim can keep the old function's original
semantics rather than quietly redefining it.

The one visible change: `commands.ts` uses `label: getSupportChatCommandLabel()`, evaluated at
module load (a pure env read, no side effects). It returns `'Open Intercom'` today and
`'Open Pylon'` when Pylon is the active provider.

**Shim policy:** shims contain re-exports only, zero logic. Marked
`@deprecated — remove once no in-repo imports remain`.

## Security

### Threat model — accepted risk

Without identity verification, a user's identity in the chat is determined client-side. Anyone
can set `window.pylon.chat_settings.email` before the widget initializes and appear as another
user **in the support inbox**. This grants no access to Flexprice data — the API is
independently authenticated — but it can mislead a support agent.

This is the **identical exposure Intercom has today** (no `user_hash` is sent). It is accepted
as a time-boxed risk, closed by a single change once a backend signing endpoint exists:

```ts
// adapters/pylon.ts, inside init()
chatSettings.jwt = await fetchIdentityToken();
```

Pylon's dashboard "Identity Verification" toggle must remain **off** until then, or the widget
will reject every session.

### Rules pre-committed for the JWT seam

- Fetched via the authenticated `AxiosClient` (`src/api/`), never a raw `fetch`.
- Never logged, never written to `localStorage` or `sessionStorage`.
- Re-fetched on every `init` and on user change — `exp` is capped at 15 minutes by Pylon.
- `email_hash` is never set alongside `jwt`.

### Hardening applied now

- **App id validation.** `appId` must match `/^[A-Za-z0-9_-]+$/` before it is interpolated into
  the script URL. A mis-set env var otherwise becomes URL injection into a `<script src>`.
  On failure: refuse to load, log via `ErrorLoggingService`, render the button as a no-op.
- **Script element attributes.** `async`, `crossOrigin='anonymous'`,
  `referrerPolicy='strict-origin-when-cross-origin'`.
- **No SRI.** Pylon's widget endpoint is versionless and served per-app-id, so a subresource
  integrity hash cannot be pinned. Documented rather than silently skipped.
- **CSP.** The repo ships no Content-Security-Policy (`vercel.json` sets no such header), so no
  allowlist change is required. If a CSP is added later, `https://widget.usepylon.com` must be
  allowlisted for `script-src`, plus Pylon's API and websocket origins for `connect-src`.
- **No PII in telemetry.** gtag payloads and `localStorage` carry `user_id` and `tenant_id`
  only — never email or name. Enforced by test.

## Error handling

`init` rejection is a defined state, not an exception that escapes:

- Hook sets `SupportChatStatus.Failed`.
- Logged through `ErrorLoggingService.getInstance().logError(...)` — the app's existing
  PostHog-backed service — not `console.error`.
- `show()` becomes a no-op. The Help button still renders (backward compatible) and never
  throws.

## Edge cases

| Case | Handling |
|---|---|
| Both providers enabled | Intercom wins; warning names the ignored provider |
| Provider enabled, app id empty | Treated as unavailable → `SupportChat` renders `null` (matches today) |
| Invalid app id format | Load refused, logged, `show()` no-ops |
| Pylon script fails to load | `SupportChatStatus.Failed`; button renders, `show()` no-ops |
| Auto-open fires before script loads | Queued by Pylon's own `n.q` queue, executes on load |
| Repeated hide events | Guarded by `SupportChatVisibility` — tenant PATCH fires once per close |
| User identity changes | Adapter re-inits on `user.id` change. **Known limitation:** Pylon documents no `reset`/`shutdown`, so a same-tab identity swap keeps the prior session. Acceptable because logout unmounts the app shell. Documented in the adapter. |
| SSR / no `window` | All adapter entry points guard on `typeof window` |

## Testing

Co-located `*.test.ts(x)`, Vitest + Testing Library, per `AGENTS.md`.

- **`adapters/conformance.test.ts`** — one parameterized suite run against **both** adapters,
  asserting the shared contract: `init` is idempotent; `show()` before `init` does not throw;
  `subscribe` fires both handlers; `dispose()` silences all callbacks; `init` rejection is
  surfaced as a rejected promise. A third provider inherits this suite for free.
- **`adapters/pylon.test.ts`** — script injected once; `chat_settings` shape; `hideChatBubble`
  called after init; `onShow`/`onHide` routing; app-id validation rejects malformed values.
- **`adapters/intercom.test.ts`** — polling synthesises show/hide; `postMessage` types map
  correctly via `IntercomPostMessageType`.
- **`useSupportChat.test.tsx`** — against a **fake adapter**, so it is provider-agnostic: close
  → PATCH only when onboarding incomplete; no double-PATCH on repeated hide; gtag payload
  contains no email or name; inactivity timer with fake timers; command-palette event opens.
- **`config/support-chat.test.ts`** — resolution precedence, both-enabled, empty app id.

**Test seam:** the Pylon script-load guard is a keyed map plus an `@internal`
`__resetPylonLoaderForTests()` export, so injection state does not leak between tests.

## Ops runbook

| Goal | Env |
|---|---|
| Intercom only (today's default) | `VITE_INTERCOM_ENABLED=true`, `VITE_INTERCOM_APP_ID=...`, Pylon vars unset |
| Pylon only | `VITE_INTERCOM_ENABLED=false`, `VITE_PYLON_ENABLED=true`, `VITE_PYLON_APP_ID=...` |
| No support chat | Both `*_ENABLED=false` |

Pylon dashboard setup: obtain the App ID from Chat Widget settings, set the widget colour,
enable "Chat Widget", and leave **Identity Verification off** until the backend signing
endpoint ships.

`.env.example` documents both blocks with the precedence rule inline.

## Files

**New (source)** — `src/models/SupportChat.ts`, `src/types/dom.ts`, `src/types/env.ts`,
`src/config/support-chat.ts`,
`src/core/services/support-chat/{SupportChatAdapter.ts,SupportChat.tsx,useSupportChat.ts,adapters/intercom.ts,adapters/pylon.ts}`.

**New (tests)** — `src/config/support-chat.test.ts`,
`src/core/services/support-chat/useSupportChat.test.tsx`,
`src/core/services/support-chat/adapters/{conformance,intercom,pylon}.test.ts`.

**Modified** — `src/config/config.ts` (`PylonConfig`), `src/models/Tenant.ts`
(`TenantMetadataFlag`), `.env.example`, `src/components/molecules/BreadCrumbs/BreadCrumbs.tsx`
(import swap), `src/components/organisms/CommandPalette/CommandPalette.tsx` (gate swap),
`src/config/command-palette/commands.ts` (dynamic label),
`src/core/actions/command-palette-actions.ts` (doc comment only).

**Shimmed** — `src/config/intercom.ts`, `src/core/services/intercom/IntercomMessenger.tsx`.

**Untouched** — `src/core/services/intercom/index.css`, `src/config/command-palette/ids.ts`.

## Out of scope

- JWT identity verification (the async `init` seam is in place; blocked on a backend endpoint).
- Pylon `setTheme` sync with the app's `ThemeToggle`.
- Unread-message-count badge.
- Ticket forms and knowledge-base deep links (`setTicketFormFields`, `showTicketForm`,
  `showKnowledgeBaseArticle`).

## References

- Pylon chat setup — https://docs.usepylon.com/pylon-docs/chat-widget/chat-setup
- Pylon identity verification (JWT) — https://docs.usepylon.com/pylon-docs/chat-widget/identity-verification
- Pylon JavaScript API — https://docs.usepylon.com/pylon-docs/chat-widget/javascript-api
