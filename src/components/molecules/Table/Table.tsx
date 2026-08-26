import * as React from 'react';
import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

// Types and Interfaces
interface BaseColumnData<T> {
	title?: ReactNode;
	flex?: number;
	width?: number | string;
	color?: string;
	textColor?: string;
	suffixIcon?: ReactNode;
	align?: 'left' | 'center' | 'right' | 'justify';
	className?: string;
	fieldVariant?: 'default' | 'title' | 'link' | 'icon' | 'interactive';
	hideOnEmpty?: boolean;
	onCellClick?: (row: T, e: React.MouseEvent) => void;
	children?: ReactNode;
}

interface FieldNameColumn<T> extends BaseColumnData<T> {
	fieldName: keyof T;
	render?: never;
}

interface RenderColumn<T> extends BaseColumnData<T> {
	fieldName?: never;
	render: (rowData: T) => ReactNode;
}

export type ColumnData<T = any> = FieldNameColumn<T> | RenderColumn<T>;

export interface FlexpriceTableProps<T> {
	columns: ColumnData<T>[];
	data: T[];
	onRowClick?: (row: T) => void;
	showEmptyRow?: boolean;
	hideBottomBorder?: boolean;
	variant?: 'default' | 'no-bordered' | 'card';
	/** Applied to the inner `<table>` (e.g. `table-fixed` for predictable column widths). */
	tableClassName?: string;
	/** Rendered inside the table card, below the last row (e.g. pagination). */
	footer?: ReactNode;
}

// Map physical alignment values to logical Tailwind classes
const alignClass = (align: 'left' | 'center' | 'right' | 'justify'): string => {
	if (align === 'left') return 'text-start';
	if (align === 'right') return 'text-end';
	return `text-${align}`;
};

// Map physical alignment values to logical CSS textAlign values
const alignStyle = (align: 'left' | 'center' | 'right' | 'justify'): React.CSSProperties['textAlign'] => {
	if (align === 'left') return 'start';
	if (align === 'right') return 'end';
	return align;
};

// Helper Functions
const isInteractiveElement = (element: HTMLElement | null): boolean => {
	if (!element) return false;

	// Check for data-interactive attribute
	if (element.getAttribute('data-interactive') === 'true') return true;

	// Check for interactive elements
	const interactiveElements = ['button', 'a', 'input', 'select', 'textarea'];
	if (element.tagName && interactiveElements.includes(element.tagName.toLowerCase())) return true;

	// Check parent elements
	return element.closest('[data-interactive="true"]') !== null;
};

// Table structure components
const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
	<div className='relative w-full overflow-auto'>
		<table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
	</div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
	({ className, ...props }, ref) => <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />,
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
	({ className, ...props }, ref) => <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />,
);
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
	<tr
		ref={ref}
		className={cn(
			'border-b border-line-slate h-[2.25rem] transition-colors hover:bg-muted/50',
			'align-middle', // Vertically align middle
			className,
		)}
		{...props}
	/>
));
TableRow.displayName = 'TableRow';

interface CustomThHTMLAttributes extends React.ThHTMLAttributes<HTMLTableCellElement> {
	width?: number | string;
}

const TableHead = React.forwardRef<
	HTMLTableCellElement,
	Omit<CustomThHTMLAttributes, 'align'> & { align?: 'left' | 'center' | 'right' | 'justify'; variant?: 'default' | 'no-bordered' | 'card' }
>(({ className, style, align = 'left', width, variant = 'default', ...props }, ref) => (
	<th
		ref={ref}
		style={{ textAlign: alignStyle(align), width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined, ...style }}
		className={cn(
			'h-12 px-4 text-sm font-medium text-content-slate-muted',
			alignClass(align),
			'align-middle',
			className,
			variant === 'default' && 'border-b border-line-slate',
		)}
		{...props}
	/>
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
	HTMLTableCellElement,
	Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'align'> & { align?: 'left' | 'center' | 'right' | 'justify' }
>(({ className, style, align = 'left', width, ...props }, ref) => (
	<td
		ref={ref}
		style={{ textAlign: alignStyle(align), width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined, ...style }}
		className={cn('px-4 py-2 text-sm font-medium min-w-0 overflow-hidden', alignClass(align), 'align-middle', className)}
		{...props}
	/>
));
TableCell.displayName = 'TableCell';

// Cell Content Components
const CellContent: FC<{
	row: any;
	column: ColumnData<any>;
	colIndex: number;
	onCellClick?: (row: any, e: React.MouseEvent) => void;
	insetFirstColumn?: boolean;
}> = ({ row, column, colIndex, onCellClick, insetFirstColumn = true }) => {
	const { fieldName: name, render, suffixIcon, fieldVariant = 'default' } = column;

	const contentWrapperClasses = cn(
		'min-w-0 max-w-full',
		onCellClick && 'cursor-pointer',
		fieldVariant === 'interactive' && 'data-interactive="true"',
		fieldVariant === 'link' && 'cursor-pointer hover:underline',
		insetFirstColumn && colIndex === 0 && '!ps-2',
	);

	if (render) {
		return (
			<div data-interactive={fieldVariant === 'interactive'} className={contentWrapperClasses}>
				{render(row)}
				{suffixIcon && suffixIcon}
			</div>
		);
	}

	return <div className={contentWrapperClasses}>{row[name]}</div>;
};

// Main FlexpriceTable Component
const FlexpriceTable: FC<FlexpriceTableProps<any>> = ({
	onRowClick,
	columns,
	data,
	showEmptyRow,
	hideBottomBorder = true,
	variant = 'default',
	tableClassName,
	footer,
}) => {
	const { t } = useTranslation('common');
	const handleRowClick = (row: any, e: React.MouseEvent) => {
		const target = e.target as HTMLElement;

		// Don't trigger row click if the click was on or within an interactive element
		if (isInteractiveElement(target)) {
			return;
		}

		onRowClick?.(row);
	};

	const handleCellClick = (e: React.MouseEvent, row: any, onCellClick?: (row: any, e: React.MouseEvent) => void) => {
		const target = e.target as HTMLElement;

		// Don't trigger cell click if the click was on or within an interactive element
		if (isInteractiveElement(target)) {
			return;
		}

		if (onCellClick) {
			e.stopPropagation(); // Stop row click if cell has click handler
			onCellClick(row, e);
		}
	};

	const isCard = variant === 'card';
	// Card geometry uses `h-[var(--token)]` / `rounded-[var(--token)]` so tailwind-merge
	// replaces the default `h-[2.25rem]` / `rounded-[6px]`. Named utilities like `h-table-row`
	// are not in those conflict groups and silently leave the compressed defaults in place.

	const renderTableHeader = () => (
		<TableHeader
			className={cn(
				variant === 'default' ? 'h-8 bg-muted border-b border-line-slate rounded-t-[var(--fp-radius-lg)]' : 'h-8',
				variant === 'no-bordered' && 'bg-transparent',
				isCard && 'h-[var(--fp-table-header-height)] bg-transparent',
			)}>
			<TableRow
				className={cn(
					variant === 'default' ? 'rounded-t-[var(--fp-radius-lg)] border-b border-line-slate' : '',
					variant === 'no-bordered' && 'border-b-0',
					isCard && 'h-[var(--fp-table-header-height)] border-b border-line-zinc-subtle hover:bg-transparent',
				)}>
				{columns.map(
					({ title, flex = 1, width, color = 'rgb(var(--fp-content-slate-muted))', align = 'left', className, children }, index) => (
						<TableHead
							variant={variant === 'card' ? 'no-bordered' : variant}
							key={index}
							style={{ flex: width ? undefined : flex }}
							width={width}
							align={align}
							className={cn(
								!isCard && (color ? `text-[${color}] !text-content-black` : 'text-content-black'),
								'font-sans font-medium px-3',
								variant === 'default' && index === 0 ? 'rounded-ss-[var(--fp-radius-lg)]' : '',
								variant === 'default' && index === columns.length - 1 ? 'rounded-se-[var(--fp-radius-lg)]' : '',
								variant === 'no-bordered' && 'border-b-0',
								isCard &&
									'h-[var(--fp-table-header-height)] border-b border-line-zinc-subtle px-[var(--fp-table-cell-x)] py-[var(--fp-table-header-pad-y)] text-table-header font-medium normal-case tracking-normal text-content-muted',
								className,
							)}>
							<span className={cn(index === 0 && !isCard && 'ps-2')}>{children ? children : title}</span>
						</TableHead>
					),
				)}
			</TableRow>
		</TableHeader>
	);

	const renderTableRow = (row: any, rowIndex: number) => {
		const lastRow = rowIndex === data.length - 1;

		return (
			<TableRow
				onClick={(e) => handleRowClick(row, e)}
				className={cn(
					'transition-colors hover:bg-muted/50',
					variant === 'default' && !lastRow && 'border-b border-line-slate',
					onRowClick && 'cursor-pointer hover:bg-muted/50',
					lastRow && hideBottomBorder && 'border-b-0',
					!isCard && '!py-1',
					isCard && 'group border-b border-line-zinc-subtle last:border-b-0 hover:bg-muted/40',
					isCard && lastRow && hideBottomBorder && 'border-b-0',
				)}
				key={rowIndex}>
				{columns.map((column, colIndex) => {
					const { flex = 1, width, textColor = 'inherit', align = 'left', onCellClick: onCLick, fieldVariant = 'default' } = column;

					return (
						<TableCell
							onClick={(e) => handleCellClick(e, row, onCLick)}
							key={colIndex}
							data-interactive={fieldVariant === 'interactive'}
							className={cn(
								textColor ? `text-[${textColor}]` : 'text-content-secondary',
								variant === 'default' ? 'font-normal' : 'font-light',
								!isCard && '!max-h-8 px-3 py-3 text-sm',
								onCLick && 'cursor-pointer hover:bg-muted/50',
								fieldVariant === 'title' ? 'font-regular text-foreground' : '!font-light text-content-secondary',
								fieldVariant === 'link' && 'cursor-pointer text-primary dark:text-info hover:underline',
								fieldVariant === 'icon' && 'w-10',
								fieldVariant === 'interactive' && 'cursor-default',
								isCard &&
									'min-w-0 overflow-hidden px-[var(--fp-table-cell-x)] py-[var(--fp-table-cell-pad-y)] text-body !font-normal text-content-muted',
								isCard && fieldVariant === 'title' && '!text-sm !font-medium text-content-zinc-bold',
								isCard &&
									fieldVariant === 'interactive' &&
									'opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none',
							)}
							style={{ flex: width ? undefined : flex }}
							width={width}
							align={align}>
							<CellContent row={row} column={column} colIndex={colIndex} onCellClick={onCLick} insetFirstColumn={!isCard} />
						</TableCell>
					);
				})}
			</TableRow>
		);
	};

	const renderEmptyRow = () => {
		if (!showEmptyRow || data.length > 0) return null;

		return (
			<TableRow className={cn(hideBottomBorder && 'border-b-0', variant === 'no-bordered' && 'border-b-0')}>
				{columns.map(({ flex = 1, width, textColor = 'inherit', align = 'left', hideOnEmpty }, colIndex) => {
					const lastRow = colIndex === columns.length - 1;
					return (
						<TableCell
							key={colIndex}
							className={cn(
								textColor ? `text-[${textColor}]` : 'text-content-zinc w-full ',
								'font-normal',
								'!max-h-8 px-4 py-2 text-sm',
								lastRow ? 'text-center' : '',
							)}
							style={{ flex: width ? undefined : flex }}
							width={width}
							align={align}>
							{lastRow && hideOnEmpty ? '' : t('labels.na')}
						</TableCell>
					);
				})}
			</TableRow>
		);
	};

	return (
		<div
			className={cn(
				'overflow-hidden',
				variant === 'default' && 'rounded-[var(--fp-radius-lg)] border border-line-slate',
				variant === 'default' && !hideBottomBorder && 'border-b border-line-slate',
				variant === 'no-bordered' && 'border-0',
				isCard && 'bg-transparent',
			)}>
			<Table className={tableClassName}>
				{renderTableHeader()}
				<TableBody className={cn(isCard && footer && '[&_tr:last-child]:border-b [&_tr:last-child]:border-line-zinc-subtle')}>
					{data.map((row, rowIndex) => renderTableRow(row, rowIndex))}
					{renderEmptyRow()}
				</TableBody>
			</Table>
			{footer}
		</div>
	);
};

export default FlexpriceTable;
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
