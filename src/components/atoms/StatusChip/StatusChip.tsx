import { cn } from '@/lib/utils';
import { FC } from 'react';

export type StatusChipTone = 'success' | 'warning' | 'neutral' | 'danger' | 'info';

const TONE_DOT: Record<StatusChipTone, string> = {
	success: 'bg-success-bright',
	warning: 'bg-warning-bright',
	neutral: 'bg-content-zinc-subtle',
	danger: 'bg-danger-bright',
	info: 'bg-info-bright',
};

/** Named Figma statuses map onto the semantic tones. The label stays neutral. */
const STATUS_TONE: Record<string, StatusChipTone> = {
	Active: 'success',
	Paid: 'success',
	Boolean: 'success',
	Advance: 'success',
	Draft: 'warning',
	Trial: 'warning',
	Pending: 'warning',
	Metered: 'warning',
	Arrear: 'warning',
	'Usage Based': 'warning',
	'Usage based': 'warning',
	Inactive: 'neutral',
	Cancelled: 'neutral',
	Overdue: 'neutral',
	Static: 'neutral',
	Failed: 'danger',
	Upcoming: 'info',
	Recurring: 'info',
	Config: 'info',
};

export type StatusChipStatus = keyof typeof STATUS_TONE;

export interface StatusChipProps {
	tone?: StatusChipTone;
	status?: StatusChipStatus | string;
	label?: string;
	className?: string;
}

export function getFeatureTypeTone(type: string): StatusChipTone {
	switch (type.toLowerCase()) {
		case 'boolean':
			return 'success';
		case 'metered':
			return 'warning';
		case 'config':
			return 'info';
		default:
			return 'neutral';
	}
}

/**
 * White Linear-style pill. The coloured dot carries meaning; the label stays primary.
 * Dot size is `--fp-chip-dot` so list and inner-table pills stay in lockstep.
 */
const StatusChip: FC<StatusChipProps> = ({ tone, status, label, className }) => {
	const resolvedTone = tone ?? (status ? STATUS_TONE[status] : undefined) ?? 'neutral';
	const resolvedLabel = label ?? status ?? '';

	return (
		<span
			className={cn(
				'inline-flex max-w-full shrink-0 items-center gap-2 rounded-full border border-line-zinc bg-surface py-1.5 pe-3 ps-2.5',
				className,
			)}>
			<span className={cn('size-[var(--fp-chip-dot)] shrink-0 rounded-full', TONE_DOT[resolvedTone])} aria-hidden />
			<span className='truncate text-[13px] font-medium leading-[18px] text-content-zinc-bold'>{resolvedLabel}</span>
		</span>
	);
};

export default StatusChip;
