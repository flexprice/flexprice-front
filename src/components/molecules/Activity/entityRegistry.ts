import { LucideIcon, User, Repeat, Wallet, FileText, Layers2, Tag, CreditCard } from 'lucide-react';
import CustomerApi from '@/api/CustomerApi';
import SubscriptionApi from '@/api/SubscriptionApi';
import WalletApi from '@/api/WalletApi';
import InvoiceApi from '@/api/InvoiceApi';
import { PlanApi } from '@/api/PlanApi';
import { PriceApi } from '@/api/PriceApi';
import PaymentApi from '@/api/PaymentApi';
import { RouteNames } from '@/core/routes/Routes';

export interface EntityDefinition {
	icon: LucideIcon;
	route: (id: string, ctx?: { customerId?: string }) => string | null;
	resolve: (id: string) => Promise<{ label: string; exists: boolean }>;
}

type Fields = Record<string, unknown>;
const str = (f: Fields, k: string): string => (typeof f[k] === 'string' ? (f[k] as string) : '');
const first = (...vals: string[]) => vals.find((v) => v !== '') ?? '';

export const shortId = (id: string): string => {
	const i = id.indexOf('_');
	if (i < 0 || id.length <= i + 7) return id;
	return `${id.slice(0, i)}_…${id.slice(-6)}`;
};

const ladders: Record<string, (f: Fields) => string> = {
	customer: (f) => first(str(f, 'name'), str(f, 'external_id')),
	subscription: (f) => str(f, 'lookup_key'),
	wallet: (f) =>
		first(
			str(f, 'name'),
			str(f, 'currency') ? `${str(f, 'currency')} ${str(f, 'wallet_type').toLowerCase().replace(/_/g, ' ')} wallet` : '',
		),
	invoice: (f) => str(f, 'invoice_number'),
	plan: (f) => first(str(f, 'name'), str(f, 'lookup_key')),
	price: (f) =>
		first(
			str(f, 'display_name'),
			str(f, 'lookup_key'),
			str(f, 'amount') ? `${str(f, 'amount')} ${str(f, 'currency')} / ${str(f, 'billing_period').toLowerCase()}` : '',
		),
	payment: (f) =>
		str(f, 'amount') ? `${str(f, 'amount')} ${str(f, 'currency')} via ${str(f, 'payment_gateway') || str(f, 'payment_method_type')}` : '',
};

export const labelFor = (type: string, fields: Fields): string => {
	const l = ladders[type]?.(fields) ?? '';
	return l || shortId(str(fields, 'id'));
};

// Callers pass arrow wrappers: the API classes use `this.baseUrl`, so an unbound static method throws.
const resolveWith =
	<T>(type: string, fetch: (id: string) => Promise<T>, pick: (r: T) => Fields) =>
	async (id: string) => {
		const r = await fetch(id);
		return { label: labelFor(type, { ...pick(r), id }), exists: true };
	};

export const ENTITY_REGISTRY: Record<string, EntityDefinition> = {
	customer: {
		icon: User,
		route: (id) => `${RouteNames.customers}/${id}`,
		resolve: resolveWith(
			'customer',
			(id) => CustomerApi.getCustomerById(id),
			(r) => r as unknown as Fields,
		),
	},
	subscription: {
		icon: Repeat,
		route: (id, ctx) =>
			ctx?.customerId ? `${RouteNames.customers}/${ctx.customerId}/subscription/${id}` : RouteNames.subscriptionDetails.replace(':id', id),
		resolve: async (id) => {
			const s = (await SubscriptionApi.getSubscription(id)) as unknown as Fields & {
				plan?: { name?: string };
				customer?: { name?: string };
			};
			const base = labelFor('subscription', { ...s, id });
			if (s.lookup_key) return { label: base, exists: true };
			const plan = s.plan?.name ?? '';
			const customer = s.customer?.name ?? '';
			return { label: plan && customer ? `${plan} · ${customer}` : plan || customer || base, exists: true };
		},
	},
	wallet: {
		icon: Wallet,
		route: (id, ctx) => (ctx?.customerId ? `${RouteNames.customers}/${ctx.customerId}/wallet?activeWalletId=${id}` : null),
		resolve: resolveWith(
			'wallet',
			(id) => WalletApi.getWalletById(id),
			(r) => r as unknown as Fields,
		),
	},
	invoice: {
		icon: FileText,
		route: (id, ctx) => (ctx?.customerId ? `${RouteNames.customers}/${ctx.customerId}/invoice/${id}` : `${RouteNames.invoices}/${id}`),
		resolve: resolveWith(
			'invoice',
			(id) => InvoiceApi.getInvoiceById(id),
			(r) => r as unknown as Fields,
		),
	},
	plan: {
		icon: Layers2,
		route: (id) => `${RouteNames.plan}/${id}`,
		resolve: resolveWith(
			'plan',
			(id) => PlanApi.getPlanById(id),
			(r) => r as unknown as Fields,
		),
	},
	price: {
		icon: Tag,
		route: () => null,
		resolve: resolveWith(
			'price',
			(id) => PriceApi.getPriceById(id),
			(r) => r as unknown as Fields,
		),
	},
	payment: {
		icon: CreditCard,
		// There is only a payments list page, no per-payment detail route.
		route: () => null,
		resolve: resolveWith(
			'payment',
			(id) => PaymentApi.getPaymentById(id),
			(r) => r as unknown as Fields,
		),
	},
};

export const getEntityDef = (type: string): EntityDefinition | undefined => ENTITY_REGISTRY[type];
