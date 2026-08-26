import { useState, useCallback, useMemo, useEffect } from 'react';
import { Check, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/atoms';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { SelectOption } from '@/components/atoms/Select/SearchableSelect';
import { useTranslation } from 'react-i18next';

interface FilterAsyncSelectProps<T = any> {
	value: string; // Just ID
	searchFn: (query: string) => Promise<Array<SelectOption & { data: T }>>;
	onChange: (value: string) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	className?: string;
	initialOptions?: SelectOption[]; // Optional override
	debounceTime?: number; // Default: 300
}

const FilterAsyncSelect = <T = any,>({
	value,
	searchFn,
	onChange,
	placeholder = 'Search...',
	searchPlaceholder = 'Search options...',
	className,
	initialOptions = [],
	debounceTime = 300,
}: FilterAsyncSelectProps<T>) => {
	const { t } = useTranslation('common');
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedQuery, setDebouncedQuery] = useState('');

	// Debounce the search query
	const debouncedSetQuery = useMemo(
		() =>
			debounce((query: string) => {
				setDebouncedQuery(query);
			}, debounceTime),
		[debounceTime],
	);

	useEffect(() => {
		debouncedSetQuery(searchQuery);
		return () => {
			debouncedSetQuery.cancel();
		};
	}, [searchQuery, debouncedSetQuery]);

	// Fetch options using React Query - fetch even when query is empty
	const {
		data: searchResults = [],
		isLoading,
		isError,
		error,
	} = useQuery<Array<SelectOption & { data: T }>, Error>({
		queryKey: ['filter-async-select', debouncedQuery],
		queryFn: () => searchFn(debouncedQuery),
		enabled: isOpen,
	});

	// Create a map of all options we've seen (for label rehydration)
	const optionMap = useMemo(() => {
		const map = new Map<string, SelectOption>();
		// Add initial options
		initialOptions.forEach((opt) => map.set(opt.value, opt));
		// Add search results
		searchResults.forEach((item) => {
			map.set(item.value, {
				value: item.value,
				label: item.label,
				description: item.description,
				disabled: item.disabled,
			});
		});
		return map;
	}, [initialOptions, searchResults]);

	// Get available options - use initialOptions if query is empty and we have them, otherwise use search results
	const availableOptions: SelectOption[] =
		initialOptions.length > 0 && debouncedQuery === ''
			? initialOptions
			: searchResults.map((item) => ({
					value: item.value,
					label: item.label,
					description: item.description,
					disabled: item.disabled,
				}));

	// Get selected option with label from cache
	const selectedOption = useMemo(() => {
		if (!value) return undefined;
		return optionMap.get(value);
	}, [value, optionMap]);

	const handleOpenChange = useCallback((newOpen: boolean) => {
		setIsOpen(newOpen);
		if (newOpen) {
			// When opening, immediately trigger search with empty query
			setDebouncedQuery('');
		} else {
			setSearchQuery('');
		}
	}, []);

	const handleSelect = useCallback(
		(optionValue: string) => {
			// Toggle selection: if already selected, deselect; otherwise select
			const newValue = value === optionValue ? '' : optionValue;
			onChange(newValue);
			// Close popover for single select after selection
			setIsOpen(false);
			setSearchQuery('');
			// Reset debounced query to prevent unnecessary API calls
			setDebouncedQuery('');
		},
		[value, onChange],
	);

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button variant='outline' size='sm' className={cn(className, 'h-9 rounded-sm text-xs w-full justify-between font-normal')}>
					<span className={cn('truncate', selectedOption ? '' : 'text-muted-foreground')}>
						{selectedOption?.label || (value ? t('status.loading') : placeholder)}
					</span>
					<ChevronDown className='h-4 w-4 opacity-50 shrink-0' />
				</Button>
			</PopoverTrigger>
			<PopoverContent align='start' className='w-48 p-0 !z-[110]'>
				<Command shouldFilter={false}>
					<CommandInput placeholder={searchPlaceholder} value={searchQuery} onValueChange={setSearchQuery} className='h-9' />
					<CommandList className='max-h-[18.75rem]'>
						{isLoading && searchQuery === '' && (
							<div className='flex flex-col items-center justify-center py-8'>
								<Loader2 className='h-5 w-5 animate-spin text-muted-foreground mb-2' />
								<span className='text-sm text-muted-foreground'>{t('search.loadingOptions')}</span>
							</div>
						)}
						{isLoading && searchQuery !== '' && (
							<div className='flex items-center justify-center py-4 border-b'>
								<Loader2 className='h-4 w-4 animate-spin text-muted-foreground me-2' />
								<span className='text-sm text-muted-foreground'>{t('search.searching')}</span>
							</div>
						)}
						{!isLoading && isError && (
							<div className='flex flex-col items-center justify-center py-8 px-4'>
								<div className='text-sm text-destructive text-center mb-1'>{error.message || t('search.errorLoadingOptions')}</div>
								<div className='text-xs text-muted-foreground text-center'>{t('search.pleaseRetry')}</div>
							</div>
						)}
						{!isLoading && !isError && availableOptions.length === 0 && searchQuery === '' && (
							<div className='flex flex-col items-center justify-center py-8 px-4'>
								<div className='text-sm text-muted-foreground text-center'>{t('search.noOptionsAvailable')}</div>
							</div>
						)}
						{!isLoading && !isError && availableOptions.length === 0 && searchQuery !== '' && (
							<div className='flex flex-col items-center justify-center py-8 px-4'>
								<div className='text-sm text-muted-foreground text-center mb-1'>{t('table.noResults')}</div>
								<div className='text-xs text-muted-foreground text-center'>{t('search.tryDifferentTerm')}</div>
							</div>
						)}
						{!isLoading && !isError && availableOptions.length > 0 && (
							<CommandGroup>
								{availableOptions.map((option) => (
									<CommandItem
										key={option.value}
										value={`${option.label} ${option.description || ''}`}
										onSelect={() => handleSelect(option.value)}
										disabled={option.disabled}
										className='cursor-pointer'>
										<span className='truncate flex-1'>{option.label}</span>
										<Check className={cn('ms-auto h-4 w-4 shrink-0', value === option.value ? 'opacity-100' : 'opacity-0')} />
									</CommandItem>
								))}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

export default FilterAsyncSelect;
