import { useState, useCallback, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Coins, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import PriceUnitApi from '@/api/PriceUnitApi';
import { ENTITY_STATUS } from '@/models/base';
import { PRICE_UNIT_TYPE } from '@/models/Price';
import { currencyOptions } from '@/constants/constants';

export interface CurrencyOption {
	value: string;
	label: string;
	symbol?: string;
	currencyType: 'fiat' | 'custom';
	priceUnitId?: string;
	extras?: Record<string, any>;
}

export interface CurrencySelectorProps {
	value?: string;
	onChange?: (value: string, option?: CurrencyOption) => void;
	placeholder?: string;
	emptyText?: string;
	searchPlaceholder?: string;
	className?: string;
	triggerClassName?: string;
	contentClassName?: string;
	disabled?: boolean;
	width?: number | string;
	maxHeight?: number | string;
	onOpenChange?: (open: boolean) => void;
	label?: string;
	error?: string;
}

const CurrencySelector = ({
	value,
	onChange,
	placeholder = 'Select currency',
	emptyText = 'No currencies found.',
	searchPlaceholder = 'Search currencies...',
	triggerClassName,
	contentClassName,
	disabled = false,
	width = 200,
	maxHeight = 300,
	onOpenChange,
	label,
	error,
}: CurrencySelectorProps) => {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	// Fetch published pricing units
	const { data: priceUnitsData } = useQuery({
		queryKey: ['published-price-units'],
		queryFn: async () => {
			return await PriceUnitApi.list({
				limit: 1000,
				filters: [
					{
						field: 'status',
						operator: 'in',
						data_type: 'array',
						value: {
							array: [ENTITY_STATUS.PUBLISHED],
						},
					},
				],
			});
		},
	});

	// Transform pricing units to currency options
	const customCurrencyOptions = useMemo(() => {
		if (!priceUnitsData?.items) return [];

		return priceUnitsData.items.map((unit) => ({
			value: unit.code,
			label: `${unit.name} (${unit.code})`,
			symbol: unit.symbol,
			currencyType: 'custom' as const,
			priceUnitId: unit.id,
			extras: {
				priceUnitId: unit.id,
				baseCurrency: unit.base_currency,
				conversionRate: unit.conversion_rate,
				precision: unit.precision,
			},
		}));
	}, [priceUnitsData]);

	// Transform fiat currencies to currency options
	const fiatCurrencyOptions = useMemo(() => {
		return currencyOptions.map((currency) => ({
			value: currency.value,
			label: `${currency.label.toUpperCase()} (${currency.symbol})`,
			symbol: currency.symbol,
			currencyType: 'fiat' as const,
			extras: {
				priceUnitType: PRICE_UNIT_TYPE.FIAT,
			},
		}));
	}, []);

	// Combine all options
	const allOptions = useMemo(() => {
		return [...fiatCurrencyOptions, ...customCurrencyOptions];
	}, [fiatCurrencyOptions, customCurrencyOptions]);

	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			setOpen(newOpen);
			onOpenChange?.(newOpen);
			if (!newOpen) {
				// Reset search when closing
				setSearchQuery('');
			}
		},
		[onOpenChange],
	);

	const filteredOptions = useMemo(() => {
		if (!searchQuery) return allOptions;

		const lowerQuery = searchQuery.toLowerCase();
		return allOptions.filter(
			(option) =>
				option.label.toLowerCase().includes(lowerQuery) ||
				option.value.toLowerCase().includes(lowerQuery) ||
				option.symbol?.toLowerCase().includes(lowerQuery),
		);
	}, [allOptions, searchQuery]);

	const selectedOption = useMemo(() => allOptions.find((option) => option.value === value), [allOptions, value]);

	const handleSelect = useCallback(
		(currentValue: string) => {
			const option = allOptions.find((opt) => opt.value === currentValue);
			onChange?.(currentValue, option);
			setOpen(false);
			setSearchQuery('');
		},
		[onChange, allOptions],
	);

	const renderOption = useCallback(
		(option: CurrencyOption) => (
			<div className='flex items-center gap-2'>
				<Check className={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
				<div className='flex items-center gap-2'>
					{option.currencyType === 'fiat' ? <DollarSign className='h-4 w-4 text-green-600' /> : <Coins className='h-4 w-4 text-blue-600' />}
					<span>{option.label}</span>
				</div>
			</div>
		),
		[value],
	);

	return (
		<div className={cn('space-y-1')}>
			{/* Label */}
			{label && (
				<label className={cn('block text-sm font-medium text-zinc break-words', disabled ? 'text-zinc-500' : 'text-zinc-950')}>
					{label}
				</label>
			)}

			<Popover open={open} onOpenChange={handleOpenChange}>
				<PopoverTrigger className={cn(triggerClassName)} asChild>
					<Button
						variant='outline'
						size='sm'
						role='combobox'
						aria-expanded={open}
						disabled={disabled}
						className={cn('justify-between w-full', typeof width === 'number' ? `w-[${width}px]` : `w-[${width}]`, triggerClassName)}>
						<div className='flex items-center gap-2'>
							{selectedOption && (
								<>
									{selectedOption.currencyType === 'fiat' ? (
										<DollarSign className='h-4 w-4 text-green-600' />
									) : (
										<Coins className='h-4 w-4 text-blue-600' />
									)}
									<span className='font-normal'>{selectedOption.label}</span>
								</>
							)}
							{!selectedOption && <span className='font-normal text-muted-foreground'>{placeholder}</span>}
						</div>
						<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className={cn('p-0', contentClassName)}
					style={{
						width: typeof width === 'number' ? `${width}px` : width,
					}}>
					<Command>
						<CommandInput placeholder={searchPlaceholder} value={searchQuery} onValueChange={setSearchQuery} />
						<CommandList style={{ maxHeight }}>
							<CommandEmpty>{emptyText}</CommandEmpty>
							<CommandGroup>
								{/* Fiat Currencies Section */}
								{filteredOptions.some((opt) => opt.currencyType === 'fiat') && (
									<>
										<div className='px-2 py-1.5 text-sm font-medium text-muted-foreground'>Fiat Currencies</div>
										{filteredOptions
											.filter((opt) => opt.currencyType === 'fiat')
											.map((option) => (
												<CommandItem key={option.value} value={option.value} onSelect={handleSelect}>
													{renderOption(option)}
												</CommandItem>
											))}
									</>
								)}

								{/* Custom Pricing Units Section */}
								{filteredOptions.some((opt) => opt.currencyType === 'custom') && (
									<>
										<div className='px-2 py-1.5 text-sm font-medium text-muted-foreground'>Custom Pricing Units</div>
										{filteredOptions
											.filter((opt) => opt.currencyType === 'custom')
											.map((option) => (
												<CommandItem key={option.value} value={option.value} onSelect={handleSelect}>
													{renderOption(option)}
												</CommandItem>
											))}
									</>
								)}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{/* Error Message */}
			{error && <p className='text-sm text-destructive break-words'>{error}</p>}
		</div>
	);
};

export default CurrencySelector;
