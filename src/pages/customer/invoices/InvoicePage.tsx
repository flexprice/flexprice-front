import { Page, Spacer, Loader, ShortPagination } from '@/components/atoms';
import { InvoiceTable, ApiDocsContent, QueryBuilder } from '@/components/molecules';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import usePagination from '@/hooks/usePagination';
import InvoiceApi from '@/api/InvoiceApi';
import { EmptyPage } from '@/components/organisms';
import GUIDES from '@/constants/guides';
import { useEffect } from 'react';
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
	} = useQuery({
		queryKey: ['fetchInvoices', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
		queryFn: fetchInvoices,
	});

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error fetching meters');
	}

	if ((invoiceData?.items ?? []).length === 0) {
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
				<InvoiceTable data={invoiceData?.items || []} />
				<Spacer className='!h-4' />
				<ShortPagination unit='Invoices' totalItems={invoiceData?.pagination.total ?? 0} />
			</div>
		</Page>
	);
};

export default InvoicesPage;
