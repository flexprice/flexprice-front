import { FC, useState } from 'react';
import { useEndpointMessageAttempts } from 'svix-react';
import type { MessageAttemptOut } from 'svix';
import { Loader, NoDataCard } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { useTranslation } from 'react-i18next';
import formatDate from '@/utils/common/format_date';
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

	const attempts = useEndpointMessageAttempts(endpointId, { status: activeFilter.status, withMsg: true, limit: 25 });

	const columns: ColumnData<MessageAttemptOut>[] = [
		{
			title: t('webhooks.endpoints.attempts.columns.status'),
			render: (row) => <AttemptStatusChip status={row.status} />,
		},
		{
			title: t('webhooks.endpoints.attempts.columns.eventType'),
			render: (row) => row.msg?.eventType ?? t('labels.missingValue'),
		},
		{
			title: t('webhooks.endpoints.attempts.columns.messageId'),
			render: (row) => <span className='font-mono text-xs'>{row.msgId}</span>,
		},
		{
			title: t('webhooks.endpoints.attempts.columns.timestamp'),
			render: (row) => <span className='text-sm text-gray-500'>{formatDate(row.timestamp)}</span>,
		},
		{
			title: t('webhooks.endpoints.attempts.columns.replay'),
			align: 'right',
			render: (row) => <AttemptReplayAction attempt={row} onReplayed={attempts.reload} />,
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
				<div className='p-4 text-sm text-red-600'>{t('webhooks.endpoints.attempts.loadFailed')}</div>
			) : attempts.data?.length ? (
				<FlexpriceTable columns={columns} data={attempts.data} onRowClick={(row) => onSelectMessage(row.msgId)} />
			) : (
				<NoDataCard title={t('webhooks.endpoints.attempts.empty.title')} subtitle={t('webhooks.endpoints.attempts.empty.subtitle')} />
			)}
		</div>
	);
};

export default MessageAttemptsSection;
