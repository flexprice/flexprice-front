import { FC } from 'react';
import { Tooltip } from '@/components/atoms';
import { formatDateTime, formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';

interface Props {
	/** ISO string or Date (svix serializes timestamps to `Date`). */
	value: string | Date;
	className?: string;
}

const toIso = (value: string | Date): string => (typeof value === 'string' ? value : value.toISOString());

/**
 * Renders a granular timestamp (date + time) and reveals the complete timestamp
 * — down to seconds with timezone — in a tooltip on hover.
 */
const WebhookTimestamp: FC<Props> = ({ value, className }) => (
	<Tooltip content={formatDateTimeWithSecondsAndTimezone(value)}>
		<span className={className ?? 'text-sm text-content-muted'}>{formatDateTime(toIso(value))}</span>
	</Tooltip>
);

export default WebhookTimestamp;
