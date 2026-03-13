import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import SettingsApi from '@/api/SettingsApi';
import type { Setting } from '@/api/SettingsApi';
import type { ServerError } from '@/core/axios/types';

const SETTINGS_QUERY_KEY = 'settings';

export interface UseSettingSectionOptions<T> {
	key: string;
	defaultValue: T;
	/** Merge API value with defaults (for partial responses). If not provided, form is set to (data?.value ?? defaultValue). */
	mergeWithDefaults?: (apiValue: unknown, defaultValue: T) => T;
}

export interface UseSettingSectionResult<T> {
	data: Setting | undefined;
	isLoading: boolean;
	isError: boolean;
	refetch: () => void;
	formValue: T;
	setFormValue: React.Dispatch<React.SetStateAction<T>>;
	saveMutation: ReturnType<typeof useMutation<Setting, ServerError, T>>;
	resetMutation: ReturnType<typeof useMutation<void, ServerError, void>>;
	/** Field-level errors from last failed PUT (e.g. { 'value.prefix': 'must be at least 1 character' }) */
	backendDetails: Record<string, string>;
	/** Sync form from API data (e.g. after load or refetch). */
	syncFormFromData: () => void;
}

export function useSettingSection<T>({ key, defaultValue, mergeWithDefaults }: UseSettingSectionOptions<T>): UseSettingSectionResult<T> {
	const queryClient = useQueryClient();
	const [formValue, setFormValue] = useState<T>(defaultValue);
	const [backendDetails, setBackendDetails] = useState<Record<string, string>>({});

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: [SETTINGS_QUERY_KEY, key],
		queryFn: () => SettingsApi.getSettingByKey(key),
	});

	const syncFormFromData = useCallback(() => {
		if (!data?.value) {
			setFormValue(defaultValue);
			return;
		}
		if (mergeWithDefaults) {
			setFormValue(mergeWithDefaults(data.value, defaultValue));
		} else {
			setFormValue({ ...defaultValue, ...(data.value as Partial<T>) } as T);
		}
	}, [data?.value, defaultValue, mergeWithDefaults]);

	useEffect(() => {
		if (data === undefined) return;
		if (!data?.value) {
			setFormValue(defaultValue);
			return;
		}
		if (mergeWithDefaults) {
			setFormValue(mergeWithDefaults(data.value, defaultValue));
		} else {
			setFormValue({ ...defaultValue, ...(data.value as Partial<T>) } as T);
		}
	}, [data, defaultValue, mergeWithDefaults]);

	const saveMutation = useMutation<Setting, ServerError, T>({
		mutationFn: (value) => SettingsApi.updateSettingByKey(key, { value: value as Record<string, unknown> }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY, key] });
			setBackendDetails({});
			toast.success('Settings saved');
		},
		onError: (err: ServerError) => {
			const message = err?.error?.message || 'Failed to save settings';
			toast.error(message);
			setBackendDetails(err?.error?.details ?? {});
		},
	});

	const resetMutation = useMutation<void, ServerError, void>({
		mutationFn: () => SettingsApi.deleteSettingByKey(key),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY, key] });
			setFormValue(defaultValue);
			setBackendDetails({});
			toast.success('Reset to default');
		},
		onError: (err: ServerError) => {
			const message = err?.error?.message || 'Failed to reset settings';
			toast.error(message);
			setBackendDetails(err?.error?.details ?? {});
		},
	});

	return {
		data,
		isLoading,
		isError,
		refetch,
		formValue,
		setFormValue,
		saveMutation,
		resetMutation,
		backendDetails,
		syncFormFromData,
	};
}
