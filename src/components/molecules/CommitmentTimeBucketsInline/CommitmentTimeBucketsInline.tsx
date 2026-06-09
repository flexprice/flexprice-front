import { FC } from 'react';
import type { CommitmentTimeBucket } from '@/types/dto/CommitmentTimeBucket';
import { formatCommitmentTimeBucketLabel } from '@/utils/subscription/subscription_line_item_commitment_helpers';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { useTranslation } from 'react-i18next';

interface Props {
	buckets?: CommitmentTimeBucket[];
	currency?: string;
	minutesEnabled?: boolean;
	compact?: boolean;
}

const CommitmentTimeBucketsInline: FC<Props> = ({ buckets, currency, minutesEnabled = true, compact = false }) => {
	const { t } = useTranslation('billing');

	if (!buckets?.length) {
		return <span className='text-sm text-muted-foreground'>—</span>;
	}

	const currencySymbol = getCurrencySymbol(currency ?? 'usd');

	if (compact) {
		return (
			<span className='text-sm text-muted-foreground'>
				{t('commitmentConfig.timeBuckets.bucketCount', {
					count: buckets.length,
					defaultValue: '{{count}} time bucket(s)',
				})}
			</span>
		);
	}

	return (
		<ul className='space-y-1.5'>
			{buckets.map((bucket, index) => (
				<li key={bucket.id ?? index} className='text-sm text-foreground leading-snug'>
					{formatCommitmentTimeBucketLabel(bucket, currencySymbol, minutesEnabled)}
					{bucket.true_up_enabled ? (
						<span className='ms-1 text-xs text-muted-foreground'>({t('commitmentConfig.enableTrueUp', { defaultValue: 'True up' })})</span>
					) : null}
				</li>
			))}
		</ul>
	);
};

export default CommitmentTimeBucketsInline;
