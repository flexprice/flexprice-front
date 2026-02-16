import React, { useEffect, useMemo, useState } from 'react';
import { Card, Input, Select, Button } from '@/components/atoms';
import { getCurrencySymbol } from '@/utils/common/helper_functions';

/** Month-equivalent for each billing period (used for conversion calculations) */
const PERIOD_MONTHS: Record<string, number> = {
	DAILY: 1 / 30,
	WEEKLY: 0.25, // 1 month = 4 weeks
	MONTHLY: 1,
	QUARTERLY: 3,
	HALF_YEARLY: 6,
	ANNUAL: 12,
};

/** Period options for contract terms (target display period) */
export const CONTRACT_TERM_OPTIONS = [
	{ label: 'Daily', value: 'DAILY', months: PERIOD_MONTHS.DAILY },
	{ label: 'Weekly', value: 'WEEKLY', months: PERIOD_MONTHS.WEEKLY },
	{ label: 'Monthly', value: 'MONTHLY', months: PERIOD_MONTHS.MONTHLY },
	{ label: 'Quarterly', value: 'QUARTERLY', months: PERIOD_MONTHS.QUARTERLY },
	{ label: 'Half-Yearly', value: 'HALF_YEARLY', months: PERIOD_MONTHS.HALF_YEARLY },
	{ label: 'Annual', value: 'ANNUAL', months: PERIOD_MONTHS.ANNUAL },
] as const;

export type ContractTermValue = (typeof CONTRACT_TERM_OPTIONS)[number]['value'];

/** Period in months for plan period (billing period) — re-export for convenience */
export const PLAN_PERIOD_MONTHS: Record<string, number> = PERIOD_MONTHS;

interface SubscriptionCalculatorProps {
	currency?: string;
	initialAnnualAmount?: string;
	className?: string;
}

export interface SubscriptionCalculatorContentProps {
	/** Currency code for display (e.g. USD). */
	currency?: string;
	/** Initial contract amount (e.g. from Price field). */
	initialAmount?: string;
	/** Initial contract terms (target period, e.g. Monthly). */
	initialContractTerms?: ContractTermValue;
	/** Plan period (billing period) – the period the amount is currently in (e.g. Annual = amount is per year). */
	planPeriod?: ContractTermValue;
	className?: string;
	/** When provided, shows OK button; called with display amount string and selected contract terms when OK is pressed. */
	onApply?: (displayAmount: string, contractTerms: ContractTermValue) => void;
}

/**
 * Calculator: Contract amount (in plan period) → display value in contract term.
 * e.g. Billing period = Annual, Contract term = Monthly → price = amount / 12.
 */
export const SubscriptionCalculatorContent: React.FC<SubscriptionCalculatorContentProps> = ({
	currency = 'USD',
	initialAmount = '',
	initialContractTerms = 'ANNUAL',
	className,
	planPeriod = 'ANNUAL',
	onApply,
}) => {
	const [amountStr, setAmountStr] = useState(initialAmount);
	const [contractTerms, setContractTerms] = useState<ContractTermValue>(initialContractTerms);

	useEffect(() => {
		if (initialAmount?.trim() !== '') setAmountStr(initialAmount);
	}, [initialAmount]);
	useEffect(() => {
		if (initialContractTerms) setContractTerms(initialContractTerms);
	}, [initialContractTerms]);

	const amountNum = useMemo(() => {
		const cleaned = amountStr.replace(/,/g, '').trim();
		const n = parseFloat(cleaned);
		return Number.isFinite(n) && n >= 0 ? n : null;
	}, [amountStr]);

	const planMonths = PLAN_PERIOD_MONTHS[planPeriod] ?? 12;
	const termOption = useMemo(
		() => CONTRACT_TERM_OPTIONS.find((o) => o.value === contractTerms) ?? CONTRACT_TERM_OPTIONS[0],
		[contractTerms],
	);
	const termMonths = termOption.months;

	/**
	 * Convert Contract Amount to Plan Price (Billing Amount).
	 * Formula: amount * (planMonths / termMonths)
	 * e.g. Contract=Annual($1200) -> Plan=Monthly: 1200 * (1/12) = 100
	 * e.g. Contract=Weekly($100) -> Plan=Monthly: 100 * (1/0.25) = 400
	 */
	const displayValue = useMemo(() => {
		if (amountNum == null || termMonths <= 0) return null;
		return amountNum * (planMonths / termMonths);
	}, [amountNum, planMonths, termMonths]);

	const currencySymbol = getCurrencySymbol(currency);
	const selectOptions = CONTRACT_TERM_OPTIONS.map((o) => ({ label: o.label, value: o.value }));

	return (
		<div className={className}>
			<div className='space-y-4'>
				<Input
					label='Contract Amount'
					placeholder='0'
					value={amountStr}
					onChange={setAmountStr}
					variant='formatted-number'
					inputPrefix={<span className='text-muted-foreground'>{currencySymbol}</span>}
				/>
				<Select
					label='Contract Term'
					value={contractTerms}
					options={selectOptions}
					onChange={(value) => setContractTerms(value as ContractTermValue)}
					contentClassName='z-[200]'
				/>
				{amountNum != null && amountNum > 0 && (
					<div className='rounded-md border border-gray-200 bg-gray-50/80 p-4 space-y-2'>
						{displayValue != null && (
							<p className='text-sm'>
								<span className='font-medium text-gray-900'>Display amount:</span>{' '}
								<span className='font-semibold text-gray-900'>
									{currencySymbol}
									{displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</span>
								<span className='text-gray-600'>
									{planPeriod === 'DAILY' && ' (per day)'}
									{planPeriod === 'WEEKLY' && ' (per week)'}
									{planPeriod === 'MONTHLY' && ' (per month)'}
									{planPeriod === 'QUARTERLY' && ' (per quarter)'}
									{planPeriod === 'HALF_YEARLY' && ' (per half-year)'}
									{planPeriod === 'ANNUAL' && ' (per year)'}
								</span>
							</p>
						)}
					</div>
				)}
				{amountNum == null && amountStr.trim() !== '' && (
					<p className='text-sm text-amber-600'>Enter a valid contract amount to see the calculation.</p>
				)}
				{onApply && displayValue != null && (
					<div className='mt-4 flex justify-end'>
						<Button type='button' onClick={() => onApply(displayValue.toFixed(2), contractTerms)}>
							OK
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};

/**
 * Calculator: Contract amount (in plan period) → display value in selected contract term.
 */
const SubscriptionCalculator: React.FC<SubscriptionCalculatorProps> = ({ currency = 'USD', initialAnnualAmount = '', className }) => (
	<Card variant='bordered' className={className}>
		<div className='pt-1'>
			<SubscriptionCalculatorContent
				currency={currency}
				initialAmount={initialAnnualAmount}
				initialContractTerms='ANNUAL'
				planPeriod='ANNUAL'
			/>
		</div>
	</Card>
);

export default SubscriptionCalculator;
