import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { endOfDay, startOfDay } from 'date-fns';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { SectionConfig, TabConfig, DatePreset, UsageGraphConfig } from '@/types/dto/PortalConfig';
import { DashboardAnalyticsRequest } from '@/types';
import { WindowSize } from '@/models';
import { DatePicker } from '@/components/atoms';
import { usePortalConfig } from '@/context/PortalConfigContext';
import TabRenderer from './TabRenderer';
import { cn } from '@/lib/utils';

interface SectionContentProps {
	section: SectionConfig;
}

// ─── Date Range Calculator ────────────────────────────────────────────────────

function calculateDateRange(preset: DatePreset): { start_time: string; end_time: string } {
	const now = new Date();
	const end = now.toISOString();
	switch (preset) {
		case DatePreset.Today: {
			const start = new Date(now);
			start.setHours(0, 0, 0, 0);
			return { start_time: start.toISOString(), end_time: end };
		}
		case DatePreset.Last7Days: {
			const start = new Date(now);
			start.setDate(start.getDate() - 7);
			return { start_time: start.toISOString(), end_time: end };
		}
		case DatePreset.Last30Days: {
			const start = new Date(now);
			start.setDate(start.getDate() - 30);
			return { start_time: start.toISOString(), end_time: end };
		}
		case DatePreset.CurrentMonth:
			return { start_time: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), end_time: end };
		case DatePreset.LastMonth: {
			const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
			return { start_time: start.toISOString(), end_time: endOfLastMonth.toISOString() };
		}
		default: {
			return { start_time: new Date(Date.now() - 7 * 86400000).toISOString(), end_time: end };
		}
	}
}

// ─── Section-level Date Filter UI ────────────────────────────────────────────

interface SectionDateFilterProps {
	usageGraphConfig: UsageGraphConfig;
	selectedPreset: DatePreset;
	useCustom: boolean;
	/** Effective range to show in date pickers (preset range or custom); keeps pickers in sync with preset */
	effectiveStart: string;
	effectiveEnd: string;
	hasTheme: boolean;
	getPresetLabel: (preset: DatePreset) => string;
	startPlaceholder: string;
	endPlaceholder: string;
	onPresetClick: (preset: DatePreset) => void;
	onCustomStartChange: (val: string) => void;
	onCustomEndChange: (val: string) => void;
}

const SectionDateFilter = ({
	usageGraphConfig,
	selectedPreset,
	useCustom,
	effectiveStart,
	effectiveEnd,
	hasTheme,
	getPresetLabel,
	startPlaceholder,
	endPlaceholder,
	onPresetClick,
	onCustomStartChange,
	onCustomEndChange,
}: SectionDateFilterProps) => (
	<div className='flex items-center gap-2 flex-wrap mb-6'>
		{/* Preset Buttons */}
		<div
			className='flex items-center gap-1 rounded-lg p-1'
			style={
				hasTheme
					? { backgroundColor: 'var(--portal-surface)', border: '1px solid var(--portal-border)' }
					: { backgroundColor: 'white', border: '1px solid #E9E9E9' }
			}>
			{usageGraphConfig.date_presets.map((preset) => {
				const isActive = !useCustom && selectedPreset === preset;
				return (
					<button
						key={preset}
						onClick={() => onPresetClick(preset)}
						className={cn(
							'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
							!hasTheme && (isActive ? 'bg-zinc-100 text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'),
						)}
						style={
							hasTheme
								? isActive
									? { backgroundColor: 'var(--portal-primary)', color: 'white' }
									: { color: 'var(--portal-text-secondary, #71717a)' }
								: undefined
						}>
						{getPresetLabel(preset)}
					</button>
				);
			})}
		</div>
		{/* Custom Date Range — two separate date pickers */}
		{usageGraphConfig.allow_custom_date_range && (
			<div className='flex items-center gap-2'>
				<DatePicker
					date={effectiveStart ? new Date(effectiveStart) : undefined}
					setDate={(d) => onCustomStartChange(d ? startOfDay(d).toISOString() : '')}
					placeholder={startPlaceholder}
					className={`w-[130px] h-9 text-xs ${hasTheme ? '' : 'bg-white'}`}
					popoverTriggerClassName={`[&_button]:h-9 [&_button]:text-xs [&_button]:rounded-md${hasTheme ? ' [&_button]:bg-[var(--portal-surface)] [&_button]:border-[var(--portal-border)] [&_button]:text-[var(--portal-text-primary)]' : ''}`}
				/>
				<DatePicker
					date={effectiveEnd ? new Date(effectiveEnd) : undefined}
					setDate={(d) => onCustomEndChange(d ? endOfDay(d).toISOString() : '')}
					placeholder={endPlaceholder}
					className={`w-[130px] h-9 text-xs ${hasTheme ? '' : 'bg-white'}`}
					popoverTriggerClassName={`[&_button]:h-9 [&_button]:text-xs [&_button]:rounded-md${hasTheme ? ' [&_button]:bg-[var(--portal-surface)] [&_button]:border-[var(--portal-border)] [&_button]:text-[var(--portal-text-primary)]' : ''}`}
				/>
			</div>
		)}
	</div>
);

// ─── Main Section Content ─────────────────────────────────────────────────────

/**
 * Renders all enabled tabs in a section stacked vertically in order.
 * No inner tab bar — every widget is visible at once.
 *
 * If the section contains analytics widgets (metric_cards, usage_graph),
 * a single date filter is shown at the top of the section and shared
 * across all those widgets via a common analyticsParams object.
 */
const SectionContent = ({ section }: SectionContentProps) => {
	const { t } = useTranslation('customer-portal');
	const { config } = usePortalConfig();
	const hasTheme = !!config.theme;
	const enabledTabs = useMemo(() => [...section.tabs.filter((t) => t.enabled)].sort((a, b) => a.order - b.order), [section.tabs]);

	// ── Shared date filter state (hoisted to section level) ──────────────────
	const usageGraphTab: TabConfig | undefined = enabledTabs.find((t) => t.type === 'usage_graph');
	const hasAnalytics = enabledTabs.some((t) => t.type === 'usage_graph' || t.type === 'metric_cards');

	const defaultPreset = usageGraphTab?.usage_graph?.default_preset ?? DatePreset.Last7Days;
	const [selectedPreset, setSelectedPreset] = useState<DatePreset>(defaultPreset);
	const [customStart, setCustomStart] = useState('');
	const [customEnd, setCustomEnd] = useState('');
	const [useCustom, setUseCustom] = useState(false);

	const handlePresetClick = useCallback((preset: DatePreset) => {
		setSelectedPreset(preset);
		setUseCustom(false);
	}, []);

	const handleCustomStart = useCallback((val: string) => {
		setCustomStart(val);
		setUseCustom(!!val);
	}, []);

	const handleCustomEnd = useCallback((val: string) => {
		setCustomEnd(val);
		setUseCustom(!!val);
	}, []);

	// Effective range: preset when a preset is selected, custom when user picked dates (used for analytics + date picker display)
	const effectiveRange = useMemo(
		() => (useCustom && customStart && customEnd ? { start_time: customStart, end_time: customEnd } : calculateDateRange(selectedPreset)),
		[selectedPreset, useCustom, customStart, customEnd],
	);

	// Resolved analytics params — same object passed to every analytics widget
	const analyticsParams: DashboardAnalyticsRequest = useMemo(
		() => ({ window_size: WindowSize.DAY, ...effectiveRange, expand: ['price'] }),
		[effectiveRange],
	);

	// ── Shared data fetches ──────────────────────────────────────────────────
	const needsSubscriptions = enabledTabs.some((t) => t.type === 'subscriptions');
	const needsUsage = enabledTabs.some((t) => t.type === 'current_usage');

	const { data: subscriptionsData, isError: subscriptionsError } = useQuery({
		queryKey: ['portal-subscriptions'],
		queryFn: () => CustomerPortalApi.getSubscriptions({ limit: 10, offset: 0 }),
		enabled: needsSubscriptions,
	});

	const { data: usageSummaryData, isError: usageError } = useQuery({
		queryKey: ['portal-usage'],
		queryFn: () => CustomerPortalApi.getUsageSummary(),
		enabled: needsUsage,
	});

	useEffect(() => {
		if (subscriptionsError) toast.error(t('errors.loadSubscriptions'));
	}, [subscriptionsError, t]);

	useEffect(() => {
		if (usageError) toast.error(t('errors.loadUsage'));
	}, [usageError, t]);

	if (enabledTabs.length === 0) return null;

	const subscriptions = subscriptionsData?.items ?? [];
	const usageData = usageSummaryData?.features ?? [];

	return (
		<div className='space-y-6'>
			{/* Single date filter at the top — shared by all analytics widgets in this section */}
			{hasAnalytics && usageGraphTab?.usage_graph && (
				<SectionDateFilter
					usageGraphConfig={usageGraphTab.usage_graph}
					selectedPreset={selectedPreset}
					useCustom={useCustom}
					effectiveStart={effectiveRange.start_time}
					effectiveEnd={effectiveRange.end_time}
					hasTheme={hasTheme}
					getPresetLabel={(preset) => t(`datePreset.${preset}`)}
					startPlaceholder={t('datePicker.startDate')}
					endPlaceholder={t('datePicker.endDate')}
					onPresetClick={handlePresetClick}
					onCustomStartChange={handleCustomStart}
					onCustomEndChange={handleCustomEnd}
				/>
			)}

			{/* All widgets stacked vertically in config order */}
			{enabledTabs.map((tab) => (
				<TabRenderer key={tab.id} tab={tab} subscriptions={subscriptions} usageData={usageData} analyticsParams={analyticsParams} />
			))}
		</div>
	);
};

export default SectionContent;
