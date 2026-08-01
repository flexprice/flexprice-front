import { FC, useState } from 'react';
import { useMessages } from 'svix-react';
import type { MessageOut } from 'svix';
import { Button, Loader, NoDataCard } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import MessageDetail from './MessageDetail';
import WebhookTimestamp from './WebhookTimestamp';

const MessageLogsTable: FC = () => {
	const { t } = useTranslation(['developers', 'common']);
	const messages = useMessages({ limit: 50 });
	const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

	if (selectedMessageId) {
		return <MessageDetail messageId={selectedMessageId} backLabel={t('webhooks.logs.heading')} onBack={() => setSelectedMessageId(null)} />;
	}

	const columns: ColumnData<MessageOut>[] = [
		{
			title: t('webhooks.logs.columns.eventType'),
			fieldName: 'eventType',
		},
		{
			title: t('webhooks.logs.columns.messageId'),
			render: (row) => <span className='font-mono text-xs'>{row.id}</span>,
		},
		{
			title: t('webhooks.logs.columns.timestamp'),
			align: 'right',
			render: (row) => <WebhookTimestamp value={row.timestamp} />,
		},
	];

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex items-center justify-between'>
				<h3 className='text-lg font-medium'>{t('webhooks.logs.heading')}</h3>
				<Button variant='outline' prefixIcon={<RefreshCw className='w-4 h-4' />} onClick={() => messages.reload()}>
					{t('common:actions.refresh')}
				</Button>
			</div>

			{messages.loading && !messages.data ? (
				<div className='flex h-64 items-center justify-center'>
					<Loader />
				</div>
			) : messages.error ? (
				<div className='p-4 text-sm text-danger'>{t('webhooks.logs.loadFailed')}</div>
			) : messages.data?.length ? (
				<FlexpriceTable columns={columns} data={messages.data} onRowClick={(row) => setSelectedMessageId(row.id)} />
			) : (
				<NoDataCard title={t('webhooks.logs.empty.title')} subtitle={t('webhooks.logs.empty.subtitle')} />
			)}

			{(messages.hasPrevPage || messages.hasNextPage) && (
				<div className='flex justify-end gap-2'>
					<Button variant='outline' disabled={!messages.hasPrevPage} onClick={messages.prevPage}>
						{t('common:pagination.previous')}
					</Button>
					<Button variant='outline' disabled={!messages.hasNextPage} onClick={messages.nextPage}>
						{t('common:pagination.next')}
					</Button>
				</div>
			)}
		</div>
	);
};

export default MessageLogsTable;
