// src/credits/containers/CreditBalanceContainer.tsx
//
// Dashboard-only data-fetching wrapper. NOT exported from the package — see `CreditBalance`.
import { useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { WALLET_STATUS } from '@/models/Wallet';
import { adaptCreditBalance } from '../adapters';
import CreditBalance from '../components/CreditBalance';

interface CreditBalanceContainerProps {
	className?: string;
	/** Header-right slot, beside the wallet's name. */
	actions?: ReactNode;
	/** On the balance label's row, under the header rule. */
	balanceAction?: ReactNode;
}

const CreditBalanceContainer = ({ className, actions, balanceAction }: CreditBalanceContainerProps) => {
	const { t } = useTranslation('customer-portal');

	const {
		data: wallets,
		isLoading: walletsLoading,
		isError: walletsError,
	} = useQuery({
		queryKey: ['portal-wallets'],
		queryFn: () => CustomerPortalApi.getWallets(),
	});

	const wallet = wallets?.find((w) => w.wallet_status === WALLET_STATUS.ACTIVE) || wallets?.[0];

	const { data: realtimeBalance, isLoading: balanceLoading } = useQuery({
		queryKey: ['portal-wallet-balance', wallet?.id],
		queryFn: () => CustomerPortalApi.getWalletBalance(wallet!.id),
		enabled: !!wallet?.id,
	});

	useEffect(() => {
		if (walletsError) toast.error(t('errors.loadWallet'));
	}, [walletsError, t]);

	if (walletsError) return null;

	const isLoading = walletsLoading || (!!wallet?.id && balanceLoading);
	const data = wallet ? adaptCreditBalance(wallet, realtimeBalance) : null;

	return <CreditBalance wallet={data} isLoading={isLoading} className={className} actions={actions} balanceAction={balanceAction} />;
};

export default CreditBalanceContainer;
