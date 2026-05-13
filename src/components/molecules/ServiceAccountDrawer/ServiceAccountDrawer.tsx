import { FC, useEffect, useState, useMemo } from 'react';
import { Sheet, Spacer, Button, Checkbox } from '@/components/atoms';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserApi } from '@/api/UserApi';
import RbacApi, { RbacRole } from '@/api/RbacApi';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Info } from 'lucide-react';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';

interface Props {
	isOpen: boolean;
	onOpenChange: (value: boolean) => void;
}

const ServiceAccountDrawer: FC<Props> = ({ isOpen, onOpenChange }) => {
	// Form state
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const queryClient = useQueryClient();

	// Fetch available roles
	const {
		data: roles,
		isLoading: isLoadingRoles,
		isError: isRolesError,
	} = useQuery<RbacRole[]>({
		queryKey: ['rbac-roles'],
		queryFn: () => RbacApi.getAllRoles(),
		enabled: isOpen,
		retry: false,
	});

	// Convert roles to select options
	const roleOptions = useMemo(() => {
		if (!roles || !Array.isArray(roles)) {
			return [];
		}
		return roles.map((role) => ({
			label: role.name,
			value: role.id, // Use role.id as value (e.g., "event_ingestor")
		}));
	}, [roles]);

	// Reset form on open
	useEffect(() => {
		if (isOpen) {
			setSelectedRoles([]);
		}
	}, [isOpen]);

	// Toggle role selection
	const toggleRole = (roleValue: string) => {
		setSelectedRoles((prev) => {
			if (prev.includes(roleValue)) {
				return prev.filter((r) => r !== roleValue);
			} else {
				return [...prev, roleValue];
			}
		});
	};

	// Mutation for creating service account
	const { mutate: createServiceAccount, isPending } = useMutation({
		mutationFn: async () => {
			const payload = {
				type: 'service_account' as const,
				roles: selectedRoles,
			};

			return UserApi.createServiceAccount(payload);
		},
		onSuccess: () => {
			// Invalidate and refetch service accounts to show the new one immediately
			queryClient.invalidateQueries({ queryKey: ['service-accounts'] });
			refetchQueries(['secret-keys']);
			toast.success('Service account created successfully!');
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to create service account. Please try again.');
		},
	});

	// Check if form is valid
	const isFormValid = useMemo(() => {
		// At least one role is required
		return selectedRoles.length > 0;
	}, [selectedRoles]);

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title='Create Service Account'
			description='Create a new service account with specific roles for automated services'>
			<div className='space-y-4'>
				<Spacer className='!h-4' />

				<div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
					<div className='flex items-start gap-2'>
						<Info className='w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5' />
						<div className='text-sm text-blue-800'>
							<p className='font-medium mb-1'>Service Account</p>
							<p>Service accounts are used for automated processes and API integrations. They have fixed roles and permissions.</p>
						</div>
					</div>
				</div>

				{isRolesError ? (
					<div className='bg-amber-50 border border-amber-200 rounded-md p-3'>
						<div className='flex items-start gap-2'>
							<AlertTriangle className='w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5' />
							<div className='text-sm text-amber-800'>
								<p className='font-medium mb-1'>Roles Not Available</p>
								<p>Unable to load available roles. Please contact your administrator.</p>
							</div>
						</div>
					</div>
				) : (
					<div className='space-y-2'>
						<label className='block text-sm font-medium text-gray-700'>
							Roles <span className='text-red-500'>*</span>
						</label>
						<p className='text-sm text-gray-500 mb-2'>Select one or more roles to define the permissions for this service account</p>
						<div className='border rounded-md p-4 space-y-3 bg-white'>
							{isLoadingRoles ? (
								<p className='text-sm text-gray-500'>Loading roles...</p>
							) : roleOptions.length === 0 ? (
								<p className='text-sm text-gray-500'>No roles available</p>
							) : (
								roleOptions.map((role) => (
									<div key={role.value} className='flex items-center space-x-2'>
										<Checkbox
											id={`role-${role.value}`}
											checked={selectedRoles.includes(role.value)}
											onCheckedChange={() => toggleRole(role.value)}
										/>
										<label
											htmlFor={`role-${role.value}`}
											className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'>
											{role.label}
										</label>
									</div>
								))
							)}
						</div>
					</div>
				)}

				{selectedRoles.length > 0 && (
					<div className='space-y-2'>
						<label className='block text-sm font-medium text-gray-700'>Selected Roles</label>
						<div className='flex flex-wrap gap-1'>
							{selectedRoles.map((role) => (
								<span key={role} className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800'>
									{roleOptions.find((r) => r.value === role)?.label || role}
								</span>
							))}
						</div>
					</div>
				)}

				<Spacer className='!h-0' />
				<Button isLoading={isPending} disabled={!isFormValid || isRolesError} onClick={() => createServiceAccount()}>
					Create Service Account
				</Button>
			</div>
		</Sheet>
	);
};

export default ServiceAccountDrawer;
