'use client';

import { useState, useMemo, useEffect } from 'react';
import { Loader, Select } from '@/components/atoms';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getTypographyClass } from '@/lib/typography';
import { cn } from '@/lib/utils';
import { Info, TrendingUp, BarChart } from 'lucide-react';
import { currencyOptions } from '@/constants/constants';

interface RevenueMonth {
	month: string;
	revenue: number;
	currency: string;
}

interface RevenueTrendCardProps {
	revenueData: RevenueMonth[];
	isLoading: boolean;
	className?: string;
}

export const RevenueTrendCard: React.FC<RevenueTrendCardProps> = ({ revenueData, isLoading, className }) => {
	// Combine currency extraction and option creation in single computation
	const currencySelectOptions = useMemo(() => {
		const currencies = new Set<string>();
		revenueData.forEach((item) => {
			if (item.currency) {
				currencies.add(item.currency);
			}
		});
		return Array.from(currencies)
			.sort()
			.map((currency) => {
				const currencyOption = currencyOptions.find((opt) => opt.value === currency);
				return {
					value: currency,
					label: currencyOption?.label || currency,
				};
			});
	}, [revenueData]);

	// Compute first available currency for auto-selection
	const firstCurrency = useMemo(() => currencySelectOptions[0]?.value ?? '', [currencySelectOptions]);

	// State for selected currency
	const [selectedCurrency, setSelectedCurrency] = useState<string>('');

	// Auto-select first currency when options become available
	useEffect(() => {
		if (firstCurrency && !selectedCurrency) {
			setSelectedCurrency(firstCurrency);
		}
	}, [firstCurrency, selectedCurrency]);

	// Filter revenue data by selected currency
	const filteredRevenueData = useMemo(() => {
		if (!selectedCurrency) return [];
		return revenueData.filter((item) => item.currency === selectedCurrency);
	}, [revenueData, selectedCurrency]);

	return (
		<Card className={cn('shadow-sm', className)}>
			<CardHeader className='pb-8'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
					<div className='flex items-center gap-2'>
						<CardTitle className={getTypographyClass('section-title', 'font-medium')}>Revenue Trend</CardTitle>
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger className='cursor-pointer'>
									<Info className='h-4 w-4 text-zinc-400 hover:text-zinc-600 transition-colors' />
								</TooltipTrigger>
								<TooltipContent sideOffset={5} className='bg-zinc-900 text-xs text-white px-3 py-1.5 rounded-lg max-w-[250px]'>
									Total revenue from paid invoices for the selected currency in each time period
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					{currencySelectOptions.length > 0 && (
						<div className='w-full sm:w-auto min-w-[120px]'>
							<Select
								value={selectedCurrency}
								options={currencySelectOptions}
								onChange={setSelectedCurrency}
								placeholder='Select currency'
								disabled={isLoading}
							/>
						</div>
					)}
				</div>
				<CardDescription className={getTypographyClass('helper-text', 'mt-1')}>Last 3 months</CardDescription>
			</CardHeader>
			<CardContent className='pt-0'>
				{isLoading ? (
					<div className='flex items-center justify-center py-8'>
						<Loader />
					</div>
				) : revenueData.length === 0 ? (
					<div className='flex flex-col items-center py-6'>
						<TrendingUp className='w-8 h-8 text-zinc-300 mb-3' />
						<p className={getTypographyClass('body-small', 'text-center text-zinc-400')}>No revenue data available</p>
					</div>
				) : filteredRevenueData.length > 0 ? (
					<div>
						{filteredRevenueData.map((month, index) => (
							<div
								key={index}
								className={cn(
									'flex items-center justify-between px-6',
									index === filteredRevenueData.length - 1 ? 'py-4 pb-0' : 'py-4 border-b border-zinc-100',
								)}>
								<div className='flex-1'>
									<p className={getTypographyClass('body-default', 'font-medium text-zinc-900')}>{month.month}</p>
								</div>
								<div className='text-right'>
									<p
										className={cn(
											getTypographyClass('body-default', 'font-medium'),
											month.revenue === 0 ? 'text-zinc-400' : 'text-zinc-900',
										)}>
										{month.revenue === 0
											? '--'
											: new Intl.NumberFormat('en-US', {
													style: 'currency',
													currency: month.currency,
													minimumFractionDigits: 0,
													maximumFractionDigits: 0,
												}).format(month.revenue)}
									</p>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className='flex flex-col items-center py-6'>
						<BarChart className='w-8 h-8 text-zinc-300 mb-3' />
						<p className={getTypographyClass('body-small', 'text-center text-zinc-400')}>No revenue data available for selected currency</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default RevenueTrendCard;
