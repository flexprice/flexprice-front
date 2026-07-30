import { useState, useCallback, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Circle } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface SelectOption {
	value: string;
	label: string;
	suffixIcon?: React.ReactNode;
	prefixIcon?: React.ReactNode;
	description?: string;
	disabled?: boolean;
}

interface SearchableSelectProps {
	options: SelectOption[];
	value?: string;
	defaultOpen?: boolean;
	placeholder?: string;
	label?: string;
	description?: string;
	error?: string;
	onChange?: (value: string) => void;
	disabled?: boolean;
	isRadio?: boolean;
	className?: string;
	noOptionsText?: string;
	hideSelectedTick?: boolean;
	trigger?: React.ReactNode;
	searchPlaceholder?: string;
	emptyText?: string;
	maxHeight?: number;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
	disabled = false,
	options,
	value,
	placeholder: placeholderProp,
	label = '',
	description,
	onChange,
	error,
	isRadio,
	className,
	noOptionsText: noOptionsTextProp,
	defaultOpen = false,
	hideSelectedTick = true,
	trigger,
	searchPlaceholder: searchPlaceholderProp,
	emptyText: emptyTextProp,
	maxHeight = 300,
}) => {
	const { t } = useTranslation('common');
	const placeholder = placeholderProp ?? t('selectUi.selectAnOption');
	const noOptionsText = noOptionsTextProp ?? t('selectUi.noOptionsFound');
	const searchPlaceholder = searchPlaceholderProp ?? t('selectUi.searchOptionsPlaceholder');
	const emptyText = emptyTextProp ?? t('selectUi.noResultsFound');
	const [open, setOpen] = useState(defaultOpen);
	const [searchQuery, setSearchQuery] = useState('');

	const handleOpenChange = useCallback((newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			setSearchQuery('');
		}
	}, []);

	// Let Command component handle filtering since we're using option.label as the value

	const selectedOption = useMemo(() => options.find((option) => option.value === value), [options, value]);

	const handleSelect = useCallback(
		(currentValue: string) => {
			if (onChange) {
				onChange(currentValue === value ? '' : currentValue);
			}
			setOpen(false);
			setSearchQuery('');
		},
		[onChange, value],
	);

	const renderRadioOption = (option: SelectOption) => (
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
				{value === option.value ? <Circle className='size-2 text-black fill-current' /> : null}
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

	const renderStandardOption = (option: SelectOption) => (
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
					{!hideSelectedTick && <Check className={cn('h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />}
				</div>
			</div>
		</CommandItem>
	);

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
								<span className={cn('truncate', value ? '' : 'text-muted-foreground')}>{selectedOption?.label || placeholder}</span>
								<ChevronDown className='h-4 w-4 opacity-50' />
							</>
						)}
					</button>
				</PopoverTrigger>
				<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0' align='start'>
					<Command>
						<CommandInput placeholder={searchPlaceholder} value={searchQuery} onValueChange={setSearchQuery} className='h-9' />
						<CommandList style={{ maxHeight }}>
							<CommandEmpty>{emptyText}</CommandEmpty>
							<CommandGroup>
								{options.length > 0 ? (
									options.map((option) => (isRadio ? renderRadioOption(option) : renderStandardOption(option)))
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

export default SearchableSelect;
