import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TestimonialCard } from '@/components/molecules';
import { Testimonial } from '@/types';
import authBg from '../../../assets/toolright.jpg';
import { config } from '@/config/config';

const testimonials: Testimonial[] = [
	{
		dpUrl: '/assets/company-founders/krutrim.png',
		logoUrl: '/assets/company-logo/krutrim logo.png',
		testimonial:
			'Flexprice helped us roll out usage-based plans without any heavy lifting. We finally stopped patching together internal hacks and team bandwidth to just charge customers properly.',
		name: 'Raguraman Barathalwar',
		designation: 'Vice President',
		companyName: 'KRUTRIM',
		label: 'Series B',
	},
	{
		dpUrl: '/assets/company-founders/1747891553125.jpeg',
		logoUrl: '/assets/company-logo/Clueso Logo.png',
		testimonial:
			'Flexprice made it super easy for us to create and sell custom plans based on usage in minutes & has eliminated our reliance on our in-house hacks.',
		name: 'Prajwal Prakash',
		designation: 'Co-Founder & CTO (YC 23)',
		companyName: 'Clueso',
		labelImageUrl: '/assets/company-logo/Y_Combinator_logo.svg.png',
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
		dpUrl: '/assets/company-founders/wizcommerce.webp',
		logoUrl: '/assets/svg/wizcommerce.svg',
		testimonial:
			'We had to launch our new product and needed a billing solution that could handle billions of events without any latency issues or downtime. Flexprice delivered exactly that, ensuring smooth operations.',
		name: 'Divyanshu Makkar',
		designation: 'Founder and CEO',
		companyName: 'WizCommerce',
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

const customerLogos = [
	'/assets/svg/simplismart_logo.svg',
	'/assets/svg/goodmeetings_logo.svg',
	'/assets/svg/aftershoot_logo.svg',
	'/assets/svg/wizcommerce_logo.svg',
	'/assets/svg/digibee-logo-dark 1.svg',
	'/assets/svg/supervity_logo.svg',
];

const ANIMATION_DURATION = 90; // seconds for one full loop

const LandingSection = () => {
	const { t } = useTranslation('auth');
	const bgImage = config.authPage.loginBgImage ?? authBg;
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

	const { showTestimonials } = config.authPage;

	// Duplicate testimonials for seamless infinite scroll
	const cards = testimonials.concat(testimonials);

	return (
		<section
			className='w-full min-h-full flex-1 pt-14 pb-12 flex flex-col items-center justify-center'
			style={{
				backgroundImage: `url(${bgImage})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',
			}}>
			<h2 className='text-[28px] font-normal text-zinc-950 text-center mb-[44px]'>
				{config.authPage.tagline ?? t('landing.defaultTagline')}
			</h2>
			{showTestimonials && (
				<>
					<div className='relative flex justify-center items-center w-full max-w-7xl h-[340px] mb-10'>
						<div ref={scrollRef} className='w-full overflow-x-hidden' style={{ height: 320 }}>
							<div className='flex gap-x-7 w-max'>
								{cards.map((card, idx) => (
									<TestimonialCard
										key={idx}
										testimonial={card}
										logoHeightClass={
											card.companyName === 'Clueso'
												? 'max-h-4'
												: card.companyName === 'Aftershoot'
													? 'max-h-7'
													: card.companyName === 'KRUTRIM'
														? 'max-h-5'
														: card.companyName === 'Truffle AI'
															? 'max-h-4'
															: 'max-h-6'
										}
									/>
								))}
							</div>
						</div>
					</div>
					<div className='w-full flex flex-col items-center mt-8'>
						<div className='text-center font-inter text-black font-medium mb-14 text-lg'>{t('landing.trustedBy')}</div>
						<div className='w-full max-w-3xl grid grid-cols-3 grid-rows-2 gap-y-12 gap-x-12 justify-items-center items-center'>
							{customerLogos.map((logo, idx) => (
								<div key={idx} className='flex items-center justify-center'>
									<img
										src={logo}
										alt='customer logo'
										className='max-h-10 object-contain transition-all duration-200'
										style={{ maxWidth: 140 }}
									/>
								</div>
							))}
						</div>
					</div>
				</>
			)}
		</section>
	);
};

export default LandingSection;
