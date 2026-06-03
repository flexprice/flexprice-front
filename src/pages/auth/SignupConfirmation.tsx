import supabase from '@/core/services/supbase/config';
import { useUser } from '@/hooks/UserContext';
import AuthApi from '@/api/AuthApi';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { config, AUTH_PROVIDER } from '@/config/config';
import { RouteNames } from '@/core/routes/Routes';

const SignupConfirmation = () => {
	const userContext = useUser();
	const navigate = useNavigate();
	const { t } = useTranslation('auth');
	const isFlexpriceAuth = config.auth.provider === AUTH_PROVIDER.Flexprice;

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

			if (user.data.user?.app_metadata.tenant_id) {
				navigate('/');
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
		if (isFlexpriceAuth) {
			return;
		}
		handleSubmit();
	}, [isFlexpriceAuth]);

	if (isFlexpriceAuth) {
		return <Navigate to={RouteNames.home} replace />;
	}

	return (
		<div>
			<div className='flex flex-col items-center justify-center min-h-screen p-4'>
				{isPending && (
					<div className='text-center'>
						<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4'></div>
						<h2 className='text-xl font-semibold'>{t('signupConfirmation.completingHeading')}</h2>
						<p className='text-gray-600 mt-2'>{t('signupConfirmation.completingDescription')}</p>
					</div>
				)}
				{!isPending && (
					<div className='text-center'>
						<h2 className='text-xl font-semibold'>{t('signupConfirmation.processingHeading')}</h2>
						<p className='text-gray-600 mt-2'>{t('signupConfirmation.processingDescription')}</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default SignupConfirmation;
