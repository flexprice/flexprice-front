import { useState, useCallback, useMemo, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button, Chip } from '@/components/atoms';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { SelectOption } from '@/components/atoms/Select/SearchableSelect';

interface FilterAsyncMultiSelectProps<T = any> {
	value: string[]; // Just IDs
	searchFn: (query: string) => Promise<Array<SelectOption & { data: T }>>;
	onChange: (value: string[]) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	className?: string;
	initialOptions?: SelectOption[]; // Optional override
	debounceTime?: number; // Default: 300
}

const FilterAsyncMultiSelect = <T = any,>({
	value = [],
	searchFn,
	onChange,
	placeholder = 'Select options...',
	searchPlaceholder = 'Search options...',
	className,
	initialOptions = [],
	debounceTime = 300,
}: FilterAsyncMultiSelectProps<T>) => {
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
	} = useQuery<Array<SelectOption & { data: T }>>({
		queryKey: ['filter-async-multi-select', debouncedQuery],
		queryFn: () => searchFn(debouncedQuery),
		enabled: isOpen, // Only fetch when popover is open
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

	// Get selected options with labels from cache
	const selectedOptions = useMemo(() => {
		return value.map((id) => optionMap.get(id)).filter((opt): opt is SelectOption => opt !== undefined);
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
			// Don't trigger API call - just update local state
			const newValue = value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue];
			onChange(newValue);
			// Keep popover open for multi-select to allow multiple selections
			// Don't clear search query so user can continue selecting
		},
		[value, onChange],
	);

	// Check if all available options are selected
	const isAllSelected = useMemo(() => {
		if (availableOptions.length === 0) return false;
		const enabledOptions = availableOptions.filter((opt) => !opt.disabled);
		if (enabledOptions.length === 0) return false;
		return enabledOptions.every((option) => value.includes(option.value));
	}, [availableOptions, value]);

	// Handle select all checkbox
	const handleSelectAll = useCallback(
		(checked: boolean) => {
			const enabledOptions = availableOptions.filter((opt) => !opt.disabled);
			if (checked) {
				// Select all: Add all available options to the selection
				const allOptionValues = enabledOptions.map((opt) => opt.value);
				const newValue = [...new Set([...value, ...allOptionValues])]; // Merge with existing selections
				onChange(newValue);
			} else {
				// Deselect all: Remove all available options from selection
				const availableValues = new Set(enabledOptions.map((opt) => opt.value));
				const newValue = value.filter((v) => !availableValues.has(v));
				onChange(newValue);
			}
		},
		[availableOptions, value, onChange],
	);

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button variant='outline' size='sm' className={cn(className, 'h-9 rounded-sm text-xs w-full justify-start font-normal')}>
					{value.length === 0 ? (
						<span className='truncate text-sm'>{placeholder}</span>
					) : value.length === 1 ? (
						<Chip label={selectedOptions[0]?.label || 'Loading...'} className='truncate bg-muted rounded-md' />
					) : (
						<Chip label={`${value.length} selected`} className='truncate bg-muted rounded-md' />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align='start' className='w-48 p-0 !z-[110]'>
				<Command shouldFilter={false}>
					<CommandInput placeholder={searchPlaceholder} value={searchQuery} onValueChange={setSearchQuery} className='h-9' />
					<CommandList className='max-h-[300px]'>
						{isLoading && searchQuery === '' && (
							<div className='flex flex-col items-center justify-center py-8'>
								<Loader2 className='h-5 w-5 animate-spin text-muted-foreground mb-2' />
								<span className='text-sm text-muted-foreground'>Loading options...</span>
							</div>
						)}
						{isLoading && searchQuery !== '' && (
							<div className='flex items-center justify-center py-4 border-b'>
								<Loader2 className='h-4 w-4 animate-spin text-muted-foreground mr-2' />
								<span className='text-sm text-muted-foreground'>Searching...</span>
							</div>
						)}
						{!isLoading && isError && (
							<div className='flex flex-col items-center justify-center py-8 px-4'>
								<div className='text-sm text-destructive text-center mb-1'>
									{error instanceof Error ? error.message : 'Error loading options'}
								</div>
								<div className='text-xs text-muted-foreground text-center'>Please try again</div>
							</div>
						)}
						{!isLoading && !isError && availableOptions.length === 0 && searchQuery === '' && (
							<div className='flex flex-col items-center justify-center py-8 px-4'>
								<div className='text-sm text-muted-foreground text-center'>No options available</div>
							</div>
						)}
						{!isLoading && !isError && availableOptions.length === 0 && searchQuery !== '' && (
							<div className='flex flex-col items-center justify-center py-8 px-4'>
								<div className='text-sm text-muted-foreground text-center mb-1'>No results found</div>
								<div className='text-xs text-muted-foreground text-center'>Try a different search term</div>
							</div>
						)}
						{!isLoading && !isError && availableOptions.length > 0 && (
							<>
								{/* Select All Checkbox */}
								<div className='flex items-center gap-2 px-2 py-2 border-b bg-muted/20'>
									<Checkbox id='select-all-async-multi' checked={isAllSelected} onCheckedChange={handleSelectAll} className='h-4 w-4' />
									<label htmlFor='select-all-async-multi' className='text-sm font-medium leading-none cursor-pointer select-none flex-1'>
										Select all
									</label>
									<span className='text-xs text-muted-foreground'>{availableOptions.filter((opt) => !opt.disabled).length} items</span>
								</div>

								<CommandGroup>
									{availableOptions.map((option) => (
										<CommandItem
											key={option.value}
											value={`${option.label} ${option.description || ''}`}
											onSelect={() => handleSelect(option.value)}
											disabled={option.disabled}
											className='cursor-pointer'>
											<span className='truncate flex-1'>{option.label}</span>
											<Check className={cn('ml-auto h-4 w-4 shrink-0', value.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
										</CommandItem>
									))}
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

export default FilterAsyncMultiSelect;
