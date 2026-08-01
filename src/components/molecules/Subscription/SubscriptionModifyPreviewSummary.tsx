import { Fragment, type FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { SubscriptionModifyResponse } from '@/types/dto/Subscription';
import {
	buildBillingImpactRows,
	buildLineItemChangeRows,
	getQuantityChangePreviewCopy,
	hasAnyChangedResources,
	type QuantityChangePreviewContext,
} from '@/utils/subscription/subscriptionModifyPreviewPresentation';

export interface SubscriptionModifyPreviewSummaryProps {
	data: SubscriptionModifyResponse | null;
	/** When set (e.g. quantity modify dialog), drives the primary “what changes” block. */
	quantityChangeContext?: QuantityChangePreviewContext;
}

const SubscriptionModifyPreviewSummary: FC<SubscriptionModifyPreviewSummaryProps> = ({ data, quantityChangeContext }) => {
	const { t } = useTranslation(['billing', 'common']);

	function directionShortLabel(direction: 'increase' | 'decrease' | 'unchanged'): string | null {
		if (direction === 'increase') return t('subscriptions.modifyPreview.directionIncrease');
		if (direction === 'decrease') return t('subscriptions.modifyPreview.directionDecrease');
		return null;
	}
	if (!data) {
		return <p className='text-sm text-content-muted'>{t('subscriptions.modifyPreview.noData')}</p>;
	}

	const lineItems = data.changed_resources?.line_items ?? [];
	const subscriptions = data.changed_resources?.subscriptions ?? [];
	const invoices = data.changed_resources?.invoices ?? [];

	const anyResources = hasAnyChangedResources(lineItems, subscriptions, invoices);

	const billingRows = buildBillingImpactRows(invoices, data.subscription?.latest_invoice ?? null);
	const lineRows = buildLineItemChangeRows(lineItems);

	const quantityCopy = quantityChangeContext ? getQuantityChangePreviewCopy(quantityChangeContext) : null;
	const directionHint = quantityCopy ? directionShortLabel(quantityCopy.direction) : null;

	const showLineSection = lineRows.length > 0;
	const showBillingSection = billingRows.length > 0;
	const showDividerBeforeLines = Boolean(quantityCopy && showLineSection);
	const showDividerBeforeBilling = Boolean(showBillingSection && (quantityCopy || showLineSection));

	return (
		<div className='space-y-4 text-sm text-content-heading'>
			{quantityCopy && quantityChangeContext && (
				<div>
					<p className='font-medium leading-snug text-content'>{quantityChangeContext.lineItemDisplayName}</p>
					<p className='mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-content-tertiary'>
						<span className='tabular-nums font-semibold text-content'>{quantityCopy.fromDisplay}</span>
						<span className='text-content-subtle' aria-hidden>
							→
						</span>
						<span className='tabular-nums font-semibold text-content'>{quantityCopy.toDisplay}</span>
						{directionHint && <span className='text-xs font-normal text-content-muted'>{directionHint}</span>}
					</p>
				</div>
			)}

			{showLineSection && (
				<div className={showDividerBeforeLines ? 'border-t border-line-subtle pt-4' : undefined}>
					<div className='grid grid-cols-[auto_auto_1fr] gap-x-4 gap-y-1.5'>
						<span className='border-b border-line-subtle pb-1.5 text-xs text-content-muted'>
							{t('subscriptions.modifyPreview.columnType')}
						</span>
						<span className='border-b border-line-subtle pb-1.5 text-xs tabular-nums text-content-muted'>
							{t('subscriptions.modifyPreview.columnQty')}
						</span>
						<span className='border-b border-line-subtle pb-1.5 text-xs text-content-muted'>
							{t('subscriptions.modifyPreview.columnPeriod')}
						</span>
						{lineRows.map((row) => (
							<Fragment key={row.id}>
								<span className='py-1 text-content-tertiary'>{row.label}</span>
								<span className='py-1 tabular-nums text-content'>{row.quantityDisplay}</span>
								<span className='py-1 text-content-tertiary'>{row.periodDisplay ?? t('common:labels.na')}</span>
							</Fragment>
						))}
					</div>
				</div>
			)}

			{showBillingSection && (
				<div className={showDividerBeforeBilling ? 'border-t border-line-subtle pt-4' : undefined}>
					<div className='space-y-2'>
						{billingRows.map((r) => (
							<div key={r.id} className='flex items-baseline justify-between gap-3'>
								<span className='text-content-secondary'>{r.title}</span>
								{r.amountText ? <span className='shrink-0 tabular-nums font-medium text-content'>{r.amountText}</span> : null}
							</div>
						))}
					</div>
				</div>
			)}

			{subscriptions.length > 0 && (
				<p className='text-content-tertiary'>
					<Trans
						ns='billing'
						i18nKey='subscriptions.modifyPreview.subscriptionUpdated'
						components={{ bold: <span className='font-medium text-content' /> }}
					/>
				</p>
			)}

			{quantityCopy && !anyResources && (
				<p className='text-sm text-content-tertiary'>{t('subscriptions.modifyPreview.noExtraBillingDetails')}</p>
			)}

			{!quantityCopy && !anyResources && (
				<p className='text-sm text-content-tertiary'>{t('subscriptions.modifyPreview.noBillingChanges')}</p>
			)}
		</div>
	);
};

export default SubscriptionModifyPreviewSummary;
