import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ReportsApi from '@/api/ReportsApi';
import EnvironmentApi from '@/api/EnvironmentApi';
import { getHttpStatus } from '@/core/axios/types';
import {
	CustomReport,
	CustomReportDefinition,
	CustomReportListResponse,
	DatasetDefinition,
	ReportQueryRequest,
	ReportQueryResult,
} from '@/types/dto/Reports';

const retry = (count: number, err: unknown) => count < 2 && (getHttpStatus(err) ?? 0) >= 500;

// Ranges are absolute days, so keys roll daily.
// Results differ per environment.
const env = () => EnvironmentApi.getActiveEnvironmentId();

const cache = { staleTime: 5 * 60_000, gcTime: 30 * 60_000, refetchOnMount: true } as const;

export const useReportCatalog = () => useQuery({ queryKey: ['reports-catalog'], queryFn: () => ReportsApi.listReports(), ...cache, retry });

export const reportRunOptions = (key: string | undefined, req: ReportQueryRequest | undefined) => ({
	queryKey: ['report-run', key, req, env()] as const,
	queryFn: () => ReportsApi.runReport(key as string, req as ReportQueryRequest),
	enabled: !!key && !!req,
	...cache,
	retry,
	placeholderData: (prev: ReportQueryResult | undefined, prevQuery: { queryKey: readonly unknown[] } | undefined) =>
		prevQuery?.queryKey[1] === key ? prev : undefined,
});

export const useReportRun = (key: string | undefined, req: ReportQueryRequest | undefined) => useQuery(reportRunOptions(key, req));

export const useDatasets = () => useQuery({ queryKey: ['datasets-catalog'], queryFn: () => ReportsApi.listDatasets(), ...cache, retry });

export const datasetRunOptions = (def: DatasetDefinition | undefined) => ({
	queryKey: ['dataset-run', def, env()] as const,
	queryFn: () => ReportsApi.runDataset(def as DatasetDefinition),
	enabled: !!def,
	...cache,
	retry,
	placeholderData: (prev: ReportQueryResult | undefined, prevQuery: { queryKey: readonly unknown[] } | undefined) =>
		(prevQuery?.queryKey[1] as DatasetDefinition | undefined)?.dataset === def?.dataset ? prev : undefined,
});

export const useDatasetRun = (def: DatasetDefinition | undefined) => useQuery(datasetRunOptions(def));

export const useCustomReports = () =>
	useQuery({ queryKey: ['custom-reports', env()], queryFn: () => ReportsApi.listCustomReports(), ...cache, retry });

export const useCustomReportMutations = () => {
	const qc = useQueryClient();
	const onSuccess = () => qc.invalidateQueries({ queryKey: ['custom-reports'] });
	return {
		create: useMutation({
			mutationFn: (a: { name: string; definition: CustomReportDefinition | DatasetDefinition }) =>
				ReportsApi.createCustomReport(a.name, a.definition),
			// Seed list before refetch.
			onSuccess: (created: CustomReport) => {
				qc.setQueryData<CustomReportListResponse>(['custom-reports', env()], (old) => old && { items: [created, ...old.items] });
				void onSuccess();
			},
		}),
		update: useMutation({
			mutationFn: (a: { id: string; name: string; definition: CustomReportDefinition | DatasetDefinition }) =>
				ReportsApi.updateCustomReport(a.id, a.name, a.definition),
			onSuccess,
		}),
		remove: useMutation({ mutationFn: (id: string) => ReportsApi.deleteCustomReport(id), onSuccess }),
	};
};
