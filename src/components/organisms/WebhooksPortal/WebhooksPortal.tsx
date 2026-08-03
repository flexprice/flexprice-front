import { FC, useState } from 'react';
import { Rss, LayoutGrid, History, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EndpointsTable, EventCatalogBrowser, MessageLogsTable, ActivityOverview } from '@/components/molecules/Webhooks';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const EVENT_CATALOG_TAB = 'event-catalog';

const WebhooksPortal: FC = () => {
	const { t } = useTranslation('developers');
	const [activeTab, setActiveTab] = useState('endpoints');

	const tabs = [
		{
			value: 'endpoints',
			label: t('webhooks.tabs.endpoints'),
			icon: Rss,
			content: <EndpointsTable onViewEventCatalog={() => setActiveTab(EVENT_CATALOG_TAB)} />,
		},
		{ value: EVENT_CATALOG_TAB, label: t('webhooks.tabs.eventCatalog'), icon: LayoutGrid, content: <EventCatalogBrowser /> },
		{ value: 'logs', label: t('webhooks.tabs.logs'), icon: History, content: <MessageLogsTable /> },
		{ value: 'activity', label: t('webhooks.tabs.activity'), icon: Activity, content: <ActivityOverview /> },
	];

	return (
		<div className='border border-border rounded-lg bg-surface p-6'>
			<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
				<TabsList className='space-x-1 bg-transparent border-b border-border w-full justify-start rounded-none'>
					{tabs.map(({ value, label, icon: Icon }) => (
						<TabsTrigger
							key={value}
							value={value}
							className={cn(
								'flex items-center gap-1.5 text-sm font-medium text-content-muted px-3 py-2 rounded-none border-b-2 border-transparent',
								'data-[state=active]:text-content data-[state=active]:border-content',
								'hover:text-content transition-colors bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0',
							)}>
							<Icon className='w-4 h-4' />
							{label}
						</TabsTrigger>
					))}
				</TabsList>
				<div className='mt-6'>
					{tabs.map(({ value, content }) => (
						<TabsContent key={value} value={value} className='mt-0 p-0'>
							{content}
						</TabsContent>
					))}
				</div>
			</Tabs>
		</div>
	);
};

export default WebhooksPortal;
