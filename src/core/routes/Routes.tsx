import MainLayout from '@/layouts/MainLayout';
import Auth from '@/pages/auth/Auth';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import CustomerPage from '@/pages/customer/customers/Customers';
import AuthMiddleware from '../auth/AuthProvider';
import MeterPage from '@/pages/usage/meter/MeterPage';
import AddMeterPage from '@/pages/usage/meter/AddMeter';
import EditMeterPage from '@/pages/usage/meter/EditMeterPage';
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
import AddCreditPage from '@/pages/customer/invoices/AddCreditPage';
import CreditNote from '@/pages/customer/tabs/CreditNote';
import AddFeaturePage from '@/pages/product-catalog/features/AddFeature';
import FeaturesPage from '@/pages/product-catalog/features/Features';
import ImportExport from '@/pages/customer/import-export/ImportExport';
import Integrations from '@/pages/insights-tools/integrations/Integrations';
import IntegrationDetails from '@/pages/insights-tools/integrations/IntegrationDetails';
import FeatureDetails from '@/pages/product-catalog/features/FeatureDetails';
import AddOn from '@/pages/product-catalog/addons/AddOn';
import CustomerInvoiceDetailsPage from '@/pages/customer/customers/CustomerInvoiceDetailsPage';
import DeveloperPage from '@/pages/developer/developer';
import SignupConfirmation from '@/pages/auth/SignupConfirmation';
import ResendVerification from '@/pages/auth/ResendVerification';
import EmailVerification from '@/pages/auth/EmailVerification';
import CustomerInformation from '@/pages/customer/tabs/CustomerInformation';
import PricingPage from '@/pages/product-catalog/plans/Pricing';
import OnboardingPage from '@/pages/onboarding/onboarding';
import PaymentPage from '@/pages/customer/payments/PaymentPage';
import BillingPage from '@/pages/settings/Billing';
import AddChargesPage from '@/pages/product-catalog/plans/AddCharges';
import CreateInvoicePage from '@/pages/customer/invoices/CreateInvoice';

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
	invoices: '/customer-management/invoices',
	createInvoice: '/customer-management/customers/:customerId/invoices/create',
	payments: '/customer-management/payments',

	// product catalog routes
	productCatalog: '/product-catalog',
	plan: '/product-catalog/plan',
	pricing: '/product-catalog/pricing-widget',
	addCharges: '/product-catalog/plan/:planId/add-charges',

	features: '/product-catalog/features',
	createFeature: '/product-catalog/features/create-feature',
	featureDetails: '/product-catalog/features',

	// add on routes
	addOn: '/product-catalog/add-on',

	// tools routes
	tools: '/tools',
	bulkImports: '/tools/bulk-imports',
	integrations: '/tools/integrations',
	integrationDetails: '/tools/integrations',

	// footer
	developers: '/developers',
	onboarding: '/onboarding',
	billing: '/billing',
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
				element: <Navigate to={RouteNames.onboarding} />,
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
						path: RouteNames.addCharges,
						element: <AddChargesPage />,
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
						path: `${RouteNames.invoices}/:invoiceId`,
						element: <InvoiceDetailsPage />,
					},
				],
			},
			{
				path: RouteNames.usageTracking,
				children: [
					{
						path: RouteNames.meter,
						element: <MeterPage />,
					},
					{
						path: RouteNames.addMeter,
						element: <AddMeterPage />,
					},
					{
						path: RouteNames.editMeter,
						element: <EditMeterPage />,
					},
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
				path: RouteNames.onboarding,
				element: <OnboardingPage />,
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
