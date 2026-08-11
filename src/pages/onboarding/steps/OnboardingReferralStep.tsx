import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { referralSourceOptions } from '../onboardingConstants';

type OnboardingReferralStepProps = {
	referralSource: string;
	error?: string;
	disabled?: boolean;
	onReferralSourceChange: (value: string) => void;
};

const OnboardingReferralStep = ({
	referralSource,
	error,
	disabled,
	onReferralSourceChange,
}: OnboardingReferralStepProps) => {
	const { t } = useTranslation('common');

	return (
		<div className='space-y-3'>
			<label id='onboarding-referral-label' className='block text-sm font-medium text-content-zinc-bold'>
				{t('tenantSetup.referralQuestion')} <span className='text-destructive'>*</span>
			</label>
			<div
				role='radiogroup'
				aria-labelledby='onboarding-referral-label'
				aria-required='true'
				aria-invalid={!!error}
				className='flex flex-wrap gap-x-3 gap-y-3'>
				{referralSourceOptions.map((option) => {
					const isSelected = referralSource === option.value;
					return (
						<button
							key={option.value}
							type='button'
							role='radio'
							aria-checked={isSelected}
							disabled={disabled}
							onClick={() => onReferralSourceChange(option.value)}
							className={cn(
								'rounded-[6px] border-[1.5px] px-3.5 py-1.5 text-sm font-medium transition-colors',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
								'disabled:pointer-events-none disabled:opacity-50',
								isSelected
									? 'border-line-zinc-tertiary bg-surface text-content-zinc-bold shadow-sm'
									: 'border-line-zinc bg-surface text-content-zinc-bold hover:bg-surface-subtle',
							)}>
							{option.label}
						</button>
					);
				})}
			</div>
			{error ? <p className='text-sm text-destructive'>{error}</p> : null}
		</div>
	);
};

export default OnboardingReferralStep;
