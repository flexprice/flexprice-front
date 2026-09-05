import { useMemo } from 'react';
// Direct file imports, NOT the '@/components/atoms' barrel — that barrel also re-exports
// ErrorBoundary, which imports '@/core/routes/Routes' and drags the whole dashboard router (and
// every lazy-loaded page behind it) into this exported widget's bundle.
import Card from '@/components/atoms/Card/Card';
import Progress from '@/components/atoms/Progress/Progress';
import { formatAmount } from '@/components/atoms/Input/Input';
import { cn } from '@/lib/utils';
import { useUsageT } from '../i18n';
import { normalizeUsageQuotaItems } from '../schema';
import type { UsageQuotaProps } from '../types';

/**
 * Prop-only usage-quota list — no fetching, no auth, no PortalConfigContext. Renders a progress
 * bar per metered entitlement. Consumers supply already-adapted `items` (see `adaptUsageQuotaItems`).
 */
const UsageQuota = ({ items: rawItems, label, className }: UsageQuotaProps) => {
	const items = useMemo(() => normalizeUsageQuotaItems(rawItems), [rawItems]);
	const t = useUsageT();

	// Hidden rather than explained when there is nothing to show. An absent quota is
	// a fact about the plan, not a transient empty — a customer whose plan has no
	// metered features will never see one, so a permanent placeholder card is noise
	// on every visit. The period-scoped widgets (trend, breakdown) do explain
	// themselves, because theirs can fill in.
	if (items.length === 0) return null;

	return (
		<Card noPadding className={cn('flexprice-ui', 'rounded-xl overflow-hidden bg-surface', className)}>
			<div className='p-6 border-b border-line'>
				<h3 className='text-base font-medium text-content'>{label || t('usageWidgets.quotaTitle')}</h3>
			</div>
			<div className='p-6 space-y-4'>
				{items.map((item) => {
					// `item.limit` truthiness would treat a real 0 limit (e.g. a zero-quota entitlement)
					// as absent — check `null` explicitly so zero stays a finite, over-limit-capable quota.
					const hasFiniteLimit = !item.isUnlimited && item.limit !== null;
					const percentage =
						hasFiniteLimit && item.limit! > 0
							? Math.min(Math.ceil((item.currentUsage / item.limit!) * 100), 100)
							: item.currentUsage > 0
								? 100
								: 0;
					const isOverLimit = hasFiniteLimit && item.currentUsage > item.limit!;
					return (
						<div key={item.id} className='space-y-2'>
							<div className='flex items-center justify-between'>
								<span className='text-sm text-content'>{item.name || t('usageWidgets.unknownFeature')}</span>
								<span className='text-sm text-content-secondary'>
									{formatAmount(item.currentUsage.toString())}
									{hasFiniteLimit ? ` / ${formatAmount(item.limit!.toString())}` : ` / ${t('usageWidgets.unlimited')}`}
								</span>
							</div>
							<Progress
								value={item.isUnlimited ? 0 : percentage}
								className='h-2'
								indicatorColor={isOverLimit ? 'bg-destructive' : undefined}
								backgroundColor={isOverLimit ? 'bg-destructive/10' : undefined}
							/>
						</div>
					);
				})}
			</div>
		</Card>
	);
};

export default UsageQuota;
