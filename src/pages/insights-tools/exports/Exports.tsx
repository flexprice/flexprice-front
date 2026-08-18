import { Card, FormHeader, HugeIcon, Page } from '@/components/atoms';
import type { HugeIconData } from '@/components/atoms';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ApiDocsContent } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { Calendar03Icon, CloudIcon, FileSpreadsheetIcon } from '@hugeicons/core-free-icons';

interface ExportProvider {
	name: string;
	description: string;
	logo: string;
	tags: string[];
	route: string;
	premium?: boolean;
}

const Exports = () => {
	const { t } = useTranslation('settings');
	const navigate = useNavigate();

	const overviewHighlights: { title: string; body: string; icon: HugeIconData }[] = useMemo(
		() => [
			{
				title: t('insightsTools.exports.highlightAutomatedExportsTitle'),
				body: t('insightsTools.exports.highlightAutomatedExportsBody'),
				icon: Calendar03Icon,
			},
			{
				title: t('insightsTools.exports.highlightMultipleFormatsTitle'),
				body: t('insightsTools.exports.highlightMultipleFormatsBody'),
				icon: FileSpreadsheetIcon,
			},
			{
				title: t('insightsTools.exports.highlightSecureStorageTitle'),
				body: t('insightsTools.exports.highlightSecureStorageBody'),
				icon: CloudIcon,
			},
		],
		[t],
	);

	const exportProviders: ExportProvider[] = useMemo(
		() => [
			{
				name: t('insightsTools.exports.providerAmazonS3Name'),
				description: t('insightsTools.exports.providerAmazonS3Description'),
				logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Amazon-S3-Logo.svg',
				tags: [t('insightsTools.exports.tagStorage'), t('insightsTools.exports.tagDataWarehouse'), t('insightsTools.exports.tagAnalytics')],
				route: '/tools/exports/s3',
			},
		],
		[t],
	);

	const handleProviderClick = (provider: ExportProvider) => {
		navigate(provider.route);
	};

	return (
		<Page heading={t('insightsTools.exports.pageHeading')}>
			<ApiDocsContent tags={API_DOCS_TAGS.Tasks} />

			<p className='max-w-2xl text-sm leading-relaxed text-content-tertiary'>{t('insightsTools.exports.overviewIntro')}</p>
			<div className='mt-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
				{overviewHighlights.map((item) => (
					<Card
						key={item.title}
						noPadding
						className='flex h-full flex-col rounded-[var(--fp-radius-lg)] border border-line-hairline bg-surface p-5 shadow-none'>
						<div className='flex size-9 items-center justify-center rounded-[var(--fp-radius-md)] border border-line-hairline bg-surface-subtle'>
							<HugeIcon icon={item.icon} size={18} />
						</div>
						<h3 className='mt-4 text-start text-base font-medium text-content'>{item.title}</h3>
						<p className='mt-1.5 text-start text-sm font-normal leading-5 text-content-muted'>{item.body}</p>
					</Card>
				))}
			</div>

			<div className='mt-12'>
				<FormHeader title={t('insightsTools.exports.exportProvidersTitle')} variant='sub-header' />
				<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
					{exportProviders.map((provider) => (
						<ExportProviderCard
							key={provider.route}
							provider={provider}
							onClick={handleProviderClick}
							premiumBadge={t('insightsTools.exports.premiumBadge')}
						/>
					))}
				</div>
			</div>
		</Page>
	);
};

interface ExportProviderCardProps {
	provider: ExportProvider;
	onClick: (provider: ExportProvider) => void;
	premiumBadge: string;
}

const ExportProviderCard = ({ provider, onClick, premiumBadge }: ExportProviderCardProps) => {
	return (
		<Card
			noPadding
			onClick={() => onClick(provider)}
			className='flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-[var(--fp-radius-lg)] border-line-slate shadow-sm transition-colors hover:bg-surface-subtle'>
			<div className='min-w-0 flex-1 overflow-hidden p-8'>
				<div className='flex gap-5'>
					<div className='flex size-14 shrink-0 items-center justify-center rounded-[var(--fp-radius-md)] bg-surface-slate-subtle'>
						<img src={provider.logo} alt={provider.name} className='size-8 object-contain' />
					</div>
					<div className='min-w-0 flex-1 space-y-2'>
						<div className='flex items-center gap-2'>
							<h3 className='text-lg font-semibold text-foreground'>{provider.name}</h3>
							{provider.premium && (
								<span className='inline-flex h-5 items-center rounded-sm bg-warning-muted-strong px-2 text-xs font-medium text-warning-strong'>
									{premiumBadge}
								</span>
							)}
						</div>
						<p className='line-clamp-2 break-words text-sm text-content-slate-muted'>{provider.description}</p>
						{provider.tags.length > 0 && (
							<div className='flex flex-wrap gap-1.5 pt-1'>
								{provider.tags.slice(0, 3).map((tag) => (
									<span key={tag} className='rounded-sm bg-surface-slate-subtle px-2 py-0.5 text-xs text-content-slate-tertiary'>
										{tag}
									</span>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</Card>
	);
};

export default Exports;
