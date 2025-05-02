import { useEffect, useState } from 'react';
import loadingQuotes from '@/constants/loading_quotes';

// Helper function to get random quote
const getRandomQuote = () => {
	const randomIndex = Math.floor(Math.random() * loadingQuotes.length);
	return loadingQuotes[randomIndex];
};

const Loader = () => {
	const [quote, setQuote] = useState(getRandomQuote()); // Start with a random quote
	const [fadeOut, setFadeOut] = useState(false);

	useEffect(() => {
		// Change quote every 4 seconds with fade effect
		const interval = setInterval(() => {
			setFadeOut(true);

			// Wait for fade out, then change quote
			setTimeout(() => {
				setQuote(getRandomQuote());
				setFadeOut(false);
			}, 300); // Half of the transition duration
		}, 4000); // Increased duration for better readability

		return () => clearInterval(interval);
	}, []);

	return (
		<div className='w-full h-full flex items-center justify-center bg-white/80 z-50'>
			<div className='flex flex-col items-center gap-4 max-w-md text-center px-4'>
				{/* <Spinner size={50} className='text-primary' /> */}
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
				<p
					className={`
						text-sm text-gray-600 
						transition-all duration-600 ease-in-out
						${fadeOut ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'}
					`}>
					{quote}
				</p>
			</div>
		</div>
	);
};

export default Loader;

export const PageLoader = () => {
	return (
		<div className='h-screen w-full flex items-center justify-center'>
			<Loader />
		</div>
	);
};
