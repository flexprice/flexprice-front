import { FC, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chip, Dialog, Progress } from '@/components/atoms';
import { GrantState, ENTITLEMENT_GRANT_STATUS } from '@/models/Entitlement';

interface Props {
	state?: GrantState;
	unitLabel?: string;
	featureName?: string;
	/** The usage cell itself, which doubles as the trigger. */
	children: ReactNode;
}

const fmt = (v: string | number) => Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const stamp = (iso: string) =>
	new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * Breaks a cycle total into the windows that produced it. A grant-backed feature
 * bills per window, so "2,000 used against 1,000" only makes sense once you can
 * see which windows went over and by how much.
 *
 * The usage cell is the trigger: a row that has windows behind it is the row you
 * want to open, so a separate control next to it was one target too many.
 * Rows with no windows render the cell untouched rather than as a dead button.
 */
const GrantWindowLedger: FC<Props> = ({ state, unitLabel, featureName, children }) => {
	const { t } = useTranslation('customers');
	const [open, setOpen] = useState(false);

	const windows = state?.windows ?? [];
	if (!windows.length) return <>{children}</>;

	return (
		<>
			<button
				type='button'
				onClick={() => setOpen(true)}
				aria-label={featureName ? t('usageTable.windowsAriaLabel', { feature: featureName }) : t('usageTable.windowsButton')}
				className='-mx-2 -my-1 block w-full rounded-md px-2 py-1 text-left transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-fill'>
				{children}
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
							const usage = Number(w.usage ?? 0);
							const quota = Number(w.quota ?? 0);
							const overage = w.unlimited ? 0 : Math.max(0, usage - quota);
							const pct = w.unlimited || !quota ? 0 : Math.min(100, (usage / quota) * 100);

							return (
								<div key={w.grant_id} className='px-4 py-3'>
									<div className='flex items-baseline justify-between gap-4'>
										<div className='flex items-center gap-2'>
											<span className='text-sm text-content'>{stamp(w.valid_from)}</span>
											{w.is_active && <Chip variant='success' label={t('usageTable.windowOpen')} className='px-1.5 py-0 text-[10px]' />}
										</div>
										<span className='text-sm tabular-nums text-content'>
											{fmt(usage)} <span className='text-content-muted'>/ {w.unlimited ? '∞' : fmt(quota)}</span>
										</span>
									</div>

									{!w.unlimited && (
										<Progress
											value={pct}
											className='mt-2 h-1'
											indicatorColor={overage > 0 || w.status === ENTITLEMENT_GRANT_STATUS.EXHAUSTED ? 'bg-danger' : 'bg-info'}
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
