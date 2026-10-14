import { AxiosClient } from '@/core/axios/verbs';
import {
	CustomReport,
	CustomReportDefinition,
	CustomReportListResponse,
	ReportCatalogResponse,
	ReportQueryRequest,
	ReportQueryResult,
} from '@/types/dto/Reports';
import { mockCatalog, mockDeleteCustom, mockListCustom, mockRun, mockSaveCustom } from './fixtures/reports';

export const reportsMockEnabled = (): boolean => import.meta.env.VITE_REPORTS_MOCK === 'true';

class ReportsApi {
	private static baseUrl = '/analytics/reports';
	private static viewsUrl = '/analytics/views';

	public static async listReports(): Promise<ReportCatalogResponse> {
		if (reportsMockEnabled()) return mockCatalog();
		return await AxiosClient.get<ReportCatalogResponse>(this.baseUrl);
	}

	public static async runReport(key: string, req: ReportQueryRequest): Promise<ReportQueryResult> {
		if (reportsMockEnabled()) return mockRun(key, req);
		return await AxiosClient.post<ReportQueryResult>(`${this.baseUrl}/${encodeURIComponent(key)}/query`, req);
	}

	public static async listCustomReports(): Promise<CustomReportListResponse> {
		if (reportsMockEnabled()) return mockListCustom();
		return await AxiosClient.get<CustomReportListResponse>(`${this.viewsUrl}?family=report`);
	}

	public static async createCustomReport(name: string, definition: CustomReportDefinition): Promise<CustomReport> {
		if (reportsMockEnabled()) return mockSaveCustom(undefined, name, definition);
		return await AxiosClient.post<CustomReport>(this.viewsUrl, { name, definition });
	}

	public static async updateCustomReport(id: string, name: string, definition: CustomReportDefinition): Promise<CustomReport> {
		if (reportsMockEnabled()) return mockSaveCustom(id, name, definition);
		return await AxiosClient.put<CustomReport>(`${this.viewsUrl}/${encodeURIComponent(id)}`, { name, definition });
	}

	public static async deleteCustomReport(id: string): Promise<void> {
		if (reportsMockEnabled()) return mockDeleteCustom(id);
		await AxiosClient.delete(`${this.viewsUrl}/${encodeURIComponent(id)}`);
	}
}

export default ReportsApi;
