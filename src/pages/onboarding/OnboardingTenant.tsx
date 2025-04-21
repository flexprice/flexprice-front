import { Page, Spacer, Input, Card, Button } from '@/components/atoms';
import { PermissionType } from '@/components/molecules/SecretKeyDrawer/SecretKeyDrawer';
import { ApiKeyPermissions } from '@/components/molecules/SecretKeyDrawer/SecretKeyDrawer';
import { refetchQueries } from '@/core/tanstack/ReactQueryProvider';
import SecretKeysApi, { CreateSecretKeyResponse } from '@/utils/api_requests/SecretKeysApi';
import TenantApi from '@/utils/api_requests/TenantApi';
import { logger } from '@/utils/common/Logger';
import { useMutation } from '@tanstack/react-query';
import { Copy, CheckCircle } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { toast } from 'react-hot-toast';

const OnboardingTenant = () => {
	const [orgName, setOrgName] = useState('');
	const [secretKeyData, setSecretKeyData] = useState<string>('testing-key');
	const [isCopied, setIsCopied] = useState(false);

	const {
		mutate: updateTenant,
		isPending: isUpdatingTenant,
		isSuccess: isTenantUpdated,
	} = useMutation({
		mutationFn: () =>
			TenantApi.updateTenant({
				name: orgName,
			}),
		onSuccess: async () => {
			await refetchQueries(['user']);
			toast.success('Tenant details updated successfully');
		},
		onError: (error: ServerError) => {
			logger.error(error);
			toast.error(error.error.message || 'Failed to update tenant details. Please try again.');
		},
	});

	const {
		mutate: createSecretKey,
		isPending: isCreatingSecretKey,
		isSuccess: isSecretKeyCreated,
	} = useMutation({
		mutationFn: () =>
			SecretKeysApi.createSecretKey({
				name: secretKeyData || 'Onboarding Secret Key',
				permissions: ApiKeyPermissions[PermissionType.READ_WRITE],
				type: 'private_key',
			}),
		onSuccess: (data: CreateSecretKeyResponse) => {
			setSecretKeyData(data.api_key);
		},
		onError: (error) => {
			toast.error(`Failed to create secret key: ${error.message}`);
		},
	});

	const handleCopySecretKey = () => {
		if (secretKeyData) {
			navigator.clipboard.writeText(secretKeyData);
			setIsCopied(true);
			toast.success('Secret key copied to clipboard');

			// Reset copied state after 2 seconds
			setTimeout(() => setIsCopied(false), 2000);
		}
	};

	const steps: { label: string; description: ReactNode; component: ReactNode }[] = [
		{
			label: 'Create your organization',
			description: 'Create an organization to get started and integrate pricing within 5 minutes.',
			component: (
				<Card className='flex flex-col gap-4'>
					<Input
						disabled={isUpdatingTenant || isTenantUpdated}
						label='Organization Name'
						placeholder='Enter your organization name'
						value={orgName}
						onChange={(e) => setOrgName(e)}
					/>
					<div className='flex justify-end'>
						<Button onClick={() => updateTenant()} disabled={!orgName || isUpdatingTenant || isTenantUpdated} isLoading={isUpdatingTenant}>
							Save
						</Button>
					</div>
				</Card>
			),
		},
		{
			label: 'Create a Flexprice Secret Key',
			description: 'Create a secret key to authenticate your requests to the Flexprice API.',
			component: (
				<Card className='flex flex-col gap-4'>
					<Input
						disabled={isCreatingSecretKey || isSecretKeyCreated}
						label='Secret Key'
						placeholder='Enter a name for your secret key'
						value={secretKeyData}
						suffix={
							secretKeyData &&
							isSecretKeyCreated &&
							(isCopied ? (
								<CheckCircle className='size-4 text-green-500' />
							) : (
								<Copy className='size-4 cursor-pointer hover:text-blue-600 transition-colors' onClick={handleCopySecretKey} />
							))
						}
						onChange={(e) => setSecretKeyData(e)}
					/>
					<div className='flex justify-end'>
						{!isSecretKeyCreated && (
							<Button
								onClick={() => createSecretKey()}
								disabled={!secretKeyData || isCreatingSecretKey || isSecretKeyCreated}
								isLoading={isCreatingSecretKey}>
								Create
							</Button>
						)}
					</div>
				</Card>
			),
		},
		{
			label: 'Demo Video',
			description: 'Watch a demo video to get started',
			component: (
				<Card className='flex flex-col gap-4'>
					<iframe
						src='https://www.loom.com/embed/60d8308781254fe0bc5be341501f9fd5?sid=c034e9a8-e243-4def-ab50-976f08d56cee&amp;hideEmbedTopBar=true&amp;hide_title=true&amp;hide_owner=true&amp;hide_speed=true&amp;hide_share=true'
						allowFullScreen
						className='w-full h-[300px] rounded-lg overflow-clip'></iframe>
				</Card>
			),
		},
		{
			label: 'Review',
			description: 'Review your information',
			component: <div>Review details will be added soon</div>,
		},
	];

	return (
		<Page heading='Onboarding'>
			<Spacer height={40} />
			<div className='flex flex-col'>
				{steps.map((step, index) => (
					<div className='flex gap-4' key={index}>
						<div className='flex-1 flex flex-col items-center gap-1'>
							<div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center'>
								<span className='text-base text-gray-500'>{index + 1}</span>
							</div>
							<div className='w-[2px] flex-grow bg-gray-200'></div>
						</div>

						<div className='flex gap-4 mb-12 w-full'>
							<div className='flex flex-col gap-2 w-[300px] pb-12'>
								<h1 className='text-base font-normal'>{step.label}</h1>
								<p className='text-sm text-gray-500'>{step.description}</p>
							</div>

							<div className='flex-grow flex-1'>{step.component}</div>
						</div>
					</div>
				))}
			</div>
		</Page>
	);
};

export default OnboardingTenant;
