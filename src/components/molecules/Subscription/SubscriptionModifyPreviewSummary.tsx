import type { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { SubscriptionModifyResponse } from '@/types/dto/Subscription';
import {
	buildBillingImpactRows,
	buildLineItemChangeRows,
	formatLineItemRowPrice,
	hasAnyChangedResources,
	type QuantityChangePreviewContext,
} from '@/utils/subscription/subscriptionModifyPreviewPresentation';

export interface SubscriptionModifyPreviewSummaryProps {
	data: SubscriptionModifyResponse | null;
	/** When set (line item modify dialog), supplies the before/after price for the line item table. */
	quantityChangeContext?: QuantityChangePreviewContext;
}

const SubscriptionModifyPreviewSummary: FC<SubscriptionModifyPreviewSummaryProps> = ({ data, quantityChangeContext }) => {
	const { t } = useTranslation(['billing', 'common']);

	if (!data) {
		return <p className='text-sm text-content-muted'>{t('subscriptions.modifyPreview.noData')}</p>;
	}

	const lineItems = data.changed_resources?.line_items ?? [];
	const subscriptions = data.changed_resources?.subscriptions ?? [];
	const invoices = data.changed_resources?.invoices ?? [];

	const anyResources = hasAnyChangedResources(lineItems, subscriptions, invoices);

	const billingRows = buildBillingImpactRows(invoices, data.subscription?.latest_invoice ?? null);
	const lineRows = buildLineItemChangeRows(lineItems);

	const showLineSection = lineRows.length > 0;
	const showPriceColumn = quantityChangeContext?.previousAmount !== undefined;
	const showBillingSection = billingRows.length > 0;
	const showDividerBeforeBilling = showBillingSection && showLineSection;

	return (
		<div className='space-y-4 text-sm text-content-heading'>
			{showLineSection && (
				<table className='w-full text-left'>
					<thead>
						<tr className='border-b border-line-subtle text-xs text-content-muted'>
							<th className='pb-2 pr-6 font-normal'>{t('subscriptions.modifyPreview.columnType')}</th>
							<th className='pb-2 pr-6 font-normal'>{t('subscriptions.modifyPreview.columnQty')}</th>
							{showPriceColumn && <th className='pb-2 pr-6 font-normal'>{t('subscriptions.modifyPreview.columnPrice')}</th>}
							<th className='pb-2 font-normal'>{t('subscriptions.modifyPreview.columnPeriod')}</th>
						</tr>
					</thead>
					<tbody>
						{/* Preview returns placeholder ids like "(preview-ended)", so key by position too. */}
						{lineRows.map((row, index) => (
							<tr key={`${row.id}-${index}`}>
								<td className='whitespace-nowrap py-2 pr-6 text-content-tertiary'>{row.label}</td>
								<td className='py-2 pr-6 tabular-nums text-content'>{row.quantityDisplay}</td>
								{showPriceColumn && (
									<td className='whitespace-nowrap py-2 pr-6 tabular-nums text-content'>
										{formatLineItemRowPrice(row.kind, quantityChangeContext)}
									</td>
								)}
								<td className='py-2 text-content-tertiary'>{row.periodDisplay ?? t('common:labels.na')}</td>
							</tr>
						))}
					</tbody>
				</table>
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

			{quantityChangeContext && !anyResources && (
				<p className='text-sm text-content-tertiary'>{t('subscriptions.modifyPreview.noExtraBillingDetails')}</p>
			)}

			{!quantityChangeContext && !anyResources && (
				<p className='text-sm text-content-tertiary'>{t('subscriptions.modifyPreview.noBillingChanges')}</p>
			)}
		</div>
	);
};

export default SubscriptionModifyPreviewSummary;
