import { FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FlexpriceTable, { ColumnData, TooltipCell } from '../Table';
import { formatDateWithMilliseconds } from '@/utils/common/format_date';
import EventPropertiesDrawer from './EventPropertiesDrawer';
import { Event } from '@/models/Event';

interface Props {
	data: Event[];
}

const EventsTable: FC<Props> = ({ data }) => {
	const { t } = useTranslation(['developers', 'common']);

	const columns: ColumnData<Event>[] = useMemo(
		() => [
			{
				title: t('labels.eventId'),
				render(rowData) {
					return <TooltipCell tooltipContent={rowData.id} tooltipText={rowData.id} />;
				},
			},
			{
				title: t('labels.eventsName'),
				render(rowData) {
					return <span>{rowData.event_name || t('common:labels.na')}</span>;
				},
			},
			{
				title: t('labels.externalCustomerId'),
				fieldName: 'external_customer_id',
			},
			{
				title: t('labels.source'),
				render(rowData) {
					return <span>{rowData.source || t('common:labels.na')}</span>;
				},
			},
			{
				title: t('labels.timestamp'),
				render(rowData) {
					return <span>{formatDateWithMilliseconds(rowData.timestamp)}</span>;
				},
			},
		],
		[t],
	);

	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const handleRowClick = (event: Event) => {
		setSelectedEvent(event);
		setIsDrawerOpen(true);
	};

	return (
		<div>
			<FlexpriceTable showEmptyRow columns={columns} data={data} onRowClick={handleRowClick} />
			<EventPropertiesDrawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} event={selectedEvent} />
		</div>
	);
};

export default EventsTable;
