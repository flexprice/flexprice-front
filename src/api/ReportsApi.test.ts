import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/core/axios/verbs', () => ({
	AxiosClient: { get: vi.fn(), post: vi.fn() },
}));

import { AxiosClient } from '@/core/axios/verbs';
import ReportsApi from './ReportsApi';

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
		expect(catalog.items.length).toBe(11);
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
});
