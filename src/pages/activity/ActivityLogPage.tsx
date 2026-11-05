import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Page, Toggle } from '@/components/atoms';
import { ActivityList } from '@/components/molecules/Activity';
import ActivityFilterBar from '@/components/molecules/Activity/ActivityFilterBar';
import { ActivityFilterState, defaultFilters, filtersToQuery, needsEntity } from '@/components/molecules/Activity/filterState';

const HIDE_SYSTEM_KEY = 'activity.hideSystem';

const readHideSystem = () => {
	try {
		return localStorage.getItem(HIDE_SYSTEM_KEY) === '1';
	} catch {
		return false;
	}
};

const ActivityLogPage = () => {
	const { t } = useTranslation('activity');
	const [searchParams] = useSearchParams();
	const [filters, setFilters] = useState<ActivityFilterState>(() =>
		defaultFilters({ customerId: searchParams.get('customer_id'), requestId: searchParams.get('request_id') }),
	);
	const [hideSystem, setHideSystem] = useState(readHideSystem);

	const query = useMemo(
		() => ({ ...filtersToQuery(filters), ...(hideSystem ? { exclude_actor_types: ['system'] } : {}) }),
		[filters, hideSystem],
	);

	const toggleHideSystem = (v: boolean) => {
		setHideSystem(v);
		try {
			localStorage.setItem(HIDE_SYSTEM_KEY, v ? '1' : '0');
		} catch {
			// per-viewer convenience only
		}
	};

	return (
		<Page heading={t('page.title')} documentTitle={t('page.title')}>
			<p className='text-sm text-content-muted -mt-2 mb-4'>{t('page.subtitle')}</p>
			<div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
				<ActivityFilterBar value={filters} onChange={setFilters} onClear={() => setFilters(defaultFilters())} />
				<Toggle checked={hideSystem} onChange={toggleHideSystem} label={t('toggle.hideSystem')} />
			</div>
			{needsEntity(filters) ? (
				<div className='text-sm text-content-muted py-6 text-center'>
					{t('filters.needEntity', { type: t(`entity.${filters.entityType}`, { defaultValue: filters.entityType.replace(/_/g, ' ') }) })}
				</div>
			) : (
				<ActivityList scope={{ kind: 'all' }} query={query} pageSize={50} />
			)}
		</Page>
	);
};

export default ActivityLogPage;
