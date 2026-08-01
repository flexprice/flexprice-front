import { FC, useState } from 'react';
import { useAttemptedMessages } from 'svix-react';
import type { EndpointMessageOut } from 'svix';
import { Loader, NoDataCard } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { useTranslation } from 'react-i18next';
import WebhookTimestamp from './WebhookTimestamp';
import {
	AttemptStatusChip,
	AttemptReplayAction,
	ATTEMPT_STATUS_FILTERS,
	AttemptStatusFilterKey,
	AttemptStatusFilters,
} from './AttemptStatus';

interface Props {
	endpointId: string;
	onSelectMessage: (messageId: string) => void;
}

const MessageAttemptsSection: FC<Props> = ({ endpointId, onSelectMessage }) => {
	const { t } = useTranslation('developers');
	const [filter, setFilter] = useState<AttemptStatusFilterKey>('all');
	const activeFilter = ATTEMPT_STATUS_FILTERS.find((f) => f.key === filter) ?? ATTEMPT_STATUS_FILTERS[0];

	// Messages delivered to this endpoint, each carrying `eventType` plus the latest attempt status.
	// (Sourcing the event type from the message directly avoids relying on the attempts endpoint
	// embedding the full message, which it does not always do.)
	const attempts = useAttemptedMessages(endpointId, { status: activeFilter.status, limit: 25 });

	const columns: ColumnData<EndpointMessageOut>[] = [
		{
			title: t('webhooks.endpoints.attempts.columns.status'),
			render: (row) => <AttemptStatusChip status={row.status} />,
		},
		{
			title: t('webhooks.endpoints.attempts.columns.eventType'),
			render: (row) => row.eventType || t('labels.missingValue'),
		},
		{
			title: t('webhooks.endpoints.attempts.columns.messageId'),
			render: (row) => <span className='font-mono text-xs'>{row.id}</span>,
		},
		{
			title: t('webhooks.endpoints.attempts.columns.timestamp'),
			render: (row) => <WebhookTimestamp value={row.timestamp} />,
		},
		{
			title: t('webhooks.endpoints.attempts.columns.replay'),
			align: 'right',
			render: (row) => <AttemptReplayAction msgId={row.id} endpointId={endpointId} onReplayed={attempts.reload} />,
		},
	];

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex items-center justify-between'>
				<h4 className='text-sm font-medium'>{t('webhooks.endpoints.attempts.heading')}</h4>
				<AttemptStatusFilters active={filter} onChange={setFilter} />
			</div>

			{attempts.loading && !attempts.data ? (
				<div className='flex h-40 items-center justify-center'>
					<Loader />
				</div>
			) : attempts.error ? (
				<div className='p-4 text-sm text-danger'>{t('webhooks.endpoints.attempts.loadFailed')}</div>
			) : attempts.data?.length ? (
				<FlexpriceTable columns={columns} data={attempts.data} onRowClick={(row) => onSelectMessage(row.id)} />
			) : (
				<NoDataCard title={t('webhooks.endpoints.attempts.empty.title')} subtitle={t('webhooks.endpoints.attempts.empty.subtitle')} />
			)}
		</div>
	);
};

export default MessageAttemptsSection;
