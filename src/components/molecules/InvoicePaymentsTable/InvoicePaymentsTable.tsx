import { useTranslation } from 'react-i18next';
import { FC, ReactNode, useMemo, useCallback } from 'react';
import { Payment } from '@/models/Payment';
import FlexpriceTable, { ColumnData, TooltipCell } from '../Table';
import { formatDateShort, toSentenceCase, getCurrencySymbol } from '@/utils/common/helper_functions';
import { StatusChip, NoDataCard } from '@/components/atoms';
import type { StatusChipTone } from '@/components/atoms/StatusChip';
import { CreditCard, Banknote, Receipt, CircleDollarSign, ExternalLink, Copy, Eye } from 'lucide-react';
import { RouteNames } from '@/core/routes/Routes';
import { RedirectCell } from '../Table';
import { PAYMENT_METHOD_TYPE } from '@/constants';
import DropdownMenu, { DropdownMenuOption, getCopyIdOption } from '../DropdownMenu';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';

interface Props {
	data: Payment[];
	footer?: ReactNode;
}

interface PaymentTableMenuProps {
	payment: Payment;
}

// Payment method configuration for better maintainability
const PAYMENT_METHOD_CONFIG = {
	[PAYMENT_METHOD_TYPE.CARD]: {
		icon: CreditCard,
		label: 'Card',
	},
	[PAYMENT_METHOD_TYPE.ACH]: {
		icon: Banknote,
		label: 'Bank Transfer',
	},
	[PAYMENT_METHOD_TYPE.OFFLINE]: {
		icon: Receipt,
		label: 'Offline',
	},
	[PAYMENT_METHOD_TYPE.CREDITS]: {
		icon: CircleDollarSign,
		label: 'Wallet Credits',
	},
	[PAYMENT_METHOD_TYPE.PAYMENT_LINK]: {
		icon: ExternalLink,
		label: 'Payment Link',
	},
} as const;

// Payment status configuration for consistent styling
const PAYMENT_STATUS_TONE: Record<string, StatusChipTone> = {
	PENDING: 'warning',
	PROCESSING: 'warning',
	INITIATED: 'warning',
	SUCCEEDED: 'success',
	FAILED: 'danger',
};

const PaymentTableMenu: FC<PaymentTableMenuProps> = ({ payment }) => {
	const navigate = useNavigate();
	const { t: tc } = useTranslation('common');
	const handleCopyPaymentLink = useCallback(async () => {
		if (!payment.payment_url) return;

		try {
			await navigator.clipboard.writeText(payment.payment_url);
			toast.success('Payment link copied to clipboard!');
		} catch (error) {
			console.error('Failed to copy payment link:', error);
			toast.error('Failed to copy payment link. Please try again.');
		}
	}, [payment.payment_url]);

	const menuOptions = useMemo((): DropdownMenuOption[] => {
		const isPaymentLink = payment.payment_method_type.toUpperCase() === PAYMENT_METHOD_TYPE.PAYMENT_LINK;
		const hasPaymentUrl = !!payment.payment_url;
		const isEnabled = isPaymentLink && hasPaymentUrl;

		const options = [
			getCopyIdOption(payment.id, tc, { entityType: 'Payment' }),
			{
				label: 'View Invoice',
				icon: <Eye className='w-4 h-4' />,
				onSelect: () => {
					navigate(`${RouteNames.invoices}/${payment.destination_id}`);
				},
				disabled: payment.destination_type.toUpperCase() !== 'INVOICE' || !payment.destination_id,
			},
		];

		if (isEnabled) {
			options.push({
				label: 'Copy Link',
				icon: <Copy className='w-4 h-4' />,
				onSelect: handleCopyPaymentLink,
				disabled: !isEnabled,
			});
		}

		return options;
	}, [
		payment.payment_method_type,
		payment.payment_url,
		handleCopyPaymentLink,
		navigate,
		payment.destination_id,
		payment.destination_type,
		payment.id,
		tc,
	]);

	return <DropdownMenu options={menuOptions} />;
};

const InvoicePaymentsTable: FC<Props> = ({ data, footer }) => {
	const { t } = useTranslation('common');
	const getPaymentMethodIcon = useCallback((method: string) => {
		const config = PAYMENT_METHOD_CONFIG[method.toUpperCase() as keyof typeof PAYMENT_METHOD_CONFIG];
		const IconComponent = config?.icon || CreditCard;
		return <IconComponent className='w-4 h-4' />;
	}, []);

	const getPaymentMethodLabel = useCallback((method: string) => {
		const config = PAYMENT_METHOD_CONFIG[method.toUpperCase() as keyof typeof PAYMENT_METHOD_CONFIG];
		return config?.label || method;
	}, []);

	const getPaymentStatusTone = useCallback((status: string): StatusChipTone => {
		return PAYMENT_STATUS_TONE[status.toUpperCase()] ?? 'neutral';
	}, []);
	const columns = useMemo(
		(): ColumnData<Payment>[] => [
			{
				title: 'Ref ID',
				width: 200,
				render: (rowData) => <TooltipCell tooltipContent={rowData.idempotency_key} tooltipText={rowData.idempotency_key} />,
			},
			{
				title: 'Invoice ID',
				render: (payment) => {
					if (payment.destination_type.toUpperCase() === 'INVOICE') {
						return (
							<RedirectCell redirectUrl={`${RouteNames.invoices}/${payment.destination_id}`}>
								{payment.invoice_number || payment.destination_id}
							</RedirectCell>
						);
					}
					return <span>{payment.destination_id}</span>;
				},
			},
			{
				title: 'Date',
				render: (payment) => formatDateShort(payment.created_at),
			},
			{
				title: 'Status',
				render: (payment) => {
					const tone = getPaymentStatusTone(payment.payment_status);
					return <StatusChip label={toSentenceCase(payment.payment_status)} tone={tone} />;
				},
			},
			{
				title: 'Payment Method',
				render: (payment) => (
					<div className='flex items-center gap-2'>
						{getPaymentMethodIcon(payment.payment_method_type)}
						<span className='text-sm text-content-secondary'>{getPaymentMethodLabel(payment.payment_method_type)}</span>
					</div>
				),
			},
			{
				title: 'Amount',
				render: (payment) => `${getCurrencySymbol(payment.currency)} ${payment.amount}`,
			},
			{
				title: '',
				width: 50,
				fieldVariant: 'interactive',
				render: (payment) => <PaymentTableMenu payment={payment} />,
			},
		],
		[getPaymentMethodIcon, getPaymentMethodLabel, getPaymentStatusTone],
	);

	// Early return for empty data
	if (!data?.length) {
		return (
			<div className='my-6'>
				<NoDataCard title={t('labels.payments')} subtitle='No payments found' />
			</div>
		);
	}

	return (
		<div>
			<FlexpriceTable
				variant='card'
				tableClassName='table-fixed'
				showEmptyRow
				hideBottomBorder={false}
				columns={columns}
				data={data}
				footer={footer}
			/>
		</div>
	);
};

export default InvoicePaymentsTable;
