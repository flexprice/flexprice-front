import { useRef, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { referralSourceOptions } from '../onboardingConstants';

type OnboardingReferralStepProps = {
	referralSource: string;
	error?: string;
	disabled?: boolean;
	onReferralSourceChange: (value: string) => void;
};

const OnboardingReferralStep = ({ referralSource, error, disabled, onReferralSourceChange }: OnboardingReferralStepProps) => {
	const { t } = useTranslation('common');
	const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

	const focusOption = (index: number) => {
		const option = referralSourceOptions[index];
		if (!option) return;
		onReferralSourceChange(option.value);
		buttonRefs.current[index]?.focus();
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (disabled || referralSourceOptions.length === 0) return;

		const currentIndex = Math.max(
			0,
			referralSourceOptions.findIndex((option) => option.value === referralSource),
		);

		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
			event.preventDefault();
			focusOption((currentIndex + 1) % referralSourceOptions.length);
			return;
		}

		if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
			event.preventDefault();
			focusOption((currentIndex - 1 + referralSourceOptions.length) % referralSourceOptions.length);
			return;
		}

		if (event.key === 'Home') {
			event.preventDefault();
			focusOption(0);
			return;
		}

		if (event.key === 'End') {
			event.preventDefault();
			focusOption(referralSourceOptions.length - 1);
		}
	};

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
				onKeyDown={handleKeyDown}
				className='flex flex-wrap gap-x-3 gap-y-3'>
				{referralSourceOptions.map((option, index) => {
					const isSelected = referralSource === option.value;
					return (
						<button
							key={option.value}
							ref={(node) => {
								buttonRefs.current[index] = node;
							}}
							type='button'
							role='radio'
							aria-checked={isSelected}
							tabIndex={isSelected || (!referralSource && index === 0) ? 0 : -1}
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
							{t(option.labelKey)}
						</button>
					);
				})}
			</div>
			{error ? <p className='text-sm text-destructive'>{error}</p> : null}
		</div>
	);
};

export default OnboardingReferralStep;
