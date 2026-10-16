# Data flow and response consumption

> Public review copy. References to screenshots, browser logs, fixture URLs and validation results identify evidence in the retained private audit package; those account-derived artifacts are intentionally not committed to this public repository. Static source inventories are included below.

## Authentication and environment context

The observed deployment calls `https://api.cloud.flexprice.io/v1`. Login includes a data-region selector, so do not assume every deployment or region uses this host. Successful login establishes a session, the shell loads the current user and environments, and environment-scoped requests carry `X-Environment-ID`. Source Axios adds a bearer token; customer portal mode instead uses `X-Session-Token`. No credential values are retained.

`src/core/axios/config.ts` unwraps the response to `response.data`. Therefore `AxiosClient.get<T>` consumers receive the API body directly rather than an Axios `{data, status, headers}` object. HTTP failures are normalized to Error, with backend data retained as the cause. Runtime response validation must be assessed independently of TypeScript generic types.

## Main data families

The following field examples are supported by observed response shapes and the source inventory. They are not exhaustive schemas. Consult `data/contracts.json` for declared types and `data/response-shapes.json` for deduplicated live structural samples.

| UI family | Service/API pattern | Response elements and rendering concerns |
|---|---|---|
| Environment selector | EnvironmentApi → GET /environments | `environments`, `total`; environment `id`, `name`, `type`. Active ID stored locally and used for subsequent calls. |
| Resource lists | POST /features/search, /plans/search, /customers/search, /subscriptions/search, /invoices/search | `items` plus `pagination.total/limit/offset`; search/filter/sort state feeds requests and URL parameters. An empty `items` array does not reveal item schema. |
| Features | FeatureApi; meter creation/configuration | `id`, `name`, `lookup_key`, `type`, `meter_id`, `unit_singular/plural`, status; expanded meter contains event/aggregation configuration. Boolean/static/config and metered forms have different payload requirements. |
| Plans | PlanApi, PriceApi, EntitlementApi, CreditGrantApi | Plan identity/description/metadata/status; child tabs make separate calls. Plan list maps `response.items` and `response.pagination`; form save invalidates plan queries. |
| Prices | PriceApi → price search and bulk creation | `amount`, `display_amount`, `currency`, `type`, `billing_period`, `billing_model`, `invoice_cadence`, `billing_cadence`, `meter_id`, `entity_type/id`, quantity transform and optional expanded meter. Monetary values often arrive as strings. |
| Entitlements | EntitlementApi → search/create | `feature_id`, `feature_type`, `is_enabled`, `usage_limit`, `usage_reset_period`, `is_soft_limit`, `static_value`, expanded `feature`. Render Boolean values separately from numeric/static/config values. |
| Customers | CustomerApi → search/detail/update | `id`, `external_id`, `name`, `email`, address fields, `timezone`, `tax_treatment`, `metadata`, `status`. External ID is not interchangeable with internal ID. |
| Subscriptions | SubscriptionApi; price/coupon/tax/credit/addon APIs | `customer_id`, `plan_id`, `subscription_status`, billing cycle/period/anchor, current-period dates, cancellation/trial fields, payment/collection behavior, timezone, proration, grouping and inheritance. Preview and persisted invoice data are separate. |
| Invoices | InvoiceApi → search/detail/create/edit | `invoice_status` and `payment_status` are separate; `amount_due`, `amount_paid`, `amount_remaining`, `subtotal`, `total`, discounts/tax/adjustment/refund fields, invoice number, line items and dates. Manual edit changes recomputation semantics. |
| Credit notes | CreditNoteApi | `items`, pagination, invoice association and status/type/amount. Customer-tab nested expansion is currently rejected; global list/detail and invoice-linked creation worked. |
| Wallets | WalletApi, customer wallets, portal wallets | `balance`, `credit_balance`, `currency`, `wallet_status`, `wallet_type`, conversion rates, allowed price types, metadata; transaction history is a separate surface. The observed portal wallet response also has `is_cached_fallback`. |
| Payments | PaymentApi | Invoice relation, method, amount, status, reference, timestamps. Offline recording changes invoice state without invoking a gateway; it is distinct from charging a card. |
| Settings | SettingsApi get/update by key, tenant/user/RBAC APIs | Per-setting `value` payloads need individual schemas. SAML availability is capability-dependent. Tenant-wide settings cannot be assumed environment-scoped merely because the shell shows an environment. |
| Customer portal | Create dashboard session, customer/portal endpoints | Token generated via admin action, then portal-specific wallet/subscription/invoice/usage data. Portal should not depend on the admin shell or admin login. |
| Checkout | Provider-specific token decode and SDK branches | Missing/invalid token is observed; real provider success/failure/processing branches require valid provider sessions. |

## How to trace a field end to end

1. Find the registered route and its component in ROUTE-API-MAP.md.
2. Locate the relevant API call site and service body in API-CONTRACTS.md.
3. Resolve return/request type names in `data/contracts.json`.
4. Inspect the component's property reads, table renderers and controls in FORM-COMPONENT-MAP.md. These are extraction candidates, not automatic proof of data lineage.
5. Compare the live page's calls in OBSERVED-NETWORK.md. Shape-reference hashes resolve in `data/response-shapes.json`.
6. Open the matching screenshot/text capture to see the rendered value/state. Test fixture data is documented in COVERAGE.md.

## Important interpretation limits

Static import reachability is conservative: imports of shared hooks, drawers, formatters or barrel exports can include optional API paths. It does not mean every listed method runs when a page loads. Conversely, calls made through dynamic/provider SDKs or aliases may not match the named `*Api.method` extractor. The API service bodies, public/provider source and live network evidence complement the extractor.

Network page attribution is measured at response arrival; late responses may be associated with the next route. Query values, auth headers and response values are not stored. Shape sampling inspects the first array element to depth five, so optional properties and heterogeneous members need the declared contract and further fixtures.

Pagination, search filters, environment context, expansion choices and query invalidation are part of the UI contract. A design-system migration should preserve these deliberately rather than copying only the final visual table.
