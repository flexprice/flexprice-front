import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Button } from '@/components/atoms';
import { RouteNames } from '@/core/routes/Routes';
import TenantApi from '@/api/TenantApi';
import OnboardingApi from '@/api/OnboardingApi';
import { TenantMetadataKey } from '@/models';
import useUser from '@/hooks/useUser';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import OnboardingLandingPanel from './OnboardingLandingPanel';
import { BANNED_ORG_NAME_WORDS, type OnboardingFormErrors } from './onboardingConstants';
import { OnboardingOrgStep, OnboardingReferralStep } from './steps';

const OnboardingTenant = () => {
	const navigate = useNavigate();
	const { t } = useTranslation('common');
	const { user, loading: userLoading } = useUser();
	const [orgName, setOrgName] = useState('');
	const [referralSource, setReferralSource] = useState('');
	const [errors, setErrors] = useState<OnboardingFormErrors>({});

	const { data: tenant, isLoading: isTenantLoading } = useQuery({
		queryKey: ['tenant-onboarding'],
		queryFn: () => TenantApi.getTenantById(user?.tenant?.id ?? ''),
		enabled: !!user?.tenant?.id,
	});

	const showFullScreenLoader = userLoading || (!!user?.tenant?.id && isTenantLoading);

	const { mutate: completeOnboarding, isPending } = useMutation({
		mutationFn: async () => {
			await TenantApi.updateTenant({
				name: orgName.trim(),
				metadata: {
					...tenant?.metadata,
					[TenantMetadataKey.ONBOARDING_COMPLETED]: 'true',
					onboarding_referral_source: referralSource,
				},
			});
			await OnboardingApi.recordOnboardingData({
				orgName: orgName.trim(),
				orgUrl: '',
				website: '',
				role: '',
				teamSize: '',
				referralSource,
				pricingType: '',
				userEmail: user?.email || '',
				tenantId: user?.tenant?.id || '',
				timestamp: new Date().toISOString(),
			});
		},
		onSuccess: async () => {
			await Promise.all([refetchQueries('user'), refetchQueries('tenant-onboarding'), refetchQueries('tenant')]);
			toast.success("You're all set!");
			navigate(RouteNames.homeDashboard, { replace: true });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to complete onboarding. Please try again.');
		},
	});

	const validate = (): boolean => {
		const next: OnboardingFormErrors = {};
		const trimmedOrgName = orgName.trim();

		if (!trimmedOrgName) {
			next.orgName = 'Organization name is required';
		} else {
			const lowerName = trimmedOrgName.toLowerCase();
			if (lowerName === 'flexprice') {
				next.orgName = "Oops! That's us. Please enter your organization name instead.";
				toast("That's us, please enter your organization name.", { icon: '😅' });
			} else {
				const bannedMatch = BANNED_ORG_NAME_WORDS.find((word) => lowerName.includes(word.toLowerCase()));
				if (bannedMatch) {
					next.orgName = `Organization name cannot include the word “${bannedMatch}”. Please choose another name.`;
				}
			}
		}

		if (!referralSource) next.referralSource = 'Please select how you found us';

		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleContinue = () => {
		if (!validate()) return;
		completeOnboarding();
	};

	const formContent = showFullScreenLoader ? (
		<div
			className='flex items-center justify-center py-24'
			role='status'
			aria-busy='true'
			aria-label={t('tenantSetup.loadingWorkspaceAria')}>
			<div className='h-12 w-12 animate-spin rounded-full border-b-2 border-primary' />
		</div>
	) : (
		<>
			<h2 className='mb-2 text-center text-3xl font-medium text-content-heading'>{t('tenantSetup.welcomeHeading')}</h2>
			<p className='mb-10 whitespace-nowrap text-center text-content-tertiary'>{t('tenantSetup.welcomeSubtext')}</p>
			<div className='space-y-6'>
				<OnboardingOrgStep
					orgName={orgName}
					error={errors.orgName}
					disabled={isPending}
					onOrgNameChange={setOrgName}
				/>
				<OnboardingReferralStep
					referralSource={referralSource}
					error={errors.referralSource}
					disabled={isPending}
					onReferralSourceChange={setReferralSource}
				/>
			</div>
			<div className='mt-10'>
				<Button onClick={handleContinue} className='h-11 w-full rounded-lg' isLoading={isPending} disabled={isPending}>
					{t('tenantSetup.getStarted')}
				</Button>
			</div>
		</>
	);

	return (
		<div className='page flex min-h-screen w-full !flex-col bg-surface-canvas !p-0 lg:!flex-row'>
			<div className='flex w-full flex-col lg:w-[45%]'>
				<div className='flex flex-1 items-center justify-center pt-[10px]'>
					<div className='mx-auto flex w-[88%] max-w-xl flex-col justify-center py-10 sm:w-[70%] lg:w-[55%] lg:py-0'>
						{formContent}
					</div>
				</div>
			</div>
			<div className='hidden min-h-screen w-[55%] lg:flex'>
				<OnboardingLandingPanel />
			</div>
		</div>
	);
};

export default OnboardingTenant;
