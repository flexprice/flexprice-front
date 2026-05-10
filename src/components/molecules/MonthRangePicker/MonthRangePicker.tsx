import { useEffect, useRef, useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MonthYear {
	year: number;
	month: number; // 0-indexed (0 = Jan)
}

interface MonthRangePickerProps {
	from?: MonthYear;
	to?: MonthYear;
	onChange?: (range: { from?: MonthYear; to?: MonthYear }) => void;
	disabled?: boolean;
	placeholder?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonthYear(my?: MonthYear) {
	if (!my) return '';
	return `01/${String(my.month + 1).padStart(2, '0')}/${my.year}`;
}

function isSame(a?: MonthYear, b?: MonthYear) {
	return a && b && a.year === b.year && a.month === b.month;
}

function isBetween(my: MonthYear, from?: MonthYear, to?: MonthYear) {
	if (!from || !to) return false;
	const v = my.year * 12 + my.month;
	const f = from.year * 12 + from.month;
	const t = to.year * 12 + to.month;
	const [lo, hi] = f <= t ? [f, t] : [t, f];
	return v > lo && v < hi;
}

// Build ~10 years centred around today for the year list
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => THIS_YEAR - 4 + i);

/**
 * Month-range picker with scrollable year list and month grid.
 * Picking year + month navigates quickly across any span — no arrow-clicking needed.
 */
const MonthRangePicker: React.FC<MonthRangePickerProps> = ({ from, to, onChange, disabled, placeholder }) => {
	const [open, setOpen] = useState(false);
	const [activeField, setActiveField] = useState<'from' | 'to'>('from');
	const [viewYear, setViewYear] = useState(THIS_YEAR);
	const [draft, setDraft] = useState<{ from?: MonthYear; to?: MonthYear }>({ from, to });

	const panelRef = useRef<HTMLDivElement>(null);
	const yearListRef = useRef<HTMLDivElement>(null);

	// Scroll active year into view
	useEffect(() => {
		if (open && yearListRef.current) {
			const el = yearListRef.current.querySelector('[data-active="true"]');
			el?.scrollIntoView({ block: 'center' });
		}
	}, [open]);

	// Close on outside click
	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [open]);

	const openFor = (field: 'from' | 'to') => {
		if (disabled) return;
		setActiveField(field);
		setViewYear(field === 'from' ? (draft.from?.year ?? THIS_YEAR) : (draft.to?.year ?? THIS_YEAR));
		setOpen(true);
	};

	const pickMonth = (month: number) => {
		const picked: MonthYear = { year: viewYear, month };
		const next = { ...draft, [activeField]: picked };
		setDraft(next);
		onChange?.(next);
		if (activeField === 'from') {
			setActiveField('to');
			setViewYear(draft.to?.year ?? THIS_YEAR);
		} else {
			setOpen(false);
		}
	};

	const monthState = (month: number): 'from' | 'to' | 'between' | 'none' => {
		const my: MonthYear = { year: viewYear, month };
		if (isSame(my, draft.from)) return 'from';
		if (isSame(my, draft.to)) return 'to';
		if (isBetween(my, draft.from, draft.to)) return 'between';
		return 'none';
	};

	return (
		<div className='relative inline-block' ref={panelRef}>
			{/* Trigger */}
			<div
				className={cn(
					'flex items-center gap-2 px-3 py-2 rounded-[8px] border border-gray-200 bg-white text-sm cursor-pointer select-none',
					disabled && 'opacity-50 cursor-not-allowed',
					open && 'ring-1 ring-[#3293D9] border-[#3293D9]',
				)}>
				<button
					type='button'
					disabled={disabled}
					onClick={() => openFor('from')}
					className={cn(
						'flex items-center gap-1.5 px-2 py-0.5 rounded',
						activeField === 'from' && open ? 'text-[#3293D9]' : 'text-gray-700',
					)}>
					<CalendarIcon size={14} className='shrink-0' />
					<span className={draft.from ? 'text-gray-900' : 'text-gray-400'}>
						{draft.from ? formatMonthYear(draft.from) : (placeholder ?? 'Start month')}
					</span>
				</button>

				<span className='text-gray-400'>to</span>

				<button
					type='button'
					disabled={disabled}
					onClick={() => openFor('to')}
					className={cn(
						'flex items-center gap-1.5 px-2 py-0.5 rounded',
						activeField === 'to' && open ? 'text-[#3293D9]' : 'text-gray-700',
					)}>
					<span className={draft.to ? 'text-gray-900' : 'text-gray-400'}>{draft.to ? formatMonthYear(draft.to) : 'End month'}</span>
					<CalendarIcon size={14} className='shrink-0' />
				</button>
			</div>

			{/* Dropdown */}
			{open && (
				<div className='absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-[10px] shadow-xl w-[320px] overflow-hidden'>
					{/* Header */}
					<div className='flex items-center justify-between px-4 py-3 border-b border-gray-100'>
						<span className='text-sm font-semibold text-gray-800'>
							{MONTHS[/* any month to show context */ new Date().getMonth()]} {viewYear}
						</span>
						<div className='flex items-center gap-1 text-xs text-gray-500'>
							<span>Picking: </span>
							<span className='font-medium text-[#3293D9]'>{activeField === 'from' ? 'Start' : 'End'}</span>
						</div>
					</div>

					<div className='flex'>
						{/* Year list */}
						<div ref={yearListRef} className='w-24 border-r border-gray-100 max-h-52 overflow-y-auto py-1'>
							{YEARS.map((y) => (
								<button
									key={y}
									data-active={y === viewYear}
									onClick={() => setViewYear(y)}
									className={cn(
										'w-full text-left px-4 py-2 text-sm transition-colors',
										y === viewYear ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50',
									)}>
									{y}
								</button>
							))}
						</div>

						{/* Month grid */}
						<div className='flex-1 p-3'>
							<div className='grid grid-cols-3 gap-2'>
								{MONTHS.map((label, idx) => {
									const state = monthState(idx);
									return (
										<button
											key={label}
											onClick={() => pickMonth(idx)}
											className={cn(
												'py-2 rounded-[6px] text-sm font-medium transition-all',
												state === 'from' || state === 'to'
													? 'bg-[#3293D9] text-white'
													: state === 'between'
														? 'bg-[#E5F0FF] text-[#3293D9]'
														: 'text-gray-700 hover:bg-gray-100',
												state === 'to' && 'ring-2 ring-[#3293D9] ring-offset-1 bg-[#E5F0FF] text-[#3293D9]',
											)}>
											{label}
										</button>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default MonthRangePicker;
