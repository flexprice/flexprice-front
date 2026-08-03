import supabase from '@/core/services/supbase/config';
import { useUser } from '@/hooks/UserContext';
import AuthApi from '@/api/AuthApi';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { buildSignupMetadata, getPersistedSignupMetadata } from '@/utils/auth/signupMetadata';
import { config } from '@/config/config';

const SignupConfirmation = () => {
	const userContext = useUser();
	const navigate = useNavigate();
	const { t } = useTranslation('auth');
	const signupEnabled = config.platform.signup.enabled;

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			const {
				data: { session },
				error,
			} = await supabase.auth.getSession();
			if (error) {
				toast.error(error.message);
				throw error;
			}

			const user = await supabase.auth.getUser();
			userContext.setUser(user.data.user);

			// Existing Google users land here after OAuth — always allow login through.
			if (user.data.user?.app_metadata.tenant_id) {
				navigate('/');
				return;
			}

			if (!signupEnabled) {
				await supabase.auth.signOut();
				toast.error(t('signupDisabled'));
				navigate('/auth');
				return;
			}

			if (!session) {
				toast.error('No session found');
				navigate('/auth');
				return;
			}

			const signupResponse = await AuthApi.Signup({
				email: user.data.user?.email || '',
				token: session?.access_token || '',
				metadata: getPersistedSignupMetadata() ?? buildSignupMetadata(),
			});
			await supabase.auth.refreshSession();
			return signupResponse;
		},
		onSuccess: async () => {
			await supabase.auth.refreshSession();
			navigate('/');
		},
		onError: async (error: Error) => {
			await supabase.auth.signOut();
			toast.error(error.message || 'Failed to signup');
			navigate('/auth');
		},
	});

	const handleSubmit = async () => {
		await mutate();
	};

	useEffect(() => {
		handleSubmit();
	}, []);

	return (
		<div>
			<div className='flex flex-col items-center justify-center min-h-screen p-4'>
				{isPending && (
					<div className='text-center'>
						<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-content mx-auto mb-4'></div>
						<h2 className='text-xl font-semibold'>{t('signupConfirmation.completingHeading')}</h2>
						<p className='text-content-tertiary mt-2'>{t('signupConfirmation.completingDescription')}</p>
					</div>
				)}
				{!isPending && (
					<div className='text-center'>
						<h2 className='text-xl font-semibold'>{t('signupConfirmation.processingHeading')}</h2>
						<p className='text-content-tertiary mt-2'>{t('signupConfirmation.processingDescription')}</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default SignupConfirmation;
