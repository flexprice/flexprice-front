import supabase from '@/core/supbase/config';
import { useUser } from '@/hooks/UserContext';
import AuthApi from '@/utils/api_requests/AuthApi';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import EnvironmentApi from '@/utils/api_requests/EnvironmentApi';

const SignupConfirmation = () => {
	const userContext = useUser();
	const navigate = useNavigate();

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
				await EnvironmentApi.initializeEnvironments();
				navigate('/');
				return;
			}

			if (!session) {
				toast.error('No session found');
				navigate('/auth');
				return;
			}

			const signupResponse = await AuthApi.signup({
				email: user.data.user?.email || '',
				token: session?.access_token || '',
			});
			await supabase.auth.refreshSession();
			await EnvironmentApi.initializeEnvironments();
			return signupResponse;
		},
		onSuccess: async () => {
			await supabase.auth.refreshSession();
			navigate('/');
		},
		onError: async (error: ServerError) => {
			await supabase.auth.signOut();
			toast.error(error.error.message || 'Failed to signup');
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
						<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4'></div>
						<h2 className='text-xl font-semibold'>Completing Authentication...</h2>
						<p className='text-gray-600 mt-2'>Please wait while we set up your account</p>
					</div>
				)}
				§
				{!isPending && (
					<div className='text-center'>
						<h2 className='text-xl font-semibold'>Processing your information...</h2>
						<p className='text-gray-600 mt-2'>You'll be redirected shortly</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default SignupConfirmation;
