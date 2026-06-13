import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PriceApi } from '@/api/PriceApi';
import type { LineItem } from '@/models/Subscription';
import {
	attachCommitmentBucketPrices,
	collectCommitmentBucketPriceIds,
	fetchCommitmentPricesByIds,
} from '@/utils/subscription/subscription_line_item_commitment_helpers';

/**
 * Resolve prices for commitment view:
 * - top-level charge price via `lineItem.price_id`
 * - window bucket prices via each bucket's `price_id` (excluding the line item price)
 */
export function useLineItemCommitmentViewPrices(lineItem: LineItem | null, enabled: boolean) {
	const topLevelPriceId = lineItem?.price_id;
	const needsTopLevelFetch = enabled && !!topLevelPriceId && !lineItem?.price;

	const {
		data: fetchedTopLevelPrice,
		isLoading: isTopLevelLoading,
		isError: isTopLevelError,
	} = useQuery({
		queryKey: ['line-item-commitment-top-price', topLevelPriceId],
		queryFn: () => PriceApi.GetPriceById(topLevelPriceId!),
		enabled: needsTopLevelFetch,
		staleTime: 60_000,
	});

	const topLevelPrice = fetchedTopLevelPrice ?? lineItem?.price ?? null;

	const bucketPriceIds = useMemo(
		() => collectCommitmentBucketPriceIds(lineItem?.commitment_time_buckets ?? [], topLevelPriceId ? [topLevelPriceId] : []),
		[lineItem?.commitment_time_buckets, topLevelPriceId],
	);

	const {
		data: bucketPricesById,
		isLoading: isBucketLoading,
		isError: isBucketError,
	} = useQuery({
		queryKey: ['line-item-commitment-bucket-prices', bucketPriceIds],
		queryFn: () => fetchCommitmentPricesByIds(bucketPriceIds),
		enabled: enabled && bucketPriceIds.length > 0,
		staleTime: 60_000,
	});

	const bucketsWithPrices = useMemo(
		() => attachCommitmentBucketPrices(lineItem?.commitment_time_buckets ?? [], bucketPricesById ?? {}),
		[lineItem?.commitment_time_buckets, bucketPricesById],
	);

	return {
		topLevelPrice,
		bucketsWithPrices,
		isLoading: (needsTopLevelFetch && isTopLevelLoading) || (bucketPriceIds.length > 0 && isBucketLoading),
		isError: isTopLevelError || isBucketError,
	};
}
