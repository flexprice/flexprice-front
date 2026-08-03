import React from 'react';
import { useTranslation } from 'react-i18next';
import { config, AUTH_PROVIDER } from '@/config/config';

const FUNDING_URL =
	'https://entrepreneur.economictimes.indiatimes.com/news/funding/flexprice-secures-15-million-in-seed-funding-to-revolutionize-ai-billing-solutions/131320984';

const FundingStrip: React.FC = () => {
	const { t } = useTranslation('common', { keyPrefix: 'fundingStrip' });

	// Only show in production with Supabase auth
	if (!config.app.isProd || config.auth.provider !== AUTH_PROVIDER.Supabase) {
		return null;
	}

	return (
		<div className='w-full flex items-center justify-center px-4 py-1.5 shrink-0' style={{ background: '#092A3D' }}>
			<p className='text-[13px] font-normal text-white'>
				{t('announcement')} &nbsp;|&nbsp;{' '}
				<a
					href={FUNDING_URL}
					target='_blank'
					rel='noopener noreferrer'
					className='text-white font-normal underline hover:opacity-80'
					style={{ textDecoration: 'underline' }}>
					{t('knowMore')}
				</a>
			</p>
		</div>
	);
};

export default FundingStrip;
