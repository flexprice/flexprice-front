'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';

interface DatePickerProps {
	date: Date | undefined;
	setDate: (date: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	label?: string;
	minDate?: Date;
	maxDate?: Date;
	className?: string;
}

const DatePicker = ({
	date,
	setDate,
	placeholder = 'Pick a date',
	disabled,
	label: title,
	minDate,
	maxDate,
	className,
}: DatePickerProps) => {
	const [open, setopen] = useState(false);
	return (
		<Popover open={open} onOpenChange={setopen}>
			<PopoverTrigger className='' disabled={disabled}>
				{title && <div className='w-full text-start text-sm text-muted-foreground mb-1'>{title}</div>}
				<Button
					variant={'outline'}
					className={cn('min-w-[240px] h-10 justify-start text-left font-normal py-1', !date && 'text-muted-foreground', className)}>
					<CalendarIcon className='mr-2 h-4 w-4' />
					{date ? format(date, 'PPP') : <span>{placeholder}</span>} {/* Use placeholder */}
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-auto p-0' align='start'>
				<Calendar
					disabled={disabled}
					mode='single'
					selected={date}
					onSelect={(date) => {
						setDate(date);
						setopen(false);
					}}
					initialFocus
					fromDate={minDate}
					toDate={maxDate}
				/>
			</PopoverContent>
		</Popover>
	);
};

export default DatePicker;
