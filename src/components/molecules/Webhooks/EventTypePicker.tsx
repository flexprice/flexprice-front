import { FC, useEffect, useMemo, useState } from 'react';
import { useEventTypes } from 'svix-react';
import type { EventTypeOut } from 'svix';
import { Checkbox, Input, Loader } from '@/components/atoms';
import { useTranslation } from 'react-i18next';
import { groupEventTypesByPrefix } from './eventTypeGroups';

const PAGE_SIZE = 250;

interface Props {
	selected: string[];
	onChange: (selected: string[]) => void;
	className?: string;
}

const EventTypePicker: FC<Props> = ({ selected, onChange, className }) => {
	const { t } = useTranslation('developers');
	const { data, loading, error, hasNextPage, nextPage } = useEventTypes({ limit: PAGE_SIZE });
	const [allEventTypes, setAllEventTypes] = useState<EventTypeOut[]>([]);
	const [search, setSearch] = useState('');

	useEffect(() => {
		if (!data) return;
		setAllEventTypes((prev) => {
			const merged = [...prev];
			let changed = false;
			for (const item of data) {
				if (!merged.some((existing) => existing.name === item.name)) {
					merged.push(item);
					changed = true;
				}
			}
			return changed ? merged : prev;
		});
	}, [data]);

	useEffect(() => {
		if (hasNextPage && !loading && !error) {
			nextPage();
		}
	}, [data, error, hasNextPage, loading, nextPage]);

	const groups = useMemo(() => groupEventTypesByPrefix(allEventTypes), [allEventTypes]);
	const filteredGroups = useMemo(() => {
		if (!search) return groups;
		const query = search.toLowerCase();
		return groups
			.map((group) => ({ ...group, eventTypes: group.eventTypes.filter((e) => e.name.toLowerCase().includes(query)) }))
			.filter((group) => group.eventTypes.length > 0 || group.name.toLowerCase().includes(query));
	}, [groups, search]);

	const toggleEvent = (name: string) => {
		onChange(selected.includes(name) ? selected.filter((e) => e !== name) : [...selected, name]);
	};

	const toggleGroup = (groupEvents: string[], allSelected: boolean) => {
		onChange(allSelected ? selected.filter((e) => !groupEvents.includes(e)) : [...new Set([...selected, ...groupEvents])]);
	};

	if (error && allEventTypes.length === 0) {
		return <div className='p-4 text-sm text-danger'>{t('webhooks.eventCatalog.loadFailed')}</div>;
	}

	const isInitialLoading = loading && allEventTypes.length === 0;

	return (
		<div className={className}>
			<Input placeholder={t('webhooks.endpoints.form.searchEventsPlaceholder')} value={search} onChange={setSearch} />
			{isInitialLoading ? (
				<div className='flex h-64 items-center justify-center mt-3'>
					<Loader />
				</div>
			) : (
				<div className='border rounded-md divide-y divide-border max-h-80 overflow-y-auto mt-3'>
					{filteredGroups.map((group) => {
						const groupEventNames = group.eventTypes.map((e) => e.name);
						const allSelected = groupEventNames.length > 0 && groupEventNames.every((name) => selected.includes(name));
						return (
							<div key={group.name} className='p-3'>
								<Checkbox
									id={`group-${group.name}`}
									checked={allSelected}
									onCheckedChange={() => toggleGroup(groupEventNames, allSelected)}
									label={group.name}
								/>
								<div className='flex flex-col gap-2 mt-2 ms-6'>
									{group.eventTypes.map((eventType) => (
										<Checkbox
											key={eventType.name}
											id={`event-${eventType.name}`}
											checked={selected.includes(eventType.name)}
											onCheckedChange={() => toggleEvent(eventType.name)}
											label={eventType.name}
										/>
									))}
								</div>
							</div>
						);
					})}
					{loading && hasNextPage && (
						<div className='flex justify-center p-3'>
							<Loader />
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default EventTypePicker;
