import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import toast from 'react-hot-toast';
import ActionButton from './ActionButton';
import commonEn from '@/i18n/locales/en/common.json';

// Mock dependencies
vi.mock('react-hot-toast', () => ({
	default: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	refetchQueries: vi.fn(),
}));

// Mock Supabase and auth services
vi.mock('@/core/services/supbase/config', () => ({
	default: {},
}));

vi.mock('@/core/auth/AuthService', () => ({
	default: {},
}));

// Mock useNavigate
const mockNavigate = vi.fn();

let testI18n: I18nInstance;

beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['common'],
		defaultNS: 'common',
		resources: { en: { common: commonEn } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router');
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			mutations: {
				retry: false,
			},
		},
	});

	return (
		<QueryClientProvider client={queryClient}>
			<I18nextProvider i18n={testI18n}>
				<BrowserRouter>{children}</BrowserRouter>
			</I18nextProvider>
		</QueryClientProvider>
	);
};

// Mock delete function
const mockDeleteMutationFn = vi.fn();

const defaultProps = {
	id: 'test-id',
	deleteMutationFn: mockDeleteMutationFn,
	refetchQueryKey: 'test-query',
	entityName: 'Test Entity',
};

describe('ActionButton Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
	});

	describe('Basic Rendering', () => {
		it('should render the trigger button', () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			expect(triggerButton).toBeInTheDocument();
		});

		it('should give the trigger an accessible name by default', () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} />
				</TestWrapper>,
			);

			expect(screen.getByRole('button', { name: 'Row actions' })).toBeInTheDocument();
		});

		it('should use a caller-supplied accessible name when ariaLabel is passed', () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} ariaLabel='Actions for Acme Corp' />
				</TestWrapper>,
			);

			expect(screen.getByRole('button', { name: 'Actions for Acme Corp' })).toBeInTheDocument();
		});

		it('should render with custom trigger icon', () => {
			const customIcon = <span data-testid='custom-icon'>Custom</span>;

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} triggerIcon={customIcon} />
				</TestWrapper>,
			);

			expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
		});
	});

	describe('Dropdown Menu Items', () => {
		it('should render edit action when enabled', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} edit={{ enabled: true, text: 'Edit Item' }} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				expect(screen.getByText('Edit Item')).toBeInTheDocument();
			});
		});

		it('should render archive action when enabled', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} archive={{ enabled: true, text: 'Delete Item' }} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				expect(screen.getByText('Delete Item')).toBeInTheDocument();
			});
		});

		it('should render custom actions', async () => {
			const customActions = [
				{ text: 'Custom Action 1', onClick: vi.fn(), enabled: true },
				{ text: 'Custom Action 2', onClick: vi.fn(), enabled: true },
			];

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} customActions={customActions} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				expect(screen.getByText('Custom Action 1')).toBeInTheDocument();
				expect(screen.getByText('Custom Action 2')).toBeInTheDocument();
			});
		});

		it('should not render disabled actions', async () => {
			render(
				<TestWrapper>
					<ActionButton
						{...defaultProps}
						edit={{ enabled: false, text: 'Edit Item' }}
						archive={{ enabled: false, text: 'Delete Item' }}
						customActions={[{ text: 'Custom Action', onClick: vi.fn(), enabled: false }]}
					/>
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				expect(screen.queryByText('Edit Item')).not.toBeInTheDocument();
				expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
				expect(screen.queryByText('Custom Action')).not.toBeInTheDocument();
			});
		});
	});

	describe('Edit Action', () => {
		it('should call onClick when edit action is clicked', async () => {
			const onEditClick = vi.fn();

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} edit={{ enabled: true, onClick: onEditClick }} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const editButton = screen.getByText('Edit');
				fireEvent.click(editButton);
			});

			expect(onEditClick).toHaveBeenCalledTimes(1);
		});

		it('should navigate when edit path is provided', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} edit={{ enabled: true, path: '/edit/123' }} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const editButton = screen.getByText('Edit');
				fireEvent.click(editButton);
			});

			expect(mockNavigate).toHaveBeenCalledWith('/edit/123');
		});
	});

	describe('Archive/Delete Action', () => {
		it('should open confirmation dialog when archive action is clicked', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} archive={{ enabled: true, text: 'Delete' }} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const deleteButton = screen.getByText('Delete');
				fireEvent.click(deleteButton);
			});

			await waitFor(() => {
				expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
			});
		});

		it('should call delete mutation when confirmed', async () => {
			mockDeleteMutationFn.mockResolvedValue(undefined);

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} archive={{ enabled: true, text: 'Delete' }} />
				</TestWrapper>,
			);

			// Open dropdown and click delete
			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const deleteButton = screen.getByText('Delete');
				fireEvent.click(deleteButton);
			});

			// Confirm in dialog
			await waitFor(() => {
				const confirmButton = screen.getByRole('button', { name: 'Delete' });
				fireEvent.click(confirmButton);
			});

			await waitFor(() => {
				expect(mockDeleteMutationFn).toHaveBeenCalledWith('test-id', expect.any(Object));
			});
		});

		it('should show success toast on successful deletion', async () => {
			mockDeleteMutationFn.mockResolvedValue(undefined);

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} archive={{ enabled: true }} />
				</TestWrapper>,
			);

			// Open dropdown and click the default Archive action
			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				expect(screen.getByText(/archive/i)).toBeInTheDocument();
			});
			fireEvent.click(screen.getByText(/archive/i));

			// Wait for confirmation dialog, then confirm
			await waitFor(() => {
				expect(screen.getByText(/Are you sure you want to/i)).toBeInTheDocument();
			});
			const confirmButtons = screen.getAllByRole('button');
			// last button in dialog is the confirm action
			fireEvent.click(confirmButtons[confirmButtons.length - 1]);

			await waitFor(() => {
				expect(toast.success).toHaveBeenCalledWith('Test Entity archived successfully');
			});
		});

		it('should show error toast on deletion failure', async () => {
			const error = new Error('Delete failed');
			mockDeleteMutationFn.mockRejectedValue(error);

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} archive={{ enabled: true, text: 'Delete' }} />
				</TestWrapper>,
			);

			// Trigger delete flow
			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const deleteButton = screen.getByText('Delete');
				fireEvent.click(deleteButton);
			});

			await waitFor(() => {
				const confirmButton = screen.getByRole('button', { name: 'Delete' });
				fireEvent.click(confirmButton);
			});

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledWith('Delete failed');
			});
		});

		it('should not show toast when disableToast is true', async () => {
			mockDeleteMutationFn.mockResolvedValue(undefined);

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} disableToast={true} archive={{ enabled: true, text: 'Delete' }} />
				</TestWrapper>,
			);

			// Trigger delete flow
			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const deleteButton = screen.getByText('Delete');
				fireEvent.click(deleteButton);
			});

			await waitFor(() => {
				const confirmButton = screen.getByRole('button', { name: 'Delete' });
				fireEvent.click(confirmButton);
			});

			await waitFor(() => {
				expect(toast.success).not.toHaveBeenCalled();
			});
		});
	});

	describe('Custom Actions', () => {
		it('should call onClick when custom action is clicked', async () => {
			const customOnClick = vi.fn();
			const customActions = [{ text: 'Custom Action', onClick: customOnClick, enabled: true }];

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} customActions={customActions} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const customButton = screen.getByText('Custom Action');
				fireEvent.click(customButton);
			});

			expect(customOnClick).toHaveBeenCalledTimes(1);
		});
	});

	describe('Legacy Props Support', () => {
		it('should support legacy edit props', async () => {
			const onEdit = vi.fn();

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} editPath='/edit/123' onEdit={onEdit} editText='Legacy Edit' />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const editButton = screen.getByText('Legacy Edit');
				fireEvent.click(editButton);
			});

			expect(onEdit).toHaveBeenCalledTimes(1);
		});

		it('should support legacy archive props', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} archiveText='Legacy Archive' />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				expect(screen.getByText('Legacy Archive')).toBeInTheDocument();
			});
		});
	});

	describe('Copy ID Action', () => {
		it('should not render Copy ID when copyId prop is omitted', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} edit={{ enabled: true }} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				expect(screen.getByText('Edit')).toBeInTheDocument();
			});
			expect(screen.queryByText('Copy ID')).not.toBeInTheDocument();
		});

		it('should render the generic "Copy ID" label and copy the id when no entityType is given', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} copyId={{}} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const copyIdButton = screen.getByText('Copy ID');
				fireEvent.click(copyIdButton);
			});

			expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-id');
		});

		it('should show an entity-specific toast message when entityType is given', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} copyId={{ entityType: 'Plan' }} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const copyIdButton = screen.getByText('Copy ID');
				fireEvent.click(copyIdButton);
			});

			await waitFor(() => {
				expect(toast.success).toHaveBeenCalledWith('Plan ID copied to clipboard');
			});
		});

		it('should render a custom label when provided', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} copyId={{ label: 'Copy Plan ID' }} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				expect(screen.getByText('Copy Plan ID')).toBeInTheDocument();
			});
		});
	});

	describe('Dialog Behavior', () => {
		it('should close dialog when cancel is clicked', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} archive={{ enabled: true, text: 'Delete' }} />
				</TestWrapper>,
			);

			// Open dialog
			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const deleteButton = screen.getByText('Delete');
				fireEvent.click(deleteButton);
			});

			await waitFor(() => {
				expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
			});

			// Click cancel
			const cancelButton = screen.getByRole('button', { name: 'Cancel' });
			fireEvent.click(cancelButton);

			await waitFor(() => {
				expect(screen.queryByText(/Are you sure you want to delete/i)).not.toBeInTheDocument();
			});
		});
	});
});
