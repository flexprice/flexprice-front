import { useTranslation } from 'react-i18next';
import type { Testimonial } from '@/types';
import { cn } from '@/lib/utils';
import sideBg from '../../../assets/side.png';
import sideBgDark from '../../../assets/sidedark.png';

const FEATURED_REVIEW: Testimonial = {
	dpUrl: '/assets/company-founders/ramavapi.png',
	logoUrl: '/assets/company-logo/vapidarklogo.png',
	testimonial:
		'Honestly the customer dashboard was the one thing our team felt the most. We stopped getting those billing questions that used to pile up every month by using Flexprice.',
	name: 'Ram A',
	designation: 'Head of Finance',
	companyName: 'Vapi',
	label: 'Series B',
};

/**
 * Right-rail social proof for onboarding: one large featured review.
 * Intentionally different from auth LandingSection (no carousel, logo wall, or tagline).
 */
const OnboardingLandingPanel = () => {
	const { t } = useTranslation('common');
	const review = FEATURED_REVIEW;

	return (
		<section className='relative flex min-h-full w-full flex-1 items-center justify-center overflow-hidden px-12 py-16 lg:px-16'>
			<div
				aria-hidden
				className='absolute inset-0 bg-cover bg-center bg-no-repeat dark:hidden'
				style={{ backgroundImage: `url(${sideBg})` }}
			/>
			<div
				aria-hidden
				className='absolute inset-0 hidden bg-cover bg-center bg-no-repeat dark:block'
				style={{ backgroundImage: `url(${sideBgDark})` }}
			/>

			<div className='relative flex w-full max-w-[560px] flex-col'>
				<blockquote className='text-[28px] font-normal leading-snug tracking-tight text-zinc-950 dark:text-zinc-50'>
					“{review.testimonial}”
				</blockquote>

				<div className='mt-16 flex items-center justify-between gap-6'>
					<div className='flex min-w-0 items-center gap-3.5'>
						<img
							src={review.dpUrl}
							alt={review.name}
							className='size-12 shrink-0 rounded-full border border-zinc-200/80 object-cover dark:border-zinc-700'
						/>
						<div className='min-w-0'>
							<div className='truncate text-[15px] font-medium text-zinc-950 dark:text-zinc-50'>{review.name}</div>
							<div className='truncate text-sm text-zinc-600 dark:text-zinc-400'>
								{review.designation}
								{review.companyName ? `, ${review.companyName}` : ''}
							</div>
						</div>
					</div>
					<img
						src={review.logoUrl}
						alt={t('tenantSetup.reviewCompanyLogoAlt', { company: review.companyName })}
						className={cn('max-h-[22px] w-auto shrink-0 object-contain dark:brightness-0 dark:invert')}
					/>
				</div>
			</div>
		</section>
	);
};

export default OnboardingLandingPanel;
