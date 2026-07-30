import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FlexpriceTable, { ColumnData, TooltipCell } from '@/components/molecules/Table';
import { formatDateWithMilliseconds } from '@/utils/common/format_date';
import EventPropertiesDrawer from '@/components/molecules/Events/EventPropertiesDrawer';
import { Event } from '@/models/Event';

interface Props {
	data: Event[];
}

const EventsTable: FC<Props> = ({ data }) => {
	const { t } = useTranslation('customer-portal');
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const columns: ColumnData[] = [
		{
			title: t('events.columnEventName'),
			render(rowData) {
				return <span>{rowData.event_name || t('events.valuePlaceholder')}</span>;
			},
		},
		{
			title: t('events.columnTimestamp'),
			render(rowData) {
				return <span>{formatDateWithMilliseconds(rowData.timestamp)}</span>;
			},
		},
		{
			title: t('events.columnEventId'),
			render(rowData) {
				return <TooltipCell tooltipContent={rowData.id} tooltipText={rowData.id} />;
			},
		},
		{
			title: t('events.columnProperties'),
			render(rowData) {
				const propertyCount = rowData.properties ? Object.keys(rowData.properties).length : 0;
				return (
					<span className='text-zinc-600'>
						{propertyCount > 0 ? t('events.propertyCount', { count: propertyCount }) : t('events.noProperties')}
					</span>
				);
			},
		},
	];

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
