import { FormHeader, Page } from '@/components/atoms';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ApiDocsContent } from '@/components/molecules';
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
	const navigate = useNavigate();

	const exportProviders: ExportProvider[] = [
		{
			name: 'Amazon S3',
			description: 'Export your Flexprice data to Amazon S3 for data warehousing, analytics, and backup purposes.',
			icon: Cloud,
			logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Amazon-S3-Logo.svg',
			tags: ['Storage', 'Data Warehouse', 'Analytics'],
			route: '/tools/exports/s3',
		},
		// Future export providers can be added here
		// {
		// 	name: 'Google Cloud Storage',
		// 	description: 'Export data to Google Cloud Storage for scalable data processing.',
		// 	icon: Cloud,
		// 	logo: 'https://cloud.google.com/static/images/gcp-logo.svg',
		// 	tags: ['Storage', 'BigQuery', 'Analytics'],
		// 	route: '/tools/exports/gcs',
		// 	premium: true,
		// },
	];

	const handleProviderClick = (provider: ExportProvider) => {
		navigate(provider.route);
	};

	return (
		<Page heading='Data Exports'>
			<ApiDocsContent tags={['Exports', 'Data Pipelines', 'Storage']} />

			{/* Overview Section */}
			<div className='mb-8'>
				<FormHeader title='Overview' variant='sub-header' />
				<div className='card space-y-4'>
					<p className='text-gray-600'>
						Export your Flexprice data to external storage systems for data warehousing, analytics, and backup purposes. Configure automated
						exports with flexible scheduling and secure data transfer.
					</p>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div className='flex items-center gap-3 p-3 bg-blue-50 rounded-lg'>
							<Download className='w-6 h-6 text-blue-600' />
							<div>
								<h4 className='font-medium text-blue-900'>Automated Exports</h4>
								<p className='text-sm text-blue-700'>Schedule regular data exports</p>
							</div>
						</div>
						<div className='flex items-center gap-3 p-3 bg-blue-50 rounded-lg'>
							<Database className='w-6 h-6 text-blue-600' />
							<div>
								<h4 className='font-medium text-blue-900'>Multiple Formats</h4>
								<p className='text-sm text-blue-700'>Export in various data formats</p>
							</div>
						</div>
						<div className='flex items-center gap-3 p-3 bg-blue-50 rounded-lg'>
							<Cloud className='w-6 h-6 text-blue-600' />
							<div>
								<h4 className='font-medium text-blue-900'>Secure Storage</h4>
								<p className='text-sm text-blue-700'>Encrypted data transfer and storage</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Export Providers */}
			<div className='mb-8'>
				<FormHeader title='Export Providers' variant='sub-header' />
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{exportProviders.map((provider, index) => (
						<ExportProviderCard key={index} provider={provider} onClick={handleProviderClick} />
					))}
				</div>
			</div>
		</Page>
	);
};

interface ExportProviderCardProps {
	provider: ExportProvider;
	onClick: (provider: ExportProvider) => void;
}

const ExportProviderCard = ({ provider, onClick }: ExportProviderCardProps) => {
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
						{provider.premium && <span className='text-[#c58e20] text-sm'>Premium</span>}
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
