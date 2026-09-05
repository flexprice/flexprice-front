import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Card } from '@/components/atoms';
import { INVOICE_STATUS, type Invoice } from '@/models/Invoice';
import { PAYMENT_STATUS } from '@/constants/payment';
import { SUBSCRIPTION_STATUS } from '@/models/Subscription';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { formatMoney } from '@/utils/common/formatBalance';
import usePortalWallet from '../usePortalWallet';
import TopUpButton from './TopUpButton';
import { cn } from '@/lib/utils';

interface AccountSummaryWidgetProps {
	label?: string;
}

interface StatProps {
	label: string;
	value: string;
	tone?: 'default' | 'danger';
}

/** One figure in the summary strip — a label/value pair, not a nested card. */
const Stat = ({ label, value, tone = 'default' }: StatProps) => (
	<div className='min-w-0'>
		<p className='text-xs mb-1 text-content-secondary'>{label}</p>
		<p className={cn('truncate text-xl font-semibold', tone === 'danger' ? 'text-danger' : 'text-content')}>{value}</p>
	</div>
);

/**
 * Account summary strip for the portal home.
 *
 * Answers the customer's first questions in order — what is my balance, what do I
 * owe, when am I billed next — and puts the primary action beside them, instead of
 * making them read three separate cards to work it out.
 */
const AccountSummaryWidget = ({ label }: AccountSummaryWidgetProps) => {
	const { t } = useTranslation('customer-portal');
	const { wallet, isLoading: walletLoading } = usePortalWallet();

	// Pages rather than reading the first 100: amount due is a headline figure, and
	// a customer with more invoices than one page would be shown less than they owe.
	// Bounded so a large history cannot spin the portal.
	const {
		data: invoicesData,
		isLoading: invoicesLoading,
		isError: invoicesError,
	} = useQuery({
		queryKey: ['portal-invoices-all'],
		queryFn: async () => {
			const pageSize = 100;
			const maxPages = 20;
			const items: Invoice[] = [];
			for (let page = 0; page < maxPages; page += 1) {
				const response = await CustomerPortalApi.getInvoices({ limit: pageSize, offset: page * pageSize });
				const batch = response?.items ?? [];
				items.push(...batch);
				if (batch.length < pageSize) break;
			}
			return { items };
		},
	});

	const { data: subscriptionsData, isLoading: subsLoading } = useQuery({
		queryKey: ['portal-subscriptions'],
		queryFn: () => CustomerPortalApi.getSubscriptions({ limit: 10, offset: 0 }),
	});

	const isLoading = walletLoading || invoicesLoading || subsLoading;

	if (isLoading) {
		return (
			<Card className='rounded-xl p-5 bg-surface border border-line'>
				<div className='animate-pulse grid gap-6 sm:grid-cols-3'>
					{[1, 2, 3].map((i) => (
						<div key={i} className='space-y-2'>
							<div className='h-3 bg-zinc-100 rounded w-16'></div>
							<div className='h-6 bg-zinc-100 rounded w-24'></div>
						</div>
					))}
				</div>
			</Card>
		);
	}

	const currency = wallet?.currency ?? invoicesData?.items?.[0]?.currency ?? 'USD';
	const symbol = getCurrencySymbol(currency);

	// Only finalized, unsettled invoices count as owed — drafts and voided ones do not.
	// null when the query failed: an empty fallback list reduces to zero, and telling
	// a customer they owe nothing because a request failed is worse than saying so.
	const amountDue = invoicesError
		? null
		: (invoicesData?.items ?? [])
				.filter((inv) => inv.invoice_status === INVOICE_STATUS.FINALIZED && inv.payment_status !== PAYMENT_STATUS.SUCCEEDED)
				.reduce((sum, inv) => sum + (inv.amount_remaining ?? 0), 0);

	const activeSubscription = (subscriptionsData?.items ?? []).find((s) => s.subscription_status === SUBSCRIPTION_STATUS.ACTIVE);

	// WalletResponse carries balance as a string, so coerce once rather than comparing loosely.
	const walletBalance = Number(wallet?.balance ?? 0);

	return (
		<Card className='rounded-xl p-5 bg-surface border border-line'>
			{label && <h3 className='text-sm font-medium mb-4 text-content'>{label}</h3>}
			<div className='flex flex-wrap items-end justify-between gap-6'>
				<div className='grid gap-6 grid-cols-2 sm:grid-cols-3 flex-1 min-w-0'>
					{wallet && (
						<Stat
							label={t('accountSummary.balance')}
							value={`${walletBalance < 0 ? '-' : ''}${symbol}${formatMoney(Math.abs(walletBalance))}`}
							tone={walletBalance < 0 ? 'danger' : 'default'}
						/>
					)}
					<Stat
						label={t('accountSummary.amountDue')}
						value={amountDue === null ? '—' : `${symbol}${formatMoney(amountDue)}`}
						tone={amountDue !== null && amountDue > 0 ? 'danger' : 'default'}
					/>
					<Stat
						label={t('accountSummary.nextBilling')}
						value={activeSubscription?.current_period_end ? formatDateShort(activeSubscription.current_period_end) : '—'}
					/>
				</div>
				{wallet && <TopUpButton />}
			</div>
		</Card>
	);
};

export default AccountSummaryWidget;
