import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { rememberSessionToken, recallSessionToken } from '@/components/customer-portal/portalReturnUrl';
import useCheckoutTabHandoff from '@/components/customer-portal/useCheckoutTabHandoff';
import { hasProviderReturnParams } from '@/components/customer-portal/checkoutHandoff';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Shield } from 'lucide-react';
import successConfetti from '@/assets/images/success-confetti.svg';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/atoms/Button';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';
import CustomerPortal from './CustomerPortal';

/**
 * Wrapper component for CustomerPortal that:
 * - Extracts dashboard session token from URL query parameters (required)
 * - Passes the dashboard token to CustomerPortal
 *
 * Handles validation and error cases with proper UI components:
 * - Missing token: shows error card with refresh option
 * - Missing token on a return from a payment provider: explains that the payment
 *   is handled and how to get back in, instead of calling the link invalid
 */

interface ErrorStateProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
	/** Shown in place of the icon and its tinted backdrop, at its own size. */
	illustration?: React.ReactNode;
	/** A "Powered by Flexprice" line under the card. */
	footer?: React.ReactNode;
}

const ErrorState = ({ icon, title, description, actionLabel, onAction, illustration, footer }: ErrorStateProps) => (
	<div className='min-h-screen flex items-center justify-center bg-[#fafafa] px-4 py-12 sm:px-6'>
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: 'easeOut' }}
			className='w-full max-w-lg'>
			<Card className='bg-white border border-[#E9E9E9] rounded-xl shadow-sm'>
				<CardHeader className='text-center pb-6 pt-10 px-8'>
					{illustration ?? (
						<div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FEE2E2]/30'>
							<div className='text-zinc-700'>{icon}</div>
						</div>
					)}
					<CardTitle className='text-[20px] font-medium text-zinc-950 mb-4 leading-normal'>{title}</CardTitle>
				</CardHeader>
				<CardContent className='text-center px-8 pb-10'>
					<p className='text-base text-zinc-600 mb-8 leading-normal max-w-md mx-auto'>{description}</p>
					{actionLabel && onAction && (
						<Button
							onClick={onAction}
							className='w-full sm:w-auto min-w-[140px] transition-all duration-200 hover:opacity-90'
							variant='outline'>
							<RefreshCw className='w-4 h-4 mr-2' />
							{actionLabel}
						</Button>
					)}
				</CardContent>
			</Card>
			{footer}
		</motion.div>
	</div>
);
const CustomerPortalWrapper = () => {
	// Tenant-facing: never inherit a Flexprice user's dark-mode preference.
	useForceLightTheme();
	const { t } = useTranslation('customer-portal');
	// A provider redirect lands in the tab the checkout was opened in, not the one
	// the customer left behind. That tab reports back and closes itself.
	const { isHandingOff, wasCheckoutReturn } = useCheckoutTabHandoff();
	const [searchParams, setSearchParams] = useSearchParams();
	// The stored token is recovered only on a redirect landing, where the return
	// URL deliberately omits it rather than handing the session to the payment
	// provider. Recovering it for any tokenless visit meant the next person to open
	// the portal on a shared browser profile resumed the previous customer's
	// session — so a bare visit gets the invalid-link card instead.
	const urlToken = searchParams.get('token');
	const token = urlToken ?? (wasCheckoutReturn ? recallSessionToken() : null);

	useEffect(() => {
		if (urlToken) rememberSessionToken(urlToken);
	}, [urlToken]);

	// Back in the tab the customer started from, with the session restored from
	// storage: put the token back in the address so a reload still opens the portal.
	useEffect(() => {
		if (urlToken || !token) return;
		setSearchParams(
			(params) => {
				const next = new URLSearchParams(params);
				next.set('token', token);
				return next;
			},
			{ replace: true },
		);
	}, [urlToken, token, setSearchParams]);

	// Nothing to show in a tab that is closing — and the invalid-link card in
	// particular would be wrong, since this tab's job is already done.
	if (isHandingOff) return null;

	// Back from a payment provider, but this browser holds no session: the checkout
	// opened in another browser (common on phones, where a link tapped inside an app
	// opens its checkout in Safari), or the stored token expired. The payment itself
	// is settled by the provider's webhook, not by this page, so telling the customer
	// their link is invalid only alarms them after a payment that went through.
	if (!token && (wasCheckoutReturn || hasProviderReturnParams(searchParams))) {
		return (
			<ErrorState
				icon={null}
				illustration={<img src={successConfetti} alt='' aria-hidden='true' className='mx-auto mb-2 h-32 w-32' />}
				title={t('wrapper.checkoutReturnTitle')}
				description={t('wrapper.checkoutReturnDescription')}
				footer={
					<p className='mt-6 text-center text-xs text-content-tertiary'>
						{t('footer.poweredBy')}{' '}
						<a
							href='https://flexprice.io'
							target='_blank'
							rel='noopener noreferrer'
							className='text-content-secondary transition-colors hover:text-content'>
							{t('footer.brand')}
						</a>
					</p>
				}
			/>
		);
	}

	// Validate required token parameter
	if (!token) {
		return (
			<ErrorState
				icon={<Shield className='h-9 w-9 text-zinc-700' />}
				title={t('wrapper.invalidLinkTitle')}
				description={t('wrapper.invalidLinkDescription')}
				actionLabel={t('wrapper.refreshPage')}
				onAction={() => window.location.reload()}
			/>
		);
	}

	// Pass dashboard token to CustomerPortal
	return <CustomerPortal token={token} />;
};

export default CustomerPortalWrapper;
