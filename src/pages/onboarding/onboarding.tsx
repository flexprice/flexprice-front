import { Button, Card, Page } from '@/components/atoms';
import { AlignJustify, ArrowRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ApiDocsContent } from '@/components/molecules';
import { useState } from 'react';

export interface TutorialItem {
	title: string;
	description: string;
	onClick: () => void;
}

const tutorials: TutorialItem[] = [
	{
		title: 'Getting Started',
		description: 'Learn the basics of Flexprice in 5 minutes',
		onClick: () => window.open('https://docs.flexprice.io/guides/getting-started/video', '_blank'),
	},
	{
		title: 'Set Up Pricing Plans',
		description: 'Create and configure your first pricing plan',
		onClick: () => window.open('https://docs.flexprice.io/guides/plan/pricing-plan-create', '_blank'),
	},
	{
		title: 'Define Usage Metering',
		description: 'Set up billable metrics to track customer usage',
		onClick: () => window.open('https://docs.flexprice.io/guides/billable-metric/billable-metrics-create', '_blank'),
	},
	{
		title: 'Configure Credits & Wallets',
		description: 'Manage prepaid wallets, free credits, and top-ups',
		onClick: () => window.open('https://docs.flexprice.io/guides/wallet/customers-wallet', '_blank'),
	},
	{
		title: 'Customer Management',
		description: 'Create customers, assign plans, and manage subscriptions',
		onClick: () => window.open('https://docs.flexprice.io/guides/subscription/customers-create-subscription', '_blank'),
	},
	{
		title: 'Self-Hosting & Configuration',
		description: 'Set up and deploy Flexprice on your own infrastructure',
		onClick: () => window.open('https://docs.flexprice.io/guides/self-hosted/guide', '_blank'),
	},
];

const ONBOARDING_STORAGE_KEY = 'flexprice_onboarding_completed_v1';

const OnboardingPage = () => {
	const [showVideoModal, setShowVideoModal] = useState(() => {
		// Check if onboarding has been completed
		try {
			const onboardingCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);
			return onboardingCompleted !== 'true';
		} catch (error) {
			console.error('Error accessing localStorage:', error);
			return true; // Show modal if localStorage is unavailable
		}
	});

	const handleCloseModal = () => {
		try {
			// Mark onboarding as completed
			localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
			setShowVideoModal(false);
		} catch (error) {
			console.error('Error setting localStorage:', error);
		}
	};
	return (
		<>
			{showVideoModal && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70'>
					<div className='relative w-full max-w-4xl aspect-video'>
						<button onClick={handleCloseModal} className='absolute -top-10 right-0 text-white hover:text-gray-300 z-60'>
							<X className='w-6 h-6' />
						</button>
						<iframe
							src='https://www.loom.com/embed/60d8308781254fe0bc5be341501f9fd5?sid=c034e9a8-e243-4def-ab50-976f08d56cee&amp;hideEmbedTopBar=true&amp;hide_title=true&amp;hide_owner=true&amp;hide_speed=true&amp;hide_share=true&amp;autoplay=true'
							allowFullScreen
							className='w-full h-full'
							allow='autoplay'></iframe>
					</div>
				</div>
			)}
			<Page>
				{/* Top Containers */}
				<ApiDocsContent tags={['Events']} />
				<div className='w-full flex gap-6 mb-16'>
					{/* Welcome Container */}
					<div className='flex-1 w-[70%] flex-grow rounded-[20px] bg-[#dde1eb] p-8'>
						<div className='flex w-full items-start justify-between'>
							<div className='w-[60%]'>
								<h1 className='text-xl font-semibold tracking-tight mb-2'>Welcome to Flexprice!</h1>
								<p className='text-slate-800 text-sm mb-6'>Let's get your pricing and billing started!</p>
								<div className='flex gap-4'>
									<Button
										onClick={() => {
											window.open('https://calendly.com/flexprice-30mins-chat/manish', '_blank');
										}}>
										Book a Demo
									</Button>
								</div>
							</div>
							<div className='flex-shrink-0 ml-8 w-[40%]'>
								<img src='/assets/svg/onboarding_hero.svg' alt='Onboarding Hero' className='h-auto' />
							</div>
						</div>
					</div>
					{/* Learn More Container */}
					<div className='flex-1 max-w-[35%] bg-[#0B1121] rounded-[20px] relative overflow-hidden'>
						<iframe
							src='https://www.loom.com/embed/60d8308781254fe0bc5be341501f9fd5?sid=c034e9a8-e243-4def-ab50-976f08d56cee&amp;hideEmbedTopBar=true&amp;hide_title=true&amp;hide_owner=true&amp;hide_speed=true&amp;hide_share=true'
							allowFullScreen
							style={{ position: 'absolute', width: '100%', top: 0, left: 0, height: '100%' }}></iframe>
					</div>
				</div>
				{/* Quick Start Section */}
				<div className='w-full'>
					<h2 className='text-2xl font-semibold text-slate-900 mb-6'>Quick Start</h2>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
						{tutorials.map((tutorial, index) => (
							<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} key={index}>
								<Card
									className='h-full group bg-white border border-slate-100 rounded-lg p-6 shadow-sm hover:border-blue-100 hover:bg-slate-50 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-blue-500/5'
									onClick={tutorial.onClick}>
									<div className='flex gap-4'>
										<div className='flex-shrink-0 mt-1'>
											<AlignJustify className='w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors duration-200' />
										</div>

										<div className='flex-1 min-w-0'>
											<h3 className='text-slate-800 text-base font-medium mb-2 group-hover:text-blue-600 transition-colors duration-200'>
												{tutorial.title}
											</h3>
											<p className='text-slate-500 text-sm leading-relaxed'>{tutorial.description}</p>

											<div className='flex items-center gap-1 mt-4 text-slate-400 group-hover:text-blue-500 transition-all duration-200'>
												<span className='text-xs font-medium'>Learn more</span>
												<ArrowRight className='w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200' />
											</div>
										</div>
									</div>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</Page>
		</>
	);
};

export default OnboardingPage;
