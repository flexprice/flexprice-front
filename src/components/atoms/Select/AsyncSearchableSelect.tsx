import { useState, useCallback, useMemo, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Circle, Loader2 } from 'lucide-react';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { SelectOption } from './SearchableSelect';

export interface SearchConfig<T = any> {
	/** Function that performs the search and returns objects with SelectOption format */
	searchFn: (query: string) => Promise<Array<SelectOption & { data: T }>>;
	/** Debounce time in milliseconds (default: 300) */
	debounceTime?: number;
	/** Search input placeholder */
	placeholder?: string;
	/** Optional: Initial options to display (for pre-selected values) */
	initialOptions?: SelectOption[];
}

export interface ExtractorsConfig<T> {
	/** Extract unique identifier from object for comparison */
	valueExtractor: (item: T) => string;
	/** Extract display label from object */
	labelExtractor: (item: T) => string;
	/** Optional: Extract description from object */
	descriptionExtractor?: (item: T) => string;
}

export interface DisplayConfig {
	/** Placeholder text */
	placeholder?: string;
	/** Label text */
	label?: string;
	/** Description text */
	description?: string;
	/** Error message */
	error?: string;
	/** Additional className */
	className?: string;
	/** Custom trigger element */
	trigger?: React.ReactNode;
	/** Default open state */
	defaultOpen?: boolean;
	/** Popover side positioning */
	side?: 'top' | 'bottom' | 'left' | 'right';
	/** Popover align positioning */
	align?: 'start' | 'center' | 'end';
	/** Side offset for popover */
	sideOffset?: number;
}

export interface OptionsConfig {
	/** Text when no options found */
	noOptionsText?: string;
	/** Empty state text */
	emptyText?: string;
	/** Hide selected tick mark */
	hideSelectedTick?: boolean;
	/** Radio button style */
	isRadio?: boolean;
}

export interface AsyncSearchableSelectProps<T = any> {
	/** Search configuration */
	search: SearchConfig;
	/** Value extraction configuration */
	extractors: ExtractorsConfig<T>;
	/** Display configuration */
	display?: DisplayConfig;
	/** Options configuration */
	options?: OptionsConfig;
	/** Selected value - full object */
	value?: T;
	/** Callback when selection changes */
	onChange?: (value: T | undefined) => void;
	/** Disabled state */
	disabled?: boolean;
}

const AsyncSearchableSelect = <T = any,>({
	search,
	extractors,
	display = {},
	options = {},
	value,
	onChange,
	disabled = false,
}: AsyncSearchableSelectProps<T>) => {
	const { t } = useTranslation('common');
	const { searchFn, debounceTime = 300, placeholder: searchPlaceholder = t('search.placeholderShort'), initialOptions = [] } = search;

	const { valueExtractor, labelExtractor, descriptionExtractor } = extractors;

	const {
		placeholder = t('selectUi.selectAnOption'),
		label = '',
		description,
		error,
		className,
		trigger,
		defaultOpen = false,
		side = 'top',
		align = 'start',
		sideOffset = 4,
	} = display;

	const {
		noOptionsText = t('selectUi.noOptionsFound'),
		emptyText = t('selectUi.noResultsFound'),
		hideSelectedTick = true,
		isRadio = false,
	} = options;
	const [open, setOpen] = useState(defaultOpen);
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
		error: queryError,
	} = useQuery<Array<SelectOption & { data: T }>, Error>({
		queryKey: ['async-searchable-select', debouncedQuery],
		queryFn: () => searchFn(debouncedQuery),
		enabled: open,
		staleTime: 30000, // Cache for 30 seconds
	});

	// Create data mapping from search results
	const optionDataMap = useMemo(() => {
		const map = new Map<string, T>();
		searchResults.forEach((item) => {
			map.set(item.value, item.data);
		});
		return map;
	}, [searchResults]);

	// Extract SelectOptions for display
	const availableOptions: SelectOption[] =
		initialOptions.length > 0 && debouncedQuery === ''
			? initialOptions
			: searchResults.map((item) => ({
					value: item.value,
					label: item.label,
					description: item.description,
					disabled: item.disabled,
					prefixIcon: item.prefixIcon,
					suffixIcon: item.suffixIcon,
				}));

	// Convert value to SelectOption format for display
	const selectedOption = value
		? {
				value: valueExtractor(value),
				label: labelExtractor(value),
				description: descriptionExtractor?.(value),
			}
		: undefined;

	// Get selected value as string for comparison
	const selectedValue = selectedOption?.value;

	const handleOpenChange = useCallback((newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			setSearchQuery('');
		}
	}, []);

	const handleSelect = useCallback(
		(optionValue: string) => {
			if (!onChange) return;

			// Get the full object from the data map, or use current value if already selected
			const selectedObject = optionDataMap.get(optionValue) || (value && valueExtractor(value) === optionValue ? value : undefined);

			if (!selectedObject) return;

			// Toggle selection: if already selected, deselect; otherwise select
			const isSelected = value && valueExtractor(value) === optionValue;
			onChange(isSelected ? undefined : selectedObject);
			setOpen(false);
			setSearchQuery('');
		},
		[optionDataMap, value, onChange, valueExtractor],
	);

	const renderRadioOption = (option: SelectOption) => {
		const isSelected = selectedValue === option.value;
		return (
			<CommandItem
				key={option.value}
				value={`${option.label} ${option.description || ''}`}
				onSelect={() => handleSelect(option.value)}
				disabled={option.disabled}
				className={cn(
					'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 ps-8 pe-2 text-sm outline-none',
					'focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
					option.disabled && 'select-none cursor-not-allowed',
				)}>
				{/* Radio Icon */}
				<span className='absolute left-2 top-[10px] flex h-4 w-4 justify-center'>
					{isSelected ? <Circle className='size-2 text-black fill-current' /> : null}
					<Circle className='size-4 text-gray-400 absolute' />
				</span>

				<div className='flex items-center space-x-2 w-full'>
					<div className='flex flex-col me-2 w-full'>
						<span className='break-words'>{option.label}</span>
						{option.description && <span className='text-sm text-gray-500 break-words whitespace-normal'>{option.description}</span>}
					</div>
				</div>
			</CommandItem>
		);
	};

	const renderStandardOption = (option: SelectOption) => {
		const isSelected = selectedValue === option.value;
		return (
			<CommandItem
				key={option.value}
				value={`${option.label} ${option.description || ''}`}
				onSelect={() => handleSelect(option.value)}
				disabled={option.disabled}
				className={cn(
					'cursor-pointer flex items-center space-x-2 justify-between w-full',
					option.disabled && 'select-none cursor-not-allowed opacity-50',
				)}>
				<div
					className={cn(
						'flex w-full items-center space-x-2 justify-between',
						option.disabled && 'opacity-50 pointer-events-none',
						option.suffixIcon && 'pe-8',
						hideSelectedTick && '!pl-0',
					)}>
					{option.prefixIcon && option.prefixIcon}

					<div className={cn('flex flex-col w-full', !hideSelectedTick && 'mr-0')}>
						<span className='break-words'>{option.label}</span>
						{option.description && <span className='text-sm text-gray-500 break-words whitespace-normal'>{option.description}</span>}
					</div>

					<div className='flex items-center gap-2'>
						{option.suffixIcon && <span>{option.suffixIcon}</span>}
						{!hideSelectedTick && <Check className={cn('h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />}
					</div>
				</div>
			</CommandItem>
		);
	};

	// Display text for selected value
	const displayText = selectedOption?.label || placeholder;

	return (
		<div className={cn('space-y-1')}>
			{/* Label */}
			{label && (
				<label className={cn(' block text-sm font-medium text-zinc break-words', disabled ? 'text-zinc-500' : 'text-zinc-950')}>
					{label}
				</label>
			)}

			<Popover open={open} onOpenChange={handleOpenChange}>
				<PopoverTrigger asChild>
					<button
						className={cn(
							'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
							'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
							'disabled:cursor-not-allowed disabled:opacity-50',
							disabled && 'cursor-not-allowed',
							className,
						)}
						disabled={disabled}
						type='button'>
						{trigger ? (
							trigger
						) : (
							<>
								<span className={cn('truncate', selectedOption ? '' : 'text-muted-foreground')}>{displayText}</span>
								<ChevronDown className='h-4 w-4 opacity-50' />
							</>
						)}
					</button>
				</PopoverTrigger>
				<PopoverContent
					className='w-[var(--radix-popover-trigger-width)] p-0'
					align={align}
					side={side}
					sideOffset={sideOffset}
					avoidCollisions={true}
					collisionPadding={8}
					onOpenAutoFocus={(e) => e.preventDefault()}>
					<Command shouldFilter={false}>
						<CommandInput placeholder={searchPlaceholder} value={searchQuery} onValueChange={setSearchQuery} className='h-9' />
						<CommandList
							className='max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'
							onWheel={(e) => e.stopPropagation()}
							onScroll={(e) => e.stopPropagation()}>
							{isLoading && (
								<div className='flex items-center justify-center py-6'>
									<Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
									<span className='ms-2 text-sm text-muted-foreground'>{t('search.searching')}</span>
								</div>
							)}
							{isError && (
								<CommandEmpty>
									<div className='text-sm text-destructive'>{queryError.message || t('search.errorLoadingOptions')}</div>
								</CommandEmpty>
							)}
							{!isLoading && !isError && (
								<>
									<CommandEmpty>{emptyText}</CommandEmpty>
									<CommandGroup>
										{availableOptions.length > 0 ? (
											availableOptions.map((option) => (isRadio ? renderRadioOption(option) : renderStandardOption(option)))
										) : (
											<CommandItem disabled>
												<div className='flex items-center space-x-2 w-full'>
													<div className='flex flex-col me-2 w-full'>
														<span className='break-words'>{noOptionsText}</span>
													</div>
												</div>
											</CommandItem>
										)}
									</CommandGroup>
								</>
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{/* Description */}
			{description && <p className='text-sm text-muted-foreground break-words'>{description}</p>}

			{/* Error Message */}
			{error && <p className='text-sm text-destructive break-words'>{error}</p>}
		</div>
	);
};

export default AsyncSearchableSelect;
