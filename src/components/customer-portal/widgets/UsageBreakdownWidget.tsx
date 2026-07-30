import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Card } from '@/components/atoms';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/molecules/Table/Table';
import { UsageAnalyticItem } from '@/models';
import { DashboardAnalyticsRequest } from '@/types';
import { formatNumber, getCurrencySymbol } from '@/utils';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalConfig } from '@/context/PortalConfigContext';

const SORT_TOTAL_USAGE = 'total_usage' as const;
const SORT_TOTAL_COST = 'total_cost' as const;

interface UsageBreakdownWidgetProps {
	analyticsParams: DashboardAnalyticsRequest;
	label?: string;
}

const UNGROUPED_KEY = '__ungrouped__';

const EMPTY_ITEMS: UsageAnalyticItem[] = [];

interface GroupBucket {
	groupKey: string;
	groupName: string;
	items: UsageAnalyticItem[];
}

function renderTotalUsagePortal(row: UsageAnalyticItem) {
	const useDisplayValue = row.total_usage_display !== '' && row.total_usage_display != null;
	const displayNum = useDisplayValue
		? Number(parseFloat((row.total_usage_display || '0').replace(/,/g, '')))
		: Number(row.total_usage) || 0;
	const isSingular = displayNum === 1;
	const unitLabel = row.reporting_unit
		? isSingular
			? (row.reporting_unit.unit_singular ?? row.reporting_unit.unit_plural ?? '')
			: (row.reporting_unit.unit_plural ?? row.reporting_unit.unit_singular ?? '')
		: row.unit
			? Number(row.total_usage) === 1
				? row.unit
				: (row.unit_plural ?? row.unit)
			: '';
	const suffix = unitLabel ? ` ${unitLabel}` : '';
	const formattedUsage = useDisplayValue ? formatNumber(displayNum, displayNum % 1 === 0 ? 0 : 2) : formatNumber(Number(row.total_usage));
	return (
		<span>
			{formattedUsage}
			{suffix}
		</span>
	);
}

function renderTotalCostPortal(row: UsageAnalyticItem) {
	const cost = Number(row.total_cost);
	if (cost === 0 || !row.currency) return '-';
	const currency = getCurrencySymbol(row.currency);
	return (
		<span>
			{currency}
			{formatNumber(cost, 2)}
		</span>
	);
}

/**
 * Renders just the usage breakdown table with grouping support.
 * Shares React Query cache with UsageGraphWidget (same key) — zero duplicate API calls.
 * Returns null if there are no items — no empty container shown.
 */
const UsageBreakdownWidget = ({ analyticsParams, label }: UsageBreakdownWidgetProps) => {
	const { t } = useTranslation('customer-portal');
	const { config: portalConfig } = usePortalConfig();
	const hasTheme = !!portalConfig.theme;
	const rowStyle = hasTheme ? { backgroundColor: 'var(--portal-surface)', borderColor: 'var(--portal-border)' } : undefined;
	const {
		data: analyticsData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['portal-analytics', analyticsParams],
		queryFn: () => CustomerPortalApi.getAnalytics(analyticsParams),
	});

	useEffect(() => {
		if (isError) toast.error(t('errors.loadUsageBreakdown'));
	}, [isError, t]);

	const items = analyticsData?.items ?? EMPTY_ITEMS;

	// Sort state
	const [sortField, setSortField] = useState<'total_usage' | 'total_cost'>('total_cost');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
	const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(() => new Set());
	const hasInitializedExpand = useRef(false);

	const sortedItems = useMemo(() => {
		const sorted = [...items];
		const mult = sortDirection === 'asc' ? 1 : -1;
		sorted.sort((a, b) => {
			const va = sortField === 'total_usage' ? Number(a.total_usage) : Number(a.total_cost);
			const vb = sortField === 'total_usage' ? Number(b.total_usage) : Number(b.total_cost);
			return (va - vb) * mult;
		});
		return sorted;
	}, [items, sortDirection, sortField]);

	const { groupedBuckets, ungroupedItems } = useMemo(() => {
		const map = new Map<string, GroupBucket>();
		for (const item of sortedItems) {
			// Check multiple sources for group information (same logic as CustomerAnalyticsTab)
			const group = item.group ?? item.feature?.group ?? item.price?.group;
			const groupKey = group?.id ?? UNGROUPED_KEY;
			const groupName = group?.name ?? t('usageBreakdown.noGroup');
			if (!map.has(groupKey)) map.set(groupKey, { groupKey, groupName, items: [] });
			map.get(groupKey)!.items.push(item);
		}
		const ungrouped = map.get(UNGROUPED_KEY)?.items ?? [];
		const grouped = Array.from(map.values())
			.filter((b) => b.groupKey !== UNGROUPED_KEY)
			.sort((a, b) => a.groupName.localeCompare(b.groupName));
		return { groupedBuckets: grouped, ungroupedItems: ungrouped };
	}, [sortedItems, t]);

	useEffect(() => {
		if (groupedBuckets.length > 0 && !hasInitializedExpand.current) {
			hasInitializedExpand.current = true;
			setExpandedGroupIds(new Set(groupedBuckets.map((b) => b.groupKey)));
		}
	}, [groupedBuckets]);

	const hasGroups = groupedBuckets.length > 0;
	const allExpanded = hasGroups && groupedBuckets.every((b) => expandedGroupIds.has(b.groupKey));
	const toggleExpandAll = () => {
		setExpandedGroupIds(allExpanded ? new Set() : new Set(groupedBuckets.map((b) => b.groupKey)));
	};
	const toggleGroup = (groupKey: string) => {
		setExpandedGroupIds((prev) => {
			const next = new Set(prev);
			if (next.has(groupKey)) next.delete(groupKey);
			else next.add(groupKey);
			return next;
		});
	};

	const renderSortableHeader = (field: 'total_usage' | 'total_cost', label: string) => {
		const isActive = sortField === field;
		return (
			<button
				type='button'
				className='group -ms-1 inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-start transition-colors'
				style={{ color: 'var(--portal-text-primary, #374151)' }}
				onClick={() => {
					if (sortField !== field) {
						setSortField(field);
						setSortDirection('desc');
					} else {
						setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
					}
				}}>
				<span className='leading-none'>{label}</span>
				{sortDirection === 'asc' && isActive ? (
					<ChevronUp className='h-3.5 w-3.5 shrink-0' style={{ color: 'var(--portal-text-primary, #374151)' }} />
				) : isActive ? (
					<ChevronDown className='h-3.5 w-3.5 shrink-0' style={{ color: 'var(--portal-text-primary, #374151)' }} />
				) : (
					<ChevronsUpDown className='h-3.5 w-3.5 shrink-0' style={{ color: 'var(--portal-text-secondary, #9ca3af)' }} />
				)}
			</button>
		);
	};

	// Return null if no data — no empty state container
	if (!isLoading && items.length === 0) return null;

	if (isLoading) {
		return (
			<Card
				className='rounded-xl overflow-hidden'
				style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' }}>
				<div className='p-6' style={{ borderBottom: '1px solid var(--portal-border, #E9E9E9)' }}>
					<div className='h-5 w-40 bg-zinc-100 animate-pulse rounded' />
				</div>
				<div className='p-6 space-y-3'>
					{[1, 2, 3].map((i) => (
						<div key={i} className='h-8 bg-zinc-100 animate-pulse rounded' />
					))}
				</div>
			</Card>
		);
	}

	return (
		<Card
			className='rounded-xl overflow-hidden'
			style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' }}>
			<div className='p-6'>
				<div className='flex items-center justify-between'>
					<h3 className='text-base font-semibold' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
						{label || t('usage.breakdownTitle')}
					</h3>
					{hasGroups && (
						<button
							type='button'
							onClick={toggleExpandAll}
							className='inline-flex items-center justify-center text-gray-600 hover:text-gray-900'
							aria-label={allExpanded ? t('usageBreakdown.collapseAllAria') : t('usageBreakdown.expandAllAria')}>
							{allExpanded ? (
								<ChevronUp className='h-4 w-4 transition-colors' style={{ color: 'var(--portal-text-secondary, #6b7280)' }} />
							) : (
								<ChevronsUpDown className='h-4 w-4 transition-colors' style={{ color: 'var(--portal-text-secondary, #6b7280)' }} />
							)}
						</button>
					)}
				</div>
			</div>

			<div className='px-6 pb-6'>
				{/* Inner bordered rectangle — matches Figma design */}
				<div className='rounded-lg overflow-hidden' style={{ border: '1px solid var(--portal-border, #e5e7eb)' }}>
					<Table>
						<TableHeader className='h-10' style={{ borderBottom: '1px solid var(--portal-border, #e5e7eb)' }}>
							<TableRow style={{ borderBottom: '1px solid var(--portal-border, #e5e7eb)' }}>
								<TableHead className='ps-3 font-semibold text-[13px] w-[35%]' style={{ color: 'var(--portal-text-primary, #374151)' }}>
									{t('usageBreakdown.feature')}
								</TableHead>
								<TableHead className='font-semibold text-[13px]' style={{ color: 'var(--portal-text-primary, #374151)' }}>
									{renderSortableHeader(SORT_TOTAL_USAGE, t('usageBreakdown.totalUsage'))}
								</TableHead>
								<TableHead className='font-semibold text-[13px]' style={{ color: 'var(--portal-text-primary, #374151)' }}>
									{renderSortableHeader(SORT_TOTAL_COST, t('usageBreakdown.totalCost'))}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{groupedBuckets.map((bucket) => {
								const isExpanded = expandedGroupIds.has(bucket.groupKey);
								const aggregateCost = bucket.items.reduce((s, i) => s + Number(i.total_cost), 0);
								const firstCurrency = bucket.items[0]?.currency;
								return (
									<React.Fragment key={bucket.groupKey}>
										<TableRow
											role='button'
											tabIndex={0}
											onClick={() => bucket.items.length > 0 && toggleGroup(bucket.groupKey)}
											onKeyDown={(e) => {
												if ((e.key === 'Enter' || e.key === ' ') && bucket.items.length > 0) {
													e.preventDefault();
													toggleGroup(bucket.groupKey);
												}
											}}
											className={cn(
												'h-10 align-middle border-b cursor-pointer outline-none focus:outline-none',
												bucket.items.length === 0 && 'border-b-0 cursor-default',
											)}
											style={rowStyle}>
											<TableCell className='ps-3 py-2.5 align-middle'>
												<div className='inline-flex items-center gap-2 text-start'>
													<span className='font-semibold text-[13px]' style={{ color: 'var(--portal-text-primary, #111827)' }}>
														{bucket.groupName}
													</span>
													{bucket.items.length > 0 ? (
														isExpanded ? (
															<ChevronUp
																className='h-4 w-4 shrink-0 transition-colors'
																style={{ color: 'var(--portal-text-secondary, #6b7280)' }}
																aria-hidden
															/>
														) : (
															<ChevronDown
																className='h-4 w-4 shrink-0 transition-colors'
																style={{ color: 'var(--portal-text-secondary, #6b7280)' }}
																aria-hidden
															/>
														)
													) : null}
												</div>
											</TableCell>
											{/* Total Usage — aggregate not available for groups */}
											<TableCell className='py-2.5 font-normal text-[13px]' style={{ color: 'var(--portal-text-secondary, #6b7280)' }}>
												{t('usageBreakdown.cellEmDash')}
											</TableCell>
											<TableCell className='py-2.5 font-normal text-[13px]' style={{ color: 'var(--portal-text-secondary, #6b7280)' }}>
												{firstCurrency ? (
													<>
														{getCurrencySymbol(firstCurrency)}
														{formatNumber(aggregateCost, 2)}
													</>
												) : (
													t('usageBreakdown.cellEmDash')
												)}
											</TableCell>
										</TableRow>
										{isExpanded &&
											bucket.items.map((row, childIndex) => (
												<TableRow
													key={`${bucket.groupKey}:${row.feature_id ?? row.price_id ?? row.meter_id ?? childIndex}`}
													className='h-10 align-middle border-b'
													style={rowStyle}>
													<TableCell
														className='py-2.5 ps-3 font-normal text-[13px] align-middle'
														style={{ color: 'var(--portal-text-primary, #374151)' }}>
														{row.name || row.feature?.name || row.event_name || t('usageBreakdown.unknownRow')}
													</TableCell>
													<TableCell className='py-2.5 font-normal text-[13px]' style={{ color: 'var(--portal-text-secondary, #6b7280)' }}>
														{renderTotalUsagePortal(row)}
													</TableCell>
													<TableCell className='py-2.5 font-normal text-[13px]' style={{ color: 'var(--portal-text-secondary, #6b7280)' }}>
														{renderTotalCostPortal(row)}
													</TableCell>
												</TableRow>
											))}
									</React.Fragment>
								);
							})}
							{ungroupedItems.map((row, index) => (
								<TableRow
									key={`ungrouped:${row.feature_id ?? row.price_id ?? row.meter_id ?? index}`}
									className='h-10 align-middle border-b'
									style={rowStyle}>
									<TableCell className='ps-3 py-2.5 font-normal text-[13px]' style={{ color: 'var(--portal-text-primary, #374151)' }}>
										<span>{row.name || row.feature?.name || row.event_name || t('usageBreakdown.unknownRow')}</span>
									</TableCell>
									<TableCell className='py-2.5 font-normal text-[13px]' style={{ color: 'var(--portal-text-secondary, #6b7280)' }}>
										{renderTotalUsagePortal(row)}
									</TableCell>
									<TableCell className='py-2.5 font-normal text-[13px]' style={{ color: 'var(--portal-text-secondary, #6b7280)' }}>
										{renderTotalCostPortal(row)}
									</TableCell>
								</TableRow>
							))}
							{items.length === 0 && (
								<TableRow style={rowStyle}>
									<TableCell
										colSpan={3}
										className='ps-3 py-4 font-normal text-[13px]'
										style={{ color: 'var(--portal-text-secondary, #6b7280)' }}>
										{t('usageBreakdown.cellEmpty')}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</Card>
	);
};

export default UsageBreakdownWidget;
