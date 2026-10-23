import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ReportsApi from '@/api/ReportsApi';
import { getHttpStatus } from '@/core/axios/types';
import { CustomReportDefinition, ReportQueryRequest, ReportQueryResult } from '@/types/dto/Reports';

const retry = (count: number, err: unknown) => count < 2 && (getHttpStatus(err) ?? 0) >= 500;

// Ranges are absolute days, so keys roll daily.
const cache = { staleTime: 5 * 60_000, gcTime: 30 * 60_000, refetchOnMount: true } as const;

export const useReportCatalog = () => useQuery({ queryKey: ['reports-catalog'], queryFn: () => ReportsApi.listReports(), ...cache, retry });

export const reportRunOptions = (key: string | undefined, req: ReportQueryRequest | undefined) => ({
	queryKey: ['report-run', key, req] as const,
	queryFn: () => ReportsApi.runReport(key as string, req as ReportQueryRequest),
	enabled: !!key && !!req,
	...cache,
	retry,
	placeholderData: (prev: ReportQueryResult | undefined, prevQuery: { queryKey: readonly unknown[] } | undefined) =>
		prevQuery?.queryKey[1] === key ? prev : undefined,
});

export const useReportRun = (key: string | undefined, req: ReportQueryRequest | undefined) => useQuery(reportRunOptions(key, req));

export const useCustomReports = () =>
	useQuery({ queryKey: ['custom-reports'], queryFn: () => ReportsApi.listCustomReports(), ...cache, retry });

export const useCustomReportMutations = () => {
	const qc = useQueryClient();
	const onSuccess = () => qc.invalidateQueries({ queryKey: ['custom-reports'] });
	return {
		create: useMutation({
			mutationFn: (a: { name: string; definition: CustomReportDefinition }) => ReportsApi.createCustomReport(a.name, a.definition),
			onSuccess,
		}),
		update: useMutation({
			mutationFn: (a: { id: string; name: string; definition: CustomReportDefinition }) =>
				ReportsApi.updateCustomReport(a.id, a.name, a.definition),
			onSuccess,
		}),
		remove: useMutation({ mutationFn: (id: string) => ReportsApi.deleteCustomReport(id), onSuccess }),
	};
};
