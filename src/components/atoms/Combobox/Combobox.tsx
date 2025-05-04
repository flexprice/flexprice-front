import { useState, useCallback, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';

export interface ComboboxOption {
	value: string;
	label: string;
}

export interface ComboboxProps {
	options: ComboboxOption[];
	value?: string;
	onChange?: (value: string) => void;
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
	renderOption?: (option: ComboboxOption) => React.ReactNode;
}

const Combobox = ({
	options,
	value,
	onChange,
	placeholder = 'Select an option',
	emptyText = 'No options found.',
	searchPlaceholder = 'Search...',
	triggerClassName,
	contentClassName,
	disabled = false,
	width = 200,
	maxHeight = 300,
	onOpenChange,
	renderOption,
}: ComboboxProps) => {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

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
		if (!searchQuery) return options;

		const lowerQuery = searchQuery.toLowerCase();
		return options.filter((option) => option.label.toLowerCase().includes(lowerQuery) || option.value.toLowerCase().includes(lowerQuery));
	}, [options, searchQuery]);

	const selectedOption = useMemo(() => options.find((option) => option.value === value), [options, value]);

	const handleSelect = useCallback(
		(currentValue: string) => {
			onChange?.(currentValue);
			setOpen(false);
			setSearchQuery('');
		},
		[onChange],
	);

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger className={cn(triggerClassName)} asChild>
				<Button
					variant='outline'
					size='sm'
					role='combobox'
					aria-expanded={open}
					disabled={disabled}
					className={cn('justify-between', typeof width === 'number' ? `w-[${width}px]` : `w-[${width}]`, triggerClassName)}>
					<p className='font-normal'>{selectedOption?.label || placeholder}</p>
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
							{filteredOptions.map((option) => (
								<CommandItem key={option.value} value={option.value} onSelect={handleSelect}>
									{renderOption ? (
										renderOption(option)
									) : (
										<div className='flex items-center gap-2 '>
											<Check className={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
											{option.label}
										</div>
									)}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

export default Combobox;
