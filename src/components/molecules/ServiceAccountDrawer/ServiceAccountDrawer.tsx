import { FC, useEffect, useState, useMemo } from 'react';
import { Sheet, Button, Checkbox, Dialog, Input } from '@/components/atoms';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserApi } from '@/api/UserApi';
import RbacApi, { RbacRole } from '@/api/RbacApi';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Info } from 'lucide-react';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { useTranslation } from 'react-i18next';
import { User } from '@/models';

interface Props {
	isOpen: boolean;
	onOpenChange: (value: boolean) => void;
	/** When provided, the drawer is in edit mode */
	data?: User | null;
}

const ServiceAccountDrawer: FC<Props> = ({ isOpen, onOpenChange, data }) => {
	const { t } = useTranslation(['developers', 'common']);
	const isEditMode = !!data;
	const queryClient = useQueryClient();

	// Shared state
	const [name, setName] = useState('');

	// Create mode state
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

	const {
		data: roles,
		isLoading: isLoadingRoles,
		isError: isRolesError,
	} = useQuery<RbacRole[]>({
		queryKey: ['rbac-roles'],
		queryFn: () => RbacApi.getAllRoles(),
		enabled: isOpen && !isEditMode,
		retry: false,
	});

	const roleOptions = useMemo(() => {
		if (!roles || !Array.isArray(roles)) return [];
		return roles.map((role) => ({ label: role.name, value: role.id }));
	}, [roles]);

	useEffect(() => {
		if (isOpen) {
			if (isEditMode && data) {
				setName(data.name || '');
			} else {
				setName('');
				setSelectedRoles([]);
			}
		}
	}, [isOpen, data, isEditMode]);

	const isSuperAdminSelected = selectedRoles.includes('super_admin');

	const toggleRole = (roleValue: string) => {
		setSelectedRoles((prev) => {
			if (prev.includes(roleValue)) {
				return prev.filter((r) => r !== roleValue);
			}
			// Selecting super_admin clears all other roles
			if (roleValue === 'super_admin') {
				return ['super_admin'];
			}
			return [...prev, roleValue];
		});
	};

	// --- Create mutation ---
	const { mutate: createServiceAccount, isPending: isCreating } = useMutation({
		mutationFn: async () =>
			UserApi.createServiceAccount({ type: 'service_account' as const, roles: selectedRoles, name: name.trim() || undefined }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['service-accounts'] });
			refetchQueries(['secret-keys']);
			toast.success(t('developers:serviceAccountDrawer.createSuccess'));
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('developers:serviceAccountDrawer.createFailed'));
		},
	});

	// --- Update mutation ---
	const { mutate: updateServiceAccount, isPending: isUpdating } = useMutation({
		mutationFn: async () => UserApi.updateServiceAccount(data!.id, { name: name.trim() || undefined }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['service-accounts'] });
			toast.success(t('developers:serviceAccountDrawer.updateSuccess'));
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('developers:serviceAccountDrawer.updateFailed'));
		},
	});

	const isCreateFormValid = selectedRoles.length > 0;
	const isPending = isCreating || isUpdating;

	// --- Edit mode: centered dialog ---
	if (isEditMode) {
		return (
			<Dialog
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				title={t('developers:serviceAccountDrawer.editTitle')}
				description={t('developers:serviceAccountDrawer.editDescription')}>
				<div className='flex flex-col gap-6'>
					<Input
						label={t('developers:labels.name')}
						placeholder={t('developers:serviceAccountDrawer.namePlaceholder')}
						value={name}
						onChange={setName}
					/>
					<Button isLoading={isPending} disabled={isPending || !name.trim()} onClick={() => updateServiceAccount()}>
						{t('developers:serviceAccountDrawer.saveButton')}
					</Button>
				</div>
			</Dialog>
		);
	}

	// --- Create mode: side sheet ---
	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('developers:serviceAccountDrawer.title')}
			description={t('developers:serviceAccountDrawer.description')}>
			<div className='flex flex-col gap-5 mt-2'>
				<div className='bg-info-muted border border-info-line rounded-md p-3'>
					<div className='flex items-start gap-2'>
						<Info className='w-4 h-4 text-info shrink-0 mt-0.5' />
						<div className='text-sm text-info-deep'>
							<p className='font-medium mb-1'>{t('developers:serviceAccountDrawer.intro.title')}</p>
							<p>{t('developers:serviceAccountDrawer.intro.body')}</p>
						</div>
					</div>
				</div>

				<Input
					label={t('developers:labels.name')}
					placeholder={t('developers:serviceAccountDrawer.namePlaceholder')}
					value={name}
					onChange={setName}
				/>

				{isRolesError ? (
					<div className='bg-warning-muted border border-warning-line rounded-md p-3'>
						<div className='flex items-start gap-2'>
							<AlertTriangle className='w-4 h-4 text-warning-bright shrink-0 mt-0.5' />
							<div className='text-sm text-warning-deep'>
								<p className='font-medium mb-1'>{t('developers:serviceAccountDrawer.rolesUnavailable.title')}</p>
								<p>{t('developers:serviceAccountDrawer.rolesUnavailable.body')}</p>
							</div>
						</div>
					</div>
				) : (
					<div className='flex flex-col gap-2'>
						<label className='block text-sm font-medium text-content-secondary'>
							{t('developers:labels.roleRequiredHint')} <span className='text-danger-bright'>*</span>
						</label>
						<p className='text-sm text-content-muted'>{t('developers:serviceAccountDrawer.rolesHint')}</p>
						<div className='border rounded-md p-4 flex flex-col gap-3 bg-surface'>
							{isLoadingRoles ? (
								<p className='text-sm text-content-muted'>{t('developers:serviceAccountDrawer.loadingRoles')}</p>
							) : roleOptions.length === 0 ? (
								<p className='text-sm text-content-muted'>{t('developers:serviceAccountDrawer.noRolesAvailable')}</p>
							) : (
								roleOptions.map((role) => {
									const isDisabled = isSuperAdminSelected && role.value !== 'super_admin';
									return (
										<div key={role.value} className={`flex items-center space-x-2 ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
											<Checkbox
												id={`role-${role.value}`}
												checked={selectedRoles.includes(role.value)}
												onCheckedChange={() => toggleRole(role.value)}
											/>
											<label
												htmlFor={`role-${role.value}`}
												className={`text-sm font-medium leading-none ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
												{role.label}
											</label>
										</div>
									);
								})
							)}
						</div>
					</div>
				)}

				{selectedRoles.length > 0 && (
					<div className='flex flex-col gap-1.5'>
						<label className='block text-sm font-medium text-content-secondary'>{t('developers:labels.selectedRoles')}</label>
						<div className='flex flex-wrap gap-1'>
							{selectedRoles.map((role) => (
								<span
									key={role}
									className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-info-muted-strong text-info-deep'>
									{roleOptions.find((r) => r.value === role)?.label || role}
								</span>
							))}
						</div>
					</div>
				)}

				<Button isLoading={isPending} disabled={!isCreateFormValid || isRolesError} onClick={() => createServiceAccount()}>
					{t('developers:serviceAccountDrawer.submit')}
				</Button>
			</div>
		</Sheet>
	);
};

export default ServiceAccountDrawer;
