import { useState, useRef, useEffect } from 'react';
import { CalendarDays, CalendarIcon, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui';
import { cn } from '@/lib/utils';
import { format, isSameDay, isWithinInterval, isAfter, isBefore, startOfDay, addMonths, subMonths } from 'date-fns';

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

const DAYS_HEADER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getMonthGrid(viewMonth: Date): { date: Date; isCurrentMonth: boolean }[] {
	const year = viewMonth.getFullYear();
	const month = viewMonth.getMonth();
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const days: { date: Date; isCurrentMonth: boolean }[] = [];

	for (let i = 0; i < firstDay.getDay(); i++) {
		days.push({ date: new Date(year, month, i - firstDay.getDay() + 1), isCurrentMonth: false });
	}
	for (let d = 1; d <= lastDay.getDate(); d++) {
		days.push({ date: new Date(year, month, d), isCurrentMonth: true });
	}
	const remaining = (7 - (days.length % 7)) % 7;
	for (let i = 1; i <= remaining; i++) {
		days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
	}
	return days;
}

interface SingleCalendarProps {
	selected?: Date;
	onSelect: (date: Date) => void;
	onClear: () => void;
	minDate?: Date;
	maxDate?: Date;
	rangeStart?: Date;
	rangeEnd?: Date;
	popoverContentClassName?: string;
}

const SingleCalendar = ({
	selected,
	onSelect,
	onClear,
	minDate,
	maxDate,
	rangeStart,
	rangeEnd,
	popoverContentClassName,
}: SingleCalendarProps) => {
	const [viewMonth, setViewMonth] = useState<Date>(() => selected || new Date());
	const [showMonthPicker, setShowMonthPicker] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const today = startOfDay(new Date());
	const currentYear = today.getFullYear();
	const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

	useEffect(() => {
		if (showMonthPicker && scrollRef.current) {
			const el = scrollRef.current.querySelector('[data-active-year="true"]');
			el?.scrollIntoView({ block: 'start', behavior: 'instant' });
		}
	}, [showMonthPicker]);

	const days = getMonthGrid(viewMonth);

	const isSelected = (d: Date) => !!selected && isSameDay(d, selected);
	const isToday = (d: Date) => isSameDay(d, today);
	const isDisabled = (d: Date) =>
		(!!minDate && isBefore(startOfDay(d), startOfDay(minDate))) || (!!maxDate && isAfter(startOfDay(d), startOfDay(maxDate)));
	const isInRange = (d: Date) => {
		if (!rangeStart || !rangeEnd) return false;
		try {
			return isWithinInterval(startOfDay(d), { start: startOfDay(rangeStart), end: startOfDay(rangeEnd) });
		} catch {
			return false;
		}
	};

	return (
		<div className={cn('w-[268px] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden', popoverContentClassName)}>
			{!showMonthPicker ? (
				<>
					{/* Header */}
					<div className='flex items-center justify-between px-4 pt-3 pb-1'>
						<button
							onClick={() => setShowMonthPicker(true)}
							className='flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-gray-500 transition-colors'>
							{format(viewMonth, 'MMM yyyy')}
							<ChevronDown className='h-3 w-3' />
						</button>
						<div className='flex gap-0.5'>
							<button
								onClick={() => setViewMonth(subMonths(viewMonth, 1))}
								className='p-1 hover:bg-gray-100 rounded text-gray-500 text-base leading-none'
								aria-label='Previous month'>
								↑
							</button>
							<button
								onClick={() => setViewMonth(addMonths(viewMonth, 1))}
								className='p-1 hover:bg-gray-100 rounded text-gray-500 text-base leading-none'
								aria-label='Next month'>
								↓
							</button>
						</div>
					</div>

					{/* Day headers */}
					<div className='grid grid-cols-7 px-3 mt-1'>
						{DAYS_HEADER.map((d, i) => (
							<div key={i} className='h-8 flex items-center justify-center text-xs text-gray-400 font-medium'>
								{d}
							</div>
						))}
					</div>

					{/* Day grid */}
					<div className='grid grid-cols-7 px-3 pb-2'>
						{days.map(({ date, isCurrentMonth }, idx) => {
							const sel = isSelected(date);
							const tod = isToday(date);
							const dis = isDisabled(date);
							const inRange = isInRange(date);

							return (
								<button
									key={idx}
									type='button'
									disabled={dis || !isCurrentMonth}
									onClick={() => !dis && isCurrentMonth && onSelect(date)}
									className={cn(
										'h-8 flex items-center justify-center text-sm rounded transition-colors',
										!isCurrentMonth && 'text-gray-300 cursor-default',
										isCurrentMonth && !sel && !inRange && 'text-gray-700 hover:bg-gray-100',
										inRange && !sel && 'bg-blue-50 text-blue-700 rounded-none',
										sel && 'bg-blue-600 text-white !rounded-full hover:bg-blue-700',
										tod && !sel && 'ring-1 ring-gray-400',
										dis && 'opacity-40 cursor-not-allowed',
									)}>
									{format(date, 'd')}
								</button>
							);
						})}
					</div>

					{/* Footer */}
					<div className='flex items-center justify-between px-4 py-2 border-t border-gray-100'>
						<button onClick={onClear} className='text-sm text-blue-500 hover:text-blue-700 font-medium transition-colors'>
							Clear
						</button>
						<button
							onClick={() => {
								onSelect(today);
								setViewMonth(today);
							}}
							className='text-sm text-blue-500 hover:text-blue-700 font-medium transition-colors'>
							Today
						</button>
					</div>
				</>
			) : (
				/* Year/Month picker */
				<>
					<div className='px-4 pt-3 pb-2 border-b border-gray-100'>
						<button
							onClick={() => setShowMonthPicker(false)}
							className='flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-gray-500 transition-colors'>
							{format(viewMonth, 'MMM yyyy')}
							<ChevronDown className='h-3 w-3 rotate-180' />
						</button>
					</div>
					<div ref={scrollRef} className='overflow-y-auto max-h-[280px]'>
						{years.map((year) => {
							const isActiveYear = year === viewMonth.getFullYear();
							return (
								<div key={year}>
									<div
										data-active-year={isActiveYear}
										className='px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-100'>
										{year}
									</div>
									<div className='grid grid-cols-4 gap-1 px-3 py-2'>
										{MONTHS_SHORT.map((month, idx) => {
											const isActive = isActiveYear && idx === viewMonth.getMonth();
											return (
												<button
													key={month}
													type='button'
													onClick={() => {
														setViewMonth(new Date(year, idx, 1));
														setShowMonthPicker(false);
													}}
													className={cn(
														'py-1.5 text-sm rounded text-center transition-colors',
														isActive ? 'bg-blue-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100',
													)}>
													{month}
												</button>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>
				</>
			)}
		</div>
	);
};

const DateRangePicker = ({
	startDate,
	endDate,
	onChange,
	placeholder: _placeholder = 'Select date range',
	disabled,
	title: _title,
	minDate,
	maxDate,
	className,
	labelClassName: _labelClassName,
	popoverClassName: _popoverClassName,
	popoverTriggerClassName,
	popoverContentClassName,
}: Props) => {
	const [startOpen, setStartOpen] = useState(false);
	const [endOpen, setEndOpen] = useState(false);

	const handleStartSelect = (date: Date) => {
		const newStart = startOfDay(date);
		// If end is before new start, clear end
		const newEnd = endDate && !isBefore(startOfDay(endDate), newStart) ? endDate : undefined;
		onChange({ startDate: newStart, endDate: newEnd });
		setStartOpen(false);
	};

	const handleEndSelect = (date: Date) => {
		const newEnd = startOfDay(date);
		// If start is after new end, clear start
		const newStart = startDate && !isAfter(startOfDay(startDate), newEnd) ? startDate : undefined;
		onChange({ startDate: newStart, endDate: newEnd });
		setEndOpen(false);
	};

	return (
		<div
			className={cn(
				'inline-flex items-center border border-gray-300 rounded-lg bg-white h-9 px-2 gap-1 text-sm',
				popoverTriggerClassName,
				className,
			)}>
			{/* Start date */}
			<Popover open={startOpen} onOpenChange={disabled ? undefined : setStartOpen}>
				<PopoverTrigger asChild>
					<button
						type='button'
						disabled={disabled}
						className='flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors px-1 py-0.5 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'>
						<CalendarDays className='h-4 w-4 text-blue-400 shrink-0' />
						<span className={cn('text-sm', !startDate && 'text-gray-400')}>
							{startDate ? format(startDate, 'MM/dd/yyyy') : 'Start date'}
						</span>
					</button>
				</PopoverTrigger>
				<PopoverContent className='p-0 w-auto border-0 shadow-none bg-transparent' side='left' align='center' sideOffset={8}>
					<SingleCalendar
						selected={startDate}
						onSelect={handleStartSelect}
						onClear={() => onChange({ startDate: undefined, endDate })}
						minDate={minDate}
						maxDate={maxDate ? (endDate && isBefore(endDate, maxDate) ? endDate : maxDate) : endDate}
						rangeStart={startDate}
						rangeEnd={endDate}
						popoverContentClassName={popoverContentClassName}
					/>
				</PopoverContent>
			</Popover>

			{/* Separator */}
			<div className='flex items-center gap-1 text-gray-400 px-0.5 shrink-0'>
				<CalendarIcon className='h-3.5 w-3.5' />
				<span className='text-xs'>to</span>
			</div>

			{/* End date */}
			<Popover open={endOpen} onOpenChange={disabled ? undefined : setEndOpen}>
				<PopoverTrigger asChild>
					<button
						type='button'
						disabled={disabled}
						className='flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors px-1 py-0.5 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'>
						<span className={cn('text-sm', !endDate && 'text-gray-400')}>{endDate ? format(endDate, 'MM/dd/yyyy') : 'End date'}</span>
						<CalendarIcon className='h-3.5 w-3.5 text-gray-400 shrink-0' />
					</button>
				</PopoverTrigger>
				<PopoverContent className='p-0 w-auto border-0 shadow-none bg-transparent' side='right' align='center' sideOffset={8}>
					<SingleCalendar
						selected={endDate}
						onSelect={handleEndSelect}
						onClear={() => onChange({ startDate, endDate: undefined })}
						minDate={startDate || minDate}
						maxDate={maxDate}
						rangeStart={startDate}
						rangeEnd={endDate}
						popoverContentClassName={popoverContentClassName}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
};

export default DateRangePicker;
