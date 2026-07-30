import { FC, useMemo } from 'react';
import Dialog from '@/components/atoms/Dialog';
import type { LineItem } from '@/models/Subscription';
import SubscriptionChargeCommitmentSection from '@/components/organisms/Subscription/SubscriptionChargeCommitmentSection';
import {
	DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE,
	lineItemWindowCommitmentStateFromBuckets,
} from '@/utils/subscription/subscription_line_item_commitment_helpers';
import { useCommitmentTimeBucketPrices } from '@/hooks/useCommitmentTimeBucketPrices';
import { useTranslation } from 'react-i18next';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	lineItem: LineItem;
}

/** Read-only window commitment details for subscription charge view. */
const LineItemWindowCommitmentViewDialog: FC<Props> = ({ isOpen, onOpenChange, lineItem }) => {
	const { t } = useTranslation('billing');
	const { bucketsWithPrices, isLoading, isError } = useCommitmentTimeBucketPrices(lineItem.commitment_time_buckets);
	const meterId = lineItem.meter_id || lineItem.price?.meter_id;

	const commitmentState = useMemo(() => {
		if (isLoading) return DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE;
		return lineItemWindowCommitmentStateFromBuckets(lineItem, bucketsWithPrices);
	}, [bucketsWithPrices, isLoading, lineItem]);

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('commitmentConfig.lineItemTitle', { defaultValue: 'Window commitment' })}
			description={lineItem.display_name}
			className='w-full max-w-4xl overflow-x-hidden'>
			{isLoading ? (
				<p className='text-sm text-gray-500'>
					{t('commitmentConfig.view.loadingBucketPrices', { defaultValue: 'Loading bucket pricing…' })}
				</p>
			) : isError ? (
				<p className='text-sm text-red-600'>
					{t('commitmentConfig.view.loadBucketPricesFailed', {
						defaultValue: 'Could not load bucket pricing details.',
					})}
				</p>
			) : (
				<SubscriptionChargeCommitmentSection
					meterId={meterId}
					currency={lineItem.currency}
					value={commitmentState}
					onChange={() => {}}
					disabled
				/>
			)}
		</Dialog>
	);
};

export default LineItemWindowCommitmentViewDialog;
