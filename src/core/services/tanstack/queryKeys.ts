import { refetchQueries } from './ReactQueryProvider';

/**
 * The same domain data is read under several different top-level query keys
 * depending on which surface renders it (global list page, customer tab,
 * detail page). `refetchQueries` prefix-matches, so a mutation that invalidates
 * only one of these leaves every other surface stale until a hard refresh.
 *
 * Keep these lists in sync with the `queryKey` used by the corresponding
 * `useQuery` call sites.
 */

/** Every top-level key under which a subscription list or detail is read. */
export const SUBSCRIPTION_QUERY_KEYS = [
	// CustomerOverviewTab — subscriptions table on the customer overview page
	'customerSubscriptions',
	// Subscriptions page — global subscriptions list (via QueryableDataArea)
	'fetchSubscriptions',
	// CustomerInformationTab — subscriptions billed to this customer
	'subscriptionsByInvoicingCustomer',
	// CustomerSubscriptionDetailsPage / SubscriptionAddonsSection
	'subscriptionDetails',
] as const;

/** Every top-level key under which an invoice list or detail is read. */
export const INVOICE_QUERY_KEYS = [
	// InvoicePage — global invoices list (via QueryableDataArea)
	'fetchInvoices',
	// CustomerInvoiceDetail / AddCreditNotePage — single invoice
	'fetchInvoice',
	// CustomerInvoiceTab — invoices table on the customer profile
	'invoice',
	// CustomerSubscriptionDetailsPage — invoice preview for the current period
	'subscriptionInvoices',
	// EditInvoicePage — invoice loaded into the edit form
	'invoiceEdit',
] as const;

/** Refetch every subscription surface. Use after any subscription mutation. */
export const refetchSubscriptionQueries = async () => {
	await Promise.all(SUBSCRIPTION_QUERY_KEYS.map((key) => refetchQueries(key)));
};

/** Refetch every invoice surface. Use after any invoice mutation. */
export const refetchInvoiceQueries = async () => {
	await Promise.all(INVOICE_QUERY_KEYS.map((key) => refetchQueries(key)));
};
