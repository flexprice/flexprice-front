import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import SubscriptionApi from '@/api/SubscriptionApi';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import type { ExecuteSubscriptionModifyRequest, SubscriptionModifyResponse } from '@/types/dto/Subscription';

export interface UseSubscriptionQuantityModifyResult {
	preview: (payload: ExecuteSubscriptionModifyRequest) => Promise<SubscriptionModifyResponse>;
	execute: (payload: ExecuteSubscriptionModifyRequest) => Promise<SubscriptionModifyResponse>;
	previewResult: SubscriptionModifyResponse | null;
	reset: () => void;
	isPreviewPending: boolean;
	isExecutePending: boolean;
}

export function useSubscriptionQuantityModify(subscriptionId: string | undefined): UseSubscriptionQuantityModifyResult {
	const {
		mutateAsync: preview,
		reset: resetPreview,
		isPending: isPreviewPending,
		data: previewData,
	} = useMutation({
		mutationFn: async (payload: ExecuteSubscriptionModifyRequest): Promise<SubscriptionModifyResponse> => {
			if (!subscriptionId) {
				throw new Error('Subscription ID is required');
			}
			return SubscriptionApi.previewSubscriptionModify(subscriptionId, payload);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to preview subscription change');
		},
	});

	const {
		mutateAsync: execute,
		reset: resetExecute,
		isPending: isExecutePending,
	} = useMutation({
		mutationFn: async (payload: ExecuteSubscriptionModifyRequest): Promise<SubscriptionModifyResponse> => {
			if (!subscriptionId) {
				throw new Error('Subscription ID is required');
			}
			return SubscriptionApi.executeSubscriptionModify(subscriptionId, payload);
		},
		onSuccess: async () => {
			toast.success('Quantity updated successfully');
			resetPreview();
			if (subscriptionId) {
				await refetchQueries(['subscriptionEdit', subscriptionId]);
			}
			await refetchQueries(['subscriptions']);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to apply subscription change');
		},
	});

	const reset = useCallback(() => {
		resetPreview();
		resetExecute();
	}, [resetPreview, resetExecute]);

	const previewResult = previewData ?? null;

	return {
		preview,
		execute,
		previewResult,
		reset,
		isPreviewPending,
		isExecutePending,
	};
}
