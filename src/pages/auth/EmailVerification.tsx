import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/atoms';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import supabase from '@/core/services/supbase/config';
import { SupabaseClient } from '@supabase/supabase-js';

const EmailVerification = () => {
	const navigate = useNavigate();
	const location = useLocation();

	// Get email and signup status from URL parameters
	const searchParams = new URLSearchParams(location.search);
	const email = searchParams.get('email') || '';
	const isNewSignup = searchParams.get('new') === 'true';

	// State to track if resend was successful

	// Mutation for resending verification email
	const { mutate: resendVerification, isPending } = useMutation({
		mutationFn: async () => {
			const { error } = await (supabase as SupabaseClient).auth.resend({
				email: email,
				type: 'signup',
			});
			if (error) {
				throw new Error(error.message);
			}
		},
		onSuccess: () => {
			toast.success('Verification email has been resent. Please check your inbox.');
		},
		onError: (error: ServerError) => {
			const errorMessage = error?.error.message || 'Failed to resend verification email';
			toast.error(errorMessage);
		},
	});

	const handleResend = () => {
		if (!email) {
			toast.error('Email address is missing');
			return;
		}
		resendVerification();
	};

	const handleGoToLogin = () => {
		navigate('/auth');
	};

	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4'>
			<div className='w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg'>
				{/* Email Verification Content */}
				<div className='text-center'>
					<div className='mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50'>
						{/* Logo */}
						<div className='flex justify-center'>
							<img src='/ic_rounded_flexprice.svg' alt='Flexprice Logo' className='h-12' />
						</div>
					</div>

					<h2 className='text-2xl font-bold text-gray-900 mb-4'>{isNewSignup ? 'Verify your email address' : 'Email verification'}</h2>

					<div className='space-y-4'>
						<p className='text-gray-600'>We've sent a verification email to:</p>
						<p className='font-medium text-gray-800 break-all'>{email}</p>
						<p className='text-gray-600 text-sm'>
							Click the link in the email to verify your account and complete your registration. If you don't see the email, check your spam
							folder.
						</p>
					</div>
				</div>

				{/* Action Buttons */}
				<div className='mt-8 space-y-6!'>
					<Button onClick={handleResend} className='w-full' isLoading={isPending}>
						Resend verification email
					</Button>
					<div className='h-4' />
					<Button onClick={handleGoToLogin} variant='outline' className='w-full'>
						Back to login
					</Button>
				</div>

				{/* Help Text */}
				<p className='mt-4 text-center text-sm text-gray-500'>
					Need help? Contact{' '}
					<a href='mailto:support@flexprice.com' className='font-medium text-blue-600 hover:text-blue-500'>
						support@flexprice.com
					</a>
				</p>
			</div>
		</div>
	);
};

export default EmailVerification;
