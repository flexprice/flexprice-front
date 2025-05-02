import { FormHeader, Loader, Page } from '@/components/atoms';
import { Integration, integrations } from './integrationsData';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PremiumFeature, PremiumFeatureTag, ApiDocsContent } from '@/components/molecules';
import { useQuery } from '@tanstack/react-query';
import IntegrationsApi from '@/api/IntegrationsApi';

const Integrations = () => {
	// Fetch integrations data
	const { data: linkedinIntegration, isLoading } = useQuery({
		queryKey: ['integrations'],
		queryFn: async () => {
			return await IntegrationsApi.getLinkedInIntegration();
		},
	});
	// Filter integrations based on installation status
	const installed = integrations.filter((integration) =>
		linkedinIntegration?.providers?.some((provider) => provider.toLowerCase() === integration.name.toLowerCase()),
	);

	const available = integrations.filter(
		(integration) =>
			!linkedinIntegration?.providers?.some((provider) => provider.toLowerCase() === integration.name.toLowerCase()) &&
			integration.type === 'available',
	);

	if (isLoading) {
		return <Loader />;
	}

	return (
		<Page heading='Integrations'>
			<ApiDocsContent tags={['Integrations', 'secrets']} />
			{installed.length > 0 && (
				<div>
					<FormHeader title='Installed' variant='sub-header' />
					<div className='grid grid-cols-2 gap-4 '>
						{installed.map((integration, index) => (
							<IntegrationCard installed={true} key={index} integration={integration} />
						))}
					</div>
				</div>
			)}
			<div className='mt-6'>
				<FormHeader title='Available' variant='sub-header' />
				<div className='grid grid-cols-2 gap-4 '>
					{available.map((integration, index) => (
						<IntegrationCard key={index} integration={integration} />
					))}
				</div>
			</div>
		</Page>
	);
};

const IntegrationCard = ({ integration }: { integration: Integration; installed?: boolean }) => {
	const navigate = useNavigate();

	const handleCardClick = () => {
		if (!integration.premium) {
			navigate(integration.name.toLowerCase());
		}
	};

	return (
		<PremiumFeature isPremiumFeature={integration.premium}>
			<div className='relative'>
				<div onClick={handleCardClick} className={cn('border rounded-xl p-4 flex items-center shadow-sm relative', 'cursor-pointer')}>
					<div className='w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg'>
						<img src={integration.logo} alt={integration.name} className='w-12 h-12 object-contain' />
					</div>
					<div className='ml-4 flex-1'>
						<div className='flex items-center justify-between w-full mb-2'>
							<h3 className='font-semibold text-lg'>{integration.name}</h3>
							{integration.premium && <PremiumFeatureTag />}
						</div>
						<p className='text-gray-500 text-sm'>{integration.description}</p>
						<div className='mt-2 flex items-center gap-2 mb-2'>
							{integration.tags.map((tag, idx) => (
								<span key={idx} className='text-xs bg-gray-200 px-2 py-1 rounded-md mb-1'>
									{tag}
								</span>
							))}
						</div>
						{/* {integration.type === 'available' && !integration.premium && !installed && (
							<Button className='flex gap-2 items-center'>Install</Button>
						)} */}
					</div>
				</div>
			</div>
		</PremiumFeature>
	);
};

export default Integrations;
