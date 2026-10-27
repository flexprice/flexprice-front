import { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EyeIcon, EyeOff } from 'lucide-react';
import { Button, Dialog, Input } from '@/components/atoms';
import { UserApi } from '@/api/UserApi';
import { newPasswordError } from '@/utils/auth/newPassword';

interface ChangePasswordDialogProps {
	isOpen: boolean;
	email: string;
	onClose: () => void;
}

/** Lets the signed-in user set a new password (self-hosted). Being signed in is the proof, so the current password is not asked for. */
const ChangePasswordDialog = ({ isOpen, email, onClose }: ChangePasswordDialogProps) => {
	const { t } = useTranslation(['auth', 'settings']);
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);

	const close = () => {
		setPassword('');
		setConfirmPassword('');
		setShowPassword(false);
		onClose();
	};

	const changePassword = useMutation({
		mutationFn: (newPassword: string) => UserApi.changePassword(newPassword),
		onSuccess: () => {
			toast.success(t('changePassword.success'));
			close();
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const handleSubmit = () => {
		const problem = newPasswordError(password, confirmPassword);
		if (problem) {
			toast.error(t(`setPassword.${problem}`));
			return;
		}
		changePassword.mutate(password);
	};

	const visibilityToggle = (
		<button
			type='button'
			onClick={() => setShowPassword(!showPassword)}
			className='cursor-pointer text-content-muted hover:text-content-secondary focus:outline-none'
			aria-label={showPassword ? t('settings:members.credentials.hidePassword') : t('settings:members.credentials.showPassword')}>
			{showPassword ? <EyeOff className='h-5 w-5' /> : <EyeIcon className='h-5 w-5' />}
		</button>
	);

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (!open) close();
			}}
			title={t('changePassword.title')}
			description={t('changePassword.description', { email })}
			className='w-full max-w-[440px] rounded-xl border border-line-subtle shadow-lg'>
			<form
				className='mt-3 space-y-4'
				onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}>
				<Input
					id='change-password-new'
					name='new-password'
					autoComplete='new-password'
					type={showPassword ? 'text' : 'password'}
					label={t('fields.newPassword')}
					placeholder={t('fields.newPasswordPlaceholder')}
					onChange={(s) => setPassword(s)}
					value={password}
					suffix={visibilityToggle}
				/>
				<Input
					id='change-password-confirm'
					name='confirm-password'
					autoComplete='new-password'
					type={showPassword ? 'text' : 'password'}
					label={t('fields.confirmNewPassword')}
					placeholder={t('fields.confirmNewPasswordPlaceholder')}
					onChange={(s) => setConfirmPassword(s)}
					value={confirmPassword}
				/>
				<div className='flex justify-end'>
					<Button type='submit' isLoading={changePassword.isPending}>
						{t('changePassword.submit')}
					</Button>
				</div>
			</form>
		</Dialog>
	);
};

export default ChangePasswordDialog;
