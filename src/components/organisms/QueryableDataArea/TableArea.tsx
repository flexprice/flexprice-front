import { Spacer, ShortPagination } from '@/components/atoms';
import FlexpriceTable from '@/components/molecules/Table';
import type { TableConfig, PaginationConfig } from './QueryableDataArea';

interface TableAreaProps<T> {
	data: { items: T[]; pagination: { total?: number } } | undefined;
	tableConfig: TableConfig<T>;
	paginationConfig?: PaginationConfig;
}

const TableArea = <T,>({ data, tableConfig, paginationConfig }: TableAreaProps<T>) => {
	return (
		<>
			<FlexpriceTable
				columns={tableConfig.columns}
				data={data?.items || []}
				onRowClick={tableConfig.onRowClick}
				showEmptyRow={tableConfig.showEmptyRow}
				hideBottomBorder={tableConfig.hideBottomBorder}
				variant={tableConfig.variant}
			/>
			{paginationConfig?.unit && (
				<>
					<Spacer className='!h-4' />
					<ShortPagination unit={paginationConfig.unit} totalItems={data?.pagination.total ?? 0} prefix={paginationConfig.prefix} />
				</>
			)}
		</>
	);
};

export default TableArea;
