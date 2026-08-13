import { FC, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button, Dialog, CopyIdButton } from '@/components/atoms';
import RolePicker from '@/components/molecules/RolePicker/RolePicker';
import { UserApi } from '@/api/UserApi';
import { useRbacRoles } from '@/hooks/useRbacRoles';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { settingsQueryKeys } from '@/pages/settings/queryKeys';
import type { HttpRejectedError } from '@/core/axios/types';
import type { UpdateUserRolesErrorDetails } from '@/types/dto/UserApi';
import type { SettingsMember } from '@/pages/settings/team/memberUtils';

interface EditUserRolesDialogProps {
	user: SettingsMember | null;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

function sameRoleSet(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	const setB = new Set(b);
	return a.every((id) => setB.has(id));
}

const EditUserRolesDialog: FC<EditUserRolesDialogProps> = ({ user, isOpen, onOpenChange }) => {
	const { t } = useTranslation(['settings', 'common']);
	const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
	const [activeKeysDetails, setActiveKeysDetails] = useState<UpdateUserRolesErrorDetails | null>(null);
	const [genericError, setGenericError] = useState<string | null>(null);
	const hasEditedRef = useRef(false);
	// State (not a ref) because hasChanges below reads it during render.
	const [initialRoleIds, setInitialRoleIds] = useState<string[] | null>(null);

	const { data: freshUser, isError: isUserError } = useQuery({
		queryKey: ['user-detail', user?.id],
		queryFn: () => UserApi.getUserById(user!.id),
		enabled: isOpen && !!user,
	});

	const displayUser = freshUser ?? user;

	const {
		data: userRoles,
		isLoading: isLoadingRoles,
		isError: isRolesError,
		refetch: refetchRoles,
	} = useRbacRoles('user', { enabled: isOpen });

	useEffect(() => {
		if (!isOpen) {
			setSelectedRoleIds([]);
			hasEditedRef.current = false;
			setInitialRoleIds(null);
			return;
		}
		setActiveKeysDetails(null);
		setGenericError(null);
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen || !displayUser || hasEditedRef.current) return;
		const roles = displayUser.roles ?? [];
		setSelectedRoleIds(roles);
		setInitialRoleIds(roles);
	}, [isOpen, displayUser]);

	const toggleRole = (roleId: string) => {
		hasEditedRef.current = true;
		setSelectedRoleIds((prev) => {
			if (prev.includes(roleId)) return prev.filter((id) => id !== roleId);
			if (roleId === 'super_admin') return ['super_admin'];
			return [...prev, roleId];
		});
	};

	const { mutate: updateRoles, isPending } = useMutation({
		mutationFn: () => {
			if (!user) throw new Error('No user selected');
			return UserApi.updateUserRoles(user.id, selectedRoleIds);
		},
		onSuccess: () => {
			toast.success(t('members.editRoles.success', { email: user?.email }));
			refetchQueries([...settingsQueryKeys.teamMembersRoot()]);
			onOpenChange(false);
		},
		onError: (err: Error) => {
			// The API error envelope has been observed both flat ({details}) and nested
			// under "error" ({error: {details}}, see FailedApiEnvelope) — check both
			// rather than assume one, matching getAddUserErrorMessage's existing pattern.
			const cause = (err as HttpRejectedError).cause as
				| { details?: UpdateUserRolesErrorDetails; error?: { details?: UpdateUserRolesErrorDetails } }
				| undefined;
			const details = cause?.error?.details ?? cause?.details;
			if (details?.active_api_keys) {
				setActiveKeysDetails(details);
				setGenericError(null);
			} else {
				setGenericError(err.message || t('members.editRoles.failedGeneric'));
				setActiveKeysDetails(null);
			}
		},
	});

	const hasChanges = initialRoleIds !== null && !sameRoleSet(selectedRoleIds, initialRoleIds);

	const handleSubmit = () => {
		if (isPending || selectedRoleIds.length === 0 || !hasChanges) return;
		setActiveKeysDetails(null);
		setGenericError(null);
		updateRoles();
	};

	const initials = (displayUser?.name || displayUser?.email || '?').charAt(0).toUpperCase();

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('members.editRoles.title')}
			description={t('members.editRoles.description')}
			titleClassName='text-lg font-semibold text-content-zinc-bold'
			descriptionClassName='text-sm text-content-zinc-muted'
			className='rounded-xl border border-line-subtle shadow-lg sm:max-w-[560px]'>
			<div className='space-y-4'>
				{displayUser && (
					<div className='flex items-center gap-3'>
						<span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-avatar-navy text-sm font-semibold text-content-inverse'>
							{initials}
						</span>
						<div className='flex min-w-0 items-center gap-1.5'>
							<div className='min-w-0'>
								<p className='text-sm font-medium text-content-zinc-bold truncate'>{displayUser.email}</p>
								<p className='text-xs text-content-zinc-muted truncate'>
									{displayUser.type === 'service_account' ? t('members.editRoles.typeServiceAccount') : t('members.editRoles.typeUser')}
									{' · '}
									{displayUser.roles && displayUser.roles.length > 0 ? displayUser.roles.join(', ') : t('members.editRoles.noRoles')}
								</p>
							</div>
							<CopyIdButton id={displayUser.id} entityType='User' className='h-5 w-5 shrink-0' />
						</div>
					</div>
				)}
				{isUserError && (
					<div className='flex items-center gap-2' role='status'>
						<AlertTriangle className='h-3.5 w-3.5 flex-shrink-0 text-warning-bright' />
						<span className='text-xs text-content-zinc-muted'>{t('members.editRoles.userFetchFailed')}</span>
					</div>
				)}

				{activeKeysDetails && (
					<div className='flex items-start gap-2.5 rounded-md border border-danger-line bg-danger-muted px-3 py-2' role='alert'>
						<AlertTriangle className='h-4 w-4 flex-shrink-0 text-danger mt-0.5' />
						<div className='text-sm text-danger-strong'>
							<p className='font-medium mb-1'>
								{t('members.editRoles.activeKeysBody', { count: activeKeysDetails.active_api_key_count ?? 0 })}
							</p>
							<ul className='list-disc pl-4 space-y-0.5'>
								{Object.values(activeKeysDetails.active_api_keys ?? {}).map((env) => (
									<li key={env.env_name}>
										<span className='font-medium'>{env.env_name}:</span> {env.api_keys.map((k) => k.key_name).join(', ')}
									</li>
								))}
							</ul>
						</div>
					</div>
				)}
				{genericError && (
					<div className='flex w-full items-center gap-2.5 rounded-md border border-danger-line bg-danger-muted px-3 py-2' role='alert'>
						<AlertTriangle className='h-4 w-4 flex-shrink-0 text-danger' />
						<span className='text-sm font-medium leading-relaxed text-danger-strong'>{genericError}</span>
					</div>
				)}
				<RolePicker
					title={t('members.addMember.rolesLabel')}
					roles={userRoles ?? []}
					selectedRoleIds={selectedRoleIds}
					onToggle={toggleRole}
					isLoading={isLoadingRoles}
					isError={isRolesError}
					onRetry={() => refetchRoles()}
					error={selectedRoleIds.length === 0 ? t('members.addMember.rolesRequired') : undefined}
					loadingLabel={t('members.addMember.rolesLoading')}
					errorLabel={t('members.addMember.rolesUnavailable')}
					retryLabel={t('members.addMember.rolesRetry')}
					ariaLabel={t('members.addMember.rolesLabel')}
				/>

				<div className='flex justify-end gap-2 border-t border-line pt-4'>
					<Button variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
						{t('common:actions.cancel')}
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={isPending || selectedRoleIds.length === 0 || !hasChanges || isLoadingRoles || isRolesError}
						isLoading={isPending}>
						{t('members.editRoles.submit')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default EditUserRolesDialog;
