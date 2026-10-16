import { afterEach, describe, expect, it, vi } from 'vitest';
import EnvironmentApi from '@/api/EnvironmentApi';
import { DatasetDefinition } from '@/types/dto/Reports';
import { datasetRunOptions, reportRunOptions } from './useReports';

describe('report query keys', () => {
	afterEach(() => vi.restoreAllMocks());

	it('differ per environment', () => {
		const env = vi.spyOn(EnvironmentApi, 'getActiveEnvironmentId').mockReturnValue('env_a');
		const req = { shape: 'scalar' as const, range: '2026-09-01..2026-10-01' };
		const def = {
			family: 'dataset',
			dataset: 'invoices',
			measures: [],
			time: { field: 'period_start', range: '2026-09-01..2026-10-01' },
		} as unknown as DatasetDefinition;
		const a = [reportRunOptions('invoice_total', req).queryKey, datasetRunOptions(def).queryKey];
		env.mockReturnValue('env_b');
		const b = [reportRunOptions('invoice_total', req).queryKey, datasetRunOptions(def).queryKey];
		expect(a[0]).not.toEqual(b[0]);
		expect(a[1]).not.toEqual(b[1]);
	});
});
