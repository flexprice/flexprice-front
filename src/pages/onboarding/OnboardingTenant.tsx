import { Button } from '@/components/atoms';
import SplitIslandLayout from '@/layouts/SplitIslandLayout';
import OnboardingLandingPanel from './OnboardingLandingPanel';
import { OnboardingOrgStep, OnboardingReferralStep } from './steps';
import useOnboardingTenant from './useOnboardingTenant';

const OnboardingTenant = () => {
	const { t, orgName, setOrgName, referralSource, setReferralSource, errors, isPending, showFullScreenLoader, handleContinue } =
		useOnboardingTenant();

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
				<OnboardingOrgStep orgName={orgName} error={errors.orgName} disabled={isPending} onOrgNameChange={setOrgName} />
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
		<SplitIslandLayout
			left={
				<div className='flex min-h-0 flex-1 flex-col'>
					<div className='flex flex-1 items-center justify-center overflow-y-auto pt-[10px]'>
						<div className='mx-auto flex w-[88%] max-w-xl flex-col justify-center py-10 sm:w-[70%] lg:w-[55%] lg:py-0'>{formContent}</div>
					</div>
				</div>
			}
			right={<OnboardingLandingPanel />}
		/>
	);
};

export default OnboardingTenant;
