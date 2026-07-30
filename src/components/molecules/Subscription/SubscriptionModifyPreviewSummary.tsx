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
		return <p className='text-sm text-gray-500'>{t('subscriptions.modifyPreview.noData')}</p>;
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
		<div className='space-y-4 text-sm text-gray-800'>
			{quantityCopy && quantityChangeContext && (
				<div>
					<p className='font-medium leading-snug text-gray-900'>{quantityChangeContext.lineItemDisplayName}</p>
					<p className='mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-gray-600'>
						<span className='tabular-nums font-semibold text-gray-900'>{quantityCopy.fromDisplay}</span>
						<span className='text-gray-400' aria-hidden>
							→
						</span>
						<span className='tabular-nums font-semibold text-gray-900'>{quantityCopy.toDisplay}</span>
						{directionHint && <span className='text-xs font-normal text-gray-500'>{directionHint}</span>}
					</p>
				</div>
			)}

			{showLineSection && (
				<div className={showDividerBeforeLines ? 'border-t border-gray-100 pt-4' : undefined}>
					<div className='grid grid-cols-[auto_auto_1fr] gap-x-4 gap-y-1.5'>
						<span className='border-b border-gray-100 pb-1.5 text-xs text-gray-500'>{t('subscriptions.modifyPreview.columnType')}</span>
						<span className='border-b border-gray-100 pb-1.5 text-xs tabular-nums text-gray-500'>
							{t('subscriptions.modifyPreview.columnQty')}
						</span>
						<span className='border-b border-gray-100 pb-1.5 text-xs text-gray-500'>{t('subscriptions.modifyPreview.columnPeriod')}</span>
						{lineRows.map((row) => (
							<Fragment key={row.id}>
								<span className='py-1 text-gray-600'>{row.label}</span>
								<span className='py-1 tabular-nums text-gray-900'>{row.quantityDisplay}</span>
								<span className='py-1 text-gray-600'>{row.periodDisplay ?? t('common:labels.na')}</span>
							</Fragment>
						))}
					</div>
				</div>
			)}

			{showBillingSection && (
				<div className={showDividerBeforeBilling ? 'border-t border-gray-100 pt-4' : undefined}>
					<div className='space-y-2'>
						{billingRows.map((r) => (
							<div key={r.id} className='flex items-baseline justify-between gap-3'>
								<span className='text-gray-700'>{r.title}</span>
								{r.amountText ? <span className='shrink-0 tabular-nums font-medium text-gray-900'>{r.amountText}</span> : null}
							</div>
						))}
					</div>
				</div>
			)}

			{subscriptions.length > 0 && (
				<p className='text-gray-600'>
					<Trans
						ns='billing'
						i18nKey='subscriptions.modifyPreview.subscriptionUpdated'
						components={{ bold: <span className='font-medium text-gray-900' /> }}
					/>
				</p>
			)}

			{quantityCopy && !anyResources && <p className='text-sm text-gray-600'>{t('subscriptions.modifyPreview.noExtraBillingDetails')}</p>}

			{!quantityCopy && !anyResources && <p className='text-sm text-gray-600'>{t('subscriptions.modifyPreview.noBillingChanges')}</p>}
		</div>
	);
};

export default SubscriptionModifyPreviewSummary;
