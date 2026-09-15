import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { History } from 'lucide-react';
import { Chip, Dialog, Progress } from '@/components/atoms';
import { GrantState, ENTITLEMENT_GRANT_STATUS } from '@/models/Entitlement';
import { cn } from '@/lib/utils';

interface Props {
	state?: GrantState;
	unitLabel?: string;
	featureName?: string;
}

const fmt = (v: string | number) => Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const stamp = (iso: string) =>
	new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * Breaks a cycle total into the windows that produced it. A grant-backed feature
 * bills per window, so "2,000 used against 1,000" only makes sense once you can
 * see which windows went over and by how much.
 *
 * In a dialog rather than inline: a table row is a scannable summary, and an
 * expanded ledger pushed every other row off the screen.
 */
const GrantWindowLedger: FC<Props> = ({ state, unitLabel, featureName }) => {
	const { t } = useTranslation('customers');
	const [open, setOpen] = useState(false);

	const windows = state?.windows ?? [];
	if (!windows.length) return null;

	return (
		<>
			<button
				type='button'
				onClick={() => setOpen(true)}
				className='mt-1.5 flex items-center gap-1.5 text-xs text-content-muted transition-colors hover:text-content'>
				<History className='size-3.5' />
				{t('usageTable.windowsButton')}
			</button>

			<Dialog
				isOpen={open}
				onOpenChange={setOpen}
				title={featureName ? `${t('usageTable.windowsTitle')} · ${featureName}` : t('usageTable.windowsTitle')}
				description={t('usageTable.windowsDialogDescription')}
				className='w-full max-w-xl'>
				<div className='overflow-hidden rounded-md border border-line'>
					<div className='grid grid-cols-[1fr_auto] gap-4 border-b border-line bg-surface-subtle px-4 py-2'>
						<span className='text-xs font-medium text-content-tertiary'>{t('usageTable.windowsColumnPeriod')}</span>
						<span className='text-xs font-medium text-content-tertiary'>{t('usageTable.windowsColumnUsage')}</span>
					</div>

					<div className='divide-y divide-line'>
						{windows.map((w) => {
							// A replaced window was re-issued after an edit and never reaches an
							// invoice, so showing it as overage would misread as money owed.
							const replaced = w.status === ENTITLEMENT_GRANT_STATUS.SUPERSEDED;
							const usage = Number(w.usage ?? 0);
							const quota = Number(w.quota ?? 0);
							const overage = replaced || w.unlimited ? 0 : Math.max(0, usage - quota);
							const pct = w.unlimited || !quota ? 0 : Math.min(100, (usage / quota) * 100);

							return (
								<div key={w.grant_id} className={cn('px-4 py-3', replaced && 'bg-surface-subtle/50')}>
									<div className='flex items-baseline justify-between gap-4'>
										<div className='flex items-center gap-2'>
											<span className={cn('text-sm', replaced ? 'text-content-muted' : 'text-content')}>{stamp(w.valid_from)}</span>
											{w.is_active && <Chip variant='success' label={t('usageTable.windowOpen')} className='px-1.5 py-0 text-[10px]' />}
											{replaced && <Chip variant='default' label={t('usageTable.windowReplaced')} className='px-1.5 py-0 text-[10px]' />}
										</div>
										<span className={cn('text-sm tabular-nums', replaced ? 'text-content-muted' : 'text-content')}>
											{fmt(usage)} <span className='text-content-muted'>/ {w.unlimited ? '∞' : fmt(quota)}</span>
										</span>
									</div>

									{!w.unlimited && (
										<Progress
											value={pct}
											className='mt-2 h-1'
											indicatorColor={overage > 0 ? 'bg-danger' : replaced ? 'bg-line-strong' : 'bg-info'}
											backgroundColor='bg-line'
										/>
									)}

									{overage > 0 && (
										<p className='mt-1.5 text-xs font-medium text-danger'>
											{t('usageTable.windowOverage', { amount: `${fmt(overage)}${unitLabel ? ` ${unitLabel}` : ''}` })}
										</p>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</Dialog>
		</>
	);
};

export default GrantWindowLedger;
