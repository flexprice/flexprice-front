import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import supabase from '@/core/services/supbase/config';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/config/branding';

const ResendVerification = () => {
	const [email, setEmail] = useState('');
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation('auth');
	const { logo, name } = useBrand();

	const isNewSignup = location.search.includes('new=true');
	const userEmail = new URLSearchParams(location.search).get('email') || '';

	const [resendSuccess, setResendSuccess] = useState(false);

	const { mutate: resendVerification, isPending } = useMutation({
		mutationFn: async (emailToResend: string) => {
			return await supabase.auth.resend({
				email: emailToResend,
				type: 'signup',
			});
		},
		onSuccess: () => {
			toast.success('Verification email has been resent. Please check your inbox.');
			setResendSuccess(true);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to resend verification email');
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

	if (isNewSignup || resendSuccess) {
		return (
			<div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4'>
				<div className='w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg'>
					<div className='text-center'>
						<div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50'>
							<img src='/assets/svg/query.svg' alt={t('images.emailIconAlt')} className='h-10 w-10' />
						</div>
						<h2 className='mt-6 text-2xl font-bold text-gray-900'>{t('resend.checkEmailHeading')}</h2>
						<p className='mt-2 text-gray-600'>{t('resend.checkEmailDescription', { brandName: name })}</p>
						<p className='mt-1 font-medium text-gray-800'>{resendSuccess ? email : userEmail}</p>
						<p className='mt-4 text-sm text-gray-600'>{t('resend.checkEmailClickLink')}</p>
					</div>

					<div className='mt-6 space-y-4'>
						<Button onClick={handleGoToLogin} className='w-full' variant='outline'>
							{t('buttons.backToLoginCaps')}
						</Button>

						<div className='text-center'>
							<p className='text-sm text-gray-500'>
								{t('resend.didntReceive')}{' '}
								<button onClick={() => setResendSuccess(false)} className='font-medium text-blue-600 hover:text-blue-500'>
									{t('links.tryAgain')}
								</button>
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4'>
			<div className='w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg'>
				<div className='text-center'>
					<div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50'>
						<img src={logo} alt={`${name} Logo`} className='h-10 w-10' />
					</div>
					<h2 className='mt-6 text-2xl font-bold text-gray-900'>{t('resend.resendHeading')}</h2>
					<p className='mt-2 text-gray-600'>{t('resend.resendDescription')}</p>
				</div>

				<div className='mt-6 space-y-4'>
					<Input
						id='email'
						name='email'
						type='email'
						label={t('fields.email')}
						placeholder={t('fields.emailPlaceholder')}
						required
						onChange={(value) => setEmail(value)}
						value={email}
					/>

					<Button onClick={handleResend} className='w-full !mt-6' isLoading={isPending}>
						{t('buttons.resendVerificationCaps')}
					</Button>

					<div className='text-center'>
						<p className='mt-4 text-sm text-gray-600'>
							{t('rememberPassword')}{' '}
							<button onClick={handleGoToLogin} className='font-medium text-blue-600 hover:text-blue-500'>
								{t('links.backToLogin')}
							</button>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ResendVerification;
