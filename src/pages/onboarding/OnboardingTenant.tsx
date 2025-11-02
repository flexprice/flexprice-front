import { Page, Spacer, Input, Button, Card } from '@/components/atoms';
import SecretKeysApi from '@/api/SecretKeysApi';
import TenantApi from '@/api/TenantApi';
import { useMutation } from '@tanstack/react-query';
import { Copy, CheckCircle, Check, Eye, EyeOff, Lock, Globe, Gauge, Users, ArrowRight, ExternalLink } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { CreateSecretKeyResponse } from '@/types/dto';
import { TenantMetadataKey } from '@/models/Tenant';
import useUser from '@/hooks/useUser';
import { useQuery } from '@tanstack/react-query';
interface TutorialItem {
	title: string;
	description: string;
	onClick: () => void;
	icon: ReactNode;
}

const exploreTutorials: TutorialItem[] = [
	{
		title: 'Getting Started',
		description: 'Learn the basics of Flexprice in 5 minutes',
		icon: <Globe className='w-5 h-5 text-[#3293D9]' />,
		onClick: () => window.open('https://docs.flexprice.io', '_blank', 'noopener,noreferrer'),
	},
	{
		title: 'Define Usage Metering',
		description: 'Set up billable metrics to track customer usage',
		icon: <Gauge className='w-5 h-5 text-[#3293D9]' />,
		onClick: () => window.open('https://docs.flexprice.io/guides/billable-metric/billable-metrics-create', '_blank'),
	},
	{
		title: 'Billing',
		description: 'Create customers, assign plans, and manage subscriptions',
		icon: <Users className='w-5 h-5 text-[#3293D9]' />,
		onClick: () => window.open('https://docs.flexprice.io/guides/subscription/customers-create-subscription', '_blank'),
	},
];

const OnboardingTenant = () => {
	const { user } = useUser();
	const [orgName, setOrgName] = useState<string>('');
	const [secretKeyData, setSecretKeyData] = useState<string>('');
	const [isCopied, setIsCopied] = useState<boolean>(false);
	const [showSecretKey, setShowSecretKey] = useState<boolean>(false);
	const [activeStep, setActiveStep] = useState<number>(0);
	const [completedSteps, setCompletedSteps] = useState<number[]>([]);
	const [errors, setErrors] = useState<{ orgName: string }>({
		orgName: '',
	});

	const { data: tenant } = useQuery({
		queryKey: ['tenant'],
		queryFn: async () => {
			return await TenantApi.getTenantById(user?.tenant?.id ?? '');
		},
		enabled: !!user?.tenant?.id,
	});

	const {
		mutate: updateTenant,
		isPending: isUpdatingTenant,
		isSuccess: isTenantUpdated,
	} = useMutation({
		mutationFn: () =>
			TenantApi.updateTenant({
				name: orgName,
				metadata: {
					...tenant?.metadata,
					[TenantMetadataKey.ONBOARDING_COMPLETED]: 'true',
				},
			}),
		onSuccess: async () => {
			await refetchQueries(['user']);
			toast.success('Tenant details updated successfully');
			handleStepComplete(0);
		},
		onError: (error: ServerError) => {
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
				name: 'Onboarding Secret Key',
				type: 'private_key',
			}),
		onSuccess: (data: CreateSecretKeyResponse) => {
			setSecretKeyData(data.api_key);
			handleStepComplete(1);
		},
		onError: (error: ServerError) => {
			toast.error(`Failed to create secret key: ${error.error.message}`);
		},
	});

	const handleCopySecretKey = () => {
		if (secretKeyData) {
			navigator.clipboard.writeText(secretKeyData);
			setIsCopied(true);
			toast.success('Secret key copied to clipboard');
			setTimeout(() => setIsCopied(false), 2000);
		}
	};

	const toggleSecretKeyVisibility = () => {
		setShowSecretKey(!showSecretKey);
	};

	const handleStepComplete = (stepIndex: number) => {
		if (!completedSteps.includes(stepIndex)) {
			setCompletedSteps((prev) => [...prev, stepIndex]);
		}
		// Move to next step
		if (stepIndex < steps.length - 1) {
			setActiveStep(stepIndex + 1);
		}
	};
	const handleSaveTenant = () => {
		setErrors({
			orgName: '',
		});
		if (orgName) {
			updateTenant();
		} else {
			setErrors({
				orgName: 'Organization name is required',
			});
		}
	};

	const steps: { label: string; description: ReactNode; component: ReactNode; showAfterComplete?: boolean }[] = [
		{
			label: 'Create your organization',
			description: 'Create an organization to get started and integrate pricing within 5 minutes.',
			showAfterComplete: true,
			component: (
				<div className='flex flex-col  gap-4'>
					<Input
						error={errors.orgName}
						disabled={isUpdatingTenant || isTenantUpdated}
						label='Organization Name'
						placeholder='Enter your organization name'
						value={orgName}
						onChange={(e) => setOrgName(e)}
					/>
					<div className={cn(activeStep != 0 && 'hidden', isUpdatingTenant || isTenantUpdated ? 'opacity-50' : '')}>
						<Button onClick={handleSaveTenant} disabled={isUpdatingTenant || isTenantUpdated} isLoading={isUpdatingTenant}>
							Save
						</Button>
					</div>
				</div>
			),
		},
		{
			label: 'Add an API Key',
			description: 'Use the following generated key to authenticate requests',
			showAfterComplete: true,
			component: (
				<div className='flex flex-col gap-4'>
					{isSecretKeyCreated ? (
						<div className='relative'>
							<div className='relative'>
								<Input
									type={showSecretKey ? 'text' : 'password'}
									disabled={true}
									label='Secret Key'
									placeholder='Your secret key'
									value={secretKeyData}
									className='max-h-8'
									suffix={
										<div className='flex gap-2'>
											<button onClick={toggleSecretKeyVisibility} className=' hover:bg-gray-100 rounded-md transition-colors' type='button'>
												{showSecretKey ? <EyeOff className='h-4 w-4 text-gray-500' /> : <Eye className='h-4 w-4 text-gray-500' />}
											</button>
											<button onClick={handleCopySecretKey} className='p-2 hover:bg-gray-100 rounded-md transition-colors' type='button'>
												{isCopied ? <CheckCircle className='h-4 w-4 text-green-500' /> : <Copy className='h-4 w-4 text-gray-500' />}
											</button>
										</div>
									}
									onChange={(e) => setSecretKeyData(e)}
								/>
							</div>
							<p className='text-sm text-gray-500 mt-2'>Make sure to copy your secret key now. You won't be able to see it again!</p>
						</div>
					) : (
						<div>
							<Button
								onClick={() => createSecretKey()}
								disabled={isCreatingSecretKey || isSecretKeyCreated || activeStep !== 1}
								isLoading={isCreatingSecretKey}
								className='bg-[#3293D9] flex justify-center gap-2 hover:bg-[#2b7eb8] text-white'>
								<Lock className='h-4 w-4' />
								Add API Key
							</Button>
						</div>
					)}
				</div>
			),
		},
		{
			label: 'Demo Video',
			description: 'Watch a demo video to get started',
			showAfterComplete: true,
			component: (
				<div className='flex flex-col gap-4'>
					<iframe
						src='https://www.loom.com/embed/60d8308781254fe0bc5be341501f9fd5?sid=c034e9a8-e243-4def-ab50-976f08d56cee&amp;hideEmbedTopBar=true&amp;hide_title=true&amp;hide_owner=true&amp;hide_speed=true&amp;hide_share=true'
						allowFullScreen
						className='aspect-video max-w-96 max-h-96 rounded-lg overflow-clip'></iframe>
					<div>
						<Button
							onClick={() => {
								window.open('https://calendly.com/flexprice-30mins-chat/manish', '_blank');
							}}>
							Book a Personalized Demo
							<ExternalLink className='h-4 w-4' />
						</Button>
					</div>
				</div>
			),
		},
	];

	return (
		<Page heading='Onboarding'>
			<Spacer height={40} />
			<div className='flex flex-col max-w-2xl'>
				{steps.map((step, index) => {
					const isCompleted = completedSteps.includes(index);
					const isActive = activeStep === index;
					const isUpcoming = !isActive && !isCompleted;

					return (
						<div className='flex gap-8' key={index}>
							{/* Left side with circle and line */}
							<div className='relative flex flex-col items-center'>
								<div
									className={cn(
										'w-3 h-3 rounded-full flex items-center justify-center transition-all duration-200 mt-2',
										isCompleted ? 'bg-green-700 border-0' : isActive ? 'bg-[#3293D9] border-0' : 'border-2 border-gray-300 bg-white',
										isUpcoming && 'opacity-50',
									)}>
									{isCompleted && <Check className='w-2 h-2 text-white' />}
								</div>
								{index < steps.length && (
									<div
										className={cn(
											'absolute top-5 w-[2px] h-full transition-colors duration-200',
											isCompleted ? 'bg-green-600' : 'bg-gray-200',
											isUpcoming && 'opacity-50',
											index < steps.length - 1 ? 'bottom-0' : 'bottom-12 h-[95%]',
										)}></div>
								)}
							</div>

							{/* Right side content */}
							<div
								className={cn(
									'flex-1 transition-opacity duration-200',
									isUpcoming && 'opacity-50',
									index < steps.length - 1 ? 'pb-12' : 'pb-0',
								)}>
								<h1 className={cn('text-base font-medium mb-2')}>{step.label}</h1>
								<p className='text-sm text-gray-500'>{step.description}</p>
								{(isActive || step.showAfterComplete) && <div className='mt-2'>{step.component}</div>}
							</div>
						</div>
					);
				})}
			</div>

			<div className='mt-16'>
				<h2 className='text-xl font-medium text-gray-900 mb-2'>Explore more</h2>
				<p className='text-sm text-gray-500 mb-8'>Continue unlocking Flexprice's full capabilities and setup</p>

				<div className='grid grid-cols-3 gap-6'>
					{exploreTutorials.map((tutorial, index) => (
						<Card
							key={index}
							className='bg-white rounded-lg p-6 border border-gray-300 hover:border-[#3293D9]/20 transition-all cursor-pointer group'
							onClick={tutorial.onClick}>
							<div className='flex items-start gap-4'>
								<div className='p-2 rounded-lg bg-[#3293D9]/10 group-hover:bg-[#3293D9]/20 transition-colors'>{tutorial.icon}</div>
								<div>
									<h3 className='font-medium text-gray-900 mb-1 group-hover:text-[#3293D9] transition-colors'>{tutorial.title}</h3>
									<p className='text-sm text-gray-500'>{tutorial.description}</p>
									<div className='flex items-center gap-1 mt-4 text-slate-400 group-hover:text-blue-500 transition-all duration-200'>
										<span className='text-xs font-medium'>Learn more</span>
										<ArrowRight className='w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200' />
									</div>
								</div>
							</div>
						</Card>
					))}
				</div>
			</div>
		</Page>
	);
};

export default OnboardingTenant;
