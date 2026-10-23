import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/molecules';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataColumn } from './revenueMath';

export interface DataTableProps<T> {
	columns: DataColumn<T>[];
	rows: T[];
	rowKey: (row: T) => string;
	footer?: T;
	// Caller sorts rows; header shows toggle.
	sort?: { key: string; dir: SortDir; onToggle: () => void };
}

export type SortDir = 'asc' | 'desc';

const DataTable = <T,>({ columns, rows, rowKey, footer, sort }: DataTableProps<T>) => {
	const cells = (row: T, bold = false) =>
		columns.map((c) => (
			<TableCell key={c.key} className={cn(c.numeric && 'text-end tabular-nums', bold && 'font-semibold')}>
				{c.render ? c.render(row) : c.value(row)}
			</TableCell>
		));
	return (
		<div className='overflow-x-auto'>
			<Table>
				<TableHeader>
					<TableRow>
						{columns.map((c) => (
							<TableHead
								key={c.key}
								className={cn(c.numeric && 'text-end')}
								aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
								{sort?.key === c.key ? (
									<button type='button' className='inline-flex items-center gap-1' onClick={sort.onToggle}>
										{c.label}
										{sort.dir === 'asc' ? <ArrowUp className='h-3 w-3' /> : <ArrowDown className='h-3 w-3' />}
									</button>
								) : (
									c.label
								)}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((r) => (
						<TableRow key={rowKey(r)}>{cells(r)}</TableRow>
					))}
					{footer && <TableRow>{cells(footer, true)}</TableRow>}
				</TableBody>
			</Table>
		</div>
	);
};

export default DataTable;
