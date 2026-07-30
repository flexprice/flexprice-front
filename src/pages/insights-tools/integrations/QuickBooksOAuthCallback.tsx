import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Loader, Page } from '@/components/atoms';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import OAuthApi from '@/api/OAuthApi';

const QuickBooksOAuthCallback = () => {
	const { t } = useTranslation('settings');
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const hasProcessed = useRef(false);

	const code = searchParams.get('code');
	const realmId = searchParams.get('realmId');
	const state = searchParams.get('state');
	const errorParam = searchParams.get('error');
	const location = searchParams.get('location');
	const accountsServer = searchParams.get('accounts-server');

	const providerHint = sessionStorage.getItem('oauth_provider');
	const provider = providerHint || (realmId ? 'quickbooks' : 'zoho_books');
	const isQuickBooks = provider === 'quickbooks';
	const providerRoute = isQuickBooks ? '/tools/integrations/quickbooks' : '/tools/integrations/zoho';
	const providerName = isQuickBooks ? 'QuickBooks' : 'Zoho Books';
	const sessionIdKey = isQuickBooks ? 'qb_oauth_session_id' : 'zoho_books_oauth_session_id';
	const sessionId = sessionStorage.getItem(sessionIdKey);
	const zohoOrganizationId = sessionStorage.getItem('zoho_books_organization_id');
	const zohoOrganizationName = sessionStorage.getItem('zoho_books_organization_name');

	const cleanupSession = () => {
		sessionStorage.removeItem('qb_oauth_session_id');
		sessionStorage.removeItem('zoho_books_oauth_session_id');
		sessionStorage.removeItem('zoho_books_organization_id');
		sessionStorage.removeItem('zoho_books_organization_name');
		sessionStorage.removeItem('oauth_provider');
	};

	useEffect(() => {
		if (hasProcessed.current) return;

		if (errorParam) {
			setError(`OAuth error: ${errorParam}`);
			toast.error(`${providerName} authorization failed: ${errorParam}`);
			setTimeout(() => {
				navigate(providerRoute);
			}, 3000);
			return;
		}

		if (!code || !state) {
			setError('Missing required OAuth parameters');
			toast.error(`${providerName} authorization failed: Missing required parameters`);
			setTimeout(() => {
				navigate(providerRoute);
			}, 3000);
			return;
		}

		if (!sessionId) {
			setError('Session expired or not found');
			toast.error('OAuth session expired. Please try connecting again.');
			setTimeout(() => {
				navigate(providerRoute);
			}, 3000);
			return;
		}

		if (isQuickBooks && !realmId) {
			setError('Missing QuickBooks realm ID');
			toast.error('QuickBooks authorization failed: Missing realm ID');
			setTimeout(() => {
				navigate(providerRoute);
			}, 3000);
			return;
		}

		if (!isQuickBooks && !zohoOrganizationId) {
			setError('Zoho organization ID is missing. Please restart the connection flow.');
			toast.error('Zoho organization ID not found. Please reconnect.');
			setTimeout(() => {
				navigate(providerRoute);
			}, 3000);
			return;
		}
	}, [code, state, sessionId, realmId, errorParam, navigate, providerRoute, providerName, isQuickBooks, zohoOrganizationId]);

	const { mutate: completeOAuth, isPending } = useMutation({
		mutationFn: async () => {
			if (!code || !state || !sessionId) {
				throw new Error('Missing required parameters');
			}

			if (isQuickBooks && !realmId) {
				throw new Error('Missing QuickBooks realm ID');
			}

			if (!isQuickBooks && !zohoOrganizationId) {
				throw new Error('Missing Zoho organization ID');
			}

			const payload: any = {
				provider,
				session_id: sessionId,
				code,
				state,
			};

			if (isQuickBooks) {
				payload.realm_id = realmId;
			} else {
				payload.organization_id = zohoOrganizationId;
				payload.organization_name = zohoOrganizationName || undefined;
				payload.location = location || undefined;
				payload.accounts_server = accountsServer || undefined;
			}

			return await OAuthApi.CompleteOAuth(payload);
		},
		onSuccess: () => {
			cleanupSession();
			toast.success(`${providerName} connected successfully!`);
			navigate(providerRoute);
		},
		onError: (error: Error) => {
			cleanupSession();
			const errorMessage = error.message || 'Failed to complete OAuth';
			setError(errorMessage);
			toast.error(errorMessage);
			setTimeout(() => {
				navigate(providerRoute);
			}, 3000);
		},
	});

	useEffect(() => {
		if (!code || !state || !sessionId || errorParam || isPending || error || hasProcessed.current) {
			return;
		}
		if (isQuickBooks && !realmId) {
			return;
		}
		if (!isQuickBooks && !zohoOrganizationId) {
			return;
		}
		hasProcessed.current = true;
		completeOAuth();
	}, [code, realmId, state, sessionId, errorParam, completeOAuth, isPending, error, isQuickBooks, zohoOrganizationId]);

	if (error) {
		return (
			<Page>
				<div className='flex flex-col items-center justify-center min-h-[400px]'>
					<div className='text-red-600 text-lg font-semibold mb-2'>{t('insightsTools.oauthCallback.authorizationFailed')}</div>
					<div className='text-gray-600 mb-4'>{error}</div>
					<div className='text-sm text-gray-500'>{t('insightsTools.oauthCallback.redirectingToIntegrations')}</div>
				</div>
			</Page>
		);
	}

	return (
		<Page>
			<div className='flex flex-col items-center justify-center min-h-[400px]'>
				<Loader />
				<div className='mt-4 text-gray-600'>{t('insightsTools.oauthCallback.completingAuthorization', { provider: providerName })}</div>
				<div className='mt-2 text-sm text-gray-500'>{t('insightsTools.oauthCallback.exchangingTokens')}</div>
			</div>
		</Page>
	);
};

export default QuickBooksOAuthCallback;
