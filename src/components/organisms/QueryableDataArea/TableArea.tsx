import { Spacer, ShortPagination } from '@/components/atoms';
import FlexpriceTable from '@/components/molecules/Table';
import type { TableConfig, PaginationConfig } from './QueryableDataArea';

interface TableAreaProps<T> {
	data: { items: T[]; pagination: { total?: number } } | undefined;
	tableConfig: TableConfig<T>;
	paginationConfig?: PaginationConfig;
}

const TableArea = <T,>({ data, tableConfig, paginationConfig }: TableAreaProps<T>) => {
	const isCard = tableConfig.variant === 'card';
	const pagination = paginationConfig?.unit ? (
		<ShortPagination
			unit={paginationConfig.unit}
			totalItems={data?.pagination.total ?? 0}
			prefix={paginationConfig.prefix}
			variant={isCard ? 'embedded' : 'default'}
		/>
	) : null;

	return (
		<>
			<FlexpriceTable
				columns={tableConfig.columns}
				data={data?.items || []}
				onRowClick={tableConfig.onRowClick}
				showEmptyRow={tableConfig.showEmptyRow}
				hideBottomBorder={tableConfig.hideBottomBorder ?? !isCard}
				variant={tableConfig.variant}
				tableClassName={tableConfig.tableClassName}
				footer={isCard ? pagination : undefined}
			/>
			{!isCard && pagination && (
				<>
					<Spacer className='!h-4' />
					{pagination}
				</>
			)}
		</>
	);
};

export default TableArea;
