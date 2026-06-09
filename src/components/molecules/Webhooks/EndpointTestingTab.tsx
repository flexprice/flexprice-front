import { FC, useMemo, useState } from 'react';
import { useEventTypes, useSvix } from 'svix-react';
import { Button, Card, SearchableSelect } from '@/components/atoms';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface Props {
	endpointId: string;
}

const EndpointTestingTab: FC<Props> = ({ endpointId }) => {
	const { t } = useTranslation('developers');
	const { svix, appId } = useSvix();
	const eventTypes = useEventTypes({ limit: 250 });
	const [selectedEventType, setSelectedEventType] = useState('');
	const [isSending, setIsSending] = useState(false);

	const options = useMemo(
		() => (eventTypes.data ?? []).map((eventType) => ({ value: eventType.name, label: eventType.name })),
		[eventTypes.data],
	);

	const handleSendExample = async () => {
		if (!selectedEventType) return;
		setIsSending(true);
		try {
			await svix.endpoint.sendExample(appId, endpointId, { eventType: selectedEventType });
			toast.success(t('webhooks.endpoints.testing.sendSuccess'));
		} catch {
			toast.error(t('webhooks.endpoints.testing.sendFailed'));
		} finally {
			setIsSending(false);
		}
	};

	return (
		<Card noPadding className='p-4 flex flex-col gap-4'>
			<div>
				<h4 className='text-sm font-medium'>{t('webhooks.endpoints.testing.heading')}</h4>
				<p className='text-sm text-muted-foreground mt-1'>{t('webhooks.endpoints.testing.description')}</p>
				<p className='text-xs text-muted-foreground mt-1'>{t('webhooks.endpoints.testing.note')}</p>
			</div>

			<div className='flex flex-col gap-2'>
				<label className='text-sm font-medium'>{t('webhooks.endpoints.testing.sendEvent')}</label>
				<SearchableSelect
					options={options}
					value={selectedEventType}
					onChange={setSelectedEventType}
					placeholder={t('webhooks.endpoints.testing.selectEventType')}
					className='max-w-sm'
				/>
			</div>

			<div>
				<Button disabled={!selectedEventType || isSending} isLoading={isSending} onClick={handleSendExample}>
					{t('webhooks.endpoints.testing.sendExample')}
				</Button>
			</div>
		</Card>
	);
};

export default EndpointTestingTab;
