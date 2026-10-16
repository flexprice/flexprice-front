import { AxiosClient } from '@/core/axios/verbs';
import { ReportCatalogResponse, ReportQueryRequest, ReportQueryResult } from '@/types/dto/Reports';
import { mockCatalog, mockRun } from './fixtures/reports';

export const reportsMockEnabled = (): boolean => import.meta.env.VITE_REPORTS_MOCK === 'true';

class ReportsApi {
	private static baseUrl = '/analytics/reports';

	public static async listReports(): Promise<ReportCatalogResponse> {
		if (reportsMockEnabled()) return mockCatalog();
		return await AxiosClient.get<ReportCatalogResponse>(this.baseUrl);
	}

	public static async runReport(key: string, req: ReportQueryRequest): Promise<ReportQueryResult> {
		if (reportsMockEnabled()) return mockRun(key, req);
		return await AxiosClient.post<ReportQueryResult>(`${this.baseUrl}/${encodeURIComponent(key)}/query`, req);
	}
}

export default ReportsApi;
