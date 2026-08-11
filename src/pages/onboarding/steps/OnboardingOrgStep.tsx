import { Input } from '@/components/atoms';
import { useTranslation } from 'react-i18next';

type OnboardingOrgStepProps = {
	orgName: string;
	error?: string;
	disabled?: boolean;
	onOrgNameChange: (value: string) => void;
};

const OnboardingOrgStep = ({ orgName, error, disabled, onOrgNameChange }: OnboardingOrgStepProps) => {
	const { t } = useTranslation('common');

	return (
		<div className='space-y-1.5'>
			<label className='block text-sm font-medium text-content-zinc-bold' htmlFor='onboarding-org-name'>
				{t('tenantSetup.orgNameLabel')} <span className='text-destructive'>*</span>
			</label>
			<Input
				id='onboarding-org-name'
				placeholder={t('tenantSetup.orgNamePlaceholder')}
				value={orgName}
				onChange={onOrgNameChange}
				required
				error={error}
				className='rounded-lg border-line-zinc'
				disabled={disabled}
			/>
		</div>
	);
};

export default OnboardingOrgStep;
