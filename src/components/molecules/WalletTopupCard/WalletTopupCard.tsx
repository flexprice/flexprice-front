import { Button, DatePicker, Input, Spacer } from '@/components/atoms';
import { FC, useState, useCallback, useMemo } from 'react';
import RectangleRadiogroup, { RectangleRadiogroupOption } from '../RectangleRadiogroup';
import { useMutation } from '@tanstack/react-query';
import WalletApi from '@/api/WalletApi';
import toast from 'react-hot-toast';
import { getCurrencySymbol } from '@/utils';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { WALLET_TRANSACTION_REASON } from '@/models';
import { Label, Switch } from '@/components/ui';
import { getCurrencyAmountFromCredits } from '@/utils';
import { TopupWalletPayload } from '@/types';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { useMinCreditExpiryDate, toDateOnlyUtc } from '@/hooks/useMinCreditExpiryDate';
import { useTranslation } from 'react-i18next';

// Enum for credits type with more descriptive names
enum CreditsType {
	FreeCredit = 'FreeCredit',
	PurchasedCredits = 'PurchasedCredits',
}

// Extended payload type for more comprehensive state management
interface TopupPayload extends Partial<TopupWalletPayload> {
	credits_type?: CreditsType;
	generate_invoice?: boolean;
	reference_id?: string;
}

interface TopupCardProps {
	walletId?: string;
	className?: string;
	currency?: string;
	conversion_rate?: number;
	onSuccess?: () => void;
	/** When provided, expiry date must be after the customer's active subscription period end */
	customerId?: string;
}

const TopupCard: FC<TopupCardProps> = ({ walletId, currency, conversion_rate = 1, onSuccess, customerId }) => {
	const { t } = useTranslation('billing');
	const { minExpiryDate } = useMinCreditExpiryDate(customerId);

	const creditsTypeOptions = useMemo<RectangleRadiogroupOption[]>(
		() => [
			{
				label: t('wallet.topup.typeFree'),
				description: t('wallet.topup.typeFreeDesc'),
				value: CreditsType.FreeCredit,
				disabled: false,
			},
			{
				label: t('wallet.topup.typePurchased'),
				description: t('wallet.topup.typePurchasedDesc'),
				value: CreditsType.PurchasedCredits,
				disabled: false,
			},
		],
		[t],
	);

	// State management with more explicit typing
	const [topupPayload, setTopupPayload] = useState<TopupPayload>({
		credits_type: CreditsType.FreeCredit,
		credits_to_add: undefined,
		generate_invoice: undefined,
		expiry_date: undefined,
		priority: undefined,
		reference_id: undefined,
		description: undefined,
	});

	// Determine transaction reason based on credits type and invoice generation
	const getTransactionReason = useCallback((): WALLET_TRANSACTION_REASON => {
		const { credits_type, generate_invoice } = topupPayload;

		switch (credits_type) {
			case CreditsType.FreeCredit:
				return WALLET_TRANSACTION_REASON.FREE_CREDIT_GRANT;
			case CreditsType.PurchasedCredits:
				return generate_invoice ? WALLET_TRANSACTION_REASON.PURCHASED_CREDIT_INVOICED : WALLET_TRANSACTION_REASON.PURCHASED_CREDIT_DIRECT;
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
			const expiryDateOnly = toDateOnlyUtc(expiry_date_utc);

			if (minExpiryDate) {
				if (expiryDateOnly.getTime() < minExpiryDate.getTime()) {
					toast.error('Expiry date must be after the current subscription period end');
					return false;
				}
			} else {
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				if (expiryDateOnly.getTime() < today.getTime()) {
					toast.error('Expiry date cannot be in the past');
					return false;
				}
			}
		}

		return true;
	}, [topupPayload, minExpiryDate]);

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
				idempotency_key: topupPayload.reference_id,
				transaction_reason: getTransactionReason(),
				expiry_date_utc: topupPayload.expiry_date_utc,
				priority: topupPayload.priority,
				description: topupPayload.description,
			});
		},
		onSuccess: async () => {
			// Show different message based on transaction type
			const transactionReason = getTransactionReason();
			if (transactionReason === WALLET_TRANSACTION_REASON.PURCHASED_CREDIT_INVOICED) {
				toast.success('Invoice created successfully. Credits will be added once the invoice is paid.');
			} else {
				toast.success('Wallet topped up successfully');
			}
			onSuccess?.();
			setTopupPayload({
				credits_type: CreditsType.FreeCredit,
				credits_to_add: undefined,
				generate_invoice: undefined,
				expiry_date: undefined,
				priority: undefined,
				reference_id: undefined,
				description: undefined,
			});
			await refetchWalletData();
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to topup wallet');
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
				<DialogTitle>{t('wallet.topup.dialogTitle')}</DialogTitle>
			</DialogHeader>
			<div className='grid gap-4 py-4'>
				<RectangleRadiogroup
					title={t('wallet.topup.creditTypeTitle')}
					options={creditsTypeOptions.map((option) => ({
						...option,
						description: undefined,
					}))}
					value={topupPayload.credits_type}
					onChange={(value) => {
						// Reset related fields when changing credits type
						// Set generate_invoice to true by default for Purchased credits
						updateTopupPayload({
							credits_type: value as CreditsType,
							credits_to_add: undefined,
							generate_invoice: value === CreditsType.PurchasedCredits ? true : undefined,
							expiry_date: undefined,
							reference_id: undefined,
							description: undefined,
						});
					}}
				/>
				<p className='text-sm text-gray-500 -my-2'>
					{topupPayload.credits_type === CreditsType.PurchasedCredits
						? t('wallet.topup.typeHintPurchased')
						: t('wallet.topup.typeHintFree')}
				</p>
			</div>

			{/* Free Credits Input */}
			{topupPayload.credits_type && (
				<Input
					variant='formatted-number'
					onChange={(e) => updateTopupPayload({ credits_to_add: e as unknown as number })}
					value={topupPayload.credits_to_add ?? ''}
					suffix={t('payments.transactions.creditsSuffix')}
					label={t('wallet.topup.creditsLabel')}
					placeholder={t('wallet.topup.creditsPlaceholder')}
					description={
						<>
							{topupPayload.credits_to_add && topupPayload.credits_to_add > 0 && (
								<span>
									{getCurrencySymbol(currency!)}
									{getCurrencyAmountFromCredits(conversion_rate, topupPayload.credits_to_add ?? 0)}
									{t('wallet.topup.creditPreviewSuffix')}
								</span>
							)}
						</>
					}
				/>
			)}

			{topupPayload.credits_type && (
				<DatePicker
					minDate={
						minExpiryDate
							? new Date(minExpiryDate.getUTCFullYear(), minExpiryDate.getUTCMonth(), minExpiryDate.getUTCDate())
							: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 1, 0, 0, 0, 0))
					}
					label={t('wallet.topup.expiryDate')}
					date={topupPayload.expiry_date_utc ? new Date(topupPayload.expiry_date_utc) : undefined}
					setDate={(value) =>
						updateTopupPayload({
							expiry_date_utc: value
								? new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0)).toISOString()
								: undefined,
						})
					}
					className='w-full'
					labelClassName='text-foreground'
				/>
			)}
			{topupPayload.credits_type && (
				<Input
					label={t('wallet.topup.priority')}
					className='w-full'
					placeholder={t('wallet.topup.priorityPlaceholder')}
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

			{/* Reference ID Input for Purchased Credits with Invoice */}
			{topupPayload.credits_type === CreditsType.PurchasedCredits && topupPayload.generate_invoice && (
				<>
					<Input
						label={t('wallet.topup.referenceId')}
						className='w-full'
						placeholder={t('wallet.topup.referenceIdPlaceholder')}
						value={topupPayload.reference_id || ''}
						onChange={(e) => updateTopupPayload({ reference_id: e as string })}
						description={t('wallet.topup.referenceIdDescription')}
					/>

					<Input
						label={t('wallet.topup.descriptionOptional')}
						className='w-full'
						placeholder={t('wallet.topup.descriptionPlaceholder')}
						value={topupPayload.description || ''}
						onChange={(e) => updateTopupPayload({ description: e as string })}
						description={t('wallet.topup.descriptionHint')}
					/>
				</>
			)}

			{topupPayload.credits_type === CreditsType.PurchasedCredits && (
				<div className='flex items-center space-x-4 s'>
					<Switch
						id='generate-invoice'
						checked={topupPayload.generate_invoice || false}
						onCheckedChange={(value) => {
							updateTopupPayload({
								generate_invoice: value,
								// Clear reference_id when invoice generation is disabled
								reference_id: value ? topupPayload.reference_id : undefined,
							});
						}}
					/>
					<Label htmlFor='generate-invoice'>
						<p className='font-medium text-sm text-[#18181B] peer-checked:text-black'>{t('wallet.topup.generateInvoice')}</p>
					</Label>
				</div>
			)}

			<Spacer className='!mt-4' />

			<div className='w-full justify-end flex'>
				<Button isLoading={isPending} onClick={handleTopup} disabled={isPending || !topupPayload.credits_type}>
					{t('wallet.topup.addCredits')}
				</Button>
			</div>
		</DialogContent>
	);
};

export default TopupCard;
