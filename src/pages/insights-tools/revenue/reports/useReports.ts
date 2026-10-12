import { useQuery } from '@tanstack/react-query';
import ReportsApi from '@/api/ReportsApi';
import { ReportQueryRequest } from '@/types/dto/Reports';

const retry = (count: number, err: unknown) => count < 2 && ((err as { status?: number }).status ?? 0) >= 500;

export const useReportCatalog = () =>
	useQuery({ queryKey: ['reports-catalog'], queryFn: () => ReportsApi.listReports(), staleTime: 300_000, retry });

export const useReportRun = (key: string | undefined, req: ReportQueryRequest | undefined) =>
	useQuery({
		queryKey: ['report-run', key, req],
		queryFn: () => ReportsApi.runReport(key as string, req as ReportQueryRequest),
		enabled: !!key && !!req,
		retry,
	});
