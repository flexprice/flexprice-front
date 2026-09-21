import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Chip, Dialog, Progress } from '@/components/atoms';
import { GrantState, ENTITLEMENT_GRANT_STATUS } from '@/models/Entitlement';

interface Props {
	state?: GrantState;
	unitLabel?: string;
	featureName?: string;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

const fmt = (v: string | number) => Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const stamp = (iso: string) =>
	new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * Breaks a period total into the allowances that produced it. A grant-backed feature
 * bills per allowance, so "2,000 used against 1,000" only makes sense once you can
 * see which of them went over and by how much.
 *
 * The whole row is the trigger, so this is a controlled dialog the table owns:
 * one instance for the table rather than one per row.
 */
const GrantWindowLedger: FC<Props> = ({ state, unitLabel, featureName, isOpen, onOpenChange }) => {
	const { t } = useTranslation('customers');

	const allowances = state?.allowances ?? [];
	if (!allowances.length) return null;

	return (
		<>
			<Dialog
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				title={featureName ? `${t('usageTable.windowsTitle')} · ${featureName}` : t('usageTable.windowsTitle')}
				description={t('usageTable.windowsDialogDescription')}
				className='w-full max-w-xl'>
				<div className='overflow-hidden rounded-md border border-line'>
					<div className='grid grid-cols-[1fr_auto] gap-4 border-b border-line bg-surface-subtle px-4 py-2'>
						<span className='text-xs font-medium text-content-tertiary'>{t('usageTable.windowsColumnPeriod')}</span>
						<span className='text-xs font-medium text-content-tertiary'>{t('usageTable.windowsColumnUsage')}</span>
					</div>

					<div className='divide-y divide-line'>
						{allowances.map((a) => {
							const usage = Number(a.usage ?? 0);
							const quota = Number(a.quota ?? 0);
							const overage = a.unlimited ? 0 : Math.max(0, usage - quota);
							const pct = a.unlimited || !quota ? 0 : Math.min(100, (usage / quota) * 100);

							return (
								<div key={a.grant_id} className='px-4 py-3'>
									<div className='flex items-baseline justify-between gap-4'>
										<div className='flex items-center gap-2'>
											<span className='text-sm text-content'>{stamp(a.valid_from)}</span>
											{a.is_active && <Chip variant='success' label={t('usageTable.windowOpen')} className='px-1.5 py-0 text-[10px]' />}
										</div>
										<span className='text-sm tabular-nums text-content'>
											{fmt(usage)} <span className='text-content-muted'>/ {a.unlimited ? '∞' : fmt(quota)}</span>
										</span>
									</div>

									{!a.unlimited && (
										<Progress
											value={pct}
											className='mt-2 h-1'
											indicatorColor={overage > 0 || a.status === ENTITLEMENT_GRANT_STATUS.EXHAUSTED ? 'bg-danger' : 'bg-info'}
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
