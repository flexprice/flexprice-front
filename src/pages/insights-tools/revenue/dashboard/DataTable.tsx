import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/molecules';
import { cn } from '@/lib/utils';
import { DataColumn } from './revenueMath';

export interface DataTableProps<T> {
	columns: DataColumn<T>[];
	rows: T[];
	rowKey: (row: T) => string;
	footer?: T;
}

const DataTable = <T,>({ columns, rows, rowKey, footer }: DataTableProps<T>) => {
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
							<TableHead key={c.key} className={cn(c.numeric && 'text-end')}>
								{c.label}
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
