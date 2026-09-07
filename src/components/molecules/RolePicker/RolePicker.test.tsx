import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import RolePicker from './RolePicker';
import { RbacRole } from '@/api/RbacApi';

const roles: RbacRole[] = [
	{ id: 'reader', name: 'Reader', description: 'Read-only access', permissions: { '*': ['read'] } },
	{ id: 'writer', name: 'Writer', description: 'Read and write access', permissions: { '*': ['read', 'write'] } },
	{ id: 'super_admin', name: 'Super Admin', description: 'Full access', permissions: { '*': ['*'] } },
	// Deliberately not reader/writer/super_admin to prove nothing is hardcoded except super_admin.
	{ id: 'billing_admin', name: 'Billing Admin', description: 'Manage billing', permissions: { invoice: ['*'] } },
];

describe('RolePicker', () => {
	it('renders every role passed in, including ones with unrecognized ids', () => {
		render(<RolePicker roles={roles} selectedRoleIds={[]} onToggle={vi.fn()} />);
		expect(screen.getByText('Reader')).toBeInTheDocument();
		expect(screen.getByText('Writer')).toBeInTheDocument();
		expect(screen.getByText('Super Admin')).toBeInTheDocument();
		expect(screen.getByText('Billing Admin')).toBeInTheDocument();
	});

	it('calls onToggle with the role id when a checkbox is clicked', () => {
		const onToggle = vi.fn();
		render(<RolePicker roles={roles} selectedRoleIds={[]} onToggle={onToggle} />);
		fireEvent.click(screen.getByRole('checkbox', { name: 'Writer' }));
		expect(onToggle).toHaveBeenCalledWith('writer');
	});

	it('keeps every checkbox clickable even when super_admin is selected', () => {
		const onToggle = vi.fn();
		render(<RolePicker roles={roles} selectedRoleIds={['super_admin']} onToggle={onToggle} />);
		expect(screen.getByRole('checkbox', { name: 'Reader' })).not.toBeDisabled();
		expect(screen.getByRole('checkbox', { name: 'Writer' })).not.toBeDisabled();
		expect(screen.getByRole('checkbox', { name: 'Billing Admin' })).not.toBeDisabled();
		expect(screen.getByRole('checkbox', { name: 'Super Admin' })).not.toBeDisabled();

		fireEvent.click(screen.getByRole('checkbox', { name: 'Reader' }));
		expect(onToggle).toHaveBeenCalledWith('reader');
	});

	it('allows multiple non-super_admin roles to be selected simultaneously', () => {
		render(<RolePicker roles={roles} selectedRoleIds={['reader', 'billing_admin']} onToggle={vi.fn()} />);
		expect(screen.getByRole('checkbox', { name: 'Reader' })).toBeChecked();
		expect(screen.getByRole('checkbox', { name: 'Billing Admin' })).toBeChecked();
		expect(screen.getByRole('checkbox', { name: 'Writer' })).not.toBeChecked();
	});

	it('shows a loading label while roles are loading', () => {
		render(<RolePicker roles={[]} selectedRoleIds={[]} onToggle={vi.fn()} isLoading loadingLabel='Loading roles...' />);
		expect(screen.getByText('Loading roles...')).toBeInTheDocument();
	});

	it('shows an empty-state message when the role list is empty and not loading/erroring', () => {
		render(<RolePicker roles={[]} selectedRoleIds={[]} onToggle={vi.fn()} emptyLabel='No roles available.' />);
		expect(screen.getByText('No roles available.')).toBeInTheDocument();
	});

	it('shows the error state with a working retry button instead of the checkbox list', () => {
		const onRetry = vi.fn();
		render(
			<RolePicker
				roles={roles}
				selectedRoleIds={[]}
				onToggle={vi.fn()}
				isError
				onRetry={onRetry}
				errorLabel="Couldn't load available roles."
				retryLabel='Retry'
			/>,
		);
		expect(screen.getByText("Couldn't load available roles.")).toBeInTheDocument();
		expect(screen.queryByText('Reader')).not.toBeInTheDocument();
		fireEvent.click(screen.getByText('Retry'));
		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	it('renders the zero-selected warning as an alert when error prop is set', () => {
		render(<RolePicker roles={roles} selectedRoleIds={[]} onToggle={vi.fn()} error='Select at least one role' />);
		expect(screen.getByRole('alert')).toHaveTextContent('Select at least one role');
	});
});
