import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/atoms/Button';
import CustomerPortal from './CustomerPortal';

/**
 * Wrapper component for CustomerPortal that:
 * - Extracts dashboard session token from URL query parameters (required)
 * - Passes the dashboard token to CustomerPortal
 *
 * Handles validation and error cases with proper UI components:
 * - Missing token: shows error card with refresh option
 */

interface ErrorStateProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
}

const ErrorState = ({ icon, title, description, actionLabel, onAction }: ErrorStateProps) => (
	<div className='min-h-screen flex items-center justify-center bg-[#fafafa] px-4 py-12 sm:px-6'>
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: 'easeOut' }}
			className='w-full max-w-lg'>
			<Card className='bg-white border border-[#E9E9E9] rounded-xl shadow-sm'>
				<CardHeader className='text-center pb-6 pt-10 px-8'>
					<div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FEE2E2]/30'>
						<div className='text-zinc-700'>{icon}</div>
					</div>
					<CardTitle className='text-[20px] font-medium text-zinc-950 mb-4 leading-normal'>{title}</CardTitle>
				</CardHeader>
				<CardContent className='text-center px-8 pb-10'>
					<p className='text-base text-zinc-600 mb-8 leading-normal max-w-md mx-auto'>{description}</p>
					{actionLabel && onAction && (
						<Button
							onClick={onAction}
							className='w-full sm:w-auto min-w-[140px] transition-all duration-200 hover:opacity-90'
							variant='outline'>
							<RefreshCw className='w-4 h-4 mr-2' />
							{actionLabel}
						</Button>
					)}
				</CardContent>
			</Card>
		</motion.div>
	</div>
);
const CustomerPortalWrapper = () => {
	const { t } = useTranslation('customer-portal');
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');

	// Validate required token parameter
	if (!token) {
		return (
			<ErrorState
				icon={<Shield className='h-9 w-9 text-zinc-700' />}
				title={t('wrapper.invalidLinkTitle')}
				description={t('wrapper.invalidLinkDescription')}
				actionLabel={t('wrapper.refreshPage')}
				onAction={() => window.location.reload()}
			/>
		);
	}

	// Pass dashboard token to CustomerPortal
	return <CustomerPortal token={token} />;
};

export default CustomerPortalWrapper;
