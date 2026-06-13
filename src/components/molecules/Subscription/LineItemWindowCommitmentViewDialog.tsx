import { FC, useMemo } from 'react';
import CommitmentConfigDialog from '@/components/molecules/CommitmentConfigDialog/CommitmentConfigDialog';
import type { LineItem } from '@/models/Subscription';
import { lineItemCommitmentConfigFromLineItem } from '@/utils/subscription/subscription_line_item_commitment_helpers';
import { useLineItemCommitmentViewPrices } from '@/hooks/useLineItemCommitmentViewPrices';
import { useMeterForCommitment } from '@/hooks/useMeterForCommitment';
import { BILLING_PERIOD } from '@/constants/constants';
import type { Price } from '@/models/Price';
import { BILLING_MODEL, PRICE_TYPE, PRICE_UNIT_TYPE } from '@/models/Price';
import { INVOICE_CADENCE } from '@/models/Invoice';
import { ENTITY_STATUS } from '@/models/base';
import Dialog from '@/components/atoms/Dialog';
import { useTranslation } from 'react-i18next';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	lineItem: LineItem;
}

function buildViewPriceFromLineItem(lineItem: LineItem): Price {
	return {
		id: lineItem.price_id,
		display_name: lineItem.display_name,
		currency: lineItem.currency,
		type: lineItem.price_type ?? PRICE_TYPE.USAGE,
		billing_period: lineItem.billing_period as BILLING_PERIOD,
		billing_period_count: lineItem.price?.billing_period_count ?? 1,
		billing_model: lineItem.price?.billing_model ?? BILLING_MODEL.FLAT_FEE,
		invoice_cadence: lineItem.price?.invoice_cadence ?? INVOICE_CADENCE.ARREAR,
		price_unit_type: lineItem.price?.price_unit_type ?? PRICE_UNIT_TYPE.FIAT,
		meter_id: lineItem.meter_id || lineItem.price?.meter_id || '',
		amount: lineItem.price?.amount ?? '',
		display_amount: lineItem.price?.display_amount ?? '',
		entity_type: lineItem.price?.entity_type,
		entity_id: lineItem.price?.entity_id ?? '',
		tier_mode: lineItem.price?.tier_mode,
		tiers: lineItem.price?.tiers ?? null,
		filter_values: lineItem.price?.filter_values ?? null,
		lookup_key: lineItem.price?.lookup_key ?? '',
		description: lineItem.price?.description ?? '',
		transform_quantity: lineItem.price?.transform_quantity ?? null,
		metadata: lineItem.price?.metadata ?? null,
		meter: lineItem.price?.meter,
		status: lineItem.price?.status ?? ENTITY_STATUS.PUBLISHED,
		created_at: lineItem.created_at,
		updated_at: lineItem.updated_at,
	} as Price;
}

/** Read-only commitment details for subscription charge view (matches create UI). */
const LineItemWindowCommitmentViewDialog: FC<Props> = ({ isOpen, onOpenChange, lineItem }) => {
	const { t } = useTranslation('billing');
	const { topLevelPrice, bucketsWithPrices, isLoading, isError } = useLineItemCommitmentViewPrices(lineItem, isOpen);
	const meterId = lineItem.meter_id || topLevelPrice?.meter_id || lineItem.price?.meter_id;
	const { meter, isLoading: isMeterLoading } = useMeterForCommitment(meterId, topLevelPrice?.meter ?? lineItem.price?.meter);

	const viewPrice = useMemo(() => {
		const base = topLevelPrice ?? lineItem.price ?? buildViewPriceFromLineItem(lineItem);
		if (meter && !base.meter?.aggregation?.bucket_size) {
			return { ...base, meter };
		}
		return base;
	}, [lineItem, meter, topLevelPrice]);

	const currentConfig = useMemo(
		() => lineItemCommitmentConfigFromLineItem(lineItem, bucketsWithPrices) ?? undefined,
		[lineItem, bucketsWithPrices],
	);

	if (isLoading || isMeterLoading) {
		return (
			<Dialog
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				title={t('commitmentConfig.view.title', { defaultValue: 'Commitment details' })}
				description={lineItem.display_name}
				className='w-full max-w-4xl overflow-x-hidden'>
				<p className='text-sm text-gray-500'>
					{t('commitmentConfig.view.loadingDetails', { defaultValue: 'Loading commitment details…' })}
				</p>
			</Dialog>
		);
	}

	if (isError) {
		return (
			<Dialog
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				title={t('commitmentConfig.view.title', { defaultValue: 'Commitment details' })}
				description={lineItem.display_name}
				className='w-full max-w-4xl overflow-x-hidden'>
				<p className='text-sm text-red-600'>
					{t('commitmentConfig.view.loadDetailsFailed', {
						defaultValue: 'Could not load commitment pricing details.',
					})}
				</p>
			</Dialog>
		);
	}

	return (
		<CommitmentConfigDialog
			readOnly
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			price={viewPrice}
			currentConfig={currentConfig}
			currentTimeBuckets={bucketsWithPrices}
			billingPeriod={lineItem.billing_period as BILLING_PERIOD}
		/>
	);
};

export default LineItemWindowCommitmentViewDialog;
