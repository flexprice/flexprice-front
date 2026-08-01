'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Calendar, Popover, PopoverContent, PopoverTrigger } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CalendarTimezone } from '@/components/ui/calendar';
import {
	formatDateTimeInZone,
	getCalendarDayInZone,
	getTimeInZone,
	dateTimeInZone,
	convertDateTimeToTimezone,
	toCalendarDisplayDate,
	type DateTimezone,
} from '@/utils/common/format_date';

interface Props {
	date?: Date | undefined;
	setDate: (date: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	title?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const DateTimePicker: React.FC<Props> = ({ date, setDate, disabled, placeholder, title }) => {
	const { t } = useTranslation('common');
	const defaultPlaceholder = t('dateTime.placeholderFormat');
	const [isOpen, setIsOpen] = React.useState(false);
	const [timezone, setTimezone] = React.useState<CalendarTimezone>('local');
	const tz = timezone as DateTimezone;

	const timeInZone = date ? getTimeInZone(date, tz) : null;
	const [hourInput, setHourInput] = React.useState(timeInZone ? pad(timeInZone.hours) : '');
	const [minuteInput, setMinuteInput] = React.useState(timeInZone ? pad(timeInZone.minutes) : '');

	// Sync inputs when date or timezone changes externally
	React.useEffect(() => {
		if (!date) {
			setHourInput('');
			setMinuteInput('');
			return;
		}
		const zt = getTimeInZone(date, tz);
		setHourInput(pad(zt.hours));
		setMinuteInput(pad(zt.minutes));
	}, [date, tz]);

	const applyTime = React.useCallback(
		(h: number, m: number) => {
			if (!date) return;
			const { year, month, date: d } = getCalendarDayInZone(date, tz);
			setDate(dateTimeInZone(year, month, d, h, m, 0, tz));
		},
		[date, tz, setDate],
	);

	const handleDateSelect = React.useCallback(
		(selectedDate: Date | undefined) => {
			if (!selectedDate) return;
			const y = selectedDate.getFullYear();
			const mo = selectedDate.getMonth();
			const d = selectedDate.getDate();
			const h = Math.min(23, Math.max(0, parseInt(hourInput) || 0));
			const m = Math.min(59, Math.max(0, parseInt(minuteInput) || 0));
			setDate(dateTimeInZone(y, mo, d, h, m, 0, tz));
		},
		[hourInput, minuteInput, tz, setDate],
	);

	const handleHourBlur = React.useCallback(() => {
		const h = Math.min(23, Math.max(0, parseInt(hourInput) || 0));
		setHourInput(pad(h));
		applyTime(h, parseInt(minuteInput) || 0);
	}, [hourInput, minuteInput, applyTime]);

	const handleMinuteBlur = React.useCallback(() => {
		const m = Math.min(59, Math.max(0, parseInt(minuteInput) || 0));
		setMinuteInput(pad(m));
		applyTime(parseInt(hourInput) || 0, m);
	}, [hourInput, minuteInput, applyTime]);

	const handleTimezoneChange = React.useCallback(
		(newTz: CalendarTimezone) => {
			if (date) {
				setDate(convertDateTimeToTimezone(date, tz, newTz as DateTimezone));
			}
			setTimezone(newTz);
		},
		[date, tz, setDate],
	);

	const displayDate = date ? toCalendarDisplayDate(date, tz) : undefined;
	const displayLabel = date ? formatDateTimeInZone(date, tz) : (placeholder ?? defaultPlaceholder);

	return (
		<div className='space-y-1'>
			{title && <div className='text-sm font-medium text-content-zinc'>{title}</div>}
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<button
						type='button'
						disabled={disabled}
						className={cn(
							'flex w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm text-start',
							'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
							'disabled:cursor-not-allowed disabled:opacity-50',
							date && 'border-primary-foreground',
							disabled && 'bg-surface-shell',
							!date && 'text-muted-foreground',
						)}>
						<CalendarIcon className='h-4 w-4 shrink-0 text-muted-foreground' />
						<span>{displayLabel}</span>
					</button>
				</PopoverTrigger>
				<PopoverContent className='w-auto p-0' align='start' onInteractOutside={() => setIsOpen(false)}>
					<Calendar mode='single' selected={displayDate} onSelect={handleDateSelect} autoFocus />
					{/* Time + timezone row — no nested browser picker */}
					<div className='border-t border-border px-3 py-3 flex items-center gap-2'>
						<span className='text-xs text-muted-foreground font-medium w-10'>{t('dateTime.timeLabel')}</span>
						<div className='flex items-center gap-1 flex-1'>
							<input
								type='text'
								inputMode='numeric'
								maxLength={2}
								value={hourInput}
								onChange={(e) => setHourInput(e.target.value.replace(/\D/g, ''))}
								onBlur={handleHourBlur}
								onFocus={(e) => e.target.select()}
								placeholder={t('dateTime.hourPlaceholder')}
								className={cn(
									'w-10 h-8 rounded-md border border-input bg-transparent text-center text-sm',
									'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
								)}
							/>
							<span className='text-muted-foreground font-semibold'>:</span>
							<input
								type='text'
								inputMode='numeric'
								maxLength={2}
								value={minuteInput}
								onChange={(e) => setMinuteInput(e.target.value.replace(/\D/g, ''))}
								onBlur={handleMinuteBlur}
								onFocus={(e) => e.target.select()}
								placeholder={t('dateTime.minutePlaceholder')}
								className={cn(
									'w-10 h-8 rounded-md border border-input bg-transparent text-center text-sm',
									'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
								)}
							/>
						</div>
						<Select value={timezone} onValueChange={(v) => handleTimezoneChange(v as CalendarTimezone)}>
							<SelectTrigger className='h-8 w-[80px] text-xs border-input'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align='end'>
								<SelectItem value='local' className='text-xs'>
									{t('dateTime.timezoneLocal')}
								</SelectItem>
								<SelectItem value='utc' className='text-xs'>
									{t('dateTime.timezoneUtc')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
};

export default DateTimePicker;
