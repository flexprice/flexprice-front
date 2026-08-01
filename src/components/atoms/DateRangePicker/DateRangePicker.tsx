import { useCallback, useEffect, useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '@/components/ui';
import type { CalendarTimezone } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { startOfMonth } from 'date-fns';
import {
	formatDateInZone,
	startOfDayInZone,
	convertDateToTimezone,
	toCalendarDisplayDate,
	type DateTimezone,
} from '@/utils/common/format_date';

interface Props {
	startDate?: Date;
	endDate?: Date;
	placeholder?: string;
	disabled?: boolean;
	title?: string;
	minDate?: Date;
	maxDate?: Date;
	onChange: (dates: { startDate?: Date; endDate?: Date }) => void;
	className?: string;
	labelClassName?: string;
	popoverClassName?: string;
	popoverTriggerClassName?: string;
	popoverContentClassName?: string;
}

const DateRangePicker = ({
	startDate,
	endDate,
	onChange,
	placeholder = 'Select Range',
	disabled,
	title,
	minDate,
	maxDate,
	className,
	labelClassName,
	popoverClassName,
	popoverTriggerClassName,
	popoverContentClassName,
}: Props) => {
	const [open, setOpen] = useState(false);
	const [selectedRange, setSelectedRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
	const [timezone, setTimezone] = useState<CalendarTimezone>('local');

	const currentMonth = startOfMonth(new Date());

	const toRangeInZone = useCallback(
		(from: Date, to: Date) => {
			const fromValue = timezone === 'utc' ? startOfDayInZone(from.getFullYear(), from.getMonth(), from.getDate(), 'utc') : from;
			const toValue = timezone === 'utc' ? startOfDayInZone(to.getFullYear(), to.getMonth(), to.getDate(), 'utc') : to;
			return { from: fromValue, to: toValue };
		},
		[timezone],
	);

	const handleSelect = useCallback(
		(date: { from?: Date; to?: Date } | undefined) => {
			if (!date) return;
			if (date.from && date.to) {
				const range = toRangeInZone(date.from, date.to);
				setSelectedRange(range);
				onChange({ startDate: range.from, endDate: range.to });
			} else {
				onChange({ startDate: date.from, endDate: date.to });
			}
		},
		[onChange, toRangeInZone],
	);

	const handleTimezoneChange = useCallback(
		(newTz: CalendarTimezone) => {
			if (selectedRange?.from && selectedRange?.to) {
				const fromConverted = convertDateToTimezone(selectedRange.from, timezone as DateTimezone, newTz as DateTimezone);
				const toConverted = convertDateToTimezone(selectedRange.to, timezone as DateTimezone, newTz as DateTimezone);
				setSelectedRange({ from: fromConverted, to: toConverted });
				onChange({ startDate: fromConverted, endDate: toConverted });
			}
			setTimezone(newTz);
		},
		[selectedRange, timezone, onChange],
	);

	useEffect(() => {
		if (startDate && endDate) {
			setSelectedRange({ from: startDate, to: endDate });
		} else {
			setSelectedRange(undefined);
		}
	}, [startDate, endDate]);

	const displayRange =
		selectedRange?.from && selectedRange?.to
			? {
					from: toCalendarDisplayDate(selectedRange.from, timezone as DateTimezone),
					to: toCalendarDisplayDate(selectedRange.to, timezone as DateTimezone),
				}
			: undefined;

	const displayLabel =
		selectedRange?.from && selectedRange?.to
			? `${formatDateInZone(selectedRange.from, timezone as DateTimezone)} - ${formatDateInZone(selectedRange.to, timezone as DateTimezone)}`
			: placeholder;

	const dateBounds = [...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])];

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger className={popoverTriggerClassName} disabled={disabled}>
				<div className='flex flex-col '>
					{title && <div className={cn('text-sm font-medium mb-1 w-full text-start', labelClassName)}>{title}</div>}
					<div className='relative'>
						<Button
							variant='outline'
							className={cn(
								' justify-start text-start font-normal !h-10',
								!selectedRange?.from || !selectedRange?.to
									? 'text-muted-foreground opacity-70 hover:text-muted-foreground'
									: 'text-content-black',
								!className && (selectedRange?.from && selectedRange?.to ? 'w-[260px]' : 'w-[240px]'),
								'transition-all duration-300 ease-in-out',
								className,
							)}>
							<CalendarIcon className='mr-0 h-4 w-4' />
							<span>{displayLabel}</span>
						</Button>
						{selectedRange?.from && selectedRange?.to && (
							<X
								className='ms-2 h-4 w-4 absolute right-2 top-[12px] cursor-pointer'
								onClick={(e) => {
									e.stopPropagation();
									setSelectedRange(undefined);
									onChange({ startDate: undefined, endDate: undefined });
								}}
							/>
						)}
					</div>
				</div>
			</PopoverTrigger>

			<PopoverContent className={cn('w-auto flex gap-4 p-2', popoverClassName, popoverContentClassName)} align='start'>
				<Calendar
					disabled={disabled || (dateBounds.length ? dateBounds : undefined)}
					mode='range'
					selected={displayRange}
					onSelect={handleSelect}
					startMonth={minDate}
					endMonth={maxDate}
					defaultMonth={currentMonth}
					numberOfMonths={2}
					timezone={timezone}
					onTimezoneChange={handleTimezoneChange}
				/>
			</PopoverContent>
		</Popover>
	);
};

export default DateRangePicker;
