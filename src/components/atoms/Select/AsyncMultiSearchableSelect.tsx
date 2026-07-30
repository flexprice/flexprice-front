import { useState, useCallback, useMemo, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button, Badge, Separator } from '@/components/ui';
import { cn } from '@/lib/utils';
import { CheckIcon, ChevronDown, Loader2, XCircle, XIcon } from 'lucide-react';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { SelectOption } from './SearchableSelect';
import type { ExtractorsConfig, DisplayConfig, OptionsConfig } from './AsyncSearchableSelect';

export interface MultiSearchConfig<T = unknown> {
	searchFn: (query: string) => Promise<Array<SelectOption & { data: T }>>;
	debounceTime?: number;
	placeholder?: string;
	/**
	 * When true (default), opening the popover fetches with an empty query.
	 * When false, the API runs only after the user types a non-empty (trimmed) search string.
	 */
	fetchOnEmptyQuery?: boolean;
}

export interface MultiDisplayConfig extends DisplayConfig {
	/** className for the trigger button */
	triggerClassName?: string;
}

export interface MultiOptionsConfig extends OptionsConfig {
	/** Max badges shown before +N overflow (default: 3) */
	maxCount?: number;
	/** Modal popover (see Radix Popover) */
	modalPopover?: boolean;
}

export interface AsyncMultiSearchableSelectProps<T = unknown> {
	search: MultiSearchConfig<T>;
	extractors: ExtractorsConfig<T>;
	display?: MultiDisplayConfig;
	options?: MultiOptionsConfig;
	value?: T[];
	onChange?: (value: T[]) => void;
	disabled?: boolean;
}

function mergeSearchAndSelected<T>(
	searchRows: Array<SelectOption & { data: T }>,
	selected: T[] | undefined,
	valueExtractor: (item: T) => string,
	labelExtractor: (item: T) => string,
	descriptionExtractor?: (item: T) => string,
): Array<SelectOption & { data: T }> {
	const seen = new Set<string>();
	const out: Array<SelectOption & { data: T }> = [];

	for (const row of searchRows) {
		if (!seen.has(row.value)) {
			seen.add(row.value);
			out.push(row);
		}
	}

	for (const item of selected ?? []) {
		const key = valueExtractor(item);
		if (!seen.has(key)) {
			seen.add(key);
			out.push({
				value: key,
				label: labelExtractor(item),
				description: descriptionExtractor?.(item),
				data: item,
			});
		}
	}

	return out;
}

const AsyncMultiSearchableSelect = <T = unknown,>({
	search,
	extractors,
	display = {},
	options = {},
	value = [],
	onChange,
	disabled = false,
}: AsyncMultiSearchableSelectProps<T>) => {
	const { t } = useTranslation('common');
	const { searchFn, debounceTime = 300, placeholder: searchPlaceholder = t('search.placeholderShort'), fetchOnEmptyQuery = true } = search;

	const { valueExtractor, labelExtractor, descriptionExtractor } = extractors;

	const {
		placeholder = t('selectUi.selectOptions'),
		label = '',
		description,
		error,
		className,
		trigger,
		triggerClassName,
		defaultOpen = false,
		side = 'top',
		align = 'start',
		sideOffset = 4,
	} = display;

	const {
		noOptionsText = t('selectUi.noOptionsFound'),
		emptyText = t('selectUi.noResultsFound'),
		maxCount = 3,
		modalPopover = false,
	} = options;

	const [open, setOpen] = useState(defaultOpen);
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedQuery, setDebouncedQuery] = useState('');

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

	const queryTrimmed = debouncedQuery.trim();
	const shouldFetch = open && (fetchOnEmptyQuery || queryTrimmed.length > 0);

	const {
		data: rawSearchResults = [],
		isLoading,
		isError,
		error: queryError,
	} = useQuery<Array<SelectOption & { data: T }>, Error>({
		queryKey: ['async-multi-searchable-select', debouncedQuery, fetchOnEmptyQuery],
		queryFn: () => searchFn(debouncedQuery),
		enabled: shouldFetch,
		staleTime: 30000,
	});

	const displayRows = useMemo(() => {
		const searchRows = shouldFetch ? rawSearchResults : [];
		return mergeSearchAndSelected(searchRows, value, valueExtractor, labelExtractor, descriptionExtractor);
	}, [shouldFetch, rawSearchResults, value, valueExtractor, labelExtractor, descriptionExtractor]);

	const selectedKeys = useMemo(() => new Set((value ?? []).map((v) => valueExtractor(v))), [value, valueExtractor]);

	const rowDataMap = useMemo(() => {
		const map = new Map<string, SelectOption & { data: T }>();
		displayRows.forEach((row) => {
			map.set(row.value, row);
		});
		return map;
	}, [displayRows]);

	const handleOpenChange = useCallback((newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			setSearchQuery('');
		}
	}, []);

	const toggleOption = useCallback(
		(optionValue: string) => {
			if (!onChange) return;
			const row = rowDataMap.get(optionValue);
			if (!row || row.disabled) return;

			const isSelected = selectedKeys.has(optionValue);
			if (isSelected) {
				onChange((value ?? []).filter((v) => valueExtractor(v) !== optionValue));
			} else {
				onChange([...(value ?? []), row.data]);
			}
		},
		[onChange, rowDataMap, selectedKeys, value, valueExtractor],
	);

	const handleClear = useCallback(() => {
		onChange?.([]);
	}, [onChange]);

	const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			setOpen(true);
		} else if (event.key === 'Backspace' && !event.currentTarget.value && (value?.length ?? 0) > 0) {
			const next = [...(value ?? [])];
			next.pop();
			onChange?.(next);
		}
	};

	const showLoading = shouldFetch && isLoading;
	const listEmpty = !showLoading && !isError && displayRows.length === 0;

	return (
		<div className={cn('space-y-1', className)}>
			{label && (
				<label className={cn('block text-sm font-medium text-zinc break-words', disabled ? 'text-zinc-500' : 'text-zinc-950')}>
					{label}
				</label>
			)}

			<Popover open={open} onOpenChange={handleOpenChange} modal={modalPopover}>
				<PopoverTrigger asChild>
					<Button
						type='button'
						variant='outline'
						disabled={disabled}
						className={cn(
							'flex w-full px-3 py-2 rounded-md border h-10 min-h-10 items-center justify-between bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto',
							triggerClassName,
						)}>
						{trigger ? (
							trigger
						) : (value?.length ?? 0) > 0 ? (
							<div className='flex items-center w-full min-w-0'>
								<div className='flex items-center flex-1 min-w-0 overflow-hidden'>
									<div className='flex items-center gap-1 overflow-x-auto scrollbar-hide w-full'>
										{(value ?? []).slice(0, maxCount).map((item) => {
											const v = valueExtractor(item);
											return (
												<Badge
													key={v}
													variant='secondary'
													className='flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap shrink-0 max-w-[140px]'>
													<span className='truncate' title={labelExtractor(item)}>
														{labelExtractor(item)}
													</span>
													<XCircle
														className='h-3 w-3 cursor-pointer shrink-0 hover:text-destructive'
														onClick={(e) => {
															e.stopPropagation();
															toggleOption(v);
														}}
													/>
												</Badge>
											);
										})}
										{(value?.length ?? 0) > maxCount && (
											<Badge variant='secondary' className='px-2 py-1 text-xs shrink-0'>
												+{(value?.length ?? 0) - maxCount}
											</Badge>
										)}
									</div>
								</div>
								<div className='flex items-center gap-1 ms-2 shrink-0'>
									<XIcon
										className='h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive'
										onClick={(e) => {
											e.stopPropagation();
											handleClear();
										}}
									/>
									<Separator orientation='vertical' className='h-4' />
									<ChevronDown className='h-4 w-4 text-muted-foreground' />
								</div>
							</div>
						) : (
							<div className='flex items-center justify-between w-full'>
								<span className='text-muted-foreground truncate ps-1 font-normal'>{placeholder}</span>
								<ChevronDown className='h-4 w-4 text-muted-foreground shrink-0' />
							</div>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className='!w-[var(--radix-popover-trigger-width)] !max-w-[var(--radix-popover-trigger-width)] min-w-0 overflow-hidden p-0'
					align={align}
					side={side}
					sideOffset={sideOffset}
					avoidCollisions={true}
					collisionPadding={8}
					onOpenAutoFocus={(e) => e.preventDefault()}
					onEscapeKeyDown={() => setOpen(false)}>
					<Command shouldFilter={false}>
						<CommandInput
							placeholder={searchPlaceholder}
							value={searchQuery}
							onValueChange={setSearchQuery}
							onKeyDown={handleInputKeyDown}
							className='h-9'
						/>
						<CommandList
							className='max-h-[200px] w-full max-w-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'
							onWheel={(e) => e.stopPropagation()}
							onScroll={(e) => e.stopPropagation()}>
							{showLoading && (
								<div className='flex items-center justify-center py-6'>
									<Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
									<span className='ms-2 text-sm text-muted-foreground'>{t('search.searching')}</span>
								</div>
							)}
							{isError && shouldFetch && (
								<CommandEmpty>
									<div className='text-sm text-destructive'>{queryError.message || t('search.errorLoadingOptions')}</div>
								</CommandEmpty>
							)}
							{!showLoading && !isError && (
								<>
									<CommandEmpty>{listEmpty ? emptyText : null}</CommandEmpty>
									<CommandGroup>
										{listEmpty ? (
											<CommandItem disabled>
												<span className='break-words'>{noOptionsText}</span>
											</CommandItem>
										) : (
											displayRows.map((option) => {
												const isSelected = selectedKeys.has(option.value);
												const isDisabled = option.disabled;
												return (
													<CommandItem
														key={option.value}
														value={`${option.label} ${option.description || ''}`}
														onSelect={() => toggleOption(option.value)}
														className={cn('cursor-pointer min-w-0', isDisabled && 'opacity-50 cursor-not-allowed')}
														disabled={isDisabled}>
														<div
															className={cn(
																'me-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary',
																isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
															)}>
															<CheckIcon className='h-4 w-4' />
														</div>
														{option.prefixIcon && option.prefixIcon}
														<div className='flex min-w-0 flex-1 flex-col'>
															<span className='truncate' title={option.label}>
																{option.label}
															</span>
															{option.description && (
																<span className='text-sm text-muted-foreground break-words whitespace-normal'>{option.description}</span>
															)}
														</div>
													</CommandItem>
												);
											})
										)}
									</CommandGroup>
									<CommandSeparator />
									<CommandGroup>
										<div className='flex items-center justify-between'>
											{(value?.length ?? 0) > 0 && (
												<>
													<CommandItem onSelect={handleClear} className='flex-1 justify-center cursor-pointer'>
														{t('multiSelectUi.clear')}
													</CommandItem>
													<Separator orientation='vertical' className='flex min-h-6 h-full' />
												</>
											)}
											<CommandItem onSelect={() => setOpen(false)} className='flex-1 justify-center cursor-pointer max-w-full'>
												{t('multiSelectUi.close')}
											</CommandItem>
										</div>
									</CommandGroup>
								</>
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{description && <p className='text-sm text-muted-foreground break-words'>{description}</p>}
			{error && <p className='text-sm text-destructive break-words'>{error}</p>}
		</div>
	);
};

export default AsyncMultiSearchableSelect;
