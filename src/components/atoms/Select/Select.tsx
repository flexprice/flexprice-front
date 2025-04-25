import { Select, SelectContent, SelectGroup, SelectItem as ShadcnSelect, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Circle } from 'lucide-react';
import React from 'react';

export interface SelectOption {
	value: string;
	label: string;
	suffixIcon?: React.ReactNode;
	prefixIcon?: React.ReactNode;
	description?: string;
	disabled?: boolean;
}

interface Props {
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
}

const RadioSelectItem = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Item
		ref={ref}
		className={cn(
			'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			className,
		)}
		{...props}>
		{/* Checkbox Icon - Show Empty when Not Selected, Filled when Selected */}
		<span className='absolute left-2 top-[10px] flex h-4 w-4  justify-center'>
			<SelectPrimitive.ItemIndicator className='flex items-center justify-center w-full h-full'>
				<Circle className='size-2 text-black fill-current' />
			</SelectPrimitive.ItemIndicator>
			{/* Default Unselected Checkbox */}
			<Circle className='size-4 text-gray-400 absolute' />
		</span>

		<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
	</SelectPrimitive.Item>
));

const FlexPriceSelect: React.FC<Props> = ({
	disabled = false,
	options,
	value,
	placeholder = 'Select an option',
	label = '',
	description,
	onChange,
	error,
	isRadio,
	className,
	noOptionsText,
	defaultOpen,
	hideSelectedTick = true,
	trigger,
}) => {
	return (
		<div className={cn('space-y-1 ')}>
			{/* Label */}
			{label && (
				<label className={cn('font-inter block text-sm font-medium text-zinc break-words', disabled ? 'text-zinc-500' : 'text-zinc-950')}>
					{label}
				</label>
			)}

			<Select
				defaultOpen={defaultOpen}
				defaultValue={value || ''}
				onValueChange={(newValue) => {
					if (onChange) {
						onChange(newValue === value ? '' : newValue);
					}
				}}
				value={value}
				disabled={disabled}>
				<SelectTrigger className={cn(disabled && 'cursor-not-allowed', className)}>
					{trigger ? (
						trigger
					) : (
						<span className={cn('truncate', value ? '' : 'text-muted-foreground')}>
							{value ? options.find((option) => option.value === value)?.label.trim() : placeholder}
						</span>
					)}
				</SelectTrigger>
				<SelectContent className='w-[var(--radix-select-trigger-width)]'>
					<SelectGroup>
						{options.length > 0 &&
							options.map((option) => {
								if (isRadio) {
									return (
										<RadioSelectItem
											className={cn(option.disabled && 'select-none cursor-not-allowed')}
											disabled={option.disabled}
											key={option.value}
											value={option.value}>
											<div className='flex items-center space-x-2 w-full'>
												<div className='flex flex-col mr-2 w-full'>
													<span className='break-words'>{option.label}</span>
													{option.description && (
														<span className='text-sm text-gray-500 break-words whitespace-normal'>{option.description}</span>
													)}
												</div>
											</div>
										</RadioSelectItem>
									);
								} else {
									return (
										<ShadcnSelect
											className={cn(
												'w-full',
												'cursor-pointer',
												option.disabled && 'select-none cursor-not-allowed',
												'flex items-center space-x-2 justify-between w-full',
											)}
											disabled={option.disabled}
											key={option.value}
											value={option.value}>
											<div
												className={cn(
													'flex w-full items-center space-x-2 justify-between',
													option.disabled && 'opacity-50 pointer-events-none',
													option.suffixIcon && 'pr-8',
													hideSelectedTick && '!pl-0',
												)}>
												{option.prefixIcon && option.prefixIcon}

												<div className={cn('flex flex-col w-full', !hideSelectedTick && 'mr-0')}>
													<span className='break-words'>{option.label}</span>
													{option.description && (
														<span className='text-sm text-gray-500 break-words whitespace-normal'>{option.description}</span>
													)}
												</div>
												{option.suffixIcon && <span className='absolute right-2 top-1/2 -translate-y-1/2'>{option.suffixIcon}</span>}
											</div>
										</ShadcnSelect>
									);
								}
							})}
						{options.length === 0 && noOptionsText && (
							<ShadcnSelect value='no-items' disabled>
								<div className='flex items-center space-x-2 w-full'>
									<div className='flex flex-col mr-2 w-full'>
										<span className='break-words'>{noOptionsText}</span>
									</div>
								</div>
							</ShadcnSelect>
						)}
					</SelectGroup>
				</SelectContent>
			</Select>
			{/* Description */}
			{description && <p className='text-sm text-muted-foreground break-words'>{description}</p>}

			{/* Error Message */}
			{error && <p className='text-sm text-destructive break-words'>{error}</p>}
		</div>
	);
};

export default FlexPriceSelect;
