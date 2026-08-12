import { FC } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Checkbox, Button } from '@/components/atoms';
import { RbacRole, SUPER_ADMIN_ROLE_ID } from '@/api/RbacApi';

export interface RolePickerProps {
	roles: RbacRole[];
	selectedRoleIds: string[];
	onToggle: (roleId: string) => void;
	isLoading?: boolean;
	isError?: boolean;
	onRetry?: () => void;
	title?: string;
	hint?: string;
	/** Shown as an inline alert below the list, e.g. "Select at least one role" */
	error?: string;
	loadingLabel?: string;
	errorLabel?: string;
	retryLabel?: string;
	emptyLabel?: string;
	ariaLabel?: string;
}

/**
 * Presentational multi-select role picker. Renders whatever roles it's given —
 * no branching on specific role IDs except SUPER_ADMIN_ROLE_ID, which is
 * exclusive with every other role (selecting it clears/disables the rest).
 */
const RolePicker: FC<RolePickerProps> = ({
	roles,
	selectedRoleIds,
	onToggle,
	isLoading,
	isError,
	onRetry,
	title,
	hint,
	error,
	loadingLabel = 'Loading roles...',
	errorLabel = "Couldn't load available roles.",
	retryLabel = 'Retry',
	emptyLabel = 'No roles available.',
	ariaLabel = 'Roles',
}) => {
	const isSuperAdminSelected = selectedRoleIds.includes(SUPER_ADMIN_ROLE_ID);

	return (
		<div className='flex flex-col gap-2'>
			{title && <label className='block text-sm font-medium text-content-secondary'>{title}</label>}
			{hint && <p className='text-sm text-content-muted'>{hint}</p>}

			{isError ? (
				<div className='bg-warning-muted border border-warning-line rounded-md p-3'>
					<div className='flex items-start gap-2'>
						<AlertTriangle className='w-4 h-4 text-warning-bright shrink-0 mt-0.5' />
						<div className='flex-1 text-sm text-warning-deep'>
							<p>{errorLabel}</p>
							{onRetry && (
								<Button variant='outline' size='sm' className='mt-2' onClick={onRetry}>
									{retryLabel}
								</Button>
							)}
						</div>
					</div>
				</div>
			) : (
				<div role='group' aria-label={ariaLabel} className='border rounded-md p-4 flex flex-col gap-3 bg-surface'>
					{isLoading ? (
						<p className='text-sm text-content-muted'>{loadingLabel}</p>
					) : roles.length === 0 ? (
						<p className='text-sm text-content-muted'>{emptyLabel}</p>
					) : (
						roles.map((role) => {
							const isDisabled = isSuperAdminSelected && role.id !== SUPER_ADMIN_ROLE_ID;
							return (
								<Checkbox
									key={role.id}
									id={`role-${role.id}`}
									checked={selectedRoleIds.includes(role.id)}
									onCheckedChange={() => onToggle(role.id)}
									disabled={isDisabled}
									label={role.name}
									description={role.description}
								/>
							);
						})
					)}
				</div>
			)}

			{error && (
				<div className='flex items-center gap-2' role='alert'>
					<AlertTriangle className='h-3.5 w-3.5 flex-shrink-0 text-danger' />
					<span className='text-sm text-danger-strong'>{error}</span>
				</div>
			)}
		</div>
	);
};

export default RolePicker;
