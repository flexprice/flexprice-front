import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Clock, CreditCard, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/atoms/Button';
import { PADDLE_URL_PARAMS, decodeCheckoutToken, isTokenExpired, removePaddleParamsFromUrl } from '@/core/paddle';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';
import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaddleState = 'loading' | 'open' | 'expired' | 'invalid';

enum MoyasarState {
	Loading = 'loading',
	Form = 'form',
	Success = 'success',
	Processing = 'processing',
	Failed = 'failed',
}

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Moyasar: any;
	}
}

const MOYASAR_FORM_SELECTOR = 'moyasar-checkout-form';
const TOKENIZATION_AMOUNT = 100; // 1 SAR in halalas

const moyasarTokenSchema = z.object({
	publishable_key: z.string().min(1),
	flexprice_payment_id: z.string().min(1),
	given_id: z.string().min(1),
	success_url: z.string().optional(),
});

// ─── Shared wrappers ──────────────────────────────────────────────────────────

const PageWrap = ({ children }: { children: React.ReactNode }) => (
	<div className='min-h-screen flex items-center justify-center bg-zinc-50 px-4 py-12 sm:px-6'>
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: 'easeOut' }}
			className='w-full max-w-lg'>
			<Card className='bg-white border border-zinc-200 rounded-xl shadow-sm'>{children}</Card>
		</motion.div>
	</div>
);

const LoadingSpinner = ({ message }: { message: string }) => (
	<PageWrap>
		<CardContent className='flex flex-col items-center gap-4 py-16'>
			<Loader2 className='h-10 w-10 animate-spin text-zinc-400' />
			<p className='text-sm text-zinc-500'>{message}</p>
		</CardContent>
	</PageWrap>
);

const ResultCard = ({
	icon,
	title,
	description,
	action,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	action?: React.ReactNode;
}) => (
	<PageWrap>
		<CardHeader className='text-center pb-4 pt-10 px-8'>
			<div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100'>{icon}</div>
			<CardTitle className='text-[20px] font-medium text-zinc-950 leading-normal'>{title}</CardTitle>
		</CardHeader>
		<CardContent className='text-center px-8 pb-10'>
			<p className='text-base text-zinc-500 mb-8 leading-normal max-w-md mx-auto'>{description}</p>
			{action}
		</CardContent>
	</PageWrap>
);

// ─── Moyasar branch ───────────────────────────────────────────────────────────

const decodeMoyasarToken = (rawToken: string) => {
	try {
		const part = rawToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
		const padded = part.padEnd(part.length + ((4 - (part.length % 4)) % 4), '=');
		const result = moyasarTokenSchema.safeParse(JSON.parse(atob(padded)));
		return result.success ? result.data : null;
	} catch {
		return null;
	}
};

const MoyasarCheckout = ({ rawToken }: { rawToken: string }) => {
	const { t } = useTranslation('customers');
	const [searchParams] = useSearchParams();
	const [state, setState] = useState<MoyasarState>(MoyasarState.Loading);
	const [errorMsg, setErrorMsg] = useState('');
	const [formReady, setFormReady] = useState(false);
	const moyasarInitialized = useRef(false);

	// Decode once — both form mode and result mode need success_url.
	const tokenPayload = decodeMoyasarToken(rawToken);

	// Moyasar appends ?status=...&id=... to the callback URL after 3DS.
	const redirectStatus = searchParams.get('status');
	const redirectPaymentId = searchParams.get('id');
	const isResultMode = Boolean(redirectStatus && redirectPaymentId);

	// Effect 1: validate token and determine state. For form mode, sets state to Form
	// so React renders the container div before Effect 2 tries to mount Moyasar into it.
	useEffect(() => {
		if (!tokenPayload) {
			setState(MoyasarState.Failed);
			setErrorMsg(t('moyasarAutopay.formLoadFailed'));
			return;
		}

		if (isResultMode) {
			if (redirectStatus === 'paid' || redirectStatus === 'captured') {
				setState(MoyasarState.Success);
			} else if (redirectStatus === 'failed' || redirectStatus === 'canceled') {
				setErrorMsg('Card authentication failed. Please try again.');
				setState(MoyasarState.Failed);
			} else {
				// initiated / in_progress — webhook will reconcile
				setState(MoyasarState.Processing);
			}
			return;
		}

		if (!window.Moyasar) {
			setState(MoyasarState.Failed);
			setErrorMsg('Moyasar.js failed to load. Please refresh.');
			return;
		}

		// Transition to Form so React renders the container div before Effect 2 runs.
		setState(MoyasarState.Form);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [rawToken, isResultMode]);

	// Effect 2: mount Moyasar.js into the container div once it's in the DOM.
	useEffect(() => {
		if (state !== MoyasarState.Form || moyasarInitialized.current || !tokenPayload) return;
		moyasarInitialized.current = true;

		const { publishable_key, flexprice_payment_id, given_id } = tokenPayload;

		// Callback URL is this same page with the same token so the result
		// handler can read success_url from the JWT after Moyasar's 3DS redirect.
		const callbackUrl = `${window.location.origin}/checkout?provider=moyasar&token=${encodeURIComponent(rawToken)}`;

		window.Moyasar.init({
			element: `.${MOYASAR_FORM_SELECTOR}`,
			amount: TOKENIZATION_AMOUNT,
			currency: 'SAR',
			description: 'Autopay card setup',
			publishable_api_key: publishable_key,
			callback_url: callbackUrl,
			methods: ['creditcard'],
			given_id: given_id,
			credit_card: { save_card: true },
			metadata: { flexprice_payment_id },
		});

		setFormReady(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state]);

	if (state === MoyasarState.Loading) return <LoadingSpinner message={t('moyasarAutopay.loadingSetup')} />;

	if (state === MoyasarState.Success) {
		const successUrl = tokenPayload?.success_url;
		if (successUrl) {
			window.location.replace(successUrl);
			return <LoadingSpinner message={t('moyasarAutopay.loadingSetup')} />;
		}
		return (
			<ResultCard
				icon={<CheckCircle className='h-9 w-9 text-green-500' />}
				title={t('moyasarAutopay.cardSavedTitle')}
				description={t('moyasarAutopay.cardSavedDescription')}
			/>
		);
	}

	if (state === MoyasarState.Processing) {
		return (
			<ResultCard
				icon={<Clock className='h-9 w-9 text-zinc-500' />}
				title={t('moyasarAutopay.cardSetupInProgressTitle')}
				description={t('moyasarAutopay.cardSetupInProgressDescription')}
			/>
		);
	}

	if (state === MoyasarState.Failed) {
		return (
			<ResultCard
				icon={<AlertCircle className='h-9 w-9 text-red-500' />}
				title={t('moyasarAutopay.cardSetupFailedTitle')}
				description={errorMsg || t('moyasarAutopay.cardSetupFailedDefaultDescription')}
				action={
					<Button onClick={() => window.location.reload()} variant='outline' className='min-w-[140px]'>
						{t('moyasarAutopay.tryAgain')}
					</Button>
				}
			/>
		);
	}

	// Form state
	return (
		<PageWrap>
			<CardHeader className='text-center pb-4 pt-10 px-8'>
				<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100'>
					<CreditCard className='h-8 w-8 text-zinc-600' />
				</div>
				<CardTitle className='text-[20px] font-medium text-zinc-950'>{t('moyasarAutopay.formTitle')}</CardTitle>
			</CardHeader>
			<CardContent className='px-8 pb-10'>
				<p className='text-sm text-zinc-500 text-center mb-6'>{t('moyasarAutopay.formDesc')}</p>
				<div className={`${MOYASAR_FORM_SELECTOR} ${!formReady ? 'opacity-0' : ''}`} />
			</CardContent>
		</PageWrap>
	);
};

// ─── Paddle branch ────────────────────────────────────────────────────────────

const PaddleCheckout = () => {
	const { t } = useTranslation('common');
	const [searchParams] = useSearchParams();
	const [state, setState] = useState<PaddleState>('loading');
	const paddleInitialized = useRef(false);

	useEffect(() => {
		const txnId = searchParams.get(PADDLE_URL_PARAMS.TXN);
		const rawToken = searchParams.get(PADDLE_URL_PARAMS.TOKEN);

		if (!txnId || !rawToken) {
			setState('invalid');
			return;
		}

		const payload = decodeCheckoutToken(rawToken);
		if (!payload) {
			setState('invalid');
			return;
		}
		if (isTokenExpired(payload)) {
			setState('expired');
			return;
		}

		const Paddle = window.Paddle;
		if (!Paddle) {
			setState('invalid');
			return;
		}

		removePaddleParamsFromUrl();

		if (paddleInitialized.current) return;
		paddleInitialized.current = true;

		const environment = payload.client_side_token.startsWith('test_') ? 'sandbox' : 'production';
		Paddle.Environment.set(environment);
		Paddle.Initialize({
			token: payload.client_side_token,
			checkout: { settings: { displayMode: 'overlay', theme: 'light', locale: 'en', successUrl: payload.success_url } },
		});

		setTimeout(() => {
			Paddle.Checkout.open({
				transactionId: txnId,
				settings: { displayMode: 'overlay', variant: 'one-page', successUrl: payload.success_url },
			});
			setState('open');
		}, 100);
	}, [searchParams]);

	if (state === 'loading') {
		return (
			<div className='min-h-screen flex items-center justify-center bg-zinc-50'>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
					className='flex flex-col items-center gap-4'>
					<div className='h-10 w-10 rounded-full border-2 border-zinc-300 border-t-zinc-700 animate-spin' />
					<p className='text-sm text-zinc-500'>{t('checkoutPage.loadingPaymentForm')}</p>
				</motion.div>
			</div>
		);
	}

	if (state === 'expired') {
		return (
			<PageWrap>
				<CardHeader className='text-center pb-6 pt-10 px-8'>
					<div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100'>
						<Clock className='h-9 w-9 text-zinc-600' />
					</div>
					<CardTitle className='text-[20px] font-medium text-zinc-950 mb-4 leading-normal'>
						{t('checkoutPage.paymentLinkExpiredTitle')}
					</CardTitle>
				</CardHeader>
				<CardContent className='text-center px-8 pb-10'>
					<p className='text-base text-zinc-500 mb-8 leading-normal max-w-md mx-auto'>{t('checkoutPage.paymentLinkExpiredDescription')}</p>
				</CardContent>
			</PageWrap>
		);
	}

	if (state === 'invalid') {
		return (
			<PageWrap>
				<CardHeader className='text-center pb-6 pt-10 px-8'>
					<div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100'>
						<AlertCircle className='h-9 w-9 text-zinc-600' />
					</div>
					<CardTitle className='text-[20px] font-medium text-zinc-950 mb-4 leading-normal'>
						{t('checkoutPage.invalidPaymentLinkTitle')}
					</CardTitle>
				</CardHeader>
				<CardContent className='text-center px-8 pb-10'>
					<p className='text-base text-zinc-500 mb-8 leading-normal max-w-md mx-auto'>{t('checkoutPage.invalidPaymentLinkDescription')}</p>
					<Button onClick={() => window.location.reload()} variant='outline' className='min-w-[140px]'>
						<RefreshCw className='w-4 h-4 mr-2' />
						{t('checkoutPage.refreshPage')}
					</Button>
				</CardContent>
			</PageWrap>
		);
	}

	// 'open' — Paddle overlay is showing
	return (
		<div className='min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6'>
			<div className='max-w-md w-full text-center space-y-6'>
				<div className='flex justify-center'>
					<div className='rounded-full bg-zinc-100 p-4'>
						<CreditCard className='h-12 w-12 text-zinc-600' />
					</div>
				</div>
				<div>
					<h1 className='text-xl font-medium text-zinc-900'>{t('checkoutPage.completePaymentTitle')}</h1>
					<p className='mt-2 text-sm text-zinc-500'>{t('checkoutPage.completePaymentDescription')}</p>
				</div>
			</div>
		</div>
	);
};

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Public checkout page — multi-provider.
 *
 * Paddle:  /checkout?_ptxn=txn_xxx&token=eyJ...   (existing flow)
 * Moyasar: /checkout?provider=moyasar&token=eyJ... (card-save tokenization)
 *
 * The Moyasar branch is fully client-side — no backend API calls.
 * The JWT (token param) contains publishable_key and flexprice_payment_id.
 * After 3DS, Moyasar redirects back to the same URL with ?status=...&id=...
 * appended; the webhook handles server-side reconciliation.
 */
const CheckoutPage = () => {
	// Tenant-facing: never inherit a Flexprice user's dark-mode preference.
	useForceLightTheme();
	const [searchParams] = useSearchParams();

	const provider = searchParams.get('provider');
	const rawToken = searchParams.get('token') ?? searchParams.get(PADDLE_URL_PARAMS.TOKEN) ?? '';

	if (provider === 'moyasar') {
		return <MoyasarCheckout rawToken={rawToken} />;
	}

	return <PaddleCheckout />;
};

export default CheckoutPage;
