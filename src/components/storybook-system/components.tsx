import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
	Activity,
	AlertTriangle,
	Archive,
	BarChart3,
	Calendar,
	Check,
	CheckCircle2,
	ChevronDown,
	ChevronsUpDown,
	CircleDollarSign,
	Clock3,
	FileText,
	Home,
	LoaderCircle,
	MoreHorizontal,
	PackageOpen,
	Search,
	Settings,
	TrendingDown,
	TrendingUp,
	Users,
	X,
	XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BillingStatus, StatusTone, formatCurrency, getStatusLabel, getStatusTone } from './utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonClasses: Record<ButtonVariant, string> = {
	primary: 'border-[#092E44] bg-[#092E44] text-white hover:bg-[#123B52]',
	secondary: 'border-[#D4D4D8] bg-white text-[#18181B] hover:bg-[#F4F4F5]',
	ghost: 'border-transparent bg-transparent text-[#18181B] hover:bg-[#F4F4F5]',
	danger: 'border-[#DC2626] bg-[#DC2626] text-white hover:bg-[#B91C1C]',
};

const buttonSizes: Record<ButtonSize, string> = {
	sm: 'h-8 px-3 text-xs',
	md: 'h-9 px-4 text-sm',
	lg: 'h-10 px-5 text-sm',
};

export interface FlexButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	icon?: React.ReactNode;
}

/**
 * FlexButton is the primary action primitive for the Storybook design system.
 * Use `variant` for intent, `size` for density, and `loading` when an async
 * action is in flight so the button remains disabled and stable.
 */
export const FlexButton = React.forwardRef<HTMLButtonElement, FlexButtonProps>(
	({ children, className, disabled, icon, loading = false, size = 'md', variant = 'primary', ...props }, ref) => (
		<button
			ref={ref}
			className={cn(
				'inline-flex items-center justify-center gap-2 rounded-[6px] border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
				buttonClasses[variant],
				buttonSizes[size],
				className,
			)}
			disabled={disabled || loading}
			type='button'
			{...props}>
			{loading ? <LoaderCircle className='size-4 animate-spin' aria-hidden='true' /> : icon}
			<span>{children}</span>
		</button>
	),
);
FlexButton.displayName = 'FlexButton';

const toneClasses: Record<StatusTone, string> = {
	success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
	neutral: 'border-zinc-200 bg-zinc-50 text-zinc-700',
	warning: 'border-amber-200 bg-amber-50 text-amber-800',
	danger: 'border-red-200 bg-red-50 text-red-700',
	info: 'border-sky-200 bg-sky-50 text-sky-700',
};

export interface StatusChipProps {
	status: BillingStatus;
	children?: React.ReactNode;
	className?: string;
	showDot?: boolean;
}

/**
 * StatusChip maps billing statuses to consistent labels and colour tones.
 * It is suitable for plan, invoice, and subscription status fields in tables.
 */
export const StatusChip = ({ children, className, showDot = true, status }: StatusChipProps) => {
	const tone = getStatusTone(status);

	return (
		<span className={cn('inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-0.5 text-xs font-medium', toneClasses[tone], className)}>
			{showDot && <span className='size-1.5 rounded-full bg-current' aria-hidden='true' />}
			{children}
			{getStatusLabel(status)}
		</span>
	);
};

export interface FieldInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> {
	error?: string;
	label?: string;
	prefix?: React.ReactNode;
	suffix?: React.ReactNode;
}

/**
 * FieldInput wraps a native input with FlexPrice label, prefix/suffix, help,
 * disabled, numeric, and validation styling for forms and filter bars.
 */
export const FieldInput = React.forwardRef<HTMLInputElement, FieldInputProps>(
	({ className, error, id, label, prefix, suffix, ...props }, ref) => {
		const inputId = id ?? React.useId();

		return (
			<label className='flex w-full flex-col gap-1 text-sm font-medium text-[#18181B]' htmlFor={inputId}>
				{label}
				<span
					className={cn(
						'flex h-9 items-center rounded-[6px] border bg-white px-3 text-sm ring-offset-background focus-within:border-[#18181B] focus-within:ring-2 focus-within:ring-ring/15',
						error ? 'border-red-500' : 'border-[#D4D4D8]',
						props.disabled && 'cursor-not-allowed bg-zinc-50 text-zinc-500',
						className,
					)}>
					{prefix && <span className='mr-2 text-zinc-500'>{prefix}</span>}
					<input
						ref={ref}
						id={inputId}
						className='min-w-0 flex-1 bg-transparent outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed'
						aria-invalid={Boolean(error)}
						{...props}
					/>
					{suffix && <span className='ml-2 text-zinc-500'>{suffix}</span>}
				</span>
				{error && <span className='text-xs font-normal text-red-600'>{error}</span>}
			</label>
		);
	},
);
FieldInput.displayName = 'FieldInput';

export interface SelectOption {
	label: string;
	value: string;
	description?: string;
}

export interface SelectDropdownProps {
	label?: string;
	options: SelectOption[];
	placeholder?: string;
	searchable?: boolean;
	value?: string;
	onValueChange?: (value: string) => void;
}

/**
 * SelectDropdown is a lightweight searchable single-select for Storybook demos.
 * Use it in filters where searchable plan, customer, or status picking is needed.
 */
export const SelectDropdown = ({ label, onValueChange, options, placeholder = 'Select option', searchable = false, value }: SelectDropdownProps) => {
	const [open, setOpen] = React.useState(false);
	const [query, setQuery] = React.useState('');
	const selected = options.find((option) => option.value === value);
	const filtered = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));

	return (
		<div className='relative w-full min-w-[220px] text-sm'>
			{label && <div className='mb-1 font-medium text-[#18181B]'>{label}</div>}
			<button
				type='button'
				className='flex h-9 w-full items-center justify-between rounded-[6px] border border-[#D4D4D8] bg-white px-3 text-left'
				aria-haspopup='listbox'
				aria-expanded={open}
				onClick={() => setOpen((current) => !current)}>
				<span className={selected ? 'text-[#18181B]' : 'text-zinc-400'}>{selected?.label ?? placeholder}</span>
				<ChevronDown className='size-4 text-zinc-500' aria-hidden='true' />
			</button>
			{open && (
				<div className='absolute z-20 mt-1 w-full overflow-hidden rounded-[6px] border border-[#D4D4D8] bg-white shadow-lg'>
					{searchable && (
						<div className='border-b border-zinc-200 p-2'>
							<FieldInput aria-label='Search options' placeholder='Search...' value={query} onChange={(event) => setQuery(event.target.value)} />
						</div>
					)}
					<div className='max-h-56 overflow-auto p-1' role='listbox'>
						{filtered.map((option) => (
							<button
								key={option.value}
								type='button'
								className='flex w-full items-start justify-between gap-3 rounded-[6px] px-2 py-2 text-left hover:bg-zinc-100'
								role='option'
								aria-selected={option.value === value}
								onClick={() => {
									onValueChange?.(option.value);
									setOpen(false);
									setQuery('');
								}}>
								<span>
									<span className='block font-medium text-[#18181B]'>{option.label}</span>
									{option.description && <span className='block text-xs text-zinc-500'>{option.description}</span>}
								</span>
								{option.value === value && <Check className='size-4 text-[#092E44]' aria-hidden='true' />}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export interface InfoTooltipProps {
	content: React.ReactNode;
	children: React.ReactNode;
	delayMs?: number;
}

/**
 * InfoTooltip reveals short contextual help after a configurable hover/focus delay.
 * It is intentionally small and should explain a metric, filter, or status rule.
 */
export const InfoTooltip = ({ children, content, delayMs = 250 }: InfoTooltipProps) => {
	const [visible, setVisible] = React.useState(false);
	const timeout = React.useRef<number>();
	const show = () => {
		timeout.current = window.setTimeout(() => setVisible(true), delayMs);
	};
	const hide = () => {
		window.clearTimeout(timeout.current);
		setVisible(false);
	};

	return (
		<span className='relative inline-flex' onBlur={hide} onFocus={show} onMouseEnter={show} onMouseLeave={hide}>
			{children}
			{visible && (
				<span role='tooltip' className='absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-[6px] bg-[#18181B] px-3 py-2 text-xs text-white shadow-lg'>
					{content}
				</span>
			)}
		</span>
	);
};

export interface LoadingStateProps {
	label?: string;
	size?: 'sm' | 'md' | 'lg';
}

/**
 * LoadingState renders a spinner with optional copy for pending table, metric,
 * or form states without changing the surrounding layout.
 */
export const LoadingState = ({ label = 'Loading', size = 'md' }: LoadingStateProps) => {
	const spinnerSize = size === 'sm' ? 'size-4' : size === 'lg' ? 'size-8' : 'size-6';

	return (
		<div className='inline-flex items-center gap-2 text-sm text-zinc-600' role='status'>
			<LoaderCircle className={cn('animate-spin text-[#092E44]', spinnerSize)} aria-hidden='true' />
			<span>{label}</span>
		</div>
	);
};

export interface MetricCardProps {
	label: string;
	value: string;
	trend?: number;
	helperText?: string;
}

/**
 * MetricCard shows a dashboard KPI with a value, trend direction, and short
 * contextual helper text for revenue, invoices, usage, and subscription metrics.
 */
export const MetricCard = ({ helperText, label, trend, value }: MetricCardProps) => {
	const positive = (trend ?? 0) >= 0;

	return (
		<section className='rounded-[6px] border border-zinc-200 bg-white p-4'>
			<div className='flex items-start justify-between gap-3'>
				<div>
					<p className='text-sm font-medium text-zinc-500'>{label}</p>
					<p className='mt-2 text-2xl font-semibold text-[#18181B]'>{value}</p>
				</div>
				{trend !== undefined && (
					<span className={cn('inline-flex items-center gap-1 rounded-[6px] px-2 py-1 text-xs font-medium', positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
						{positive ? <TrendingUp className='size-3.5' /> : <TrendingDown className='size-3.5' />}
						{Math.abs(trend)}%
					</span>
				)}
			</div>
			{helperText && <p className='mt-3 text-xs text-zinc-500'>{helperText}</p>}
		</section>
	);
};

export interface DataTableColumn<T> {
	key: keyof T;
	header: string;
	width?: number;
	sortable?: boolean;
	render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T extends { id: string }> {
	columns: DataTableColumn<T>[];
	rows: T[];
	emptyMessage?: string;
	loading?: boolean;
	page?: number;
	pageSize?: number;
	virtualized?: boolean;
	height?: number;
	rowEstimate?: number;
	dynamicRowHeight?: boolean;
	onSortChange?: (key: keyof T, direction: 'asc' | 'desc') => void;
}

const normaliseSortableValue = (value: unknown) => {
	if (typeof value === 'number') return value;
	if (value instanceof Date) return value.getTime();
	if (typeof value !== 'string') return String(value ?? '').toLowerCase();

	const trimmed = value.trim();
	const numeric = Number(trimmed.replace(/[$,₹€£%\s]/g, ''));
	return Number.isFinite(numeric) && /[\d]/.test(trimmed) ? numeric : trimmed.toLowerCase();
};

const compareSortableValues = (a: unknown, b: unknown) => {
	const aValue = normaliseSortableValue(a);
	const bValue = normaliseSortableValue(b);

	if (typeof aValue === 'number' && typeof bValue === 'number') {
		return aValue - bValue;
	}

	return String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' });
};

/**
 * DataTable is a sortable, paginated billing table with loading, empty, and
 * optional virtualized rendering for thousands of customers or invoices.
 */
export const DataTable = <T extends { id: string }>({
	columns,
	dynamicRowHeight = true,
	emptyMessage = 'No records found',
	height = 420,
	loading = false,
	onSortChange,
	page = 1,
	pageSize = 8,
	rowEstimate = 44,
	rows,
	virtualized = false,
}: DataTableProps<T>) => {
	const [sort, setSort] = React.useState<{ key: keyof T; direction: 'asc' | 'desc' }>();
	const parentRef = React.useRef<HTMLDivElement>(null);
	const sortedRows = React.useMemo(() => {
		if (!sort) return rows;
		return [...rows].sort((a, b) => {
			const result = compareSortableValues(a[sort.key], b[sort.key]);
			return sort.direction === 'asc' ? result : -result;
		});
	}, [rows, sort]);
	const visibleRows = virtualized ? sortedRows : sortedRows.slice((page - 1) * pageSize, page * pageSize);
	const rowVirtualizer = useVirtualizer({
		count: sortedRows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => rowEstimate,
		overscan: 10,
		measureElement:
			dynamicRowHeight && typeof window !== 'undefined' && !navigator.userAgent.includes('Firefox')
				? (element) => element?.getBoundingClientRect().height
				: undefined,
	});

	const updateSort = (column: DataTableColumn<T>) => {
		if (!column.sortable) return;

		const direction = sort?.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc';
		setSort({ key: column.key, direction });
		onSortChange?.(column.key, direction);
	};

	if (loading) {
		return (
			<div className='rounded-[6px] border border-zinc-200 bg-white'>
				<div className='grid grid-cols-4 gap-3 border-b border-zinc-200 bg-zinc-50 p-3'>
					{columns.map((column) => (
						<div key={String(column.key)} className='h-4 rounded bg-zinc-200' />
					))}
				</div>
				<div className='space-y-2 p-3'>
					{Array.from({ length: 6 }).map((_, index) => (
						<div key={index} className='h-9 rounded bg-zinc-100' />
					))}
				</div>
			</div>
		);
	}

	if (rows.length === 0) {
		return (
			<div className='rounded-[6px] border border-dashed border-zinc-300 bg-white p-8 text-center'>
				<PackageOpen className='mx-auto size-8 text-zinc-400' />
				<p className='mt-3 text-sm font-medium text-zinc-700'>{emptyMessage}</p>
			</div>
		);
	}

	const Header = (
		<div className='sticky top-0 z-10 grid border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500' style={{ gridTemplateColumns: columns.map((column) => `${column.width ?? 1}fr`).join(' ') }}>
			{columns.map((column) => (
				<button
					key={String(column.key)}
					type='button'
					className='flex h-10 items-center gap-2 px-3 text-left disabled:cursor-default'
					disabled={!column.sortable}
					onClick={() => updateSort(column)}>
					{column.header}
					{column.sortable && <ChevronsUpDown className='size-3.5' aria-hidden='true' />}
				</button>
			))}
		</div>
	);

	const Row = (row: T, style?: React.CSSProperties, measureRef?: (node: HTMLDivElement | null) => void, virtualIndex?: number) => (
		<div
			key={row.id}
			ref={measureRef}
			data-index={virtualIndex}
			className='grid min-h-11 items-center border-b border-zinc-100 bg-white text-sm text-zinc-700 hover:bg-zinc-50'
			style={{ gridTemplateColumns: columns.map((column) => `${column.width ?? 1}fr`).join(' '), ...style }}>
			{columns.map((column) => (
				<div key={String(column.key)} className='min-w-0 px-3 py-2'>
					{column.render ? column.render(row) : String(row[column.key])}
				</div>
			))}
		</div>
	);

	return (
		<div className='overflow-hidden rounded-[6px] border border-zinc-200 bg-white'>
			{virtualized ? (
				<div ref={parentRef} className='overflow-auto' style={{ height }}>
					{Header}
					<div className='relative' style={{ height: rowVirtualizer.getTotalSize() }}>
						{rowVirtualizer.getVirtualItems().map((virtualRow) =>
							Row(
								sortedRows[virtualRow.index],
								{
									left: 0,
									position: 'absolute',
									top: 0,
									transform: `translateY(${virtualRow.start}px)`,
									width: '100%',
								},
								dynamicRowHeight ? rowVirtualizer.measureElement : undefined,
								virtualRow.index,
							),
						)}
					</div>
				</div>
			) : (
				<>
					{Header}
					{visibleRows.map((row) => Row(row))}
					<div className='flex items-center justify-between px-3 py-2 text-xs text-zinc-500'>
						<span>
							Page {page} of {Math.max(1, Math.ceil(rows.length / pageSize))}
						</span>
						<span>{rows.length} rows</span>
					</div>
				</>
			)}
		</div>
	);
};

export interface InvoiceStatusBadgeProps {
	status: Extract<BillingStatus, 'paid' | 'draft' | 'void' | 'overdue'>;
}

/**
 * InvoiceStatusBadge adds invoice-specific icons to the shared status tone map.
 * Use it in invoice tables and detail headers.
 */
export const InvoiceStatusBadge = ({ status }: InvoiceStatusBadgeProps) => {
	const Icon = status === 'paid' ? CheckCircle2 : status === 'draft' ? Clock3 : status === 'void' ? XCircle : AlertTriangle;

	return (
		<StatusChip status={status} showDot={false} className='gap-1.5'>
			<Icon className='size-3.5' aria-hidden='true' />
		</StatusChip>
	);
};

export interface MeterProgressProps {
	label: string;
	used: number;
	entitled: number;
	unit?: string;
}

/**
 * MeterProgress displays used versus entitled units for credits, events, or API
 * usage with an accessible progress bar and exact numeric label.
 */
export const MeterProgress = ({ entitled, label, unit = 'units', used }: MeterProgressProps) => {
	const percentage = entitled === 0 ? 0 : Math.min(100, Math.round((used / entitled) * 100));

	return (
		<div className='space-y-2'>
			<div className='flex items-center justify-between gap-3 text-sm'>
				<span className='font-medium text-[#18181B]'>{label}</span>
				<span className='text-zinc-500'>
					{used.toLocaleString()} / {entitled.toLocaleString()} {unit}
				</span>
			</div>
			<div className='h-2 overflow-hidden rounded-full bg-zinc-100' role='progressbar' aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
				<div className={cn('h-full rounded-full', percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-[#3293D9]')} style={{ width: `${percentage}%` }} />
			</div>
		</div>
	);
};

export interface DateRangePickerProps {
	from?: string;
	to?: string;
	onChange?: (range: { from: string; to: string }) => void;
}

/**
 * DateRangePicker provides the two-date analytics filter used around revenue,
 * usage, and invoice reporting stories.
 */
export const DateRangePicker = ({ from = '2026-05-01', onChange, to = '2026-05-09' }: DateRangePickerProps) => {
	const [range, setRange] = React.useState({ from, to });
	const update = (key: 'from' | 'to', value: string) => {
		const next = { ...range, [key]: value };
		setRange(next);
		onChange?.(next);
	};

	return (
		<div className='inline-flex items-end gap-2 rounded-[6px] border border-zinc-200 bg-white p-2'>
			<Calendar className='mb-2 size-4 text-zinc-500' aria-hidden='true' />
			<FieldInput label='From' type='date' value={range.from} onChange={(event) => update('from', event.target.value)} />
			<FieldInput label='To' type='date' value={range.to} onChange={(event) => update('to', event.target.value)} />
		</div>
	);
};

export interface SearchBarProps {
	placeholder?: string;
	debounceMs?: number;
	onSearch?: (query: string) => void;
}

/**
 * SearchBar debounces user input and exposes a clear action for customer,
 * invoice, and plan table filtering.
 */
export const SearchBar = ({ debounceMs = 300, onSearch, placeholder = 'Search customers...' }: SearchBarProps) => {
	const [query, setQuery] = React.useState('');

	React.useEffect(() => {
		const timeout = window.setTimeout(() => onSearch?.(query), debounceMs);
		return () => window.clearTimeout(timeout);
	}, [debounceMs, onSearch, query]);

	return (
		<div className='flex h-9 w-full max-w-sm items-center gap-2 rounded-[6px] border border-zinc-200 bg-white px-3'>
			<Search className='size-4 text-zinc-500' aria-hidden='true' />
			<input className='min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400' placeholder={placeholder} value={query} onChange={(event) => setQuery(event.target.value)} />
			{query && (
				<button type='button' aria-label='Clear search' className='rounded-[6px] p-1 text-zinc-500 hover:bg-zinc-100' onClick={() => setQuery('')}>
					<X className='size-4' aria-hidden='true' />
				</button>
			)}
		</div>
	);
};

export interface SidebarItem {
	icon: 'home' | 'plans' | 'customers' | 'invoices' | 'usage' | 'settings';
	label: string;
	path: string;
}

export interface SidebarNavProps {
	activePath?: string;
	collapsed?: boolean;
	items: SidebarItem[];
}

/**
 * SidebarNav renders the app navigation with active-route highlighting and a
 * compact icon-only state for dense admin workflows.
 */
export const SidebarNav = ({ activePath = '/dashboard', collapsed = false, items }: SidebarNavProps) => {
	const icons = {
		home: Home,
		plans: CircleDollarSign,
		customers: Users,
		invoices: FileText,
		usage: BarChart3,
		settings: Settings,
	};

	return (
		<nav className={cn('h-full border-r border-zinc-200 bg-white p-3', collapsed ? 'w-16' : 'w-64')} aria-label='Main'>
			<div className='mb-5 flex h-8 items-center gap-2 px-2 font-semibold text-[#092E44]'>
				<Activity className='size-5' aria-hidden='true' />
				{!collapsed && <span>FlexPrice</span>}
			</div>
			<div className='space-y-1'>
				{items.map((item) => {
					const Icon = icons[item.icon];
					const active = item.path === activePath;

					return (
						<a
							key={item.path}
							href={item.path}
							className={cn(
								'flex h-9 items-center gap-3 rounded-[6px] px-2 text-sm font-medium transition-colors',
								active ? 'bg-[#E5F0FF] text-[#092E44]' : 'text-zinc-600 hover:bg-zinc-100 hover:text-[#18181B]',
								collapsed && 'justify-center',
							)}>
							<Icon className='size-4' aria-hidden='true' />
							{!collapsed && <span>{item.label}</span>}
						</a>
					);
				})}
			</div>
		</nav>
	);
};

export interface PricingTierTableProps {
	currency?: string;
	tiers: Array<{ from: number; to?: number; unitPrice: number; type: 'tiered' | 'graduated' }>;
}

/**
 * PricingTierTable displays tiered or graduated usage prices in a readable
 * finance-friendly table with clear ranges and formatted unit prices.
 */
export const PricingTierTable = ({ currency = 'USD', tiers }: PricingTierTableProps) => (
	<div className='overflow-hidden rounded-[6px] border border-zinc-200 bg-white'>
		<div className='grid grid-cols-3 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
			<span>Units</span>
			<span>Model</span>
			<span className='text-right'>Unit price</span>
		</div>
		{tiers.map((tier) => (
			<div key={`${tier.from}-${tier.to ?? 'plus'}`} className='grid grid-cols-3 border-b border-zinc-100 px-3 py-3 text-sm last:border-b-0'>
				<span className='font-medium text-[#18181B]'>
					{tier.from.toLocaleString()} - {tier.to ? tier.to.toLocaleString() : 'and above'}
				</span>
				<span className='capitalize text-zinc-600'>{tier.type}</span>
				<span className='text-right tabular-nums text-zinc-700'>{formatCurrency(tier.unitPrice, currency)}</span>
			</div>
		))}
	</div>
);

export interface EmptyStateProps {
	headline: string;
	subtext: string;
	ctaLabel?: string;
	onCtaClick?: () => void;
	icon?: React.ReactNode;
}

/**
 * EmptyState is the full-page fallback used when a user has not created plans,
 * customers, invoices, or usage meters yet.
 */
export const EmptyState = ({ ctaLabel = 'Create new', headline, icon = <Archive className='size-9' />, onCtaClick, subtext }: EmptyStateProps) => (
	<section className='flex min-h-[360px] flex-col items-center justify-center rounded-[6px] border border-dashed border-zinc-300 bg-white p-10 text-center'>
		<div className='flex size-14 items-center justify-center rounded-[6px] bg-[#E5F0FF] text-[#092E44]'>{icon}</div>
		<h2 className='mt-4 text-lg font-semibold text-[#18181B]'>{headline}</h2>
		<p className='mt-2 max-w-md text-sm text-zinc-500'>{subtext}</p>
		<FlexButton className='mt-5' onClick={onCtaClick}>
			{ctaLabel}
		</FlexButton>
	</section>
);

export const invoiceRows = [
	{ id: 'inv_001', customer: 'Acme AI', status: 'paid' as const, amount: '$4,200', due: 'May 10' },
	{ id: 'inv_002', customer: 'Orbit Labs', status: 'draft' as const, amount: '$980', due: 'May 12' },
	{ id: 'inv_003', customer: 'Northstar Cloud', status: 'overdue' as const, amount: '$12,400', due: 'Apr 30' },
	{ id: 'inv_004', customer: 'Sandbox Systems', status: 'void' as const, amount: '$0', due: 'May 03' },
];

export const sidebarItems: SidebarItem[] = [
	{ icon: 'home', label: 'Dashboard', path: '/dashboard' },
	{ icon: 'plans', label: 'Plans', path: '/plans' },
	{ icon: 'customers', label: 'Customers', path: '/customers' },
	{ icon: 'invoices', label: 'Invoices', path: '/invoices' },
	{ icon: 'usage', label: 'Usage', path: '/usage' },
	{ icon: 'settings', label: 'Settings', path: '/settings' },
];

export const makeCustomerRows = (count: number) =>
	Array.from({ length: count }, (_, index) => ({
		id: `cus_${String(index + 1).padStart(5, '0')}`,
		name: `Customer ${String(index + 1).padStart(5, '0')}`,
		plan: index % 3 === 0 ? 'Scale' : index % 3 === 1 ? 'Growth' : 'Starter',
		status: (index % 7 === 0 ? 'trialing' : index % 11 === 0 ? 'past_due' : 'active') as BillingStatus,
		usage: `${(index * 37) % 10000} events`,
		notes:
			index % 12 === 0
				? 'Usage spike detected across multiple workspaces; row expands so the virtualizer can measure dynamic content.'
				: 'Healthy usage pattern.',
	}));

export const MoreActionsButton = () => (
	<button type='button' aria-label='More actions' className='rounded-[6px] p-1 hover:bg-zinc-100'>
		<MoreHorizontal className='size-4' aria-hidden='true' />
	</button>
);
