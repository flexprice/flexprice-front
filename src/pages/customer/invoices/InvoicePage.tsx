import { Page, Spacer, ShortPagination, Loader } from '@/components/atoms';
import { InvoiceTable, ApiDocsContent, QueryBuilder } from '@/components/molecules';
import toast from 'react-hot-toast';
import { useQueryWithEmptyState } from '@/hooks/useQueryWithEmptyState';
import usePagination from '@/hooks/usePagination';
import InvoiceApi from '@/api/InvoiceApi';
import { EmptyPage } from '@/components/organisms';
import GUIDES from '@/constants/guides';
import { useEffect, useMemo } from 'react';
import useFilterSorting from '@/hooks/useFilterSorting';
import { invoiceFilterOptions, invoiceSortOptions, invoiceInitialFilters, invoiceInitialSorts } from '@/configs/entityFilterConfigs';

const InvoicesPage = () => {
	const { limit, offset, page, reset } = usePagination();

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: invoiceInitialFilters,
		initialSorts: invoiceInitialSorts,
		debounceTime: 500,
	});

	const fetchInvoices = async () => {
		return await InvoiceApi.listInvoicesByFilter({
			limit,
			offset,
			filters: sanitizedFilters,
			sort: sanitizedSorts,
		});
	};

	useEffect(() => {
		reset();
	}, [sanitizedFilters, sanitizedSorts, reset]);

	const {
		data: invoiceData,
		isLoading,
		isError,
		probeData,
	} = useQueryWithEmptyState({
		main: {
			queryKey: ['fetchInvoices', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: fetchInvoices,
		},
		probe: {
			queryKey: ['fetchInvoices', 'probe', page],
			queryFn: async () => {
				return await InvoiceApi.listInvoicesByFilter({
					limit: 1,
					offset: 0,
					filters: [],
					sort: [],
				});
			},
		},
		shouldProbe: (mainData) => {
			return mainData?.items.length === 0;
		},
	});

	// Show empty page when no invoices exist at all (check probe data)
	const showEmptyPage = useMemo(() => {
		// Type-safe checks with explicit type assertion
		const probeItems = probeData?.items || [];
		const invoiceItems = invoiceData?.items || [];
		return !isLoading && probeItems.length === 0 && invoiceItems.length === 0;
	}, [isLoading, probeData, invoiceData]);

	if (isError) {
		toast.error('Error fetching invoices');
		return null;
	}

	if (showEmptyPage) {
		return (
			<EmptyPage
				emptyStateCard={{
					heading: 'Create your first invoice',
					description: 'Generate an invoice to initiate billing and manage customer payments.',
				}}
				tutorials={GUIDES.invoices.tutorials}
				heading='Invoices'
				tags={['Invoices']}
			/>
		);
	}

	return (
		<Page heading='Invoices'>
			<ApiDocsContent tags={['Invoices']} />
			<div className='px-0'>
				<QueryBuilder
					filterOptions={invoiceFilterOptions}
					filters={filters}
					onFilterChange={setFilters}
					sortOptions={invoiceSortOptions}
					onSortChange={setSorts}
					selectedSorts={sorts}
				/>
				{isLoading ? (
					<div className='flex justify-center items-center min-h-[200px]'>
						<Loader />
					</div>
				) : (
					<>
						<InvoiceTable data={invoiceData?.items || []} />
						<Spacer className='!h-4' />
						<ShortPagination unit='Invoices' totalItems={invoiceData?.pagination.total ?? 0} />
					</>
				)}
			</div>
		</Page>
	);
};

export default InvoicesPage;
