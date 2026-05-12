# White-Label & i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Flexprice frontend fully white-labelable via two JSON env vars and a locale string, with zero visual change when env vars are absent.

**Architecture:** BrandProvider context (modeled after PortalConfigContext) injects `--brand-primary` CSS var app-wide; `config.brand`, `config.authPage`, and `config.i18n` are parsed from env at boot with Flexprice defaults as fallback; react-i18next drives auth page translations with `VITE_DEFAULT_LOCALE` controlling the active language.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, react-i18next (new dependency), Vitest

---

## File Map

| Status | File | Change |
|---|---|---|
| Modify | `src/config/config.ts` | Add `BrandConfig`, `AuthPageConfig`, `I18nConfig` interfaces + parsers + 3 new config keys |
| Create | `src/context/BrandContext.tsx` | `BrandProvider` + `useBrand()` hook |
| Create | `src/i18n/index.ts` | `initI18n()` — initialises i18next, sets `document.lang` + `document.dir` |
| Create | `src/i18n/locales/en/auth.json` | All auth page strings in English |
| Create | `src/i18n/locales/ar/auth.json` | All auth page strings in Arabic |
| Modify | `index.html` | Add `id="app-favicon"` to favicon link; fix title |
| Modify | `src/main.tsx` | Call `initI18n`, wrap render tree in `<BrandProvider>` |
| Modify | `src/components/atoms/Page/Page.tsx` | Replace `"Flexprice"` literal with `useBrand().name` |
| Modify | `src/pages/auth/Auth.tsx` | Replace logo import, Slack banner, tab headings |
| Modify | `src/pages/auth/LandingSection.tsx` | Replace tagline + background image |
| Modify | `src/pages/auth/LoginForm.tsx` | Replace hardcoded strings with `t()` |
| Modify | `src/pages/auth/SignupForm.tsx` | Replace hardcoded strings with `t()` |
| Modify | `src/pages/auth/ForgotPasswordForm.tsx` | Replace hardcoded strings with `t()` |
| Modify | `src/pages/auth/ResetPasswordForm.tsx` | Replace hardcoded strings with `t()` |
| Modify | `src/pages/auth/EmailVerification.tsx` | Replace logo import + support email + strings with `t()` |
| Modify | `src/pages/auth/ResendVerification.tsx` | Replace logo src + brand name + strings with `t()` |

---

## Task 1: Extend `config.ts` with brand, authPage, and i18n config

**Files:**
- Modify: `src/config/config.ts`
- Create: `src/config/config.brand.test.ts`

- [ ] **Step 1: Write failing tests for the three new parsers**

Create `src/config/config.brand.test.ts`:

```ts
import { describe, it, expect, afterEach, vi } from 'vitest';

// Each test resets modules so config.ts re-evaluates import.meta.env fresh
async function importParsers() {
  vi.resetModules();
  return import('./config');
}

describe('parseBrandConfig', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns Flexprice defaults when env var is absent', async () => {
    const { parseBrandConfig } = await importParsers();
    const result = parseBrandConfig();
    expect(result.name).toBe('Flexprice');
    expect(result.logo).toBe('/comicon.png');
    expect(result.primaryColor).toBe('#7C3AED');
    expect(result.favicon).toBe('/favicon.ico');
  });

  it('applies overrides from valid JSON', async () => {
    vi.stubEnv('VITE_BRAND_CONFIG', JSON.stringify({ name: 'Tirdad', primaryColor: '#0d1b2a' }));
    const { parseBrandConfig } = await importParsers();
    const result = parseBrandConfig();
    expect(result.name).toBe('Tirdad');
    expect(result.primaryColor).toBe('#0d1b2a');
    expect(result.logo).toBe('/comicon.png'); // unset key falls back to default
  });

  it('silently falls back to defaults on malformed JSON', async () => {
    vi.stubEnv('VITE_BRAND_CONFIG', '{bad json}');
    const { parseBrandConfig } = await importParsers();
    const result = parseBrandConfig();
    expect(result.name).toBe('Flexprice');
  });
});

describe('parseAuthPageConfig', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns defaults when env var is absent', async () => {
    const { parseAuthPageConfig } = await importParsers();
    const result = parseAuthPageConfig();
    expect(result.supportEmail).toBe('support@flexprice.io');
    expect(result.tagline).toBeNull();
    expect(result.loginBgImage).toBeNull();
    expect(result.slackCommunityUrl).toBe(
      'https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ'
    );
  });

  it('sets slackCommunityUrl to null when explicitly nulled', async () => {
    vi.stubEnv('VITE_AUTH_CONFIG', JSON.stringify({ slackCommunityUrl: null }));
    const { parseAuthPageConfig } = await importParsers();
    const result = parseAuthPageConfig();
    expect(result.slackCommunityUrl).toBeNull();
  });
});

describe('parseI18nConfig', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('defaults to en ltr', async () => {
    const { parseI18nConfig } = await importParsers();
    const result = parseI18nConfig();
    expect(result.locale).toBe('en');
    expect(result.direction).toBe('ltr');
  });

  it('derives rtl from Arabic locale', async () => {
    vi.stubEnv('VITE_DEFAULT_LOCALE', 'ar');
    const { parseI18nConfig } = await importParsers();
    const result = parseI18nConfig();
    expect(result.locale).toBe('ar');
    expect(result.direction).toBe('rtl');
  });

  it('derives rtl for all RTL locales', async () => {
    for (const locale of ['ar', 'he', 'fa', 'ur']) {
      vi.stubEnv('VITE_DEFAULT_LOCALE', locale);
      const { parseI18nConfig } = await importParsers();
      const result = parseI18nConfig();
      expect(result.direction).toBe('rtl');
      vi.unstubAllEnvs();
    }
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd /Users/omkar/Developer/source-code/flexprice/flexprice-front/.claude/worktrees/competent-shaw-7c39d9
npx vitest run src/config/config.brand.test.ts
```

Expected: failures with `parseBrandConfig is not a function` (or similar).

- [ ] **Step 3: Add the three interfaces, parsers, and config keys to `config.ts`**

Add the following after the existing `RestrictionsConfig` interface (before the `Config` interface):

```ts
export interface BrandConfig {
  name: string;
  logo: string;
  primaryColor: string;
  favicon: string;
}

export interface AuthPageConfig {
  tagline: string | null;
  supportEmail: string;
  loginBgImage: string | null;
  slackCommunityUrl: string | null;
}

export interface I18nConfig {
  locale: string;
  direction: 'ltr' | 'rtl';
}

const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

export function parseBrandConfig(): BrandConfig {
  try {
    const raw = JSON.parse(import.meta.env.VITE_BRAND_CONFIG ?? '{}');
    return {
      name: raw.name ?? 'Flexprice',
      logo: raw.logo ?? '/comicon.png',
      primaryColor: raw.primaryColor ?? '#7C3AED',
      favicon: raw.favicon ?? '/favicon.ico',
    };
  } catch {
    return { name: 'Flexprice', logo: '/comicon.png', primaryColor: '#7C3AED', favicon: '/favicon.ico' };
  }
}

export function parseAuthPageConfig(): AuthPageConfig {
  try {
    const raw = JSON.parse(import.meta.env.VITE_AUTH_CONFIG ?? '{}');
    return {
      tagline: raw.tagline ?? null,
      supportEmail: raw.supportEmail ?? 'support@flexprice.io',
      loginBgImage: raw.loginBgImage ?? null,
      slackCommunityUrl:
        'slackCommunityUrl' in raw
          ? raw.slackCommunityUrl
          : 'https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ',
    };
  } catch {
    return {
      tagline: null,
      supportEmail: 'support@flexprice.io',
      loginBgImage: null,
      slackCommunityUrl: 'https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ',
    };
  }
}

export function parseI18nConfig(): I18nConfig {
  const locale = import.meta.env.VITE_DEFAULT_LOCALE ?? 'en';
  return { locale, direction: RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr' };
}
```

Then add three keys to the `Config` interface (after `restrictions`):

```ts
export interface Config {
  app: AppConfig;
  api: ApiConfig;
  auth: AuthConfig;
  sentry: SentryConfig;
  posthog: PosthogConfig;
  paddle: PaddleConfig;
  intercom: IntercomConfig;
  region: RegionConfig;
  integrations: IntegrationsConfig;
  restrictions: RestrictionsConfig;
  brand: BrandConfig;
  authPage: AuthPageConfig;
  i18n: I18nConfig;
}
```

And add three lines to the `config` export (after `restrictions`):

```ts
  brand: parseBrandConfig(),
  authPage: parseAuthPageConfig(),
  i18n: parseI18nConfig(),
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run src/config/config.brand.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/config/config.ts src/config/config.brand.test.ts
git commit -m "feat(config): add BrandConfig, AuthPageConfig, I18nConfig with env-driven parsers"
```

---

## Task 2: Create `BrandContext.tsx`

**Files:**
- Create: `src/context/BrandContext.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { createContext, useContext, useEffect, FC, ReactNode } from 'react';
import { config, BrandConfig } from '@/config/config';

const BrandContext = createContext<BrandConfig>(config.brand);

export const BrandProvider: FC<{ children: ReactNode }> = ({ children }) => {
  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', config.brand.primaryColor);

    const faviconEl = document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (faviconEl) {
      faviconEl.href = config.brand.favicon;
    }
  }, []);

  return <BrandContext.Provider value={config.brand}>{children}</BrandContext.Provider>;
};

export function useBrand(): BrandConfig {
  return useContext(BrandContext);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/BrandContext.tsx
git commit -m "feat(brand): add BrandProvider context and useBrand hook"
```

---

## Task 3: Install react-i18next and create the i18n module

**Files:**
- Create: `src/i18n/index.ts`
- Create: `src/i18n/locales/en/auth.json`
- Create: `src/i18n/locales/ar/auth.json`

- [ ] **Step 1: Install react-i18next**

```bash
npm install react-i18next i18next
```

Expected: packages added to `node_modules`, `package.json` and `package-lock.json` updated.

- [ ] **Step 2: Create `src/i18n/index.ts`**

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export async function initI18n(locale: string, direction: 'ltr' | 'rtl'): Promise<void> {
  const [enAuth, arAuth] = await Promise.all([
    import('./locales/en/auth.json'),
    import('./locales/ar/auth.json'),
  ]);

  await i18n.use(initReactI18next).init({
    lng: locale,
    fallbackLng: 'en',
    defaultNS: 'auth',
    resources: {
      en: { auth: enAuth.default },
      ar: { auth: arAuth.default },
    },
    interpolation: { escapeValue: false },
  });

  document.documentElement.lang = locale;
  document.documentElement.dir = direction;
}
```

- [ ] **Step 3: Create `src/i18n/locales/en/auth.json`**

```json
{
  "createAccount": {
    "heading": "Create your account",
    "subheading": "Sign up to start using {{brandName}}."
  },
  "login": {
    "heading": "Login to your account",
    "subheading": "Let's get you back in."
  },
  "forgotPassword": {
    "heading": "Forgot your password?",
    "subheading": "Enter your email to reset your password."
  },
  "resetPassword": {
    "heading": "Set a new password",
    "subheading": "Enter your new password below."
  },
  "slackBanner": "Join the {{brandName}} Community on Slack",
  "fields": {
    "email": "Email",
    "emailPlaceholder": "Enter your email address",
    "password": "Password",
    "passwordPlaceholder": "Enter your password",
    "confirmPassword": "Confirm Password",
    "confirmPasswordPlaceholder": "Confirm your password",
    "newPassword": "New password",
    "newPasswordPlaceholder": "Enter new password",
    "confirmNewPassword": "Confirm password",
    "confirmNewPasswordPlaceholder": "Confirm new password"
  },
  "buttons": {
    "login": "Login",
    "createAccount": "Create Account",
    "sendResetLink": "Send Reset Link",
    "setNewPassword": "Set new password",
    "resendVerification": "Resend verification email",
    "backToLogin": "Back to login",
    "backToLoginCaps": "Back to Login",
    "requestNewResetLink": "Request new reset link",
    "resendVerificationCaps": "Resend Verification Email"
  },
  "links": {
    "forgotPassword": "Forgot your password?",
    "signUp": "Sign up",
    "logIn": "Log in",
    "backToLogin": "Back to login",
    "tryAgain": "try again"
  },
  "divider": "or",
  "noAccount": "Don't have an account?",
  "hasAccount": "Already have an account?",
  "rememberPassword": "Remember your password?",
  "verification": {
    "verifyHeading": "Verify your email address",
    "verificationHeading": "Email verification",
    "sentTo": "We've sent a verification email to:",
    "clickLink": "Click the link in the email to verify your account and complete your registration. If you don't see the email, check your spam folder.",
    "needHelp": "Need help? Contact"
  },
  "resend": {
    "checkEmailHeading": "Please check your email!",
    "checkEmailDescription": "Thanks for registering for an account on {{brandName}}! We've sent a confirmation email to:",
    "checkEmailClickLink": "Click on the link in the email to verify your account. If you don't see it, check your spam folder.",
    "didntReceive": "Didn't receive the email? Check your spam folder or",
    "resendHeading": "Resend Verification Email",
    "resendDescription": "Enter your email address and we'll send you a new verification link."
  },
  "resetLink": {
    "checking": "Checking your link...",
    "expiredTitle": "Link expired or already used",
    "expiredDescription": "This password reset link is no longer valid. Request a new one below."
  },
  "landing": {
    "defaultTagline": "Focus on building, not billing.",
    "trustedBy": "Trusted by"
  }
}
```

- [ ] **Step 4: Create `src/i18n/locales/ar/auth.json`**

```json
{
  "createAccount": {
    "heading": "إنشاء حساب جديد",
    "subheading": "سجّل للبدء في استخدام {{brandName}}."
  },
  "login": {
    "heading": "تسجيل الدخول إلى حسابك",
    "subheading": "دعنا نعيدك إلى حسابك."
  },
  "forgotPassword": {
    "heading": "نسيت كلمة المرور؟",
    "subheading": "أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور."
  },
  "resetPassword": {
    "heading": "تعيين كلمة مرور جديدة",
    "subheading": "أدخل كلمة مرورك الجديدة أدناه."
  },
  "slackBanner": "انضم إلى مجتمع {{brandName}} على Slack",
  "fields": {
    "email": "البريد الإلكتروني",
    "emailPlaceholder": "أدخل عنوان بريدك الإلكتروني",
    "password": "كلمة المرور",
    "passwordPlaceholder": "أدخل كلمة المرور",
    "confirmPassword": "تأكيد كلمة المرور",
    "confirmPasswordPlaceholder": "أكّد كلمة مرورك",
    "newPassword": "كلمة المرور الجديدة",
    "newPasswordPlaceholder": "أدخل كلمة مرور جديدة",
    "confirmNewPassword": "تأكيد كلمة المرور",
    "confirmNewPasswordPlaceholder": "أكّد كلمة المرور الجديدة"
  },
  "buttons": {
    "login": "تسجيل الدخول",
    "createAccount": "إنشاء حساب",
    "sendResetLink": "إرسال رابط إعادة التعيين",
    "setNewPassword": "تعيين كلمة مرور جديدة",
    "resendVerification": "إعادة إرسال بريد التحقق",
    "backToLogin": "العودة إلى تسجيل الدخول",
    "backToLoginCaps": "العودة إلى تسجيل الدخول",
    "requestNewResetLink": "طلب رابط إعادة تعيين جديد",
    "resendVerificationCaps": "إعادة إرسال بريد التحقق"
  },
  "links": {
    "forgotPassword": "نسيت كلمة المرور؟",
    "signUp": "إنشاء حساب",
    "logIn": "تسجيل الدخول",
    "backToLogin": "العودة إلى تسجيل الدخول",
    "tryAgain": "حاول مجدداً"
  },
  "divider": "أو",
  "noAccount": "ليس لديك حساب؟",
  "hasAccount": "لديك حساب بالفعل؟",
  "rememberPassword": "هل تتذكر كلمة المرور؟",
  "verification": {
    "verifyHeading": "تحقق من عنوان بريدك الإلكتروني",
    "verificationHeading": "التحقق من البريد الإلكتروني",
    "sentTo": "لقد أرسلنا بريد تحقق إلى:",
    "clickLink": "انقر على الرابط في البريد الإلكتروني للتحقق من حسابك وإتمام التسجيل. إذا لم تجد البريد، تحقق من مجلد الرسائل غير المرغوب فيها.",
    "needHelp": "هل تحتاج إلى مساعدة؟ تواصل مع"
  },
  "resend": {
    "checkEmailHeading": "يرجى التحقق من بريدك الإلكتروني!",
    "checkEmailDescription": "شكراً لتسجيلك في {{brandName}}! لقد أرسلنا بريداً للتأكيد إلى:",
    "checkEmailClickLink": "انقر على الرابط في البريد الإلكتروني للتحقق من حسابك. إذا لم تجده، تحقق من مجلد الرسائل غير المرغوب فيها.",
    "didntReceive": "لم تستلم البريد الإلكتروني؟ تحقق من مجلد الرسائل غير المرغوب فيها أو",
    "resendHeading": "إعادة إرسال بريد التحقق",
    "resendDescription": "أدخل عنوان بريدك الإلكتروني وسنرسل لك رابط تحقق جديد."
  },
  "resetLink": {
    "checking": "جارٍ التحقق من رابطك...",
    "expiredTitle": "انتهت صلاحية الرابط أو تم استخدامه",
    "expiredDescription": "رابط إعادة تعيين كلمة المرور هذا لم يعد صالحاً. اطلب رابطاً جديداً أدناه."
  },
  "landing": {
    "defaultTagline": "ركّز على البناء، لا على الفوترة.",
    "trustedBy": "موثوق به من قِبَل"
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/i18n/ package.json package-lock.json
git commit -m "feat(i18n): add react-i18next module with en and ar auth translations"
```

---

## Task 4: Wire `BrandProvider` and `initI18n` into `index.html` + `main.tsx`

**Files:**
- Modify: `index.html`
- Modify: `src/main.tsx`

- [ ] **Step 1: Update `index.html`**

Replace:
```html
  <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
  ...
  <title>flexprice.io</title>
```

With:
```html
  <link id="app-favicon" rel="icon" type="image/x-icon" href="/favicon.ico" />
  ...
  <title>Flexprice</title>
```

- [ ] **Step 2: Update `src/main.tsx`**

Replace the entire file with:

```tsx
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import PosthogProvider from './core/services/posthog/PosthogProvider.tsx';
import SentryProvider from './core/services/sentry/SentryProvider.tsx';
import VercelSpeedInsights from './core/services/vercel/vercel.tsx';
import { config } from './config/config.ts';
import { registerWebMCPTools } from './agent/webmcp.ts';
import { BrandProvider } from './context/BrandContext.tsx';
import { initI18n } from './i18n/index.ts';

registerWebMCPTools();

await initI18n(config.i18n.locale, config.i18n.direction);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrandProvider>
    <div>
      {config.app.isProd ? (
        <SentryProvider>
          <PosthogProvider>
            <App />
            <VercelSpeedInsights />
          </PosthogProvider>
        </SentryProvider>
      ) : (
        <App />
      )}
    </div>
  </BrandProvider>,
);
```

- [ ] **Step 3: Verify the dev server starts without errors**

```bash
npm run dev
```

Expected: server starts on port 3000, no TypeScript or runtime errors. Browser tab shows "Flexprice" as the title.

- [ ] **Step 4: Commit**

```bash
git add index.html src/main.tsx
git commit -m "feat(brand): wire BrandProvider and initI18n into app entry point"
```

---

## Task 5: Update `Page.tsx` — brand name in browser tab title

**Files:**
- Modify: `src/components/atoms/Page/Page.tsx`

- [ ] **Step 1: Add `useBrand` import and replace hardcoded `"Flexprice"`**

In `src/components/atoms/Page/Page.tsx`, add the import:

```ts
import { useBrand } from '@/context/BrandContext';
```

Inside the `Page` component (before the `useEffect`), add:

```ts
const { name } = useBrand();
```

Replace both occurrences of `'Flexprice'` in the `useEffect`:

```ts
useEffect(() => {
  if (documentTitle) {
    document.title = `${documentTitle} | ${name}`;
  } else if (heading) {
    if (typeof heading === 'string') {
      document.title = `${heading} | ${name}`;
    }
  }
}, [heading, documentTitle, name]);
```

- [ ] **Step 2: Run the TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/atoms/Page/Page.tsx
git commit -m "feat(brand): replace hardcoded Flexprice in page title with useBrand().name"
```

---

## Task 6: Update `Auth.tsx` — logo, Slack banner, tab headings

**Files:**
- Modify: `src/pages/auth/Auth.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ResetPasswordForm from './ResetPasswordForm';
import AuthService from '@/core/auth/AuthService';
import LandingSection from './LandingSection';
import RegionSelector from '@/components/molecules/RegionSelector/RegionSelector';
import { AuthTab } from './authTabs';
import { useBrand } from '@/context/BrandContext';
import { config } from '@/config/config';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('auth');
  const { logo, name } = useBrand();
  const { authPage } = config;

  const [currentTab, setCurrentTab] = useState<AuthTab>(AuthTab.LOGIN);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('tab') === AuthTab.RESET_PASSWORD) {
      return;
    }
    const fetchUser = async () => {
      const tokenStr = await AuthService.getAcessToken();
      if (tokenStr) {
        navigate('/');
      }
    };
    fetchUser();
  }, [location.search, navigate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab === AuthTab.SIGNUP || tab === AuthTab.FORGOT_PASSWORD || tab === AuthTab.RESET_PASSWORD) {
      setCurrentTab(tab as AuthTab);
    } else {
      setCurrentTab(AuthTab.LOGIN);
    }
  }, [location]);

  const switchTab = (tab: AuthTab) => {
    navigate(`/auth?tab=${tab}`);
  };

  const renderForm = () => {
    switch (currentTab) {
      case AuthTab.SIGNUP:
        return <SignupForm switchTab={switchTab} />;
      case AuthTab.FORGOT_PASSWORD:
        return <ForgotPasswordForm switchTab={switchTab} />;
      case AuthTab.RESET_PASSWORD:
        return <ResetPasswordForm switchTab={switchTab} />;
      default:
        return <LoginForm switchTab={switchTab} />;
    }
  };

  return (
    <div className='flex w-full min-h-screen bg-white page !p-0 !flex-row'>
      {/* Left side - Auth Form */}
      <div className='w-[45%] flex flex-col'>
        {/* Slack Community Strip — hidden when slackCommunityUrl is null */}
        {authPage.slackCommunityUrl && (
          <a
            href={authPage.slackCommunityUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='w-full h-[48px] flex items-center justify-center gap-2.5 cursor-pointer border-y border-gray-100 hover:opacity-90 transition-opacity'
            style={{ background: 'linear-gradient(to right, #F7F7F7, #EDEDED, #F7F7F7)' }}>
            <span className='text-[15px] font-medium text-gray-700'>
              {t('slackBanner', { brandName: name })}
            </span>
            <img src={'/assets/logo/slack-logo.png'} alt='Slack Logo' className='h-4 w-auto' />
          </a>
        )}

        {/* Form Container */}
        <div className='flex-1 flex justify-center items-center pt-[10px]'>
          <div className='flex flex-col justify-center max-w-xl w-[55%] mx-auto'>
            <div className='flex justify-center mb-4'>
              <img src={logo} alt={`${name} Logo`} className='h-12' />
            </div>

            {currentTab === AuthTab.SIGNUP && (
              <>
                <h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>
                  {t('createAccount.heading')}
                </h2>
                <p className='text-center text-gray-600 mb-10'>
                  {t('createAccount.subheading', { brandName: name })}
                </p>
                <div className='mb-6'>
                  <RegionSelector />
                </div>
              </>
            )}
            {currentTab === AuthTab.LOGIN && (
              <>
                <h2 className='text-3xl font-medium text-center text-gray-800 mb-3'>
                  {t('login.heading')}
                </h2>
                <p className='text-center text-gray-600 mb-10'>{t('login.subheading')}</p>
                <div className='mb-6'>
                  <RegionSelector />
                </div>
              </>
            )}
            {currentTab === AuthTab.FORGOT_PASSWORD && (
              <>
                <h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>
                  {t('forgotPassword.heading')}
                </h2>
                <p className='text-center text-gray-600 mb-8'>{t('forgotPassword.subheading')}</p>
              </>
            )}
            {currentTab === AuthTab.RESET_PASSWORD && (
              <>
                <h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>
                  {t('resetPassword.heading')}
                </h2>
                <p className='text-center text-gray-600 mb-8'>{t('resetPassword.subheading')}</p>
              </>
            )}

            {renderForm()}
          </div>
        </div>
      </div>

      {/* Right side - Marketing Content */}
      <div className='w-[55%] min-h-screen flex'>
        <LandingSection />
      </div>
    </div>
  );
};

export default AuthPage;
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/auth/Auth.tsx
git commit -m "feat(auth): replace hardcoded logo, Slack banner, and headings with config + i18n"
```

---

## Task 7: Update `LandingSection.tsx` — tagline and background image

**Files:**
- Modify: `src/pages/auth/LandingSection.tsx`

- [ ] **Step 1: Add config + i18n imports and replace hardcoded tagline and bg image**

Add these imports at the top of `LandingSection.tsx`:

```ts
import { useTranslation } from 'react-i18next';
import { config } from '@/config/config';
```

Inside the `LandingSection` component body, add:

```ts
const { t } = useTranslation('auth');
const bgImage = config.authPage.loginBgImage ?? authBg;
```

Replace the `backgroundImage` style value:

```tsx
// Before
backgroundImage: `url(${authBg})`,

// After
backgroundImage: `url(${bgImage})`,
```

Replace the hardcoded tagline:

```tsx
// Before
<h2 className='text-[28px] font-normal text-zinc-950 text-center mb-[44px]'>
  Focus on <span className='font-medium'>building</span>, not billing.
</h2>

// After
<h2 className='text-[28px] font-normal text-zinc-950 text-center mb-[44px]'>
  {config.authPage.tagline ?? t('landing.defaultTagline')}
</h2>
```

Replace the "Trusted by" string:

```tsx
// Before
<div className='text-center font-inter text-black font-medium mb-14 text-lg'>Trusted by</div>

// After
<div className='text-center font-inter text-black font-medium mb-14 text-lg'>{t('landing.trustedBy')}</div>
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/auth/LandingSection.tsx
git commit -m "feat(auth): make landing section tagline and background image config-driven"
```

---

## Task 8: Update `LoginForm.tsx` and `SignupForm.tsx` — i18n strings

**Files:**
- Modify: `src/pages/auth/LoginForm.tsx`
- Modify: `src/pages/auth/SignupForm.tsx`

- [ ] **Step 1: Update `LoginForm.tsx`**

Add import:
```ts
import { useTranslation } from 'react-i18next';
```

Inside the component, add:
```ts
const { t } = useTranslation('auth');
```

Replace hardcoded strings in JSX:

| Before | After |
|---|---|
| `label='Email'` | `label={t('fields.email')}` |
| `placeholder='Enter your email address'` (email) | `placeholder={t('fields.emailPlaceholder')}` |
| `label` text `Password` (the `<label>` tag) | `{t('fields.password')}` |
| `placeholder='Enter your password'` | `placeholder={t('fields.passwordPlaceholder')}` |
| `>Forgot your password?</button>` | `>{t('links.forgotPassword')}</button>` |
| `>Login</Button>` | `>{t('buttons.login')}</Button>` |
| `<span ...>or</span>` | `<span ...>{t('divider')}</span>` |
| `Don't have an account?{' '}` | `{t('noAccount')}{' '}` |
| `>Sign up</button>` | `>{t('links.signUp')}</button>` |

- [ ] **Step 2: Update `SignupForm.tsx`**

Add import:
```ts
import { useTranslation } from 'react-i18next';
```

Inside the component, add:
```ts
const { t } = useTranslation('auth');
```

Replace hardcoded strings in JSX:

| Before | After |
|---|---|
| `label='Email'` | `label={t('fields.email')}` |
| `placeholder='Enter your email address'` | `placeholder={t('fields.emailPlaceholder')}` |
| `label='Password'` | `label={t('fields.password')}` |
| `placeholder='Enter your password'` | `placeholder={t('fields.passwordPlaceholder')}` |
| `label='Confirm Password'` | `label={t('fields.confirmPassword')}` |
| `placeholder='Confirm your password'` | `placeholder={t('fields.confirmPasswordPlaceholder')}` |
| `>Create Account</Button>` | `>{t('buttons.createAccount')}</Button>` |
| `<span ...>or</span>` | `<span ...>{t('divider')}</span>` |
| `Already have an account?{' '}` | `{t('hasAccount')}{' '}` |
| `>Log in</button>` | `>{t('links.logIn')}</button>` |

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/auth/LoginForm.tsx src/pages/auth/SignupForm.tsx
git commit -m "feat(auth): replace hardcoded strings in LoginForm and SignupForm with i18n"
```

---

## Task 9: Update `ForgotPasswordForm.tsx` and `ResetPasswordForm.tsx` — i18n strings

**Files:**
- Modify: `src/pages/auth/ForgotPasswordForm.tsx`
- Modify: `src/pages/auth/ResetPasswordForm.tsx`

- [ ] **Step 1: Update `ForgotPasswordForm.tsx`**

Add import:
```ts
import { useTranslation } from 'react-i18next';
```

Inside the component, add:
```ts
const { t } = useTranslation('auth');
```

Replace in JSX:

| Before | After |
|---|---|
| `>Email</label>` | `>{t('fields.email')}</label>` |
| `placeholder='Enter your email address'` | `placeholder={t('fields.emailPlaceholder')}` |
| `>Send Reset Link</Button>` | `>{t('buttons.sendResetLink')}</Button>` |
| `Remember your password?{' '}` | `{t('rememberPassword')}{' '}` |
| `>Back to login</button>` | `>{t('links.backToLogin')}</button>` |

- [ ] **Step 2: Update `ResetPasswordForm.tsx`**

Add import:
```ts
import { useTranslation } from 'react-i18next';
```

Inside the component, add:
```ts
const { t } = useTranslation('auth');
```

Replace in JSX:

| Before | After |
|---|---|
| `>Checking your link...</p>` | `>{t('resetLink.checking')}</p>` |
| `>Link expired or already used</h3>` | `>{t('resetLink.expiredTitle')}</h3>` |
| `>This password reset link is no longer valid...` | `>{t('resetLink.expiredDescription')}</p>` |
| `>Request new reset link</Button>` | `>{t('buttons.requestNewResetLink')}</Button>` |
| `>New password</label>` | `>{t('fields.newPassword')}</label>` |
| `placeholder='Enter new password'` | `placeholder={t('fields.newPasswordPlaceholder')}` |
| `>Confirm password</label>` | `>{t('fields.confirmNewPassword')}</label>` |
| `placeholder='Confirm new password'` | `placeholder={t('fields.confirmNewPasswordPlaceholder')}` |
| `>Set new password</Button>` | `>{t('buttons.setNewPassword')}</Button>` |
| `Remember your password?{' '}` (both occurrences) | `{t('rememberPassword')}{' '}` |
| `>Back to login</button>` (both occurrences) | `>{t('links.backToLogin')}</button>` |

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/auth/ForgotPasswordForm.tsx src/pages/auth/ResetPasswordForm.tsx
git commit -m "feat(auth): replace hardcoded strings in ForgotPasswordForm and ResetPasswordForm with i18n"
```

---

## Task 10: Update `EmailVerification.tsx` — logo, support email, i18n strings

**Files:**
- Modify: `src/pages/auth/EmailVerification.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { useNavigate, useLocation } from 'react-router';
import { Button } from '@/components/atoms';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import supabase from '@/core/services/supbase/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/context/BrandContext';
import { config } from '@/config/config';

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('auth');
  const { logo, name } = useBrand();
  const { authPage } = config;

  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get('email') || '';
  const isNewSignup = searchParams.get('new') === 'true';

  const { mutate: resendVerification, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as SupabaseClient).auth.resend({
        email: email,
        type: 'signup',
      });
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success('Verification email has been resent. Please check your inbox.');
    },
    onError: (error: ServerError) => {
      const errorMessage = error?.error?.message || 'Failed to resend verification email';
      toast.error(errorMessage);
    },
  });

  const handleResend = () => {
    if (!email) {
      toast.error('Email address is missing');
      return;
    }
    resendVerification();
  };

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  return (
    <div
      className='fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto p-4'
      style={{
        backgroundImage: `url('/assets/onboarding.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
      <div className='absolute inset-0 bg-white/30' aria-hidden />
      <div className='relative w-full max-w-[480px] rounded-2xl bg-white p-8 shadow-lg'>
        <div className='mb-6 flex justify-center'>
          <img src={logo} alt={name} className='h-12' />
        </div>

        <h2 className='text-center text-2xl font-semibold text-zinc-900'>
          {isNewSignup ? t('verification.verifyHeading') : t('verification.verificationHeading')}
        </h2>

        <div className='mt-4 space-y-3 text-center'>
          <p className='text-sm text-zinc-600'>{t('verification.sentTo')}</p>
          <p className='break-all text-sm font-medium text-zinc-900'>{email}</p>
          <p className='text-sm text-zinc-500'>{t('verification.clickLink')}</p>
        </div>

        <div className='mt-8 flex flex-col gap-4'>
          <Button onClick={handleResend} className='h-10 w-full rounded-lg' isLoading={isPending}>
            {t('buttons.resendVerification')}
          </Button>
          <Button onClick={handleGoToLogin} variant='outline' className='h-10 w-full rounded-lg'>
            {t('buttons.backToLogin')}
          </Button>
        </div>

        <p className='mt-5 text-center text-sm text-zinc-500'>
          {t('verification.needHelp')}{' '}
          <a href={`mailto:${authPage.supportEmail}`} className='font-medium text-blue-600 hover:text-blue-500'>
            {authPage.supportEmail}
          </a>
        </p>
      </div>
    </div>
  );
};

export default EmailVerification;
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/auth/EmailVerification.tsx
git commit -m "feat(auth): replace hardcoded logo, support email, and strings in EmailVerification"
```

---

## Task 11: Update `ResendVerification.tsx` — logo, brand name, i18n strings

**Files:**
- Modify: `src/pages/auth/ResendVerification.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import supabase from '@/core/services/supbase/config';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/context/BrandContext';

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('auth');
  const { logo, name } = useBrand();

  const isNewSignup = location.search.includes('new=true');
  const userEmail = new URLSearchParams(location.search).get('email') || '';

  const [resendSuccess, setResendSuccess] = useState(false);

  const { mutate: resendVerification, isPending } = useMutation({
    mutationFn: async (emailToResend: string) => {
      return await supabase.auth.resend({
        email: emailToResend,
        type: 'signup',
      });
    },
    onSuccess: () => {
      toast.success('Verification email has been resent. Please check your inbox.');
      setResendSuccess(true);
    },
    onError: (error: ServerError) => {
      const errorMessage = error.error.message || 'Failed to resend verification email';
      toast.error(errorMessage);
    },
  });

  const handleResend = () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    resendVerification(email);
  };

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  if (isNewSignup || resendSuccess) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4'>
        <div className='w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg'>
          <div className='text-center'>
            <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50'>
              <img src='/assets/svg/query.svg' alt='Email' className='h-10 w-10' />
            </div>
            <h2 className='mt-6 text-2xl font-bold text-gray-900'>{t('resend.checkEmailHeading')}</h2>
            <p className='mt-2 text-gray-600'>
              {t('resend.checkEmailDescription', { brandName: name })}
            </p>
            <p className='mt-1 font-medium text-gray-800'>{resendSuccess ? email : userEmail}</p>
            <p className='mt-4 text-sm text-gray-600'>{t('resend.checkEmailClickLink')}</p>
          </div>

          <div className='mt-6 space-y-4'>
            <Button onClick={handleGoToLogin} className='w-full' variant='outline'>
              {t('buttons.backToLoginCaps')}
            </Button>

            <div className='text-center'>
              <p className='text-sm text-gray-500'>
                {t('resend.didntReceive')}{' '}
                <button onClick={() => setResendSuccess(false)} className='font-medium text-blue-600 hover:text-blue-500'>
                  {t('links.tryAgain')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4'>
      <div className='w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50'>
            <img src={logo} alt={`${name} Logo`} className='h-10 w-10' />
          </div>
          <h2 className='mt-6 text-2xl font-bold text-gray-900'>{t('resend.resendHeading')}</h2>
          <p className='mt-2 text-gray-600'>{t('resend.resendDescription')}</p>
        </div>

        <div className='mt-6 space-y-4'>
          <Input
            id='email'
            name='email'
            type='email'
            label={t('fields.email')}
            placeholder={t('fields.emailPlaceholder')}
            required
            onChange={(value) => setEmail(value)}
            value={email}
          />

          <Button onClick={handleResend} className='w-full !mt-6' isLoading={isPending}>
            {t('buttons.resendVerificationCaps')}
          </Button>

          <div className='text-center'>
            <p className='mt-4 text-sm text-gray-600'>
              {t('rememberPassword')}{' '}
              <button onClick={handleGoToLogin} className='font-medium text-blue-600 hover:text-blue-500'>
                {t('links.backToLogin')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResendVerification;
```

- [ ] **Step 2: Run TypeScript check and full test suite**

```bash
npx tsc --noEmit && npx vitest run
```

Expected: TypeScript clean, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/auth/ResendVerification.tsx
git commit -m "feat(auth): replace hardcoded logo and brand name in ResendVerification with config + i18n"
```

---

## Task 12: End-to-end smoke test

- [ ] **Step 1: Test default Flexprice behavior (no env vars set)**

```bash
npm run dev
```

Open http://localhost:3000/auth — verify:
- Logo is the existing Flexprice comicon.png
- Slack banner is visible with "Join the Flexprice Community on Slack"
- Tab title shows "Flexprice" (after navigating to any inner page)
- All form labels and buttons are in English

- [ ] **Step 2: Test Tirdad white-label config**

Create a `.env.local` file with:

```env
VITE_BRAND_CONFIG={"name":"Tirdad","logo":"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Blank_square.svg/480px-Blank_square.svg.png","primaryColor":"#0d1b2a","favicon":"/favicon.ico"}
VITE_AUTH_CONFIG={"tagline":"The Complete Control Plane for Modern Pricing","supportEmail":"support@tirdad.com","loginBgImage":null,"slackCommunityUrl":null}
VITE_DEFAULT_LOCALE=ar
```

Restart dev server:
```bash
npm run dev
```

Open http://localhost:3000/auth — verify:
- Logo is the placeholder image (URL from env)
- Slack banner is **not** visible
- All form labels and headings are in Arabic
- `document.dir` is `rtl` (check in DevTools: `document.documentElement.dir`)
- Tab title shows "Tirdad" after navigating to an inner page
- Support email shows `support@tirdad.com` on email verification page

- [ ] **Step 3: Remove `.env.local` test file**

```bash
rm .env.local
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(white-label): complete white-label + i18n implementation for auth pages"
```
