import supabase from '@/core/services/supbase/config';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { data, useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/UserContext';
import { Button, Input } from '@/components/atoms';
import { EyeIcon, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import AuthApi from '@/api/AuthApi';
import EnvironmentApi from '@/api/EnvironmentApi';
import { NODE_ENV, NodeEnv } from '@/types/env';
import { RouteNames } from '@/core/routes/Routes';

interface LoginFormProps {
	switchTab: (tab: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ switchTab }) => {
	const navigate = useNavigate();
	const userContext = useUser();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	const { mutate: localLogin } = useMutation({
		mutationFn: async () => {
			return await AuthApi.login(email, password);
		},
		onSuccess: (data) => {
			// Store token in a consistent format
			const tokenData = {
				token: data.token,
				user_id: data.user_id,
				tenant_id: data.tenant_id,
			};
			localStorage.setItem('token', JSON.stringify(tokenData));
			EnvironmentApi.initializeEnvironments();
			navigate(RouteNames.home);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Something went wrong. Please try again.');
		},
	});

	const handleLogin = async () => {
		if (!email || !password) {
			toast.error('Please enter both email and password');
			return;
		}

		setLoading(true);

		if (NODE_ENV != NodeEnv.SELF_HOSTED) {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			await EnvironmentApi.initializeEnvironments();

			setLoading(false);

			if (error) {
				toast.error(error.message);
				return;
			}

			userContext.setUser(data);
			navigate('/');
			toast.success('Login successful');
		} else {
			localLogin();
		}
	};

	return (
		<>
			<form className='space-y-5'>
				<Input
					id='email'
					name='email'
					type='email'
					label='Email'
					placeholder='Enter your email address'
					required
					onChange={(s) => setEmail(s)}
					value={email}
				/>

				<div>
					<div className='flex justify-between items-center mb-1'>
						<label htmlFor='password' className='block text-sm font-medium text-gray-700'>
							Password
						</label>
						<button type='button' onClick={() => switchTab('forgot-password')} className='text-sm text-grey-600 hover:underline'>
							Forgot your password?
						</button>
					</div>
					<Input
						id='password'
						name='password'
						type={showPassword ? 'text' : 'password'}
						suffix={
							<span onClick={() => setShowPassword(!showPassword)} className='cursor-pointer'>
								{showPassword ? <EyeIcon className='w-5 h-5' /> : <EyeOff className='w-5 h-5' />}
							</span>
						}
						placeholder='Enter your password'
						required
						onChange={(s) => setPassword(s)}
						value={password}
					/>
				</div>
				<Button onClick={handleLogin} className='w-full !mt-6' isLoading={loading}>
					Login
				</Button>
			</form>

			<p className='mt-6 text-center text-sm text-gray-600'>
				Don't have an account?{' '}
				<button onClick={() => switchTab('signup')} className='text-grey-600 underline font-medium'>
					Sign up
				</button>
			</p>
		</>
	);
};

export default LoginForm;
