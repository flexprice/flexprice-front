import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ENTITLEMENT_GRANT_STATUS, GrantState, GrantWindowState } from '@/models/Entitlement';
import { cn } from '@/lib/utils';

interface Props {
	state?: GrantState;
	unitLabel?: string;
}

const fmt = (v: string | number) => Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

/** Short "resets Sep 8 14:28" style stamp; the full ISO lives in the title attribute. */
const stamp = (iso: string) =>
	new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const WindowBar: FC<{ w: GrantWindowState; unitLabel?: string }> = ({ w, unitLabel }) => {
	const { t } = useTranslation('catalog');
	const usage = Number(w.usage ?? 0);
	const quota = Number(w.quota ?? 0);
	const over = !w.unlimited && usage > quota;
	const pct = w.unlimited || quota <= 0 ? 0 : Math.min(100, (usage / quota) * 100);

	return (
		<div className='flex flex-col gap-1 min-w-[190px]'>
			{!w.unlimited && (
				<div className='h-[6px] rounded-full bg-muted overflow-hidden'>
					<div
						className={cn('h-full rounded-full', over ? 'bg-danger' : pct >= 80 ? 'bg-warning' : 'bg-primary')}
						style={{ width: `${pct}%` }}
					/>
				</div>
			)}
			<div className='flex justify-between gap-3 text-xs text-muted-foreground'>
				<span>
					{w.unlimited
						? t('entitlements.grantState.unlimited', { usage: `${fmt(usage)}${unitLabel ? ` ${unitLabel}` : ''}` })
						: t('entitlements.grantState.ofQuota', {
								usage: fmt(usage),
								quota: `${fmt(quota)}${unitLabel ? ` ${unitLabel}` : ''}`,
							})}
				</span>
				<span title={w.valid_to}>
					{w.is_active ? t('entitlements.grantState.resetsAt', { time: stamp(w.valid_to) }) : t('entitlements.grantState.windowClosed')}
				</span>
			</div>
			{/* Allowances never gate requests — the copy must say billed, not blocked. */}
			{w.status === ENTITLEMENT_GRANT_STATUS.EXHAUSTED && (
				<span className='text-xs font-medium text-danger'>
					{t('entitlements.grantState.overBy', { amount: `${fmt(usage - quota)}${unitLabel ? ` ${unitLabel}` : ''}` })}
				</span>
			)}
		</div>
	);
};

/**
 * Live allowance for a grant-backed feature. Renders nothing for features without
 * a grant config, and distinguishes "no window has opened yet" from "zero used" —
 * they are different facts.
 */
const GrantAllowanceMeter: FC<Props> = ({ state, unitLabel }) => {
	const { t } = useTranslation('catalog');
	if (!state) return null;

	// Parallel features hold several independent buckets; additive holds one.
	const open = (state.windows ?? []).filter((w) => w.is_active);

	if (!open.length) {
		const quota = state.cycle_totals?.total_quota;
		return (
			<span className='text-xs italic text-muted-foreground'>
				{t('entitlements.grantState.notStarted', { quota: `${fmt(quota ?? 0)}${unitLabel ? ` ${unitLabel}` : ''}` })}
			</span>
		);
	}

	return (
		<div className='flex flex-col gap-3'>
			{open.map((w) => (
				<WindowBar key={w.grant_id} w={w} unitLabel={unitLabel} />
			))}
		</div>
	);
};

export default GrantAllowanceMeter;
