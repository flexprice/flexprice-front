import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	getPaginationRowModel,
	flexRender,
	ColumnDef,
	SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronsUpDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTableProps<T> {
	columns: ColumnDef<T>[];
	data: T[];
	isLoading?: boolean;
	emptyState?: React.ReactNode;
	virtualise?: boolean;
	rowHeight?: number;
	pageSize?: number;
}

// ─── Skeleton loading ─────────────────────────────────────────────────────────
function SkeletonTable({ columns }: { columns: number }) {
	return (
		<table className='w-full border-collapse text-sm'>
			<thead className='bg-gray-50'>
				<tr>
					{Array.from({ length: columns }).map((_, i) => (
						<th key={i} className='px-4 py-3 text-left border-b border-gray-200'>
							<div className='h-3 bg-gray-200 rounded animate-pulse w-20' />
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{Array.from({ length: 5 }).map((_, rowIdx) => (
					<tr key={rowIdx} className='border-b border-gray-100'>
						{Array.from({ length: columns }).map((_, colIdx) => (
							<td key={colIdx} className='px-4 py-4'>
								<div className='h-3 bg-gray-100 rounded animate-pulse' style={{ width: `${60 + ((rowIdx * 3 + colIdx * 7) % 40)}%` }} />
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────
function DataTable<T>({ columns, data, isLoading, emptyState, virtualise = false, rowHeight = 52, pageSize = 10 }: DataTableProps<T>) {
	const [sorting, setSorting] = useState<SortingState>([]);

	const table = useReactTable({
		data,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		// Only paginate when NOT virtualising — virtualiser needs ALL rows at once
		...(virtualise ? {} : { getPaginationRowModel: getPaginationRowModel() }),
		initialState: { pagination: { pageSize } },
	});

	const parentRef = useRef<HTMLDivElement>(null);
	// For virtual tables use the full pre-pagination row set
	const rows = virtualise ? table.getSortedRowModel().rows : table.getRowModel().rows;

	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => rowHeight,
		overscan: 10,
		enabled: virtualise,
	});

	const virtualRows = virtualise ? rowVirtualizer.getVirtualItems() : null;
	const totalSize = virtualise ? rowVirtualizer.getTotalSize() : 0;

	// Show skeleton while loading — keeps the table shape visible so user
	// understands what's coming
	if (isLoading) {
		return (
			<div className='w-full rounded-[8px] border border-gray-200 overflow-hidden'>
				<SkeletonTable columns={columns.length} />
				<div className='px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50'>
					<span className='text-xs text-gray-400'>Loading…</span>
				</div>
			</div>
		);
	}

	const { pageIndex } = table.getState().pagination;
	const totalRows = data.length;
	const pageCount = table.getPageCount();

	return (
		<div className='w-full rounded-[8px] border border-gray-200 overflow-hidden'>
			<div ref={parentRef} className={cn('w-full overflow-auto', virtualise && 'h-[500px]')}>
				<table className='w-full border-collapse text-sm'>
					<thead className='bg-gray-50 sticky top-0 z-10'>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const isSorted = header.column.getIsSorted();
									return (
										<th
											key={header.id}
											className={cn(
												'px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase border-b border-gray-200 whitespace-nowrap',
												isSorted ? 'text-[#3293D9]' : 'text-gray-500',
											)}>
											{header.isPlaceholder ? null : (
												<div
													className={cn('flex items-center gap-1', header.column.getCanSort() && 'cursor-pointer select-none')}
													onClick={header.column.getToggleSortingHandler()}>
													{flexRender(header.column.columnDef.header, header.getContext())}
													{header.column.getCanSort() && (
														<span className={cn(isSorted ? 'text-[#3293D9]' : 'text-gray-300')}>
															{isSorted === 'asc' ? (
																<ChevronUpIcon size={13} />
															) : isSorted === 'desc' ? (
																<ChevronDownIcon size={13} />
															) : (
																<ChevronsUpDownIcon size={13} />
															)}
														</span>
													)}
												</div>
											)}
										</th>
									);
								})}
							</tr>
						))}
					</thead>
					<tbody>
						{rows.length === 0 && (
							<tr>
								<td colSpan={columns.length} className='px-4 py-12 text-center text-muted-foreground text-sm'>
									{emptyState ?? 'No data available'}
								</td>
							</tr>
						)}
						{virtualise && virtualRows ? (
							<>
								{virtualRows.length > 0 && (
									<tr style={{ height: virtualRows[0].start }}>
										<td colSpan={columns.length} />
									</tr>
								)}
								{virtualRows.map((virtualRow) => {
									const row = rows[virtualRow.index];
									return (
										<tr
											key={row.id}
											style={{ height: rowHeight }}
											className='border-b border-gray-100 hover:bg-[#E5F0FF]/40 transition-colors'>
											{row.getVisibleCells().map((cell) => (
												<td key={cell.id} className='px-4 py-2'>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</td>
											))}
										</tr>
									);
								})}
								{virtualRows.length > 0 && (
									<tr style={{ height: totalSize - virtualRows[virtualRows.length - 1].end }}>
										<td colSpan={columns.length} />
									</tr>
								)}
							</>
						) : (
							rows.map((row) => (
								<tr key={row.id} className='border-b border-gray-100 hover:bg-[#E5F0FF]/40 transition-colors'>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className='px-4 py-4 text-sm text-gray-800'>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Footer: row count + pagination */}
			{!virtualise && pageCount > 0 && (
				<div className='px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50'>
					<span className='text-xs text-gray-500'>
						{totalRows} {totalRows === 1 ? 'row' : 'rows'}
					</span>
					{pageCount > 1 && (
						<div className='flex items-center gap-3'>
							<span className='text-xs text-gray-500'>
								Page {pageIndex + 1} of {pageCount}
							</span>
							<div className='flex items-center gap-1'>
								<button
									onClick={() => table.previousPage()}
									disabled={!table.getCanPreviousPage()}
									className='p-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-100 transition-colors'>
									<ChevronLeftIcon size={13} />
								</button>
								<button
									onClick={() => table.nextPage()}
									disabled={!table.getCanNextPage()}
									className='p-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-100 transition-colors'>
									<ChevronRightIcon size={13} />
								</button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default DataTable;
