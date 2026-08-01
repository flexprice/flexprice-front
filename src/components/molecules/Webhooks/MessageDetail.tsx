import { FC, useState } from 'react';
import { useMessage, useMessageAttempts } from 'svix-react';
import type { MessageAttemptOut } from 'svix';
import { Button, Loader, NoDataCard, Toggle } from '@/components/atoms';
import CodeBlock from '@/components/atoms/CodeBlock';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import WebhookTimestamp from './WebhookTimestamp';
import {
	AttemptStatusChip,
	AttemptReplayAction,
	ATTEMPT_STATUS_FILTERS,
	AttemptStatusFilterKey,
	AttemptStatusFilters,
} from './AttemptStatus';

interface Props {
	messageId: string;
	backLabel: string;
	onBack: () => void;
}

const SVIX_ID_HEADER = 'svix-id';
const SVIX_TIMESTAMP_HEADER = 'svix-timestamp';

const DetailRow: FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono = true }) => (
	<div className='grid grid-cols-[180px_1fr] gap-4 py-3 border-b border-border last:border-b-0'>
		<span className='text-xs font-medium tracking-wide text-content-muted uppercase'>{label}</span>
		<span className={mono ? 'font-mono text-sm text-content-secondary break-all' : 'text-sm text-content-secondary break-all'}>
			{value}
		</span>
	</div>
);

const AttemptRow: FC<{ attempt: MessageAttemptOut; onReplayed: () => void }> = ({ attempt, onReplayed }) => {
	const { t } = useTranslation('developers');
	const [expanded, setExpanded] = useState(false);

	return (
		<div className='border border-border rounded-md overflow-hidden'>
			<button
				type='button'
				className='w-full flex items-center gap-3 px-3 py-3 text-start hover:bg-surface-subtle'
				onClick={() => setExpanded((e) => !e)}>
				{expanded ? (
					<ChevronDown className='w-4 h-4 shrink-0 text-content-subtle' />
				) : (
					<ChevronRight className='w-4 h-4 shrink-0 text-content-subtle' />
				)}
				<div className='w-28 shrink-0'>
					<AttemptStatusChip status={attempt.status} />
				</div>
				<span className='flex-1 min-w-0 truncate font-mono text-xs text-content-tertiary'>{attempt.url}</span>
				<span className='shrink-0'>
					<WebhookTimestamp value={attempt.timestamp} />
				</span>
				<div onClick={(e) => e.stopPropagation()}>
					<AttemptReplayAction msgId={attempt.msgId} endpointId={attempt.endpointId} onReplayed={onReplayed} />
				</div>
			</button>
			{expanded && (
				<div className='px-3 pb-3 border-t border-border'>
					<DetailRow label={t('webhooks.messages.attempts.httpResponseCode')} value={String(attempt.responseStatusCode)} />
					{attempt.response && <DetailRow label={t('webhooks.messages.attempts.response')} value={attempt.response} />}
					<div className='py-3'>
						<span className='text-xs font-medium tracking-wide text-content-muted uppercase'>
							{t('webhooks.messages.attempts.webhookHeaders')}
						</span>
						<div className='mt-2 flex flex-col'>
							<DetailRow label={SVIX_ID_HEADER} value={attempt.msgId} />
							<DetailRow label={SVIX_TIMESTAMP_HEADER} value={String(Math.floor(new Date(attempt.timestamp).getTime() / 1000))} />
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

const MessageDetail: FC<Props> = ({ messageId, backLabel, onBack }) => {
	const { t } = useTranslation(['developers', 'common']);
	const message = useMessage(messageId);
	const [showRaw, setShowRaw] = useState(false);
	const [filter, setFilter] = useState<AttemptStatusFilterKey>('all');
	const activeFilter = ATTEMPT_STATUS_FILTERS.find((f) => f.key === filter) ?? ATTEMPT_STATUS_FILTERS[0];
	const attempts = useMessageAttempts(messageId, { status: activeFilter.status });

	if (message.loading && !message.data) {
		return (
			<div className='flex h-64 items-center justify-center'>
				<Loader />
			</div>
		);
	}

	if (message.error || !message.data) {
		return <div className='p-4 text-sm text-danger'>{t('webhooks.messages.loadFailed')}</div>;
	}

	const content = message.data.payload;

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex items-center gap-1.5 text-sm text-content-muted'>
				<button className='hover:text-content' onClick={onBack}>
					{backLabel}
				</button>
				<ChevronRight className='w-3.5 h-3.5' />
				<span className='text-content font-medium font-mono'>{messageId}</span>
			</div>

			<div className='grid grid-cols-[1fr_260px] gap-8'>
				<div className='flex flex-col gap-2 min-w-0'>
					<h3 className='text-lg font-medium'>{message.data.eventType}</h3>

					<div className='flex items-center justify-between mt-2'>
						<h4 className='text-sm font-medium'>{t('webhooks.messages.content')}</h4>
						<Toggle checked={showRaw} onChange={setShowRaw} label={t('webhooks.messages.raw')} />
					</div>
					<div className='border border-border rounded-md overflow-hidden'>
						<CodeBlock language='json' code={showRaw ? JSON.stringify(content) : JSON.stringify(content, null, 2)} />
					</div>
				</div>

				<div className='flex flex-col gap-4'>
					<div>
						<h4 className='text-sm font-medium text-content-muted'>{t('webhooks.messages.createdAt')}</h4>
						<p className='text-sm mt-1'>
							<WebhookTimestamp value={message.data.timestamp} className='text-sm' />
						</p>
					</div>
				</div>
			</div>

			<div className='flex flex-col gap-3 border-t border-border pt-6'>
				<div className='flex items-center justify-between'>
					<h4 className='text-sm font-medium'>{t('webhooks.messages.attempts.heading')}</h4>
					<div className='flex items-center gap-2'>
						<Button variant='outline' size='icon' aria-label={t('common:actions.refresh')} onClick={() => attempts.reload()}>
							<RefreshCw className='w-4 h-4' />
						</Button>
						<AttemptStatusFilters active={filter} onChange={setFilter} />
					</div>
				</div>

				{attempts.loading && !attempts.data ? (
					<div className='flex h-32 items-center justify-center'>
						<Loader />
					</div>
				) : attempts.data?.length ? (
					<div className='flex flex-col gap-2'>
						{attempts.data.map((attempt) => (
							<AttemptRow key={attempt.id} attempt={attempt} onReplayed={attempts.reload} />
						))}
					</div>
				) : (
					<NoDataCard title={t('webhooks.messages.attempts.emptyTitle')} subtitle={t('webhooks.messages.attempts.empty')} />
				)}
			</div>
		</div>
	);
};

export default MessageDetail;
