import React, { useState, useEffect } from 'react';
import { Button, Input } from '@/components/atoms';
import toast from 'react-hot-toast';
import { EyeIcon, EyeOff, Link2Off } from 'lucide-react';
import supabase from '@/core/services/supbase/config';
import { useMutation } from '@tanstack/react-query';
import { AuthTab } from './authTabs';
import { useTranslation } from 'react-i18next';

interface ResetPasswordFormProps {
	switchTab: (tab: AuthTab) => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ switchTab }) => {
	const { t } = useTranslation('auth');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [sessionReady, setSessionReady] = useState(false);
	const [hasSession, setHasSession] = useState(false);

	useEffect(() => {
		const checkSession = async () => {
			const {
				data: { session },
				error,
			} = await supabase.auth.getSession();
			if (!error && session) {
				setHasSession(true);
			}
			setSessionReady(true);
		};
		checkSession();
	}, []);

	const updatePasswordMutation = useMutation({
		mutationFn: async (newPassword: string): Promise<void> => {
			const { error } = await supabase.auth.updateUser({ password: newPassword });
			if (error) throw error;
		},
		onSuccess: async () => {
			toast.success('Password updated. Please sign in with your new password.');
			await supabase.auth.signOut();
			switchTab(AuthTab.LOGIN);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update password. Please try again.');
		},
	});

	const handleSubmit = () => {
		if (!password.trim()) {
			toast.error('Please enter a new password');
			return;
		}
		if (password !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}
		updatePasswordMutation.mutate(password);
	};

	if (!sessionReady) {
		return (
			<div className='flex flex-col items-center justify-center py-10'>
				<div className='h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[#092E44]' />
				<p className='mt-4 text-sm text-gray-500'>{t('resetLink.checking')}</p>
			</div>
		);
	}

	if (!hasSession) {
		return (
			<>
				<div className='rounded-xl border border-gray-200/80 bg-gray-50/50 p-6 text-center shadow-sm'>
					<div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100'>
						<Link2Off className='h-6 w-6 text-amber-600' aria-hidden />
					</div>
					<h3 className='text-base font-medium text-gray-800'>{t('resetLink.expiredTitle')}</h3>
					<p className='mt-1.5 text-sm text-gray-500'>{t('resetLink.expiredDescription')}</p>
					<Button type='button' onClick={() => switchTab(AuthTab.FORGOT_PASSWORD)} className='mt-5 w-full h-11'>
						{t('buttons.requestNewResetLink')}
					</Button>
				</div>
				<p className='mt-6 text-center text-sm text-gray-600'>
					{t('rememberPassword')}{' '}
					<button onClick={() => switchTab(AuthTab.LOGIN)} className='text-grey-600 underline font-medium hover:no-underline'>
						{t('links.backToLogin')}
					</button>
				</p>
			</>
		);
	}

	return (
		<>
			<form className='space-y-4' onSubmit={(e) => e.preventDefault()}>
				<div>
					<label htmlFor='new-password' className='block text-sm font-medium text-gray-700 mb-1'>
						{t('fields.newPassword')}
					</label>
					<Input
						id='new-password'
						name='new-password'
						type={showPassword ? 'text' : 'password'}
						placeholder={t('fields.newPasswordPlaceholder')}
						required
						onChange={(s) => setPassword(s)}
						value={password}
						suffix={
							<button
								type='button'
								onClick={() => setShowPassword(!showPassword)}
								className='cursor-pointer text-gray-500 hover:text-gray-700 focus:outline-none'
								aria-label={showPassword ? 'Hide password' : 'Show password'}>
								{showPassword ? <EyeOff className='h-5 w-5' /> : <EyeIcon className='h-5 w-5' />}
							</button>
						}
					/>
				</div>
				<div>
					<label htmlFor='confirm-password' className='block text-sm font-medium text-gray-700 mb-1'>
						{t('fields.confirmNewPassword')}
					</label>
					<Input
						id='confirm-password'
						name='confirm-password'
						type={showConfirmPassword ? 'text' : 'password'}
						placeholder={t('fields.confirmNewPasswordPlaceholder')}
						required
						onChange={(s) => setConfirmPassword(s)}
						value={confirmPassword}
						suffix={
							<button
								type='button'
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className='cursor-pointer text-gray-500 hover:text-gray-700 focus:outline-none'
								aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
								{showConfirmPassword ? <EyeOff className='h-5 w-5' /> : <EyeIcon className='h-5 w-5' />}
							</button>
						}
					/>
				</div>
				<Button type='button' onClick={handleSubmit} className='w-full !mt-6 h-11' isLoading={updatePasswordMutation.isPending}>
					{t('buttons.setNewPassword')}
				</Button>
			</form>

			<p className='mt-6 text-center text-sm text-gray-600'>
				{t('rememberPassword')}{' '}
				<button onClick={() => switchTab(AuthTab.LOGIN)} className='text-grey-600 underline font-medium hover:no-underline'>
					{t('links.backToLogin')}
				</button>
			</p>
		</>
	);
};

export default ResetPasswordForm;
