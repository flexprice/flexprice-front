import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

interface MainQuery<TData, TError> {
	queryKey: QueryKey;
	queryFn: () => Promise<TData>;
	options?: UseQueryOptions<TData, TError>;
}

/** The cheap `limit:1` probe (or any other request you want) */
interface ProbeQuery<TProbeData, TError> {
	queryKey: QueryKey;
	queryFn: () => Promise<TProbeData>;
	options?: UseQueryOptions<TProbeData, TError>;
}

/**
 * @param shouldProbe  — *Either* a boolean *or* a function.
 *                      If it’s a function, it receives `mainData` and must return boolean.
 *                      Defaults to `false` (never probe).
 *
 * @return merged flags + helpers:
 *   - isLoading / isError
 *   - mainData
 *   - probeData
 *   - showEmptyPage    (no data in system)
 *   - showEmptyTable   (data exists but filtered out)
 */
export function useQueryWithEmptyState<TMain = unknown, TProbe = unknown, TError = unknown>({
	main,
	probe,
	shouldProbe = false,
}: {
	main: MainQuery<TMain, TError>;
	probe: ProbeQuery<TProbe, TError>;
	shouldProbe?: boolean | ((mainData: TMain | undefined) => boolean);
}) {
	/* ---------- main query ---------- */
	const {
		data: mainData,
		isLoading: loadingMain,
		isSuccess: mainSuccess,
		isError: errorMain,
		error: mainError,
	} = useQuery<TMain, TError>({
		queryKey: main.queryKey,
		queryFn: main.queryFn,
		...main.options,
	});

	/* ---------- decide if probe should run ---------- */
	const runProbe = typeof shouldProbe === 'function' ? shouldProbe(mainData) : shouldProbe;

	/* ---------- probe query ---------- */
	const {
		data: probeData,
		isLoading: loadingProbe,
		isError: errorProbe,
		error: probeError,
	} = useQuery<TProbe, TError>({
		queryKey: probe.queryKey,
		queryFn: probe.queryFn,
		enabled: runProbe && mainSuccess,
		...probe.options,
	});

	/* ---------- merged flags ---------- */
	const isLoading = loadingMain || loadingProbe;
	const isError = errorMain || errorProbe;
	const error = (mainError ?? probeError) as TError | undefined;

	return {
		/* raw */
		data: mainData,
		probeData,
		isLoading,
		isError,
		error,
	};
}
