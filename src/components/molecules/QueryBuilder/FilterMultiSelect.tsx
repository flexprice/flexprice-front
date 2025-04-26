import { Check } from 'lucide-react';
import { Button, Chip } from '@/components/atoms';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface FilterMultiSelectProps {
	value: string[];
	options: { value: string; label: string }[];
	onChange: (value: string[]) => void;
	placeholder?: string;
	searchPlaceholder?: string;
}

const FilterMultiSelect: React.FC<FilterMultiSelectProps> = ({
	value = [],
	options,
	onChange,
	placeholder = 'Select options...',
	searchPlaceholder = 'Search options...',
}) => {
	const [isOpen, setIsOpen] = useState(false);

	const selectedOptions = options.filter((option) => value.includes(option.value));

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button variant='outline' size='sm' className='h-8 w-full justify-start font-normal'>
					{value.length === 0 ? (
						<span className='truncate text-sm'>{placeholder}</span>
					) : (
						<Chip
							label={value.length > 1 ? `${value.length} selected` : selectedOptions[0]?.label}
							className='truncate bg-muted rounded-md'
						/>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align='start' className='w-48 p-0'>
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>No options found.</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.value}
									onSelect={() => {
										const newValue = value.includes(option.value) ? value.filter((v) => v !== option.value) : [...value, option.value];
										onChange(newValue);
									}}>
									<span className='truncate'>{option.label}</span>
									<Check className={cn('ml-auto h-4 w-4', value.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

export default FilterMultiSelect;
