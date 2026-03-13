// import { Page, Spacer, Input, Button, Card, Select, SelectOption } from '@/components/atoms';
// import TenantApi from '@/api/TenantApi';
// import OnboardingApi from '@/api/OnboardingApi';
// import { useMutation } from '@tanstack/react-query';
// import { Check, Globe, Gauge, Users, ArrowRight, ExternalLink } from 'lucide-react';
// import { ReactNode, useState } from 'react';
// import { toast } from 'react-hot-toast';
// import { cn } from '@/lib/utils';
// import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
// import { TenantMetadataKey } from '@/models/Tenant';
// import useUser from '@/hooks/useUser';
// import { useQuery } from '@tanstack/react-query';
// import { ServerError } from '@/core/axios/types';
// interface TutorialItem {
// 	title: string;
// 	description: string;
// 	onClick: () => void;
// 	icon: ReactNode;
// }

// const exploreTutorials: TutorialItem[] = [
// 	{
// 		title: 'Getting Started',
// 		description: 'Learn the basics of Flexprice in 5 minutes',
// 		icon: <Globe className='w-5 h-5 text-blue-600' />,
// 		onClick: () => window.open('https://docs.flexprice.io', '_blank', 'noopener,noreferrer'),
// 	},
// 	{
// 		title: 'Define Usage Metering',
// 		description: 'Set up billable metrics to track customer usage',
// 		icon: <Gauge className='w-5 h-5 text-blue-600' />,
// 		onClick: () => window.open('https://docs.flexprice.io/docs/event-ingestion/creating-a-metered-feature', '_blank'),
// 	},
// 	{
// 		title: 'Billing',
// 		description: 'Create customers, assign plans, and manage subscriptions',
// 		icon: <Users className='w-5 h-5 text-blue-600' />,
// 		onClick: () => window.open('https://docs.flexprice.io/docs/product-catalogue/plans/create', '_blank'),
// 	},
// ];

// const OnboardingTenant = () => {
// 	const { user } = useUser();
// 	const [orgName, setOrgName] = useState<string>('');
// 	const [role, setRole] = useState<string>('');
// 	const [teamSize, setTeamSize] = useState<string>('');
// 	const [referralSource, setReferralSource] = useState<string>('');
// 	const [pricingType, setPricingType] = useState<string>('');
// 	const [activeStep, setActiveStep] = useState<number>(0);
// 	const [completedSteps, setCompletedSteps] = useState<number[]>([]);
// 	const [errors, setErrors] = useState<{
// 		orgName: string;
// 		role?: string;
// 		teamSize?: string;
// 		referralSource?: string;
// 		pricingType?: string;
// 	}>({
// 		orgName: '',
// 	});

// 	const { data: tenant } = useQuery({
// 		queryKey: ['tenant'],
// 		queryFn: async () => {
// 			return await TenantApi.getTenantById(user?.tenant?.id ?? '');
// 		},
// 		enabled: !!user?.tenant?.id,
// 	});

// 	const {
// 		mutate: updateTenant,
// 		isPending: isUpdatingTenant,
// 		isSuccess: isTenantUpdated,
// 	} = useMutation({
// 		mutationFn: () =>
// 			TenantApi.updateTenant({
// 				name: orgName,
// 				metadata: {
// 					...tenant?.metadata,
// 					[TenantMetadataKey.ONBOARDING_COMPLETED]: 'true',
// 				},
// 			}),
// 		onSuccess: async () => {
// 			await refetchQueries(['user', 'tenant']);
// 			toast.success('Tenant details updated successfully');
// 			handleStepComplete(0);
// 		},
// 		onError: (error: ServerError) => {
// 			toast.error(error.error.message || 'Failed to update tenant details. Please try again.');
// 		},
// 	});

// 	const { mutate: recordOnboardingData } = useMutation({
// 		mutationFn: () =>
// 			OnboardingApi.recordOnboardingData({
// 				orgName: orgName || tenant?.name || '',
// 				role: role || '',
// 				teamSize: teamSize || '',
// 				referralSource: referralSource || '',
// 				pricingType: pricingType || '',
// 				userEmail: user?.email || '',
// 				tenantId: user?.tenant?.id || '',
// 				timestamp: new Date().toISOString(),
// 			}),
// 		onError: (error) => {
// 			// Silently fail - don't block the onboarding flow
// 			console.error('Failed to record onboarding data:', error);
// 		},
// 	});

// 	const {
// 		mutate: saveOnboardingInfo,
// 		isPending: isSavingOnboardingInfo,
// 		isSuccess: isOnboardingInfoSaved,
// 	} = useMutation({
// 		mutationFn: () =>
// 			TenantApi.updateTenant({
// 				name: orgName || tenant?.name,
// 				metadata: {
// 					...tenant?.metadata,
// 					onboarding_role: role,
// 					onboarding_team_size: teamSize,
// 					onboarding_referral_source: referralSource,
// 					onboarding_pricing_type: pricingType,
// 				},
// 			}),
// 		onSuccess: async () => {
// 			await refetchQueries(['user', 'tenant']);
// 			toast.success('Onboarding information saved successfully');

// 			// Record onboarding data to Google Sheets (non-blocking)
// 			recordOnboardingData();

// 			handleStepComplete(1);
// 		},
// 		onError: (error: ServerError) => {
// 			toast.error(error.error.message || 'Failed to save onboarding information. Please try again.');
// 		},
// 	});

// 	const handleStepComplete = (stepIndex: number) => {
// 		if (!completedSteps.includes(stepIndex)) {
// 			setCompletedSteps((prev) => [...prev, stepIndex]);
// 		}
// 		// Move to next step
// 		if (stepIndex < steps.length - 1) {
// 			setActiveStep(stepIndex + 1);
// 		}
// 	};
// 	const handleSaveTenant = () => {
// 		setErrors({
// 			orgName: '',
// 		});
// 		if (orgName) {
// 			updateTenant();
// 		} else {
// 			setErrors({
// 				orgName: 'Organization name is required',
// 			});
// 		}
// 	};

// 	const handleSaveOnboardingInfo = () => {
// 		setErrors({
// 			orgName: '',
// 			role: '',
// 			teamSize: '',
// 			referralSource: '',
// 			pricingType: '',
// 		});
// 		if (referralSource) {
// 			saveOnboardingInfo();
// 		} else {
// 			setErrors({
// 				orgName: '',
// 				role: '',
// 				teamSize: '',
// 				referralSource: !referralSource ? 'Referral source is required' : '',
// 				pricingType: '',
// 			});
// 		}
// 	};

// 	const teamSizeOptions: SelectOption[] = [
// 		{ label: '1-10', value: '1-10' },
// 		{ label: '11-20', value: '11-20' },
// 		{ label: '21-50', value: '21-50' },
// 		{ label: '50+', value: '50+' },
// 	];

// 	const referralSourceOptions: SelectOption[] = [
// 		{ label: 'LinkedIn', value: 'LinkedIn' },
// 		{ label: 'X (Formerly Twitter)', value: 'X' },
// 		{ label: 'Blogs', value: 'Blogs' },
// 		{ label: 'ChatGPT / Perplexity / Gemini', value: 'ChatGPT / Perplexity / Gemini' },
// 		{ label: 'HackerNews', value: 'HackerNews' },
// 		{ label: 'Product Hunt', value: 'Product Hunt' },
// 	];

// 	const pricingTypeOptions: SelectOption[] = [
// 		{ label: 'Usage-Based', value: 'Usage-Based' },
// 		{ label: 'Subscription', value: 'Subscription' },
// 		{ label: 'Hybrid Pricing', value: 'Hybrid Pricing' },
// 		{ label: 'Others', value: 'Others' },
// 	];

// 	const steps: { label: string; description: ReactNode; component: ReactNode; showAfterComplete?: boolean }[] = [
// 		{
// 			label: 'Create your organization',
// 			description: 'Create an organization to get started and integrate pricing within 5 minutes.',
// 			showAfterComplete: true,
// 			component: (
// 				<div className='flex flex-col gap-4'>
// 					<Input
// 						error={errors.orgName}
// 						disabled={isUpdatingTenant || isTenantUpdated}
// 						placeholder='Enter your organization name'
// 						value={orgName}
// 						onChange={(e) => setOrgName(e)}
// 					/>
// 					<div className={cn(activeStep != 0 && 'hidden', isUpdatingTenant || isTenantUpdated ? 'opacity-50' : '')}>
// 						<Button onClick={handleSaveTenant} disabled={isUpdatingTenant || isTenantUpdated} isLoading={isUpdatingTenant}>
// 							Save
// 						</Button>
// 					</div>
// 				</div>
// 			),
// 		},
// 		{
// 			label: 'Tell us about yourself',
// 			description: 'Help us understand your needs better',
// 			showAfterComplete: true,
// 			component: (
// 				<div className='flex flex-col gap-6'>
// 					<div className='grid grid-cols-2 gap-x-20 gap-y-8'>
// 						<div className='min-w-[320px]'>
// 							<Input
// 								error={errors.role}
// 								disabled={isSavingOnboardingInfo || isOnboardingInfoSaved}
// 								label='What role do you perform in your organization?'
// 								placeholder='Your role'
// 								value={role}
// 								onChange={(e) => setRole(e)}
// 							/>
// 						</div>
// 						<div className='min-w-[320px]'>
// 							<Select
// 								options={teamSizeOptions}
// 								value={teamSize}
// 								label="What's your team size?"
// 								placeholder='Team size'
// 								error={errors.teamSize}
// 								disabled={isSavingOnboardingInfo || isOnboardingInfoSaved}
// 								onChange={(value) => setTeamSize(value)}
// 							/>
// 						</div>
// 						<div className='min-w-[320px]'>
// 							<Select
// 								options={referralSourceOptions}
// 								value={referralSource}
// 								label='How did you find us?'
// 								required
// 								placeholder='Where did you hear about us?'
// 								error={errors.referralSource}
// 								disabled={isSavingOnboardingInfo || isOnboardingInfoSaved}
// 								onChange={(value) => setReferralSource(value)}
// 							/>
// 						</div>
// 						<div className='min-w-[320px]'>
// 							<Select
// 								options={pricingTypeOptions}
// 								value={pricingType}
// 								label='What pricing model are you choosing for Flexprice?'
// 								placeholder='How do you price today?'
// 								error={errors.pricingType}
// 								disabled={isSavingOnboardingInfo || isOnboardingInfoSaved}
// 								onChange={(value) => setPricingType(value)}
// 							/>
// 						</div>
// 					</div>
// 					<div className={cn(activeStep != 1 && 'hidden', isSavingOnboardingInfo || isOnboardingInfoSaved ? 'opacity-50' : '')}>
// 						<Button
// 							onClick={handleSaveOnboardingInfo}
// 							disabled={isSavingOnboardingInfo || isOnboardingInfoSaved}
// 							isLoading={isSavingOnboardingInfo}>
// 							Save
// 						</Button>
// 					</div>
// 				</div>
// 			),
// 		},
// 		{
// 			label: "You're all Set 🎉",
// 			description: <>Book a demo or Join our community for continued support.</>,
// 			showAfterComplete: true,
// 			component: (
// 				<div className='flex flex-col gap-8'>
// 					<div className='flex flex-col sm:flex-row gap-4'>
// 						<Button
// 							onClick={() => {
// 								window.open('https://calendly.com/nikhil-flexprice/30min', '_blank');
// 							}}
// 							className='flex items-center gap-2'>
// 							Book a Demo
// 							<ExternalLink className='h-3.5 w-3.5' />
// 						</Button>
// 						<Button
// 							variant='outline'
// 							onClick={() => {
// 								window.open('https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ', '_blank');
// 							}}
// 							className='flex items-center gap-2'>
// 							Join our Slack Community
// 							<ExternalLink className='h-3.5 w-3.5' />
// 						</Button>
// 					</div>
// 					<div className='flex flex-col'>
// 						<iframe
// 							src='https://www.loom.com/embed/60d8308781254fe0bc5be341501f9fd5?sid=c034e9a8-e243-4def-ab50-976f08d56cee&amp;hideEmbedTopBar=true&amp;hide_title=true&amp;hide_owner=true&amp;hide_speed=true&amp;hide_share=true'
// 							allowFullScreen
// 							className='aspect-video max-w-96 max-h-96 rounded-lg overflow-clip'></iframe>
// 					</div>
// 				</div>
// 			),
// 		},
// 	];

// 	return (
// 		<Page heading='Onboarding'>
// 			<Spacer height={40} />
// 			<div className='flex flex-col max-w-4xl'>
// 				{steps.map((step, index) => {
// 					const isCompleted = completedSteps.includes(index);
// 					const isActive = activeStep === index;
// 					const isUpcoming = !isActive && !isCompleted;

// 					return (
// 						<div className='flex gap-8' key={index}>
// 							{/* Left side with circle and line */}
// 							<div className='relative flex flex-col items-center'>
// 								<div
// 									className={cn(
// 										'w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 mt-2',
// 										isCompleted ? 'bg-green-700 border-0' : isActive ? 'bg-blue-600 border-0' : 'border-2 border-gray-300 bg-white',
// 										isUpcoming && 'opacity-40',
// 									)}>
// 									{isCompleted && <Check className='w-2.5 h-2.5 text-white' />}
// 								</div>
// 								{index < steps.length && (
// 									<div
// 										className={cn(
// 											'absolute top-6 w-[2px] h-full transition-colors duration-200',
// 											isCompleted ? 'bg-green-600' : 'bg-gray-200',
// 											isUpcoming && 'opacity-50',
// 											index < steps.length - 1 ? 'bottom-0' : 'bottom-12 h-[95%]',
// 										)}></div>
// 								)}
// 							</div>

// 							{/* Right side content */}
// 							<div
// 								className={cn(
// 									'flex-1 transition-opacity duration-200',
// 									isUpcoming && 'opacity-45 blur-[2.5px]',
// 									index < steps.length - 1 ? 'pb-12' : 'pb-0',
// 								)}>
// 								<h1 className={cn('text-base font-medium mb-2')}>{step.label}</h1>
// 								<p className='text-sm text-gray-500'>{step.description}</p>
// 								{(isActive || step.showAfterComplete) && <div className='mt-6'>{step.component}</div>}
// 							</div>
// 						</div>
// 					);
// 				})}
// 			</div>

// 			<div className='mt-16'>
// 				<h2 className='text-xl font-medium text-gray-900 mb-2'>Explore more</h2>
// 				<p className='text-sm text-gray-500 mb-8'>Continue unlocking Flexprice's full capabilities and setup</p>

// 				<div className='grid grid-cols-3 gap-6'>
// 					{exploreTutorials.map((tutorial, index) => (
// 						<Card
// 							key={index}
// 							className='bg-white rounded-lg p-6 border border-gray-300 hover:border-blue-600/20 transition-all cursor-pointer group'
// 							onClick={tutorial.onClick}>
// 							<div className='flex items-start gap-4'>
// 								<div className='p-2 rounded-lg bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors'>{tutorial.icon}</div>
// 								<div>
// 									<h3 className='font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors'>{tutorial.title}</h3>
// 									<p className='text-sm text-gray-500'>{tutorial.description}</p>
// 									<div className='flex items-center gap-1 mt-4 text-slate-400 group-hover:text-blue-600 transition-all duration-200'>
// 										<span className='text-xs font-medium'>Learn more</span>
// 										<ArrowRight className='w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200' />
// 									</div>
// 								</div>
// 							</div>
// 						</Card>
// 					))}
// 				</div>
// 			</div>
// 		</Page>
// 	);
// };

// export default OnboardingTenant;
