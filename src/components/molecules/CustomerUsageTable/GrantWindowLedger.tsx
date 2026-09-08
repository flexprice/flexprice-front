import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { GrantState, ENTITLEMENT_GRANT_STATUS } from '@/models/Entitlement';
import { cn } from '@/lib/utils';

interface Props {
	state?: GrantState;
	unitLabel?: string;
}

const fmt = (v: string | number) => Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const stamp = (iso: string) =>
	new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * Breaks a cycle total into the windows that produced it. A grant-backed feature
 * bills per window, so "2,000 used against 1,000" only makes sense once you can
 * see which windows went over and by how much.
 */
const GrantWindowLedger: FC<Props> = ({ state, unitLabel }) => {
	const { t } = useTranslation('customers');
	const [open, setOpen] = useState(false);

	const windows = state?.windows ?? [];
	if (!windows.length) return null;

	return (
		<div className='mt-1.5'>
			<button
				type='button'
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className='flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors'>
				{open ? <ChevronDown className='size-3' /> : <ChevronRight className='size-3' />}
				{t('usageTable.windowsToggle', { count: windows.length })}
			</button>

			{open && (
				<div className='mt-2 rounded-md border bg-muted/30 p-2.5'>
					<p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5'>{t('usageTable.windowsTitle')}</p>
					<div className='flex flex-col gap-1'>
						{windows.map((w) => {
							const overage = w.unlimited ? 0 : Math.max(0, Number(w.usage) - Number(w.quota));
							const isOpen = w.is_active;
							return (
								<div key={w.grant_id} className='grid grid-cols-[1fr_auto_auto] gap-3 items-baseline text-xs font-mono'>
									<span className='text-muted-foreground'>
										{stamp(w.valid_from)}
										{isOpen && <span className='ml-1.5 not-italic text-[10px]'>({t('usageTable.windowOpen')})</span>}
									</span>
									<span>
										{fmt(w.usage)} / {w.unlimited ? '∞' : fmt(w.quota)}
									</span>
									<span
										className={cn(
											'text-right min-w-[72px]',
											overage > 0 || w.status === ENTITLEMENT_GRANT_STATUS.EXHAUSTED ? 'text-danger font-medium' : 'text-muted-foreground',
										)}>
										{overage > 0
											? t('usageTable.windowOverage', { amount: `${fmt(overage)}${unitLabel ? ` ${unitLabel}` : ''}` })
											: t('usageTable.windowNone')}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};

export default GrantWindowLedger;
