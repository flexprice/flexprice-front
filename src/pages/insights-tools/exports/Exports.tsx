import { FormHeader, Page } from '@/components/atoms';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import { ApiDocsContent } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { Download, Database, Cloud } from 'lucide-react';

interface ExportProvider {
	name: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	logo: string;
	tags: string[];
	route: string;
	premium?: boolean;
}

const Exports = () => {
	const { t } = useTranslation('settings');
	const navigate = useNavigate();

	const exportProviders: ExportProvider[] = useMemo(
		() => [
			{
				name: t('insightsTools.exports.providerAmazonS3Name'),
				description: t('insightsTools.exports.providerAmazonS3Description'),
				icon: Cloud,
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

			{/* Overview Section */}
			<div className='mb-14'>
				<FormHeader title={t('insightsTools.exports.overviewSectionTitle')} variant='sub-header' />
				<div className='card space-y-4'>
					<p className='text-gray-600'>{t('insightsTools.exports.overviewIntro')}</p>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div className='flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white'>
							<Download className='w-6 h-6 text-gray-600' />
							<div>
								<h4 className='font-medium text-gray-900'>{t('insightsTools.exports.highlightAutomatedExportsTitle')}</h4>
								<p className='text-sm text-gray-500'>{t('insightsTools.exports.highlightAutomatedExportsBody')}</p>
							</div>
						</div>
						<div className='flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white'>
							<Database className='w-6 h-6 text-gray-600' />
							<div>
								<h4 className='font-medium text-gray-900'>{t('insightsTools.exports.highlightMultipleFormatsTitle')}</h4>
								<p className='text-sm text-gray-500'>{t('insightsTools.exports.highlightMultipleFormatsBody')}</p>
							</div>
						</div>
						<div className='flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white'>
							<Cloud className='w-6 h-6 text-gray-600' />
							<div>
								<h4 className='font-medium text-gray-900'>{t('insightsTools.exports.highlightSecureStorageTitle')}</h4>
								<p className='text-sm text-gray-500'>{t('insightsTools.exports.highlightSecureStorageBody')}</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Export Providers */}
			<div className='mb-8'>
				<FormHeader title={t('insightsTools.exports.exportProvidersTitle')} variant='sub-header' />
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{exportProviders.map((provider, index) => (
						<ExportProviderCard
							key={index}
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
		<div
			onClick={() => onClick(provider)}
			className={cn('border rounded-2xl p-6 flex shadow-sm cursor-pointer hover:shadow-md transition-shadow', 'bg-white hover:bg-gray-50')}>
			<div className='w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg'>
				<img src={provider.logo} alt={provider.name} className='w-12 h-12 object-contain' />
			</div>
			<div className='ml-4 flex-1'>
				<div className='w-full mb-3'>
					<h3 className='font-semibold text-lg flex items-center gap-2'>
						{provider.name}
						{provider.premium && <span className='text-[#c58e20] text-sm'>{premiumBadge}</span>}
					</h3>
				</div>
				<p className='text-gray-500 text-sm mb-3'>{provider.description}</p>
				<div className='flex items-center gap-2'>
					{provider.tags.map((tag, idx) => (
						<span key={idx} className='text-xs bg-[#f4f4f4] text-[#5e5e5e] px-2 py-1 rounded-md'>
							{tag}
						</span>
					))}
				</div>
			</div>
		</div>
	);
};

export default Exports;
