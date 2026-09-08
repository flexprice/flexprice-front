import { Input } from '@/components/atoms';
import { useTranslation } from 'react-i18next';

type OnboardingOrgUrlStepProps = {
	orgUrl: string;
	error?: string;
	disabled?: boolean;
	onOrgUrlChange: (value: string) => void;
};

const OnboardingOrgUrlStep = ({ orgUrl, error, disabled, onOrgUrlChange }: OnboardingOrgUrlStepProps) => {
	const { t } = useTranslation('common');

	return (
		<div className='space-y-1.5'>
			<label className='block text-sm font-medium text-content-zinc-bold' htmlFor='onboarding-org-url'>
				{t('tenantSetup.orgUrlLabel')} <span className='text-destructive'>*</span>
			</label>
			<Input
				id='onboarding-org-url'
				type='url'
				placeholder={t('tenantSetup.orgUrlPlaceholder')}
				value={orgUrl}
				onChange={onOrgUrlChange}
				required
				error={error}
				className='rounded-lg border-line-zinc'
				disabled={disabled}
			/>
		</div>
	);
};

export default OnboardingOrgUrlStep;
