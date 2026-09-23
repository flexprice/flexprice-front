import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Chip, Dialog, Progress, Tooltip } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import { GrantAllowanceState, ENTITLEMENT_GRANT_STATUS } from '@/models/Entitlement';

interface Props {
	/** The windows to show: one budget's on a parallel feature, the feature's otherwise. */
	allowances: GrantAllowanceState[];
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	/** Sampled when the row was clicked, so every row here agrees on what "now" is. */
	now: number;
}

const fmt = (v: string | number) => Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const stamp = (iso: string) =>
	new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** What the row is doing right now. `status` alone cannot say it: a window that has not begun is not active yet. */
type WindowState = 'scheduled' | 'exhausted' | 'active' | 'closed';

const stateOf = (a: GrantAllowanceState, now: number): WindowState => {
	if (new Date(a.valid_from).getTime() > now) return 'scheduled';
	if (a.status === ENTITLEMENT_GRANT_STATUS.EXHAUSTED) return 'exhausted';
	if (a.is_active) return 'active';
	return 'closed';
};

const CHIP_VARIANT: Record<WindowState, 'default' | 'success' | 'failed'> = {
	scheduled: 'default',
	exhausted: 'failed',
	active: 'success',
	closed: 'default',
};

/**
 * Breaks a period total into the grants that produced it. A grant-backed feature
 * bills per grant, so "2,000 used against 1,000" only makes sense once you can
 * see which of them went over and by how much.
 *
 * The whole row is the trigger, so this is a controlled dialog the table owns:
 * one instance for the table rather than one per row.
 */
const GrantWindowLedger: FC<Props> = ({ allowances, isOpen, onOpenChange, now }) => {
	const { t } = useTranslation('customers');

	const columns: ColumnData<GrantAllowanceState>[] = useMemo(
		() => [
			{
				title: t('usageTable.grantsColumnStart'),
				render: (a) => (
					<Tooltip content={formatDateTimeWithSecondsAndTimezone(a.valid_from)} delayDuration={0} sideOffset={5}>
						<span>{stamp(a.valid_from)}</span>
					</Tooltip>
				),
			},
			{
				title: t('usageTable.grantsColumnEnd'),
				render: (a) => (
					<Tooltip content={formatDateTimeWithSecondsAndTimezone(a.valid_to)} delayDuration={0} sideOffset={5}>
						<span>{stamp(a.valid_to)}</span>
					</Tooltip>
				),
			},
			{
				title: t('usageTable.grantsColumnStatus'),
				render: (a) => {
					const state = stateOf(a, now);
					const chip = <Chip variant={CHIP_VARIANT[state]} label={t(`usageTable.grantState.${state}`)} />;

					// Only exhaustion has something the row does not already show: when it ran out.
					if (state !== 'exhausted' || !a.quota_crossed_at) return chip;
					return (
						<Tooltip content={formatDateTimeWithSecondsAndTimezone(a.quota_crossed_at)} delayDuration={0} sideOffset={5}>
							<span>{chip}</span>
						</Tooltip>
					);
				},
			},
			{
				title: t('usageTable.grantsColumnUsage'),
				render: (a) => {
					const usage = Number(a.usage ?? 0);
					const quota = Number(a.quota ?? 0);

					if (a.unlimited || !quota) {
						return (
							<Progress
								label={t('usageTable.featureTypes.usageProgressUnlimited', { usage: fmt(usage) })}
								value={0}
								className='h-[6px]'
								indicatorColor='bg-info'
								backgroundColor='bg-info-line'
							/>
						);
					}

					const value = Math.ceil((usage / quota) * 100);
					const bar = (
						<Progress
							label={`${fmt(usage)} / ${fmt(quota)}`}
							value={value}
							className='h-[6px]'
							indicatorColor={
								value >= 100 ? 'bg-gradient-to-r from-danger to-danger-soft' : 'bg-gradient-to-r from-accent-indigo-soft to-info'
							}
							backgroundColor={value >= 100 ? 'bg-danger-muted' : 'bg-info-line'}
						/>
					);

					const overage = usage - quota;
					if (overage <= 0) return bar;
					return (
						<Tooltip content={t('usageTable.windowOverage', { amount: fmt(overage) })} delayDuration={0} sideOffset={5}>
							<span className='block'>{bar}</span>
						</Tooltip>
					);
				},
			},
		],
		[now, t],
	);

	if (!allowances.length) return null;

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('usageTable.grantsTitle')}
			description={t('usageTable.grantsTitleHint')}
			className='w-full max-w-2xl'>
			<div className='overflow-hidden rounded-md border border-line'>
				<FlexpriceTable columns={columns} data={allowances} variant='no-bordered' hideBottomBorder />
			</div>
		</Dialog>
	);
};

export default GrantWindowLedger;
