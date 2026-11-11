# Route → component → API map

Static dependency reachability, not proof that every call executes on mount. Shared imports, drawers and optional tabs are included. Parent layout queries and permission checks also run. Route registration is read from the TypeScript AST; dynamic feature gates remain conditional.

## `/login`

Registration: `src/core/routes/Routes.tsx:213`. Component: `src/pages/auth/Auth.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<Auth />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `AuthApi.Login` | `src/pages/auth/LoginForm.tsx:58` |
| `AuthApi.Signup` | `src/pages/auth/SignupForm.tsx:58` |

## `/auth`

Registration: `src/core/routes/Routes.tsx:217`. Component: `src/pages/auth/Auth.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<Auth />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `AuthApi.Login` | `src/pages/auth/LoginForm.tsx:58` |
| `AuthApi.Signup` | `src/pages/auth/SignupForm.tsx:58` |

## `/auth/signup/confirmation`

Registration: `src/core/routes/Routes.tsx:221`. Component: `src/pages/auth/SignupConfirmation.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<SignupConfirmation />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `AuthApi.Signup` | `src/pages/auth/SignupConfirmation.tsx:51` |

## `/auth/resend-verification`

Registration: `src/core/routes/Routes.tsx:225`. Component: `src/pages/auth/ResendVerification.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<ResendVerification />

## `/auth/verify-email`

Registration: `src/core/routes/Routes.tsx:229`. Component: `src/pages/auth/EmailVerification.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<EmailVerification />

## `/auth/callback`

Registration: `src/core/routes/Routes.tsx:233`. Component: `src/pages/auth/SamlCallback.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<SamlCallback />

## `/customer-portal`

Registration: `src/core/routes/Routes.tsx:239`. Component: `src/pages/customer-portal/CustomerPortalWrapper.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<CustomerPortalWrapper />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `CustomerPortalApi.getConfig` | `src/context/PortalConfigContext.tsx:33` |
| `CustomerPortalApi.getCheckoutSession` | `src/components/customer-portal/useCheckoutReturn.ts:111` |
| `CustomerPortalApi.getSubscriptions` | `src/components/customer-portal/SectionContent.tsx:201` |
| `CustomerPortalApi.getUsageSummary` | `src/components/customer-portal/SectionContent.tsx:207` |
| `CustomerPortalApi.getCustomer` | `src/pages/customer-portal/CustomerPortal.tsx:51` |
| `CustomerPortalApi.getWallets` | `src/pages/customer-portal/CustomerPortal.tsx:68` |
| `CustomerPortalApi.getInvoices` | `src/pages/customer-portal/CustomerPortal.tsx:73` |

## `/checkout`

Registration: `src/core/routes/Routes.tsx:243`. Component: `src/pages/checkout/CheckoutPage.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<CheckoutPage />

## `/onboarding`

Registration: `src/core/routes/Routes.tsx:247`. Component: `src/pages/onboarding/OnboardingTenant.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<OnboardingTenant />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `TenantApi.getTenantById` | `src/pages/onboarding/useOnboardingTenant.ts:25` |
| `TenantApi.updateTenant` | `src/pages/onboarding/useOnboardingTenant.ts:33` |
| `OnboardingApi.recordOnboardingData` | `src/pages/onboarding/useOnboardingTenant.ts:44` |

## `/onboarding/pricing-setup`

Registration: `src/core/routes/Routes.tsx:251`. Component: `src/pages/onboarding/PricingSetupPage.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<PricingSetupPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `PlanApi.getPlansByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:20` |
| `FeatureApi.getFeaturesByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:21` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `AiPricingParseApi.parseGemini` | `src/api/ai/llm.ts:66` |
| `CreditGrantApi.list` | `src/api/ai/orchestrator.ts:133` |
| `CreditGrantApi.create` | `src/api/ai/orchestrator.ts:143` |
| `FeatureApi.listFeatures` | `src/api/ai/orchestrator.ts:187` |
| `FeatureApi.createFeature` | `src/api/ai/orchestrator.ts:208` |
| `PlanApi.getPlansByFilter` | `src/api/ai/orchestrator.ts:247` |
| `PlanApi.createPlan` | `src/api/ai/orchestrator.ts:260` |
| `PlanApi.createPlan` | `src/api/ai/orchestrator.ts:268` |
| `PriceApi.CreatePrice` | `src/api/ai/orchestrator.ts:293` |
| `PriceApi.CreatePrice` | `src/api/ai/orchestrator.ts:318` |
| `EntitlementApi.search` | `src/api/ai/orchestrator.ts:349` |
| `EntitlementApi.create` | `src/api/ai/orchestrator.ts:364` |

## `/checkout`

Registration: `src/core/routes/Routes.tsx:255`. Component: `src/pages/checkout/CheckoutPage.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<CheckoutPage />

## `/`

Registration: `src/core/routes/Routes.tsx:260`. Component: `src/core/auth/AuthProvider.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

(
			<AuthMiddleware>
				<MainLayout />
			</AuthMiddleware>
		)

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |

## `/`

Registration: `src/core/routes/Routes.tsx:269`. Component: `src/core/routes/Routes.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<DefaultRoute />

## `/home`

Registration: `src/core/routes/Routes.tsx:273`. Component: `src/pages/home/DashboardPage.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<DashboardPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `DashboardApi.getRevenues` | `src/hooks/useDashboardData.tsx:22` |
| `DashboardApi.getRevenues` | `src/hooks/useDashboardData.tsx:64` |
| `DashboardApi.getRevenues` | `src/hooks/useDashboardData.tsx:117` |
| `EventsApi.getMonitoringData` | `src/pages/home/DashboardPage.tsx:93` |

## `/product-catalog`

Registration: `src/core/routes/Routes.tsx:277`. Component: `container/inline`. Permission: `inherited, public or component-level; inspect route chain`.



## `/product-catalog/features`

Registration: `src/core/routes/Routes.tsx:280`. Component: `src/pages/product-catalog/features/Features.tsx`. Permission: `requirePermission('feature', 'read')`.

<FeaturesPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `FeatureApi.updateFeature` | `src/components/molecules/FeatureDrawer/FeatureDrawer.tsx:46` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CustomerApi.searchCustomers` | `src/utils/filterSearchHelpers.ts:19` |
| `CustomerApi.searchCustomers` | `src/utils/filterSearchHelpers.ts:29` |
| `PlanApi.getPlansByFilter` | `src/utils/filterSearchHelpers.ts:56` |
| `GroupApi.getGroupsByFilter` | `src/utils/filterSearchHelpers.ts:86` |
| `UserApi.getAllUsers` | `src/utils/filterSearchHelpers.ts:107` |
| `FeatureApi.deleteFeature` | `src/pages/product-catalog/features/Features.tsx:264` |
| `FeatureApi.getFeaturesByFilter` | `src/pages/product-catalog/features/Features.tsx:316` |
| `FeatureApi.getFeaturesByFilter` | `src/pages/product-catalog/features/Features.tsx:318` |

## `/product-catalog/features/create-feature`

Registration: `src/core/routes/Routes.tsx:285`. Component: `src/pages/product-catalog/features/AddFeature.tsx`. Permission: `requirePermission('feature', 'write')`.

<AddFeaturePage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `PlanApi.getPlansByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:20` |
| `FeatureApi.getFeaturesByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:21` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `FeatureApi.createFeature` | `src/pages/product-catalog/features/AddFeature.tsx:1009` |

## `/product-catalog/features/:id`

Registration: `src/core/routes/Routes.tsx:290`. Component: `src/pages/product-catalog/features/FeatureDetails.tsx`. Permission: `requirePermission('feature', 'read')`.

<FeatureDetails />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `PlanApi.getPlansByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:20` |
| `FeatureApi.getFeaturesByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:21` |
| `PlanApi.updatePlan` | `src/components/molecules/PlanDrawer/PlanDrawer.tsx:45` |
| `PlanApi.createPlan` | `src/components/molecules/PlanDrawer/PlanDrawer.tsx:47` |
| `PlanApi.clonePlan` | `src/components/molecules/DuplicatePlanDialog/DuplicatePlanDialog.tsx:81` |
| `FeatureApi.updateFeature` | `src/components/molecules/FeatureDrawer/FeatureDrawer.tsx:46` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `PlanApi.getPlansByFilter` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:83` |
| `WorkflowApi.search` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:101` |
| `PlanApi.deletePlan` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:144` |
| `PlanApi.synchronizePlanPricesWithSubscription` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:156` |
| `FeatureApi.getFeatureById` | `src/pages/product-catalog/features/FeatureDetails.tsx:135` |
| `EntitlementApi.search` | `src/pages/product-catalog/features/FeatureDetails.tsx:142` |
| `PriceApi.ListPrices` | `src/pages/product-catalog/features/FeatureDetails.tsx:163` |
| `FeatureApi.deleteFeature` | `src/pages/product-catalog/features/FeatureDetails.tsx:192` |
| `FeatureApi.updateFeature` | `src/pages/product-catalog/features/FeatureDetails.tsx:407` |

## `/product-catalog/plan`

Registration: `src/core/routes/Routes.tsx:295`. Component: `src/pages/product-catalog/plans/Plans.tsx`. Permission: `requirePermission('plan', 'read')`.

<PricingPlans />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `PlanApi.getPlansByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:20` |
| `FeatureApi.getFeaturesByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:21` |
| `PlanApi.updatePlan` | `src/components/molecules/PlanDrawer/PlanDrawer.tsx:45` |
| `PlanApi.createPlan` | `src/components/molecules/PlanDrawer/PlanDrawer.tsx:47` |
| `PlanApi.clonePlan` | `src/components/molecules/DuplicatePlanDialog/DuplicatePlanDialog.tsx:81` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `PlanApi.getPlansByFilter` | `src/pages/product-catalog/plans/Plans.tsx:152` |
| `PlanApi.deletePlan` | `src/pages/product-catalog/plans/Plans.tsx:160` |
| `PlanApi.getPlansByFilter` | `src/pages/product-catalog/plans/Plans.tsx:368` |
| `PlanApi.getPlansByFilter` | `src/pages/product-catalog/plans/Plans.tsx:375` |

## `/product-catalog/plan/:planId`

Registration: `src/core/routes/Routes.tsx:300`. Component: `src/pages/product-catalog/plans/PlanDetailsPage.tsx`. Permission: `requirePermission('plan', 'read')`.

<PlanDetailsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `PlanApi.getPlansByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:20` |
| `FeatureApi.getFeaturesByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:21` |
| `PlanApi.updatePlan` | `src/components/molecules/PlanDrawer/PlanDrawer.tsx:45` |
| `PlanApi.createPlan` | `src/components/molecules/PlanDrawer/PlanDrawer.tsx:47` |
| `PlanApi.clonePlan` | `src/components/molecules/DuplicatePlanDialog/DuplicatePlanDialog.tsx:81` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `PlanApi.getPlansByFilter` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:83` |
| `WorkflowApi.search` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:101` |
| `PlanApi.deletePlan` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:144` |
| `PlanApi.synchronizePlanPricesWithSubscription` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:156` |

## `/product-catalog/plan/:planId/`

Registration: `src/core/routes/Routes.tsx:305`. Component: `src/pages/product-catalog/plans/tabs/PlanOverviewTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<PlanOverview />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `PriceApi.UpdatePrice` | `src/components/molecules/UpdatePriceDialog/UpdatePriceDialog.tsx:139` |
| `PriceApi.UpdatePrice` | `src/components/molecules/UpdatePriceDetailsDrawer/UpdatePriceDetailsDrawer.tsx:41` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `PlanApi.getPlansByFilter` | `src/pages/product-catalog/plans/tabs/PlanOverviewTab.tsx:21` |
| `PriceApi.DeletePrice` | `src/components/organisms/PlanPriceTable/PlanPriceTable.tsx:290` |
| `PriceApi.searchPrices` | `src/components/organisms/PlanPriceTable/PlanPriceTable.tsx:404` |

## `/product-catalog/plan/:planId/entitlements`

Registration: `src/core/routes/Routes.tsx:310`. Component: `src/pages/product-catalog/plans/tabs/PlanEntitlementsTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<PlanEntitlements />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `FeatureApi.getFeatureById` | `src/components/molecules/AddEntitlementDrawer/AddEntitlementDrawer.tsx:295` |
| `EntitlementApi.createBulk` | `src/components/molecules/AddEntitlementDrawer/AddEntitlementDrawer.tsx:372` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `EntitlementApi.search` | `src/pages/product-catalog/plans/tabs/PlanEntitlementsTab.tsx:86` |
| `EntitlementApi.delete` | `src/pages/product-catalog/plans/tabs/PlanEntitlementsTab.tsx:132` |

## `/product-catalog/plan/:planId/credit-grants`

Registration: `src/core/routes/Routes.tsx:314`. Component: `src/pages/product-catalog/plans/tabs/PlanCreditGrantsTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<PlanCreditGrants />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `CreditGrantApi.delete` | `src/components/molecules/CreditGrant/CreditGrantsTable.tsx:25` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CreditGrantApi.list` | `src/pages/product-catalog/plans/tabs/PlanCreditGrantsTab.tsx:37` |
| `CreditGrantApi.create` | `src/pages/product-catalog/plans/tabs/PlanCreditGrantsTab.tsx:52` |

## `/product-catalog/plan/:planId/information`

Registration: `src/core/routes/Routes.tsx:318`. Component: `src/pages/product-catalog/plans/tabs/PlanInformationTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<PlanInformation />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `PlanApi.getPlansByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:20` |
| `FeatureApi.getFeaturesByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:21` |
| `PlanApi.updatePlan` | `src/components/molecules/PlanDrawer/PlanDrawer.tsx:45` |
| `PlanApi.createPlan` | `src/components/molecules/PlanDrawer/PlanDrawer.tsx:47` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `IntegrationMappingApi.getIntegrationConfig` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:84` |
| `ConnectionApi.ListPublished` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:93` |
| `IntegrationMappingApi.getIntegrationMappings` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:112` |
| `IntegrationMappingApi.syncIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:141` |
| `IntegrationMappingApi.linkIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:156` |
| `IntegrationMappingApi.delinkIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:176` |
| `PaymentApi.getMoyasarSetupIntent` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:193` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `PlanApi.getPlanById` | `src/pages/product-catalog/plans/tabs/PlanInformationTab.tsx:33` |
| `PlanApi.updatePlan` | `src/pages/product-catalog/plans/tabs/PlanInformationTab.tsx:64` |

## `/product-catalog/plan/:planId/add-charges`

Registration: `src/core/routes/Routes.tsx:324`. Component: `src/pages/product-catalog/plans/AddCharges.tsx`. Permission: `requirePermission('price', 'write')`.

<AddChargesPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `PlanApi.getPlanById` | `src/components/organisms/EntityChargesPage/EntityChargesPage.tsx:178` |
| `AddonApi.Get` | `src/components/organisms/EntityChargesPage/EntityChargesPage.tsx:180` |
| `CostSheetApi.GetCostSheetById` | `src/components/organisms/EntityChargesPage/EntityChargesPage.tsx:182` |
| `PriceApi.CreateBulkPrice` | `src/components/organisms/EntityChargesPage/EntityChargesPage.tsx:193` |
| `PlanApi.getPlanById` | `src/pages/product-catalog/plans/AddCharges.tsx:13` |

## `/product-catalog/coupons`

Registration: `src/core/routes/Routes.tsx:331`. Component: `src/pages/product-catalog/coupons/Coupons.tsx`. Permission: `requirePermission('coupon', 'read')`.

<CouponsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `CouponApi.updateCoupon` | `src/components/molecules/CouponDrawer/CouponDrawer.tsx:45` |
| `CouponApi.createCoupon` | `src/components/molecules/CouponDrawer/CouponDrawer.tsx:47` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CouponApi.deleteCoupon` | `src/pages/product-catalog/coupons/Coupons.tsx:191` |
| `CouponApi.getCouponsByFilters` | `src/pages/product-catalog/coupons/Coupons.tsx:240` |
| `CouponApi.getCouponsByFilters` | `src/pages/product-catalog/coupons/Coupons.tsx:242` |

## `/product-catalog/coupons/:id`

Registration: `src/core/routes/Routes.tsx:336`. Component: `src/pages/product-catalog/coupons/CouponDetails.tsx`. Permission: `requirePermission('coupon', 'read')`.

<CouponDetails />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `CouponApi.getCouponById` | `src/pages/product-catalog/coupons/CouponDetails.tsx:26` |

## `/product-catalog/addons`

Registration: `src/core/routes/Routes.tsx:341`. Component: `src/pages/product-catalog/addons/Addons.tsx`. Permission: `requirePermission('addon', 'read')`.

<AddonsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `AddonApi.Update` | `src/components/molecules/AddonDrawer/AddonDrawer.tsx:38` |
| `AddonApi.Create` | `src/components/molecules/AddonDrawer/AddonDrawer.tsx:40` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `AddonApi.Delete` | `src/pages/product-catalog/addons/Addons.tsx:169` |
| `AddonApi.ListByFilter` | `src/pages/product-catalog/addons/Addons.tsx:217` |
| `AddonApi.ListByFilter` | `src/pages/product-catalog/addons/Addons.tsx:219` |

## `/product-catalog/addons/:id`

Registration: `src/core/routes/Routes.tsx:346`. Component: `src/pages/product-catalog/addons/AddonDetails.tsx`. Permission: `requirePermission('addon', 'read')`.

<AddonDetailsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `CreditGrantApi.delete` | `src/components/molecules/CreditGrant/CreditGrantsTable.tsx:25` |
| `CreditGrantApi.list` | `src/components/molecules/CreditGrant/AddonCreditGrantsSection.tsx:43` |
| `CreditGrantApi.create` | `src/components/molecules/CreditGrant/AddonCreditGrantsSection.tsx:58` |
| `PriceApi.UpdatePrice` | `src/components/molecules/UpdatePriceDialog/UpdatePriceDialog.tsx:139` |
| `PriceApi.UpdatePrice` | `src/components/molecules/UpdatePriceDetailsDrawer/UpdatePriceDetailsDrawer.tsx:41` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `AddonApi.Update` | `src/components/molecules/AddonDrawer/AddonDrawer.tsx:38` |
| `AddonApi.Create` | `src/components/molecules/AddonDrawer/AddonDrawer.tsx:40` |
| `FeatureApi.getFeatureById` | `src/components/molecules/AddEntitlementDrawer/AddEntitlementDrawer.tsx:295` |
| `EntitlementApi.createBulk` | `src/components/molecules/AddEntitlementDrawer/AddEntitlementDrawer.tsx:372` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `EntitlementApi.delete` | `src/pages/product-catalog/addons/AddonDetails.tsx:244` |
| `AddonApi.Get` | `src/pages/product-catalog/addons/AddonDetails.tsx:286` |
| `AddonApi.Delete` | `src/pages/product-catalog/addons/AddonDetails.tsx:293` |
| `PriceApi.DeletePrice` | `src/pages/product-catalog/addons/AddonDetails.tsx:314` |

## `/product-catalog/addons/:addonId/add-charges`

Registration: `src/core/routes/Routes.tsx:351`. Component: `src/pages/product-catalog/addons/AddonCharges.tsx`. Permission: `requirePermission('price', 'write')`.

<AddonChargesPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `PlanApi.getPlanById` | `src/components/organisms/EntityChargesPage/EntityChargesPage.tsx:178` |
| `AddonApi.Get` | `src/components/organisms/EntityChargesPage/EntityChargesPage.tsx:180` |
| `CostSheetApi.GetCostSheetById` | `src/components/organisms/EntityChargesPage/EntityChargesPage.tsx:182` |
| `PriceApi.CreateBulkPrice` | `src/components/organisms/EntityChargesPage/EntityChargesPage.tsx:193` |

## `/product-catalog/cost-sheets`

Registration: `src/core/routes/Routes.tsx:358`. Component: `src/pages/product-catalog/cost-sheets/CostSheets.tsx`. Permission: `requirePermission('costsheet', 'read')`.

<CostSheetsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `CostSheetApi.UpdateCostSheet` | `src/components/molecules/CostSheetDrawer/CostSheetDrawer.tsx:40` |
| `CostSheetApi.CreateCostSheet` | `src/components/molecules/CostSheetDrawer/CostSheetDrawer.tsx:48` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CostSheetApi.DeleteCostSheet` | `src/pages/product-catalog/cost-sheets/CostSheets.tsx:169` |
| `CostSheetApi.GetCostSheetsByFilter` | `src/pages/product-catalog/cost-sheets/CostSheets.tsx:224` |
| `CostSheetApi.GetCostSheetsByFilter` | `src/pages/product-catalog/cost-sheets/CostSheets.tsx:226` |

## `/product-catalog/cost-sheets/:id`

Registration: `src/core/routes/Routes.tsx:363`. Component: `src/pages/product-catalog/cost-sheets/CostSheetDetails.tsx`. Permission: `requirePermission('costsheet', 'read')`.

<CostSheetDetailsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `CostSheetApi.UpdateCostSheet` | `src/components/molecules/CostSheetDrawer/CostSheetDrawer.tsx:40` |
| `CostSheetApi.CreateCostSheet` | `src/components/molecules/CostSheetDrawer/CostSheetDrawer.tsx:48` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CostSheetApi.GetCostSheetById` | `src/pages/product-catalog/cost-sheets/CostSheetDetails.tsx:187` |
| `CostSheetApi.DeleteCostSheet` | `src/pages/product-catalog/cost-sheets/CostSheetDetails.tsx:194` |
| `PriceApi.searchPrices` | `src/pages/product-catalog/cost-sheets/CostSheetDetails.tsx:260` |

## `/product-catalog/cost-sheets/:costSheetId/add-charges`

Registration: `src/core/routes/Routes.tsx:368`. Component: `src/pages/product-catalog/cost-sheets/CostSheetCharges.tsx`. Permission: `requirePermission('price', 'write')`.

<CostSheetChargesPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `PlanApi.getPlanById` | `src/components/organisms/EntityChargesPage/EntityChargesPage.tsx:178` |
| `AddonApi.Get` | `src/components/organisms/EntityChargesPage/EntityChargesPage.tsx:180` |
| `CostSheetApi.GetCostSheetById` | `src/components/organisms/EntityChargesPage/EntityChargesPage.tsx:182` |
| `PriceApi.CreateBulkPrice` | `src/components/organisms/EntityChargesPage/EntityChargesPage.tsx:193` |

## `/product-catalog/groups`

Registration: `src/core/routes/Routes.tsx:373`. Component: `src/pages/product-catalog/groups/Groups.tsx`. Permission: `requirePermission('group', 'read')`.

<GroupsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `GroupApi.updateGroup` | `src/components/molecules/GroupDrawer/GroupDrawer.tsx:38` |
| `GroupApi.createGroup` | `src/components/molecules/GroupDrawer/GroupDrawer.tsx:40` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `GroupApi.deleteGroup` | `src/pages/product-catalog/groups/Groups.tsx:86` |
| `GroupApi.getGroupsByFilter` | `src/pages/product-catalog/groups/Groups.tsx:135` |
| `GroupApi.getGroupsByFilter` | `src/pages/product-catalog/groups/Groups.tsx:147` |

## `/product-catalog/groups/:id`

Registration: `src/core/routes/Routes.tsx:378`. Component: `src/pages/product-catalog/groups/GroupProfilePage.tsx`. Permission: `requirePermission('group', 'read')`.

<GroupProfilePage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `GroupApi.getGroupById` | `src/pages/product-catalog/groups/GroupHeader.tsx:12` |
| `GroupApi.getGroupById` | `src/pages/product-catalog/groups/GroupProfilePage.tsx:38` |

## `/product-catalog/groups/:id/`

Registration: `src/core/routes/Routes.tsx:383`. Component: `src/pages/product-catalog/groups/tabs/GroupOverviewTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<GroupOverviewTabComponent />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `PlanApi.getPlansByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:20` |
| `FeatureApi.getFeaturesByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:21` |
| `PlanApi.updatePlan` | `src/components/molecules/PlanDrawer/PlanDrawer.tsx:45` |
| `PlanApi.createPlan` | `src/components/molecules/PlanDrawer/PlanDrawer.tsx:47` |
| `PlanApi.clonePlan` | `src/components/molecules/DuplicatePlanDialog/DuplicatePlanDialog.tsx:81` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `PlanApi.getPlansByFilter` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:83` |
| `WorkflowApi.search` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:101` |
| `PlanApi.deletePlan` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:144` |
| `PlanApi.synchronizePlanPricesWithSubscription` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:156` |
| `GroupApi.getGroupById` | `src/pages/product-catalog/groups/tabs/GroupOverviewTab.tsx:229` |
| `FeatureApi.getFeaturesByFilter` | `src/pages/product-catalog/groups/tabs/GroupOverviewTab.tsx:276` |
| `PriceApi.searchPrices` | `src/pages/product-catalog/groups/tabs/GroupOverviewTab.tsx:393` |

## `/product-catalog/groups/:id/overview`

Registration: `src/core/routes/Routes.tsx:388`. Component: `src/pages/product-catalog/groups/tabs/GroupOverviewTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<GroupOverviewTabComponent />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `PlanApi.getPlansByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:20` |
| `FeatureApi.getFeaturesByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:21` |
| `PlanApi.updatePlan` | `src/components/molecules/PlanDrawer/PlanDrawer.tsx:45` |
| `PlanApi.createPlan` | `src/components/molecules/PlanDrawer/PlanDrawer.tsx:47` |
| `PlanApi.clonePlan` | `src/components/molecules/DuplicatePlanDialog/DuplicatePlanDialog.tsx:81` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `PlanApi.getPlansByFilter` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:83` |
| `WorkflowApi.search` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:101` |
| `PlanApi.deletePlan` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:144` |
| `PlanApi.synchronizePlanPricesWithSubscription` | `src/pages/product-catalog/plans/PlanDetailsPage.tsx:156` |
| `GroupApi.getGroupById` | `src/pages/product-catalog/groups/tabs/GroupOverviewTab.tsx:229` |
| `FeatureApi.getFeaturesByFilter` | `src/pages/product-catalog/groups/tabs/GroupOverviewTab.tsx:276` |
| `PriceApi.searchPrices` | `src/pages/product-catalog/groups/tabs/GroupOverviewTab.tsx:393` |

## `/product-catalog/groups/:id/information`

Registration: `src/core/routes/Routes.tsx:392`. Component: `src/pages/product-catalog/groups/tabs/GroupInformationTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<GroupInformationTabComponent />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `GroupApi.getGroupById` | `src/pages/product-catalog/groups/tabs/GroupInformationTab.tsx:15` |

## `/product-catalog/price-units`

Registration: `src/core/routes/Routes.tsx:398`. Component: `src/pages/product-catalog/price-units/PriceUnits.tsx`. Permission: `requirePermission('price', 'read')`.

<PriceUnitsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `PriceUnitApi.UpdatePriceUnit` | `src/components/molecules/PriceUnitDrawer/PriceUnitDrawer.tsx:44` |
| `PriceUnitApi.CreatePriceUnit` | `src/components/molecules/PriceUnitDrawer/PriceUnitDrawer.tsx:46` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `PriceUnitApi.DeletePriceUnit` | `src/pages/product-catalog/price-units/PriceUnits.tsx:208` |
| `PriceUnitApi.ListPriceUnitsByFilter` | `src/pages/product-catalog/price-units/PriceUnits.tsx:263` |
| `PriceUnitApi.ListPriceUnitsByFilter` | `src/pages/product-catalog/price-units/PriceUnits.tsx:265` |

## `/billing`

Registration: `src/core/routes/Routes.tsx:407`. Component: `container/inline`. Permission: `inherited, public or component-level; inspect route chain`.



## `/billing/customers`

Registration: `src/core/routes/Routes.tsx:410`. Component: `src/pages/customer/customers/CustomerListPage.tsx`. Permission: `requirePermission('customer', 'read')`.

<CustomerPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `CustomerApi.updateCustomer` | `src/components/molecules/Customer/CreateCustomerDrawer.tsx:194` |
| `CustomerApi.createCustomer` | `src/components/molecules/Customer/CreateCustomerDrawer.tsx:197` |
| `CustomerApi.createDashboardSession` | `src/hooks/useCustomerPortalUrl.ts:45` |
| `CustomerApi.createDashboardSession` | `src/hooks/useCustomerPortalUrl.ts:80` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CustomerApi.deleteCustomerById` | `src/pages/customer/customers/CustomerListPage.tsx:42` |
| `CustomerApi.getCustomersByFilters` | `src/pages/customer/customers/CustomerListPage.tsx:285` |
| `CustomerApi.getCustomersByFilters` | `src/pages/customer/customers/CustomerListPage.tsx:294` |

## `/billing/subscriptions`

Registration: `src/core/routes/Routes.tsx:415`. Component: `src/pages/customer/subscriptions/Subscriptions.tsx`. Permission: `requirePermission('subscription', 'read')`.

<SubscriptionsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `SubscriptionApi.cancelSubscription` | `src/components/molecules/SubscriptionCancelDialog/SubscriptionCancelDialog.tsx:54` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CustomerApi.searchCustomers` | `src/utils/filterSearchHelpers.ts:19` |
| `CustomerApi.searchCustomers` | `src/utils/filterSearchHelpers.ts:29` |
| `PlanApi.getPlansByFilter` | `src/utils/filterSearchHelpers.ts:56` |
| `GroupApi.getGroupsByFilter` | `src/utils/filterSearchHelpers.ts:86` |
| `UserApi.getAllUsers` | `src/utils/filterSearchHelpers.ts:107` |
| `SubscriptionApi.searchSubscriptions` | `src/pages/customer/subscriptions/Subscriptions.tsx:290` |
| `SubscriptionApi.searchSubscriptions` | `src/pages/customer/subscriptions/Subscriptions.tsx:296` |

## `/billing/subscriptions/create`

Registration: `src/core/routes/Routes.tsx:420`. Component: `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx`. Permission: `requirePermission('subscription', 'write')`.

<CreateCustomerSubscriptionPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `CustomerApi.searchCustomers` | `src/components/molecules/Customer/CustomerSearchSelect.tsx:45` |
| `CustomerApi.searchCustomers` | `src/components/molecules/Customer/CustomerMultiSearchSelect.tsx:32` |
| `TaxApi.listTaxRates` | `src/components/molecules/TaxAssociationDialog/TaxAssociationDialog.tsx:58` |
| `CouponApi.getAllCoupons` | `src/components/molecules/SubscriptionDiscountTable/SubscriptionDiscountTable.tsx:29` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `PriceApi.GetPriceById` | `src/hooks/useCommitmentTimeBucketPrices.ts:14` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `CouponApi.getAllCoupons` | `src/components/molecules/LineItemCoupon/LineItemCoupon.tsx:61` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `PriceApi.searchPrices` | `src/hooks/usePlanPrices.ts:40` |
| `PlanApi.getPlansByFilter` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:162` |
| `CustomerApi.getCustomerById` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:184` |
| `CustomerApi.getCustomerSubscriptionById` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:194` |
| `SubscriptionApi.getSubscriptionUsage` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:195` |
| `AddonApi.List` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:208` |
| `PlanApi.getPlansByFilter` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:223` |
| `TaxApi.listTaxAssociations` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:269` |
| `CouponApi.getAllCoupons` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:350` |
| `SubscriptionApi.createSubscription` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:492` |
| `CustomerApi.getCustomerById` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:798` |
| `AddonApi.List` | `src/components/molecules/SubscriptionAddonTable/SubscriptionAddonModal.tsx:79` |
| `AddonApi.List` | `src/components/molecules/SubscriptionAddonTable/SubscriptionAddonTable.tsx:56` |
| `PriceApi.searchPrices` | `src/components/organisms/Subscription/SubscriptionForm.tsx:317` |
| `CreditGrantApi.list` | `src/components/organisms/Subscription/SubscriptionForm.tsx:466` |
| `EntitlementApi.search` | `src/components/organisms/Subscription/SubscriptionForm.tsx:594` |
| `AddonApi.GetEntitlements` | `src/components/organisms/Subscription/SubscriptionForm.tsx:636` |

## `/billing/subscriptions/:id/edit`

Registration: `src/core/routes/Routes.tsx:425`. Component: `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx`. Permission: `requirePermission('subscription', 'write')`.

<CustomerSubscriptionEditPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `CustomerApi.searchCustomers` | `src/components/molecules/Customer/CustomerMultiSearchSelect.tsx:32` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `SubscriptionApi.getSubscriptionEntitlements` | `src/components/molecules/SubscriptionEntitlementsSection/SubscriptionEntitlementsSection.tsx:66` |
| `EntitlementApi.search` | `src/components/molecules/SubscriptionEntitlementsSection/SubscriptionEntitlementsSection.tsx:83` |
| `EntitlementApi.search` | `src/components/molecules/SubscriptionEntitlementsSection/SubscriptionEntitlementsSection.tsx:113` |
| `EntitlementApi.delete` | `src/components/molecules/SubscriptionEntitlementsSection/SubscriptionEntitlementsSection.tsx:160` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `PriceApi.GetPriceById` | `src/hooks/useCommitmentTimeBucketPrices.ts:14` |
| `SubscriptionApi.getSubscription` | `src/components/molecules/SubscriptionAddonsSection/AddAddonDialog.tsx:84` |
| `AddonApi.List` | `src/components/molecules/SubscriptionAddonsSection/AddAddonDialog.tsx:99` |
| `SubscriptionApi.addAddonToSubscription` | `src/components/molecules/SubscriptionAddonsSection/AddAddonDialog.tsx:164` |
| `SubscriptionApi.searchSubscriptionLineItems` | `src/components/molecules/SubscriptionAddonsSection/ConfigureAddonDialog.tsx:70` |
| `SubscriptionApi.updateSubscriptionLineItem` | `src/components/molecules/SubscriptionAddonsSection/ConfigureAddonDialog.tsx:95` |
| `SubscriptionApi.deleteSubscriptionLineItem` | `src/components/molecules/SubscriptionAddonsSection/ConfigureAddonDialog.tsx:107` |
| `SubscriptionApi.getSubscription` | `src/components/molecules/SubscriptionAddonsSection/SubscriptionAddonsSection.tsx:74` |
| `SubscriptionApi.getActiveAddons` | `src/components/molecules/SubscriptionAddonsSection/SubscriptionAddonsSection.tsx:95` |
| `SubscriptionApi.searchSubscriptionLineItems` | `src/components/molecules/SubscriptionAddonsSection/SubscriptionAddonsSection.tsx:131` |
| `SubscriptionApi.removeAddonFromSubscription` | `src/components/molecules/SubscriptionAddonsSection/SubscriptionAddonsSection.tsx:201` |
| `SubscriptionApi.cancelSubscription` | `src/components/organisms/Subscription/SubscriptionActionButton.tsx:116` |
| `SubscriptionApi.activateSubscription` | `src/components/organisms/Subscription/SubscriptionActionButton.tsx:138` |
| `SubscriptionApi.searchSubscriptionLineItems` | `src/components/molecules/Subscription/SubscriptionEditChargesSection.tsx:83` |
| `SubscriptionApi.updateSubscription` | `src/components/molecules/Subscription/SubscriptionEditInheritingCustomersSection.tsx:39` |
| `CustomerApi.getCustomerById` | `src/components/molecules/Subscription/SubscriptionEditInheritingCustomersSection.tsx:67` |
| `SubscriptionApi.executeSubscriptionModify` | `src/components/molecules/Subscription/SubscriptionEditInheritingCustomersSection.tsx:76` |
| `SubscriptionApi.previewSubscriptionModify` | `src/hooks/useSubscriptionQuantityModify.ts:29` |
| `SubscriptionApi.executeSubscriptionModify` | `src/hooks/useSubscriptionQuantityModify.ts:45` |
| `SubscriptionApi.listSubscriptions` | `src/components/molecules/UpdateSubscriptionDrawer/UpdateSubscriptionDrawer.tsx:49` |
| `AlertSettingApi.search` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:55` |
| `AlertSettingApi.update` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:126` |
| `AlertSettingApi.create` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:127` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `FeatureApi.getFeatureById` | `src/components/molecules/AddEntitlementDrawer/AddEntitlementDrawer.tsx:295` |
| `EntitlementApi.createBulk` | `src/components/molecules/AddEntitlementDrawer/AddEntitlementDrawer.tsx:372` |
| `EntitlementApi.update` | `src/components/molecules/EntitlementOverrides/EditSubscriptionEntitlementDrawer.tsx:72` |
| `EntitlementApi.create` | `src/components/molecules/EntitlementOverrides/EditSubscriptionEntitlementDrawer.tsx:80` |
| `TaxApi.deleteTaxAssociation` | `src/components/molecules/TaxAssociationTable/TaxAssociationTable.tsx:116` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CouponApi.listCouponAssociations` | `src/components/molecules/CouponAssociationTable/CouponAssociationTable.tsx:76` |
| `CouponApi.getAllCoupons` | `src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.tsx:43` |
| `SubscriptionApi.executeSubscriptionModify` | `src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.tsx:87` |
| `SubscriptionApi.executeSubscriptionModify` | `src/components/molecules/RemoveCouponDialog/RemoveCouponDialog.tsx:37` |
| `TaxApi.listTaxRates` | `src/components/molecules/ApplyTaxDialog/ApplyTaxDialog.tsx:32` |
| `TaxApi.listTaxAssociations` | `src/components/molecules/ApplyTaxDialog/ApplyTaxDialog.tsx:39` |
| `SubscriptionApi.executeSubscriptionModify` | `src/components/molecules/ApplyTaxDialog/ApplyTaxDialog.tsx:81` |
| `SubscriptionApi.executeSubscriptionModify` | `src/components/molecules/RemoveTaxDialog/RemoveTaxDialog.tsx:37` |
| `SubscriptionApi.getSubscriptionV2` | `src/hooks/useSubscriptionEditCoreQuery.ts:15` |
| `CustomerApi.getCustomerById` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:115` |
| `CreditGrantApi.list` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:124` |
| `SubscriptionApi.searchSubscriptions` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:140` |
| `SubscriptionApi.searchSubscriptionLineItems` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:161` |
| `TaxApi.listTaxAssociations` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:168` |
| `CouponApi.listCouponAssociations` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:180` |
| `SubscriptionApi.updateSubscriptionLineItem` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:200` |
| `SubscriptionApi.deleteSubscriptionLineItem` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:217` |
| `SubscriptionApi.createSubscriptionLineItem` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:230` |
| `SubscriptionApi.updateSubscription` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:243` |
| `CreditGrantApi.create` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:258` |
| `CreditGrantApi.delete` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:273` |

## `/billing/customers/:id/add-subscription`

Registration: `src/core/routes/Routes.tsx:430`. Component: `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx`. Permission: `requirePermission('subscription', 'write')`.

<CreateCustomerSubscriptionPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `CustomerApi.searchCustomers` | `src/components/molecules/Customer/CustomerSearchSelect.tsx:45` |
| `CustomerApi.searchCustomers` | `src/components/molecules/Customer/CustomerMultiSearchSelect.tsx:32` |
| `TaxApi.listTaxRates` | `src/components/molecules/TaxAssociationDialog/TaxAssociationDialog.tsx:58` |
| `CouponApi.getAllCoupons` | `src/components/molecules/SubscriptionDiscountTable/SubscriptionDiscountTable.tsx:29` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `PriceApi.GetPriceById` | `src/hooks/useCommitmentTimeBucketPrices.ts:14` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `CouponApi.getAllCoupons` | `src/components/molecules/LineItemCoupon/LineItemCoupon.tsx:61` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `PriceApi.searchPrices` | `src/hooks/usePlanPrices.ts:40` |
| `PlanApi.getPlansByFilter` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:162` |
| `CustomerApi.getCustomerById` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:184` |
| `CustomerApi.getCustomerSubscriptionById` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:194` |
| `SubscriptionApi.getSubscriptionUsage` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:195` |
| `AddonApi.List` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:208` |
| `PlanApi.getPlansByFilter` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:223` |
| `TaxApi.listTaxAssociations` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:269` |
| `CouponApi.getAllCoupons` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:350` |
| `SubscriptionApi.createSubscription` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:492` |
| `CustomerApi.getCustomerById` | `src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx:798` |
| `AddonApi.List` | `src/components/molecules/SubscriptionAddonTable/SubscriptionAddonModal.tsx:79` |
| `AddonApi.List` | `src/components/molecules/SubscriptionAddonTable/SubscriptionAddonTable.tsx:56` |
| `PriceApi.searchPrices` | `src/components/organisms/Subscription/SubscriptionForm.tsx:317` |
| `CreditGrantApi.list` | `src/components/organisms/Subscription/SubscriptionForm.tsx:466` |
| `EntitlementApi.search` | `src/components/organisms/Subscription/SubscriptionForm.tsx:594` |
| `AddonApi.GetEntitlements` | `src/components/organisms/Subscription/SubscriptionForm.tsx:636` |

## `/billing/taxes`

Registration: `src/core/routes/Routes.tsx:435`. Component: `src/pages/customer/taxes/TaxRatesPage.tsx`. Permission: `requirePermission('tax', 'read')`.

<TaxPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `TaxApi.deleteTaxRate` | `src/components/molecules/TaxTable/TaxTable.tsx:95` |
| `TaxApi.updateTaxRate` | `src/components/molecules/TaxDrawer/TaxDrawer.tsx:56` |
| `TaxApi.createTaxRate` | `src/components/molecules/TaxDrawer/TaxDrawer.tsx:69` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `TaxApi.listTaxRates` | `src/pages/customer/taxes/TaxRatesPage.tsx:29` |

## `/billing/taxes/:taxrateId`

Registration: `src/core/routes/Routes.tsx:440`. Component: `src/pages/customer/taxes/TaxrateDetailsPage.tsx`. Permission: `requirePermission('tax', 'read')`.

<TaxrateDetailsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `TaxApi.updateTaxRate` | `src/components/molecules/TaxDrawer/TaxDrawer.tsx:56` |
| `TaxApi.createTaxRate` | `src/components/molecules/TaxDrawer/TaxDrawer.tsx:69` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `TaxApi.getTaxRate` | `src/pages/customer/taxes/TaxrateDetailsPage.tsx:40` |
| `TaxApi.deleteTaxRate` | `src/pages/customer/taxes/TaxrateDetailsPage.tsx:47` |

## `/billing/invoices`

Registration: `src/core/routes/Routes.tsx:445`. Component: `src/pages/customer/invoices/InvoicePage.tsx`. Permission: `requirePermission('invoice', 'read')`.

<InvoicePage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/api/InvoiceApi.ts:115` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `InvoiceApi.voidInvoice` | `src/components/molecules/InvoiceTable/InvoiceStatusModal.tsx:79` |
| `InvoiceApi.finalizeInvoice` | `src/components/molecules/InvoiceTable/InvoiceStatusModal.tsx:81` |
| `InvoiceApi.updateInvoicePaymentStatus` | `src/components/molecules/InvoiceTable/InvoicePaymentStatusModal.tsx:74` |
| `InvoiceApi.triggerCommunication` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:37` |
| `InvoiceApi.downloadInvoicePdf` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:50` |
| `InvoiceApi.getInvoiceById` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:62` |
| `InvoiceApi.downloadInvoiceCsv` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:63` |
| `InvoiceApi.recalculateInvoice` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:79` |
| `WalletApi.getCustomerWallets` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:72` |
| `ConnectionApi.ListPublished` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:78` |
| `PaymentApi.createPayment` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:233` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CustomerApi.searchCustomers` | `src/utils/filterSearchHelpers.ts:19` |
| `CustomerApi.searchCustomers` | `src/utils/filterSearchHelpers.ts:29` |
| `PlanApi.getPlansByFilter` | `src/utils/filterSearchHelpers.ts:56` |
| `GroupApi.getGroupsByFilter` | `src/utils/filterSearchHelpers.ts:86` |
| `UserApi.getAllUsers` | `src/utils/filterSearchHelpers.ts:107` |
| `CustomerApi.getCustomersByFilters` | `src/pages/customer/invoices/InvoicePage.tsx:103` |
| `InvoiceApi.listInvoices` | `src/pages/customer/invoices/InvoicePage.tsx:138` |
| `InvoiceApi.listInvoices` | `src/pages/customer/invoices/InvoicePage.tsx:358` |

## `/billing/invoices/:invoiceId`

Registration: `src/core/routes/Routes.tsx:450`. Component: `src/pages/customer/invoices/InvoiceDetailsPage.tsx`. Permission: `requirePermission('invoice', 'read')`.

<InvoiceDetailsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/api/InvoiceApi.ts:115` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `InvoiceApi.voidInvoice` | `src/components/molecules/InvoiceTable/InvoiceStatusModal.tsx:79` |
| `InvoiceApi.finalizeInvoice` | `src/components/molecules/InvoiceTable/InvoiceStatusModal.tsx:81` |
| `InvoiceApi.updateInvoicePaymentStatus` | `src/components/molecules/InvoiceTable/InvoicePaymentStatusModal.tsx:74` |
| `InvoiceApi.triggerCommunication` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:37` |
| `InvoiceApi.downloadInvoicePdf` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:50` |
| `InvoiceApi.getInvoiceById` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:62` |
| `InvoiceApi.downloadInvoiceCsv` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:63` |
| `InvoiceApi.recalculateInvoice` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:79` |
| `WalletApi.getCustomerWallets` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:72` |
| `ConnectionApi.ListPublished` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:78` |
| `PaymentApi.createPayment` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:233` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `TaxApi.getTaxRate` | `src/components/molecules/AppliedTaxesTable/AppliedTaxesTable.tsx:51` |
| `IntegrationMappingApi.getIntegrationConfig` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:84` |
| `ConnectionApi.ListPublished` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:93` |
| `IntegrationMappingApi.getIntegrationMappings` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:112` |
| `IntegrationMappingApi.syncIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:141` |
| `IntegrationMappingApi.linkIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:156` |
| `IntegrationMappingApi.delinkIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:176` |
| `PaymentApi.getMoyasarSetupIntent` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:193` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `InvoiceApi.listInvoices` | `src/pages/customer/customers/invoice/CustomerInvoiceDetail.tsx:47` |
| `CustomerApi.getCustomerById` | `src/pages/customer/customers/invoice/CustomerInvoiceDetail.tsx:66` |
| `InvoiceApi.downloadInvoicePdf` | `src/pages/customer/customers/invoice/CustomerInvoiceDetail.tsx:73` |
| `InvoiceApi.downloadInvoiceCsv` | `src/pages/customer/customers/invoice/CustomerInvoiceDetail.tsx:168` |
| `PaymentApi.getAllPayments` | `src/pages/customer/invoices/InvoiceDetailsPage.tsx:21` |
| `CreditNoteApi.getCreditNotes` | `src/pages/customer/invoices/InvoiceDetailsPage.tsx:32` |

## `/billing/invoices/:invoiceId/edit`

Registration: `src/core/routes/Routes.tsx:455`. Component: `src/pages/customer/invoices/EditInvoicePage.tsx`. Permission: `requirePermission('invoice', 'write')`.

<EditInvoicePage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/api/InvoiceApi.ts:115` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `InvoiceApi.voidInvoice` | `src/components/molecules/InvoiceTable/InvoiceStatusModal.tsx:79` |
| `InvoiceApi.finalizeInvoice` | `src/components/molecules/InvoiceTable/InvoiceStatusModal.tsx:81` |
| `InvoiceApi.updateInvoicePaymentStatus` | `src/components/molecules/InvoiceTable/InvoicePaymentStatusModal.tsx:74` |
| `InvoiceApi.triggerCommunication` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:37` |
| `InvoiceApi.downloadInvoicePdf` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:50` |
| `InvoiceApi.getInvoiceById` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:62` |
| `InvoiceApi.downloadInvoiceCsv` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:63` |
| `InvoiceApi.recalculateInvoice` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:79` |
| `WalletApi.getCustomerWallets` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:72` |
| `ConnectionApi.ListPublished` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:78` |
| `PaymentApi.createPayment` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:233` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `InvoiceApi.getInvoiceById` | `src/pages/customer/invoices/EditInvoicePage.tsx:148` |
| `InvoiceApi.updateInvoice` | `src/pages/customer/invoices/EditInvoicePage.tsx:260` |
| `InvoiceApi.updateInvoicePaymentStatus` | `src/pages/customer/invoices/EditInvoicePage.tsx:263` |
| `InvoiceApi.modifyInvoice` | `src/pages/customer/invoices/EditInvoicePage.tsx:270` |
| `InvoiceApi.modifyInvoice` | `src/pages/customer/invoices/EditInvoicePage.tsx:279` |
| `InvoiceApi.modifyInvoice` | `src/pages/customer/invoices/EditInvoicePage.tsx:287` |
| `InvoiceApi.voidInvoice` | `src/pages/customer/invoices/EditInvoicePage.tsx:294` |
| `InvoiceApi.finalizeInvoice` | `src/pages/customer/invoices/EditInvoicePage.tsx:296` |

## `/billing/credit-notes`

Registration: `src/core/routes/Routes.tsx:460`. Component: `src/pages/customer/creditnotes/CreditNotesPage.tsx`. Permission: `requirePermission('creditnote', ['read', 'write'])`.

<CreditNotesPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `CreditNoteApi.getCreditNotes` | `src/pages/customer/creditnotes/CreditNotesPage.tsx:21` |

## `/billing/credit-notes/:credit_note_id`

Registration: `src/core/routes/Routes.tsx:467`. Component: `src/pages/customer/creditnotes/CreditNoteDetailsPage.tsx`. Permission: `requirePermission('creditnote', ['read', 'write'])`.

<CreditNoteDetailsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `CreditNoteApi.getCreditNoteById` | `src/pages/customer/creditnotes/CreditNoteDetails.tsx:54` |

## `/billing/payments`

Registration: `src/core/routes/Routes.tsx:472`. Component: `src/pages/customer/payments/PaymentPage.tsx`. Permission: `requirePermission('payment', ['read', 'write'])`.

<PaymentPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `UserApi.getAllUsers` | `src/hooks/useAllUsers.ts:10` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `CustomerApi.searchCustomers` | `src/utils/filterSearchHelpers.ts:19` |
| `CustomerApi.searchCustomers` | `src/utils/filterSearchHelpers.ts:29` |
| `PlanApi.getPlansByFilter` | `src/utils/filterSearchHelpers.ts:56` |
| `GroupApi.getGroupsByFilter` | `src/utils/filterSearchHelpers.ts:86` |
| `UserApi.getAllUsers` | `src/utils/filterSearchHelpers.ts:107` |
| `PaymentApi.getAllPayments` | `src/pages/customer/payments/PaymentList.tsx:27` |
| `WalletApi.getAllWalletTransactionsByFilter` | `src/pages/customer/payments/WalletTransactionList.tsx:253` |
| `WalletApi.getAllWalletTransactionsByFilter` | `src/pages/customer/payments/WalletTransactionList.tsx:258` |

## `/billing/customers/:id`

Registration: `src/core/routes/Routes.tsx:481`. Component: `src/pages/customer/customers/CustomerProfilePage.tsx`. Permission: `requirePermission('customer', 'read')`.

<CustomerProfilePage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `CustomerApi.getCustomerById` | `src/components/molecules/Customer/CustomerHeader.tsx:7` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `CustomerApi.getCustomerById` | `src/pages/customer/customers/CustomerProfilePage.tsx:42` |

## `/billing/customers/:id/`

Registration: `src/core/routes/Routes.tsx:486`. Component: `src/pages/customer/tabs/CustomerOverviewTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<Overview />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `SubscriptionApi.cancelSubscription` | `src/components/organisms/Subscription/SubscriptionActionButton.tsx:116` |
| `SubscriptionApi.activateSubscription` | `src/components/organisms/Subscription/SubscriptionActionButton.tsx:138` |
| `AlertSettingApi.search` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:55` |
| `AlertSettingApi.update` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:126` |
| `AlertSettingApi.create` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:127` |
| `IntegrationMappingApi.getIntegrationConfig` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:84` |
| `ConnectionApi.ListPublished` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:93` |
| `IntegrationMappingApi.getIntegrationMappings` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:112` |
| `IntegrationMappingApi.syncIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:141` |
| `IntegrationMappingApi.linkIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:156` |
| `IntegrationMappingApi.delinkIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:176` |
| `PaymentApi.getMoyasarSetupIntent` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:193` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CustomerApi.searchCustomers` | `src/utils/filterSearchHelpers.ts:19` |
| `CustomerApi.searchCustomers` | `src/utils/filterSearchHelpers.ts:29` |
| `PlanApi.getPlansByFilter` | `src/utils/filterSearchHelpers.ts:56` |
| `GroupApi.getGroupsByFilter` | `src/utils/filterSearchHelpers.ts:86` |
| `UserApi.getAllUsers` | `src/utils/filterSearchHelpers.ts:107` |
| `SubscriptionApi.searchSubscriptions` | `src/pages/customer/tabs/CustomerOverviewTab.tsx:142` |
| `PlanApi.getPlansByFilter` | `src/pages/customer/tabs/CustomerOverviewTab.tsx:168` |
| `PriceApi.searchPrices` | `src/pages/customer/tabs/CustomerOverviewTab.tsx:200` |
| `CustomerApi.getUsageSummary` | `src/pages/customer/tabs/CustomerOverviewTab.tsx:246` |
| `CustomerApi.getUpcomingCreditGrantApplications` | `src/pages/customer/tabs/CustomerOverviewTab.tsx:255` |
| `CustomerApi.getCustomerById` | `src/pages/customer/tabs/CustomerOverviewTab.tsx:265` |

## `/billing/customers/:id/overview`

Registration: `src/core/routes/Routes.tsx:491`. Component: `src/pages/customer/tabs/CustomerOverviewTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<Overview />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `SubscriptionApi.cancelSubscription` | `src/components/organisms/Subscription/SubscriptionActionButton.tsx:116` |
| `SubscriptionApi.activateSubscription` | `src/components/organisms/Subscription/SubscriptionActionButton.tsx:138` |
| `AlertSettingApi.search` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:55` |
| `AlertSettingApi.update` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:126` |
| `AlertSettingApi.create` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:127` |
| `IntegrationMappingApi.getIntegrationConfig` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:84` |
| `ConnectionApi.ListPublished` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:93` |
| `IntegrationMappingApi.getIntegrationMappings` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:112` |
| `IntegrationMappingApi.syncIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:141` |
| `IntegrationMappingApi.linkIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:156` |
| `IntegrationMappingApi.delinkIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:176` |
| `PaymentApi.getMoyasarSetupIntent` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:193` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CustomerApi.searchCustomers` | `src/utils/filterSearchHelpers.ts:19` |
| `CustomerApi.searchCustomers` | `src/utils/filterSearchHelpers.ts:29` |
| `PlanApi.getPlansByFilter` | `src/utils/filterSearchHelpers.ts:56` |
| `GroupApi.getGroupsByFilter` | `src/utils/filterSearchHelpers.ts:86` |
| `UserApi.getAllUsers` | `src/utils/filterSearchHelpers.ts:107` |
| `SubscriptionApi.searchSubscriptions` | `src/pages/customer/tabs/CustomerOverviewTab.tsx:142` |
| `PlanApi.getPlansByFilter` | `src/pages/customer/tabs/CustomerOverviewTab.tsx:168` |
| `PriceApi.searchPrices` | `src/pages/customer/tabs/CustomerOverviewTab.tsx:200` |
| `CustomerApi.getUsageSummary` | `src/pages/customer/tabs/CustomerOverviewTab.tsx:246` |
| `CustomerApi.getUpcomingCreditGrantApplications` | `src/pages/customer/tabs/CustomerOverviewTab.tsx:255` |
| `CustomerApi.getCustomerById` | `src/pages/customer/tabs/CustomerOverviewTab.tsx:265` |

## `/billing/customers/:id/information`

Registration: `src/core/routes/Routes.tsx:496`. Component: `src/pages/customer/tabs/CustomerInformationTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<CustomerInformation />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `CustomerApi.updateCustomer` | `src/components/molecules/Customer/CreateCustomerDrawer.tsx:194` |
| `CustomerApi.createCustomer` | `src/components/molecules/Customer/CreateCustomerDrawer.tsx:197` |
| `CustomerApi.createDashboardSession` | `src/hooks/useCustomerPortalUrl.ts:45` |
| `CustomerApi.createDashboardSession` | `src/hooks/useCustomerPortalUrl.ts:80` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `PaymentApi.createSetupIntent` | `src/components/molecules/SaveCardModal/SaveCardModal.tsx:34` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `CustomerApi.getCustomerById` | `src/pages/customer/tabs/CustomerInformationTab.tsx:45` |
| `ConnectionApi.ListPublished` | `src/pages/customer/tabs/CustomerInformationTab.tsx:52` |
| `SubscriptionApi.listSubscriptions` | `src/pages/customer/tabs/CustomerInformationTab.tsx:59` |
| `CustomerApi.getCustomers` | `src/pages/customer/tabs/CustomerInformationTab.tsx:89` |
| `CustomerApi.updateCustomer` | `src/pages/customer/tabs/CustomerInformationTab.tsx:272` |

## `/billing/customers/:id/usage-events`

Registration: `src/core/routes/Routes.tsx:500`. Component: `src/pages/customer/tabs/CustomerUsageEventsTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<CustomerUsageEvents />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EventsApi.getEventDebug` | `src/components/molecules/Events/EventPropertiesDrawer.tsx:36` |
| `CustomerApi.getCustomersByFilters` | `src/components/molecules/Events/EventPropertiesDrawer.tsx:56` |
| `FeatureApi.listFeatures` | `src/components/molecules/Events/EventPropertiesDrawer.tsx:73` |
| `SubscriptionApi.getSubscription` | `src/components/molecules/Events/EventPropertiesDrawer.tsx:94` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `CustomerApi.getCustomerById` | `src/pages/customer/tabs/CustomerUsageEventsTab.tsx:136` |
| `EventsApi.getRawEvents` | `src/pages/customer/tabs/CustomerUsageEventsTab.tsx:211` |

## `/billing/customers/:id/wallet`

Registration: `src/core/routes/Routes.tsx:504`. Component: `src/pages/customer/tabs/CustomerWalletTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<WalletTab />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `CustomerApi.getCustomerSubscriptions` | `src/hooks/useMinCreditExpiryDate.ts:37` |
| `WalletApi.topupWallet` | `src/components/molecules/WalletTopupCard/WalletTopupCard.tsx:166` |
| `WalletApi.debitWallet` | `src/components/molecules/WalletDebitCard/WalletDebitCard.tsx:49` |
| `WalletApi.terminateWallet` | `src/components/molecules/TerminateWalletModal/TerminateWalletModal.tsx:20` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `WalletApi.createWallet` | `src/pages/customer/customers/CreateCustomerWalletModal.tsx:134` |
| `WalletApi.getCustomerWallets` | `src/pages/customer/tabs/CustomerWalletTab.tsx:110` |
| `WalletApi.getWalletBalance` | `src/pages/customer/tabs/CustomerWalletTab.tsx:116` |
| `WalletApi.getWalletTransactions` | `src/pages/customer/tabs/CustomerWalletTab.tsx:127` |
| `WalletApi.updateWallet` | `src/pages/customer/tabs/CustomerWalletTab.tsx:138` |
| `WalletApi.updateWallet` | `src/pages/customer/tabs/CustomerWalletTab.tsx:293` |
| `WalletApi.updateWallet` | `src/pages/customer/tabs/CustomerWalletTab.tsx:312` |

## `/billing/customers/:id/credit-note`

Registration: `src/core/routes/Routes.tsx:508`. Component: `src/pages/customer/creditnotes/CreditNote.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<CreditNote />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CreditNoteApi.getCreditNotes` | `src/pages/customer/creditnotes/CreditNote.tsx:27` |

## `/billing/customers/:id/invoice`

Registration: `src/core/routes/Routes.tsx:512`. Component: `src/pages/customer/tabs/CustomerInvoiceTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<Invoice />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/api/InvoiceApi.ts:115` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `InvoiceApi.voidInvoice` | `src/components/molecules/InvoiceTable/InvoiceStatusModal.tsx:79` |
| `InvoiceApi.finalizeInvoice` | `src/components/molecules/InvoiceTable/InvoiceStatusModal.tsx:81` |
| `InvoiceApi.updateInvoicePaymentStatus` | `src/components/molecules/InvoiceTable/InvoicePaymentStatusModal.tsx:74` |
| `InvoiceApi.triggerCommunication` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:37` |
| `InvoiceApi.downloadInvoicePdf` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:50` |
| `InvoiceApi.getInvoiceById` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:62` |
| `InvoiceApi.downloadInvoiceCsv` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:63` |
| `InvoiceApi.recalculateInvoice` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:79` |
| `WalletApi.getCustomerWallets` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:72` |
| `ConnectionApi.ListPublished` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:78` |
| `PaymentApi.createPayment` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:233` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `InvoiceApi.getCustomerInvoices` | `src/pages/customer/tabs/CustomerInvoiceTab.tsx:27` |
| `CustomerApi.getCustomers` | `src/pages/customer/tabs/CustomerInvoiceTab.tsx:46` |

## `/billing/customers/:id/tax-association`

Registration: `src/core/routes/Routes.tsx:516`. Component: `src/pages/customer/tabs/CustomerTaxAssociationTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<TaxAssociation />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `TaxApi.listTaxRates` | `src/components/molecules/TaxAssociationDialog/TaxAssociationDialog.tsx:58` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `TaxApi.deleteTaxAssociation` | `src/components/molecules/TaxAssociationTable/TaxAssociationTable.tsx:116` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `TaxApi.listTaxAssociations` | `src/pages/customer/tabs/CustomerTaxAssociationTab.tsx:31` |
| `TaxApi.createTaxAssociation` | `src/pages/customer/tabs/CustomerTaxAssociationTab.tsx:53` |

## `/billing/customers/:id/analytics`

Registration: `src/core/routes/Routes.tsx:520`. Component: `src/pages/customer/tabs/CustomerAnalyticsTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<AnalyticsTab />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.listFeatures` | `src/components/atoms/FeatureMultiSelect/FeatureMultiSelect.tsx:13` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `CustomerApi.getCustomerById` | `src/pages/customer/tabs/CustomerAnalyticsTab.tsx:50` |
| `EventsApi.getUsageAnalytics` | `src/pages/customer/tabs/CustomerAnalyticsTab.tsx:156` |
| `CostSheetApi.GetCostAnalytics` | `src/pages/customer/tabs/CustomerAnalyticsTab.tsx:172` |
| `FeatureApi.listFeatures` | `src/pages/customer/tabs/CustomerAnalyticsTab.tsx:181` |

## `/billing/customers/:id/invoice/:invoice_id`

Registration: `src/core/routes/Routes.tsx:525`. Component: `src/pages/customer/customers/CustomerInvoiceDetailsPage.tsx`. Permission: `requirePermission('invoice', 'read')`.

<CustomerInvoiceDetailsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/api/InvoiceApi.ts:115` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `InvoiceApi.voidInvoice` | `src/components/molecules/InvoiceTable/InvoiceStatusModal.tsx:79` |
| `InvoiceApi.finalizeInvoice` | `src/components/molecules/InvoiceTable/InvoiceStatusModal.tsx:81` |
| `InvoiceApi.updateInvoicePaymentStatus` | `src/components/molecules/InvoiceTable/InvoicePaymentStatusModal.tsx:74` |
| `InvoiceApi.triggerCommunication` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:37` |
| `InvoiceApi.downloadInvoicePdf` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:50` |
| `InvoiceApi.getInvoiceById` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:62` |
| `InvoiceApi.downloadInvoiceCsv` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:63` |
| `InvoiceApi.recalculateInvoice` | `src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx:79` |
| `WalletApi.getCustomerWallets` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:72` |
| `ConnectionApi.ListPublished` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:78` |
| `PaymentApi.createPayment` | `src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx:233` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `TaxApi.getTaxRate` | `src/components/molecules/AppliedTaxesTable/AppliedTaxesTable.tsx:51` |
| `IntegrationMappingApi.getIntegrationConfig` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:84` |
| `ConnectionApi.ListPublished` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:93` |
| `IntegrationMappingApi.getIntegrationMappings` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:112` |
| `IntegrationMappingApi.syncIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:141` |
| `IntegrationMappingApi.linkIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:156` |
| `IntegrationMappingApi.delinkIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:176` |
| `PaymentApi.getMoyasarSetupIntent` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:193` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `InvoiceApi.listInvoices` | `src/pages/customer/customers/invoice/CustomerInvoiceDetail.tsx:47` |
| `CustomerApi.getCustomerById` | `src/pages/customer/customers/invoice/CustomerInvoiceDetail.tsx:66` |
| `InvoiceApi.downloadInvoicePdf` | `src/pages/customer/customers/invoice/CustomerInvoiceDetail.tsx:73` |
| `InvoiceApi.downloadInvoiceCsv` | `src/pages/customer/customers/invoice/CustomerInvoiceDetail.tsx:168` |
| `PaymentApi.getAllPayments` | `src/pages/customer/customers/CustomerInvoiceDetailsPage.tsx:21` |
| `CreditNoteApi.getCreditNotes` | `src/pages/customer/customers/CustomerInvoiceDetailsPage.tsx:32` |

## `/billing/customers/:id/invoice/:invoice_id/credit-note`

Registration: `src/core/routes/Routes.tsx:534`. Component: `src/pages/customer/invoices/AddCreditNotePage.tsx`. Permission: `requirePermission('creditnote', 'write')`.

<AddCreditPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/api/InvoiceApi.ts:115` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `InvoiceApi.getInvoiceById` | `src/pages/customer/invoices/AddCreditNotePage.tsx:43` |
| `CreditNoteApi.createCreditNote` | `src/pages/customer/invoices/AddCreditNotePage.tsx:116` |

## `/billing/customers/:id/subscription/:subscription_id`

Registration: `src/core/routes/Routes.tsx:542`. Component: `src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx`. Permission: `requirePermission('subscription', 'read')`.

<CustomerSubscriptionDetailsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `PriceApi.GetPriceById` | `src/hooks/useCommitmentTimeBucketPrices.ts:14` |
| `SubscriptionApi.getSubscription` | `src/components/molecules/SubscriptionAddonsSection/AddAddonDialog.tsx:84` |
| `AddonApi.List` | `src/components/molecules/SubscriptionAddonsSection/AddAddonDialog.tsx:99` |
| `SubscriptionApi.addAddonToSubscription` | `src/components/molecules/SubscriptionAddonsSection/AddAddonDialog.tsx:164` |
| `SubscriptionApi.searchSubscriptionLineItems` | `src/components/molecules/SubscriptionAddonsSection/ConfigureAddonDialog.tsx:70` |
| `SubscriptionApi.updateSubscriptionLineItem` | `src/components/molecules/SubscriptionAddonsSection/ConfigureAddonDialog.tsx:95` |
| `SubscriptionApi.deleteSubscriptionLineItem` | `src/components/molecules/SubscriptionAddonsSection/ConfigureAddonDialog.tsx:107` |
| `SubscriptionApi.getSubscription` | `src/components/molecules/SubscriptionAddonsSection/SubscriptionAddonsSection.tsx:74` |
| `SubscriptionApi.getActiveAddons` | `src/components/molecules/SubscriptionAddonsSection/SubscriptionAddonsSection.tsx:95` |
| `SubscriptionApi.searchSubscriptionLineItems` | `src/components/molecules/SubscriptionAddonsSection/SubscriptionAddonsSection.tsx:131` |
| `SubscriptionApi.removeAddonFromSubscription` | `src/components/molecules/SubscriptionAddonsSection/SubscriptionAddonsSection.tsx:201` |
| `SubscriptionApi.cancelSubscription` | `src/components/organisms/Subscription/SubscriptionActionButton.tsx:116` |
| `SubscriptionApi.activateSubscription` | `src/components/organisms/Subscription/SubscriptionActionButton.tsx:138` |
| `SubscriptionApi.searchSubscriptionLineItems` | `src/components/molecules/Subscription/SubscriptionDetailChargesSection.tsx:54` |
| `SubscriptionApi.previewSubscriptionModify` | `src/hooks/useSubscriptionQuantityModify.ts:29` |
| `SubscriptionApi.executeSubscriptionModify` | `src/hooks/useSubscriptionQuantityModify.ts:45` |
| `AlertSettingApi.search` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:55` |
| `AlertSettingApi.update` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:126` |
| `AlertSettingApi.create` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:127` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `TaxApi.deleteTaxAssociation` | `src/components/molecules/TaxAssociationTable/TaxAssociationTable.tsx:116` |
| `IntegrationMappingApi.getIntegrationConfig` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:84` |
| `ConnectionApi.ListPublished` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:93` |
| `IntegrationMappingApi.getIntegrationMappings` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:112` |
| `IntegrationMappingApi.syncIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:141` |
| `IntegrationMappingApi.linkIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:156` |
| `IntegrationMappingApi.delinkIntegration` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:176` |
| `PaymentApi.getMoyasarSetupIntent` | `src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx:193` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CouponApi.listCouponAssociations` | `src/components/molecules/CouponAssociationTable/CouponAssociationTable.tsx:76` |
| `SubscriptionApi.getSubscriptionV2` | `src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx:105` |
| `CustomerApi.getCustomerById` | `src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx:112` |
| `CustomerApi.getCustomerById` | `src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx:120` |
| `SubscriptionApi.getSubscriptionV2` | `src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx:128` |
| `CustomerApi.getCustomerById` | `src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx:136` |
| `SubscriptionApi.getSubscriptionInvoicesPreview` | `src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx:156` |
| `TaxApi.listTaxAssociations` | `src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx:171` |
| `SubscriptionApi.getUpcomingCreditGrantApplications` | `src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx:185` |
| `SubscriptionApi.searchSubscriptions` | `src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx:193` |

## `/billing/customers/:id/subscription/:subscription_id/edit`

Registration: `src/core/routes/Routes.tsx:547`. Component: `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx`. Permission: `requirePermission('subscription', 'write')`.

<CustomerSubscriptionEditPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `CustomerApi.searchCustomers` | `src/components/molecules/Customer/CustomerMultiSearchSelect.tsx:32` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `SubscriptionApi.getSubscriptionEntitlements` | `src/components/molecules/SubscriptionEntitlementsSection/SubscriptionEntitlementsSection.tsx:66` |
| `EntitlementApi.search` | `src/components/molecules/SubscriptionEntitlementsSection/SubscriptionEntitlementsSection.tsx:83` |
| `EntitlementApi.search` | `src/components/molecules/SubscriptionEntitlementsSection/SubscriptionEntitlementsSection.tsx:113` |
| `EntitlementApi.delete` | `src/components/molecules/SubscriptionEntitlementsSection/SubscriptionEntitlementsSection.tsx:160` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `PriceApi.GetPriceById` | `src/hooks/useCommitmentTimeBucketPrices.ts:14` |
| `SubscriptionApi.getSubscription` | `src/components/molecules/SubscriptionAddonsSection/AddAddonDialog.tsx:84` |
| `AddonApi.List` | `src/components/molecules/SubscriptionAddonsSection/AddAddonDialog.tsx:99` |
| `SubscriptionApi.addAddonToSubscription` | `src/components/molecules/SubscriptionAddonsSection/AddAddonDialog.tsx:164` |
| `SubscriptionApi.searchSubscriptionLineItems` | `src/components/molecules/SubscriptionAddonsSection/ConfigureAddonDialog.tsx:70` |
| `SubscriptionApi.updateSubscriptionLineItem` | `src/components/molecules/SubscriptionAddonsSection/ConfigureAddonDialog.tsx:95` |
| `SubscriptionApi.deleteSubscriptionLineItem` | `src/components/molecules/SubscriptionAddonsSection/ConfigureAddonDialog.tsx:107` |
| `SubscriptionApi.getSubscription` | `src/components/molecules/SubscriptionAddonsSection/SubscriptionAddonsSection.tsx:74` |
| `SubscriptionApi.getActiveAddons` | `src/components/molecules/SubscriptionAddonsSection/SubscriptionAddonsSection.tsx:95` |
| `SubscriptionApi.searchSubscriptionLineItems` | `src/components/molecules/SubscriptionAddonsSection/SubscriptionAddonsSection.tsx:131` |
| `SubscriptionApi.removeAddonFromSubscription` | `src/components/molecules/SubscriptionAddonsSection/SubscriptionAddonsSection.tsx:201` |
| `SubscriptionApi.cancelSubscription` | `src/components/organisms/Subscription/SubscriptionActionButton.tsx:116` |
| `SubscriptionApi.activateSubscription` | `src/components/organisms/Subscription/SubscriptionActionButton.tsx:138` |
| `SubscriptionApi.searchSubscriptionLineItems` | `src/components/molecules/Subscription/SubscriptionEditChargesSection.tsx:83` |
| `SubscriptionApi.updateSubscription` | `src/components/molecules/Subscription/SubscriptionEditInheritingCustomersSection.tsx:39` |
| `CustomerApi.getCustomerById` | `src/components/molecules/Subscription/SubscriptionEditInheritingCustomersSection.tsx:67` |
| `SubscriptionApi.executeSubscriptionModify` | `src/components/molecules/Subscription/SubscriptionEditInheritingCustomersSection.tsx:76` |
| `SubscriptionApi.previewSubscriptionModify` | `src/hooks/useSubscriptionQuantityModify.ts:29` |
| `SubscriptionApi.executeSubscriptionModify` | `src/hooks/useSubscriptionQuantityModify.ts:45` |
| `SubscriptionApi.listSubscriptions` | `src/components/molecules/UpdateSubscriptionDrawer/UpdateSubscriptionDrawer.tsx:49` |
| `AlertSettingApi.search` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:55` |
| `AlertSettingApi.update` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:126` |
| `AlertSettingApi.create` | `src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx:127` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `FeatureApi.getFeatureById` | `src/components/molecules/AddEntitlementDrawer/AddEntitlementDrawer.tsx:295` |
| `EntitlementApi.createBulk` | `src/components/molecules/AddEntitlementDrawer/AddEntitlementDrawer.tsx:372` |
| `EntitlementApi.update` | `src/components/molecules/EntitlementOverrides/EditSubscriptionEntitlementDrawer.tsx:72` |
| `EntitlementApi.create` | `src/components/molecules/EntitlementOverrides/EditSubscriptionEntitlementDrawer.tsx:80` |
| `TaxApi.deleteTaxAssociation` | `src/components/molecules/TaxAssociationTable/TaxAssociationTable.tsx:116` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CouponApi.listCouponAssociations` | `src/components/molecules/CouponAssociationTable/CouponAssociationTable.tsx:76` |
| `CouponApi.getAllCoupons` | `src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.tsx:43` |
| `SubscriptionApi.executeSubscriptionModify` | `src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.tsx:87` |
| `SubscriptionApi.executeSubscriptionModify` | `src/components/molecules/RemoveCouponDialog/RemoveCouponDialog.tsx:37` |
| `TaxApi.listTaxRates` | `src/components/molecules/ApplyTaxDialog/ApplyTaxDialog.tsx:32` |
| `TaxApi.listTaxAssociations` | `src/components/molecules/ApplyTaxDialog/ApplyTaxDialog.tsx:39` |
| `SubscriptionApi.executeSubscriptionModify` | `src/components/molecules/ApplyTaxDialog/ApplyTaxDialog.tsx:81` |
| `SubscriptionApi.executeSubscriptionModify` | `src/components/molecules/RemoveTaxDialog/RemoveTaxDialog.tsx:37` |
| `SubscriptionApi.getSubscriptionV2` | `src/hooks/useSubscriptionEditCoreQuery.ts:15` |
| `CustomerApi.getCustomerById` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:115` |
| `CreditGrantApi.list` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:124` |
| `SubscriptionApi.searchSubscriptions` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:140` |
| `SubscriptionApi.searchSubscriptionLineItems` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:161` |
| `TaxApi.listTaxAssociations` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:168` |
| `CouponApi.listCouponAssociations` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:180` |
| `SubscriptionApi.updateSubscriptionLineItem` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:200` |
| `SubscriptionApi.deleteSubscriptionLineItem` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:217` |
| `SubscriptionApi.createSubscriptionLineItem` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:230` |
| `SubscriptionApi.updateSubscription` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:243` |
| `CreditGrantApi.create` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:258` |
| `CreditGrantApi.delete` | `src/pages/customer/customers/CustomerSubscriptionEditPage.tsx:273` |

## `/billing/customers/:id/usage-events`

Registration: `src/core/routes/Routes.tsx:552`. Component: `src/pages/customer/tabs/CustomerUsageEventsTab.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<CustomerUsageEvents />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EventsApi.getEventDebug` | `src/components/molecules/Events/EventPropertiesDrawer.tsx:36` |
| `CustomerApi.getCustomersByFilters` | `src/components/molecules/Events/EventPropertiesDrawer.tsx:56` |
| `FeatureApi.listFeatures` | `src/components/molecules/Events/EventPropertiesDrawer.tsx:73` |
| `SubscriptionApi.getSubscription` | `src/components/molecules/Events/EventPropertiesDrawer.tsx:94` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `CustomerApi.getCustomerById` | `src/pages/customer/tabs/CustomerUsageEventsTab.tsx:136` |
| `EventsApi.getRawEvents` | `src/pages/customer/tabs/CustomerUsageEventsTab.tsx:211` |

## `/billing/customers/:customerId/invoices/create`

Registration: `src/core/routes/Routes.tsx:558`. Component: `src/pages/customer/invoices/CreateInvoice.tsx`. Permission: `requirePermission('invoice', 'write')`.

<CreateInvoicePage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `TaxApi.listTaxRates` | `src/components/molecules/TaxAssociationDialog/TaxAssociationDialog.tsx:58` |
| `GroupApi.getGroupsByFilter` | `src/components/organisms/PlanForm/SelectGroup.tsx:42` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/api/InvoiceApi.ts:115` |
| `MeterApi.getMeterById` | `src/hooks/useMeterForCommitment.ts:14` |
| `FeatureApi.listFeatures` | `src/components/organisms/PlanForm/UsagePricingForm.tsx:189` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `PriceUnitApi.ListPriceUnits` | `src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx:45` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `CustomerApi.getCustomerById` | `src/pages/customer/invoices/CreateInvoice.tsx:37` |
| `TaxApi.listTaxAssociations` | `src/pages/customer/invoices/CreateInvoice.tsx:74` |
| `InvoiceApi.createInvoice` | `src/pages/customer/invoices/CreateInvoice.tsx:151` |

## `/usage-tracking`

Registration: `src/core/routes/Routes.tsx:565`. Component: `container/inline`. Permission: `inherited, public or component-level; inspect route chain`.



## `/usage-tracking/events`

Registration: `src/core/routes/Routes.tsx:568`. Component: `src/pages/usage/events/Events.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<EventsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EventsApi.getEventDebug` | `src/components/molecules/Events/EventPropertiesDrawer.tsx:36` |
| `CustomerApi.getCustomersByFilters` | `src/components/molecules/Events/EventPropertiesDrawer.tsx:56` |
| `FeatureApi.listFeatures` | `src/components/molecules/Events/EventPropertiesDrawer.tsx:73` |
| `SubscriptionApi.getSubscription` | `src/components/molecules/Events/EventPropertiesDrawer.tsx:94` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `EventsApi.getRawEvents` | `src/pages/usage/events/Events.tsx:218` |

## `/usage-tracking/query`

Registration: `src/core/routes/Routes.tsx:572`. Component: `src/pages/usage/query/Query.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<QueryPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `FeatureApi.getFeatureById` | `src/components/atoms/SelectFeature/SelectFeature.tsx:60` |
| `FeatureApi.listFeatures` | `src/components/atoms/SelectFeature/SelectFeature.tsx:67` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `EventsApi.getUsageByMeter` | `src/pages/usage/query/Query.tsx:197` |

## `/product-catalog/pricing-widget`

Registration: `src/core/routes/Routes.tsx:578`. Component: `src/pages/product-catalog/plans/Pricing.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<PricingPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `PlanApi.getPlansByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:20` |
| `FeatureApi.getFeaturesByFilter` | `src/hooks/useShouldShowSidebarPricingPromo.ts:21` |
| `PlanApi.updatePlan` | `src/components/molecules/PlanDrawer/PlanDrawer.tsx:45` |
| `PlanApi.createPlan` | `src/components/molecules/PlanDrawer/PlanDrawer.tsx:47` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `PlanApi.getPlansByFilter` | `src/pricing/hooks/usePricingData.ts:55` |
| `PriceApi.searchPrices` | `src/pricing/hooks/usePricingData.ts:76` |
| `EntitlementApi.search` | `src/pricing/hooks/usePricingData.ts:106` |
| `CreditGrantApi.list` | `src/pricing/hooks/usePricingData.ts:146` |

## `/revenue`

Registration: `src/core/routes/Routes.tsx:584`. Component: `src/pages/insights-tools/revenue/Revenue.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<Revenue />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `RevenueDashboardApi.getRevenueDashboard` | `src/pages/insights-tools/revenue/Revenue.tsx:123` |

## `/developers`

Registration: `src/core/routes/Routes.tsx:590`. Component: `container/inline`. Permission: `inherited, public or component-level; inspect route chain`.



## `/developers/webhooks`

Registration: `src/core/routes/Routes.tsx:593`. Component: `src/components/atoms/Loader/Loader.tsx`. Permission: `requirePermission('webhook', 'read')`.

(
							<Suspense
								fallback={
									<div className='flex h-96 w-full items-center justify-center'>
										<Loader />
									</div>
								}>
								<WebhookDashboardLazy />
							</Suspense>
						)

## `/developers/api-keys`

Registration: `src/core/routes/Routes.tsx:607`. Component: `src/pages/developer/developer.tsx`. Permission: `requirePermission('secret', 'read')`.

<DeveloperPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `UserApi.getServiceAccounts` | `src/components/molecules/SecretKeyDrawer/SecretKeyDrawer.tsx:39` |
| `SecretKeysApi.createSecretKey` | `src/components/molecules/SecretKeyDrawer/SecretKeyDrawer.tsx:141` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `SecretKeysApi.getAllSecretKeys` | `src/pages/developer/developer.tsx:92` |
| `SecretKeysApi.deleteSecretKey` | `src/pages/developer/developer.tsx:192` |

## `/developers/service-accounts`

Registration: `src/core/routes/Routes.tsx:612`. Component: `src/pages/developer/ServiceAccounts.tsx`. Permission: `requirePermission('user', 'read')`.

<ServiceAccountsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `RbacApi.getAllRoles` | `src/components/molecules/ServiceAccountDrawer/ServiceAccountDrawer.tsx:36` |
| `UserApi.createServiceAccount` | `src/components/molecules/ServiceAccountDrawer/ServiceAccountDrawer.tsx:75` |
| `UserApi.updateServiceAccount` | `src/components/molecules/ServiceAccountDrawer/ServiceAccountDrawer.tsx:89` |
| `UserApi.getServiceAccounts` | `src/pages/developer/ServiceAccounts.tsx:32` |
| `UserApi.deleteUser` | `src/pages/developer/ServiceAccounts.tsx:110` |

## `/developers/workflows`

Registration: `src/core/routes/Routes.tsx:617`. Component: `src/pages/developer/WorkflowsPage.tsx`. Permission: `requirePermission('workflow', 'read')`.

<WorkflowsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `WorkflowApi.search` | `src/pages/developer/WorkflowsPage.tsx:200` |
| `WorkflowApi.search` | `src/pages/developer/WorkflowsPage.tsx:202` |

## `/developers/workflows/:workflowId/:runId`

Registration: `src/core/routes/Routes.tsx:622`. Component: `src/pages/developer/WorkflowDetailsPage.tsx`. Permission: `requirePermission('workflow', 'read')`.

<WorkflowDetailsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `WorkflowApi.getDetails` | `src/pages/developer/WorkflowDetailsPage.tsx:38` |

## `/tools`

Registration: `src/core/routes/Routes.tsx:629`. Component: `container/inline`. Permission: `inherited, public or component-level; inspect route chain`.



## `/tools/integrations`

Registration: `src/core/routes/Routes.tsx:632`. Component: `src/pages/insights-tools/integrations/Integrations.tsx`. Permission: `requirePermission('connection', 'read')`.

<Integrations />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `ConnectionApi.Create` | `src/components/molecules/HubSpotConnectionDrawer/HubSpotConnectionDrawer.tsx:221` |
| `ConnectionApi.Update` | `src/components/molecules/HubSpotConnectionDrawer/HubSpotConnectionDrawer.tsx:267` |
| `ConnectionApi.Create` | `src/components/molecules/NomodConnectionDrawer/NomodConnectionDrawer.tsx:138` |
| `ConnectionApi.Update` | `src/components/molecules/NomodConnectionDrawer/NomodConnectionDrawer.tsx:165` |
| `ConnectionApi.Create` | `src/components/molecules/MoyasarConnectionDrawer/MoyasarConnectionDrawer.tsx:153` |
| `ConnectionApi.Get` | `src/components/molecules/MoyasarConnectionDrawer/MoyasarConnectionDrawer.tsx:170` |
| `ConnectionApi.Update` | `src/components/molecules/MoyasarConnectionDrawer/MoyasarConnectionDrawer.tsx:179` |
| `ConnectionApi.Create` | `src/components/molecules/PaddleConnectionDrawer/PaddleConnectionDrawer.tsx:140` |
| `ConnectionApi.Get` | `src/components/molecules/PaddleConnectionDrawer/PaddleConnectionDrawer.tsx:158` |
| `ConnectionApi.Update` | `src/components/molecules/PaddleConnectionDrawer/PaddleConnectionDrawer.tsx:163` |
| `ConnectionApi.Create` | `src/components/molecules/TabsConnectionDrawer/TabsConnectionDrawer.tsx:121` |
| `ConnectionApi.Update` | `src/components/molecules/TabsConnectionDrawer/TabsConnectionDrawer.tsx:150` |
| `ConnectionApi.Create` | `src/components/molecules/AwsMarketplaceConnectionDrawer/AwsMarketplaceConnectionDrawer.tsx:241` |
| `ConnectionApi.Update` | `src/components/molecules/AwsMarketplaceConnectionDrawer/AwsMarketplaceConnectionDrawer.tsx:255` |
| `ConnectionApi.Create` | `src/components/molecules/GcpMarketplaceConnectionDrawer/GcpMarketplaceConnectionDrawer.tsx:238` |
| `ConnectionApi.Update` | `src/components/molecules/GcpMarketplaceConnectionDrawer/GcpMarketplaceConnectionDrawer.tsx:253` |
| `ConnectionApi.Create` | `src/components/molecules/AzureMarketplaceConnectionDrawer/AzureMarketplaceConnectionDrawer.tsx:87` |
| `ConnectionApi.Update` | `src/components/molecules/AzureMarketplaceConnectionDrawer/AzureMarketplaceConnectionDrawer.tsx:101` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `ConnectionApi.Create` | `src/components/molecules/StripeConnectionDrawer/StripeConnectionDrawer.tsx:194` |
| `ConnectionApi.Update` | `src/components/molecules/StripeConnectionDrawer/StripeConnectionDrawer.tsx:230` |
| `ConnectionApi.Create` | `src/components/molecules/RazorpayConnectionDrawer/RazorpayConnectionDrawer.tsx:153` |
| `ConnectionApi.Update` | `src/components/molecules/RazorpayConnectionDrawer/RazorpayConnectionDrawer.tsx:180` |
| `ConnectionApi.Create` | `src/components/molecules/ChargebeeConnectionDrawer/ChargebeeConnectionDrawer.tsx:165` |
| `ConnectionApi.Update` | `src/components/molecules/ChargebeeConnectionDrawer/ChargebeeConnectionDrawer.tsx:192` |
| `ConnectionApi.Get` | `src/components/molecules/QuickBooksConnectionDrawer/QuickBooksConnectionDrawer.tsx:165` |
| `ConnectionApi.Update` | `src/components/molecules/QuickBooksConnectionDrawer/QuickBooksConnectionDrawer.tsx:199` |
| `OAuthApi.InitiateOAuth` | `src/components/molecules/QuickBooksConnectionDrawer/QuickBooksConnectionDrawer.tsx:255` |
| `OAuthApi.InitiateOAuth` | `src/components/molecules/ZohoBooksConnectionDrawer/ZohoBooksConnectionDrawer.tsx:99` |
| `ConnectionApi.Get` | `src/components/molecules/ZohoBooksConnectionDrawer/ZohoBooksConnectionDrawer.tsx:143` |
| `ConnectionApi.Update` | `src/components/molecules/ZohoBooksConnectionDrawer/ZohoBooksConnectionDrawer.tsx:155` |
| `ConnectionApi.Create` | `src/components/molecules/WhopConnectionDrawer/WhopConnectionDrawer.tsx:122` |
| `ConnectionApi.Update` | `src/components/molecules/WhopConnectionDrawer/WhopConnectionDrawer.tsx:157` |
| `ConnectionApi.List` | `src/pages/insights-tools/integrations/Integrations.tsx:54` |
| `ConnectionApi.Delete` | `src/pages/insights-tools/integrations/Integrations.tsx:437` |

## `/tools/integrations/:id`

Registration: `src/core/routes/Routes.tsx:637`. Component: `src/pages/insights-tools/integrations/IntegrationDetails.tsx`. Permission: `requirePermission('connection', 'read')`.

<IntegrationDetails />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `ConnectionApi.Create` | `src/components/molecules/HubSpotConnectionDrawer/HubSpotConnectionDrawer.tsx:221` |
| `ConnectionApi.Update` | `src/components/molecules/HubSpotConnectionDrawer/HubSpotConnectionDrawer.tsx:267` |
| `ConnectionApi.Create` | `src/components/molecules/NomodConnectionDrawer/NomodConnectionDrawer.tsx:138` |
| `ConnectionApi.Update` | `src/components/molecules/NomodConnectionDrawer/NomodConnectionDrawer.tsx:165` |
| `ConnectionApi.Create` | `src/components/molecules/MoyasarConnectionDrawer/MoyasarConnectionDrawer.tsx:153` |
| `ConnectionApi.Get` | `src/components/molecules/MoyasarConnectionDrawer/MoyasarConnectionDrawer.tsx:170` |
| `ConnectionApi.Update` | `src/components/molecules/MoyasarConnectionDrawer/MoyasarConnectionDrawer.tsx:179` |
| `ConnectionApi.Create` | `src/components/molecules/PaddleConnectionDrawer/PaddleConnectionDrawer.tsx:140` |
| `ConnectionApi.Get` | `src/components/molecules/PaddleConnectionDrawer/PaddleConnectionDrawer.tsx:158` |
| `ConnectionApi.Update` | `src/components/molecules/PaddleConnectionDrawer/PaddleConnectionDrawer.tsx:163` |
| `ConnectionApi.Create` | `src/components/molecules/TabsConnectionDrawer/TabsConnectionDrawer.tsx:121` |
| `ConnectionApi.Update` | `src/components/molecules/TabsConnectionDrawer/TabsConnectionDrawer.tsx:150` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `ConnectionApi.Create` | `src/components/molecules/StripeConnectionDrawer/StripeConnectionDrawer.tsx:194` |
| `ConnectionApi.Update` | `src/components/molecules/StripeConnectionDrawer/StripeConnectionDrawer.tsx:230` |
| `ConnectionApi.Create` | `src/components/molecules/RazorpayConnectionDrawer/RazorpayConnectionDrawer.tsx:153` |
| `ConnectionApi.Update` | `src/components/molecules/RazorpayConnectionDrawer/RazorpayConnectionDrawer.tsx:180` |
| `ConnectionApi.Create` | `src/components/molecules/ChargebeeConnectionDrawer/ChargebeeConnectionDrawer.tsx:165` |
| `ConnectionApi.Update` | `src/components/molecules/ChargebeeConnectionDrawer/ChargebeeConnectionDrawer.tsx:192` |
| `ConnectionApi.Get` | `src/components/molecules/QuickBooksConnectionDrawer/QuickBooksConnectionDrawer.tsx:165` |
| `ConnectionApi.Update` | `src/components/molecules/QuickBooksConnectionDrawer/QuickBooksConnectionDrawer.tsx:199` |
| `OAuthApi.InitiateOAuth` | `src/components/molecules/QuickBooksConnectionDrawer/QuickBooksConnectionDrawer.tsx:255` |
| `OAuthApi.InitiateOAuth` | `src/components/molecules/ZohoBooksConnectionDrawer/ZohoBooksConnectionDrawer.tsx:99` |
| `ConnectionApi.Get` | `src/components/molecules/ZohoBooksConnectionDrawer/ZohoBooksConnectionDrawer.tsx:143` |
| `ConnectionApi.Update` | `src/components/molecules/ZohoBooksConnectionDrawer/ZohoBooksConnectionDrawer.tsx:155` |
| `ConnectionApi.Create` | `src/components/molecules/WhopConnectionDrawer/WhopConnectionDrawer.tsx:122` |
| `ConnectionApi.Update` | `src/components/molecules/WhopConnectionDrawer/WhopConnectionDrawer.tsx:157` |
| `ConnectionApi.List` | `src/pages/insights-tools/integrations/IntegrationDetails.tsx:48` |
| `ConnectionApi.Delete` | `src/pages/insights-tools/integrations/IntegrationDetails.tsx:58` |

## `/tools/integrations/oauth/callback`

Registration: `src/core/routes/Routes.tsx:642`. Component: `src/pages/insights-tools/integrations/QuickBooksOAuthCallback.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<QuickBooksOAuthCallback />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `OAuthApi.CompleteOAuth` | `src/pages/insights-tools/integrations/QuickBooksOAuthCallback.tsx:120` |

## `/tools/integrations/quickbooks/oauth/callback`

Registration: `src/core/routes/Routes.tsx:647`. Component: `src/pages/insights-tools/integrations/QuickBooksOAuthCallback.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<QuickBooksOAuthCallback />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `OAuthApi.CompleteOAuth` | `src/pages/insights-tools/integrations/QuickBooksOAuthCallback.tsx:120` |

## `/tools/bulk-imports`

Registration: `src/core/routes/Routes.tsx:651`. Component: `src/pages/customer/import-export/ImportExport.tsx`. Permission: `requirePermission('task', 'read')`.

<ImportExport />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `TaskApi.addTask` | `src/components/molecules/ImportFileDrawer/ImportFileDrawer.tsx:176` |
| `TaskApi.getTaskById` | `src/components/molecules/ImportFileDrawer/ImportFileDrawer.tsx:203` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `TaskApi.getAllTasks` | `src/pages/customer/import-export/ImportExport.tsx:92` |

## `/tools/exports`

Registration: `src/core/routes/Routes.tsx:656`. Component: `src/pages/insights-tools/exports/Exports.tsx`. Permission: `requirePermission('task', 'read')`.

<Exports />

## `/tools/usage-syncs`

Registration: `src/core/routes/Routes.tsx:661`. Component: `src/pages/insights-tools/usage-syncs/UsageSyncs.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<UsageSyncs />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `CustomerApi.getCustomersByFilters` | `src/pages/insights-tools/usage-syncs/UsageSyncs.tsx:34` |
| `PlanApi.getPlansByFilter` | `src/pages/insights-tools/usage-syncs/UsageSyncs.tsx:50` |
| `UsageRecordApi.searchUsageRecords` | `src/pages/insights-tools/usage-syncs/UsageSyncs.tsx:73` |
| `UsageRecordApi.searchUsageRecords` | `src/pages/insights-tools/usage-syncs/UsageSyncs.tsx:211` |

## `/tools/exports/s3`

Registration: `src/core/routes/Routes.tsx:665`. Component: `src/pages/insights-tools/exports/S3Exports.tsx`. Permission: `requirePermission('connection', 'read')`.

<S3Exports />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `ConnectionApi.Create` | `src/components/molecules/S3ConnectionDrawer/S3ConnectionDrawer.tsx:122` |
| `ConnectionApi.Update` | `src/components/molecules/S3ConnectionDrawer/S3ConnectionDrawer.tsx:140` |
| `ConnectionApi.List` | `src/pages/insights-tools/exports/S3Exports.tsx:30` |
| `TaskApi.getAllScheduledTasks` | `src/pages/insights-tools/exports/S3Exports.tsx:43` |
| `ConnectionApi.Delete` | `src/pages/insights-tools/exports/S3Exports.tsx:61` |

## `/tools/exports/s3/:connectionId/export`

Registration: `src/core/routes/Routes.tsx:670`. Component: `src/pages/insights-tools/exports/ExportManagement.tsx`. Permission: `requirePermission('task', 'read')`.

<ExportManagement />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `TaskApi.createScheduledTask` | `src/components/molecules/ExportDrawer/ExportDrawer.tsx:273` |
| `TaskApi.updateScheduledTask` | `src/components/molecules/ExportDrawer/ExportDrawer.tsx:326` |
| `ConnectionApi.Get` | `src/pages/insights-tools/exports/ExportManagement.tsx:26` |
| `TaskApi.getAllScheduledTasks` | `src/pages/insights-tools/exports/ExportManagement.tsx:37` |
| `TaskApi.deleteScheduledTask` | `src/pages/insights-tools/exports/ExportManagement.tsx:46` |

## `/tools/exports/s3/:connectionId/export/:exportId`

Registration: `src/core/routes/Routes.tsx:675`. Component: `src/pages/insights-tools/exports/ExportDetails.tsx`. Permission: `requirePermission('task', 'read')`.

<ExportDetails />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `TaskApi.downloadTaskFile` | `src/components/molecules/TaskRunsTable/TaskRunsTable.tsx:28` |
| `TaskRunApi.getAllTaskRuns` | `src/components/molecules/TaskRunsTable/TaskRunsTable.tsx:65` |
| `TaskApi.getScheduledTaskById` | `src/pages/insights-tools/exports/ExportDetails.tsx:33` |
| `ConnectionApi.Get` | `src/pages/insights-tools/exports/ExportDetails.tsx:40` |
| `TaskApi.updateScheduledTask` | `src/pages/insights-tools/exports/ExportDetails.tsx:46` |
| `TaskApi.forceRunScheduledTask` | `src/pages/insights-tools/exports/ExportDetails.tsx:59` |
| `TaskApi.deleteScheduledTask` | `src/pages/insights-tools/exports/ExportDetails.tsx:71` |

## `/tools/exports/s3/:connectionId/export/:exportId/runs`

Registration: `src/core/routes/Routes.tsx:680`. Component: `src/pages/insights-tools/exports/TaskRunsPage.tsx`. Permission: `requirePermission('task', 'read')`.

<TaskRunsPage />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `TaskApi.downloadTaskFile` | `src/components/molecules/TaskRunsTable/TaskRunsTable.tsx:28` |
| `TaskRunApi.getAllTaskRuns` | `src/components/molecules/TaskRunsTable/TaskRunsTable.tsx:65` |

## `/settings`

Registration: `src/core/routes/Routes.tsx:687`. Component: `src/pages/settings/SettingsDashboard.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<SettingsDashboard />

| API method | Call site |
|---|---|
| `EnvironmentApi.getAllEnvironments` | `src/hooks/useEnvironment.ts:28` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/hooks/useEnvironment.ts:37` |
| `EnvironmentApi.setActiveEnvironmentId` | `src/hooks/useEnvironment.ts:38` |
| `RbacApi.getAllRoles` | `src/hooks/useRbacRoles.ts:14` |
| `SettingsApi.getSettingByKey` | `src/hooks/useCustomCurrencyConfig.ts:22` |
| `UserApi.updateUser` | `src/components/molecules/Tenant/UpdateTenantDrawer.tsx:271` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:47` |
| `EnvironmentApi.waitForActiveEnvironment` | `src/core/axios/config.ts:49` |
| `EnvironmentApi.getActiveEnvironmentId` | `src/core/axios/config.ts:50` |
| `UserApi.me` | `src/hooks/useUser.tsx:20` |
| `UserApi.getUserById` | `src/components/molecules/EditUserRolesDialog/EditUserRolesDialog.tsx:39` |
| `UserApi.updateUserRoles` | `src/components/molecules/EditUserRolesDialog/EditUserRolesDialog.tsx:82` |
| `UserApi.getTenantMembers` | `src/pages/settings/team/useTenantMembers.ts:14` |
| `UserApi.addUserToTenant` | `src/pages/settings/team/useTenantMembers.ts:24` |
| `UserApi.removeUserFromTenant` | `src/pages/settings/team/UsersSection.tsx:331` |
| `SettingsApi.getSettingByKey` | `src/pages/settings/billing/useCustomCurrencyConfiguration.ts:25` |
| `SettingsApi.updateSettingByKey` | `src/pages/settings/billing/useCustomCurrencyConfiguration.ts:39` |
| `SettingsApi.getSettingByKey` | `src/pages/settings/billing/useInvoiceConfiguration.ts:8` |
| `SettingsApi.updateSettingByKey` | `src/pages/settings/billing/useInvoiceConfiguration.ts:23` |
| `SettingsApi.resetSettingToDefaults` | `src/pages/settings/billing/useInvoiceConfiguration.ts:33` |
| `SettingsApi.getSettingByKey` | `src/pages/settings/billing/useSubscriptionConfiguration.ts:14` |
| `SettingsApi.updateSettingByKey` | `src/pages/settings/billing/useSubscriptionConfiguration.ts:32` |
| `SettingsApi.getSettingByKey` | `src/pages/settings/customer-portal/useCustomerPortalConfig.ts:9` |
| `SettingsApi.updateSettingByKey` | `src/pages/settings/customer-portal/useCustomerPortalConfig.ts:26` |
| `SettingsApi.getSettingByKey` | `src/pages/settings/customer-onboarding/useCustomerOnboardingConfig.ts:165` |
| `SettingsApi.updateSettingByKey` | `src/pages/settings/customer-onboarding/useCustomerOnboardingConfig.ts:180` |
| `SettingsApi.resetSettingToDefaults` | `src/pages/settings/customer-onboarding/useCustomerOnboardingConfig.ts:190` |
| `PlanApi.getPlansByFilter` | `src/pages/settings/customer-onboarding/useCustomerOnboardingConfig.ts:209` |
| `SettingsApi.getSettingByKey` | `src/pages/settings/alerts/useWalletAlertSettings.ts:16` |
| `SettingsApi.updateSettingByKey` | `src/pages/settings/alerts/useWalletAlertSettings.ts:33` |
| `SettingsApi.getSettingByKey` | `src/pages/settings/saml-sso/useSamlConfig.ts:14` |
| `SettingsApi.updateSettingByKey` | `src/pages/settings/saml-sso/useSamlConfig.ts:38` |

## `/settings/billing`

Registration: `src/core/routes/Routes.tsx:691`. Component: `container/inline`. Permission: `inherited, public or component-level; inspect route chain`.

<Navigate to={`${RouteNames.settings}?tab=billing`} replace />

## `/*`

Registration: `src/core/routes/Routes.tsx:697`. Component: `src/components/organisms/ErrorPage/ErrorPage.tsx`. Permission: `inherited, public or component-level; inspect route chain`.

<ErrorPage />
