import type { ReactNode, HTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * The portal's one table chrome.
 *
 * Three tables — transaction history, usage breakdown, invoices — each arrived at
 * their own answer: one had a filled grey header from a dashboard molecule, one
 * nested a bordered table inside an already-bordered card, one rolled its own.
 * Read together they did not look like the same product.
 *
 * Deliberately a set of styled primitives rather than a configured data table.
 * The three differ in ways that matter — sorting, grouped rows that expand, a
 * row-level action menu — and a single `columns` prop would have to grow a
 * feature flag for each. What has to be identical is the chrome, so that is what
 * lives here; the bodies stay with the tables that own them.
 *
 * Sits flush inside a PortalSection: the card's own border is the table boundary,
 * so nothing here draws an outer border of its own. The header carries a light
 * tint to separate the column labels from the rows without a second rule.
 */
export const PortalTable = ({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) => (
	<div className='w-full overflow-x-auto'>
		<table className={cn('w-full border-collapse text-sm', className)} {...props}>
			{children}
		</table>
	</div>
);

/** Tinted and hairline-ruled, so column labels read as chrome rather than a first row. */
export const PortalTableHeader = ({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
	<thead className={cn('border-b border-line bg-surface-subtle', className)} {...props}>
		{children}
	</thead>
);

export const PortalTableBody = ({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
	<tbody className={cn('divide-y divide-line', className)} {...props}>
		{children}
	</tbody>
);

interface RowProps extends HTMLAttributes<HTMLTableRowElement> {
	/** Adds the hover tint. Only for rows that actually do something when clicked. */
	interactive?: boolean;
}

export const PortalTableRow = ({ className, interactive = false, children, ...props }: RowProps) => (
	<tr className={cn(interactive && 'cursor-pointer transition-colors hover:bg-surface-subtle', className)} {...props}>
		{children}
	</tr>
);

interface CellProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
	/** Numbers and currency go right; text and dates go left. Picked once, globally. */
	align?: 'start' | 'end';
}

const alignClass = (align: 'start' | 'end') => (align === 'end' ? 'text-end' : 'text-start');

export const PortalTableHead = ({ className, align = 'start', children, ...props }: CellProps) => (
	<th scope='col' className={cn('px-4 py-2.5 text-[13px] font-medium text-content-secondary', alignClass(align), className)} {...props}>
		{children}
	</th>
);

export const PortalTableCell = ({ className, align = 'start', children, ...props }: CellProps) => (
	<td className={cn('px-4 py-3.5 text-[13px] text-content', alignClass(align), className)} {...props}>
		{children}
	</td>
);

/** A full-width row for an empty or error state, spanning every column. */
export const PortalTableEmpty = ({ colSpan, children }: { colSpan: number; children: ReactNode }) => (
	<tr>
		<td colSpan={colSpan} className='px-4'>
			{children}
		</td>
	</tr>
);

export default PortalTable;

export interface PortalColumn<T> {
	title: ReactNode;
	align?: 'start' | 'end';
	className?: string;
	render: (row: T) => ReactNode;
}

interface PortalDataTableProps<T> {
	columns: PortalColumn<T>[];
	data: T[];
	getRowKey: (row: T, index: number) => string;
	onRowClick?: (row: T) => void;
}

/**
 * A column-driven table for callers whose rows are uniform.
 *
 * The grouped, expandable tables keep composing the primitives above; this is
 * for the ones that would otherwise repeat the same map twice.
 */
export function PortalDataTable<T>({ columns, data, getRowKey, onRowClick }: PortalDataTableProps<T>) {
	return (
		<PortalTable>
			<PortalTableHeader>
				<tr>
					{columns.map((column, i) => (
						<PortalTableHead key={i} align={column.align} className={column.className}>
							{column.title}
						</PortalTableHead>
					))}
				</tr>
			</PortalTableHeader>
			<PortalTableBody>
				{data.map((row, index) => (
					<PortalTableRow
						key={getRowKey(row, index)}
						interactive={Boolean(onRowClick)}
						onClick={onRowClick ? () => onRowClick(row) : undefined}>
						{columns.map((column, i) => (
							<PortalTableCell key={i} align={column.align} className={column.className}>
								{column.render(row)}
							</PortalTableCell>
						))}
					</PortalTableRow>
				))}
			</PortalTableBody>
		</PortalTable>
	);
}
