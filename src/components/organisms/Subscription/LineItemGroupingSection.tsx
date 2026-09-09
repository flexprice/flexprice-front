import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FormHeader, Label } from '@/components/atoms';
import { Switch } from '@/components/ui';
import { cn } from '@/lib/utils';
import { getTypographyClass } from '@/lib/typography';
import { BILLING_PERIOD } from '@/constants/constants';

export interface GroupingCadence {
	period: BILLING_PERIOD | string;
	count: number;
}

interface Props {
	/** true = one line item per invoice (`per_billing_period`); false = one per charge period (default). */
	checked: boolean;
	onChange: (checked: boolean) => void;
	/** Subscription cadence, used in the explainer sentence. */
	subPeriod: BILLING_PERIOD | string;
	subCount: number;
	/** Cadences of the attached charges that actually split across the subscription's billing period. */
	splittingCadences: GroupingCadence[];
	/**
	 * When the subscription carries a cumulative commitment, plan-level "Overage" rows stay
	 * unmerged by design — surface that so a combined invoice with extra rows isn't a surprise.
	 */
	showOverageNote?: boolean;
	disabled?: boolean;
}

const TOGGLE_ID = 'subscription-line-item-grouping';

/**
 * Opt-in control for `line_item_grouping = per_billing_period`: collapse each finer-cadence
 * charge into a single line item spanning the subscription's billing period instead of one
 * line item per charge period. Presentation only — the invoice total is identical either way.
 *
 * The parent renders this only when at least one attached charge actually splits (see
 * `subscriptionHasSplittingCharge`); otherwise the setting is a no-op and stays hidden.
 *
 * Structure deliberately mirrors AdditionalPlanPricesSection (title + explainer + bordered
 * control area) — the two read as a pair, since a charge can only bill more often than the
 * subscription once a finer cadence is opted in there.
 */
const LineItemGroupingSection: FC<Props> = ({
	checked,
	onChange,
	subPeriod,
	subCount,
	splittingCadences,
	showOverageNote = false,
	disabled = false,
}) => {
	const { t } = useTranslation('customers');

	const cadenceLabel = useMemo(
		() => (period: BILLING_PERIOD | string, count: number) => {
			const key = String(period).toUpperCase();
			// Falls back to the raw period (lower-cased, underscores stripped) for any period the
			// translation map doesn't know about.
			const base = t(`organisms.lineItemGrouping.cadence.${key}`, {
				defaultValue: key.replace(/_/g, ' ').toLowerCase(),
			});
			return count > 1 ? t('organisms.lineItemGrouping.cadenceWithCount', { count, cadence: base }) : base;
		},
		[t],
	);

	const explainer = useMemo(() => {
		const itemCadences = [...new Set(splittingCadences.map((c) => cadenceLabel(c.period, c.count)))].join(
			t('organisms.lineItemGrouping.cadenceSeparator'),
		);
		return t('organisms.lineItemGrouping.explainer', {
			subCadence: cadenceLabel(subPeriod, subCount),
			itemCadences,
		});
	}, [splittingCadences, subPeriod, subCount, cadenceLabel, t]);

	return (
		<div>
			<FormHeader variant='form-component-title' title={t('organisms.lineItemGrouping.title')} subtitle={explainer} className='mb-3' />
			<div className='rounded-[6px] border border-line-strong px-4 py-3'>
				<div className={cn('flex flex-row justify-between gap-4', showOverageNote ? 'items-start' : 'items-center')}>
					<div className='min-w-0 flex-1'>
						<Label htmlFor={TOGGLE_ID} label={t('organisms.lineItemGrouping.toggleLabel')} disabled={disabled} />
						{showOverageNote && (
							<p className={cn(getTypographyClass('helper-text'), 'mt-1 leading-relaxed')}>{t('organisms.lineItemGrouping.overageNote')}</p>
						)}
					</div>
					<Switch id={TOGGLE_ID} className='shrink-0' checked={checked} onCheckedChange={onChange} disabled={disabled} />
				</div>
			</div>
		</div>
	);
};

export default LineItemGroupingSection;
