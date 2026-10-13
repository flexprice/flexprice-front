import { useQuery } from '@tanstack/react-query';
import ReportsApi from '@/api/ReportsApi';
import { getHttpStatus } from '@/core/axios/types';
import { ReportQueryRequest, ReportQueryResult } from '@/types/dto/Reports';

const retry = (count: number, err: unknown) => count < 2 && (getHttpStatus(err) ?? 0) >= 500;

export const useReportCatalog = () =>
	useQuery({ queryKey: ['reports-catalog'], queryFn: () => ReportsApi.listReports(), staleTime: 300_000, retry });

export const reportRunOptions = (key: string | undefined, req: ReportQueryRequest | undefined) => ({
	queryKey: ['report-run', key, req] as const,
	queryFn: () => ReportsApi.runReport(key as string, req as ReportQueryRequest),
	enabled: !!key && !!req,
	retry,
	placeholderData: (prev: ReportQueryResult | undefined, prevQuery: { queryKey: readonly unknown[] } | undefined) =>
		prevQuery?.queryKey[1] === key ? prev : undefined,
});

export const useReportRun = (key: string | undefined, req: ReportQueryRequest | undefined) => useQuery(reportRunOptions(key, req));
