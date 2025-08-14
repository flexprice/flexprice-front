import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Coins, DollarSign, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import PriceUnitApi from '@/api/PriceUnitApi';
import { PRICE_UNIT_TYPE } from '@/models/Price';
import { currencyOptions } from '@/constants/constants';
import { ENTITY_STATUS } from '@/models/base';
import SearchableSelect, { SelectOption } from '@/components/atoms/Select/SearchableSelect';

export interface CurrencyOption {
	value: string;
	label: string;
	symbol?: string;
	currencyType: PRICE_UNIT_TYPE;
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
	disabled?: boolean;
	maxHeight?: number;
	label?: string;
	error?: string;
}

const CurrencySelector = ({
	value,
	onChange,
	placeholder = 'Select currency',
	emptyText = 'No currencies found.',
	searchPlaceholder = 'Search currencies...',
	className,
	triggerClassName,
	disabled = false,
	maxHeight = 300,
	label,
	error,
}: CurrencySelectorProps) => {
	// Fetch published pricing units
	const { data: priceUnitsData } = useQuery({
		queryKey: ['published-price-units'],
		queryFn: async () => {
			return await PriceUnitApi.list({
				limit: 1000,
				status: ENTITY_STATUS.PUBLISHED,
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
			currencyType: PRICE_UNIT_TYPE.CUSTOM,
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
			currencyType: PRICE_UNIT_TYPE.FIAT,
			extras: {
				priceUnitType: PRICE_UNIT_TYPE.FIAT,
			},
		}));
	}, []);

	// Combine all options and transform to SelectOption format
	const allOptions = useMemo(() => {
		const fiatOptions: SelectOption[] = fiatCurrencyOptions.map((currency) => ({
			value: currency.value,
			label: currency.label,
			prefixIcon: <DollarSign className='h-4 w-4 text-green-600' />,
			extras: currency.extras,
		}));

		const customOptions: SelectOption[] = customCurrencyOptions.map((currency) => ({
			value: currency.value,
			label: currency.label,
			prefixIcon: <Coins className='h-4 w-4 text-blue-600' />,
			extras: currency.extras,
		}));

		return [...customOptions, ...fiatOptions];
	}, [fiatCurrencyOptions, customCurrencyOptions]);

	// Create grouped options with section headers
	const groupedOptions = useMemo(() => {
		const fiatSection =
			fiatCurrencyOptions.length > 0
				? [
						{ value: 'fiat-header', label: 'Fiat Currencies', disabled: true, isHeader: true } as SelectOption,
						...fiatCurrencyOptions.map((currency) => ({
							value: currency.value,
							label: currency.label,
							prefixIcon: <DollarSign className='h-4 w-4 text-green-600' />,
							extras: currency.extras,
						})),
					]
				: [];

		const customSection =
			customCurrencyOptions.length > 0
				? [
						{ value: 'custom-header', label: 'Custom Pricing Units', disabled: true, isHeader: true } as SelectOption,
						...customCurrencyOptions.map((currency) => ({
							value: currency.value,
							label: currency.label,
							prefixIcon: <Coins className='h-4 w-4 text-blue-600' />,
							extras: currency.extras,
						})),
					]
				: [];

		return [...customSection, ...fiatSection];
	}, [fiatCurrencyOptions, customCurrencyOptions]);

	const handleChange = (selectedValue: string) => {
		const fiatOption = fiatCurrencyOptions.find((opt) => opt.value === selectedValue);
		const customOption = customCurrencyOptions.find((opt) => opt.value === selectedValue);
		const option = fiatOption || customOption;
		onChange?.(selectedValue, option);
	};

	// Find the selected option for display
	const selectedOption = useMemo(() => allOptions.find((opt) => opt.value === value), [value, allOptions]);

	// Custom trigger to show currency icons with chevron
	const customTrigger = useMemo(() => {
		return (
			<>
				<div className='flex items-center gap-2'>
					{selectedOption?.prefixIcon}
					<span className={cn('truncate', selectedOption ? '' : 'text-muted-foreground')}>{selectedOption?.label || placeholder}</span>
				</div>
				<ChevronDown className='h-4 w-4 opacity-50' />
			</>
		);
	}, [selectedOption, placeholder]);

	return (
		<SearchableSelect
			options={groupedOptions}
			value={value}
			onChange={handleChange}
			placeholder={placeholder}
			label={label}
			error={error}
			disabled={disabled}
			className={cn(className, triggerClassName)}
			noOptionsText={emptyText}
			searchPlaceholder={searchPlaceholder}
			emptyText={emptyText}
			maxHeight={maxHeight}
			trigger={customTrigger}
		/>
	);
};

export default CurrencySelector;
