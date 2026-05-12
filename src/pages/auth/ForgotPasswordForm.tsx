import React, { useState } from 'react';
import { Button, Input } from '@/components/atoms';
import toast from 'react-hot-toast';
import supabase from '@/core/services/supbase/config';
import { useMutation } from '@tanstack/react-query';
import { AuthTab } from './authTabs';
import { useTranslation } from 'react-i18next';

interface ForgotPasswordFormProps {
	switchTab: (tab: AuthTab) => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ switchTab }) => {
	const { t } = useTranslation('auth');
	const [email, setEmail] = useState('');

	// Use React Query for forgot password mutation
	const forgotPasswordMutation = useMutation({
		mutationFn: async (emailToReset: string): Promise<any> => {
			const redirectTo = `${window.location.origin}/auth?tab=${AuthTab.RESET_PASSWORD}`;
			const { error } = await supabase.auth.resetPasswordForEmail(emailToReset.trim(), {
				redirectTo,
			});

			if (error) {
				throw error;
			}

			return true;
		},
		onSuccess: () => {
			toast.success('Password reset link sent to your email');
		},
		onError: (error: unknown) => {
			const message =
				error && typeof error === 'object' && 'message' in error
					? String((error as Error).message)
					: ((error as ServerError)?.error?.message ?? 'An unexpected error occurred');
			toast.error(message);
		},
	});

	const handleForgotPassword = () => {
		if (!email) {
			toast.error('Please enter your email address');
			return;
		}

		forgotPasswordMutation.mutate(email);
	};

	return (
		<>
			<form className='space-y-4' onSubmit={(e) => e.preventDefault()}>
				<div>
					<label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-1'>
						{t('fields.email')}
					</label>
					<Input
						id='email'
						name='email'
						type='email'
						placeholder={t('fields.emailPlaceholder')}
						required
						onChange={(s) => setEmail(s)}
						value={email}
					/>
				</div>
				<Button type='button' onClick={handleForgotPassword} className='w-full !mt-6 h-11' isLoading={forgotPasswordMutation.isPending}>
					{t('buttons.sendResetLink')}
				</Button>
			</form>

			<p className='mt-6 text-center text-sm text-gray-600'>
				{t('rememberPassword')}{' '}
				<button onClick={() => switchTab(AuthTab.LOGIN)} className='text-grey-600 underline font-medium'>
					{t('links.backToLogin')}
				</button>
			</p>
		</>
	);
};

export default ForgotPasswordForm;
