import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FormHeader, Label } from '@/components/atoms';
import { Switch } from '@/components/ui';
import { cn } from '@/lib/utils';
import { getTypographyClass } from '@/lib/typography';

interface Props {
	/** true = one line item per invoice (`per_billing_period`); false = one per charge period (default). */
	checked: boolean;
	onChange: (checked: boolean) => void;
	/**
	 * When the subscription carries a cumulative commitment, plan-level "Overage" rows stay
	 * unmerged by design — surface that so a combined invoice with extra rows isn't a surprise.
	 */
	showOverageNote?: boolean;
	/**
	 * `trailing` (default) renders the bare control, to sit under the AdditionalPlanPricesSection
	 * table which already supplies the heading. `section` adds a heading, for the case where the
	 * splitting charge came from an inline "Add charge" and that table isn't on screen.
	 */
	variant?: 'trailing' | 'section';
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
 * Deliberately borderless: it sits below the cadence table, not inside it, so it reads as a
 * setting that follows from those cadences rather than another row of them.
 */
const LineItemGroupingSection: FC<Props> = ({ checked, onChange, showOverageNote = false, variant = 'trailing', disabled = false }) => {
	const { t } = useTranslation('customers');

	const control = (
		<div className='flex flex-row items-start justify-between gap-4'>
			<div className='min-w-0 flex-1'>
				<Label htmlFor={TOGGLE_ID} label={t('organisms.lineItemGrouping.toggleLabel')} disabled={disabled} />
				<p className='mt-0.5 text-sm leading-relaxed text-muted-foreground'>{t('organisms.lineItemGrouping.explainer')}</p>
				{showOverageNote && <p className={cn(getTypographyClass('helper-text'), 'mt-1')}>{t('organisms.lineItemGrouping.overageNote')}</p>}
			</div>
			<Switch id={TOGGLE_ID} className='mt-0.5 shrink-0' checked={checked} onCheckedChange={onChange} disabled={disabled} />
		</div>
	);

	if (variant === 'trailing') return control;

	return (
		<div>
			<FormHeader variant='form-component-title' title={t('organisms.lineItemGrouping.title')} className='mb-3' />
			{control}
		</div>
	);
};

export default LineItemGroupingSection;
