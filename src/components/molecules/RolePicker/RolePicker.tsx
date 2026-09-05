import { FC } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { RbacRole } from '@/api/RbacApi';

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
 * no branching on specific role IDs, no role-specific colors/icons. Every row
 * stays clickable regardless of what else is selected, including Super Admin;
 * `onToggle`'s caller decides what selecting a given role does to the rest.
 * Each role is a full-row clickable card (native <label>-to-<Checkbox>
 * delegation, not just a small inner control).
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
	return (
		<div className='flex flex-col gap-2'>
			{title && <p className='text-sm font-medium text-content-zinc-bold'>{title}</p>}
			{hint && <p className='text-sm text-content-zinc-muted'>{hint}</p>}

			{isError ? (
				<div className='flex items-start gap-2 py-1'>
					<AlertTriangle className='w-4 h-4 text-warning-bright shrink-0 mt-0.5' />
					<div className='flex-1 text-sm text-content-zinc-secondary'>
						<p>{errorLabel}</p>
						{onRetry && (
							<Button variant='outline' size='sm' className='mt-2' onClick={onRetry}>
								{retryLabel}
							</Button>
						)}
					</div>
				</div>
			) : isLoading ? (
				<p className='text-sm text-content-zinc-muted py-1'>{loadingLabel}</p>
			) : roles.length === 0 ? (
				<p className='text-sm text-content-zinc-muted py-1'>{emptyLabel}</p>
			) : (
				<div role='group' aria-label={ariaLabel} className={cn('grid gap-2', roles.length > 5 ? 'sm:grid-cols-2' : 'grid-cols-1')}>
					{roles.map((role) => {
						const isChecked = selectedRoleIds.includes(role.id);
						const inputId = `role-${role.id}`;
						return (
							<label
								key={role.id}
								htmlFor={inputId}
								className={cn(
									'flex items-start gap-2.5 rounded-md border-2 px-3 py-2.5 transition-colors cursor-pointer',
									isChecked ? 'bg-surface-selected border-line-zinc-strong' : 'border-line hover:bg-surface-faint',
								)}>
								<CheckboxPrimitive.Root
									id={inputId}
									checked={isChecked}
									onCheckedChange={() => onToggle(role.id)}
									aria-label={role.name}
									className={cn(
										'mt-0.5 h-4 w-4 shrink-0 rounded-full border shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed',
										isChecked ? 'border-content-zinc-bold bg-content-zinc-bold' : 'border-line-strong bg-transparent',
									)}>
									<CheckboxPrimitive.Indicator className='flex items-center justify-center text-surface'>
										<Check className='h-3 w-3' strokeWidth={3} />
									</CheckboxPrimitive.Indicator>
								</CheckboxPrimitive.Root>
								<div className='min-w-0 flex-1'>
									<p className='text-sm font-medium text-content-zinc-bold'>{role.name}</p>
									{role.description && <p className='text-xs text-content-zinc-muted mt-0.5'>{role.description}</p>}
								</div>
								{isChecked && <Check className='h-4 w-4 shrink-0 text-content-zinc-bold mt-0.5' strokeWidth={2.5} />}
							</label>
						);
					})}
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
