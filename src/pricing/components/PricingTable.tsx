import { FC, useMemo } from 'react';
import Select from '@/components/atoms/Select/Select';
import PricingCard from '@/components/molecules/PricingCard/PricingCard';
import { cn } from '@/lib/utils';
import type { PricingTableProps } from '../types';
import { normalizePlans } from '../schema';

/**
 * Prop-only pricing grid — no fetching, no auth, no routing. Renders the currency /
 * billing-period selectors and a responsive grid of {@link PricingCard}s. Consumers supply
 * already-filtered `plans` plus controlled selector state and callbacks.
 */
const PricingTable: FC<PricingTableProps> = ({
	plans,
	billingPeriod,
	onBillingPeriodChange,
	billingPeriodOptions,
	billingPeriodPlaceholder = 'Select billing period',
	currency,
	onCurrencyChange,
	currencyOptions,
	currencyPlaceholder = 'Select currency',
	onSelectPlan,
	getFeatureHref,
	hideFilters = false,
	onValidationError,
	className,
}) => {
	// Validate/normalize at the boundary so wrong-format SDK input degrades (bad plans dropped,
	// missing fields defaulted) instead of crashing the renderer. Idempotent for trusted data.
	const safePlans = useMemo(() => normalizePlans(plans, onValidationError), [plans, onValidationError]);

	return (
		<div className={cn('flexprice-ui', 'flex flex-col gap-6', className)}>
			{!hideFilters && (
				<div className='flex w-full justify-start gap-4'>
					<Select
						className='w-40 !rounded-xl'
						value={billingPeriod}
						options={billingPeriodOptions}
						onChange={onBillingPeriodChange}
						placeholder={billingPeriodPlaceholder}
					/>
					<Select
						className='w-40 !rounded-xl'
						value={currency}
						options={currencyOptions}
						onChange={onCurrencyChange}
						placeholder={currencyPlaceholder}
					/>
				</div>
			)}

			<div
				className={cn(
					'grid w-full items-start justify-items-stretch gap-6 md:gap-8',
					safePlans.length === 1
						? 'mx-auto max-w-sm grid-cols-1'
						: safePlans.length === 2
							? 'mx-auto max-w-2xl grid-cols-1 sm:grid-cols-2'
							: 'mx-auto max-w-[1080px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
				)}>
				{safePlans.map((plan, index) => (
					<PricingCard
						key={plan.id || index}
						{...plan}
						className='w-full'
						useModernChrome
						onSelectPlan={onSelectPlan}
						getFeatureHref={getFeatureHref}
					/>
				))}
			</div>
		</div>
	);
};

export default PricingTable;
