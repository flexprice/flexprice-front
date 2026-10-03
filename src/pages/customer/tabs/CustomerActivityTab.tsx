import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Card, CardHeader, Select, Toggle } from '@/components/atoms';
import { ActivityList } from '@/components/molecules/Activity';
import { ANY, entityTypeQuery } from '@/components/molecules/Activity/filterState';
import { ACTIVITY_CUSTOMER_ENTITY_TYPES } from '@/constants/activity';
import { RouteNames } from '@/core/routes/Routes';

const HIDE_SYSTEM_KEY = 'activity.hideSystem';

const readHideSystem = () => {
	try {
		return localStorage.getItem(HIDE_SYSTEM_KEY) === '1';
	} catch {
		return false;
	}
};

const CustomerActivityTab = () => {
	const { t } = useTranslation('activity');
	const { id } = useParams();
	const customerId = id ?? '';
	const [entityType, setEntityType] = useState('');
	const [hideSystem, setHideSystem] = useState(readHideSystem);

	const query = useMemo(
		() => ({ ...entityTypeQuery(entityType), ...(hideSystem ? { exclude_actor_types: ['system'] } : {}) }),
		[entityType, hideSystem],
	);
	const typeOptions = useMemo(
		() => [
			{ value: ANY, label: t('filters.allTypes') },
			...ACTIVITY_CUSTOMER_ENTITY_TYPES.map((v) => ({ value: v, label: t(`entity.${v}`, { defaultValue: v.replace(/_/g, ' ') }) })),
		],
		[t],
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
		<Card>
			<CardHeader
				title={t('tab.title')}
				cta={
					<Link to={`${RouteNames.activity}?customer_id=${customerId}`} className='text-sm text-content-link hover:underline'>
						{t('openInLog')}
					</Link>
				}
			/>
			<div className='flex flex-wrap items-center justify-between gap-3 py-3'>
				<div className='min-w-[260px]'>
					<Select options={typeOptions} value={entityType || ANY} onChange={(v) => setEntityType(v === ANY ? '' : v)} />
				</div>
				<Toggle checked={hideSystem} onChange={toggleHideSystem} label={t('toggle.hideSystem')} />
			</div>
			<ActivityList
				key={entityType || 'all'}
				scope={{ kind: 'customer', customerId }}
				query={query}
				pageSize={25}
				customerId={customerId}
				emptyMessage={t('list.empty')}
			/>
		</Card>
	);
};

export default CustomerActivityTab;
