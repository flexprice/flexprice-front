import { Button, DatePicker, FormHeader, Input, Spacer } from '@/components/atoms';
import { Gift, Receipt } from 'lucide-react';
import { FC, useState, useCallback } from 'react';
import RectangleRadiogroup, { RectangleRadiogroupOption } from '../RectangleRadiogroup';
import { useMutation } from '@tanstack/react-query';
import WalletApi, { TopupWalletPayload } from '@/utils/api_requests/WalletApi';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { refetchQueries } from '@/core/tanstack/ReactQueryProvider';
import { TransactionReason } from '@/models/Wallet';
import { v4 as uuidv4 } from 'uuid';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getCurrencyAmountFromCredits } from '@/utils/helpers/wallet';

// Enum for credits type with more descriptive names
enum CreditsType {
	FreeCredit = 'FreeCredit',
	PurchasedCredits = 'PurchasedCredits',
}

// Utility functions for date conversion
const convertToYYYYMMDD = (date: Date): number => {
	const year = date.getUTCFullYear();
	const month = date.getUTCMonth() + 1; // getUTCMonth() is zero-indexed
	const day = date.getUTCDate();

	return parseInt(`${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`, 10);
};

const convertFromYYYYMMDD = (yyyymmdd: number): Date => {
	const year = Math.floor(yyyymmdd / 10000);
	const month = Math.floor((yyyymmdd % 10000) / 100) - 1; // Subtract 1 for zero-indexed month
	const day = yyyymmdd % 100;

	return new Date(Date.UTC(year, month, day));
};

// Centralized credits type options
const CREDITS_TYPE_OPTIONS: RectangleRadiogroupOption[] = [
	{
		label: 'Free Credits',
		icon: Receipt,
		description: 'Grant credits without a charge.',
		value: CreditsType.FreeCredit,
		disabled: false,
	},
	{
		label: 'Purchased Credits',
		icon: Gift,
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

const TopupCard: FC<TopupCardProps> = ({ walletId, className, currency, conversion_rate = 1, onSuccess }) => {
	// State management with more explicit typing
	const [topupPayload, setTopupPayload] = useState<TopupPayload>({});

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
		const { credits_type, credits_to_add, expiry_date } = topupPayload;

		if (!credits_type) {
			toast.error('Please select a credits type');
			return false;
		}

		if (!credits_to_add || credits_to_add <= 0) {
			toast.error('Please enter a valid credits amount');
			return false;
		}

		if (expiry_date && convertFromYYYYMMDD(expiry_date).getTime() < Date.now()) {
			toast.error('Expiry date cannot be in the past');
			return false;
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
				expiry_date: topupPayload.expiry_date,
			});
		},
		onSuccess: async () => {
			toast.success('Wallet topped up successfully');
			onSuccess?.();
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
		<div className={cn('card space-y-4 lg:w-full', className)}>
			<FormHeader title='Add Credits' subtitle='Define number of credits to add to the wallet' variant='sub-header' />

			<RectangleRadiogroup
				title='Select Credit Type'
				options={CREDITS_TYPE_OPTIONS}
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
				description=''
			/>

			{/* Free Credits Input */}
			{topupPayload.credits_type === CreditsType.FreeCredit && (
				<Input
					variant='formatted-number'
					onChange={(e) => updateTopupPayload({ credits_to_add: e as unknown as number })}
					value={topupPayload.credits_to_add}
					suffix='credits'
					label='Free Credits'
					placeholder='Enter free credits'
					description={
						<span>
							{getCurrencyAmountFromCredits(conversion_rate, topupPayload.credits_to_add ?? 0)}
							{getCurrencySymbol(currency!)}
							{` will be credited to the wallet`}
						</span>
					}
				/>
			)}

			{/* Purchased Credits Input */}
			{topupPayload.credits_type === CreditsType.PurchasedCredits && (
				<>
					<Input
						variant='formatted-number'
						onChange={(e) => updateTopupPayload({ credits_to_add: e as unknown as number })}
						value={topupPayload.credits_to_add}
						suffix='credits'
						label='Purchased Credits'
						placeholder='Enter purchased credits'
						description={
							<span>
								{getCurrencyAmountFromCredits(conversion_rate, topupPayload.credits_to_add ?? 0)}
								{getCurrencySymbol(currency!)}
								{` will be credited to the wallet`}
							</span>
						}
					/>

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
				</>
			)}

			{topupPayload.credits_type && (
				<DatePicker
					minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
					label='Expiry Date'
					date={topupPayload.expiry_date ? convertFromYYYYMMDD(topupPayload.expiry_date) : undefined}
					setDate={(value) =>
						updateTopupPayload({
							expiry_date: value ? convertToYYYYMMDD(value) : undefined,
						})
					}
					className='w-full'
				/>
			)}

			<Spacer className='!mt-4' />

			<div className='w-full justify-end flex'>
				<Button isLoading={isPending} onClick={handleTopup} disabled={isPending || !topupPayload.credits_type}>
					Add Credits
				</Button>
			</div>
		</div>
	);
};

export default TopupCard;
