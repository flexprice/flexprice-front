import { useEffect, useRef } from 'react';
import { TestimonialCard } from '@/components/molecules';
import { Testimonial } from '@/types';

const testimonials: Testimonial[] = [
	{
		dpUrl: '/assets/company-founders/verniq.webp',
		logoUrl: '/assets/company-logo/verniq-ic.svg',
		testimonial: 'Flexprice allowed us to focus on building our product without worrying about billing.',
		name: 'Punit Dhimaan',
		designation: 'Founder',
		companyName: 'VerniQ',
	},
	{
		dpUrl: '/assets/company-founders/chaabi.webp',
		logoUrl: '/assets/company-logo/chaabi-ic.svg',
		testimonial:
			'Flexprice saved us thousands of development hours that we would have spent building an in-house billing system. Managing pricing plans, experimenting with models & providing actionable data to teams is now effortless!',
		name: 'Jaideep Kumar',
		designation: 'Co-Founder & COO',
		companyName: 'Chaabi',
	},
	{
		dpUrl: '/assets/company-founders/wizcommerce.webp',
		logoUrl: '/assets/company-logo/wizcommerce-ic.svg',
		testimonial:
			'We had to launch our new product and needed a billing solution that could handle billions of events without any latency issues or downtime. Flexprice delivered exactly that, ensuring smooth operations.',
		name: 'Divyanshu',
		designation: 'Founder',
		companyName: 'WizCommerce',
	},
	{
		dpUrl: '/assets/company-founders/simplismart.webp',
		logoUrl: '/assets/company-logo/simplismart-ic.svg',
		testimonial:
			'Flexprice has completely transformed how we handle billing. Setting up usage-based pricing was a breeze, and their SDKs fit right into our stack.',
		name: 'Shubhendu Shishir',
		designation: 'Head of Engineering',
		companyName: 'Simplismart',
	},
	{
		dpUrl: '/assets/company-founders/publive.webp',
		logoUrl: '/assets/company-logo/publive-ic.svg',
		testimonial:
			'Flexprice made it super easy for us to create and sell custom plans based on usage in minutes & has eliminated our reliance on Excel sheets.',
		name: 'Gagandeep Singh',
		designation: 'Co-Founder',
		companyName: 'ThePubLive.com',
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

const ANIMATION_DURATION = 35; // seconds for one full loop

const LandingSection = () => {
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

	// Duplicate testimonials for seamless infinite scroll
	const cards = testimonials.concat(testimonials);

	return (
		<section className='w-full h-full py-12 bg-[#f8fafc] flex flex-col items-center justify-center'>
			<h2 className='text-[28px] font-normal text-zinc-950 text-center mb-[44px]'>
				Focus on <span className='font-medium'>building</span>, not billing.
			</h2>
			<div className='relative flex justify-center items-center w-full max-w-7xl h-[340px] mb-10'>
				<div ref={scrollRef} className='w-full overflow-x-hidden' style={{ height: 320 }}>
					<div className='flex gap-x-7 w-max'>
						{cards.map((t, idx) => (
							<TestimonialCard key={idx} testimonial={t} logoHeightClass='max-h-6' />
						))}
					</div>
				</div>
			</div>
			<div className='w-full flex flex-col items-center mt-8'>
				<div className='text-center font-inter text-black font-medium mb-14 text-lg'>Trusted by</div>
				<div className='w-full max-w-3xl grid grid-cols-3 grid-rows-2 gap-y-12 gap-x-12 justify-items-center items-center'>
					{customerLogos.map((logo, idx) => (
						<div key={idx} className='flex items-center justify-center'>
							<img
								src={logo}
								alt='customer logo'
								className='max-h-10 object-contain  transition-all duration-200'
								style={{ maxWidth: 140 }}
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default LandingSection;
