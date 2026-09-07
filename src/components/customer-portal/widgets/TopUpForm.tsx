import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { portalReturnUrl } from '../portalReturnUrl';
import { openPaymentUrl } from '@/utils/common/openPaymentUrl';
import { Button, Input, Toggle } from '@/components/atoms';
import { refreshAfterPayment } from '../refetchPortalQueries';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { formatMoney } from '@/utils/common/formatBalance';
import type { PaymentGatewayType, PortalTopUpRequest, SavedPaymentMethod } from '@/types/dto/CustomerPortalBilling';
import { WalletResponse } from '@/types/dto/Wallet';
import { portalPaymentMethodsQueryKey } from '../queryKeys';
import { rememberPendingCheckout } from '../useCheckoutReturn';
import usePortalIntegrations from '../usePortalIntegrations';

interface TopUpFormProps {
	wallet: WalletResponse;
	onDone?: () => void;
	/** Surfaces the action URL so a blocked redirect stays recoverable. */
	onActionUrl?: (url: string) => void;
}

const describeCard = (method: SavedPaymentMethod) =>
	method.card?.last4 ? `${method.card.brand ?? 'card'} •••• ${method.card.last4}` : method.id;

/**
 * Credit top-up for the customer portal.
 *
 * Narrower than the admin form by design: transaction reason, expiry and priority
 * are pinned server-side, so there is no free/purchased choice and no scheduling
 * fields. There is also no save-card option — portal checkouts always vault.
 *
 * Two exits, matching how the money moves:
 *   Pay now          — checkout; credits land once payment succeeds
 *   Generate invoice — invoice raised now, settled later
 */
const TopUpForm = ({ wallet, onDone, onActionUrl }: TopUpFormProps) => {
	const { t } = useTranslation('customer-portal');
	const { maySupport, supports, providersFor } = usePortalIntegrations();
	const [credits, setCredits] = useState('');
	const [description, setDescription] = useState('');
	const [useSavedMethod, setUseSavedMethod] = useState(false);
	// One key per *unchanged* attempt. Retrying the same submission must reuse it so
	// the server dedups, but editing the amount after a failure makes it a different
	// request — reusing the key there could return the original checkout, or be
	// rejected, if the first call actually succeeded and only its response was lost.
	const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
	const [submittedPayload, setSubmittedPayload] = useState<string | null>(null);

	const payloadFingerprint = `${credits}|${description}|${useSavedMethod}`;
	// An edit after a failed submit invalidates the key for the next attempt.
	const keyForSubmission = submittedPayload !== null && submittedPayload !== payloadFingerprint ? crypto.randomUUID() : idempotencyKey;

	// Optimistic: only hidden when /integrations has loaded and names no checkout
	// provider. A slow or failing integrations call must not remove the pay button.
	const canCheckout = maySupport('checkout');

	// The resolver refuses to guess: with more than one checkout-capable gateway it
	// returns "Specify which payment provider to use" rather than falling back to a
	// default, so the provider is always named explicitly.
	const checkoutProviders = providersFor('checkout');
	const [selectedProvider, setSelectedProvider] = useState<PaymentGatewayType | ''>('');
	// providersFor sorts the capability default first, so [0] is the tenant's pick.
	const effectiveProvider = selectedProvider || checkoutProviders[0];

	const { data: methods } = useQuery({
		queryKey: portalPaymentMethodsQueryKey,
		queryFn: () => CustomerPortalApi.getPaymentMethods(),
		enabled: canCheckout,
	});

	// Only a method that can be charged unattended is worth offering here.
	const chargeableMethod = (methods?.providers ?? [])
		.flatMap((group) => group.items)
		.find((method) => method.can_auto_charge && method.status === 'ACTIVE' && method.is_default);

	// Two independent reasons this can be unavailable, and they need different
	// wording: no connected provider can charge off-session, or the customer has
	// no saved card yet. Shown disabled either way rather than hidden, so the
	// option reads as a state to resolve instead of a feature that does not exist.
	const providerCanAutoCharge = supports('auto_charge');
	const savedMethodDisabledReason = !providerCanAutoCharge
		? t('topUp.savedMethodUnsupported')
		: !chargeableMethod
			? t('topUp.savedMethodNone')
			: undefined;

	const { mutate: topUp, isPending } = useMutation({
		mutationFn: async () => {
			// Recorded so an unchanged retry reuses this key while an edited one does not.
			setSubmittedPayload(payloadFingerprint);
			setIdempotencyKey(keyForSubmission);

			const payload: PortalTopUpRequest = {
				credits_to_add: credits,
				idempotency_key: keyForSubmission,
				...(description ? { description } : {}),
				checkout: {
					// Sent explicitly. The resolver only picks for us when exactly one
					// provider has the capability — with two it refuses as ambiguous and
					// ignores is_default entirely. Chosen from /integrations rather than
					// asked of the customer, who should never learn the gateway.
					...(effectiveProvider ? { payment_provider: effectiveProvider } : {}),
					use_saved_method: useSavedMethod && !!chargeableMethod,
					success_url: portalReturnUrl(),
					cancel_url: portalReturnUrl(),
				},
			};
			return CustomerPortalApi.topUpWallet(wallet.id, payload);
		},
		onSuccess: async (response) => {
			const action = response.checkout_session?.payment_action;

			// use_saved_method can settle outright, and some providers vault
			// server-to-server — so an absent action means done, not broken.
			if (action?.url) {
				if (response.checkout_session?.id) rememberPendingCheckout(response.checkout_session.id);
				// Surface the link first, then open it. Both, not either: the open runs in
				// an async callback rather than the click, so a popup blocker can stop it,
				// and the dialog stays on the page carrying the link either way — for a
				// blocked open, and for coming back to it after the tab is closed.
				onActionUrl?.(action.url);
				openPaymentUrl(action.url);
				return;
			}

			// No action to follow is not automatically a failure: use_saved_method
			// charges the card outright, and the session comes back completed with
			// nothing to redirect to. Read the status rather than inferring from the
			// absent action — treating that as an error rejected a payment that had
			// already succeeded.
			const status = response.checkout_session?.checkout_status;
			if (status === 'failed' || status === 'expired') {
				toast.error(response.checkout_session?.failure_reason || t('errors.checkoutUnavailable'));
				return;
			}
			if (response.checkout_session && !action?.url && status !== 'completed') {
				// Still settling and nowhere to send them: the wallet updates on the
				// webhook, so say it is in flight rather than claiming either outcome.
				toast.success(t('topUp.successPending'));
			} else {
				toast.success(status === 'completed' ? t('topUp.paid') : t('topUp.successPending'));
			}
			setCredits('');
			setDescription('');
			setIdempotencyKey(crypto.randomUUID());
			setSubmittedPayload(null);
			onDone?.();
			// Re-checks until the credit lands: the transaction and its invoice are
			// written by a webhook that can arrive after the response does.
			await refreshAfterPayment();
		},
		onError: (error: Error) => toast.error(error.message || t('errors.topUp')),
	});

	const parsedCredits = Number(credits);
	const isValid = credits !== '' && Number.isFinite(parsedCredits) && parsedCredits > 0;

	const currencySymbol = getCurrencySymbol(wallet.currency ?? 'USD');
	// topup_conversion_rate, not conversion_rate: the backend prices a top-up with
	// GetCurrencyAmountFromCredits(credits, w.TopupConversionRate), so using the
	// spend rate here would quote an amount the customer is not actually charged.
	const conversionRate = Number(wallet.topup_conversion_rate ?? wallet.conversion_rate ?? 1) || 1;
	const chargeAmount = isValid ? formatMoney(parsedCredits * conversionRate) : null;

	return (
		<div className='flex flex-col gap-4'>
			<Input
				variant='formatted-number'
				label={t('topUp.creditsLabel')}
				placeholder={t('topUp.creditsPlaceholder')}
				value={credits}
				onChange={setCredits}
				disabled={isPending}
				suffix={t('wallet.credits')}
				description={chargeAmount ? <span>{t('topUp.chargeSummary', { amount: `${currencySymbol}${chargeAmount}` })}</span> : undefined}
			/>

			<Input
				label={t('topUp.descriptionLabel')}
				placeholder={t('topUp.descriptionPlaceholder')}
				value={description}
				onChange={setDescription}
				disabled={isPending}
			/>

			{/* Shown for a single provider too, not just a choice of several: the customer
			    is about to be handed to a third party, and naming it is part of telling
			    them what happens next. It is simply already selected. */}
			{canCheckout && checkoutProviders.length > 0 && (
				<div>
					<p className='text-sm font-medium mb-1 text-content'>{t('topUp.providerLabel')}</p>
					{/* Inline rather than a Select: a Radix Select portals its list outside
					    the dialog, and this dialog is modal={false}, so choosing an option
					    reads as an outside click to the dismissable layer and closed the
					    whole dialog mid-choice. With a handful of providers there is no
					    reason to introduce a second dismissable layer at all. */}
					<div role='radiogroup' aria-label={t('topUp.providerLabel')} className='flex flex-wrap gap-2'>
						{checkoutProviders.map((provider: PaymentGatewayType) => {
							const isSelected = effectiveProvider === provider;
							return (
								<button
									key={provider}
									type='button'
									role='radio'
									aria-checked={isSelected}
									onClick={() => setSelectedProvider(provider)}
									disabled={isPending}
									className='px-3.5 py-2 text-sm rounded-lg border transition-colors disabled:opacity-50'
									style={{
										borderColor: isSelected ? 'var(--portal-primary, #2563eb)' : 'var(--portal-border, #E9E9E9)',
										color: isSelected ? 'var(--portal-primary, #2563eb)' : 'var(--portal-text-primary, #09090b)',
										backgroundColor: isSelected ? 'var(--portal-bg, #eff6ff)' : 'transparent',
									}}>
									{t(`paymentProviders.${provider}`)}
								</button>
							);
						})}
					</div>
					{/* Only a choice when there is one to make — with a single provider the
					    hint would invite a decision the customer does not have. */}
					{checkoutProviders.length > 1 && <p className='text-xs mt-1.5 text-content-secondary'>{t('topUp.providerHint')}</p>}
				</div>
			)}

			{canCheckout && (
				<Toggle
					label={
						chargeableMethod ? t('topUp.useSavedMethod', { method: describeCard(chargeableMethod) }) : t('topUp.useSavedMethodEmptyLabel')
					}
					description={savedMethodDisabledReason ?? t('topUp.useSavedMethodHint')}
					checked={useSavedMethod && !savedMethodDisabledReason}
					onChange={setUseSavedMethod}
					disabled={isPending || !!savedMethodDisabledReason}
				/>
			)}

			{/* Not gated on checkout being configured. Without it the request still
			    raises an invoice, and the response says so — announcing the account's
			    payment setup to the customer told them about the tenant's configuration
			    rather than about anything they can do, and blocked an action that works. */}
			<div className='pt-1'>
				<Button className='w-full' onClick={() => topUp()} disabled={!isValid || isPending} isLoading={isPending}>
					{t('topUp.payNow')}
				</Button>
				{canCheckout && <p className='mt-2 text-center text-xs text-content-tertiary'>{t('topUp.cardSavedNotice')}</p>}
			</div>
		</div>
	);
};

export default TopUpForm;
