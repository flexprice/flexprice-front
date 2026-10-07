import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { UserApi } from '@/api/UserApi';
import { User } from '@/models/User';
import UpdateTenantDrawer from './UpdateTenantDrawer';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/api/UserApi', () => ({ UserApi: { updateUser: vi.fn().mockResolvedValue({}) } }));
vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({ refetchQueries: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const address = {
	address_line1: '456 Market Street',
	address_line2: 'Floor 3',
	address_city: 'San Francisco',
	address_state: 'California',
	address_postal_code: '94105',
	address_country: 'US',
};

const user: User = {
	id: 'user_1',
	email: 'admin@acme.com',
	tenant: {
		id: 'tenant_1',
		name: 'Acme',
		billing_details: { address, email: 'billing@acme.com', help_email: 'help@acme.com', phone: '+1-555-987-6543' },
		status: 'published',
		created_at: '',
		updated_at: '',
	},
};

describe('UpdateTenantDrawer', () => {
	it('saves the edited billing email with the stored billing details', async () => {
		render(
			<QueryClientProvider client={new QueryClient()}>
				<UpdateTenantDrawer data={user} open onOpenChange={vi.fn()} />
			</QueryClientProvider>,
		);

		fireEvent.change(screen.getByDisplayValue('billing@acme.com'), { target: { value: 'finance@acme.com' } });
		fireEvent.click(screen.getByRole('button', { name: 'tenant.drawer.saveChanges' }));

		await waitFor(() =>
			expect(UserApi.updateUser).toHaveBeenCalledWith({
				name: 'Acme',
				billing_details: { address, email: 'finance@acme.com', help_email: 'help@acme.com', phone: '+1-555-987-6543' },
			}),
		);
	});
});
