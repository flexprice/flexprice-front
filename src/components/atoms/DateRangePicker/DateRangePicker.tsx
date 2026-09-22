import { useCallback, useEffect, useState } from 'react';
import { CalendarIcon } from 'lucide-react';
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

	const handleClear = useCallback(() => {
		setSelectedRange(undefined);
		onChange({ startDate: undefined, endDate: undefined });
	}, [onChange]);

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
			{/* The trigger is the Button itself. PopoverTrigger renders its own <button>,
			    so wrapping this one put a button inside a button — invalid HTML, two tab
			    stops, and the popup semantics on the outer element rather than the one
			    that takes focus. The wrapper below keeps popoverTriggerClassName on the
			    outermost box, so `w-full` and `[&_button]:…` selectors from callers land
			    exactly where they did; inline-block preserves the shrink-to-fit sizing
			    the <button> had. */}
			<div className={cn('inline-block', popoverTriggerClassName)}>
				<div className='flex flex-col '>
					{title && <div className={cn('text-sm font-medium mb-1 w-full text-start', labelClassName)}>{title}</div>}
					<PopoverTrigger asChild disabled={disabled}>
						<Button
							variant='outline'
							className={cn(
								' justify-start text-start font-normal !h-10',
								!selectedRange?.from || !selectedRange?.to
									? 'text-muted-foreground opacity-70 hover:text-muted-foreground'
									: 'text-content-black',
								!className && 'w-[240px]',
								'transition-all duration-300 ease-in-out',
								className,
							)}>
							<CalendarIcon className='mr-0 h-4 w-4 shrink-0' />
							{/* min-w-0 lets the flex item shrink so a long range ellipsizes instead of widening the trigger */}
							<span className='min-w-0 truncate'>{displayLabel}</span>
						</Button>
					</PopoverTrigger>
				</div>
			</div>

			<PopoverContent className={cn('w-auto flex gap-4 p-2', popoverClassName, popoverContentClassName)} align='start'>
				<Calendar
					disabled={disabled || (dateBounds.length ? dateBounds : undefined)}
					mode='range'
					// Clicking an already-selected day must not clear the selection — clearing
					// only happens through the explicit footer action below.
					required
					selected={displayRange}
					onSelect={handleSelect}
					startMonth={minDate}
					endMonth={maxDate}
					defaultMonth={currentMonth}
					numberOfMonths={2}
					timezone={timezone}
					onTimezoneChange={handleTimezoneChange}
					onClear={selectedRange?.from && selectedRange?.to ? handleClear : undefined}
				/>
			</PopoverContent>
		</Popover>
	);
};

export default DateRangePicker;
