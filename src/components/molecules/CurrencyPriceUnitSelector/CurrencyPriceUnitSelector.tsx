import { FC, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from '@/components/ui/select';
import { PriceUnitApi } from '@/api/PriceUnitApi';
import { currencyOptions } from '@/constants/constants';
import {
	CurrencyPriceUnitOption,
	CurrencyPriceUnitSelection,
	currencyToOption,
	priceUnitToOption,
	isCurrencyOption,
	isPriceUnitOption,
} from '@/types/common/PriceUnitSelector';
import { ENTITY_STATUS } from '@/models';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/atoms';
import { Coins, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
	value?: string;
	onChange?: (selection: CurrencyPriceUnitSelection) => void;
	label?: string;
	description?: string;
	error?: string;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

const CurrencyPriceUnitSelector: FC<Props> = ({ value, onChange, label, description, error, placeholder, disabled = false, className }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const resolvedLabel = label ?? t('catalog:priceUnits.selector.currency');
	const resolvedPlaceholder = placeholder ?? t('catalog:priceUnits.selector.selectCurrency');

	const {
		data: priceUnitsData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchPriceUnitsForSelector'],
		queryFn: async () => {
			return await PriceUnitApi.ListPriceUnits({
				limit: 100,
				offset: 0,
				status: ENTITY_STATUS.PUBLISHED,
			});
		},
	});

	const allOptions: CurrencyPriceUnitOption[] = useMemo(() => {
		const currencyOpts = currencyOptions.map(currencyToOption);
		const priceUnitOpts = (priceUnitsData?.items || []).map(priceUnitToOption);
		return [...priceUnitOpts, ...currencyOpts];
	}, [priceUnitsData]);

	const currencyOptionsList = useMemo(() => {
		return allOptions.filter(isCurrencyOption);
	}, [allOptions]);

	const priceUnitOptionsList = useMemo(() => {
		return allOptions.filter(isPriceUnitOption);
	}, [allOptions]);

	const selectedOption = useMemo(() => {
		if (!value) return null;
		return allOptions.find((opt) => opt.value === value) || null;
	}, [value, allOptions]);

	const handleValueChange = (newValue: string) => {
		if (!onChange) return;

		const option = allOptions.find((opt) => opt.value === newValue);
		if (!option) return;

		const selection: CurrencyPriceUnitSelection = {
			type: option.type,
			data: option,
		};

		onChange(selection);
	};

	return (
		<div className={cn('space-y-1', className)}>
			{resolvedLabel && (
				<label className={cn('block text-sm font-medium text-zinc break-words', disabled ? 'text-zinc-500' : 'text-zinc-950')}>
					{resolvedLabel}
				</label>
			)}

			<Select value={value || ''} onValueChange={handleValueChange} disabled={disabled || isLoading}>
				<SelectTrigger className={cn(disabled && 'cursor-not-allowed')}>
					<span className={cn('truncate', value ? '' : 'text-muted-foreground')}>
						{isLoading ? t('common:table.loading') : selectedOption ? selectedOption.label : resolvedPlaceholder}
					</span>
				</SelectTrigger>
				<SelectContent>
					{isLoading ? (
						<div className='flex items-center justify-center py-4'>
							<Loader />
						</div>
					) : isError ? (
						<SelectItem value='error' disabled>
							{t('common:search.errorLoadingOptions')}
						</SelectItem>
					) : (
						<>
							{priceUnitOptionsList.length > 0 && (
								<SelectGroup>
									<SelectLabel>{t('catalog:priceUnits.selector.custom')}</SelectLabel>
									{priceUnitOptionsList.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											<div className='flex items-center gap-2'>
												<Layers className='h-4 w-4 text-blue-600 flex-shrink-0' />
												<div className='flex flex-col min-w-0'>
													<span className='truncate'>{option.label}</span>
													<span className='text-xs text-muted-foreground'>
														1 {option.code} = {option.conversion_rate} {option.base_currency.toUpperCase()}
													</span>
												</div>
											</div>
										</SelectItem>
									))}
								</SelectGroup>
							)}

							{currencyOptionsList.length > 0 &&
								(priceUnitOptionsList.length > 0 ? (
									<SelectGroup>
										<SelectLabel>{t('catalog:priceUnits.selector.standard')}</SelectLabel>
										{currencyOptionsList.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												<div className='flex items-center gap-2'>
													<Coins className='h-4 w-4 text-green-600' />
													<span className='truncate'>{option.label}</span>
												</div>
											</SelectItem>
										))}
									</SelectGroup>
								) : (
									currencyOptionsList.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											<span className='truncate'>{option.label}</span>
										</SelectItem>
									))
								))}

							{currencyOptionsList.length === 0 && priceUnitOptionsList.length === 0 && (
								<SelectItem value='no-options' disabled>
									{t('common:search.noOptionsAvailable')}
								</SelectItem>
							)}
						</>
					)}
				</SelectContent>
			</Select>

			{description && <p className='text-sm text-muted-foreground break-words'>{description}</p>}

			{error && <p className='text-sm text-destructive break-words'>{error}</p>}
		</div>
	);
};

export default CurrencyPriceUnitSelector;
