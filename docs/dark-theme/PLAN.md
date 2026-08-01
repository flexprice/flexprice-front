# Dark Theme — Rebuild Plan

Status: **Step 10 (connection drawers) complete.** Branch `feat/dark_theme`, tracking
`origin/feat/dark_theme`.

## Progress log

| Step | Scope                                                                    | State   |
| ---- | ------------------------------------------------------------------------ | ------- |
| 0    | Plan + measured inventory                                                | ✅      |
| 1    | Token layer + byte-identity guard (86 tokens)                            | ✅      |
| 2    | Theme store + `initTheme()` pre-paint, 11 tests                          | ✅      |
| 3    | `.dark` retuned to Midnight; sidebar chrome defined; `:root` guard added | ✅      |
| 4    | Settings → Appearance tab with the dark-mode toggle, 5 tests             | ✅      |
| 5    | App shell tokenized (6 files); token generator; 93 tokens                | ✅      |
| 6    | `components/ui/` shadcn primitives (9 files)                             | ✅      |
| 7    | `components/atoms/` A–F, mechanical (15 files); 95 tokens                | ✅      |
| 8    | `Chip` + `AppToaster` status/feedback palette; 107 tokens                | ✅      |
| 9    | `components/atoms/` G–Z (17 files); 113 tokens                           | ✅      |
| 10   | 15 connection drawers (283 replacements); 114 tokens                     | ✅      |
| 11+  | rest of `components/molecules/` — ~140 files, ~12 more commits           | ⬜ next |

Tokens are generated, not hand-written. To add one, edit `scripts/theme-tokens.mjs`, then:

```bash
node scripts/generate-theme-tokens.mjs && npx prettier --write src/index.css tailwind.config.js && npm run verify:theme
```

The generator only rewrites the regions between the `fp-tokens:begin` / `fp-tokens:end` markers, so
pre-existing `:root` values are never touched.

### Convention from Step 4 onward

New files use the `--fp-*` tokens directly (`bg-surface`, `text-content-muted`) rather than raw
palette classes. Light values are identical either way, and writing `bg-white` in a new file just
creates work for a later migration step.

Run the guard any time with:

```bash
npm run verify:theme
```

## Findings

### The stock shadcn `.dark` block is live and wrong (found in Step 2)

`src/index.css` already carried a `.dark` block from the original shadcn scaffold —
`--background: 0 0% 3.9%`, `--card: 0 0% 3.9%`, `--popover: 0 0% 3.9%`. It was dead code until
Step 2, because nothing could apply the `.dark` class. Now that the store can, those values go
live the instant dark is enabled, and they are **not** Midnight: near-black `#0a0a0a` panels,
with text that is still hardcoded `text-gray-900` sitting invisibly on top.

This is separate from the `--fp-*` layer and was not introduced by it. It has to be retuned before
the Settings toggle ships, otherwise the first thing a user sees on flipping the switch is a broken
screen. Hence the new Step 3, which pushes the toggle to Step 4 and shifts everything after it by one.

Retuning `.dark` does not touch light mode, so the byte-identity invariant is unaffected.

### `--sidebar-*` was never defined (found in Step 3)

`tailwind.config.js` has always referenced `hsl(var(--sidebar-background))` and seven siblings, but
no CSS file has ever defined them — on `main` either. So `bg-sidebar`, `text-sidebar-foreground`
and the rest (40 usages) resolve to an invalid declaration and paint **transparent**. Verified in
the browser: `bg-sidebar` → `rgba(0, 0, 0, 0)`.

Step 3 defines them **only inside `.dark`**. Light keeps rendering exactly as it does today (still
undefined, still transparent), while dark gets its Midnight chrome. Defining them in `:root` would
turn 40 no-op classes into painted colour and change light mode — so that is left alone.

### `muted.foreground` was an unthemable literal (found in Step 3)

`tailwind.config.js` hardcoded `muted: { foreground: '#64748B' }`, so the `--muted-foreground` CSS
variable was dead and retuning it for dark did nothing — leaving `text-muted-foreground`, at **250
usages the second most common colour class in the app**, stuck at its light value in dark mode.

Fixed by pointing it at `--fp-content-slate-muted`, whose light value is slate.500 = `#64748b`,
byte-identical to the literal it replaces and pinned by the guard. Confirmed in the browser: light
stays `rgb(100, 116, 139)`, dark becomes `rgb(138, 143, 152)`.

Two literals remain in `tailwind.config.js` on purpose: `blue.DEFAULT` / `blue.light` (migrating to
`brand-blue` at their call sites) and `sidebar['text-accent-foreground']` (zero usages).

### The shell used colours outside the Tailwind palette (found in Step 5)

Four of the shell's colours are not Tailwind values at all: `#f9f9f9` (sidebar canvas), `#ededed`
(active menu item), `#bababa` (promo card hairline) and `#092e44` (Flexprice navy). Two more —
gray-300 and zinc-200 — were already tokenized, but as _lines_, and the shell uses them as
_surfaces_, which must diverge in dark.

That added seven tokens (86 → 93). The four non-palette ones are declared as raw hex in
`scripts/theme-tokens.mjs`; the guard still pins them, it just compares against the literal instead
of a palette path.

`surface-selected` (#e4e4e7) and `surface-selected-alt` (#ededed) are the same state at two
near-identical light hexes — the same byte-identity debt as the zinc/slate ramps, and collapsible
on the same schedule.

### Not every `bg-white` is a surface (found in Step 6)

The switch thumb was `bg-white` while its checked track is `bg-primary`. `--primary` is near-black
in light but near-**white** in dark, so mapping the thumb to `surface` (or leaving it white) puts a
white thumb on a white track — measured contrast 1.06:1, i.e. invisible.

It is now `content-inverse`: `#ffffff` in light (byte-identical to the `bg-white` it replaced) and
`#0f0f10` in dark. Measured 17.93:1 in light, 16.65:1 in dark.

The lesson for the remaining steps: a colour's _role_ has to be read from what it sits on, not
matched by hex. A purely mechanical `bg-white → bg-surface` sweep would have shipped a broken switch.

### Permanently-dark surfaces must not be tokenized (found in Step 7)

`CodeBlock` renders through Prism's `nightOwl` theme, which is dark in **light** mode too. Its copy
button is `bg-gray-800/30 … text-white`, sitting on a surface that never changes. Tokenizing those
to `surface`/`content` would invert the button in dark mode against a code block that stayed dark —
making it unreadable. Left literal, with a comment saying why, so a later sweep does not "fix" it.

Same family of trap as the switch thumb in Step 6: the question is never "what hex is this", it is
"what does this sit on, and does _that_ change".

### Colours reached through inline `style` still tokenize

`CodePreview` and `Divider` pass colours as inline style values rather than classes. Those take
`rgb(var(--fp-token))` directly, which resolves exactly like the utility class does — verified in
the browser for all three. `Chip` uses the same mechanism and is handled in Step 8.

### Light chips are below WCAG AA — pre-existing, deliberately preserved (found in Step 8)

Measuring chip text against chip background after tokenizing:

| Variant | Light | Dark |
| ------- | ----- | ---- |
| success | 4.47  | 6.98 |
| default | 5.42  | 6.50 |
| failed  | 3.95  | 4.63 |
| info    | 4.35  | 6.25 |
| warning | 4.88  | 6.95 |

Three of the five light variants fail AA (4.5:1); `failed` at 3.95 is the worst. That is the
**existing** design — the tokens reproduce it byte-for-byte, so this migration neither caused nor
worsened it. The dark values were chosen to clear AA, and all five do.

Fixing the light chips is a real accessibility improvement but it is a **visible light-mode change**,
which is exactly what this workstream promises not to do. It belongs in its own PR with its own
sign-off, not smuggled into a dark-theme commit.

### `blue-DEFAULT` and `text-zinc` are dead classes (found in Step 9)

`ErrorBoundary` uses `bg-blue-DEFAULT/10`, `hover:border-blue-DEFAULT/30` and six similar classes,
26 in total. Tailwind flattens a `DEFAULT` key to the bare name — `bg-blue`, never `bg-blue-DEFAULT`
— so **none of them are emitted**. Confirmed: zero occurrences of `blue-DEFAULT` in the built CSS,
and probing `bg-blue-DEFAULT/10` in the browser returns `rgba(0, 0, 0, 0)`.

The bare forms (`bg-blue`, `bg-blue-light`) are used nowhere in `src/`, so `colors.blue.DEFAULT`
and `colors.blue.light` in `tailwind.config.js` are dead config too, and the `brand-blue` /
`brand-blue-light` tokens added in Step 1 currently have no consumer.

Same story for a bare `text-zinc` in four atoms: `zinc` has no `DEFAULT`, so it paints nothing.

**Left untouched on purpose.** Making these classes work would make blue accents appear on the error
page that are not there today — a visible light-mode change, which is exactly what this workstream
promises not to do. It is a real bug worth fixing, but it needs its own PR and its own sign-off.

### Batch migration is safe once the mapping is settled (Step 10)

The 15 connection drawers share one visual language, so they were migrated in a single pass with a
regex keyed on a fixed class→token map, applied with `(?<![\w-])…(?![\w-])` boundaries. The
boundaries matter: without them `bg-blue-50` would clobber the `bg-blue-500` prefix and silently
change a colour.

283 replacements, zero leftovers, and every one of the 24 tokens involved verified byte-identical.
This is the pattern for the remaining ~140 molecules: settle the map by reading the distinct classes
first, then apply it mechanically, then verify the tokens rather than the files.

### `dark:`-scoped classes are not migration debt

`command-palette.tsx` already carried `dark:bg-white/10` and `dark:bg-white/[0.08]`. Those are
translucent-white elevation overlays that only apply in dark mode — a standard technique, not a
light-mode literal. They are left alone, and a future lint rule banning raw palette classes must
exempt `dark:`-prefixed ones.

### The `:root` immutability guard

`scripts/verify-theme-tokens.mjs` now pins every pre-existing `:root` declaration to a frozen
baseline captured from `main`. Changing or removing one fails the check. This is the exact failure
mode that sank #984, so it is enforced mechanically rather than left to review. Adding a new
variable to `:root` is still fine.

Both failure modes were tested by deliberately breaking them:

- changing `--border` in `:root` → `--border: :root value changed from "0 0% 89.8%" to "0 0% 85%"`
- drifting a token light value → `--fp-content-muted: LIGHT DRIFT — :root has "107 114 129" but gray.500 is "107 114 128"`

Two `:root` values are already broken on `main` and are deliberately preserved: `--background` is a
hex fed to `hsl()`, and `--muted-foreground` is a quoted string. Both are inert. Fixing either would
change light mode, so they stay wrong until someone owns that in a separate PR.

## Why this exists

PR #984 shipped a dark theme and was reverted in `002ff4b2`. It failed for one reason:
**it rewrote `:root` token values**, so the light UI changed (blue app background, restructured
header, recolored env badges, washed sidebar promo). ~311 components were remapped in one merge,
so nothing could be reverted in isolation.

This rebuild fixes both problems:

1. **Light mode is byte-identical.** Every new token's light value is the _exact_ hex of the class
   it replaces. `text-gray-500` → `text-content-muted` where `--fp-content-muted` resolves to
   `#6b7280`. Not "close enough" — the same bytes.
2. **One commit per slice.** 40–50 small commits, each independently revertable. If page X regresses,
   `git revert <sha>` fixes page X and nothing else.

## The three locked decisions

| Decision       | Choice                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Light fidelity | **Byte-identical.** One token per distinct source hex _per role_. `gray-500` and `zinc-500` stay separate tokens.                     |
| Dark palette   | **Linear "Midnight"** — layered chrome (`#0F0F10` sidebar) over a lighter content well. Already tuned in `src/exportable/styles.css`. |
| Toggle         | **Settings page only, default light.** No existing user sees a change until they opt in.                                              |

## Inventory (measured, not estimated)

| Metric                              | Count                      |
| ----------------------------------- | -------------------------- |
| Files with hardcoded colors         | **322**                    |
| Palette-class occurrences           | 2,754                      |
| Hex-literal occurrences             | 509 (122 distinct)         |
| Distinct resolved colors            | 148 (incl. alpha variants) |
| Distinct **opaque** colors used ≥4× | ~57                        |

Distribution by area:

| Area                         | Files | Hits |
| ---------------------------- | ----- | ---- |
| `components/molecules`       | 157   | 1622 |
| `components/atoms`           | 34    | 159  |
| `components/organisms`       | 23    | 199  |
| `components/customer-portal` | 21    | 298  |
| `pages/customer`             | 16    | 213  |
| `pages/product-catalog`      | 13    | 85   |
| `pages/auth`                 | 11    | 89   |
| `pages/settings`             | 10    | 112  |
| `components/ui`              | 10    | 41   |
| `pages/insights-tools`       | 8     | 164  |
| everything else              | 19    | 219  |

The top 20 colors account for ~85% of all occurrences — the long tail is thin and mostly decorative
gradients on the checkout/pricing pages.

---

## Technical design

### Token format: RGB channel triplets

Existing tokens use `hsl(var(--x))`. New tokens use **space-separated RGB channels** consumed as
`rgb(var(--fp-x) / <alpha-value>)`:

```css
--fp-content-muted: 107 114 128; /* exactly #6b7280 */
```

```js
'content-muted': 'rgb(var(--fp-content-muted) / <alpha-value>)',
```

Why not hex-in-var: hex breaks Tailwind's `/50` opacity modifier. Why not HSL: HSL round-tripping
introduces sub-1% rounding drift, which forfeits byte-identity. RGB integer channels are exact
**and** opacity-capable.

### Namespace isolation

- CSS variables are prefixed `--fp-*`. **No existing `:root` variable is read, renamed, or
  re-valued.** `--background`, `--foreground`, `--card` etc. stay exactly as they are.
- Tailwind color keys are new names (`surface`, `content`, `line`, `info`, …). They do not collide
  with the existing keys (`background`, `foreground`, `card`, `primary`, `muted`, …).
- Result: until a component is migrated, it renders through the old path, unchanged.

### Roles, not steps

`#e5e7eb` is used as a border 166× and as a background 35×. In dark mode those must diverge — a
border becomes a faint hairline, a background becomes a raised surface. So tokens are **role-scoped**:
`surface-*` for backgrounds, `content-*` for text/icons, `line-*` for borders/dividers/rings.

---

## Token set (Phase 1)

Light values are copied verbatim from Tailwind's palette. Dark values follow the Midnight ramp.

### Surfaces — `bg-*`

| Token             | Light     | Replaces      | Uses |
| ----------------- | --------- | ------------- | ---- |
| `surface`         | `#ffffff` | `bg-white`    | 223  |
| `surface-subtle`  | `#f9fafb` | `bg-gray-50`  | 65   |
| `surface-muted`   | `#f4f4f5` | `bg-zinc-100` | 54   |
| `surface-shell`   | `#f3f4f6` | `bg-gray-100` | 35   |
| `surface-strong`  | `#e5e7eb` | `bg-gray-200` | 35   |
| `surface-faint`   | `#fafafa` | `bg-zinc-50`  | 17   |
| `surface-cool`    | `#f8fafc` | `bg-slate-50` | 5    |
| `surface-inverse` | `#111827` | `bg-gray-900` | 4    |
| `surface-scrim`   | `#000000` | `bg-black/*`  | 9    |

### Content — `text-*`, `fill-*`, `stroke-*`

| Token               | Light     | Replaces        | Uses |
| ------------------- | --------- | --------------- | ---- |
| `content`           | `#111827` | `text-gray-900` | 195  |
| `content-heading`   | `#1f2937` | `text-gray-800` | 73   |
| `content-secondary` | `#374151` | `text-gray-700` | 134  |
| `content-tertiary`  | `#4b5563` | `text-gray-600` | 191  |
| `content-muted`     | `#6b7280` | `text-gray-500` | 257  |
| `content-subtle`    | `#9ca3af` | `text-gray-400` | 68   |
| `content-disabled`  | `#d1d5db` | `text-gray-300` | 7    |
| `content-inverse`   | `#ffffff` | `text-white`    | 27   |
| `content-black`     | `#000000` | `text-black`    | 17   |

**Zinc parallel ramp** (byte-identity debt — see _Deferred collapse_ below):

| Token                    | Light     | Replaces        | Uses |
| ------------------------ | --------- | --------------- | ---- |
| `content-zinc`           | `#09090b` | `text-zinc-950` | 54   |
| `content-zinc-bold`      | `#18181b` | `text-zinc-900` | 46   |
| `content-zinc-strong`    | `#27272a` | `text-zinc-800` | 5    |
| `content-zinc-secondary` | `#3f3f46` | `text-zinc-700` | 21   |
| `content-zinc-tertiary`  | `#52525b` | `text-zinc-600` | 34   |
| `content-zinc-muted`     | `#71717a` | `text-zinc-500` | 79   |
| `content-zinc-subtle`    | `#a1a1aa` | `text-zinc-400` | 26   |

**Slate parallel ramp:**

| Token                     | Light     | Replaces         | Uses |
| ------------------------- | --------- | ---------------- | ---- |
| `content-slate`           | `#0f172a` | `text-slate-900` | 7    |
| `content-slate-strong`    | `#1e293b` | `text-slate-800` | 8    |
| `content-slate-secondary` | `#334155` | `text-slate-700` | 5    |
| `content-slate-tertiary`  | `#475569` | `text-slate-600` | 13   |
| `content-slate-muted`     | `#64748b` | `text-slate-500` | 12   |
| `content-slate-subtle`    | `#94a3b8` | `text-slate-400` | 12   |

### Lines — `border-*`, `divide-*`, `ring-*`

| Token               | Light     | Replaces           | Uses |
| ------------------- | --------- | ------------------ | ---- |
| `line`              | `#e5e7eb` | `border-gray-200`  | 166  |
| `line-subtle`       | `#f3f4f6` | `border-gray-100`  | 23   |
| `line-strong`       | `#d1d5db` | `border-gray-300`  | 38   |
| `line-bold`         | `#9ca3af` | `border-gray-400`  | 3    |
| `line-zinc`         | `#e4e4e7` | `border-zinc-200`  | 8    |
| `line-zinc-subtle`  | `#f4f4f5` | `border-zinc-100`  | 4    |
| `line-zinc-strong`  | `#d4d4d8` | `border-zinc-300`  | 3    |
| `line-slate`        | `#e2e8f0` | `border-slate-200` | 2    |
| `line-slate-subtle` | `#f1f5f9` | `border-slate-100` | 7    |
| `line-slate-strong` | `#cbd5e1` | `border-slate-300` | 1    |
| `line-inverse`      | `#000000` | `border-black`     | 7    |

### Status — info (blue)

| Token               | Light     | Replaces          | Uses |
| ------------------- | --------- | ----------------- | ---- |
| `info`              | `#2563eb` | `blue-600`        | 46   |
| `info-bright`       | `#3b82f6` | `blue-500`        | 28   |
| `info-strong`       | `#1d4ed8` | `blue-700`        | 40   |
| `info-deep`         | `#1e40af` | `blue-800`        | 46   |
| `info-deepest`      | `#1e3a8a` | `blue-900`        | 14   |
| `info-muted`        | `#eff6ff` | `bg-blue-50`      | 34   |
| `info-muted-strong` | `#dbeafe` | `blue-100`        | 11   |
| `info-line`         | `#bfdbfe` | `border-blue-200` | 48   |

> `blue.DEFAULT` (`#3293D9`) and `blue.light` (`#E5F0FF`) already exist in `tailwind.config.js`
> as raw literals, used bare (`bg-blue`, `text-blue`, 26 uses). Rather than re-value the existing
> `blue` key — which would violate "additive only" — Step 1 added parallel `brand-blue` /
> `brand-blue-light` tokens. The 26 call sites migrate `bg-blue` → `bg-brand-blue` in their own
> step, like every other class. The old `blue` key stays untouched and unthemed.

### Status — danger (red)

| Token           | Light     | Replaces         | Uses |
| --------------- | --------- | ---------------- | ---- |
| `danger`        | `#dc2626` | `red-600`        | 38   |
| `danger-bright` | `#ef4444` | `red-500`        | 30   |
| `danger-soft`   | `#f87171` | `red-400`        | 4    |
| `danger-strong` | `#b91c1c` | `red-700`        | 6    |
| `danger-deep`   | `#991b1b` | `red-800`        | 2    |
| `danger-muted`  | `#fef2f2` | `bg-red-50`      | 13   |
| `danger-line`   | `#fecaca` | `border-red-200` | 4    |

### Status — warning (amber / orange / yellow)

| Token                  | Light     | Replaces     | Uses |
| ---------------------- | --------- | ------------ | ---- |
| `warning`              | `#d97706` | `amber-600`  | 8    |
| `warning-bright`       | `#f59e0b` | `amber-500`  | 9    |
| `warning-soft`         | `#fbbf24` | `amber-400`  | 2    |
| `warning-strong`       | `#b45309` | `amber-700`  | 6    |
| `warning-deep`         | `#92400e` | `amber-800`  | 9    |
| `warning-muted`        | `#fffbeb` | `amber-50`   | 9    |
| `warning-muted-strong` | `#fef3c7` | `amber-100`  | 2    |
| `warning-line`         | `#fde68a` | `amber-200`  | 9    |
| `warning-line-strong`  | `#fcd34d` | `amber-300`  | 3    |
| `accent-orange`        | `#ea580c` | `orange-600` | 23   |
| `accent-yellow`        | `#eab308` | `yellow-500` | 4    |

### Status — success (green / emerald)

| Token                   | Light     | Replaces      | Uses |
| ----------------------- | --------- | ------------- | ---- |
| `success`               | `#16a34a` | `green-600`   | 13   |
| `success-bright`        | `#22c55e` | `green-500`   | 9    |
| `success-soft`          | `#4ade80` | `green-400`   | 3    |
| `success-deep`          | `#166534` | `green-800`   | 3    |
| `success-muted`         | `#f0fdf4` | `green-50`    | 5    |
| `success-line`          | `#bbf7d0` | `green-200`   | 2    |
| `accent-emerald`        | `#10b981` | `emerald-500` | 9    |
| `accent-emerald-strong` | `#059669` | `emerald-600` | 6    |
| `accent-emerald-muted`  | `#d1fae5` | `emerald-100` | 2    |

### Accents (indigo / purple / violet / sky)

| Token                  | Light     | Replaces     | Uses |
| ---------------------- | --------- | ------------ | ---- |
| `accent-indigo`        | `#4f46e5` | `indigo-600` | 7    |
| `accent-indigo-strong` | `#4338ca` | `indigo-700` | 2    |
| `accent-indigo-muted`  | `#eef2ff` | `indigo-50`  | 3    |
| `accent-indigo-line`   | `#c7d2fe` | `indigo-200` | 3    |
| `accent-purple`        | `#9333ea` | `purple-600` | 3    |
| `accent-sky`           | `#0284c7` | `sky-600`    | 1    |
| `accent-violet`        | `#7c3aed` | `violet-600` | 1    |

**~85 tokens total.** That is the honest price of byte-identity.

### Not in Phase 1

The ~40 single-use alpha/gradient colors (`from-rose-400/25`, `via-teal-500/20`,
`shadow-emerald-500/25`, …) live almost entirely in the checkout and pricing-setup decorations.
They stay untouched in Phase 1 and get a targeted `dark:` override during their own page's step.

### Deferred collapse

The `-zinc` and `-slate` parallel ramps (~13 tokens) exist only to preserve byte-identity —
`#6b7280` vs `#71717a` is a ΔE of ~1.8, invisible to the eye. Once dark mode ships and is stable,
a follow-up PR can collapse them into the gray ramp. **Do not do this during the migration** —
it would mix an invisible-but-real light change into a dark-theme commit, which is exactly what
sank #984.

---

## Verification gates

Every step must pass all four before its commit command is handed over:

1. `npx tsc -b --noEmit` — clean
2. `npx eslint src/` — zero errors
3. `node scripts/verify-theme-tokens.mjs` — **the byte-identity guard** (built in Step 1). It
   parses the token table, resolves each token's light value, and asserts it equals the Tailwind
   hex it claims to replace. A drift fails the build.
4. Browser check on the touched screen — light screenshot compared against the pre-change
   screenshot, plus a dark screenshot to confirm the migration actually did something.

Guard #3 is what makes "byte-identical" a machine-checked property rather than a promise.

---

## Step sequence

### Foundation (Steps 1–5) — no component changes

| Step  | Scope                                                                                                                                                                       | Files                                                              |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **1** | Token layer: `--fp-*` vars in `:root` + `.dark`, Tailwind color keys, `scripts/verify-theme-tokens.mjs`                                                                     | `src/index.css`, `tailwind.config.js`, 1 new script                |
| **2** | Theme infrastructure: `useThemeStore` (Zustand + persist), `initTheme()` pre-paint in `main.tsx`, default light                                                             | `src/store/useThemeStore.ts`, `src/store/index.ts`, `src/main.tsx` |
| **3** | Retune the stock shadcn `.dark` values to Midnight so `bg-card` / `bg-background` / `bg-popover` stop rendering near-black. `.dark` only — light untouched. See _Findings_. | `src/index.css`                                                    |
| **4** | Settings toggle UI (the only user-facing entry point)                                                                                                                       | `src/pages/settings/…`                                             |
| **5** | App shell: `MainLayout`, `Sidebar`, `BreadCrumbs`, `SidebarInset`                                                                                                           | ~8 files                                                           |

After Step 5 the app is switchable and the chrome is dark-correct; page bodies are still light.

> Steps 6 onward keep the order below; their numbers each shift up by one from the original plan.
> That is intentional and visible only to whoever flips the setting.

### Primitives (Steps 5–9)

| Step  | Scope                                                                           | Files |
| ----- | ------------------------------------------------------------------------------- | ----- |
| **5** | `components/ui/` (shadcn primitives — sidebar, chart, command-palette, sheet)   | 10    |
| **6** | `components/atoms/` A–F (Button, Card, Chip, CodeBlock, Dialog, Input…)         | ~17   |
| **7** | `components/atoms/` G–Z (Select, Stepper, Textarea, Toggle…)                    | ~17   |
| **8** | `components/molecules/Table`, `Sidebar/*`, `BreadCrumbs`, `EnvironmentSelector` | ~10   |
| **9** | `components/organisms/` (CommandPalette, EmptyPage, PlanForm, Subscription…)    | 23    |

### Molecules (Steps 10–26) — 157 files, ~10/commit, grouped by feature

Connection drawers · invoice tables · dashboard cards · subscription sections · export/events ·
editors (JSON, commitment, entitlement) · charts · pricing · webhooks · the rest.

### Pages (Steps 27–44) — grouped by route

`pages/auth` · `pages/home` · `pages/customer` (4 steps) · `pages/customer/tabs` ·
`pages/product-catalog` (2) · `pages/settings` (2) · `pages/insights-tools` (2) ·
`pages/usage` · `pages/developer` · `pages/onboarding` · `pages/checkout` · `pages/error`

### Customer portal (Steps 45–47)

`components/customer-portal` (21 files) + `pages/customer-portal`. Kept last — it has its own
`PortalConfigContext` per-tenant theming that needs care.

### Close-out (Steps 48–50)

| Step   | Scope                                                                                    |
| ------ | ---------------------------------------------------------------------------------------- |
| **48** | Chart theming — Recharts colors read from tokens (`chart-1..5` already exist)            |
| **49** | Long-tail alpha/gradient decorations + the 122 hex literals not yet covered              |
| **50** | ESLint rule banning raw palette classes in migrated dirs; docs; final full-app dark pass |

**Total: ~50 commits.**

---

## Commit protocol

Each step ends with a ready-to-run command. Format:

```bash
git add <exact paths> && git commit -m "<message>" && git push origin feat/dark_theme
```

Message convention:

- `feat(theme): …` — foundation steps
- `refactor(theme): tokenize <area>` — migration steps
- Every migration message ends with `— light unchanged` so a future bisect can tell at a glance
  which commits were meant to be visually inert in light mode.

## Rollback

Any single step: `git revert <sha>`. Migration commits touch disjoint file sets, so reverting one
never conflicts with the others. Reverting Step 1 (tokens) after later steps have landed _would_
break them — revert in reverse order if you need to unwind the foundation.
