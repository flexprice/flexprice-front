import { Button, Input, Spacer, Dialog } from '@/components/atoms';
import { FC, useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import WalletApi from '@/api/WalletApi';
import toast from 'react-hot-toast';
import { getCurrencySymbol } from '@/utils';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { WALLET_TRANSACTION_REASON } from '@/models';
import { v4 as uuidv4 } from 'uuid';
import { getCurrencyAmountFromCredits } from '@/utils';
import { DebitWalletPayload } from '@/types';
import { useTranslation } from 'react-i18next';

interface DebitPayload extends Partial<DebitWalletPayload> {
	credits?: number;
	reference_id?: string;
}

interface DebitCardProps {
	walletId?: string;
	currency?: string;
	conversion_rate?: number;
	onSuccess?: () => void;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

const DebitCard: FC<DebitCardProps> = ({ walletId, currency, conversion_rate = 1, onSuccess, isOpen, onOpenChange }) => {
	const { t } = useTranslation('billing');
	// State management
	const [debitPayload, setDebitPayload] = useState<DebitPayload>({
		credits: undefined,
		reference_id: undefined,
	});

	// Centralized data refetching logic
	const refetchWalletData = useCallback(async () => {
		await Promise.all([
			refetchQueries(['fetchWallets']),
			refetchQueries(['fetchWalletBalances']),
			refetchQueries(['fetchWalletsTransactions']),
		]);
	}, []);

	// Wallet debit mutation
	const { isPending, mutate: debitWallet } = useMutation({
		mutationKey: ['debitWallet', walletId],
		mutationFn: (payload: DebitWalletPayload) => {
			return WalletApi.debitWallet(payload);
		},
		onSuccess: async () => {
			toast.success('Wallet debited successfully');
			onSuccess?.();
			setDebitPayload({
				credits: undefined,
				reference_id: undefined,
			});
			await refetchWalletData();
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to debit wallet');
		},
	});

	// Handle debit submission with validation
	const handleDebit = useCallback(() => {
		// Comprehensive validation before debit
		if (!walletId) {
			toast.error('Wallet ID is required');
			return;
		}

		if (!debitPayload.credits || debitPayload.credits <= 0) {
			toast.error('Please enter a valid credits amount');
			return;
		}

		// Call mutation only after validation passes
		debitWallet({
			walletId,
			credits: debitPayload.credits,
			idempotency_key: debitPayload.reference_id || uuidv4(),
			transaction_reason: WALLET_TRANSACTION_REASON.MANUAL_BALANCE_DEBIT,
		});
	}, [walletId, debitPayload, debitWallet]);

	// Update payload with type-safe setter
	const updateDebitPayload = useCallback((updates: Partial<DebitPayload>) => {
		setDebitPayload((prev) => ({
			...prev,
			...updates,
		}));
	}, []);

	// Calculate description text
	const getDescriptionText = (): string => {
		if (debitPayload.credits && debitPayload.credits > 0) {
			return t('wallet.debit.preview', {
				amount: `${getCurrencySymbol(currency || '')}${getCurrencyAmountFromCredits(conversion_rate, debitPayload.credits)}`,
			});
		}
		return '';
	};

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('wallet.debit.title')}
			description={t('wallet.debit.description')}
			className='sm:max-w-[37.5rem]'>
			<div className='grid gap-4'>
				<Input
					variant='formatted-number'
					onChange={(e) => updateDebitPayload({ credits: e as unknown as number })}
					value={debitPayload.credits ?? ''}
					suffix={t('payments.transactions.creditsSuffix')}
					label={t('wallet.debit.creditsToDeduct')}
					placeholder={t('wallet.debit.creditsPlaceholder')}
					description={getDescriptionText()}
				/>

				<Input
					label={t('wallet.debit.referenceIdOptional')}
					className='w-full'
					placeholder={t('wallet.debit.referenceIdPlaceholder')}
					value={debitPayload.reference_id || ''}
					onChange={(e) => updateDebitPayload({ reference_id: e as string })}
					description={t('wallet.debit.referenceIdDescription')}
				/>

				<Spacer className='!mt-4' />

				<div className='w-full justify-end flex'>
					<Button isLoading={isPending} onClick={handleDebit} disabled={isPending || !debitPayload.credits}>
						{t('wallet.debit.submit')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default DebitCard;
