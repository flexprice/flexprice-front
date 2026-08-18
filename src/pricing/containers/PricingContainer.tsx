import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Loader from '@/components/atoms/Loader/Loader';
import Select from '@/components/atoms/Select/Select';
import type { CreditGrant } from '@/models';
import { usePricingData } from '../hooks/usePricingData';
import {
	adaptPlanToCard,
	deriveCurrencyPeriodOptions,
	filterAndSortPlans,
	findBestPriceCombination,
	grantPlanId,
	type PlanWithData,
} from '../adapters';
import PricingTable from '../components/PricingTable';

export interface PricingContainerView {
	status: 'empty' | 'ready';
	/** Currency + billing-period selectors — place in page header chrome when using `children`. */
	filters: ReactNode;
	/** Empty state or the pricing grid (filters hidden when `children` owns them). */
	content: ReactNode;
}

export interface PricingContainerProps {
	/** Invoked when a plan CTA is clicked. Consumers wire their own navigation / checkout. */
	onSelectPlan?: (planId: string) => void;
	/** Optional link target for a feature name; return undefined for plain text (default). */
	getFeatureHref?: (featureId: string) => string | undefined;
	/** Rendered when there are no published plans at all. */
	renderEmpty?: () => ReactNode;
	/** Called once when any of the underlying queries error (e.g. to toast). */
	onError?: () => void;
	className?: string;
	/**
	 * Optional layout override. When provided, filters are not rendered inline — the caller
	 * places `view.filters` (e.g. in `Page` `headingCTA`). Loading/error still short-circuit
	 * before this runs (Loader / null), matching the prior dashboard page behavior.
	 */
	children?: (view: PricingContainerView) => ReactNode;
}

/**
 * Data-connected pricing widget for the dashboard: fetches plans/prices/entitlements/grants,
 * derives currency + billing-period options, adapts everything to presentational `Plan`s, and
 * renders the prop-only {@link PricingTable}. This is the single source of truth the dashboard
 * and (later) external consumers both build on.
 */
const PricingContainer: FC<PricingContainerProps> = ({ onSelectPlan, getFeatureHref, renderEmpty, onError, className, children }) => {
	const { t } = useTranslation(['catalog']);
	const [selectedBillingPeriod, setSelectedBillingPeriod] = useState('');
	const [selectedCurrency, setSelectedCurrency] = useState('');

	const { plansData, allPrices, allEntitlements, creditGrants, isLoading, isError } = usePricingData();

	// Merge each plan with its prices + entitlements.
	const plansWithData: PlanWithData[] = useMemo(() => {
		if (!plansData?.items) return [];
		return plansData.items.map((plan) => ({
			...plan,
			prices: allPrices.filter((price) => price.entity_id === plan.id),
			entitlements: allEntitlements.filter((ent) => ent.entity_id === plan.id),
		}));
	}, [plansData, allPrices, allEntitlements]);

	const grantsByPlanId = useMemo(() => {
		const map = new Map<string, CreditGrant[]>();
		for (const grant of creditGrants) {
			const planId = grantPlanId(grant, '');
			if (!planId) continue;
			const list = map.get(planId) ?? [];
			list.push(grant);
			map.set(planId, list);
		}
		return map;
	}, [creditGrants]);

	const { availableCurrencyOptions, availablePeriodOptions } = useMemo(
		() => deriveCurrencyPeriodOptions(plansWithData, selectedCurrency, selectedBillingPeriod),
		[plansWithData, selectedCurrency, selectedBillingPeriod],
	);

	// Default the selectors to the combination that shows the most plans (once data lands).
	useEffect(() => {
		if (plansWithData.length === 0) return;
		if (selectedCurrency && selectedBillingPeriod) return;
		const best = findBestPriceCombination(plansWithData, availableCurrencyOptions, availablePeriodOptions);
		if (best.currency && !selectedCurrency) setSelectedCurrency(best.currency);
		if (best.period && !selectedBillingPeriod) setSelectedBillingPeriod(best.period);
	}, [plansWithData, availableCurrencyOptions, availablePeriodOptions, selectedCurrency, selectedBillingPeriod]);

	const plans = useMemo(() => {
		const filtered = filterAndSortPlans(plansWithData, selectedCurrency, selectedBillingPeriod);
		return filtered.map((plan) => adaptPlanToCard(plan, grantsByPlanId.get(plan.id) ?? []));
	}, [plansWithData, selectedCurrency, selectedBillingPeriod, grantsByPlanId]);

	// Report each error episode exactly once — even if `onError`'s identity changes (e.g. an inline
	// arrow re-created every render) while `isError` stays true. The ref resets when the error
	// clears, so a later, distinct error episode is reported again.
	const errorReportedRef = useRef(false);
	useEffect(() => {
		if (isError) {
			if (!errorReportedRef.current) {
				errorReportedRef.current = true;
				onError?.();
			}
		} else {
			errorReportedRef.current = false;
		}
	}, [isError, onError]);

	const filters = (
		<div className='flex w-full justify-start gap-4'>
			<Select
				className='w-40 !rounded-xl'
				value={selectedBillingPeriod}
				options={availablePeriodOptions}
				onChange={setSelectedBillingPeriod}
				placeholder={t('catalog:plans.pricing.selectBillingPeriod')}
			/>
			<Select
				className='w-40 !rounded-xl'
				value={selectedCurrency}
				options={availableCurrencyOptions}
				onChange={setSelectedCurrency}
				placeholder={t('catalog:plans.pricing.selectCurrency')}
			/>
		</div>
	);

	if (isLoading) return <Loader />;
	if (isError) return null;

	const isEmpty = (plansData?.items ?? []).length === 0;
	const hideInlineFilters = typeof children === 'function';

	const content = isEmpty ? (
		<>{renderEmpty?.()}</>
	) : (
		<PricingTable
			className={className}
			plans={plans}
			billingPeriod={selectedBillingPeriod}
			onBillingPeriodChange={setSelectedBillingPeriod}
			billingPeriodOptions={availablePeriodOptions}
			currency={selectedCurrency}
			onCurrencyChange={setSelectedCurrency}
			currencyOptions={availableCurrencyOptions}
			onSelectPlan={onSelectPlan}
			getFeatureHref={getFeatureHref}
			hideFilters={hideInlineFilters}
		/>
	);

	if (children) {
		// eslint-disable-next-line i18next/no-literal-string -- internal status discriminant, not UI text
		return <>{children({ status: isEmpty ? 'empty' : 'ready', filters, content })}</>;
	}

	return content;
};

export default PricingContainer;
