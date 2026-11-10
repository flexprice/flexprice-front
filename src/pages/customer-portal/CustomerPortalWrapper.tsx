import { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import {
	checkoutReturnOutcome,
	portalBasePath,
	rememberSessionToken,
	recallSessionToken,
} from '@/components/customer-portal/portalReturnUrl';
import useCheckoutTabHandoff from '@/components/customer-portal/useCheckoutTabHandoff';
import { hasProviderReturnParams, providerReturnFailed } from '@/components/customer-portal/checkoutHandoff';
import { useTranslation } from 'react-i18next';
import { Clock, CreditCard, RefreshCw, Shield } from 'lucide-react';
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
 * - Missing token on a return from a payment provider: a static page for the
 *   return route that never claims how the payment ended, instead of calling the
 *   link invalid
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
	const [searchParams] = useSearchParams();
	const { pathname } = useLocation();
	const navigate = useNavigate();
	// The success and failure routes are returns in their own right: a provider can
	// drop our marker, and a customer can land here in a browser that never left.
	const returnOutcome = checkoutReturnOutcome(pathname);
	const isCheckoutReturn = wasCheckoutReturn || returnOutcome !== null;
	// The stored token is recovered only on a redirect landing, where the return
	// URL deliberately omits it rather than handing the session to the payment
	// provider. Recovering it for any tokenless visit meant the next person to open
	// the portal on a shared browser profile resumed the previous customer's
	// session — so a bare visit gets the invalid-link card instead.
	const urlToken = searchParams.get('token');
	const token = urlToken ?? (isCheckoutReturn ? recallSessionToken() : null);

	useEffect(() => {
		if (urlToken) rememberSessionToken(urlToken);
	}, [urlToken]);

	// Back in the tab the customer started from, with the session restored from
	// storage: put the token back in the address, on the portal's own path, so a
	// reload still opens the portal rather than a return page.
	useEffect(() => {
		if (!token || (urlToken && !returnOutcome)) return;
		const next = new URLSearchParams(searchParams);
		next.set('token', token);
		navigate({ pathname: portalBasePath(pathname), search: `?${next.toString()}` }, { replace: true });
	}, [urlToken, token, returnOutcome, pathname, searchParams, navigate]);

	// Nothing to show in a tab that is closing — and the invalid-link card in
	// particular would be wrong, since this tab's job is already done.
	if (isHandingOff) return null;

	// Back from a payment provider, but this browser holds no session: the checkout
	// opened in another browser (common on phones, where a link tapped inside an app
	// opens its checkout in Safari), or the stored token expired. The payment itself
	// is settled by the provider's webhook, not by this page, so telling the customer
	// their link is invalid only alarms them after a payment that went through.
	//
	// Without a session this page cannot know how the payment ended, so neither
	// version claims it. Showing success for a payment that failed is worse than an
	// error, and showing failure for one that went through makes customers pay twice.
	if (!token && (isCheckoutReturn || hasProviderReturnParams(searchParams))) {
		const failed = returnOutcome === 'failure' || providerReturnFailed(searchParams);
		const Icon = failed ? CreditCard : Clock;
		return (
			<ErrorState
				icon={null}
				illustration={
					<div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100'>
						<Icon className='h-9 w-9 text-zinc-700' aria-hidden='true' />
					</div>
				}
				title={t(failed ? 'wrapper.checkoutReturnFailedTitle' : 'wrapper.checkoutReturnTitle')}
				description={t(failed ? 'wrapper.checkoutReturnFailedDescription' : 'wrapper.checkoutReturnDescription')}
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
