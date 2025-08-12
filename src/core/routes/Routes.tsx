import MainLayout from '@/layouts/MainLayout';
import Auth from '@/pages/auth/Auth';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import CustomerPage from '@/pages/customer/customers/Customers';
import AuthMiddleware from '../auth/AuthProvider';
import PricingPlans from '@/pages/product-catalog/plans/Plans';
import CustomerSubscription from '@/pages/customer/customers/CustomerSubscription';
import CustomerDetails from '@/pages/customer/customers/CustomerDetails';
import ErrorPage from '@/pages/error/ErrorPage';
import PlanDetailsPage from '@/pages/product-catalog/plans/PlanDetailsPage';
import EventsPage from '@/pages/usage/events/Events';
import QueryPage from '@/pages/usage/query/Query';
import InvoicePage from '@/pages/customer/invoices/InvoicePage';
import InvoiceDetailsPage from '@/pages/customer/invoices/InvoiceDetailsPage';
import Invoice from '@/pages/customer/tabs/Invoice';
import Overview from '@/pages/customer/tabs/Overview';
import WalletTab from '@/pages/customer/tabs/Wallet';
import SubscriptionDetails from '@/pages/customer/customers/SubscriptionDetails';
import AddCreditPage from '@/pages/customer/invoices/AddCreditNotePage';
import CreditNote from '@/pages/customer/creditnotes/CreditNote';
import CreditNotesPage from '@/pages/customer/creditnotes/CreditNotesPage';
import CreditNoteDetailsPage from '@/pages/customer/creditnotes/CreditNoteDetailsPage';
import AddFeaturePage from '@/pages/product-catalog/features/AddFeature';
import FeaturesPage from '@/pages/product-catalog/features/Features';
import ImportExport from '@/pages/customer/import-export/ImportExport';
import Integrations from '@/pages/insights-tools/integrations/Integrations';
import IntegrationDetails from '@/pages/insights-tools/integrations/IntegrationDetails';
import FeatureDetails from '@/pages/product-catalog/features/FeatureDetails';
import AddOn from '@/pages/product-catalog/addons/AddOn';
import AddonsPage from '@/pages/product-catalog/addons/Addons';
import AddonDetailsPage from '@/pages/product-catalog/addons/AddonDetails';
import AddonChargesPage from '@/pages/product-catalog/addons/AddonCharges';
import CustomerInvoiceDetailsPage from '@/pages/customer/customers/CustomerInvoiceDetailsPage';
import DeveloperPage from '@/pages/developer/developer';
import SignupConfirmation from '@/pages/auth/SignupConfirmation';
import ResendVerification from '@/pages/auth/ResendVerification';
import EmailVerification from '@/pages/auth/EmailVerification';
import CustomerInformation from '@/pages/customer/tabs/CustomerInformation';
import PricingPage from '@/pages/product-catalog/plans/Pricing';
import PaymentPage from '@/pages/customer/payments/PaymentPage';
import BillingPage from '@/pages/settings/Billing';
import AddChargesPage from '@/pages/product-catalog/plans/AddCharges';
import CreateInvoicePage from '@/pages/customer/invoices/CreateInvoice';
import { useUser } from '@/hooks/UserContext';
import OnboardingTenant from '@/pages/onboarding/OnboardingTenant';
import WebhookDashboard from '@/pages/webhooks/WebhookDashboard';
import CouponsPage from '@/pages/product-catalog/coupons/Coupons';
import CouponDetails from '@/pages/product-catalog/coupons/CouponDetails';
import { TenantMetadataKey } from '@/models/Tenant';
import TaxPage from '@/pages/customer/taxes/TaxRatesPage';
import TaxAssociation from '@/pages/customer/tabs/TaxAssociation';
import TaxrateDetailsPage from '@/pages/customer/taxes/TaxrateDetailsPage';
import { PriceUnitsPage } from '@/pages/product-catalog/price-units/PriceUnitsPage';
import { PriceUnitDetailsPage } from '@/pages/product-catalog/price-units/PriceUnitDetailsPage';

export const RouteNames = {
	home: '/',
	login: '/login',
	auth: '/auth',
	signupConfirmation: '/auth/signup/confirmation',
	resendVerification: '/auth/resend-verification',
	verifyEmail: '/auth/verify-email',

	// usage tracking routes
	usageTracking: '/usage-tracking',
	meter: '/usage-tracking/meter',
	addMeter: '/usage-tracking/meter/add-meter',
	editMeter: '/usage-tracking/meter/edit-meter',
	events: '/usage-tracking/events',
	queryPage: '/usage-tracking/query',

	// customer management routes
	customerManagement: '/customer-management',
	customers: '/customer-management/customers',
	taxes: '/customer-management/taxes',
	invoices: '/customer-management/invoices',
	createInvoice: '/customer-management/customers/:customerId/invoices/create',
	creditNotes: '/customer-management/credit-notes',
	payments: '/customer-management/payments',

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
	addOn: '/product-catalog/add-on',
	addons: '/product-catalog/addons',
	addonDetails: '/product-catalog/addons',
	addonCharges: '/product-catalog/addons/:addonId/add-charges',

	// price unit routes
	priceUnits: '/product-catalog/price-units',
	priceUnitDetails: '/product-catalog/price-units',

	// tools routes
	tools: '/tools',
	bulkImports: '/tools/bulk-imports',
	integrations: '/tools/integrations',
	integrationDetails: '/tools/integrations',

	// footer
	developers: '/developers',
	onboarding: '/onboarding',
	billing: '/billing',
	webhooks: '/webhooks',
};

const DefaultRoute = () => {
	const { user } = useUser();
	const onboardingMetadata = user?.tenant?.metadata?.[TenantMetadataKey.ONBOARDING_COMPLETED];
	const onboardingCompleted = onboardingMetadata === 'true';
	return <Navigate to={onboardingCompleted ? RouteNames.pricing : RouteNames.onboarding} />;
};

export const MainRouter = createBrowserRouter([
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
	// private routes
	{
		path: RouteNames.home,
		element: (
			<AuthMiddleware requiredRole={['admin']}>
				<MainLayout />
			</AuthMiddleware>
		),
		children: [
			{
				path: RouteNames.home,
				element: <DefaultRoute />,
			},

			{
				path: RouteNames.productCatalog,
				children: [
					{
						path: RouteNames.plan,
						element: <PricingPlans />,
					},
					{
						path: RouteNames.pricing,
						element: <PricingPage />,
					},
					{
						path: `${RouteNames.plan}/:planId`,
						element: <PlanDetailsPage />,
					},
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
						path: RouteNames.addOn,
						element: <AddOn />,
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
						path: RouteNames.priceUnits,
						element: <PriceUnitsPage />,
					},
					{
						path: `${RouteNames.priceUnitDetails}/:id`,
						element: <PriceUnitDetailsPage />,
					},
				],
			},

			{
				path: RouteNames.tools,
				children: [
					{
						path: RouteNames.bulkImports,
						element: <ImportExport />,
					},
					{
						path: RouteNames.integrations,
						element: <Integrations />,
					},
					{
						path: `${RouteNames.integrationDetails}/:id`,
						element: <IntegrationDetails />,
					},
				],
			},
			{
				path: RouteNames.customerManagement,
				children: [
					{
						path: RouteNames.customers,
						element: <CustomerPage />,
					},
					{
						path: `${RouteNames.customers}/:id/add-subscription`,
						element: <CustomerSubscription />,
					},
					{
						path: RouteNames.payments,
						element: <PaymentPage />,
					},
					{
						path: `${RouteNames.customers}/:id`,
						element: <CustomerDetails />,
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
								path: 'invoice/:invoice_id',
								element: <CustomerInvoiceDetailsPage />,
							},
							{
								path: 'invoice/:invoice_id/credit-note',
								element: <AddCreditPage />,
							},
							{
								path: 'subscription/:subscription_id',
								element: <SubscriptionDetails />,
							},
						],
					},
					{
						path: `${RouteNames.customers}/:customerId/invoices/create`,
						element: <CreateInvoicePage />,
					},
					{
						path: RouteNames.invoices,
						element: <InvoicePage />,
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
				path: RouteNames.developers,
				element: <DeveloperPage />,
			},
			{
				path: RouteNames.webhooks,
				element: <WebhookDashboard />,
			},
			{
				path: RouteNames.onboarding,
				element: <OnboardingTenant />,
			},
			{
				path: RouteNames.billing,
				element: <BillingPage />,
			},
		],
	},
	{
		path: '*',
		element: <ErrorPage />,
	},
]);
