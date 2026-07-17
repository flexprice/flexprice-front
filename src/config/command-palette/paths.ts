/**
 * Path constants for command palette navigation.
 * Keys are kebab-case. Values match routes in @/core/routes/Routes.
 * Duplicated here to avoid circular dependency (Routes -> MainLayout -> CommandPalette -> config -> Routes).
 */
export const commandPalettePaths = {
	'home-dashboard': '/home',
	'create-feature': '/product-catalog/features/create-feature',
	'product-catalog-features': '/product-catalog/features',
	'product-catalog-plan': '/product-catalog/plan',
	'product-catalog-coupons': '/product-catalog/coupons',
	'product-catalog-addons': '/product-catalog/addons',
	'product-catalog-cost-sheets': '/product-catalog/cost-sheets',
	'product-catalog-price-units': '/product-catalog/price-units',
	'product-catalog-groups': '/product-catalog/groups',
	'billing-customers': '/billing/customers',
	'billing-subscriptions': '/billing/subscriptions',
	'billing-taxes': '/billing/taxes',
	'billing-invoices': '/billing/invoices',
	'billing-credit-notes': '/billing/credit-notes',
	'billing-payments': '/billing/payments',
	'settings-billing': '/settings?tab=billing',
	'tools-bulk-imports': '/tools/bulk-imports',
	'tools-revenue': '/revenue',
	'tools-exports': '/tools/exports',
	'tools-exports-s3': '/tools/exports/s3',
	'usage-tracking-events': '/usage-tracking/events',
	'usage-tracking-query': '/usage-tracking/query',
	'developers-api-keys': '/developers/api-keys',
	'developers-service-accounts': '/developers/service-accounts',
	'developers-webhooks': '/developers/webhooks',
	'developers-workflows': '/developers/workflows',
	'tools-integrations': '/tools/integrations',
	'tools-integrations-stripe': '/tools/integrations/stripe',
	'tools-integrations-razorpay': '/tools/integrations/razorpay',
	'tools-integrations-chargebee': '/tools/integrations/chargebee',
	'tools-integrations-hubspot': '/tools/integrations/hubspot',
	'tools-integrations-quickbooks': '/tools/integrations/quickbooks',
	'tools-integrations-zoho': '/tools/integrations/zoho',
	'tools-integrations-nomod': '/tools/integrations/nomod',
	'tools-integrations-moyasar': '/tools/integrations/moyasar',
	'tools-integrations-paddle': '/tools/integrations/paddle',
	'product-catalog-pricing-widget': '/product-catalog/pricing-widget',
} as const;

export type CommandPalettePathKey = keyof typeof commandPalettePaths;
