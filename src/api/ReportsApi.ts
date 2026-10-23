import { AxiosClient } from '@/core/axios/verbs';
import {
	CustomReport,
	CustomReportDefinition,
	CustomReportListResponse,
	DatasetCatalogResponse,
	DatasetDefinition,
	ReportCatalogResponse,
	ReportQueryRequest,
	ReportQueryResult,
} from '@/types/dto/Reports';
import { mockCatalog, mockDatasets, mockRunDataset, mockDeleteCustom, mockListCustom, mockRun, mockSaveCustom } from './fixtures/reports';

export const reportsMockEnabled = (): boolean => import.meta.env.VITE_REPORTS_MOCK === 'true';

class ReportsApi {
	private static baseUrl = '/analytics/reports';
	private static datasetsUrl = '/analytics/datasets';
	private static viewsUrl = '/analytics/views';

	public static async listReports(): Promise<ReportCatalogResponse> {
		if (reportsMockEnabled()) return mockCatalog();
		return await AxiosClient.get<ReportCatalogResponse>(this.baseUrl);
	}

	public static async runReport(key: string, req: ReportQueryRequest): Promise<ReportQueryResult> {
		if (reportsMockEnabled()) return mockRun(key, req);
		return await AxiosClient.post<ReportQueryResult>(`${this.baseUrl}/${encodeURIComponent(key)}/query`, req);
	}

	public static async listDatasets(): Promise<DatasetCatalogResponse> {
		if (reportsMockEnabled()) return mockDatasets();
		return await AxiosClient.get<DatasetCatalogResponse>(this.datasetsUrl);
	}

	public static async runDataset(definition: DatasetDefinition): Promise<ReportQueryResult> {
		if (reportsMockEnabled()) return mockRunDataset(definition);
		return await AxiosClient.post<ReportQueryResult>(`${this.datasetsUrl}/query`, { definition });
	}

	public static async listCustomReports(): Promise<CustomReportListResponse> {
		if (reportsMockEnabled()) return mockListCustom();
		const res = await AxiosClient.get<CustomReportListResponse>(this.viewsUrl);
		return { ...res, items: (res.items ?? []).filter((r) => r.definition?.family === 'report' || r.definition?.family === 'dataset') };
	}

	public static async createCustomReport(name: string, definition: CustomReportDefinition | DatasetDefinition): Promise<CustomReport> {
		if (reportsMockEnabled()) return mockSaveCustom(undefined, name, definition);
		return await AxiosClient.post<CustomReport>(this.viewsUrl, { name, definition });
	}

	public static async updateCustomReport(
		id: string,
		name: string,
		definition: CustomReportDefinition | DatasetDefinition,
	): Promise<CustomReport> {
		if (reportsMockEnabled()) return mockSaveCustom(id, name, definition);
		return await AxiosClient.put<CustomReport>(`${this.viewsUrl}/${encodeURIComponent(id)}`, { name, definition });
	}

	public static async deleteCustomReport(id: string): Promise<void> {
		if (reportsMockEnabled()) return mockDeleteCustom(id);
		await AxiosClient.delete(`${this.viewsUrl}/${encodeURIComponent(id)}`);
	}
}

export default ReportsApi;
