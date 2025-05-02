import { useParams } from 'react-router-dom';
import InvoiceDetails from '../customers/invoice/InvoiceDetail';
import { useQuery } from '@tanstack/react-query';
import usePagination from '@/hooks/usePagination';
import PaymentApi from '@/api/PaymentApi';
import { CustomTabs } from '@/components/molecules';
import { Loader, Page, ShortPagination } from '@/components/atoms';
import { ApiDocsContent, InvoicePaymentsTable } from '@/components/molecules';

const InvoiceDetailsPage = () => {
	const { invoiceId } = useParams();
	const { limit, offset } = usePagination();

	const { data: payments, isLoading } = useQuery({
		queryKey: ['payments', invoiceId],
		queryFn: () =>
			PaymentApi.getAllPayments({
				limit,
				offset,
				destination_id: invoiceId!,
				destination_type: 'INVOICE',
			}),
	});

	const tabs = [
		{
			value: 'Overview',
			label: 'Overview',
			content: <InvoiceDetails breadcrumb_index={2} invoice_id={invoiceId!} />,
		},
		{
			value: 'payments',
			label: 'Payments',
			content: isLoading ? (
				<Loader />
			) : (
				<div>
					<InvoicePaymentsTable data={payments?.items ?? []} />
					<ShortPagination unit='Payments' totalItems={payments?.pagination.total ?? 0} />
				</div>
			),
		},
	];

	return (
		<Page>
			<ApiDocsContent tags={['Invoices']} />
			<CustomTabs tabs={tabs} defaultValue='Overview' />
		</Page>
	);
};

export default InvoiceDetailsPage;
