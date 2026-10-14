import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/core/axios/verbs', () => ({
	AxiosClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import { AxiosClient } from '@/core/axios/verbs';
import ReportsApi from './ReportsApi';
import { resetMockCustom } from './fixtures/reports';

describe('ReportsApi', () => {
	beforeEach(() => vi.clearAllMocks());
	afterEach(() => vi.unstubAllEnvs());

	it('calls the backend when mock is off', async () => {
		vi.stubEnv('VITE_REPORTS_MOCK', 'false');
		vi.mocked(AxiosClient.get).mockResolvedValue({ items: [] });
		vi.mocked(AxiosClient.post).mockResolvedValue({ columns: [], rows: [], meta: { query_source: 'billing' } });

		await ReportsApi.listReports();
		await ReportsApi.runReport('invoice_total', { shape: 'scalar', range: '2026-09-01..2026-10-01' });

		expect(AxiosClient.get).toHaveBeenCalledWith('/analytics/reports');
		expect(AxiosClient.post).toHaveBeenCalledWith('/analytics/reports/invoice_total/query', {
			shape: 'scalar',
			range: '2026-09-01..2026-10-01',
		});
	});

	it('serves fixtures when mock is on', async () => {
		vi.stubEnv('VITE_REPORTS_MOCK', 'true');
		const catalog = await ReportsApi.listReports();
		expect(catalog.items.length).toBe(12);
		expect(AxiosClient.get).not.toHaveBeenCalled();

		const res = await ReportsApi.runReport('invoice_total', {
			shape: 'timeseries',
			range: '2026-07-01..2026-10-01',
			grain: 'month',
			compare: 'previous_period',
		});
		expect(res.columns.map((c) => c.name)).toEqual([
			'bucket',
			'currency',
			'invoice_total',
			'invoice_total_prev',
			'invoice_total_change_pct',
		]);
		expect(res.rows.length).toBeGreaterThan(0);
		expect(res.meta.prev_from).toBeDefined();
	});

	it('url-encodes the report key', async () => {
		vi.stubEnv('VITE_REPORTS_MOCK', 'false');
		vi.mocked(AxiosClient.post).mockResolvedValue({ columns: [], rows: [], meta: { query_source: 'billing' } });
		await ReportsApi.runReport('a/b', { shape: 'scalar', range: '2026-09-01..2026-10-01' });
		expect(AxiosClient.post).toHaveBeenCalledWith('/analytics/reports/a%2Fb/query', expect.anything());
	});

	it('mock snapshot report ignores compare', async () => {
		vi.stubEnv('VITE_REPORTS_MOCK', 'true');
		const res = await ReportsApi.runReport('total_receivables', {
			shape: 'scalar',
			range: '2026-09-01..2026-10-01',
			compare: 'previous_period',
		});
		expect(res.columns.map((c) => c.name)).toEqual(['currency', 'total_receivables']);
	});

	it('calls the view endpoints for custom reports', async () => {
		vi.stubEnv('VITE_REPORTS_MOCK', 'false');
		const def = { family: 'report' as const, metrics: ['invoice_total'], shape: 'scalar' as const, time: { range: 'last_30_days' } };
		await ReportsApi.listCustomReports();
		expect(AxiosClient.get).toHaveBeenCalledWith('/analytics/views');
		await ReportsApi.createCustomReport('N', def);
		expect(AxiosClient.post).toHaveBeenCalledWith('/analytics/views', { name: 'N', definition: def });
		await ReportsApi.updateCustomReport('view 1', 'N', def);
		expect(AxiosClient.put).toHaveBeenCalledWith('/analytics/views/view%201', { name: 'N', definition: def });
		await ReportsApi.deleteCustomReport('view_1');
		expect(AxiosClient.delete).toHaveBeenCalledWith('/analytics/views/view_1');
	});

	it('lists report and dataset views only', async () => {
		vi.stubEnv('VITE_REPORTS_MOCK', 'false');
		const mk = (id: string, family: string) => ({ id, definition: { family } });
		vi.mocked(AxiosClient.get).mockResolvedValue({ items: [mk('a', 'report'), mk('b', 'dataset'), mk('c', 'other')] });
		expect((await ReportsApi.listCustomReports()).items.map((r) => r.id)).toEqual(['a', 'b']);
	});

	it('calls dataset endpoints', async () => {
		vi.stubEnv('VITE_REPORTS_MOCK', 'false');
		const definition = {
			family: 'dataset' as const,
			dataset: 'invoices',
			measures: [{ agg: 'count' as const }],
			time: { field: 'created_at', range: 'x' },
		};
		vi.mocked(AxiosClient.get).mockResolvedValue({ items: [] });
		await ReportsApi.listDatasets();
		expect(AxiosClient.get).toHaveBeenCalledWith('/analytics/datasets');
		await ReportsApi.runDataset(definition);
		expect(AxiosClient.post).toHaveBeenCalledWith('/analytics/datasets/query', { definition });
	});

	it('mock datasets return deterministic rows', async () => {
		vi.stubEnv('VITE_REPORTS_MOCK', 'true');
		expect((await ReportsApi.listDatasets()).items.length).toBeGreaterThan(0);
		const res = await ReportsApi.runDataset({
			family: 'dataset',
			dataset: 'invoices',
			measures: [{ agg: 'sum', field: 'total' }],
			time: { field: 'created_at', range: '2026-07-01..2026-10-01', grain: 'month' },
			compare: 'previous_period',
		});
		expect(res.columns.map((c) => c.name)).toEqual(['bucket', 'currency', 'm0', 'm0_prev', 'm0_change_pct']);
		expect(res.meta.measure_labels?.m0).toBe('Sum of Total');
	});

	it('mock custom report ids stay unique after delete', async () => {
		vi.stubEnv('VITE_REPORTS_MOCK', 'true');
		resetMockCustom();
		const def = { family: 'report' as const, metrics: ['invoice_total'], shape: 'scalar' as const, time: { range: 'last_30_days' } };
		const a = await ReportsApi.createCustomReport('A', def);
		const b = await ReportsApi.createCustomReport('B', def);
		await ReportsApi.deleteCustomReport(a.id);
		const c = await ReportsApi.createCustomReport('C', def);
		expect(c.id).not.toBe(b.id);
		expect((await ReportsApi.listCustomReports()).items.map((r) => r.name)).toEqual(['C', 'B']);
		resetMockCustom();
		expect((await ReportsApi.listCustomReports()).items).toEqual([]);
	});
});
