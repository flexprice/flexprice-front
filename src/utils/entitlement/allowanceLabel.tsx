import type { TFunction } from 'i18next';
import {
	Entitlement,
	ENTITLEMENT_AGGREGATION_MODE,
	ENTITLEMENT_GRANT_DURATION_UNIT,
	ENTITLEMENT_GRANT_MEASURE,
	hasGrantConfig,
	isUnlimitedGrant,
} from '@/models/Entitlement';
import { FEATURE_TYPE } from '@/models/Feature';

const durationKey: Record<ENTITLEMENT_GRANT_DURATION_UNIT, string> = {
	[ENTITLEMENT_GRANT_DURATION_UNIT.HOUR]: 'entitlements.addDrawer.durationHour',
	[ENTITLEMENT_GRANT_DURATION_UNIT.DAY]: 'entitlements.addDrawer.durationDay',
	[ENTITLEMENT_GRANT_DURATION_UNIT.WEEK]: 'entitlements.addDrawer.durationWeek',
	[ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD]: 'entitlements.addDrawer.durationBillingPeriod',
};

/**
 * How long one allowance window lasts, in words: "day", "3 days", "billing period".
 * A cycle-length window carries no count — its length comes from the subscription.
 */
export const formatGrantPeriod = (
	entitlement: Pick<Partial<Entitlement>, 'grant_duration_value' | 'grant_duration_unit'>,
	t: TFunction<'catalog'>,
): string => {
	const unit = entitlement.grant_duration_unit ?? ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD;
	const label = t(durationKey[unit]);
	const count = entitlement.grant_duration_value ?? 1;
	if (unit === ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD || count === 1) return label;
	return `${count} ${label}s`;
};

/**
 * How much is included, without the cadence: "1,000 calls", "Unlimited".
 * Reads the same for grant-backed and legacy rows on purpose — to whoever is
 * configuring a plan the two mean the same thing.
 */
export const formatAllowanceValue = (entitlement: Partial<Entitlement>, t: TFunction<'catalog'>): string => {
	switch (entitlement.feature_type as FEATURE_TYPE) {
		case FEATURE_TYPE.STATIC:
			return entitlement.static_value ?? '--';
		case FEATURE_TYPE.BOOLEAN:
			return entitlement.is_enabled ? t('common:labels.enabled') : t('common:labels.disabled');
		case FEATURE_TYPE.CONFIG:
			return '--';
	}

	if (isUnlimitedGrant(entitlement) || (!hasGrantConfig(entitlement) && entitlement.usage_limit == null)) {
		return t('entitlements.allowance.unlimited');
	}

	const unit =
		entitlement.grant_measure === ENTITLEMENT_GRANT_MEASURE.AMOUNT
			? t('entitlements.addDrawer.measureAmount')
			: (entitlement.feature?.unit_plural?.trim() ?? '');

	const amount = hasGrantConfig(entitlement) ? Number(entitlement.grant_quota ?? 0) : Number(entitlement.usage_limit ?? 0);
	return `${amount.toLocaleString()}${unit ? ` ${unit}` : ''}`;
};

/**
 * How often the allowance refreshes: "5 days", "billing period", or a legacy
 * reset period. Empty when the row has no cadence to speak of.
 */
export const formatAllowanceReset = (entitlement: Partial<Entitlement>, t: TFunction<'catalog'>): string => {
	if ((entitlement.feature_type as FEATURE_TYPE) !== FEATURE_TYPE.METERED) return '--';
	// An unlimited allowance never refreshes — there is nothing to reset.
	if (isUnlimitedGrant(entitlement)) return '--';
	if (hasGrantConfig(entitlement)) return formatGrantPeriod(entitlement, t);
	if (entitlement.usage_limit == null) return '--';
	return entitlement.usage_reset_period
		? String(entitlement.usage_reset_period).toLowerCase()
		: t('entitlements.addDrawer.durationBillingPeriod');
};

/**
 * The combined phrase, for places that show one cell instead of two.
 */
export const formatAllowance = (entitlement: Partial<Entitlement>, t: TFunction<'catalog'>): string => {
	switch (entitlement.feature_type as FEATURE_TYPE) {
		case FEATURE_TYPE.STATIC:
			return entitlement.static_value ?? '--';
		case FEATURE_TYPE.BOOLEAN:
			return entitlement.is_enabled ? t('common:labels.enabled') : t('common:labels.disabled');
		case FEATURE_TYPE.CONFIG:
			return '--';
	}

	if (isUnlimitedGrant(entitlement) || (!hasGrantConfig(entitlement) && entitlement.usage_limit == null)) {
		return t('entitlements.allowance.unlimited');
	}

	const unit =
		entitlement.grant_measure === ENTITLEMENT_GRANT_MEASURE.AMOUNT
			? t('entitlements.addDrawer.measureAmount')
			: (entitlement.feature?.unit_plural?.trim() ?? '');

	if (hasGrantConfig(entitlement)) {
		const amount = `${Number(entitlement.grant_quota ?? 0).toLocaleString()}${unit ? ` ${unit}` : ''}`;
		return t('entitlements.allowance.perPeriod', { amount, period: formatGrantPeriod(entitlement, t) });
	}

	// Legacy row: usage_limit with a cycle reset period.
	const amount = `${Number(entitlement.usage_limit ?? 0).toLocaleString()}${unit ? ` ${unit}` : ''}`;
	const period = entitlement.usage_reset_period
		? String(entitlement.usage_reset_period).toLowerCase()
		: t('entitlements.addDrawer.durationBillingPeriod');
	return t('entitlements.allowance.perPeriod', { amount, period });
};

/**
 * Value + cadence for an aggregated feature, where the grant summary describes
 * the whole pool. Separate from the entitlement-row helpers because the
 * aggregated shape has no feature_type and its `usage_limit` is meaningless once
 * a grant config is present.
 */
export const formatAggregatedAllowance = (
	agg:
		| {
				usage_limit?: number | null;
				usage_reset_period?: string;
				grant_quota?: string | null;
				grant_duration_value?: number | null;
				grant_duration_unit?: ENTITLEMENT_GRANT_DURATION_UNIT;
				grant_measure?: ENTITLEMENT_GRANT_MEASURE;
				grant_unlimited?: boolean;
		  }
		| undefined,
	unitPlural: string | undefined,
	t: TFunction<'catalog'>,
): { value: string; reset: string } => {
	if (!agg) return { value: '--', reset: '--' };

	const isGrant = Boolean(agg.grant_duration_unit || agg.grant_quota != null || agg.grant_unlimited);
	const unit =
		agg.grant_measure === ENTITLEMENT_GRANT_MEASURE.AMOUNT ? t('entitlements.addDrawer.measureAmount') : (unitPlural?.trim() ?? '');
	const withUnit = (n: number) => `${n.toLocaleString()}${unit ? ` ${unit}` : ''}`;

	if (isGrant) {
		if (agg.grant_unlimited) return { value: t('entitlements.allowance.unlimited'), reset: '--' };
		return {
			value: withUnit(Number(agg.grant_quota ?? 0)),
			reset: formatGrantPeriod({ grant_duration_value: agg.grant_duration_value, grant_duration_unit: agg.grant_duration_unit }, t),
		};
	}

	if (agg.usage_limit == null) return { value: t('entitlements.allowance.unlimited'), reset: '--' };
	return {
		value: withUnit(agg.usage_limit),
		reset: agg.usage_reset_period ? String(agg.usage_reset_period).toLowerCase() : t('entitlements.addDrawer.durationBillingPeriod'),
	};
};

/** Parallel features keep separate budgets; worth flagging where rows are listed. */
export const isParallelAllowance = (entitlement: Partial<Entitlement>): boolean =>
	entitlement.aggregation_mode === ENTITLEMENT_AGGREGATION_MODE.PARALLEL;
