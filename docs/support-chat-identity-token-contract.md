# Support Chat Identity Token — API Contract

**Status:** Contract finalised, backend unimplemented
**Consumer:** `flexprice-front` — `src/api/SupportChatApi.ts`, `src/core/services/support-chat/adapters/pylon.ts`
**Provider:** `flexprice` (Go backend)
**Date:** 2026-08-18

> Hand this document to a backend session. It specifies one new endpoint. The frontend
> is already written against it and ships behind a flag that is **off by default**, so
> the backend can land independently and nothing breaks in the meantime.

---

## 1. Why this exists

The dashboard embeds a support-chat widget (Pylon, and previously Intercom). Today the
widget is told who the user is **entirely client-side** — `window.pylon.chat_settings`
carries a plain `email` and `name`. Anyone can edit those before the widget boots and
appear in the support inbox as another customer.

This grants no access to Flexprice data (the API is independently authenticated), but it
can mislead a support agent into discussing one customer's account with another person.

There is also a **product** consequence, straight from Pylon's docs: _"if Identity
Verification is not enabled, users won't be able to see old chats."_ Today a customer who
reopens the widget loses their conversation history. That alone justifies the work.

Pylon closes this with [identity verification](https://docs.usepylon.com/pylon-docs/chat-widget/identity-verification):
the frontend passes a short-lived JWT that only the server can sign. The secret cannot
live in the frontend bundle, so the backend must mint the token.

**Same gap exists for Intercom today** (no `user_hash` is sent). This endpoint is designed
provider-agnostically so Intercom's `user_hash` can be served from it later without a new
route.

---

## 2. Endpoint

```
POST /v1/users/me/support-chat/token
```

**Why `POST`, not `GET`:** minting a token is not idempotent-cacheable, and POST keeps the
provider selector out of URLs, query logs, and browser history. The token itself is only
ever in the response body.

**Why under `/users/me`:** the token identifies the _authenticated caller_. It takes no
path parameters and can never mint a token for anyone else. Registering it in the existing
`users` group in `internal/api/router.go` makes that structurally obvious:

```go
user := v1Private.Group("/users")
{
    user.GET("/me", handlers.User.GetUserInfo)
    user.POST("", handlers.User.CreateUser)
    user.POST("/search", handlers.User.QueryUsers)
    user.POST("/me/support-chat/token", handlers.User.CreateSupportChatToken) // new
}
```

It belongs on `v1Private`, so it inherits `AuthenticateMiddleware`, `EnvAccessMiddleware`,
`SentryTenantContextMiddleware` and `ErrorHandler()` like every other private route.

---

## 3. Request

```jsonc
{
	"provider": "pylon", // required; "pylon" today, "intercom" reserved
}
```

```go
// internal/api/dto/user.go
type CreateSupportChatTokenRequest struct {
    Provider types.SupportChatProvider `json:"provider" binding:"required"`
}

// internal/types/support_chat.go (new)
type SupportChatProvider string

const (
    SupportChatProviderPylon    SupportChatProvider = "pylon"
    SupportChatProviderIntercom SupportChatProvider = "intercom"
)

func (p SupportChatProvider) Validate() error {
    switch p {
    case SupportChatProviderPylon:
        return nil
    case SupportChatProviderIntercom:
        return ierr.NewError("intercom identity verification is not implemented").
            WithHint("Only 'pylon' is supported today").
            Mark(ierr.ErrValidation)
    default:
        return ierr.NewError("invalid support chat provider").
            WithHint("Provider must be 'pylon'").
            Mark(ierr.ErrValidation)
    }
}
```

The values match the frontend's `SupportChatProvider` enum in
`src/models/SupportChat.ts` exactly. Keep them in sync.

---

## 4. Response — `200 OK`

```jsonc
{
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	"expires_at": "2026-08-18T12:15:00Z",
	"provider": "pylon",
}
```

```go
type SupportChatTokenResponse struct {
    Token     string                    `json:"token"`
    ExpiresAt string                    `json:"expires_at"` // RFC3339 UTC
    Provider  types.SupportChatProvider `json:"provider"`
}
```

`expires_at` is informational — the frontend re-fetches on every widget init and does not
schedule refreshes off it. Include it so the value is debuggable from the network tab.

---

## 5. JWT claims (Pylon)

Signed **HS256**. Per Pylon's docs, the JWT secret is used **as-is — do NOT hex-decode it**
(that applies only to the separate HMAC `email_hash` flow, which we are not using).

| Claim                 | Required | Value                                                                        | Source                        |
| --------------------- | -------- | ---------------------------------------------------------------------------- | ----------------------------- |
| `email`               | ✅       | Authenticated user's email                                                   | `user.Email`                  |
| `aud`                 | ✅       | Pylon **Chat Widget App ID**                                                 | `cfg.SupportChat.Pylon.AppID` |
| `iat`                 | ✅       | Issue time, Unix seconds                                                     | `time.Now().Unix()`           |
| `exp`                 | ✅       | Expiry, Unix seconds. **Pylon caps this at 15 minutes.** Use **10 minutes**. | `time.Now().Add(ttl).Unix()`  |
| `name`                | ⚠️       | Display name — **see §8, users currently have no name**                      | tenant name as fallback       |
| `account_external_id` | optional | Tenant ID — groups a tenant's users under one Pylon account                  | `types.GetTenantID(ctx)`      |
| `contact_external_id` | optional | **Flexprice user ID**                                                        | `types.GetUserID(ctx)`        |

`contact_external_id` is the reason this endpoint matters beyond security: Pylon accepts it
**only as a JWT claim, never in `chat_settings`**. Until this ships, there is no way to
attach the Flexprice user ID to a Pylon contact record. The frontend has a test asserting
it never tries.

Do **not** also send `email_hash` — Pylon's docs are explicit that the two are mutually
exclusive.

### ⚠️ Identity values must match the JWT exactly

Pylon: _"Any identity values supplied to the widget must match those signed into the JWT."_

If `chat_settings.email` says one thing and the `email` claim says another, Pylon rejects
the session. Keeping two independently-derived copies of the same identity in sync across
two codebases is a standing bug waiting to happen, so **the frontend sends no identity
fields at all once a JWT is in play**:

| Mode                              | `chat_settings` contents                         |
| --------------------------------- | ------------------------------------------------ |
| Unverified (flag off)             | `app_id`, `email`, `name`, `account_external_id` |
| Verified (flag on, token fetched) | `app_id`, `jwt` — nothing else                   |

The JWT becomes the single source of identity, so a mismatch is structurally impossible.
This means **every identity value the widget shows comes from this endpoint's claims** —
if `name` is wrong in the inbox, it is this service that must be fixed, not the frontend.

A frontend test asserts that no identity field ships alongside a `jwt`.

### Reference implementation

Use the typed-claims shape from Pylon's own Go snippet — `aud` is a `jwt.ClaimStrings`, not
a bare string. The codebase already signs HS256 tokens in `internal/auth/flexprice.go:130`,
so the signing half is familiar.

```go
type PylonChatWidgetClaims struct {
    Email             string `json:"email"`
    Name              string `json:"name,omitempty"`
    AccountExternalID string `json:"account_external_id,omitempty"`
    ContactExternalID string `json:"contact_external_id,omitempty"`
    jwt.RegisteredClaims
}
```

```go
func (s *supportChatService) mintPylonToken(ctx context.Context) (string, time.Time, error) {
    cfg := s.cfg.SupportChat.Pylon
    if cfg.IdentitySecret == "" || cfg.AppID == "" {
        return "", time.Time{}, ierr.NewError("pylon identity verification is not configured").
            WithHint("Set support_chat.pylon.app_id and support_chat.pylon.identity_secret").
            Mark(ierr.ErrInternal)
    }

    user, err := s.userService.GetUserInfo(ctx)
    if err != nil {
        return "", time.Time{}, err
    }
    if user.Email == "" {
        // Service accounts have no email and cannot be a support-chat contact.
        return "", time.Time{}, ierr.NewError("user has no email").
            WithHint("Support chat identity verification requires a user with an email").
            Mark(ierr.ErrValidation)
    }

    now := time.Now().UTC()
    expiresAt := now.Add(cfg.TokenTTL)

    claims := PylonChatWidgetClaims{
        Email:             user.Email,
        Name:              displayName(user), // see §8
        ContactExternalID: user.ID,
        RegisteredClaims: jwt.RegisteredClaims{
            Audience:  jwt.ClaimStrings{cfg.AppID},
            IssuedAt:  jwt.NewNumericDate(now),
            ExpiresAt: jwt.NewNumericDate(expiresAt),
        },
    }
    if user.Tenant != nil {
        claims.AccountExternalID = user.Tenant.ID
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    signed, err := token.SignedString([]byte(cfg.IdentitySecret))
    if err != nil {
        return "", time.Time{}, ierr.WithError(err).
            WithHint("Failed to sign the support chat token").
            Mark(ierr.ErrInternal)
    }
    return signed, expiresAt, nil
}
```

---

## 6. Configuration

```go
// internal/config/config.go — add to Configuration
SupportChat SupportChatConfig `mapstructure:"support_chat" validate:"omitempty"`

type SupportChatConfig struct {
    Pylon PylonConfig `mapstructure:"pylon"`
}

type PylonConfig struct {
    // Chat Widget App ID from the Pylon dashboard. Becomes the `aud` claim.
    AppID string `mapstructure:"app_id"`
    // JWT secret from Pylon → Chat Widget → Settings → "Identity Verification Secret",
    // with the **"JWT (signed token)"** option selected (NOT "HMAC email hash" — that
    // produces a hex secret for a different flow). Shown exactly once at generation;
    // store it in the secret manager immediately.
    IdentitySecret string `mapstructure:"identity_secret"`
    // Token lifetime. Pylon rejects anything over 15m; default 10m.
    TokenTTL time.Duration `mapstructure:"token_ttl"`
}
```

```yaml
support_chat:
  pylon:
    app_id: ''
    identity_secret: ''
    token_ttl: 10m
```

### ⚠️ Viper gotcha — bind these explicitly

`internal/config/config.go:467` already documents this: **`AutomaticEnv` misses nested keys
containing underscores.** `identity_secret`, `app_id` and `token_ttl` all contain one, so
they will silently stay empty unless bound by hand, next to the existing `auth.api_key.header`
binding:

```go
_ = v.BindEnv("support_chat.pylon.app_id", "FLEXPRICE_SUPPORT_CHAT_PYLON_APP_ID")
_ = v.BindEnv("support_chat.pylon.identity_secret", "FLEXPRICE_SUPPORT_CHAT_PYLON_IDENTITY_SECRET")
_ = v.BindEnv("support_chat.pylon.token_ttl", "FLEXPRICE_SUPPORT_CHAT_PYLON_TOKEN_TTL")
```

Also default `token_ttl` to `10m` when unset, and **clamp it to 15m** — a misconfigured
longer TTL produces tokens Pylon rejects at runtime, which is far harder to debug than a
startup clamp.

`identity_secret` is a credential: it must never be logged, never returned by any endpoint,
and never added to a response DTO.

---

## 7. Errors

Standard `ierr` marks, surfaced by the existing `ErrorHandler()` middleware.

| Situation                              | Mark                                | HTTP |
| -------------------------------------- | ----------------------------------- | ---- |
| No/invalid auth                        | handled by `AuthenticateMiddleware` | 401  |
| Missing or unknown `provider`          | `ierr.ErrValidation`                | 400  |
| `provider: "intercom"`                 | `ierr.ErrValidation`                | 400  |
| Caller is a service account (no email) | `ierr.ErrValidation`                | 400  |
| `app_id` or `identity_secret` unset    | `ierr.ErrInternal`                  | 500  |
| Signing failure                        | `ierr.ErrInternal`                  | 500  |

**The frontend treats every failure identically:** it logs via `ErrorLoggingService` and
boots the widget unverified, so the Help button keeps working during an outage. That means
a misconfigured backend degrades quietly rather than removing support access — check the
error logs, not the UI, to spot it.

---

## 8. ⚠️ Users have no name — decision needed

While specifying this, I confirmed the backend has **no user name anywhere**:

- `ent/schema/user.go` defines only `id`, `email`, `type`, `roles`
- `internal/domain/user` has no `Name`
- `dto.UserResponse` returns `ID`, `Email`, `Type`, `Roles`, `Tenant`

The frontend's `User` model declares `name?: string`, but `/users/me` never populates it.
The practical consequence: **the support inbox shows every user as their company name**
("Acme Inc"), because `tenant.name` is the only name available. The frontend already
prefers `user.name` and falls back to `tenant.name`, so it will start showing real names
the moment the backend provides them — no frontend change needed.

Three options, in order of preference:

1. **Add `name` to the user entity** — migration + `dto.UserResponse.Name` + populate at
   signup/invite. Correct long-term; every integration benefits, not just support chat.
2. **Derive from the email local-part** in the token service only (`ada@acme.com` → `ada`).
   Zero schema change, immediately better than "Acme Inc", but cosmetic and easily wrong.
3. **Keep sending the tenant name.** Status quo; support agents cannot tell two people at
   the same customer apart in the inbox.

This is orthogonal to identity verification — the endpoint works either way — but it is the
actual cause of the confusing inbox display, so decide it alongside.

---

## 9. Testing

- Token parses with the configured secret and `alg = HS256`.
- `aud` equals the configured app id; `email` equals the caller's.
- `exp - iat` equals the configured TTL and is **≤ 15 minutes**.
- A TTL configured above 15m is clamped, not passed through.
- `contact_external_id` equals the caller's user ID; `account_external_id` equals the tenant ID.
- `email_hash` is **absent** from the claims.
- Unset secret → `ErrInternal`, and the secret never appears in the response or logs.
- `provider: "intercom"` and unknown providers → `ErrValidation`.
- Service-account caller → `ErrValidation`.
- Two calls in the same second produce tokens that both verify (no nonce collisions).
- `aud` serialises as Pylon expects (`jwt.ClaimStrings`), verified by decoding a real token.
- The secret is used **as-is**, not hex-decoded — a hex-decoded secret still produces a
  syntactically valid token that Pylon silently rejects, so assert against a known vector.

---

## 10. Frontend side (already written, no backend dependency)

Behind `VITE_PYLON_IDENTITY_VERIFICATION_ENABLED`, **default `false`**:

- `false` → today's behaviour; no request is made, and `chat_settings` carries
  `app_id`, `email`, `name`, `account_external_id`.
- `true` → `POST /v1/users/me/support-chat/token` with `{ provider: 'pylon' }`. The returned
  `token` becomes `window.pylon.chat_settings.jwt`, and **all other identity fields are
  dropped** so nothing can contradict the claims (see §5).
- `true` but the request fails → logged via `ErrorLoggingService`, and the widget boots
  unverified with the full identity fields, so the Help button keeps working.

The token is fetched through the authenticated Axios client on every widget init, is never
logged, and is never written to `localStorage` or `sessionStorage`.

**Rollout order matters.** Turn identity verification on in the Pylon dashboard _only after_
this endpoint is deployed and the frontend flag is on — Pylon rejects every unverified
session once the dashboard toggle flips, which would break support chat for everyone.

1. Backend deploys the endpoint with `app_id` + `identity_secret` configured.
2. Frontend sets `VITE_PYLON_IDENTITY_VERIFICATION_ENABLED=true`; verify a `jwt` appears in
   `window.pylon.chat_settings` and chat still works.
3. Only then enable **Identity Verification** in the Pylon dashboard.
4. Confirm the inbox no longer shows `Chat widget — email not verified`.

---

## References

- Pylon identity verification — https://docs.usepylon.com/pylon-docs/chat-widget/identity-verification
- Pylon chat setup — https://docs.usepylon.com/pylon-docs/chat-widget/chat-setup
- Existing HS256 signing — `internal/auth/flexprice.go:130`
- Viper underscore-binding precedent — `internal/config/config.go:467`
- Frontend design spec — `docs/superpowers/specs/2026-08-18-pylon-support-chat-design.md`
