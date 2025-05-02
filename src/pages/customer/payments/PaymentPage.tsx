import { useQuery } from '@tanstack/react-query';
import PaymentApi from '@/api/PaymentApi';
import usePagination from '@/hooks/usePagination';
import { Loader, ShortPagination } from '@/components/atoms';
import toast from 'react-hot-toast';
import { ApiDocsContent, InvoicePaymentsTable } from '@/components/molecules';
import { Page } from '@/components/atoms';
import { EmptyPage } from '@/components/organisms';
import GUIDES from '@/constants/guides';

const PaymentPage = () => {
	const { limit, offset, page } = usePagination();

	const {
		data: payments,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['payments', page],
		queryFn: () => PaymentApi.getAllPayments({ limit, offset }),
	});

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error fetching payments');
	}

	if ((payments?.items ?? []).length === 0) {
		return <EmptyPage tutorials={GUIDES.payments.tutorials} heading='Payments' tags={['Payments']} />;
	}

	return (
		<Page heading='Payments'>
			<ApiDocsContent tags={['Payments', 'Auth']} />
			<div>
				<InvoicePaymentsTable data={payments?.items ?? []} />
				<ShortPagination unit='Payments' totalItems={payments?.pagination.total ?? 0} />
			</div>
		</Page>
	);
};

export default PaymentPage;
