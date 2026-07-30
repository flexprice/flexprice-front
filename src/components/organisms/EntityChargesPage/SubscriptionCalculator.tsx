import React, { useEffect, useMemo, useState } from 'react';
import { Card, Input, Select, Button } from '@/components/atoms';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { useTranslation } from 'react-i18next';

/** Month-equivalent for each billing period (used for conversion calculations) */
export const PLAN_PERIOD_MONTHS = {
	DAILY: 1 / 30,
	WEEKLY: 0.25, // 1 month = 4 weeks
	MONTHLY: 1,
	QUARTERLY: 3,
	HALF_YEARLY: 6,
	ANNUAL: 12,
} as const;

export type ContractTermValue = keyof typeof PLAN_PERIOD_MONTHS;

/** Period options for contract terms (target display period), in display order */
export const CONTRACT_TERM_ORDER: ContractTermValue[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL'];

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
	const { t } = useTranslation('catalog');
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
	const termMonths = PLAN_PERIOD_MONTHS[contractTerms] ?? PLAN_PERIOD_MONTHS.MONTHLY;

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
	const selectOptions = CONTRACT_TERM_ORDER.map((value) => ({
		label: t(`entityChargesPage.subscriptionCalculator.periodLabels.${value}`),
		value,
	}));

	const planPeriodSuffix = t(`entityChargesPage.subscriptionCalculator.perPlanPeriodSuffix.${planPeriod}`);

	return (
		<div className={className}>
			<div className='space-y-4'>
				<Input
					label={t('entityChargesPage.subscriptionCalculator.contractAmount')}
					placeholder='0'
					value={amountStr}
					onChange={setAmountStr}
					variant='formatted-number'
					inputPrefix={<span className='text-muted-foreground'>{currencySymbol}</span>}
				/>
				<Select
					label={t('entityChargesPage.subscriptionCalculator.contractTerm')}
					value={contractTerms}
					options={selectOptions}
					onChange={(value) => setContractTerms(value as ContractTermValue)}
					contentClassName='z-[200]'
				/>
				{amountNum != null && amountNum > 0 && (
					<div className='rounded-md border border-gray-200 bg-gray-50/80 p-4 space-y-2'>
						{displayValue != null && (
							<p className='text-sm'>
								<span className='font-medium text-gray-900'>{t('entityChargesPage.subscriptionCalculator.displayAmount')}</span>{' '}
								<span className='font-semibold text-gray-900'>
									{currencySymbol}
									{displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</span>
								<span className='text-gray-600'>{planPeriodSuffix}</span>
							</p>
						)}
					</div>
				)}
				{amountNum == null && amountStr.trim() !== '' && (
					<p className='text-sm text-amber-600'>{t('entityChargesPage.subscriptionCalculator.invalidAmountHint')}</p>
				)}
				{onApply && displayValue != null && (
					<div className='mt-4 flex justify-end'>
						<Button type='button' onClick={() => onApply(displayValue.toFixed(2), contractTerms)}>
							{t('entityChargesPage.subscriptionCalculator.confirmApply')}
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
