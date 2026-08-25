# End-to-end suite

Playwright tests that guard **customer journeys**, not markup. The question a test
here answers is "can someone still edit their subscription and save it?", never
"does this button exist?".

## Layout

```
e2e/
├── public/        routes reachable signed out — no credentials needed
├── journeys/      business workflows: create a customer, create a plan
├── regression/    one focused test per historical bug — the permanent net
├── rbac/          permission gating, run as a read-only account
├── smoke/         the few flows that prove a deployment is usable at all
├── visual/        snapshot comparisons, opt-in and narrow
│
├── pages/         page objects: where selectors live
├── fixtures/      the `test` every spec imports
├── data/          generated test data, kept out of specs
├── utils/         API client and shared locators
└── support/       environment resolution and the one-time logins
```

`journeys` and `regression` differ in intent, not machinery. A journey describes a
workflow someone performs; a regression pins one bug that shipped once. Both run in
the same project — the split exists so that the safety net is legible as a safety net
rather than buried among feature tests.

## Projects

| Project  | Credentials | Runs                                                      |
| -------- | ----------- | --------------------------------------------------------- |
| `public` | none        | Login page — runnable on any checkout                     |
| `setup`  | admin       | One UI login, cached as storage state                     |
| `e2e`    | admin       | `journeys/` + `regression/`                               |
| `smoke`  | admin       | Deployment health check                                   |
| `rbac`   | viewer      | Permission gating — **only exists when configured**       |
| `visual` | none        | Snapshot comparisons — **opt-in, never in CI by default** |

`e2e` declares `public` and `setup` as dependencies. If the login page itself is
broken, every authenticated result below it is noise, so Playwright skips the whole
suite — inside one run, producing one report, rather than needing CI to sequence two
invocations.

`rbac` is omitted from the config entirely when no viewer account is configured. A
suite nobody has provisioned should be absent, not red.

## Tags

Every spec carries at least one. Tags select across folders where projects cannot.

| Tag           | Meaning                                     |
| ------------- | ------------------------------------------- |
| `@smoke`      | Deployment health — fast, read-only         |
| `@critical`   | Must not break                              |
| `@regression` | A bug that shipped once and must not return |
| `@visual`     | Snapshot comparison                         |

```bash
npm run test:e2e:critical     # --project=e2e --grep @critical
npm run test:e2e:regression   # --project=e2e --grep @regression
```

## Running locally

```bash
npm run test:e2e:public
```

That needs nothing but a checkout: Playwright starts the dev server itself and the
public suite has no account to log into.

For the authenticated suites, create `.env.e2e` (already gitignored via `.env.*`):

```
E2E_API_URL=https://api-staging.flexprice.io/v1
E2E_USER_EMAIL=e2e@yourtenant.example
E2E_USER_PASSWORD=…
```

then:

```bash
npm run test:e2e
```

Useful variations:

```bash
npm run test:e2e:ui        # the Playwright UI, best for writing new tests
npm run test:e2e:smoke     # just the deployment health check
npm run test:e2e:rbac      # permission gating (needs the viewer account)
npm run test:e2e:report    # open the HTML report from the last run
```

### Pointing at a deployed environment

```bash
E2E_BASE_URL=https://staging.flexprice.io npm run test:e2e:smoke
```

When `E2E_BASE_URL` is set no local server is started. When it is unset, Playwright
runs `E2E_WEB_SERVER_COMMAND` (default `npm run dev`) on port 3000. CI overrides that
command to serve the production build, so a PR is judged on the bundle that ships.

To reproduce exactly what CI does — production bundle, on a port that will not fight
a dev server you already have running:

```bash
npm run build
CI=true E2E_START_SERVER=1 E2E_BASE_URL=http://localhost:3100 \
  E2E_WEB_SERVER_COMMAND='npm run preview -- --port 3100 --strictPort' \
  npm run test:e2e:public
```

`E2E_START_SERVER=1` forces the server up even though a target URL was named, which
is the only way to combine "start it yourself" with "on this port".

### Environment variables

| Variable                 | Default         | Purpose                                            |
| ------------------------ | --------------- | -------------------------------------------------- |
| `E2E_BASE_URL`           | localhost:3000  | Target to drive; setting it skips the web server   |
| `E2E_START_SERVER`       | unset           | `1` starts the server even when a URL is given     |
| `E2E_WEB_SERVER_COMMAND` | `npm run dev`   | How to start the server when we own it             |
| `E2E_API_URL`            | —               | Backend for API setup + isolation, including `/v1` |
| `E2E_ENVIRONMENT_NAME`   | `E2e<YYYYMMDD>` | Overrides the environment the run writes into      |
| `E2E_USER_EMAIL`         | —               | Admin test account                                 |
| `E2E_USER_PASSWORD`      | —               | Its password                                       |
| `E2E_VIEWER_EMAIL`       | —               | Read-only account; enables the `rbac` project      |
| `E2E_VIEWER_PASSWORD`    | —               | Its password                                       |

## Environment isolation

**Every run writes real records to a real backend.** There is no mocking layer: the
app under test makes the same API calls it makes in production, and the fixtures
create data over HTTP.

So before any test runs, the setup pins the whole run to its own Flexprice
environment, named `E2e<YYYYMMDD>` — today's is `E2e20260825`. Without this, records
land in whichever environment the account opens by default, which is usually one
people are also using by hand: a test run and someone's manual work end up in the
same customer list.

How it works:

1. Sign in through the login form as usual.
2. `GET /environments`, look for today's name, `POST /environments` if absent.
3. Write that id to `active_environment_id` in localStorage.
4. Navigate again so the app refetches every environment-scoped query against it.

That one key is what both halves of the run read: the app sends it as
`X-Environment-ID` on every request, and the fixture client recovers it from the
saved storage state. UI-created and API-created records therefore always land in the
same place.

Step 4 is retried up to three times. `useEnvironment` resets the key to the first
environment in its list whenever the stored id is missing from it, and on the first
run of a new day the app has already fetched that list before the environment
existed — so the first attempt gets overwritten and the refetch makes the next one
stick.

**Skipped when `E2E_API_URL` is unset**, with a warning. Read-only suites — smoke,
run against a deployment — write nothing and are not worth failing over a missing
variable.

> **The backend has no DELETE for environments.** Anything created here is permanent,
> which is why the name is per _day_ and not per run: a bounded, self-describing
> trail rather than unbounded growth. If even that is too much for your tenant, set
> `E2E_ENVIRONMENT_NAME` to a single fixed name and reuse it forever.

## Authentication

`support/auth.setup.ts` signs in once through the real login form and saves the
browser state to `e2e/.auth/user.json`; every other project reuses it. This is a
deliberate choice over minting a token directly:

- It works unchanged against a Supabase-backed deployment and a self-hosted one —
  `AuthService` prefers a locally stored session in either case.
- It makes every run prove the login path works before anything else can pass.

The setup also waits for `active_environment_id` to land in localStorage. Every
dashboard request needs it as `X-Environment-ID`, so saving state before it arrives
would hand each test a session that 403s until it re-fetched.

`support/viewer.setup.ts` does the same for the read-only account. Both share
`support/signIn.ts`, so a divergence between the two logins cannot make a permissions
comparison meaningless.

**Use a dedicated test tenant.** These tests create real records. Never point them at
a tenant that carries customer data, and never use a real person's login.

## API-assisted setup

Exercise the UI for the behaviour under test. Arrange everything else over the API.

```
before  →  create customer via API   (fast, can't flake on UI)
           ↓
           open the UI
           ↓
           perform the workflow      ← the thing under test
           ↓
           assert
           ↓
after   →  delete via API
```

`utils/api.ts` recovers the session the auth setup already established — it does not
log in again — and exposes only what fixtures need. `fixtures/customer.ts` builds on
it:

```ts
test('the detail page renders its tabs', async ({ existingCustomer, page }) => {
	await page.goto(`/billing/customers/${existingCustomer.id}`);
	await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
});
```

The customer is created before the test and removed after, without a single click.
The create-customer drawer still has its own coverage in `journeys/customers`, where
that drawer _is_ the behaviour under test.

Cleanup is best-effort by design: a teardown that throws turns a passing test red and
buries the real result. Leftovers all carry the `e2e-` prefix, so they are
identifiable and safe to purge.

## Relationship to the backend sanity suite

`flexprice/integration-testing-suite/go` already walks the full billing lifecycle at
the API level — 33 steps across seven phases, run with `make test-suite`. It is the
canonical definition of the flow and it is already maintained. Duplicating it here
would be waste.

The division of labour:

|          | Backend sanity suite                                     | This suite                                                                     |
| -------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Question | Does the billing engine produce the right numbers?       | Can a human drive that lifecycle through the UI?                               |
| Level    | HTTP / Go SDK                                            | Browser                                                                        |
| Catches  | Wrong proration, bad invoice totals, broken entitlements | A dropdown that won't stay selected, a drawer that won't close, a gated button |

What we reuse is the **sequence**, not the code. `journeys/golden-path/` follows the
same phase order — catalogue, then billing entities, then subscription — so a change
to the lifecycle is made once in the Go suite and mirrored here, rather than each
side inventing its own idea of the correct order. `utils/api.ts` deletes in the same
reverse order as `steps_cleanup.go`, for the same reason: the backend refuses to
remove an entity another still references.

Three ways to go further, in increasing cost:

1. **Mirror the sequence** (done). Zero infrastructure. The Go suite tells you the
   correct order and the required fields; the TypeScript client calls the same
   endpoints in-process.
2. **Seed with the Go suite.** Add a `--seed-only` mode to the Go runner that stops
   after the catalogue and billing phases, run it as a CI step before Playwright, and
   have the UI suite drive a tenant that already has features, plans and customers.
   Costs a Go toolchain in the frontend CI image; worth it only once UI setup time
   dominates the run.
3. **Run both against one tenant, in order.** Backend suite first as a gate, then the
   UI suite. Gives a single "is the product working" verdict, at the cost of coupling
   two repos' CI together. Only sensible from a release pipeline, not a PR.

Recommended: stay at (1) until the golden path takes longer to set up than it does to
assert.

## Writing tests

### Selector policy

In order of preference. Reach for the next one only when the one above genuinely
does not fit:

1. `getByRole('button', { name: 'Save' })` — how a user and a screen reader find it
2. `getByLabel('External ID')` — form fields; the app labels its inputs properly
3. `getByText('Customer added successfully')` — toasts and copy
4. `getByTestId('…')` — add a `data-testid` when nothing above is stable
5. CSS or XPath — last resort, and worth a comment explaining why

Never select on Tailwind classes or `nth-child`. Both change when someone restyles a
component that was otherwise working, which produces failures that teach the team to
ignore this suite.

Shared locators live in `utils/selectors.ts`; anything page-specific belongs on that
page's object in `pages/`.

Row action menus are reachable by role: the shared `ActionButton` labels its trigger
"Row actions". That default is identical on every row, so scope the lookup inside the
row rather than matching by name alone —
`rowContaining(page, name).getByRole('button', { name: 'Row actions' })` — or pass a
specific `ariaLabel` from the page when a row needs telling apart on its own.

### Assert the outcome, not the click

A success toast fires the moment a request resolves and has fired before while the
record never reached the list. Where it matters, reload and look again:

```ts
await customersPage.saveButton.click();
await app.expectToast('Customer added successfully');

await page.reload();
await expect(customersPage.row(customer.name)).toBeVisible();
```

### Test data

Never hard-code names. `data/testData.ts` generates per-run identifiers prefixed
with `e2e-`; the suite runs repeatedly against a shared tenant, and fixed names
collide with the last run's leftovers in ways that look like application bugs.

### Turning a bug into a test

Every UI bug worth fixing is worth a test, and the test is what stops it coming back.
Put it in `regression/`, named after the bug, and write it as the sequence a person
performed with the assertion on the thing that was actually wrong:

```
Open modal → open dropdown → select option
  → ASSERT the modal is still open
  → ASSERT the selection stuck
  → Save, reload
  → ASSERT it persisted
```

`regression/sidebar-collapse.spec.ts` carries two of these.

## Visual regression

Applied narrowly, and opt-in — `visual` runs in no workflow by default.

Snapshots earn their place on stable, composed surfaces where a layout break is the
bug and no assertion would catch it: the login page, the pricing widget, checkout,
the customer portal. They are actively harmful on tables, lists, dashboards and
anything showing live data, where every run differs and the suite decays into a
diff-approval ritual.

Baselines are platform-specific — Playwright suffixes them with the OS — and
sensitive to font rendering, so a baseline generated on a laptop will not match a
Linux CI runner. Generate them in the image CI uses:

```bash
docker run --rm -v "$(pwd):/work" -w /work \
  mcr.microsoft.com/playwright:v1.62.1-jammy \
  npx playwright test --project=visual --update-snapshots
```

`-darwin` and `-win32` baselines are gitignored for exactly this reason; only Linux
baselines belong in the repo.

## Debugging a failure

A failing run should be diagnosable without reproducing anything by hand. Every
failure keeps a screenshot, a video, a full trace and an error-context dump:

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

The trace carries actions, DOM snapshots and network activity — enough to see that a
dropdown opened, an option was clicked, and the value never changed.

In CI those land as run artifacts (`playwright-report-*`, `playwright-traces-*`), and
the GitHub reporter annotates the failing line directly on the pull request.

## Flakiness

CI retries once. A test that fails then passes is reported as **flaky**, not as a
pass — the HTML report filters on it.

| State                       | Action                                             |
| --------------------------- | -------------------------------------------------- |
| Passed                      | Nothing                                            |
| Passed after a retry        | Flaky — record it; do not treat the run as clean   |
| Flaky on 3 consecutive runs | Must be fixed or quarantined before new work lands |
| Failed both attempts        | Blocks the merge                                   |

Treat a flaky test as a bug in the test, not a fact of life: usually a missing wait
on a condition, or an assertion racing a fetch. Do not paper over it with
`waitForTimeout`, and do not silently retry more. If a test must be quarantined, mark
it `test.fixme` with a linked issue so it is visibly disabled rather than quietly
passing.

`fullyParallel` is off and CI uses a single worker on purpose: these specs create and
mutate tenant data, and one file's writes racing another file's list assertions is
the classic source of E2E flake. Scale by sharding across machines, not by adding
workers on one.

## CI

| Workflow          | Trigger                        | Runs                | Notifies                         |
| ----------------- | ------------------------------ | ------------------- | -------------------------------- |
| `e2e-pr.yml`      | pull requests touching the app | `public` then `e2e` | PR check status                  |
| `e2e-staging.yml` | successful deployment          | `smoke`             | Slack on failure                 |
| `e2e-monitor.yml` | every 30 minutes               | `smoke`             | Slack on failure and on recovery |

`e2e-pr.yml` runs in two stages: static checks (E2E typecheck, lint) fail in under a
minute, and only then does the browser suite start. Unit tests are not duplicated
there — `test.yml` already runs vitest on every pull request as its own check.

### Required secrets

| Secret                | Used by           | What it is                                            |
| --------------------- | ----------------- | ----------------------------------------------------- |
| `E2E_API_URL`         | PR                | Backend the test tenant lives in, including `/v1`     |
| `E2E_STAGING_URL`     | monitor           | Base URL to monitor                                   |
| `E2E_USER_EMAIL`      | all authenticated | The dedicated admin test account                      |
| `E2E_USER_PASSWORD`   | all authenticated | Its password                                          |
| `E2E_VIEWER_EMAIL`    | RBAC              | Optional read-only account                            |
| `E2E_VIEWER_PASSWORD` | RBAC              | Its password                                          |
| `SLACK_WEBHOOK_URL`   | staging, monitor  | Optional — alerts are skipped, not failed, without it |

Without the credential secrets the PR workflow runs the `public` suite only and stays
green, so a fork or a half-finished setup does not produce a wall of timeouts.

### Slack

Alerts are edge-triggered: the first failure, and the first pass afterwards. A
channel that receives a green tick every thirty minutes is a channel nobody reads.

Each failure reports the journey, the failing case, the locator, expected vs actual,
and which diagnostics were captured. GitHub exposes artifacts per run rather than per
file, so the message links the run rather than inventing deep links to individual
traces.

## Rollout

Each step should be stable before the next starts:

1. **Foundation** — config, fixtures, auth, artifacts, API-assisted setup. Done.
2. **Critical flows** — login, customers, plans, navigation, permissions. Done;
   subscriptions and checkout are next.
3. **PR protection** — make `E2E (PR)` a required check once it has been green for a
   week. Blocking merges on a suite that is not yet trusted is how teams learn to
   bypass the check.
4. **Post-deploy** — wired; turn on once a staging test tenant exists.
5. **Monitoring** — the scheduled job, which catches breakage no PR caused: backend
   contract changes, expired credentials, flipped flags, third-party outages.

### Coverage roadmap

Covered: login · customer creation · customer detail · plan creation · sidebar
navigation · customer write permissions · smoke journeys.

Next, roughly in order of value:

- Subscription creation and editing
- Usage charge selection (where behavioural dropdown bugs have concentrated)
- Entitlements
- Invoice filters
- Credits and wallet
- Checkout
- Customer portal
- Wider RBAC gating — plans, invoices, team settings

RBAC deserves priority: the framework is new, permission regressions are silent, and
every gate is one comparison between two accounts looking at the same screen.
