import React, { useEffect, useState } from 'react';
import { Button, Input } from '@/components/atoms';
import toast from 'react-hot-toast';
import supabase from '@/core/services/supbase/config';
import AuthApi from '@/api/AuthApi';
import { useMutation } from '@tanstack/react-query';
import { EyeOff } from 'lucide-react';
import { EyeIcon } from 'lucide-react';
import { RouteNames } from '@/core/routes/Routes';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NODE_ENV, NodeEnv } from '@/types/env';
import EnvironmentApi from '@/api/EnvironmentApi';
interface SignupFormProps {
	switchTab: (tab: string) => void;
}

interface SignupData {
	email: string;
	password: string;
	confirmPassword: string;
}

const SignupForm: React.FC<SignupFormProps> = ({ switchTab }) => {
	const navigate = useNavigate();

	const [searchParams] = useSearchParams();
	const queryEmail = searchParams.get('email') || '';

	const [signupData, setSignupData] = useState<SignupData>({
		email: queryEmail,
		password: '',
		confirmPassword: '',
	});

	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (queryEmail) {
			setSignupData({ ...signupData, email: queryEmail });
		}
	}, [queryEmail]);

	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState<Partial<SignupData>>({});

	// Use React Query for signup mutation
	const { mutate: signup, isPending: isSignupPending } = useMutation({
		mutationFn: async () => {
			return await AuthApi.signup({
				email: signupData.email,
				password: signupData.password,
			});
		},
		onSuccess: (data) => {
			if (NODE_ENV != NodeEnv.SELF_HOSTED) {
				toast.success('Account created successfully! Please check your email to confirm your account.');
				switchTab('login');
			} else {
				// Store token in a consistent format
				const tokenData = {
					token: data.token,
					user_id: data.user_id,
					tenant_id: data.tenant_id,
				};
				localStorage.setItem('token', JSON.stringify(tokenData));
				EnvironmentApi.initializeEnvironments();
				navigate(RouteNames.home);
			}
		},

		onError: (error: ServerError) => {
			const errorMessage = error.error.message || 'An unexpected error occurred during signup';
			toast.error(errorMessage);
		},
	});

	const validateForm = () => {
		let isValid = true;

		// Email validation
		if (!signupData.email) {
			setErrors({ email: 'Email is required' });
			isValid = false;
		} else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
			setErrors({ ...errors, email: 'Please enter a valid email address' });
			isValid = false;
		}

		// Password validation
		if (!signupData.password) {
			setErrors({ password: 'Password is required' });
			isValid = false;
		} else if (signupData.password.length < 6) {
			setErrors({ ...errors, password: 'Password must be at least 6 characters long' });
			isValid = false;
		}

		// Confirm password validation
		if (!signupData.confirmPassword) {
			setErrors({ ...errors, confirmPassword: 'Please confirm your password' });
			isValid = false;
		} else if (signupData.password !== signupData.confirmPassword) {
			setErrors({ ...errors, confirmPassword: 'Passwords do not match' });
			isValid = false;
		}

		return isValid;
	};

	const handleSignup = async () => {
		// Validate form
		if (!validateForm()) {
			return;
		}
		if (NODE_ENV != NodeEnv.SELF_HOSTED) {
			setIsLoading(true);
			const { error } = await supabase.auth.signUp({
				email: signupData.email,
				password: signupData.password,
				options: {
					emailRedirectTo: `${window.location.origin}${RouteNames.signupConfirmation}`,
				},
			});
			setIsLoading(false);

			if (error) {
				toast.error(error.message || 'Something went wrong');
				return;
			}
			navigate(`/auth/verify-email?email=${encodeURIComponent(signupData.email)}&new=true`);
		} else {
			signup();
		}
	};

	return (
		<>
			<div className='space-y-4'>
				<Input
					id='email'
					name='email'
					type='email'
					label='Email'
					placeholder='Enter your email address'
					required
					onChange={(s) => setSignupData({ ...signupData, email: s })}
					value={signupData.email}
					error={errors.email}
				/>

				<Input
					id='password'
					name='password'
					label='Password'
					placeholder='Enter your password'
					required
					onChange={(s) => setSignupData({ ...signupData, password: s })}
					value={signupData.password}
					error={errors.password}
					type={showPassword ? 'text' : 'password'}
					suffix={
						<span onClick={() => setShowPassword(!showPassword)} className='cursor-pointer'>
							{showPassword ? <EyeIcon className='w-5 h-5' /> : <EyeOff className='w-5 h-5' />}
						</span>
					}
				/>

				<Input
					id='confirmPassword'
					name='confirmPassword'
					label='Confirm Password'
					placeholder='Confirm your password'
					required
					onChange={(s) => setSignupData({ ...signupData, confirmPassword: s })}
					value={signupData.confirmPassword}
					error={errors.confirmPassword}
					type={showPassword ? 'text' : 'password'}
					suffix={
						<span onClick={() => setShowPassword(!showPassword)} className='cursor-pointer'>
							{showPassword ? <EyeIcon className='w-5 h-5' /> : <EyeOff className='w-5 h-5' />}
						</span>
					}
				/>
				<Button onClick={handleSignup} className='w-full !mt-6' isLoading={isSignupPending || isLoading}>
					Create Account
				</Button>
			</div>

			<p className='mt-6 text-center text-sm text-gray-600'>
				Already have an account?{' '}
				<button onClick={() => switchTab('login')} className='text-grey-600 underline font-medium'>
					Log in
				</button>
			</p>
		</>
	);
};

export default SignupForm;
