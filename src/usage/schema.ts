//
// Runtime validation / normalization boundary for the usage widgets.
//
// WHY: containers feed trusted, adapter-produced data, but external SDK consumers pass raw props
// from their own code/API. TypeScript disappears at runtime, so a JS consumer — or a TS one using
// `as any` — can hand us the wrong shape. Rather than crash (white screen), we coerce what we can
// and surface issues via `onValidationError`. Mirrors `src/pricing/schema.ts`.
import { z } from 'zod';
import { createNormalizer, type NormalizerIssue } from '@/lib/exportable/validation';
import type { UsageQuotaItem, MetricCardItem, UsageTrendSeries, UsageBreakdownRow } from './types';

const nullishToString = z.preprocess((v) => (v == null ? '' : v), z.coerce.string()).catch('');
// Optional string fields: `null`/`undefined` must both leave the field unset, not coerce to the
// literal string "null" — `z.coerce.string().optional()` alone only short-circuits on `undefined`.
const nullishToOptionalString = z.preprocess((v) => (v == null ? undefined : v), z.coerce.string().optional());
// `z.coerce.boolean()` runs values through the JS `Boolean()` constructor, so any non-empty
// string — including the literal `"false"` — coerces to `true`. Parse `"true"`/`"false"` strings
// explicitly instead; any other input still passes through to a real boolean or `.catch()`.
const looseBoolean = z.preprocess((v) => {
	if (typeof v !== 'string') return v;
	if (v.toLowerCase() === 'true') return true;
	if (v.toLowerCase() === 'false') return false;
	return v;
}, z.boolean());

function devWarn(label: string) {
	return (issue: NormalizerIssue) => {
		if (import.meta.env?.DEV) console.warn(`[@flexprice/ui] invalid ${label} dropped/normalized:`, issue);
	};
}

// ── UsageQuota ──────────────────────────────────────────────────────────────

export const UsageQuotaItemSchema = z
	.object({
		id: nullishToString,
		name: nullishToString,
		currentUsage: z.coerce.number().catch(0),
		limit: z.coerce.number().nullable().catch(null),
		isUnlimited: looseBoolean.catch(false),
	})
	.passthrough();

const usageQuotaNormalizer = createNormalizer<UsageQuotaItem>(UsageQuotaItemSchema);

export function normalizeUsageQuotaItems(input: unknown, onValidationError?: (issue: NormalizerIssue) => void): UsageQuotaItem[] {
	return usageQuotaNormalizer.normalizeMany(input, onValidationError ?? devWarn('usage quota item'));
}

// ── MetricCards ──────────────────────────────────────────────────────────────

export const MetricCardItemSchema = z
	.object({
		id: nullishToString,
		titleKey: z.enum(['revenue', 'cost', 'margin', 'marginPercent', 'cpm', 'custom']).catch('custom'),
		customLabel: nullishToOptionalString,
		value: z.coerce.number().catch(0),
		currency: nullishToOptionalString,
		isPercent: looseBoolean.optional().catch(undefined),
		showChangeIndicator: looseBoolean.optional().catch(undefined),
		isNegative: looseBoolean.optional().catch(undefined),
	})
	.passthrough();

const metricCardsNormalizer = createNormalizer<MetricCardItem>(MetricCardItemSchema);

export function normalizeMetricCardItems(input: unknown, onValidationError?: (issue: NormalizerIssue) => void): MetricCardItem[] {
	return metricCardsNormalizer.normalizeMany(input, onValidationError ?? devWarn('metric card item'));
}

// ── UsageTrendChart ──────────────────────────────────────────────────────────

const usageTrendPointSchema = z
	.object({
		timestamp: nullishToString,
		usage: z.coerce.number().catch(0),
	})
	.passthrough();

export const UsageTrendSeriesSchema = z
	.object({
		id: nullishToString,
		name: nullishToString,
		points: z
			.array(usageTrendPointSchema)
			.optional()
			.catch(() => [])
			.transform((v) => v ?? []),
	})
	.passthrough();

const usageTrendNormalizer = createNormalizer<UsageTrendSeries>(UsageTrendSeriesSchema);

export function normalizeUsageTrendSeries(input: unknown, onValidationError?: (issue: NormalizerIssue) => void): UsageTrendSeries[] {
	return usageTrendNormalizer.normalizeMany(input, onValidationError ?? devWarn('usage trend series'));
}

// ── UsageBreakdown ──────────────────────────────────────────────────────────

export const UsageBreakdownRowSchema = z
	.object({
		id: nullishToString,
		name: nullishToString,
		groupId: nullishToOptionalString,
		groupName: nullishToOptionalString,
		totalUsage: z.coerce.number().catch(0),
		totalUsageDisplay: nullishToOptionalString,
		unit: nullishToOptionalString,
		unitPrice: nullishToOptionalString,
		totalCost: z.coerce.number().catch(0),
		currency: nullishToOptionalString,
	})
	.passthrough();

const usageBreakdownNormalizer = createNormalizer<UsageBreakdownRow>(UsageBreakdownRowSchema);

export function normalizeUsageBreakdownRows(input: unknown, onValidationError?: (issue: NormalizerIssue) => void): UsageBreakdownRow[] {
	return usageBreakdownNormalizer.normalizeMany(input, onValidationError ?? devWarn('usage breakdown row'));
}
