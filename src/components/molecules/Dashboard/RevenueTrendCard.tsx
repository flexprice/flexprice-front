'use client';

import { useState, useMemo, useEffect } from 'react';
import { Loader, Select } from '@/components/atoms';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getTypographyClass } from '@/lib/typography';
import { Info } from 'lucide-react';
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
	// Extract unique currencies from revenue data
	const availableCurrencies = useMemo(() => {
		const currencies = new Set<string>();
		revenueData.forEach((item) => {
			if (item.currency) {
				currencies.add(item.currency);
			}
		});
		return Array.from(currencies).sort();
	}, [revenueData]);

	// Create currency options from available currencies
	const currencySelectOptions = useMemo(() => {
		return availableCurrencies.map((currency) => {
			const currencyOption = currencyOptions.find((opt) => opt.value === currency);
			return {
				value: currency,
				label: currencyOption?.label || currency,
			};
		});
	}, [availableCurrencies]);

	// State for selected currency
	const [selectedCurrency, setSelectedCurrency] = useState<string>('');

	// Filter revenue data by selected currency
	const filteredRevenueData = useMemo(() => {
		if (!selectedCurrency) return [];
		return revenueData.filter((item) => item.currency === selectedCurrency);
	}, [revenueData, selectedCurrency]);

	// Auto-select first currency when data loads
	useEffect(() => {
		if (availableCurrencies.length > 0 && !selectedCurrency) {
			setSelectedCurrency(availableCurrencies[0]);
		}
	}, [availableCurrencies, selectedCurrency]);

	return (
		<Card className={`shadow-sm ${className || ''}`}>
			<CardHeader className='pb-2'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
					<div className='flex items-center gap-2'>
						<CardTitle className={getTypographyClass('section-title', 'font-medium')}>Revenue Trend</CardTitle>
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger className='cursor-pointer'>
									<Info className='h-4 w-4 text-zinc-400 hover:text-zinc-600 transition-colors duration-150' />
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
			<CardContent className='pt-0 pb-5'>
				{isLoading ? (
					<div className='flex items-center justify-center py-4 px-6'>
						<Loader />
					</div>
				) : !selectedCurrency ? (
					<p className={getTypographyClass('body-small', 'text-center text-zinc-500 py-6 px-6')}>Please select a currency</p>
				) : filteredRevenueData && filteredRevenueData.length > 0 ? (
					<div>
						{filteredRevenueData.map((month, index) => {
							const isLast = index === filteredRevenueData.length - 1;
							return (
								<div
									key={index}
									className={`flex items-center justify-between px-6 ${isLast ? 'pt-3 pb-0' : 'py-3 border-b border-zinc-100'}`}>
									<div className='flex-1'>
										<p className={getTypographyClass('body-default', 'font-medium text-zinc-900')}>{month.month}</p>
									</div>
									<div className='text-right'>
										<p className={`text-lg font-semibold ${month.revenue === 0 ? 'text-zinc-400' : 'text-zinc-900'}`}>
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
							);
						})}
					</div>
				) : (
					<p className={getTypographyClass('body-small', 'text-center text-zinc-500 py-6 px-6')}>
						No revenue data available for selected currency
					</p>
				)}
			</CardContent>
		</Card>
	);
};

export default RevenueTrendCard;
