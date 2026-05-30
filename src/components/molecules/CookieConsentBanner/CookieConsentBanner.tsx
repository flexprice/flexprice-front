import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import useCookieConsent from '@/hooks/useCookieConsent';

interface CookieConsentBannerProps {
	privacyPolicyUrl?: string;
	termsUrl?: string;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ privacyPolicyUrl, termsUrl }) => {
	const { showBanner, accept, reject, isLoading } = useCookieConsent();
	const { t } = useTranslation('common');

	if (!showBanner) return null;

	const modalRoot = document.getElementById('modal-root');
	if (!modalRoot) return null;

	return createPortal(
		<div
			role='region'
			aria-label={t('cookieConsent.title')}
			className='fixed bottom-6 right-6 z-[110] w-80 rounded-2xl border border-gray-200 bg-white p-5 shadow-lg'>
			<h2 className='mb-2 text-sm font-semibold text-gray-900'>{t('cookieConsent.title')}</h2>
			<p className='mb-4 text-xs text-gray-600'>{t('cookieConsent.description')}</p>
			<div className='flex gap-2'>
				<button
					type='button'
					onClick={reject}
					disabled={isLoading}
					className='flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2'>
					{t('cookieConsent.rejectAll')}
				</button>
				<button
					type='button'
					onClick={accept}
					disabled={isLoading}
					className='flex-1 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'>
					{t('cookieConsent.acceptAll')}
				</button>
			</div>
			{(privacyPolicyUrl || termsUrl) && (
				<div className='mt-3 flex gap-3 text-xs text-gray-500'>
					{privacyPolicyUrl && (
						<a href={privacyPolicyUrl} target='_blank' rel='noopener noreferrer' className='hover:underline'>
							{t('cookieConsent.privacyPolicy')}
						</a>
					)}
					{termsUrl && (
						<a href={termsUrl} target='_blank' rel='noopener noreferrer' className='hover:underline'>
							{t('cookieConsent.termsAndConditions')}
						</a>
					)}
				</div>
			)}
		</div>,
		modalRoot,
	);
};

export default CookieConsentBanner;
