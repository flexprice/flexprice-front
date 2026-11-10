import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import ImportFileDrawer from './ImportFileDrawer';
import TaskApi from '@/api/TaskApi';

// The CSVBoxButton renderer receives (launch, isLoading); reproduce the shape
// so we can assert what our component passes it and simulate a completed upload.
const csvBoxSpy = vi.fn();
vi.mock('@csvbox/react', () => ({
	CSVBoxButton: (props: {
		user: string | { user_id: string };
		licenseKey: string;
		onImport: (ok: boolean, meta: Record<string, unknown>) => void;
		render: (launch: () => void, isLoading: boolean) => React.ReactNode;
	}) => {
		csvBoxSpy(props);
		const userId = typeof props.user === 'string' ? props.user : props.user?.user_id;
		return (
			<div>
				<div data-testid='csvbox-user'>{userId}</div>
				{props.render(() => {
					props.onImport(true, {
						import_id: 987654,
						original_filename: 'events.csv',
						raw_file: 'https://example.com/events.csv',
					});
				}, false)}
			</div>
		);
	},
}));

// Radix Select's portal + pointer-event dance doesn't play nicely with jsdom;
// swap in a native <select> that exercises the same onChange contract. Also
// stub Sheet so we don't rely on Radix Dialog focus traps.
vi.mock('@/components/atoms', async () => {
	const actual = await vi.importActual<Record<string, unknown>>('@/components/atoms');
	return {
		...actual,
		Select: ({
			options,
			onChange,
			label,
		}: {
			options: { value: string; label: string }[];
			onChange?: (v: string) => void;
			label?: string;
		}) => (
			<label>
				{label}
				<select data-testid='entity-type' onChange={(e) => onChange?.(e.target.value)}>
					<option value=''>--</option>
					{options.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
			</label>
		),
		Sheet: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) => (isOpen ? <div>{children}</div> : null),
	};
});

vi.mock('@/api/TaskApi', () => ({
	default: {
		addTask: vi.fn().mockResolvedValue({ id: 'task_1' }),
		getTaskById: vi.fn().mockResolvedValue({ id: 'task_1', task_status: 'PENDING' }),
	},
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/core/services/tanstack/queryClient', () => ({ refetchQueries: vi.fn() }));
vi.mock('@/hooks/useUser', () => ({ default: () => ({ user: { tenant: { id: 'tenant-42' } } }) }));
vi.mock('@/hooks/useEnvironment', () => ({
	useEnvironment: () => ({ activeEnvironment: { id: 'env-prod' } }),
}));

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['settings', 'common'],
		defaultNS: 'settings',
		resources: {
			en: {
				settings: {
					common: { labels: { importFile: 'Import File', importFileDescription: 'Import File Description' } },
					import: {
						entityTypes: { events: 'Events', customers: 'Customers', features: 'Features', prices: 'Prices' },
						fileTypes: { csv: 'CSV', json: 'JSON' },
						taskTypes: { import: 'Import', export: 'Export' },
						taskStatus: { successful: 'Successful', failed: 'Failed', queued: 'Queued' },
						validation: { uploadFile: 'upload file', selectEntityType: 'select entity type' },
						toast: { uploadSuccess: '{{filename}} ok', uploadFailed: '{{filename}} fail' },
						errors: {
							notConfigured: 'not configured',
							invalidUploadId: 'invalid upload',
							missingTenantOrEnv: 'waiting for tenant/env',
							downloadFailedHint: 'download failed hint',
						},
						importFileLabel: 'Import file',
						chooseFile: 'Choose File to Upload',
						maxFileSizeHint: 'max file size',
						detailLabels: {},
						rowStats: {},
					},
				},
				common: {
					labels: {
						importFile: 'Import File',
						importFileDescription: 'Description',
						importType: 'Import Type',
						selectImportType: 'Select',
						importData: 'Import Data',
						compareFileFormatting: 'Compare',
						maxFileSizeSubtitle: 'Max size',
						sampleCsv: 'Sample',
						na: 'N/A',
						importDetails: 'Details',
						downloadCsv: 'Download CSV',
						tryAgain: 'Try Again',
					},
					actions: { refresh: 'Refresh', done: 'Done' },
					toast: { genericError: 'Something went wrong' },
				},
			},
		},
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
	<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } })}>
		<I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
	</QueryClientProvider>
);

beforeEach(() => {
	csvBoxSpy.mockClear();
	vi.mocked(TaskApi.addTask).mockClear();
});

describe('ImportFileDrawer csvbox flow', () => {
	it('passes tenant__env as the CSV Box user identifier', async () => {
		render(
			<Wrapper>
				<ImportFileDrawer isOpen={true} onOpenChange={() => {}} />
			</Wrapper>,
		);
		await userEvent.selectOptions(screen.getByTestId('entity-type'), 'EVENTS');

		await waitFor(() => {
			expect(screen.getByTestId('csvbox-user')).toHaveTextContent('tenant-42__env-prod');
		});
	});

	it('POSTs the task with file_provider=csvbox and upload_id (no file_url)', async () => {
		render(
			<Wrapper>
				<ImportFileDrawer isOpen={true} onOpenChange={() => {}} />
			</Wrapper>,
		);
		await userEvent.selectOptions(screen.getByTestId('entity-type'), 'EVENTS');
		const chooseBtn = await screen.findByText('Choose File to Upload');
		await userEvent.click(chooseBtn);

		await waitFor(() => {
			expect(TaskApi.addTask).toHaveBeenCalledTimes(1);
		});
		const payload = vi.mocked(TaskApi.addTask).mock.calls[0][0];
		expect(payload).toMatchObject({
			task_type: 'IMPORT',
			entity_type: 'EVENTS',
			file_type: 'CSV',
			file_provider: 'csvbox',
			upload_id: '987654',
			file_name: 'events.csv',
		});
		expect((payload as { file_url?: string }).file_url).toBeUndefined();
	});
});
