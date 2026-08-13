import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import toast from 'react-hot-toast';
import settingsEn from '@/i18n/locales/en/settings.json';
import commonEn from '@/i18n/locales/en/common.json';
import type { SettingsMember } from '@/pages/settings/team/memberUtils';

vi.mock('react-hot-toast', () => ({
	default: { success: vi.fn(), error: vi.fn() },
}));

const mockRefetchQueries = vi.fn();
vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	refetchQueries: (...args: unknown[]) => mockRefetchQueries(...args),
}));

const mockUpdateUserRoles = vi.fn();
const mockGetUserById = vi.fn();
vi.mock('@/api/UserApi', () => ({
	UserApi: {
		updateUserRoles: (...args: unknown[]) => mockUpdateUserRoles(...args),
		getUserById: (...args: unknown[]) => mockGetUserById(...args),
	},
}));

const mockUseRbacRoles = vi.fn();
vi.mock('@/hooks/useRbacRoles', () => ({
	useRbacRoles: (...args: unknown[]) => mockUseRbacRoles(...args),
}));

// Imported after the mocks above so the module picks them up.
import EditUserRolesDialog from './EditUserRolesDialog';

const ROLES = [
	{ id: 'reader', name: 'Reader', description: 'Read-only', permissions: { '*': ['read'] } },
	{ id: 'writer', name: 'Writer', description: 'Read and write', permissions: { '*': ['read', 'write'] } },
	{ id: 'super_admin', name: 'Super Admin', description: 'Full access', permissions: { '*': ['*'] } },
];

const testUser: SettingsMember = {
	id: 'user_target',
	email: 'target@example.com',
	type: 'user',
	roles: ['reader'],
	tenant: {} as SettingsMember['tenant'],
};

let testI18n: I18nInstance;

beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['settings', 'common'],
		defaultNS: 'settings',
		resources: { en: { settings: settingsEn, common: commonEn } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

function renderDialog(props: Partial<React.ComponentProps<typeof EditUserRolesDialog>> = {}) {
	const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
	return render(
		<QueryClientProvider client={queryClient}>
			<I18nextProvider i18n={testI18n}>
				<EditUserRolesDialog user={testUser} isOpen onOpenChange={vi.fn()} {...props} />
			</I18nextProvider>
		</QueryClientProvider>,
	);
}

describe('EditUserRolesDialog', () => {
	beforeEach(() => {
		mockUpdateUserRoles.mockReset();
		mockRefetchQueries.mockReset();
		mockUseRbacRoles.mockReset();
		mockGetUserById.mockReset();
		mockUseRbacRoles.mockReturnValue({ data: ROLES, isLoading: false, isError: false, refetch: vi.fn() });
		mockGetUserById.mockResolvedValue(testUser);
	});

	it("pre-selects the user's current roles when opened", () => {
		renderDialog();
		expect(screen.getByRole('checkbox', { name: 'Reader' })).toBeChecked();
		expect(screen.getByRole('checkbox', { name: 'Writer' })).not.toBeChecked();
	});

	it('disables Save until the selection actually differs from what the user already has', () => {
		renderDialog();
		expect(screen.getByRole('button', { name: 'Save roles' })).toBeDisabled();

		fireEvent.click(screen.getByRole('checkbox', { name: 'Writer' }));
		expect(screen.getByRole('button', { name: 'Save roles' })).not.toBeDisabled();
	});

	it('re-disables Save if the admin toggles back to the original selection', () => {
		renderDialog();
		fireEvent.click(screen.getByRole('checkbox', { name: 'Writer' }));
		expect(screen.getByRole('button', { name: 'Save roles' })).not.toBeDisabled();

		fireEvent.click(screen.getByRole('checkbox', { name: 'Writer' }));
		expect(screen.getByRole('button', { name: 'Save roles' })).toBeDisabled();
	});

	it('fetches fresh user data by ID rather than relying only on the passed-in row', async () => {
		renderDialog();
		await waitFor(() => expect(mockGetUserById).toHaveBeenCalledWith('user_target'));
	});

	it('re-seeds the picker from the freshly-fetched roles when they differ from the stale row prop', async () => {
		mockGetUserById.mockResolvedValue({ ...testUser, roles: ['writer'] });
		renderDialog();

		await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Writer' })).toBeChecked());
		expect(screen.getByRole('checkbox', { name: 'Reader' })).not.toBeChecked();
	});

	it('does not clobber a role the admin already toggled once fresh data arrives', async () => {
		let resolveFetch: (value: SettingsMember) => void = () => {};
		mockGetUserById.mockReturnValue(new Promise((resolve) => (resolveFetch = resolve)));
		renderDialog();

		fireEvent.click(screen.getByRole('checkbox', { name: 'Writer' }));
		expect(screen.getByRole('checkbox', { name: 'Writer' })).toBeChecked();

		resolveFetch({ ...testUser, roles: ['super_admin'] });
		await waitFor(() => expect(mockGetUserById).toHaveBeenCalled());

		expect(screen.getByRole('checkbox', { name: 'Writer' })).toBeChecked();
		expect(screen.getByRole('checkbox', { name: 'Super Admin' })).not.toBeChecked();
	});

	it("shows a compact identity row (email, type + current roles) instead of a separate ID or 'current roles' section", async () => {
		renderDialog();
		expect(await screen.findByText('target@example.com')).toBeInTheDocument();
		expect(screen.getByText('User · reader')).toBeInTheDocument();
		expect(screen.queryByText(/current roles/i)).not.toBeInTheDocument();
	});

	it('submits the updated role selection for the given user', async () => {
		mockUpdateUserRoles.mockResolvedValue({ ...testUser, roles: ['writer'] });
		renderDialog();

		fireEvent.click(screen.getByRole('checkbox', { name: 'Writer' }));
		fireEvent.click(screen.getByRole('checkbox', { name: 'Reader' }));
		fireEvent.click(screen.getByRole('button', { name: 'Save roles' }));

		await waitFor(() => expect(mockUpdateUserRoles).toHaveBeenCalledWith('user_target', ['writer']));
		await waitFor(() => expect(toast.success).toHaveBeenCalled());
		expect(mockRefetchQueries).toHaveBeenCalled();
	});

	it('renders the structured active-API-keys list instead of a generic error', async () => {
		mockUpdateUserRoles.mockRejectedValue(
			Object.assign(new Error('user has active API keys'), {
				cause: {
					message: 'user has active API keys',
					details: {
						active_api_key_count: 1,
						active_api_keys: { env_1: { env_name: 'Production', api_keys: [{ id: 'key_1', key_name: 'prod-key' }] } },
					},
				},
			}),
		);
		renderDialog();

		fireEvent.click(screen.getByRole('checkbox', { name: 'Writer' }));
		fireEvent.click(screen.getByRole('button', { name: 'Save roles' }));

		expect(await screen.findByText(/active API key/)).toBeInTheDocument();
		expect(screen.getByText(/Production/)).toBeInTheDocument();
		expect(screen.getByText(/prod-key/)).toBeInTheDocument();
	});

	it('also finds the active-API-keys details when the error envelope nests them under "error" instead of flat', async () => {
		mockUpdateUserRoles.mockRejectedValue(
			Object.assign(new Error('user has active API keys'), {
				cause: {
					error: {
						message: 'user has active API keys',
						details: {
							active_api_key_count: 1,
							active_api_keys: { env_1: { env_name: 'Production', api_keys: [{ id: 'key_1', key_name: 'prod-key' }] } },
						},
					},
				},
			}),
		);
		renderDialog();

		fireEvent.click(screen.getByRole('checkbox', { name: 'Writer' }));
		fireEvent.click(screen.getByRole('button', { name: 'Save roles' }));

		expect(await screen.findByText(/active API key/)).toBeInTheDocument();
		expect(screen.getByText(/prod-key/)).toBeInTheDocument();
	});

	it('falls back to the raw message for a plain (non-active-keys) error', async () => {
		mockUpdateUserRoles.mockRejectedValue(
			Object.assign(new Error('cannot update your own roles'), { cause: { message: 'cannot update your own roles' } }),
		);
		renderDialog();

		fireEvent.click(screen.getByRole('checkbox', { name: 'Writer' }));
		fireEvent.click(screen.getByRole('button', { name: 'Save roles' }));

		expect(await screen.findByText('cannot update your own roles')).toBeInTheDocument();
	});
});
