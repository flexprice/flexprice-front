import { FC, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'es-toolkit';
import { ColumnData, FlexpriceTable } from '@/components/molecules';
import { Checkbox, FormHeader, Chip } from '@/components/atoms';
import { BILLING_PERIOD } from '@/constants/constants';
import { cadenceFanoutCount } from '@/utils/subscription/cadenceCompatibility';
import type { AdditionalCadenceGroup } from '@/utils/subscription/planPricesForSubscriptionUi';

interface Props {
	/** Additional-cadence groups from `groupAdditionalPricesByCadence(partition.additional)`. */
	groups: AdditionalCadenceGroup[];
	/** Currently opted-in cadence keys (subset of `groups.map(g => g.key)`). */
	optedInKeys: string[];
	/** Called when the user toggles a cadence's checkbox. */
	onToggle: (cadenceKey: string, included: boolean) => void;
	/** Subscription cadence — used for the fan-out hint per cadence group. */
	subPeriod: BILLING_PERIOD;
	/** Subscription cadence count — used for the fan-out hint per cadence group. */
	subCount: number;
	disabled?: boolean;
}

type Row = {
	key: string;
	include: ReactNode;
	cadence: ReactNode;
	count: ReactNode;
	fanout: ReactNode;
};

/**
 * Opt-in section for finer-cadence plan prices, grouped by cadence. Toggling a group's
 * checkbox pulls **every** plan price of that cadence into the parent's main "Charges"
 * table (via `SubscriptionFormState.optedInAdditionalCadences`) so the user gets full
 * override / commitment / coupon controls on the merged prices. Rendered only when the
 * partition helper produced at least one additional group.
 */
const AdditionalPlanPricesSection: FC<Props> = ({ groups, optedInKeys, onToggle, subPeriod, subCount, disabled = false }) => {
	const { t } = useTranslation('customers');
	const optedInSet = useMemo(() => new Set(optedInKeys), [optedInKeys]);

	const columns = useMemo<ColumnData<Row>[]>(
		() => [
			{ fieldName: 'include', title: '', width: 40, align: 'center', fieldVariant: 'interactive' },
			{ fieldName: 'cadence', title: t('organisms.additionalPlanPrices.colCadence') },
			{ fieldName: 'count', title: t('organisms.additionalPlanPrices.colCount') },
			{ fieldName: 'fanout', title: t('organisms.additionalPlanPrices.colBillingImpact') },
		],
		[t],
	);

	const rows = useMemo<Row[]>(() => {
		return groups.map((group) => {
			const fanout = cadenceFanoutCount(subPeriod, subCount, group.period, group.count);
			const isChecked = optedInSet.has(group.key);
			const cadenceLabel = group.count > 1 ? `${capitalize(String(group.period))} × ${group.count}` : capitalize(String(group.period));
			return {
				key: group.key,
				include: (
					<div data-interactive='true' onClick={(e) => e.stopPropagation()}>
						<Checkbox
							id={`additional-cadence-${group.key}`}
							checked={isChecked}
							disabled={disabled}
							onCheckedChange={(next) => onToggle(group.key, !!next)}
						/>
					</div>
				),
				cadence: <Chip label={cadenceLabel} variant='default' />,
				count: <span>{t('organisms.additionalPlanPrices.chargeCount', { count: group.prices.length })}</span>,
				fanout: (
					<span className='text-xs text-content-muted'>
						{fanout != null && fanout > 1
							? t('organisms.additionalPlanPrices.fanoutHint', { count: fanout })
							: t('organisms.additionalPlanPrices.noFanout')}
					</span>
				),
			};
		});
	}, [groups, optedInSet, subPeriod, subCount, disabled, onToggle, t]);

	if (groups.length === 0) return null;

	return (
		<div className='space-y-3'>
			<div>
				<FormHeader title={t('organisms.additionalPlanPrices.title')} variant='sub-header' />
				<p className='text-xs text-content-muted mt-1'>{t('organisms.additionalPlanPrices.explainer')}</p>
			</div>
			<div className='rounded-[6px] border border-line-strong'>
				<div style={{ overflow: 'hidden' }}>
					<FlexpriceTable columns={columns} data={rows} />
				</div>
			</div>
		</div>
	);
};

export default AdditionalPlanPricesSection;
