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
	active: 'success',
	paid: 'success',
	boolean: 'success',
	advance: 'success',
	draft: 'warning',
	trial: 'warning',
	pending: 'warning',
	metered: 'warning',
	arrear: 'warning',
	'usage based': 'warning',
	inactive: 'neutral',
	cancelled: 'neutral',
	overdue: 'neutral',
	static: 'neutral',
	failed: 'danger',
	upcoming: 'info',
	recurring: 'info',
	config: 'info',
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
	const resolvedTone = tone ?? (status ? STATUS_TONE[status.toLowerCase()] : undefined) ?? 'neutral';
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
