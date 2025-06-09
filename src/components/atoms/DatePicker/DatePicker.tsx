'use client';

import { useCallback, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
	date: Date | undefined;
	setDate: (date: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	label?: string;
	minDate?: Date;
	maxDate?: Date;
	className?: string;
	labelClassName?: string;
	popoverClassName?: string;
	popoverTriggerClassName?: string;
	popoverContentClassName?: string;
}

const DatePicker = ({
	date,
	setDate,
	placeholder = 'Pick a date',
	disabled = false,
	label,
	minDate,
	maxDate,
	className,
	labelClassName,
	popoverClassName,
	popoverTriggerClassName,
	popoverContentClassName,
}: DatePickerProps) => {
	const [open, setOpen] = useState(false);

	const handleSelect = useCallback(
		(selected: Date | undefined) => {
			setDate(selected);
			setOpen(false);
		},
		[setDate],
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger className={popoverTriggerClassName} disabled={disabled}>
				{label && <div className={cn('mb-1 w-full text-start text-sm text-muted-foreground', labelClassName)}>{label}</div>}
				<Button
					variant='outline'
					className={cn('min-w-[240px] h-10 justify-start text-left font-normal py-1', !date && 'text-muted-foreground', className)}
					disabled={disabled}>
					<CalendarIcon className='mr-2 h-4 w-4' />
					{date ? format(date, 'PPP') : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className={cn('w-auto p-0', popoverClassName, popoverContentClassName)} align='start'>
				<Calendar
					mode='single'
					disabled={disabled}
					selected={date}
					onSelect={handleSelect}
					initialFocus
					fromDate={minDate}
					toDate={maxDate}
				/>
			</PopoverContent>
		</Popover>
	);
};

export default DatePicker;
