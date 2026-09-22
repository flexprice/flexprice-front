import { Button, DatePicker, Input, Spacer } from '@/components/atoms';
import { FC, useState, useCallback, useMemo } from 'react';
import RectangleRadiogroup, { RectangleRadiogroupOption } from '../RectangleRadiogroup';
import { useMutation, useQuery } from '@tanstack/react-query';
import WalletApi from '@/api/WalletApi';
import ConnectionApi from '@/api/ConnectionApi';
import toast from 'react-hot-toast';
import { getCurrencySymbol } from '@/utils';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { WALLET_TRANSACTION_REASON, CONNECTION_PROVIDER_TYPE } from '@/models';
import { getCurrencyAmountFromCredits } from '@/utils';
import { TopupWalletPayload } from '@/types';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { PaymentUrlSuccessDialog } from '@/components/atoms';
import { openPaymentUrl } from '@/utils/common/openPaymentUrl';
import { useMinCreditExpiryDate, toDateOnlyUtc } from '@/hooks/useMinCreditExpiryDate';
import PendingCheckoutSessionDialog from '../PendingCheckoutSessionDialog';
import { isBlockedByExistingEntity, supersedeExistingEntity } from '@/utils/common/entityCreation';
import type { TopupWalletResponse } from '@/types';
import { useTranslation } from 'react-i18next';

// Enum for credits type with more descriptive names
enum CreditsType {
	FreeCredit = 'FreeCredit',
	PurchasedCredits = 'PurchasedCredits',
}

/**
 * How a purchased top-up settles.
 *   SkipInvoice — credits land immediately, nothing is billed
 *   Invoice     — an invoice is raised for the customer to settle later
 *   Checkout    — hosted checkout; credits land once payment succeeds
 */
enum TopupMode {
	SkipInvoice = 'SkipInvoice',
	Invoice = 'Invoice',
	Checkout = 'Checkout',
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
	/** Receives the hosted checkout URL so the caller can show it for sharing. */
	onCheckoutUrl?: (url: string) => void;
	/** When provided, expiry date must be after the customer's active subscription period end */
	customerId?: string;
}

const TopupCard: FC<TopupCardProps> = ({ walletId, currency, conversion_rate = 1, onSuccess, onCheckoutUrl, customerId }) => {
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
	const [checkoutPopup, setCheckoutPopup] = useState({ isOpen: false, paymentUrl: '', isCopied: false });

	// The session that blocked the last checkout attempt. Kept in state rather than
	// raised as a toast: cancelling a payment the customer may be completing right
	// now is a decision, not a notification.
	const [blockingSession, setBlockingSession] = useState<NonNullable<TopupWalletResponse['checkout_session']> | null>(null);

	const [topupPayload, setTopupPayload] = useState<TopupPayload>({
		credits_type: CreditsType.FreeCredit,
		credits_to_add: undefined,
		generate_invoice: undefined,
		expiry_date: undefined,
		priority: undefined,
		reference_id: undefined,
		description: undefined,
	});

	// Checkout hard-codes payment_provider: 'razorpay' below, so it only ever works when a
	// Razorpay connection exists — a tenant with, say, only Stripe connected would see a
	// working-looking Checkout link that always fails. Only fetch once the dialog can
	// actually show the button (purchased credits).
	const { data: connectionsResponse } = useQuery({
		queryKey: ['connections', 'published'],
		queryFn: () => ConnectionApi.ListPublished(),
		enabled: topupPayload.credits_type === CreditsType.PurchasedCredits,
	});
	const hasRazorpayConnection = (connectionsResponse?.connections || []).some(
		(connection) => connection.provider_type === CONNECTION_PROVIDER_TYPE.RAZORPAY,
	);

	// Determine transaction reason based on credits type and invoice generation
	const getTransactionReason = useCallback(
		(mode: TopupMode): WALLET_TRANSACTION_REASON => {
			if (topupPayload.credits_type === CreditsType.FreeCredit) {
				return WALLET_TRANSACTION_REASON.FREE_CREDIT_GRANT;
			}
			// Checkout is pay-first, so it rides the invoiced reason too — the backend
			// rejects checkout on any other reason.
			return mode === TopupMode.SkipInvoice
				? WALLET_TRANSACTION_REASON.PURCHASED_CREDIT_DIRECT
				: WALLET_TRANSACTION_REASON.PURCHASED_CREDIT_INVOICED;
		},
		[topupPayload.credits_type],
	);

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
	// `supersede` only ever comes from the operator confirming it in
	// PendingCheckoutSessionDialog; a first attempt always goes out under the
	// server default, which is to be rejected by a session already in flight.
	const {
		isPending,
		mutate: topupWallet,
		variables: pendingAttempt,
	} = useMutation({
		mutationKey: ['topupWallet', walletId],
		mutationFn: ({ mode, supersede }: { mode: TopupMode; supersede?: boolean }) => {
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
				transaction_reason: getTransactionReason(mode),
				expiry_date_utc: topupPayload.expiry_date_utc,
				priority: topupPayload.priority,
				description: topupPayload.description,
				...(mode === TopupMode.Checkout
					? {
							checkout: {
								payment_provider: 'razorpay',
								// No max_mandate_limit: a one-off top-up needs no recurring-debit
								// mandate, and requiring one would block the customer at checkout.
								success_url: window.location.href,
								cancel_url: window.location.href,
								// The rejected attempt created nothing, so the reference id stays
								// valid as the idempotency key for this retry.
								...(supersede ? { entity_creation_options: supersedeExistingEntity } : {}),
							},
						}
					: {}),
			});
		},
		onSuccess: async (response, { mode }) => {
			// Checked first. A blocked response is a 200 carrying a complete, live
			// session — the one already in flight — so every branch below would
			// otherwise hand the operator another top-up's checkout link to pass on to
			// the customer, for an amount they never entered.
			if (isBlockedByExistingEntity(response?.checkout_session?.entity_creation_result)) {
				setBlockingSession(response?.checkout_session ?? null);
				return;
			}
			setBlockingSession(null);

			const checkoutUrl =
				response?.checkout_session?.payment_action?.url ??
				response?.checkout_session?.payment_action?.redirect_url ??
				response?.checkout_session?.payment_url;
			if (mode === TopupMode.Checkout && checkoutUrl) {
				// Show the link first, then try to open it. The open runs in an async
				// callback rather than directly in the click, so a popup blocker will often
				// stop it — the dialog carries the URL so that stays recoverable, and it is
				// also the link the operator shares with the customer.
				setCheckoutPopup({ isOpen: true, paymentUrl: checkoutUrl, isCopied: false });
				openPaymentUrl(checkoutUrl);
				onCheckoutUrl?.(checkoutUrl);
			} else if (getTransactionReason(mode) === WALLET_TRANSACTION_REASON.PURCHASED_CREDIT_INVOICED) {
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
			// reference_id doubles as this request's idempotency key (see the field's
			// description below). Clear it so an immediate retry doesn't resend the same
			// key against the failed attempt and get rejected as a duplicate.
			setTopupPayload((prev) => ({ ...prev, reference_id: undefined }));
		},
	});

	// Handle topup submission
	const handleTopup = useCallback(
		(mode: TopupMode, supersede?: boolean) => {
			if (validateTopup() && walletId) {
				topupWallet({ mode, supersede });
			}
		},
		[validateTopup, walletId, topupWallet],
	);

	// Update payload with type-safe setter
	const updateTopupPayload = useCallback((updates: Partial<TopupPayload>) => {
		setTopupPayload((prev) => ({
			...prev,
			...updates,
		}));
	}, []);

	const handleCopyCheckoutUrl = async () => {
		try {
			await navigator.clipboard.writeText(checkoutPopup.paymentUrl);
			setCheckoutPopup((prev) => ({ ...prev, isCopied: true }));
			setTimeout(() => setCheckoutPopup((prev) => ({ ...prev, isCopied: false })), 2000);
		} catch {
			toast.error('Could not copy the link');
		}
	};

	return (
		<DialogContent className='bg-surface sm:max-w-[600px]'>
			<PaymentUrlSuccessDialog
				isOpen={checkoutPopup.isOpen}
				paymentUrl={checkoutPopup.paymentUrl}
				isCopied={checkoutPopup.isCopied}
				onClose={() => setCheckoutPopup({ isOpen: false, paymentUrl: '', isCopied: false })}
				onCopyUrl={handleCopyCheckoutUrl}
				onGoToLink={() => openPaymentUrl(checkoutPopup.paymentUrl)}
			/>
			<PendingCheckoutSessionDialog
				isOpen={blockingSession !== null}
				sessionId={blockingSession?.id}
				paymentUrl={blockingSession?.payment_action?.url ?? blockingSession?.payment_action?.redirect_url ?? blockingSession?.payment_url}
				expiresAt={blockingSession?.expires_at}
				isSuperseding={isPending && pendingAttempt?.supersede === true}
				onClose={() => setBlockingSession(null)}
				onSupersede={() => handleTopup(TopupMode.Checkout, true)}
			/>
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
				<p className='text-sm text-content-muted -my-2'>
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
					// Guarded like the sibling fields: priority starts undefined, which makes
					// the input uncontrolled until the first keystroke and warns on the switch.
					value={topupPayload.priority ?? ''}
					onChange={(e) => {
						if (e) {
							updateTopupPayload({ priority: Number(e) });
						} else {
							updateTopupPayload({ priority: undefined });
						}
					}}
				/>
			)}

			{/* Reference ID and description for purchased credits. Previously gated on the
			    generate-invoice toggle, which the three settle actions replaced. */}
			{topupPayload.credits_type === CreditsType.PurchasedCredits && (
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

			<Spacer className='!mt-4' />

			{/* Three exits for purchased credits, replacing the generate-invoice toggle:
			    the choice of how it settles IS the submit action. Free credits keep a
			    single button — nothing is ever billed for them. */}
			<div className='w-full justify-end flex gap-2'>
				{topupPayload.credits_type === CreditsType.PurchasedCredits ? (
					<>
						<Button
							variant='outline'
							isLoading={isPending && pendingAttempt?.mode === TopupMode.SkipInvoice}
							onClick={() => handleTopup(TopupMode.SkipInvoice)}
							disabled={isPending}>
							{t('wallet.topup.skipInvoice')}
						</Button>
						<Button
							variant='outline'
							isLoading={isPending && pendingAttempt?.mode === TopupMode.Invoice}
							onClick={() => handleTopup(TopupMode.Invoice)}
							disabled={isPending}>
							{t('wallet.topup.generateInvoiceAction')}
						</Button>
						{hasRazorpayConnection && (
							<Button
								isLoading={isPending && pendingAttempt?.mode === TopupMode.Checkout}
								onClick={() => handleTopup(TopupMode.Checkout)}
								disabled={isPending}>
								{t('wallet.topup.checkoutLink')}
							</Button>
						)}
					</>
				) : (
					<Button
						isLoading={isPending}
						onClick={() => handleTopup(TopupMode.SkipInvoice)}
						disabled={isPending || !topupPayload.credits_type}>
						{t('wallet.topup.addCredits')}
					</Button>
				)}
			</div>
		</DialogContent>
	);
};

export default TopupCard;
