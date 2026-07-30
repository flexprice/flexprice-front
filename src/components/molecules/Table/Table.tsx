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
	variant?: 'default' | 'no-bordered';
	/** Applied to the inner `<table>` (e.g. `table-fixed` for predictable column widths). */
	tableClassName?: string;
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
			'border-b border-[#E2E8F0] h-[36px] transition-colors hover:bg-muted/50',
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
	Omit<CustomThHTMLAttributes, 'align'> & { align?: 'left' | 'center' | 'right' | 'justify'; variant?: 'default' | 'no-bordered' }
>(({ className, style, align = 'left', width, variant = 'default', ...props }, ref) => (
	<th
		ref={ref}
		style={{ textAlign: alignStyle(align), width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined, ...style }}
		className={cn(
			'h-12 px-4 text-[14px] font-medium text-[#64748B]',
			alignClass(align),
			'align-middle',
			className,
			variant === 'default' && 'border-b border-[#E2E8F0]',
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
		className={cn('px-4 py-2 !max-h-9 text-[14px] font-medium', alignClass(align), 'align-middle', className)}
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
}> = ({ row, column, colIndex, onCellClick }) => {
	const { fieldName: name, render, suffixIcon, fieldVariant = 'default' } = column;

	const contentWrapperClasses = cn(
		onCellClick && 'cursor-pointer',
		fieldVariant === 'interactive' && 'data-interactive="true"',
		fieldVariant === 'link' && 'cursor-pointer hover:underline',
		colIndex === 0 && '!ps-2',
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

	const renderTableHeader = () => (
		<TableHeader
			className={cn(
				variant === 'default' ? 'h-8 bg-muted border-b border-[#E2E8F0] rounded-t-[6px]' : 'h-8',
				variant === 'no-bordered' && 'bg-transparent',
			)}>
			<TableRow
				className={cn(variant === 'default' ? 'rounded-t-[6px] border-b border-[#E2E8F0]' : '', variant === 'no-bordered' && 'border-b-0')}>
				{columns.map(({ title, flex = 1, width, color = '#64748B', align = 'left', className, children }, index) => (
					<TableHead
						variant={variant}
						key={index}
						style={{ flex: width ? undefined : flex }}
						width={width}
						align={align}
						className={cn(
							color ? `text-[${color}] !text-black` : 'text-black',
							'font-sans font-medium px-3',
							variant === 'default' && index === 0 ? 'rounded-ss-[6px]' : '',
							variant === 'default' && index === columns.length - 1 ? 'rounded-se-[6px]' : '',
							variant === 'no-bordered' && 'border-b-0',
							className,
						)}>
						<span className={cn(index === 0 && 'ps-2')}>{children ? children : title}</span>
					</TableHead>
				))}
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
					variant === 'default' && !lastRow && 'border-b border-[#E2E8F0]',
					onRowClick && 'cursor-pointer hover:bg-muted/50',
					lastRow && hideBottomBorder && 'border-b-0',
					'!py-1',
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
								textColor ? `text-[${textColor}]` : 'text-gray-700',
								variant === 'default' ? 'font-normal' : 'font-light',
								'!max-h-8 px-3 py-3 text-[14px]',
								onCLick && 'cursor-pointer hover:bg-muted/50',
								fieldVariant === 'title' ? 'font-regular text-foreground' : '!font-light text-gray-700',
								fieldVariant === 'link' && 'cursor-pointer text-primary hover:underline',
								fieldVariant === 'icon' && 'w-10',
								fieldVariant === 'interactive' && 'cursor-default',
							)}
							style={{ flex: width ? undefined : flex }}
							width={width}
							align={align}>
							<CellContent row={row} column={column} colIndex={colIndex} onCellClick={onCLick} />
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
								textColor ? `text-[${textColor}]` : 'text-[#09090B] w-full ',
								'font-normal',
								'!max-h-8 px-4 py-2 text-[14px]',
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
				variant === 'default' && 'rounded-[6px] border border-[#E2E8F0]',
				variant === 'default' && !hideBottomBorder && 'border-b border-[#E2E8F0]',
				variant === 'no-bordered' && 'border-0',
			)}>
			<Table className={tableClassName}>
				{renderTableHeader()}
				<TableBody>
					{data.map((row, rowIndex) => renderTableRow(row, rowIndex))}
					{renderEmptyRow()}
				</TableBody>
			</Table>
		</div>
	);
};

export default FlexpriceTable;
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
