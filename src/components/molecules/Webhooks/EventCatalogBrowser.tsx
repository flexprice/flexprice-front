import { FC, useMemo, useState } from 'react';
import { useEventTypes } from 'svix-react';
import { Input, Loader } from '@/components/atoms';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { groupEventTypesByPrefix } from './eventTypeGroups';

const EventCatalogBrowser: FC = () => {
	const { t } = useTranslation('developers');
	const eventTypes = useEventTypes({ limit: 250 });
	const [search, setSearch] = useState('');
	const [activeGroup, setActiveGroup] = useState<string | null>(null);

	const groups = useMemo(() => groupEventTypesByPrefix(eventTypes.data ?? []), [eventTypes.data]);

	const filteredGroups = useMemo(() => {
		if (!search) return groups;
		return groups.filter((group) => group.name.toLowerCase().includes(search.toLowerCase()));
	}, [groups, search]);

	const visibleEvents = useMemo(() => {
		if (!activeGroup) return eventTypes.data ?? [];
		return groups.find((group) => group.name === activeGroup)?.eventTypes ?? [];
	}, [activeGroup, groups, eventTypes.data]);

	if (eventTypes.loading && !eventTypes.data) {
		return (
			<div className='flex h-64 items-center justify-center'>
				<Loader />
			</div>
		);
	}

	if (eventTypes.error) {
		return <div className='p-4 text-sm text-danger'>{t('webhooks.eventCatalog.loadFailed')}</div>;
	}

	return (
		<div className='grid grid-cols-[260px_1fr] gap-8'>
			<div className='flex flex-col gap-3'>
				<h3 className='text-lg font-medium'>{t('webhooks.eventCatalog.heading')}</h3>
				<Input placeholder={t('webhooks.eventCatalog.filterPlaceholder')} value={search} onChange={setSearch} />
				<div className='flex flex-col divide-y divide-border border rounded-md'>
					<button
						onClick={() => setActiveGroup(null)}
						className={cn(
							'flex items-center justify-between px-3 py-2 text-sm text-start',
							activeGroup === null ? 'bg-surface-subtle font-medium' : 'text-content-tertiary hover:bg-surface-subtle',
						)}>
						{t('webhooks.eventCatalog.allEvents')}
					</button>
					{filteredGroups.map((group) => (
						<button
							key={group.name}
							onClick={() => setActiveGroup(group.name)}
							className={cn(
								'flex items-center justify-between px-3 py-2 text-sm text-start',
								activeGroup === group.name ? 'bg-surface-subtle font-medium' : 'text-content-tertiary hover:bg-surface-subtle',
							)}>
							<span>{group.name}</span>
							<span className='text-xs text-content-subtle'>{group.eventTypes.length}</span>
						</button>
					))}
				</div>
			</div>

			<div className='flex flex-col divide-y divide-border'>
				{visibleEvents.length === 0 && <p className='text-sm text-content-muted py-6'>{t('webhooks.eventCatalog.empty')}</p>}
				{visibleEvents.map((eventType) => (
					<div key={eventType.name} className='py-4'>
						<div className='font-medium text-sm'>{eventType.name}</div>
						{eventType.description && <p className='text-sm text-content-muted mt-1'>{eventType.description}</p>}
					</div>
				))}
			</div>
		</div>
	);
};

export default EventCatalogBrowser;
