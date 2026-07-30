import { Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton } from '@/components/ui';
import { PAYMENT_STATUS } from '@/constants';
import { RouteNames } from '@/core/routes/Routes';
import { getTypographyClass } from '@/lib/typography';
import { ENTITY_STATUS } from '@/models';
import type { FilterCondition } from '@/types/common/QueryBuilder';
import { DataType, FilterOperator } from '@/types/common/QueryBuilder';
import { getFiltersParamKey, serializeFilters } from '@/utils/filterPersistence';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

interface Invoice {
	amount_remaining?: number;
	amount_due?: number;
	currency?: string;
}

interface InvoicesByStatus {
	paid: Invoice[];
	failed: Invoice[];
	pending: Invoice[];
	processing: Invoice[];
	refunded: Invoice[];
}

interface InvoiceIssuesCardProps {
	invoicesByStatus: InvoicesByStatus;
	isLoading: boolean;
	error?: boolean;
}

const INVOICES_QUERY_KEY = 'fetchInvoices';

/** Builds filter array matching InvoicePage base filters + payment_status. Used for navigation link. */
function getFiltersForPaymentStatus(paymentStatus: string): FilterCondition[] {
	return [
		{
			field: 'invoice_number',
			operator: FilterOperator.CONTAINS,
			valueString: '',
			dataType: DataType.STRING,
			id: 'initial-invoice-number',
		},
		{
			field: 'status',
			operator: FilterOperator.IN,
			valueArray: [ENTITY_STATUS.PUBLISHED],
			dataType: DataType.ARRAY,
			id: 'initial-status',
		},
		{
			field: 'payment_status',
			operator: FilterOperator.IN,
			valueArray: [paymentStatus],
			dataType: DataType.ARRAY,
			id: 'payment-status-filter',
		},
	];
}

export const InvoiceIssuesCard: React.FC<InvoiceIssuesCardProps> = ({ invoicesByStatus, isLoading, error }) => {
	const { t } = useTranslation('common');
	const navigate = useNavigate();

	const handleStatusClick = (paymentStatus: string) => {
		const filters = getFiltersForPaymentStatus(paymentStatus);
		const search = `?${getFiltersParamKey(INVOICES_QUERY_KEY)}=${encodeURIComponent(serializeFilters(filters))}`;
		navigate({ pathname: RouteNames.invoices, search });
	};

	return (
		<Card className='shadow-sm'>
			<CardHeader className='pb-8'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
					<div>
						<CardTitle className={getTypographyClass('section-title', 'font-medium')}>
							{t('dashboardHome.invoicePaymentStatusTitle')}
						</CardTitle>
						<CardDescription className={getTypographyClass('helper-text', 'mt-1')}>
							{t('dashboardHome.invoiceRequiresAttention')}
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className='pt-0'>
				{isLoading ? (
					<div className='space-y-3 py-4'>
						<Skeleton className='h-16 w-full' />
						<Skeleton className='h-16 w-full' />
						<Skeleton className='h-16 w-full' />
					</div>
				) : error ? (
					<div className='flex flex-col items-center justify-center py-8'>
						<AlertCircle className='h-8 w-8 text-red-500 mb-3' />
						<p className={getTypographyClass('body-small', 'text-center text-zinc-600')}>{t('dashboardHome.invoiceLoadError')}</p>
					</div>
				) : (
					<div className='space-y-3'>
						{/* Paid Invoices */}
						<div
							role='button'
							tabIndex={0}
							className='bg-white border border-zinc-200 rounded-lg p-4 cursor-pointer hover:bg-zinc-50 transition-colors'
							onClick={() => handleStatusClick(PAYMENT_STATUS.SUCCEEDED)}
							onKeyDown={(e) => e.key === 'Enter' && handleStatusClick(PAYMENT_STATUS.SUCCEEDED)}>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									<CheckCircle className='w-5 h-5 text-green-600' />
									<p className={getTypographyClass('body-default', 'font-medium text-zinc-900')}>{t('status.paid')}</p>
								</div>
								<span className='text-2xl font-bold text-zinc-900'>{invoicesByStatus?.paid?.length || 0}</span>
							</div>
						</div>

						{/* Pending Payments */}
						<div
							role='button'
							tabIndex={0}
							className='bg-white border border-zinc-200 rounded-lg p-4 cursor-pointer hover:bg-zinc-50 transition-colors'
							onClick={() => handleStatusClick(PAYMENT_STATUS.PENDING)}
							onKeyDown={(e) => e.key === 'Enter' && handleStatusClick(PAYMENT_STATUS.PENDING)}>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									<Clock className='w-5 h-5 text-yellow-600' />
									<p className={getTypographyClass('body-default', 'font-medium text-zinc-900')}>{t('status.pending')}</p>
								</div>
								<span className='text-2xl font-bold text-zinc-900'>{invoicesByStatus?.pending?.length || 0}</span>
							</div>
						</div>

						{/* Failed Payments */}
						<div
							role='button'
							tabIndex={0}
							className='bg-white border border-zinc-200 rounded-lg p-4 cursor-pointer hover:bg-zinc-50 transition-colors'
							onClick={() => handleStatusClick(PAYMENT_STATUS.FAILED)}
							onKeyDown={(e) => e.key === 'Enter' && handleStatusClick(PAYMENT_STATUS.FAILED)}>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									<AlertCircle className='w-5 h-5 text-red-600' />
									<p className={getTypographyClass('body-default', 'font-medium text-zinc-900')}>{t('status.failed')}</p>
								</div>
								<span className='text-2xl font-bold text-zinc-900'>{invoicesByStatus?.failed?.length || 0}</span>
							</div>
						</div>

						{/* Processing Payments */}
						{(invoicesByStatus?.processing?.length || 0) > 0 && (
							<div className='bg-white border border-zinc-200 rounded-lg p-4'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<RefreshCw className='w-5 h-5 text-blue-600' />
										<p className={getTypographyClass('body-default', 'font-medium text-zinc-900')}>
											{t('dashboardHome.invoiceStatusProcessing')}
										</p>
									</div>
									<span className='text-2xl font-bold text-zinc-900'>{invoicesByStatus?.processing?.length || 0}</span>
								</div>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default InvoiceIssuesCard;
