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
			return `${getCurrencySymbol(currency || '')}${getCurrencyAmountFromCredits(conversion_rate, debitPayload.credits)} will be debited from the wallet`;
		}
		return '';
	};

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title='Manual Debit'
			description='Manually debit the credits from your wallet. This action will reduce the wallet balance.'
			className='sm:max-w-[600px]'>
			<div className='grid gap-4'>
				<Input
					variant='formatted-number'
					onChange={(e) => updateDebitPayload({ credits: e as unknown as number })}
					value={debitPayload.credits ?? ''}
					suffix='credits'
					label='Credits to Deduct'
					placeholder='Enter credits amount'
					description={getDescriptionText()}
				/>

				<Input
					label='Reference ID (Optional)'
					className='w-full'
					placeholder='Enter reference ID'
					value={debitPayload.reference_id || ''}
					onChange={(e) => updateDebitPayload({ reference_id: e as string })}
					description='This reference ID will be used as the idempotency key for the transaction.'
				/>

				<Spacer className='!mt-4' />

				<div className='w-full justify-end flex'>
					<Button isLoading={isPending} onClick={handleDebit} disabled={isPending || !debitPayload.credits}>
						Submit
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default DebitCard;
