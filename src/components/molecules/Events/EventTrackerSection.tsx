import { FC } from 'react';
import { GetEventDebugResponse, DebugTrackerStatus } from '@/types/dto';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/atoms';
import EventTrackerStep from './EventTrackerStep';
import JsonCodeBlock from './JsonCodeBlock';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface EventTrackerSectionProps {
	debugResponse: GetEventDebugResponse;
	displayEventTimestamp?: string;
}

const EventTrackerSection: FC<EventTrackerSectionProps> = ({ debugResponse, displayEventTimestamp }) => {
	const { t } = useTranslation(['developers', 'common']);
	const tracker = debugResponse.debug_tracker;

	const steps: Array<{
		key: string;
		title: string;
		status: DebugTrackerStatus;
		value: unknown;
	}> = [
		{
			key: 'customer_lookup',
			title: t('events.tracker.customerLookup'),
			status: tracker?.customer_lookup?.status ?? 'unprocessed',
			value: tracker?.customer_lookup ?? {},
		},
		{
			key: 'meter_lookup',
			title: t('events.tracker.featureLookup'),
			status: tracker?.meter_matching?.status ?? 'unprocessed',
			value: tracker?.meter_matching ?? {},
		},
		{
			key: 'price_lookup',
			title: t('events.tracker.priceLookup'),
			status: tracker?.price_lookup?.status ?? 'unprocessed',
			value: tracker?.price_lookup ?? {},
		},
		{
			key: 'subscription_line_item_lookup',
			title: t('events.tracker.subscriptionLineItemLookup'),
			status: tracker?.subscription_line_item_lookup?.status ?? 'unprocessed',
			value: tracker?.subscription_line_item_lookup ?? {},
		},
	];

	return (
		<div className='space-y-0'>
			<div className='relative'>
				<div className='absolute left-3 top-2 bottom-2 w-px bg-gray-100' />

				<div className='mb-4'>
					<EventTrackerStep title={t('events.tracker.ingested')} stepKey='ingested' isIngested={true} timestamp={displayEventTimestamp} />
				</div>

				<Accordion type='single' collapsible className='border-none'>
					{steps.map((s) => (
						<AccordionItem key={s.key} value={s.key} className='border-b-0'>
							<AccordionTrigger className='py-2 hover:no-underline px-0'>
								<EventTrackerStep title={s.title} status={s.status} stepKey={s.key} />
							</AccordionTrigger>
							<AccordionContent className='pl-0'>
								<div className='ml-[40px] relative z-10 mt-3'>
									<JsonCodeBlock
										value={s.value}
										title={t('labels.response')}
										onCopy={() => {
											navigator.clipboard.writeText(JSON.stringify(s.value ?? {}, null, 2));
											toast.success(t('common:toast.copySuccess'));
										}}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
					))}

					{tracker?.attributed_to_customer && (
						<AccordionItem value='attributed_to_customer' className='border-b-0'>
							<AccordionTrigger className='py-2 hover:no-underline px-0'>
								<EventTrackerStep
									title={t('events.tracker.attributedToCustomer')}
									stepKey='attributed_to_customer'
									status={tracker.attributed_to_customer.status}
								/>
							</AccordionTrigger>
							<AccordionContent className='pl-0'>
								<div className='ml-[40px] relative z-10 mt-3'>
									<JsonCodeBlock
										value={tracker.attributed_to_customer}
										title={t('labels.response')}
										onCopy={() => {
											navigator.clipboard.writeText(JSON.stringify(tracker.attributed_to_customer ?? {}, null, 2));
											toast.success(t('common:toast.copySuccess'));
										}}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
					)}
				</Accordion>
			</div>
		</div>
	);
};

export default EventTrackerSection;
