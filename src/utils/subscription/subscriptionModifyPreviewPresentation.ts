import { formatAmount } from '@/components/atoms/Input/Input';
import type { Invoice } from '@/models/Invoice';
import { SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION, SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION } from '@/models';
import type { ChangedInvoice, ChangedLineItem } from '@/types/dto/Subscription';
import formatDate from '@/utils/common/format_date';
import { getCurrencySymbol } from '@/utils/common/helper_functions';

/** Dialog / caller context for quantity modify preview (API does not return “before” quantity). */
export interface QuantityChangePreviewContext {
	lineItemDisplayName: string;
	previousQuantity: string;
	newQuantity: string;
	currency: string;
}

export type QuantityDeltaDirection = 'increase' | 'decrease' | 'unchanged';

function parseQuantityForCompare(q: string): number {
	const n = Number(String(q).trim().replace(/,/g, ''));
	return Number.isFinite(n) ? n : NaN;
}

export function getQuantityDeltaDirection(previousQuantity: string, newQuantity: string): QuantityDeltaDirection {
	const a = parseQuantityForCompare(previousQuantity);
	const b = parseQuantityForCompare(newQuantity);
	if (Number.isNaN(a) || Number.isNaN(b)) return 'unchanged';
	if (b > a) return 'increase';
	if (b < a) return 'decrease';
	return 'unchanged';
}

export function getQuantityChangePreviewCopy(ctx: QuantityChangePreviewContext): {
	direction: QuantityDeltaDirection;
	directionLabel: string;
	fromDisplay: string;
	toDisplay: string;
} {
	const direction = getQuantityDeltaDirection(ctx.previousQuantity, ctx.newQuantity);
	const fromDisplay = ctx.previousQuantity.trim();
	const toDisplay = ctx.newQuantity.trim();
	const directionLabel = direction === 'increase' ? 'Quantity increase' : direction === 'decrease' ? 'Quantity decrease' : 'Same quantity';
	return { direction, directionLabel, fromDisplay, toDisplay };
}

/**
 * Use `subscription.latest_invoice` for amounts when its id matches a changed invoice,
 * or when there is exactly one changed invoice (preview + subscription snapshot align).
 */
export function resolveInvoiceAmountSource(changedInvoices: ChangedInvoice[], latestInvoice: Invoice | null | undefined): Invoice | null {
	if (!latestInvoice || changedInvoices.length === 0) return null;
	const idMatch = changedInvoices.some((c) => c.id === latestInvoice.id);
	if (idMatch) return latestInvoice;
	if (changedInvoices.length === 1) return latestInvoice;
	return null;
}

/** Formatted money for UI, e.g. "$1,234.56" */
export function formatMoneyForPreview(currency: string, amount: number): string {
	const sym = getCurrencySymbol(currency || 'USD');
	return `${sym}${formatAmount(String(amount))}`;
}

export function getInvoiceAmountForPreviewDisplay(invoice: Invoice): number {
	const n = invoice.total ?? invoice.amount_due ?? 0;
	return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

export interface BillingImpactBullet {
	/** Stable key */
	id: string;
	primary: string;
	secondary?: string;
}

export interface BillingImpactRow {
	id: string;
	title: string;
	amountText?: string;
}

interface ResolvedBillingImpact {
	id: string;
	primary: string;
	compactTitle: string;
	amountText?: string;
	secondary?: string;
}

function resolveBillingImpacts(changedInvoices: ChangedInvoice[], latestInvoice: Invoice | null | undefined): ResolvedBillingImpact[] {
	const amountSource = resolveInvoiceAmountSource(changedInvoices, latestInvoice ?? null);

	return changedInvoices.map((inv) => {
		const showAmount = amountSource != null && (changedInvoices.length === 1 || inv.id === amountSource.id);
		const rawAmount = showAmount ? getInvoiceAmountForPreviewDisplay(amountSource!) : null;
		const currency = amountSource?.currency ?? latestInvoice?.currency ?? 'USD';
		const hasAmount = rawAmount != null && rawAmount > 0;
		const amountText = hasAmount ? formatMoneyForPreview(currency, rawAmount!) : undefined;

		if (inv.action === SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION.CREATED) {
			return {
				id: inv.id,
				primary: 'A proration invoice will be created to collect charges for this change.',
				compactTitle: 'Proration invoice',
				amountText,
				secondary: amountText ? `Estimated invoice total: ${amountText}.` : undefined,
			};
		}

		if (inv.action === SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION.WALLET_CREDIT) {
			return {
				id: inv.id,
				primary: 'A credit will be added to the customer wallet, reducing what they owe.',
				compactTitle: 'Wallet credit',
				amountText,
				secondary: amountText ? `Estimated credit: ${amountText}.` : undefined,
			};
		}

		return {
			id: inv.id,
			primary: 'Billing will be updated as part of this change.',
			compactTitle: 'Billing update',
		};
	});
}

export function buildBillingImpactRows(changedInvoices: ChangedInvoice[], latestInvoice: Invoice | null | undefined): BillingImpactRow[] {
	return resolveBillingImpacts(changedInvoices, latestInvoice).map((r) => ({
		id: r.id,
		title: r.compactTitle,
		amountText: r.amountText,
	}));
}

export function buildBillingImpactBullets(
	changedInvoices: ChangedInvoice[],
	latestInvoice: Invoice | null | undefined,
): BillingImpactBullet[] {
	return resolveBillingImpacts(changedInvoices, latestInvoice).map((r) => ({
		id: r.id,
		primary: r.primary,
		secondary: r.secondary,
	}));
}

const DEFAULT_END_SENTINEL = '0001-01-01T00:00:00Z';

function formatLineItemDateRange(li: ChangedLineItem): string | null {
	const parts: string[] = [];
	if (li.start_date) {
		try {
			parts.push(`effective from ${formatDate(li.start_date)}`);
		} catch {
			/* ignore */
		}
	}
	if (li.end_date && li.end_date.trim() !== '' && li.end_date !== DEFAULT_END_SENTINEL) {
		try {
			parts.push(`through ${formatDate(li.end_date)}`);
		} catch {
			/* ignore */
		}
	}
	return parts.length ? parts.join(', ') : null;
}

/** Compact service period for preview tables, e.g. "Apr 01, 2026 – May 01, 2026". */
export function formatCompactLineItemPeriod(li: ChangedLineItem): string | null {
	let startStr: string | null = null;
	let endStr: string | null = null;
	if (li.start_date) {
		try {
			startStr = formatDate(li.start_date);
		} catch {
			/* ignore */
		}
	}
	if (li.end_date && li.end_date.trim() !== '' && li.end_date !== DEFAULT_END_SENTINEL) {
		try {
			endStr = formatDate(li.end_date);
		} catch {
			/* ignore */
		}
	}
	if (startStr && endStr) return `${startStr} – ${endStr}`;
	if (startStr) return startStr;
	if (endStr) return endStr;
	return null;
}

export type LineItemChangeRowKind = 'ended' | 'created' | 'updated' | 'other';

export interface LineItemChangeRow {
	id: string;
	kind: LineItemChangeRowKind;
	label: string;
	quantityDisplay: string;
	periodDisplay: string | null;
}

export function buildLineItemChangeRows(lineItems: ChangedLineItem[]): LineItemChangeRow[] {
	return lineItems.map((li) => {
		const periodDisplay = formatCompactLineItemPeriod(li);
		const qty = li.quantity?.trim() || '—';
		switch (li.change_action) {
			case SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION.CREATED:
				return { id: li.id, kind: 'created', label: 'New line', quantityDisplay: qty, periodDisplay };
			case SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION.UPDATED:
				return { id: li.id, kind: 'updated', label: 'Updated', quantityDisplay: qty, periodDisplay };
			case SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION.ENDED:
				return { id: li.id, kind: 'ended', label: 'Ends', quantityDisplay: qty, periodDisplay };
			default:
				return { id: li.id, kind: 'other', label: 'Change', quantityDisplay: qty, periodDisplay };
		}
	});
}

export interface LineItemChangeBullet {
	id: string;
	text: string;
}

export function buildLineItemChangeBullets(lineItems: ChangedLineItem[]): LineItemChangeBullet[] {
	return lineItems.map((li) => {
		const range = formatLineItemDateRange(li);
		let text: string;
		switch (li.change_action) {
			case SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION.CREATED:
				text = `A new charge line will be added with quantity ${li.quantity}.`;
				break;
			case SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION.UPDATED:
				text = `A charge will be updated. New quantity: ${li.quantity}.`;
				break;
			case SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION.ENDED:
				text = 'A charge line will end.';
				break;
			default:
				text = 'A charge line will change.';
		}
		if (range) {
			text = `${text} (${range})`;
		}
		return { id: li.id, text };
	});
}

export function hasAnyChangedResources(lineItems: ChangedLineItem[], subscriptions: unknown[], invoices: ChangedInvoice[]): boolean {
	return lineItems.length > 0 || subscriptions.length > 0 || invoices.length > 0;
}
