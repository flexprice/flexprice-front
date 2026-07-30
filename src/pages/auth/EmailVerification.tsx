import { useNavigate, useLocation } from 'react-router';
import { Button } from '@/components/atoms';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import supabase from '@/core/services/supbase/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/config/branding';
import { config } from '@/config/config';

const EmailVerification = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation('auth');
	const { logo, name } = useBrand();

	const searchParams = new URLSearchParams(location.search);
	const email = searchParams.get('email') || '';
	const isNewSignup = searchParams.get('new') === 'true';

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
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to resend verification email');
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
		<div
			className='fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto p-4'
			style={{
				backgroundImage: `url('/assets/onboarding.png')`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
			}}>
			<div className='absolute inset-0 bg-white/30' aria-hidden />
			<div className='relative w-full max-w-[480px] rounded-2xl bg-white p-8 shadow-lg'>
				<div className='mb-6 flex justify-center'>
					<img src={logo} alt={name} className='h-12' />
				</div>

				<h2 className='text-center text-2xl font-semibold text-zinc-900'>
					{isNewSignup ? t('verification.verifyHeading') : t('verification.verificationHeading')}
				</h2>

				<div className='mt-4 space-y-3 text-center'>
					<p className='text-sm text-zinc-600'>{t('verification.sentTo')}</p>
					<p className='break-all text-sm font-medium text-zinc-900'>{email}</p>
					<p className='text-sm text-zinc-500'>{t('verification.clickLink')}</p>
				</div>

				<div className='mt-8 flex flex-col gap-4'>
					<Button onClick={handleResend} className='h-10 w-full rounded-lg' isLoading={isPending}>
						{t('buttons.resendVerification')}
					</Button>
					<Button onClick={handleGoToLogin} variant='outline' className='h-10 w-full rounded-lg'>
						{t('buttons.backToLogin')}
					</Button>
				</div>

				<p className='mt-5 text-center text-sm text-zinc-500'>
					{t('verification.needHelp')}{' '}
					<a href={`mailto:${config.brand.supportEmail}`} className='font-medium text-blue-600 hover:text-blue-500'>
						{config.brand.supportEmail}
					</a>
				</p>
			</div>
		</div>
	);
};

export default EmailVerification;
