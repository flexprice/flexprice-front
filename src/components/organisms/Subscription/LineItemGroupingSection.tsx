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
	/**
	 * `footer` (default) renders bare, to be slotted under the AdditionalPlanPricesSection table
	 * inside that section's border. `section` renders its own heading and border for the case
	 * where the splitting charge came from an inline "Add charge" and there is no cadence table
	 * to hang off.
	 */
	variant?: 'footer' | 'section';
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
 */
const LineItemGroupingSection: FC<Props> = ({
	checked,
	onChange,
	subPeriod,
	subCount,
	splittingCadences,
	showOverageNote = false,
	variant = 'footer',
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

	// Label and switch share a row; the explainer (and the commitment caveat) sit underneath,
	// so the sentence can wrap the full width instead of squeezing against the control.
	const body = (
		<div className='px-4 py-3'>
			<div className='flex flex-row items-center justify-between gap-4'>
				<Label htmlFor={TOGGLE_ID} label={t('organisms.lineItemGrouping.toggleLabel')} disabled={disabled} />
				<Switch id={TOGGLE_ID} className='shrink-0' checked={checked} onCheckedChange={onChange} disabled={disabled} />
			</div>
			<p className='mt-1 text-sm leading-relaxed text-muted-foreground'>{explainer}</p>
			{showOverageNote && (
				<p className={cn(getTypographyClass('helper-text'), 'mt-2 leading-relaxed')}>{t('organisms.lineItemGrouping.overageNote')}</p>
			)}
		</div>
	);

	// Slotted into AdditionalPlanPricesSection's border — the divider is the only chrome it
	// needs, since the parent already supplies the heading, explainer and outer border.
	// border-line-slate is what FlexpriceTable uses between its own rows, so the divider reads
	// as a continuation of the table rather than a seam.
	if (variant === 'footer') return <div className='border-t border-line-slate'>{body}</div>;

	return (
		<div>
			<FormHeader variant='form-component-title' title={t('organisms.lineItemGrouping.title')} className='mb-3' />
			<div className='rounded-[6px] border border-line-strong'>{body}</div>
		</div>
	);
};

export default LineItemGroupingSection;
