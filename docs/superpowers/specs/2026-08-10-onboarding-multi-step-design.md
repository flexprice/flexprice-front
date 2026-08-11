# Onboarding Multi-Step Form Design

**Date:** 2026-08-10  
**Branch:** onboardingaug10  
**Status:** Approved for implementation

## Goal

Split the tenant onboarding form from a single long page into a 3-step wizard on the same route, update team-size options, and keep light/dark aesthetics via existing design tokens.

## UX

- Same URL / fullscreen card shell as today (`OnboardingTenant`).
- Steps (2 fields each):
  1. Organization name + Website URL
  2. Role + Team size
  3. Pricing model + Referral source
- Progress via existing `Stepper` atom (design tokens → dark mode safe).
- Footer: Back (hidden on step 1) + Continue; final step submits.
- Validation per step before advancing; submit only after final-step validation.
- Required fields unchanged: org name, website, role, referral. Optional: team size, pricing.
- Form state stays in the parent so Back preserves answers.

## Team size options

Remove `1-10`. New set: `11-20`, `21-50`, `51-100`, `100+`.

## Architecture

```
src/pages/onboarding/
  OnboardingTenant.tsx              # orchestrator: state, step nav, validation, API
  onboardingConstants.ts            # select options + step metadata
  steps/
    OnboardingOrgStep.tsx
    OnboardingProfileStep.tsx
    OnboardingPreferencesStep.tsx
```

- Parent owns all form state, errors, mutations.
- Step components are presentational (values, setters, errors, disabled).
- No new routes. No Zustand. Same `TenantApi` / `OnboardingApi` submit path.

## Out of scope

- Customer onboarding settings tab
- Pricing setup / AI onboarding pages
- Changing required-field rules beyond current behavior
