import { FC, useState } from 'react';
import { useAttemptFunctions } from 'svix-react';
import { MessageStatus } from 'svix';
import type { MessageAttemptOut } from 'svix';
import { Button, Chip } from '@/components/atoms';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ATTEMPT_STATUS_FILTERS = [
	{ key: 'all', status: undefined },
	{ key: 'succeeded', status: MessageStatus.Success },
	{ key: 'failed', status: MessageStatus.Fail },
] as const;

export type AttemptStatusFilterKey = (typeof ATTEMPT_STATUS_FILTERS)[number]['key'];

export const AttemptStatusFilters: FC<{ active: AttemptStatusFilterKey; onChange: (key: AttemptStatusFilterKey) => void }> = ({
	active,
	onChange,
}) => {
	const { t } = useTranslation('developers');
	return (
		<div className='flex gap-1.5'>
			{ATTEMPT_STATUS_FILTERS.map((f) => (
				<button
					key={f.key}
					onClick={() => onChange(f.key)}
					className={cn(
						'px-3 py-1 text-xs font-medium rounded-md border',
						active === f.key
							? 'bg-surface-inverse text-content-inverse border-surface-inverse'
							: 'bg-surface text-content-tertiary border-border hover:bg-surface-subtle',
					)}>
					{t(`webhooks.endpoints.attempts.filters.${f.key}`)}
				</button>
			))}
		</div>
	);
};

export const AttemptStatusChip: FC<{ status: MessageStatus }> = ({ status }) => {
	const { t } = useTranslation('developers');
	if (status === MessageStatus.Success) return <Chip variant='success' label={t('webhooks.endpoints.attempts.status.succeeded')} />;
	if (status === MessageStatus.Fail) return <Chip variant='failed' label={t('webhooks.endpoints.attempts.status.failed')} />;
	if (status === MessageStatus.Sending) return <Chip variant='info' label={t('webhooks.endpoints.attempts.status.sending')} />;
	if (status === MessageStatus.Pending) return <Chip variant='warning' label={t('webhooks.endpoints.attempts.status.pending')} />;
	return <Chip variant='default' label={t('webhooks.endpoints.attempts.status.unknown')} />;
};

export const AttemptReplayAction: FC<{ msgId: string; endpointId: string; onReplayed: () => void }> = ({
	msgId,
	endpointId,
	onReplayed,
}) => {
	const { t } = useTranslation('developers');
	// useAttemptFunctions only reads `msgId` + `endpointId` off the attempt to POST the resend.
	const { resendAttempt } = useAttemptFunctions({ msgId, endpointId } as MessageAttemptOut);
	const [isResending, setIsResending] = useState(false);

	return (
		<Button
			variant='outline'
			size='sm'
			isLoading={isResending}
			onClick={async (e) => {
				e.stopPropagation();
				setIsResending(true);
				try {
					await resendAttempt();
					toast.success(t('webhooks.endpoints.attempts.replaySuccess'));
					onReplayed();
				} catch {
					toast.error(t('webhooks.endpoints.attempts.replayFailed'));
				} finally {
					setIsResending(false);
				}
			}}>
			<RotateCcw className='w-3.5 h-3.5' />
		</Button>
	);
};
