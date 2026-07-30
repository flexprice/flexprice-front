import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import PaymentApi from '@/api/PaymentApi';
import usePagination from '@/hooks/usePagination';
import { Loader, ShortPagination, Card } from '@/components/atoms';
import toast from 'react-hot-toast';
import { InvoicePaymentsTable } from '@/components/molecules';
import { buildGuides } from '@/constants/guides';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
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
				<div className='bg-[#fafafa] border border-[#E9E9E9] rounded-[10px] w-full h-[360px] flex flex-col items-center justify-center mx-auto'>
					<div className='font-medium text-[20px] leading-normal text-gray-700 mb-4 text-center'>{t('payments.recordFirstHeading')}</div>
					<div className='font-normal bg-[#F9F9F9] text-[16px] leading-normal text-gray-400 mb-8 text-center max-w-[350px]'>
						{t('payments.recordFirstDescription')}
					</div>
				</div>
				{guides.payments.tutorials && guides.payments.tutorials.length > 0 && (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10'>
						{guides.payments.tutorials.map((item, index) => {
							const imageUrl = item.imageUrl && item.imageUrl.trim() !== '' ? item.imageUrl : DEFAULT_PAYMENTS_TUTORIAL_IMAGE;
							return (
								<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} key={index}>
									<Card
										className={cn(
											'h-full group bg-white border border-slate-100 rounded-[10px] shadow-sm hover:border-blue-100 hover:bg-slate-50 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-blue-500/5 flex flex-col max-w-[280px] mx-auto p-4',
											'!aspect-auto bg-gradient-to-r from-[#ffffff] to-[#fcfcfc]',
										)}
										onClick={item.onClick}>
										<div className='w-full h-[80px] aspect-video rounded-t-lg overflow-hidden bg-[#f5f5f5] flex items-center justify-center'>
											<img src={imageUrl} loading='lazy' className='object-cover bg-gray-100 w-full h-full' alt='' />
										</div>
										<div className='flex-1 flex flex-col justify-between mt-4'>
											<div>
												<h3 className='text-slate-800 text-base font-medium group-hover:text-gray-600 transition-colors duration-200 text-left'>
													{item.title}
												</h3>
											</div>
											<div className='flex items-center gap-1 mt-8 text-slate-400 group-hover:text-gray-500 transition-all duration-200 text-left'>
												<span className='text-xs font-regular'>{t('payments.learnMore')}</span>
												<ArrowRight className='w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200' />
											</div>
										</div>
									</Card>
								</motion.div>
							);
						})}
					</div>
				)}
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
