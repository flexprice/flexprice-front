import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CommitmentTimeBucket } from '@/types/dto/CommitmentTimeBucket';
import {
	attachCommitmentBucketPrices,
	collectCommitmentBucketPriceIds,
	fetchCommitmentPricesByIds,
} from '@/utils/subscription/subscription_line_item_commitment_helpers';

/** Resolve commitment bucket `price_id` references to full price records for read-only display. */
export function useCommitmentTimeBucketPrices(buckets: CommitmentTimeBucket[] | undefined) {
	const priceIds = useMemo(() => collectCommitmentBucketPriceIds(buckets ?? []), [buckets]);

	const {
		data: pricesById,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['commitment-bucket-prices', priceIds],
		queryFn: () => fetchCommitmentPricesByIds(priceIds),
		enabled: priceIds.length > 0,
		staleTime: 60_000,
	});

	const bucketsWithPrices = useMemo(() => attachCommitmentBucketPrices(buckets ?? [], pricesById ?? {}), [buckets, pricesById]);

	return {
		bucketsWithPrices,
		pricesById: pricesById ?? {},
		isLoading: priceIds.length > 0 && isLoading,
		isError,
	};
}
