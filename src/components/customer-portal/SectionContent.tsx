import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { startOfDay, subDays } from 'date-fns';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { SectionConfig, TabConfig, DatePreset, UsageGraphConfig } from '@/types/dto/PortalConfig';
import { DashboardAnalyticsRequest } from '@/types';
import { WindowSize } from '@/models';
import { DateRangePicker } from '@/components/atoms';
import TabRenderer, { DEFAULT_USAGE_GRAPH_CONFIG } from './TabRenderer';
import EmptyState from './EmptyState';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LayoutGrid } from 'lucide-react';

interface SectionContentProps {
	section: SectionConfig;
}

const DAY_MS = 24 * 60 * 60 * 1000;

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
		// Calendar-aligned and inclusive of today, so "7d" covers seven dates and the
		// range the filter prints matches the range queried. A rolling now-minus-7×24h
		// window spanned eight dates once the time was dropped from the label, and left
		// the oldest day-bucket partial — so an empty state could not be trusted to be
		// about the period on screen.
		case DatePreset.Last7Days:
			return { start_time: startOfDay(subDays(now, 6)).toISOString(), end_time: end };
		case DatePreset.Last30Days:
			return { start_time: startOfDay(subDays(now, 29)).toISOString(), end_time: end };
		case DatePreset.CurrentMonth:
			return { start_time: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), end_time: end };
		case DatePreset.LastMonth: {
			const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
			return { start_time: start.toISOString(), end_time: endOfLastMonth.toISOString() };
		}
		default:
			return { start_time: startOfDay(subDays(now, 6)).toISOString(), end_time: end };
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
	/** The custom range as typed so far — takes over the picker once a start is chosen. */
	draftStart: string;
	draftEnd: string;
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
	draftStart,
	draftEnd,
	effectiveEnd,
	getPresetLabel,
	startPlaceholder,
	endPlaceholder,
	onPresetClick,
	onCustomStartChange,
	onCustomEndChange,
}: SectionDateFilterProps) => (
	// Presets left, one range control right — the two separate pickers ate the full
	// width and read as detached from the section they filter.
	<div className='flex items-center justify-between gap-3 flex-wrap mb-5'>
		{/* Preset Buttons */}
		<div className='flex items-center gap-1 rounded-lg border border-line bg-surface p-1'>
			{usageGraphConfig.date_presets.map((preset) => {
				const isActive = !useCustom && selectedPreset === preset;
				return (
					<button
						key={preset}
						onClick={() => onPresetClick(preset)}
						className={cn(
							'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
							isActive ? 'bg-surface-subtle text-content shadow-sm' : 'text-content-secondary hover:text-content',
						)}>
						{getPresetLabel(preset)}
					</button>
				);
			})}
		</div>
		{usageGraphConfig.allow_custom_date_range && (
			<DateRangePicker
				// The draft wins while a custom range is half-chosen. The first click sends
				// a start with no end, which leaves the effective range on the preset — so
				// feeding the preset back as the controlled value threw the first date away
				// and the customer could never complete a selection.
				startDate={draftStart ? new Date(draftStart) : effectiveStart ? new Date(effectiveStart) : undefined}
				endDate={draftStart ? (draftEnd ? new Date(draftEnd) : undefined) : effectiveEnd ? new Date(effectiveEnd) : undefined}
				placeholder={`${startPlaceholder} – ${endPlaceholder}`}
				onChange={({ startDate, endDate }) => {
					// Passed through rather than re-normalised: the picker has a UTC toggle
					// and already hands back day boundaries in its own timezone, so applying
					// the browser's startOfDay/endOfDay on top shifted the window by the UTC
					// offset for anyone not on UTC. The end is extended to the last instant
					// of that same day, which holds in either timezone.
					onCustomStartChange(startDate ? startDate.toISOString() : '');
					onCustomEndChange(endDate ? new Date(endDate.getTime() + DAY_MS - 1).toISOString() : '');
				}}
				className='w-auto'
				popoverTriggerClassName='[&_button]:h-9 [&_button]:text-xs [&_button]:rounded-md [&_button]:bg-surface [&_button]:border-line [&_button]:text-content'
			/>
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
	const enabledTabs = useMemo(() => [...section.tabs.filter((t) => t.enabled)].sort((a, b) => a.order - b.order), [section.tabs]);

	// ── Shared date filter state (hoisted to section level) ──────────────────
	const usageGraphTab: TabConfig | undefined = enabledTabs.find((t) => t.type === 'usage_graph');
	const hasAnalytics = enabledTabs.some((t) => t.type === 'usage_graph' || t.type === 'metric_cards');
	// metric_cards has no date config of its own (MetricCardsConfig carries only which cards to
	// show) — fall back to the same defaults TabRenderer uses so a metric_cards-only section still
	// gets a working date filter instead of losing it entirely for want of a usage_graph tab.
	const usageGraphConfig = usageGraphTab?.usage_graph ?? DEFAULT_USAGE_GRAPH_CONFIG;

	const defaultPreset = usageGraphConfig.default_preset;
	const [selectedPreset, setSelectedPreset] = useState<DatePreset>(defaultPreset);
	const [customStart, setCustomStart] = useState('');
	const [customEnd, setCustomEnd] = useState('');
	const [useCustom, setUseCustom] = useState(false);

	const handlePresetClick = useCallback((preset: DatePreset) => {
		setSelectedPreset(preset);
		setUseCustom(false);
		// Dropped, or the stale draft would take the picker over again on reopen.
		setCustomStart('');
		setCustomEnd('');
	}, []);

	// useCustom follows the start alone. Keying it off each field meant the empty
	// end that arrives with the first click switched custom mode straight back off.
	const handleCustomStart = useCallback((val: string) => {
		setCustomStart(val);
		setUseCustom(!!val);
		if (!val) setCustomEnd('');
	}, []);

	const handleCustomEnd = useCallback((val: string) => {
		setCustomEnd(val);
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

	// The section keeps its place in the tab bar whatever its tabs are configured
	// to be — CustomerPortal only hides a section whose one data source came back
	// empty — so returning null here left the customer clicking a tab that opened
	// onto nothing at all.
	if (enabledTabs.length === 0) {
		return (
			<Card className='rounded-xl p-6 bg-surface border border-line'>
				<EmptyState icon={<LayoutGrid />} title={t('section.emptyTitle')} description={t('section.emptyDescription')} />
			</Card>
		);
	}

	const subscriptions = subscriptionsData?.items ?? [];
	const usageData = usageSummaryData?.features ?? [];

	return (
		<div className='space-y-6'>
			{/* Single date filter at the top — shared by all analytics widgets in this section */}
			{hasAnalytics && (
				<SectionDateFilter
					usageGraphConfig={usageGraphConfig}
					selectedPreset={selectedPreset}
					useCustom={useCustom}
					effectiveStart={effectiveRange.start_time}
					effectiveEnd={effectiveRange.end_time}
					draftStart={customStart}
					draftEnd={customEnd}
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
