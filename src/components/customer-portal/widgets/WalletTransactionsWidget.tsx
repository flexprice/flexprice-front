import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Card, Loader, Select, ShortPagination } from '@/components/atoms';
import { WalletTransactionsTable } from '@/components/molecules';
import { WALLET_STATUS } from '@/models/Wallet';
import usePagination from '@/hooks/usePagination';
import EmptyState from '../EmptyState';

const WalletTransactionsWidget = () => {
	const { t } = useTranslation('customer-portal');
	const { limit, offset } = usePagination();
	const [selectedWalletId, setSelectedWalletId] = useState<string>('');

	const {
		data: wallets,
		isLoading: walletsLoading,
		isError: walletsError,
	} = useQuery({
		queryKey: ['portal-wallets'],
		queryFn: () => CustomerPortalApi.getWallets(),
	});

	const activeWallet = selectedWalletId
		? wallets?.find((w) => w.id === selectedWalletId)
		: wallets?.find((w) => w.wallet_status === WALLET_STATUS.ACTIVE) || wallets?.[0];

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

	useEffect(() => {
		if (walletsError) toast.error(t('errors.loadWallets'));
	}, [walletsError, t]);

	useEffect(() => {
		if (transactionsError) toast.error(t('errors.loadTransactions'));
	}, [transactionsError, t]);

	if (walletsLoading) {
		return (
			<div className='py-12'>
				<Loader />
			</div>
		);
	}

	if (!wallets || wallets.length === 0) {
		return (
			<Card
				className='rounded-xl p-6'
				style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' }}>
				<EmptyState title={t('wallet.emptyTitle')} description={t('wallet.emptyDescription')} />
			</Card>
		);
	}

	const walletOptions = wallets.map((w) => ({
		value: w.id,
		label: w.name || t('wallet.fallbackName', { id: w.id.slice(0, 8) }),
	}));

	return (
		<div className='space-y-6'>
			{wallets.length > 1 && (
				<Select
					value={activeWallet?.id || ''}
					onChange={(value) => setSelectedWalletId(value)}
					options={walletOptions}
					className='w-full max-w-xs'
				/>
			)}

			<Card
				className='rounded-xl overflow-hidden'
				style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' }}>
				<div className='p-6' style={{ borderBottom: '1px solid var(--portal-border, #E9E9E9)' }}>
					<h3 className='text-base font-medium' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
						{t('wallet.transactionHistory')}
					</h3>
				</div>
				<div className='p-6'>
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
				</div>
			</Card>
		</div>
	);
};

export default WalletTransactionsWidget;
