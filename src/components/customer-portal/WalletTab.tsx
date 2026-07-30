import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Card, Chip, Loader, Select, ShortPagination } from '@/components/atoms';
import EmptyState from './EmptyState';
import { WalletTransactionsTable } from '@/components/molecules';
import { WALLET_STATUS } from '@/models/Wallet';
import { formatAmount } from '@/components/atoms/Input/Input';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { Wallet as WalletIcon } from 'lucide-react';
import usePagination from '@/hooks/usePagination';

const WalletTab = () => {
	const { t } = useTranslation('customer-portal');
	const { limit, offset } = usePagination();
	const [selectedWalletId, setSelectedWalletId] = useState<string>('');

	const getWalletStatusChip = (status: WALLET_STATUS) => {
		const variantMap: Record<WALLET_STATUS, 'success' | 'warning' | 'failed' | 'default'> = {
			[WALLET_STATUS.ACTIVE]: 'success',
			[WALLET_STATUS.FROZEN]: 'warning',
			[WALLET_STATUS.CLOSED]: 'failed',
		};
		const variant = variantMap[status] ?? 'default';
		return <Chip label={t(`walletStatus.${status}`)} variant={variant} />;
	};

	// Fetch wallets
	const {
		data: wallets,
		isLoading: walletsLoading,
		isError: walletsError,
	} = useQuery({
		queryKey: ['portal-wallets'],
		queryFn: () => CustomerPortalApi.getWallets(),
	});

	// Set initial selected wallet
	const activeWallet = selectedWalletId
		? wallets?.find((w) => w.id === selectedWalletId)
		: wallets?.find((w) => w.wallet_status === WALLET_STATUS.ACTIVE) || wallets?.[0];

	// Fetch wallet balance
	const { data: walletBalance, isLoading: balanceLoading } = useQuery({
		queryKey: ['portal-wallet-balance', activeWallet?.id],
		queryFn: () => CustomerPortalApi.getWalletBalance(activeWallet!.id),
		enabled: !!activeWallet?.id,
	});

	// Fetch transactions
	const {
		data: transactionsData,
		isLoading: transactionsLoading,
		isError: transactionsError,
	} = useQuery({
		queryKey: ['portal-wallet-transactions', activeWallet?.id, limit, offset],
		queryFn: () =>
			CustomerPortalApi.getWalletTransactions({
				walletId: activeWallet!.id,
				limit,
				offset,
			}),
		enabled: !!activeWallet?.id,
	});

	if (walletsError) {
		toast.error(t('errors.loadWallets'));
	}
	if (transactionsError) {
		toast.error(t('errors.loadTransactions'));
	}

	if (walletsLoading) {
		return (
			<div className='py-12'>
				<Loader />
			</div>
		);
	}

	if (!wallets || wallets.length === 0) {
		return (
			<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
				<EmptyState title={t('wallet.emptyTitle')} description={t('wallet.emptyDescription')} />
			</Card>
		);
	}

	const currencySymbol = getCurrencySymbol(walletBalance?.currency ?? activeWallet?.currency ?? 'USD');

	const walletOptions = wallets.map((w) => ({
		value: w.id,
		label: w.name || t('wallet.fallbackName', { id: w.id.slice(0, 8) }),
	}));

	return (
		<div className='space-y-6'>
			{/* Wallet Selector (if multiple wallets) */}
			{wallets.length > 1 && (
				<Select
					value={activeWallet?.id || ''}
					onChange={(value) => setSelectedWalletId(value)}
					options={walletOptions}
					className='w-full max-w-xs'
				/>
			)}

			{/* Wallet Balance Card */}
			<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
				<div className='flex items-center gap-3 mb-6'>
					<div className='h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center'>
						<WalletIcon className='h-5 w-5 text-blue-600' />
					</div>
					<div>
						<h3 className='text-base font-medium text-zinc-950'>{activeWallet?.name || t('wallet.defaultName')}</h3>
						{activeWallet?.wallet_status && getWalletStatusChip(activeWallet.wallet_status)}
					</div>
				</div>

				{/* Balance */}
				{balanceLoading ? (
					<div className='animate-pulse space-y-3'>
						<div className='h-4 bg-zinc-100 rounded w-20'></div>
						<div className='h-10 bg-zinc-100 rounded w-32'></div>
						<div className='h-4 bg-zinc-100 rounded w-24'></div>
					</div>
				) : (
					<div>
						<span className='text-sm text-zinc-500 block mb-2'>{t('wallet.balance')}</span>
						<div className='flex items-baseline gap-2'>
							<span className='text-4xl font-semibold text-zinc-950'>
								{formatAmount(walletBalance?.real_time_credit_balance ?? activeWallet?.credit_balance?.toString() ?? '0')}
							</span>
							<span className='text-base font-normal text-zinc-500'>{t('wallet.credits')}</span>
						</div>
						<p className='text-sm text-zinc-500 mt-1'>
							{currencySymbol}
							{formatAmount(walletBalance?.real_time_balance ?? activeWallet?.balance?.toString() ?? '0')} {t('wallet.valueSuffix')}
						</p>
					</div>
				)}
			</Card>

			{/* Transactions */}
			<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
				<h3 className='text-base font-medium text-zinc-950 mb-4'>{t('wallet.transactionHistory')}</h3>

				{transactionsLoading ? (
					<div className='animate-pulse space-y-3'>
						{[1, 2, 3].map((i) => (
							<div key={i} className='h-12 bg-zinc-100 rounded'></div>
						))}
					</div>
				) : transactionsData?.items && transactionsData.items.length > 0 ? (
					<>
						<WalletTransactionsTable data={transactionsData.items} />
						<ShortPagination unit='transactions' totalItems={transactionsData.pagination?.total || 0} />
					</>
				) : (
					<EmptyState title={t('wallet.noTransactionsTitle')} description={t('wallet.noTransactionsDescription')} />
				)}
			</Card>
		</div>
	);
};

export default WalletTab;
