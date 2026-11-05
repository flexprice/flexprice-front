import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * A constant strip under the breadcrumbs that links to the new console (V2).
 * The new console carries the mirror strip, "Go back to old UI".
 *
 * Shown only when VITE_NEW_CONSOLE_URL is set: a link to nowhere is worse than none.
 */
const NewUiBanner: React.FC = () => {
	const { t } = useTranslation('common');
	const href = import.meta.env.VITE_NEW_CONSOLE_URL?.trim();

	if (!href) {
		return null;
	}

	return (
		<div
			className='w-full flex flex-wrap items-center justify-center gap-x-2 border-b px-4 py-1.5'
			style={{
				background: 'linear-gradient(to right, rgb(var(--fp-env-prod-bg)), rgb(var(--fp-env-prod-bg-mid)), rgb(var(--fp-env-prod-bg)))',
				borderColor: 'rgb(var(--fp-banner-info-line))',
				color: 'rgb(var(--fp-banner-info-text))',
			}}>
			<span className='text-sm'>{t('newUiBanner.message')}</span>
			<a href={href} className='inline-flex items-center gap-1 text-sm font-medium underline hover:opacity-80'>
				{t('newUiBanner.action')}
				<ArrowUpRight className='h-3.5 w-3.5 shrink-0' aria-hidden />
			</a>
		</div>
	);
};

export default NewUiBanner;
