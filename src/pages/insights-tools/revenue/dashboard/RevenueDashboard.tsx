import { ComponentType, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Page, Select } from '@/components/atoms';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreditsTab from './CreditsTab';
import CustomersTab from './CustomersTab';
import KpiCards from './KpiCards';
import OverviewTab from './OverviewTab';
import PaymentsTab from './PaymentsTab';
import {
	DASHBOARD_COMPARES,
	DASHBOARD_PRESETS,
	DASHBOARD_TABS,
	DashboardCompare,
	DashboardPreset,
	DashboardTab,
	DashboardTabProps,
} from './queries';
import ReceivablesTab from './ReceivablesTab';
import RevenueTab from './RevenueTab';
import { useDashboardControls } from './useDashboardControls';

const isTab = (v: string): v is DashboardTab => (DASHBOARD_TABS as readonly string[]).includes(v);
const tabFromHash = (): DashboardTab => {
	const h = window.location.hash.replace(/^#/, '');
	return isTab(h) ? h : 'overview';
};

const D = 'insightsTools.revenue.dashboard';

// Inactive tabs unmount; only active fetches.
const TAB_VIEWS: Record<DashboardTab, ComponentType<DashboardTabProps>> = {
	overview: OverviewTab,
	revenue: RevenueTab,
	customers: CustomersTab,
	receivables: ReceivablesTab,
	payments: PaymentsTab,
	credits: CreditsTab,
};

const RevenueDashboard = ({ now }: { now?: Date }) => {
	const { t } = useTranslation('settings');
	const { controls, currencies, setPreset, setCompare, setCurrency } = useDashboardControls(now);
	const [tab, setTab] = useState<DashboardTab>(tabFromHash);

	useEffect(() => {
		const onHash = () => setTab(tabFromHash());
		window.addEventListener('hashchange', onHash);
		return () => window.removeEventListener('hashchange', onHash);
	}, []);

	const goTo = (next: DashboardTab) => {
		setTab(next);
		window.history.replaceState(null, '', `#${next}`);
	};

	return (
		<Page
			heading={t(`${D}.title`)}
			headingCTA={
				<div className='flex flex-wrap items-center gap-2'>
					<Select
						className='w-40'
						ariaLabel={t('insightsTools.revenue.reports.range')}
						value={controls.preset}
						options={DASHBOARD_PRESETS.map((p) => ({ value: p, label: t(`insightsTools.revenue.reports.presets.${p}`) }))}
						onChange={(v) => v && setPreset(v as DashboardPreset)}
					/>
					<Select
						className='w-48'
						ariaLabel={t('insightsTools.revenue.reports.compare')}
						value={controls.compare}
						options={DASHBOARD_COMPARES.map((c) => ({ value: c, label: t(`${D}.compares.${c}`) }))}
						onChange={(v) => v && setCompare(v as DashboardCompare)}
					/>
					<Select
						className='w-24'
						ariaLabel={t('insightsTools.revenue.reports.currency')}
						placeholder={t('insightsTools.revenue.reports.currency')}
						disabled={currencies.length === 0}
						value={controls.currency}
						options={currencies.map((c) => ({ value: c, label: c.toUpperCase() }))}
						onChange={(v) => v && setCurrency(v)}
					/>
				</div>
			}>
			<div className='flex flex-col gap-6 pt-3'>
				<KpiCards controls={controls} />
				<Tabs value={tab} onValueChange={(v) => isTab(v) && goTo(v)}>
					<TabsList className='h-auto w-full justify-start gap-6 rounded-none border-b border-line bg-transparent p-0'>
						{DASHBOARD_TABS.map((k) => (
							<TabsTrigger
								key={k}
								value={k}
								className='-mb-px rounded-none border-b-2 border-transparent px-0 pb-2 data-[state=active]:border-content-zinc-bold data-[state=active]:bg-transparent data-[state=active]:shadow-none'>
								{t(`${D}.tabs.${k}`)}
							</TabsTrigger>
						))}
					</TabsList>
					{DASHBOARD_TABS.map((k) => {
						const View = TAB_VIEWS[k];
						return (
							<TabsContent key={k} value={k} className='pt-4'>
								<View controls={controls} goTo={goTo} />
							</TabsContent>
						);
					})}
				</Tabs>
			</div>
		</Page>
	);
};

export default RevenueDashboard;
