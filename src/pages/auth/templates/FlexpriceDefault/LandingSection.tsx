// src/pages/auth/templates/FlexpriceDefault/LandingSection.tsx
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TestimonialCard } from '@/components/molecules';
import { Testimonial, CustomerLogo } from '@/types';
import { cn } from '@/lib/utils';
import authBg from '../../../../../assets/toolright.jpg';

const testimonials: Testimonial[] = [
	{
		dpUrl: '/assets/company-founders/martincb.jpeg',
		logoUrl: '/assets/company-logo/cbdklogo.png',
		testimonial:
			"We weren't willing to give up control of our data, but we still needed a reliable subscription tool. Flexprice on-prem was the only thing that worked for us!",
		name: 'Martin Sønderkær Jung',
		designation: 'CTO',
		companyName: 'C&B Systemer',
	},
	{
		dpUrl: '/assets/company-founders/ramavapi.png',
		logoUrl: '/assets/company-logo/vapilogo.png',
		testimonial:
			'Honestly the customer dashboard was the one thing our team felt the most. We stopped getting those billing questions that used to pile up every month by using Flexprice.',
		name: 'Ram A',
		designation: 'Head of Finance',
		companyName: 'Vapi',
		label: 'Series B',
	},
	{
		dpUrl: '/assets/company-founders/calioptimality.jpeg',
		logoUrl: '/assets/company-logo/optimality.png',
		testimonial:
			"Every pricing change took us weeks & by the time it shipped the market had moved. With Flexprice we've done 3 pricing overhauls in under a year, without engineering holding us back.",
		name: 'Cali Collins',
		designation: 'CPO & Co-founder',
		companyName: 'Optimality',
	},
	{
		dpUrl: '/assets/company-founders/1732115195410.jpeg',
		logoUrl: '/assets/company-logo/aftershoot copy.png',
		testimonial:
			"Flexprice streamlined our entire pricing workflow. We went from messy internal scripts to clean, configurable usage plans in no time, and it's been a huge relief for our team.",
		name: 'Justin Benson',
		designation: 'Co-Founder',
		companyName: 'Aftershoot',
		label: 'Series A',
	},
	{
		dpUrl: '/assets/company-founders/simplismart.png',
		logoUrl: '/assets/svg/simplismart_logo.svg',
		testimonial:
			'Flexprice has completely transformed how we handle billing. Setting up usage-based pricing was a breeze, and their SDKs fit right into our stack.',
		name: 'Shubhendu Shishir',
		designation: 'Head of Engineering',
		companyName: 'Simplismart',
		label: 'Series A',
	},
	{
		dpUrl: '/assets/company-founders/truffleai.png',
		logoUrl: '/assets/company-logo/Truffle AI Logo.png',
		testimonial:
			'Flexprice saved us thousands of development hours that we would have spent building in-house. Managing pricing plans and experimenting with models is now effortless.',
		name: 'Shaunak Srivastava',
		designation: 'Co-founder (YC 25)',
		companyName: 'Truffle AI',
		labelImageUrl: '/assets/company-logo/Y_Combinator_logo.svg.png',
	},
];

const customerLogos: CustomerLogo[] = [
	{ src: '/assets/company-logo/krutrim-logo 1.png' },
	{ src: '/assets/company-logo/vapidarklogo.png', heightClass: 'h-[60%]' },
	{ src: '/assets/company-logo/Simplismart logo.png' },
	{ src: '/assets/company-logo/aftershoot copy 1.png' },
	{ src: '/assets/company-logo/faciliologo.png', heightClass: 'h-[60%]' },
	{ src: '/assets/company-logo/giginlogo.png', heightClass: 'h-[60%]' },
];

const ANIMATION_DURATION = 90;

const LandingSection: React.FC = () => {
	const { t } = useTranslation('auth');
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const scrollContainer = scrollRef.current;
		if (!scrollContainer) return;
		let animationFrame: number;
		let start: number | null = null;
		const scrollWidth = scrollContainer.scrollWidth / 2;

		function step(timestamp: number) {
			if (!start) start = timestamp;
			const elapsed = (timestamp - start) / 1000;
			const distance = (elapsed * scrollWidth) / ANIMATION_DURATION;
			if (scrollContainer) {
				scrollContainer.scrollLeft = distance % scrollWidth;
			}
			animationFrame = requestAnimationFrame(step);
		}
		animationFrame = requestAnimationFrame(step);
		return () => cancelAnimationFrame(animationFrame);
	}, []);

	const cards = testimonials.concat(testimonials);

	return (
		<section
			className='w-full min-h-full flex-1 pt-14 pb-12 flex flex-col items-center justify-center'
			style={{
				backgroundImage: `url(${authBg})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',
			}}>
			<h2 className='text-[28px] font-normal text-zinc-950 mb-[44px] text-center'>{t('landing.defaultTagline')}</h2>
			<div className='relative flex justify-center items-center w-full max-w-7xl h-[340px] mb-10'>
				<div ref={scrollRef} className='w-full overflow-x-hidden' style={{ height: 320 }}>
					<div className='flex gap-x-7 w-max'>
						{cards.map((card, idx) => (
							<TestimonialCard
								key={`${card.companyName}-${idx}`}
								testimonial={card}
								logoHeightClass={
									card.companyName === 'Aftershoot'
										? 'max-h-7'
										: card.companyName === 'Truffle AI'
											? 'max-h-4'
											: card.companyName === 'Optimality'
												? 'max-h-6'
												: card.companyName === 'Vapi'
													? 'max-h-4'
													: card.companyName === 'C&B Systemer'
														? 'max-h-5'
														: 'max-h-6'
								}
							/>
						))}
					</div>
				</div>
			</div>
			<div className='w-full flex flex-col items-center mt-8'>
				<div className='text-center text-black font-medium mb-14 text-lg'>{t('landing.trustedBy')}</div>
				<div className='w-full max-w-3xl grid grid-cols-3 grid-rows-2 gap-y-12 gap-x-10 justify-items-center items-center'>
					{customerLogos.map((logo) => (
						<div key={logo.src} className='flex h-10 w-full max-w-[160px] items-center justify-center'>
							<img
								src={logo.src}
								alt={t('landing.customerLogoAlt')}
								className={cn('w-auto max-w-full object-contain object-center', logo.heightClass ?? 'h-full')}
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default LandingSection;
