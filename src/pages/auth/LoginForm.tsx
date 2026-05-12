import supabase from '@/core/services/supbase/config';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { data, useNavigate, useSearchParams } from 'react-router';
import { useUser } from '@/hooks/UserContext';
import { Button, Input } from '@/components/atoms';
import { EyeIcon, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import AuthApi from '@/api/AuthApi';
import { NODE_ENV, NodeEnv } from '@/types';
import { RouteNames } from '@/core/routes/Routes';
import GoogleSignin from './GoogleSignin';
import { AuthTab } from './authTabs';

interface LoginFormProps {
	switchTab: (tab: AuthTab) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ switchTab }) => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const userContext = useUser();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	// Prefill from query params (e.g. shared login link); then strip params from URL
	useEffect(() => {
		const emailParam = searchParams.get('email');
		const passwordParam = searchParams.get('password');
		if (!emailParam?.trim() || !passwordParam?.trim()) return;
		try {
			const decodedEmail = decodeURIComponent(emailParam.trim());
			const decodedPassword = decodeURIComponent(passwordParam.trim());
			if (decodedEmail && decodedPassword) {
				setEmail(decodedEmail);
				setPassword(decodedPassword);
				const next = new URLSearchParams(searchParams);
				next.delete('email');
				next.delete('password');
				setSearchParams(next, { replace: true });
			}
		} catch {
			// ignore malformed params
		}
	}, [searchParams, setSearchParams]);

	const { mutate: localLogin } = useMutation({
		mutationFn: async () => {
			return await AuthApi.Login(email, password);
		},
		onSuccess: (data) => {
			// Store token in a consistent format
			const tokenData = {
				token: data.token,
				user_id: data.user_id,
				tenant_id: data.tenant_id,
			};
			localStorage.setItem('token', JSON.stringify(tokenData));
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
						<button type='button' onClick={() => switchTab(AuthTab.FORGOT_PASSWORD)} className='text-sm text-grey-600 hover:underline'>
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
				<Button onClick={handleLogin} className='w-full !mt-6 h-11' isLoading={loading}>
					Login
				</Button>
			</form>

			{/* Google Sign-in Button - Only show on login and signup tabs */}
			{NODE_ENV != NodeEnv.SELF_HOSTED && (
				<>
					<div className='flex items-center justify-center my-6'>
						<div className='flex-1 h-px bg-gray-200'></div>
						<span className='mx-4 text-sm text-gray-500'>or</span>
						<div className='flex-1 h-px bg-gray-200'></div>
					</div>
					<GoogleSignin />
				</>
			)}

			<p className='mt-6 text-center text-sm text-gray-600'>
				Don't have an account?{' '}
				<button onClick={() => switchTab(AuthTab.SIGNUP)} className='text-grey-600 underline font-medium'>
					Sign up
				</button>
			</p>
		</>
	);
};

export default LoginForm;
