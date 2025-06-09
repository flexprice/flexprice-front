import { Button, DatePicker, Input, Spacer } from '@/components/atoms';
import { FC, useState, useCallback } from 'react';
import RectangleRadiogroup, { RectangleRadiogroupOption } from '../RectangleRadiogroup';
import { useMutation } from '@tanstack/react-query';
import WalletApi from '@/api/WalletApi';
import toast from 'react-hot-toast';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { TransactionReason } from '@/models/Wallet';
import { v4 as uuidv4 } from 'uuid';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getCurrencyAmountFromCredits } from '@/utils/helpers/wallet';
import { TopupWalletPayload } from '@/types/dto';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Enum for credits type with more descriptive names
enum CreditsType {
	FreeCredit = 'FreeCredit',
	PurchasedCredits = 'PurchasedCredits',
}

// Centralized credits type options
const CREDITS_TYPE_OPTIONS: RectangleRadiogroupOption[] = [
	{
		label: 'Free',
		// icon: Receipt,
		description: 'Grant credits without a charge.',
		value: CreditsType.FreeCredit,
		disabled: false,
	},
	{
		label: 'Purchased',
		// icon: Gift,
		description: 'Add credits that require payment.',
		value: CreditsType.PurchasedCredits,
		disabled: false,
	},
];

// Extended payload type for more comprehensive state management
interface TopupPayload extends Partial<TopupWalletPayload> {
	credits_type?: CreditsType;
	generate_invoice?: boolean;
}

interface TopupCardProps {
	walletId?: string;
	className?: string;
	currency?: string;
	conversion_rate?: number;
	onSuccess?: () => void;
}

const TopupCard: FC<TopupCardProps> = ({ walletId, currency, conversion_rate = 1, onSuccess }) => {
	// State management with more explicit typing
	const [topupPayload, setTopupPayload] = useState<TopupPayload>({
		credits_type: CreditsType.FreeCredit,
		credits_to_add: undefined,
		generate_invoice: undefined,
		expiry_date: undefined,
		priority: undefined,
	});

	// Determine transaction reason based on credits type and invoice generation
	const getTransactionReason = useCallback((): TransactionReason => {
		const { credits_type, generate_invoice } = topupPayload;

		switch (credits_type) {
			case CreditsType.FreeCredit:
				return TransactionReason.FreeCredit;
			case CreditsType.PurchasedCredits:
				return generate_invoice ? TransactionReason.PurchasedCreditInvoiced : TransactionReason.PurchasedCreditDirect;
			default:
				throw new Error('Invalid credits type');
		}
	}, [topupPayload]);

	// Centralized data refetching logic
	const refetchWalletData = useCallback(async () => {
		await Promise.all([
			refetchQueries(['fetchWallets']),
			refetchQueries(['fetchWalletBalances']),
			refetchQueries(['fetchWalletsTransactions']),
		]);
	}, []);

	// Validate topup payload
	const validateTopup = useCallback((): boolean => {
		const { credits_type, credits_to_add, expiry_date_utc } = topupPayload;

		if (!credits_type) {
			toast.error('Please select a credits type');
			return false;
		}

		if (!credits_to_add || credits_to_add <= 0) {
			toast.error('Please enter a valid credits amount');
			return false;
		}

		if (expiry_date_utc) {
			// Reset time to start of the day for both dates
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			// Convert ISO string to Date object if it's a string
			const expiryDate = typeof expiry_date_utc === 'string' ? new Date(expiry_date_utc) : new Date(expiry_date_utc);
			expiryDate.setHours(0, 0, 0, 0);

			if (expiryDate.getTime() < today.getTime()) {
				toast.error('Expiry date cannot be in the past');
				return false;
			}
		}

		return true;
	}, [topupPayload]);

	// Wallet topup mutation with improved error handling
	const { isPending, mutate: topupWallet } = useMutation({
		mutationKey: ['topupWallet', walletId],
		mutationFn: () => {
			// Comprehensive validation before topup
			if (!walletId) {
				throw new Error('Wallet ID is required');
			}

			if (!topupPayload.credits_to_add || topupPayload.credits_to_add <= 0) {
				throw new Error('Invalid credits amount');
			}

			return WalletApi.topupWallet({
				walletId,
				credits_to_add: topupPayload.credits_to_add,
				idempotency_key: uuidv4(),
				transaction_reason: getTransactionReason(),
				expiry_date_utc: topupPayload.expiry_date_utc,
				priority: topupPayload.priority,
			});
		},
		onSuccess: async () => {
			toast.success('Wallet topped up successfully');
			onSuccess?.();
			setTopupPayload({
				credits_type: CreditsType.FreeCredit,
				credits_to_add: undefined,
				generate_invoice: undefined,
				expiry_date: undefined,
				priority: undefined,
			});
			await refetchWalletData();
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to topup wallet');
		},
	});

	// Handle topup submission
	const handleTopup = useCallback(() => {
		if (validateTopup() && walletId) {
			topupWallet();
		}
	}, [validateTopup, walletId, topupWallet]);

	// Update payload with type-safe setter
	const updateTopupPayload = useCallback((updates: Partial<TopupPayload>) => {
		setTopupPayload((prev) => ({
			...prev,
			...updates,
		}));
	}, []);

	return (
		<DialogContent className='bg-white sm:max-w-[600px]'>
			<DialogHeader>
				<DialogTitle>Add Credits</DialogTitle>
			</DialogHeader>
			<div className='grid gap-4 py-4'>
				<RectangleRadiogroup
					title='Credit Type'
					options={CREDITS_TYPE_OPTIONS.map((option) => ({
						...option,
						description: undefined,
					}))}
					value={topupPayload.credits_type}
					onChange={(value) => {
						// Reset related fields when changing credits type
						updateTopupPayload({
							credits_type: value as CreditsType,
							credits_to_add: undefined,
							generate_invoice: undefined,
							expiry_date: undefined,
						});
					}}
				/>
				<p className='text-sm text-gray-500 -my-2'>
					{topupPayload.credits_type === CreditsType.PurchasedCredits
						? 'Purchased credits require payment. Generate invoice to track the purchase.'
						: 'Free credits are granted without a charge.'}
				</p>
			</div>

			{/* Free Credits Input */}
			{topupPayload.credits_type && (
				<Input
					variant='formatted-number'
					onChange={(e) => updateTopupPayload({ credits_to_add: e as unknown as number })}
					value={topupPayload.credits_to_add ?? ''}
					suffix='credits'
					label='Credits'
					placeholder='credits'
					description={
						<>
							{topupPayload.credits_to_add && topupPayload.credits_to_add > 0 && (
								<span>
									{getCurrencySymbol(currency!)}
									{getCurrencyAmountFromCredits(conversion_rate, topupPayload.credits_to_add ?? 0)}
									{` will be credited to the wallet`}
								</span>
							)}
						</>
					}
				/>
			)}

			{topupPayload.credits_type && (
				<DatePicker
					minDate={new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 1, 0, 0, 0, 0))}
					label='Expiry Date'
					date={topupPayload.expiry_date_utc}
					setDate={(value) =>
						updateTopupPayload({
							expiry_date_utc: value ? new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0)) : undefined,
						})
					}
					className='w-full'
					labelClassName='text-foreground'
				/>
			)}
			{topupPayload.credits_type && (
				<Input
					label='Priority'
					className='w-full'
					placeholder='Enter priority'
					value={topupPayload.priority}
					onChange={(e) => {
						if (e) {
							updateTopupPayload({ priority: Number(e) });
						} else {
							updateTopupPayload({ priority: undefined });
						}
					}}
				/>
			)}
			{topupPayload.credits_type === CreditsType.PurchasedCredits && (
				<div className='flex items-center space-x-4 font-open-sans'>
					<Switch
						id='generate-invoice'
						checked={topupPayload.generate_invoice || false}
						onCheckedChange={(value) => {
							updateTopupPayload({ generate_invoice: value });
						}}
					/>
					<Label htmlFor='generate-invoice'>
						<p className='font-medium text-sm text-[#18181B] peer-checked:text-black'>Generate Invoice</p>
					</Label>
				</div>
			)}

			<Spacer className='!mt-4' />

			<div className='w-full justify-end flex'>
				<Button isLoading={isPending} onClick={handleTopup} disabled={isPending || !topupPayload.credits_type}>
					Add Credits
				</Button>
			</div>
		</DialogContent>
	);
};

export default TopupCard;
