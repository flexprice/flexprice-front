import React, { useEffect, useMemo, useState } from 'react';
import { Input, Select, Button } from '@/components/atoms';
import { getCurrencySymbol } from '@/utils/common/helper_functions';

/** Month-equivalent for each period (used for conversion) */
const PERIOD_MONTHS: Record<string, number> = {
	DAILY: 1 / 30,
	WEEKLY: 0.25,
	MONTHLY: 1,
	QUARTERLY: 3,
	HALF_YEARLY: 6,
	ANNUAL: 12,
};

const CONTRACT_TERM_OPTIONS = [
	{ label: 'Daily', value: 'DAILY' },
	{ label: 'Weekly', value: 'WEEKLY' },
	{ label: 'Monthly', value: 'MONTHLY' },
	{ label: 'Quarterly', value: 'QUARTERLY' },
	{ label: 'Half-Yearly', value: 'HALF_YEARLY' },
	{ label: 'Annual', value: 'ANNUAL' },
] as const;

export type ContractTermValue = (typeof CONTRACT_TERM_OPTIONS)[number]['value'];

export interface SubscriptionCalculatorContentProps {
	currency?: string;
	initialAmount?: string;
	initialContractTerms?: ContractTermValue;
	planPeriod?: ContractTermValue;
	className?: string;
	onApply?: (displayAmount: string, contractTerms: ContractTermValue) => void;
}

/**
 * Calculator: contract amount (in plan period) → display value in contract term.
 * displayAmount = contractAmount * (contractTermMonths / planPeriodMonths)
 */
export const SubscriptionCalculatorContent: React.FC<SubscriptionCalculatorContentProps> = ({
	currency = 'USD',
	initialAmount = '',
	initialContractTerms = 'ANNUAL',
	planPeriod = 'ANNUAL',
	className,
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

	const planMonths = PERIOD_MONTHS[planPeriod] ?? 12;
	const termMonths = PERIOD_MONTHS[contractTerms] ?? 12;
	const displayNum = amountNum != null && planMonths > 0 ? (amountNum * termMonths) / planMonths : null;
	const symbol = getCurrencySymbol(currency);
	const displayText = displayNum != null ? `${symbol}${displayNum.toFixed(2)}` : '—';

	return (
		<div className={className}>
			<h3 className='text-sm font-semibold text-zinc-900 mb-3'>Subscription duration calculator</h3>
			<div className='space-y-3'>
				<div>
					<label className='block text-sm font-medium text-zinc-700 mb-1'>Contract amount</label>
					<Input value={amountStr} onChange={(value) => setAmountStr(value)} placeholder={`${symbol} 0`} inputPrefix={symbol} />
				</div>
				<div>
					<label className='block text-sm font-medium text-zinc-700 mb-1'>Contract terms</label>
					<Select
						value={contractTerms}
						onChange={(value) => setContractTerms(value as ContractTermValue)}
						options={CONTRACT_TERM_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
						placeholder='Select'
					/>
				</div>
				{amountNum != null && amountNum > 0 && (
					<div>
						<label className='block text-sm font-medium text-zinc-700 mb-1'>Display amount</label>
						<p className='text-sm text-zinc-900'>
							{displayText} (per {contractTerms.toLowerCase()})
						</p>
					</div>
				)}
				{onApply && (
					<div className='flex justify-end pt-2'>
						<Button
							type='button'
							variant='default'
							onClick={() => {
								const value = displayNum != null ? displayNum.toFixed(2) : amountStr || '0';
								onApply(value, contractTerms);
							}}>
							OK
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};
