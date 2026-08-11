import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import PaymentApi from '@/api/PaymentApi';
import usePagination from '@/hooks/usePagination';
import { Loader, ShortPagination } from '@/components/atoms';
import toast from 'react-hot-toast';
import { InvoicePaymentsTable } from '@/components/molecules';
import { buildGuides } from '@/constants/guides';
import TutorialCards from '@/components/organisms/QueryableDataArea/TutorialCards';
import { useTranslation } from 'react-i18next';
import { ENTITY_STATUS } from '@/models';

const DEFAULT_PAYMENTS_TUTORIAL_IMAGE = 'https://mintlify.s3.us-west-1.amazonaws.com/flexprice/UsageBaseMetering(1).jpg';

const PaymentList = () => {
	const { t } = useTranslation(['billing', 'common']);
	const { t: tGuide } = useTranslation('guides');
	const guides = useMemo(() => buildGuides(tGuide), [tGuide]);
	const { limit, offset, page } = usePagination();

	const {
		data: payments,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['payments', page],
		queryFn: () => PaymentApi.getAllPayments({ limit, offset, status: ENTITY_STATUS.PUBLISHED }),
	});

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error(t('payments.fetchError'));
		return null;
	}

	if ((payments?.items ?? []).length === 0) {
		return (
			<div className='space-y-6'>
				<div className='bg-surface-faint border border-line-hairline dark:bg-surface dark:border-line rounded-[10px] w-full h-[360px] flex flex-col items-center justify-center mx-auto'>
					<div className='font-medium text-[20px] leading-normal text-content-secondary mb-4 text-center'>
						{t('payments.recordFirstHeading')}
					</div>
					<div className='font-normal bg-surface-faint-inner dark:bg-transparent text-[16px] leading-normal text-content-subtle mb-8 text-center max-w-[350px]'>
						{t('payments.recordFirstDescription')}
					</div>
				</div>
				<TutorialCards tutorials={guides.payments.tutorials ?? []} fallbackImageUrl={DEFAULT_PAYMENTS_TUTORIAL_IMAGE} />
			</div>
		);
	}

	return (
		<>
			<InvoicePaymentsTable data={payments?.items ?? []} />
			<ShortPagination unit={t('payments.paginationUnit')} totalItems={payments?.pagination.total ?? 0} />
		</>
	);
};

export default PaymentList;
