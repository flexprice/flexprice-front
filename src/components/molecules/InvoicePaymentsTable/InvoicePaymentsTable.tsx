import { useTranslation } from 'react-i18next';
import { FC, useMemo, useCallback } from 'react';
import { Payment } from '@/models/Payment';
import FlexpriceTable, { ColumnData, TooltipCell } from '../Table';
import { formatDateShort, formatLocalizedCurrency, toSentenceCase } from '@/utils/common/helper_functions';
import { Chip, NoDataCard } from '@/components/atoms';
import { CreditCard, Banknote, Receipt, CircleDollarSign, ExternalLink, Copy, Eye } from 'lucide-react';
import { RouteNames } from '@/core/routes/Routes';
import { RedirectCell } from '../Table';
import { PAYMENT_METHOD_TYPE } from '@/constants';
import DropdownMenu, { DropdownMenuOption, getCopyIdOption } from '../DropdownMenu';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';

interface Props {
	data: Payment[];
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
const PAYMENT_STATUS_CONFIG = {
	PENDING: { variant: 'warning' as const },
	PROCESSING: { variant: 'warning' as const },
	INITIATED: { variant: 'warning' as const },
	SUCCEEDED: { variant: 'success' as const },
	FAILED: { variant: 'failed' as const },
} as const;

const PaymentTableMenu: FC<PaymentTableMenuProps> = ({ payment }) => {
	const navigate = useNavigate();
	const { t } = useTranslation('common');

	const handleCopyPaymentLink = useCallback(async () => {
		if (!payment.payment_url) return;

		try {
			await navigator.clipboard.writeText(payment.payment_url);
			toast.success(t('tableMenu.paymentLinkCopied'));
		} catch (error) {
			console.error('Failed to copy payment link:', error);
			toast.error(t('tableMenu.paymentLinkCopyFailed'));
		}
	}, [payment.payment_url, t]);

	const menuOptions = useMemo((): DropdownMenuOption[] => {
		const isPaymentLink = payment.payment_method_type.toUpperCase() === PAYMENT_METHOD_TYPE.PAYMENT_LINK;
		const hasPaymentUrl = !!payment.payment_url;
		const isEnabled = isPaymentLink && hasPaymentUrl;

		const options = [
			getCopyIdOption(payment.id, t, { entityType: 'Payment' }),
			{
				label: t('tableMenu.viewInvoice'),
				icon: <Eye className='w-4 h-4' />,
				onSelect: () => {
					navigate(`${RouteNames.invoices}/${payment.destination_id}`);
				},
				disabled: payment.destination_type.toUpperCase() !== 'INVOICE' || !payment.destination_id,
			},
		];

		if (isEnabled) {
			options.push({
				label: t('tableMenu.copyLink'),
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
		t,
	]);

	return <DropdownMenu options={menuOptions} />;
};

const InvoicePaymentsTable: FC<Props> = ({ data }) => {
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

	const getPaymentStatusVariant = useCallback((status: string) => {
		const statusConfig = PAYMENT_STATUS_CONFIG[status.toUpperCase() as keyof typeof PAYMENT_STATUS_CONFIG];
		return statusConfig?.variant || 'default';
	}, []);
	const columns = useMemo(
		(): ColumnData<Payment>[] => [
			{
				title: t('tableColumns.refId'),
				width: 200,
				render: (rowData) => <TooltipCell tooltipContent={rowData.idempotency_key} tooltipText={rowData.idempotency_key} />,
			},
			{
				title: t('tableColumns.invoiceId'),
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
				title: t('tableColumns.date'),
				render: (payment) => formatDateShort(payment.created_at),
			},
			{
				title: t('tableColumns.status'),
				render: (payment) => {
					const variant = getPaymentStatusVariant(payment.payment_status);
					return <Chip label={toSentenceCase(payment.payment_status)} variant={variant} />;
				},
			},
			{
				title: t('tableColumns.paymentMethod'),
				render: (payment) => (
					<div className='flex items-center gap-2'>
						{getPaymentMethodIcon(payment.payment_method_type)}
						<span className='text-sm text-gray-700'>{getPaymentMethodLabel(payment.payment_method_type)}</span>
					</div>
				),
			},
			{
				title: t('tableColumns.amount'),
				render: (payment) => formatLocalizedCurrency(payment.amount, payment.currency),
			},
			{
				title: '',
				width: 50,
				fieldVariant: 'interactive',
				render: (payment) => <PaymentTableMenu payment={payment} />,
			},
		],
		[getPaymentMethodIcon, getPaymentMethodLabel, getPaymentStatusVariant, t],
	);

	// Early return for empty data
	if (!data?.length) {
		return (
			<div className='my-6'>
				<NoDataCard title={t('labels.payments')} subtitle={t('tableColumns.noPaymentsFound')} />
			</div>
		);
	}

	return (
		<div>
			<FlexpriceTable showEmptyRow columns={columns} data={data} />
		</div>
	);
};

export default InvoicePaymentsTable;
