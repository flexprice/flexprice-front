import MainLayout from '@/layouts/MainLayout';
import { createBrowserRouter, Navigate } from 'react-router';
import AuthMiddleware from '../auth/AuthProvider';
import { useUser } from '@/hooks/UserContext';
import { TenantMetadataKey } from '@/models/Tenant';
import { Suspense } from 'react';
import { Loader } from '@/components/atoms';
import { config } from '@/config/config';
import {
	// Auth pages
	Auth,
	SignupConfirmation,
	ResendVerification,
	EmailVerification,
	// Customer pages
	CustomerListPage as CustomerPage,
	Subscriptions as SubscriptionsPage,
	CreateCustomerSubscriptionPage,
	CustomerProfilePage,
	InvoicePage,
	InvoiceDetailsPage,
	CustomerInvoiceTab as Invoice,
	CustomerOverviewTab as Overview,
	CustomerAnalyticsTab as AnalyticsTab,
	CustomerWalletTab as WalletTab,
	CustomerSubscriptionDetailsPage,
	CustomerSubscriptionEditPage,
	AddCreditNotePage as AddCreditPage,
	CreditNote,
	CreditNotesPage,
	CreditNoteDetailsPage,
	ImportExport,
	CustomerInvoiceDetailsPage,
	CustomerInformationTab as CustomerInformation,
	CustomerUsageEventsTab as CustomerUsageEvents,
	PaymentPage,
	CreateInvoice as CreateInvoicePage,
	TaxRatesPage as TaxPage,
	CustomerTaxAssociationTab as TaxAssociation,
	TaxrateDetailsPage,
	// Product catalog pages
	Plans as PricingPlans,
	PlanDetailsPage,
	PlanOverviewTab as PlanOverview,
	PlanEntitlementsTab as PlanEntitlements,
	PlanCreditGrantsTab as PlanCreditGrants,
	PlanInformationTab as PlanInformation,
	AddFeature as AddFeaturePage,
	Features as FeaturesPage,
	FeatureDetails,
	Addons as AddonsPage,
	AddonDetails as AddonDetailsPage,
	AddonCharges as AddonChargesPage,
	CostSheets as CostSheetsPage,
	CostSheetDetails as CostSheetDetailsPage,
	CostSheetCharges as CostSheetChargesPage,
	Pricing as PricingPage,
	AddCharges as AddChargesPage,
	Coupons as CouponsPage,
	CouponDetails,
	Groups as GroupsPage,
	GroupProfilePage,
	GroupOverviewTab as GroupOverviewTabComponent,
	GroupInformationTab as GroupInformationTabComponent,
	PriceUnits as PriceUnitsPage,
	// Usage pages
	Events as EventsPage,
	Query as QueryPage,
	// Developer pages
	DeveloperPage,
	ServiceAccountsPage,
	WorkflowsPage,
	WorkflowDetailsPage,
	// Onboarding pages
	OnboardingTenant,
	PricingSetupPage,
	// Webhooks pages
	WebhookDashboardLazy,
	// Settings pages
	SettingsDashboard,
	// Insights tools pages
	Integrations,
	IntegrationDetails,
	Revenue,
	Exports,
	S3Exports,
	ExportManagement,
	ExportDetails,
	TaskRunsPage,
	QuickBooksOAuthCallback,
	// Error pages
	ErrorPage,
	DashboardPage,
	CustomerPortalWrapper,
	// Checkout
	CheckoutPage,
} from '@/pages';
import { RouterErrorElement } from '@/components/atoms/ErrorBoundary';

export const RouteNames = {
	// customer portal
	customerPortal: '/customer-portal',

	home: '/',
	login: '/login',
	auth: '/auth',
	signupConfirmation: '/auth/signup/confirmation',
	resendVerification: '/auth/resend-verification',
	verifyEmail: '/auth/verify-email',

	// Dashboard routes
	homeDashboard: '/home',

	// usage tracking routes
	usageTracking: '/usage-tracking',
	meter: '/usage-tracking/meter',
	addMeter: '/usage-tracking/meter/add-meter',
	editMeter: '/usage-tracking/meter/edit-meter',
	events: '/usage-tracking/events',
	queryPage: '/usage-tracking/query',

	// billing routes
	billing: '/billing',
	customers: '/billing/customers',
	subscriptions: '/billing/subscriptions',
	createSubscription: '/billing/subscriptions/create',
	subscriptionDetails: '/billing/subscriptions/:id',
	taxes: '/billing/taxes',
	invoices: '/billing/invoices',
	createInvoice: '/billing/customers/:customerId/invoices/create',
	creditNotes: '/billing/credit-notes',
	payments: '/billing/payments',
	analytics: '/billing/analytics',

	// product catalog routes
	productCatalog: '/product-catalog',
	plan: '/product-catalog/plan',
	pricing: '/product-catalog/pricing-widget',
	addCharges: '/product-catalog/plan/:planId/add-charges',

	features: '/product-catalog/features',
	createFeature: '/product-catalog/features/create-feature',
	featureDetails: '/product-catalog/features',

	// coupon routes
	coupons: '/product-catalog/coupons',
	couponDetails: '/product-catalog/coupons',

	// add on routes
	addons: '/product-catalog/addons',
	addonDetails: '/product-catalog/addons',
	addonCharges: '/product-catalog/addons/:addonId/add-charges',

	// cost sheet routes
	costSheets: '/product-catalog/cost-sheets',
	costSheetDetails: '/product-catalog/cost-sheets',
	costSheetCharges: '/product-catalog/cost-sheets/:costSheetId/add-charges',

	// group routes
	groups: '/product-catalog/groups',

	// price unit routes
	priceUnits: '/product-catalog/price-units',

	// developers routes
	developers: '/developers',
	webhooks: '/developers/webhooks',
	apiKeys: '/developers/api-keys',
	serviceAccounts: '/developers/service-accounts',
	workflows: '/developers/workflows',
	workflowDetails: '/developers/workflows/:workflowId/:runId',

	// tools routes
	tools: '/tools',
	bulkImports: '/tools/bulk-imports',
	revenue: '/revenue',
	integrations: '/tools/integrations',
	integrationDetails: '/tools/integrations',
	oauthCallback: '/tools/integrations/oauth/callback', // Generic OAuth callback (backend redirect URI)
	quickBooksOAuthCallback: '/tools/integrations/quickbooks/oauth/callback', // Legacy route
	exports: '/tools/exports',
	s3Exports: '/tools/exports/s3',
	s3ExportManagement: '/tools/exports/s3/:connectionId/export',
	s3ExportDetails: '/tools/exports/s3/:connectionId/export/:exportId',
	s3TaskRuns: '/tools/exports/s3/:connectionId/export/:exportId/runs',

	// footer
	onboarding: '/onboarding',
	pricingSetup: '/onboarding/pricing-setup',
	settings: '/settings',
	customerBilling: '/settings/billing',

	// checkout (public - multi-provider: Paddle and Moyasar)
	checkout: '/checkout',
};

const DefaultRoute = () => {
	const { user } = useUser();
	const onboardingMetadata = user?.tenant?.metadata?.[TenantMetadataKey.ONBOARDING_COMPLETED];
	const onboardingCompleted = onboardingMetadata === 'true';
	return <Navigate to={onboardingCompleted ? RouteNames.homeDashboard : RouteNames.onboarding} />;
};

export const MainRouter: any = createBrowserRouter([
	// public routes
	{
		path: RouteNames.login,
		element: <Auth />,
	},
	{
		path: RouteNames.auth,
		element: <Auth />,
	},
	{
		path: RouteNames.signupConfirmation,
		element: <SignupConfirmation />,
	},
	{
		path: RouteNames.resendVerification,
		element: <ResendVerification />,
	},
	{
		path: RouteNames.verifyEmail,
		element: <EmailVerification />,
	},
	{
		path: RouteNames.customerPortal,
		element: <CustomerPortalWrapper />,
	},
	{
		path: RouteNames.checkout,
		element: <CheckoutPage />,
	},
	{
		path: RouteNames.onboarding,
		element: <OnboardingTenant />,
	},
	{
		path: RouteNames.pricingSetup,
		element: <PricingSetupPage />,
	},
	{
		path: RouteNames.checkout,
		element: <CheckoutPage />,
	},
	// private routes
	{
		path: RouteNames.home,
		element: (
			<AuthMiddleware requiredRole={['admin']}>
				<MainLayout />
			</AuthMiddleware>
		),
		errorElement: <RouterErrorElement />,
		children: [
			{
				path: RouteNames.home,
				element: <DefaultRoute />,
			},
			{
				path: RouteNames.homeDashboard,
				element: <DashboardPage />,
			},
			{
				path: RouteNames.productCatalog,
				children: [
					{
						path: RouteNames.features,
						element: <FeaturesPage />,
					},
					{
						path: RouteNames.createFeature,
						element: <AddFeaturePage />,
					},
					{
						path: `${RouteNames.featureDetails}/:id`,
						element: <FeatureDetails />,
					},
					{
						path: RouteNames.plan,
						element: <PricingPlans />,
					},
					{
						path: `${RouteNames.plan}/:planId`,
						element: <PlanDetailsPage />,
						children: [
							{
								path: '',
								element: <PlanOverview />,
								index: true,
							},
							{
								path: 'entitlements',
								element: <PlanEntitlements />,
							},
							{
								path: 'credit-grants',
								element: <PlanCreditGrants />,
							},
							{
								path: 'information',
								element: <PlanInformation />,
							},
						],
					},
					{
						path: RouteNames.addCharges,
						element: <AddChargesPage />,
					},
					{
						path: RouteNames.coupons,
						element: <CouponsPage />,
					},
					{
						path: `${RouteNames.couponDetails}/:id`,
						element: <CouponDetails />,
					},
					{
						path: RouteNames.addons,
						element: <AddonsPage />,
					},
					{
						path: `${RouteNames.addonDetails}/:id`,
						element: <AddonDetailsPage />,
					},
					{
						path: RouteNames.addonCharges,
						element: <AddonChargesPage />,
					},
					{
						path: RouteNames.costSheets,
						element: <CostSheetsPage />,
					},
					{
						path: `${RouteNames.costSheetDetails}/:id`,
						element: <CostSheetDetailsPage />,
					},
					{
						path: RouteNames.costSheetCharges,
						element: <CostSheetChargesPage />,
					},
					{
						path: RouteNames.groups,
						element: <GroupsPage />,
					},
					{
						path: `${RouteNames.groups}/:id`,
						element: <GroupProfilePage />,
						children: [
							{
								path: '',
								element: <GroupOverviewTabComponent />,
								index: true,
							},
							{
								path: 'overview',
								element: <GroupOverviewTabComponent />,
							},
							{
								path: 'information',
								element: <GroupInformationTabComponent />,
							},
						],
					},
					{
						path: RouteNames.priceUnits,
						element: <PriceUnitsPage />,
					},
				],
			},
			{
				path: RouteNames.billing,
				children: [
					{
						path: RouteNames.customers,
						element: <CustomerPage />,
					},
					{
						path: RouteNames.subscriptions,
						element: <SubscriptionsPage />,
					},
					{
						path: RouteNames.createSubscription,
						element: <CreateCustomerSubscriptionPage />,
					},
					{
						path: `${RouteNames.subscriptions}/:id/edit`,
						element: <CustomerSubscriptionEditPage />,
					},
					{
						path: `${RouteNames.customers}/:id/add-subscription`,
						element: <CreateCustomerSubscriptionPage />,
					},
					{
						path: RouteNames.taxes,
						element: <TaxPage />,
					},
					{
						path: `${RouteNames.taxes}/:taxrateId`,
						element: <TaxrateDetailsPage />,
					},
					{
						path: RouteNames.invoices,
						element: <InvoicePage />,
					},
					{
						path: `${RouteNames.invoices}/:invoiceId`,
						element: <InvoiceDetailsPage />,
					},
					{
						path: RouteNames.creditNotes,
						element: <CreditNotesPage />,
					},
					{
						path: `${RouteNames.creditNotes}/:credit_note_id`,
						element: <CreditNoteDetailsPage />,
					},
					{
						path: RouteNames.payments,
						element: <PaymentPage />,
					},
					// {
					// 	path: RouteNames.analytics,
					// 	element: <CostAnalyticsPage />,
					// },
					{
						path: `${RouteNames.customers}/:id`,
						element: <CustomerProfilePage />,
						children: [
							{
								path: '',
								element: <Overview />,
								index: true,
							},
							{
								path: 'overview',
								element: <Overview />,
								index: true,
							},
							{
								path: 'information',
								element: <CustomerInformation />,
							},
							{
								path: 'usage-events',
								element: <CustomerUsageEvents />,
							},
							{
								path: 'wallet',
								element: <WalletTab />,
							},
							{
								path: 'credit-note',
								element: <CreditNote />,
							},
							{
								path: 'invoice',
								element: <Invoice />,
							},
							{
								path: 'tax-association',
								element: <TaxAssociation />,
							},
							{
								path: 'analytics',
								element: <AnalyticsTab />,
							},

							{
								path: 'invoice/:invoice_id',
								element: <CustomerInvoiceDetailsPage />,
							},
							{
								path: 'invoice/:invoice_id/credit-note',
								element: <AddCreditPage />,
							},
							{
								path: 'subscription/:subscription_id',
								element: <CustomerSubscriptionDetailsPage />,
							},
							{
								path: 'subscription/:subscription_id/edit',
								element: <CustomerSubscriptionEditPage />,
							},
							{
								path: 'usage-events',
								element: <CustomerUsageEvents />,
							},
						],
					},
					{
						path: `${RouteNames.customers}/:customerId/invoices/create`,
						element: <CreateInvoicePage />,
					},
				],
			},
			{
				path: RouteNames.usageTracking,
				children: [
					{
						path: RouteNames.events,
						element: <EventsPage />,
					},
					{
						path: RouteNames.queryPage,
						element: <QueryPage />,
					},
				],
			},
			{
				path: RouteNames.pricing,
				element: <PricingPage />,
			},
			...(config.platform.revenue.enabled
				? [
						{
							path: RouteNames.revenue,
							element: <Revenue />,
						},
					]
				: []),
			{
				path: RouteNames.developers,
				children: [
					{
						path: RouteNames.webhooks,
						element: (
							<Suspense
								fallback={
									<div className='flex h-96 w-full items-center justify-center'>
										<Loader />
									</div>
								}>
								<WebhookDashboardLazy />
							</Suspense>
						),
					},
					{
						path: RouteNames.apiKeys,
						element: <DeveloperPage />,
					},
					{
						path: RouteNames.serviceAccounts,
						element: <ServiceAccountsPage />,
					},
					{
						path: RouteNames.workflows,
						element: <WorkflowsPage />,
					},
					{
						path: RouteNames.workflowDetails,
						element: <WorkflowDetailsPage />,
					},
				],
			},
			{
				path: RouteNames.tools,
				children: [
					{
						path: RouteNames.integrations,
						element: <Integrations />,
					},
					{
						path: `${RouteNames.integrationDetails}/:id`,
						element: <IntegrationDetails />,
					},
					{
						path: RouteNames.oauthCallback,
						element: <QuickBooksOAuthCallback />,
					},
					{
						path: RouteNames.quickBooksOAuthCallback,
						element: <QuickBooksOAuthCallback />,
					},
					{
						path: RouteNames.bulkImports,
						element: <ImportExport />,
					},
					{
						path: RouteNames.exports,
						element: <Exports />,
					},
					{
						path: RouteNames.s3Exports,
						element: <S3Exports />,
					},
					{
						path: RouteNames.s3ExportManagement,
						element: <ExportManagement />,
					},
					{
						path: RouteNames.s3ExportDetails,
						element: <ExportDetails />,
					},
					{
						path: RouteNames.s3TaskRuns,
						element: <TaskRunsPage />,
					},
				],
			},
			{
				path: RouteNames.settings,
				element: <SettingsDashboard />,
			},
			{
				path: RouteNames.customerBilling,
				element: <Navigate to={`${RouteNames.settings}?tab=billing`} replace />,
			},
		],
	},
	{
		path: '*',
		element: <ErrorPage />,
		errorElement: <RouterErrorElement />,
	},
]);
