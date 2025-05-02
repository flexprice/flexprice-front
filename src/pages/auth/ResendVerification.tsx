import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import supabase from '@/core/services/supbase/config';

const ResendVerification = () => {
	const [email, setEmail] = useState('');
	const navigate = useNavigate();
	const location = useLocation();

	// Check if user has just signed up (coming from signup page)
	const isNewSignup = location.search.includes('new=true');
	const userEmail = new URLSearchParams(location.search).get('email') || '';

	// Use state to track if resend was successful
	const [resendSuccess, setResendSuccess] = useState(false);

	// Mutation for resending verification email
	const { mutate: resendVerification, isPending } = useMutation({
		mutationFn: async (email: string) => {
			return await supabase.auth.resend({
				email: email,
				type: 'signup',
			});
		},
		onSuccess: () => {
			toast.success('Verification email has been resent. Please check your inbox.');
			setResendSuccess(true);
		},
		onError: (error: ServerError) => {
			const errorMessage = error.error.message || 'Failed to resend verification email';
			toast.error(errorMessage);
		},
	});

	const handleResend = () => {
		if (!email) {
			toast.error('Please enter your email address');
			return;
		}

		resendVerification(email);
	};

	const handleGoToLogin = () => {
		navigate('/auth');
	};

	// New signup variant - showing success message after signup
	if (isNewSignup || resendSuccess) {
		return (
			<div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4'>
				<div className='w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg'>
					<div className='text-center'>
						<div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50'>
							<img src='/assets/svg/query.svg' alt='Email' className='h-10 w-10' />
						</div>
						<h2 className='mt-6 text-2xl font-bold text-gray-900'>Please check your email!</h2>
						<p className='mt-2 text-gray-600'>Thanks for registering for an account on Flexprice! We've sent a confirmation email to:</p>
						<p className='mt-1 font-medium text-gray-800'>{resendSuccess ? email : userEmail}</p>
						<p className='mt-4 text-sm text-gray-600'>
							Click on the link in the email to verify your account. If you don't see it, check your spam folder.
						</p>
					</div>

					<div className='mt-6 space-y-4'>
						<Button onClick={handleGoToLogin} className='w-full' variant='outline'>
							Back to Login
						</Button>

						<div className='text-center'>
							<p className='text-sm text-gray-500'>
								Didn't receive the email? Check your spam folder or{' '}
								<button onClick={() => setResendSuccess(false)} className='font-medium text-blue-600 hover:text-blue-500'>
									try again
								</button>
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Resend verification variant - for users who didn't receive the email
	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4'>
			<div className='w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg'>
				<div className='text-center'>
					<div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50'>
						<img src='/ic_rounded_flexprice.svg' alt='Flexprice Logo' className='h-10 w-10' />
					</div>
					<h2 className='mt-6 text-2xl font-bold text-gray-900'>Resend Verification Email</h2>
					<p className='mt-2 text-gray-600'>Enter your email address and we'll send you a new verification link.</p>
				</div>

				<div className='mt-6 space-y-4'>
					<Input
						id='email'
						name='email'
						type='email'
						label='Email'
						placeholder='Enter your email address'
						required
						onChange={(value) => setEmail(value)}
						value={email}
					/>

					<Button onClick={handleResend} className='w-full !mt-6' isLoading={isPending}>
						Resend Verification Email
					</Button>

					<div className='text-center'>
						<p className='mt-4 text-sm text-gray-600'>
							Remember your password?{' '}
							<button onClick={handleGoToLogin} className='font-medium text-blue-600 hover:text-blue-500'>
								Back to login
							</button>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ResendVerification;
