import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
// Direct file import, NOT the '@/components/atoms' barrel — see UsageQuota.tsx for why.
import Card from '@/components/atoms/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/molecules/Table/Table';
import { formatNumber, getCurrencySymbol } from '@/utils';
import { cn } from '@/lib/utils';
import { useUsageT } from '../i18n';
import { normalizeUsageBreakdownRows } from '../schema';
import type { UsageBreakdownProps, UsageBreakdownRow } from '../types';

const SORT_TOTAL_USAGE = 'totalUsage' as const;
const SORT_TOTAL_COST = 'totalCost' as const;
const UNGROUPED_KEY = '__ungrouped__';

interface GroupBucket {
	groupKey: string;
	groupName: string;
	items: UsageBreakdownRow[];
	aggregate: number;
}

function renderUsageCell(row: UsageBreakdownRow) {
	const useDisplayValue = row.totalUsageDisplay != null && row.totalUsageDisplay !== '';
	const displayNum = useDisplayValue ? parseFloat(row.totalUsageDisplay!.replace(/,/g, '')) : row.totalUsage;
	// A non-numeric totalUsageDisplay (e.g. "N/A") must never format to the literal string "NaN" —
	// render the raw display value (or fall back to the numeric totalUsage) instead.
	const formatted = Number.isFinite(displayNum)
		? formatNumber(displayNum, displayNum % 1 === 0 ? 0 : 2)
		: (row.totalUsageDisplay ?? formatNumber(row.totalUsage));
	return (
		<span>
			{formatted}
			{row.unit ? ` ${row.unit}` : ''}
		</span>
	);
}

function renderCostCell(row: UsageBreakdownRow) {
	if (row.totalCost === 0 || !row.currency) return '-';
	return (
		<span>
			{getCurrencySymbol(row.currency)}
			{formatNumber(row.totalCost, 2)}
		</span>
	);
}

/**
 * Prop-only usage-breakdown table — no fetching, no auth, no PortalConfigContext. Groups rows by
 * `groupId`/`groupName` (falls back to an "ungrouped" bucket) and supports sorting by usage/cost.
 */
const UsageBreakdown = ({ rows: rawRows, label, isLoading = false, className }: UsageBreakdownProps) => {
	const rows = useMemo(() => normalizeUsageBreakdownRows(rawRows), [rawRows]);
	const t = useUsageT();

	const [sortField, setSortField] = useState<typeof SORT_TOTAL_USAGE | typeof SORT_TOTAL_COST>(SORT_TOTAL_COST);
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
	const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(() => new Set());
	const hasInitializedExpand = useRef(false);

	const sortedRows = useMemo(() => {
		const sorted = [...rows];
		const mult = sortDirection === 'asc' ? 1 : -1;
		sorted.sort((a, b) => (a[sortField] - b[sortField]) * mult);
		return sorted;
	}, [rows, sortDirection, sortField]);

	const { groupedBuckets, ungroupedItems } = useMemo(() => {
		const map = new Map<string, GroupBucket>();
		for (const row of sortedRows) {
			const groupKey = row.groupId ?? UNGROUPED_KEY;
			const groupName = row.groupName ?? t('usageWidgets.noGroup');
			if (!map.has(groupKey)) map.set(groupKey, { groupKey, groupName, items: [], aggregate: 0 });
			const bucket = map.get(groupKey)!;
			bucket.items.push(row);
			bucket.aggregate += row[sortField];
		}
		const ungrouped = map.get(UNGROUPED_KEY)?.items ?? [];
		// Groups sort by the same field/direction the row-level sort uses — each header shows an
		// aggregate for that field, so "Sort: Cost" should reorder which group is on top, too.
		const mult = sortDirection === 'asc' ? 1 : -1;
		const grouped = Array.from(map.values())
			.filter((b) => b.groupKey !== UNGROUPED_KEY)
			.sort((a, b) => (a.aggregate - b.aggregate) * mult || a.groupName.localeCompare(b.groupName));
		return { groupedBuckets: grouped, ungroupedItems: ungrouped };
	}, [sortedRows, sortField, sortDirection, t]);

	useEffect(() => {
		if (groupedBuckets.length > 0 && !hasInitializedExpand.current) {
			hasInitializedExpand.current = true;
			setExpandedGroupIds(new Set(groupedBuckets.map((b) => b.groupKey)));
		}
	}, [groupedBuckets]);

	const hasGroups = groupedBuckets.length > 0;
	const allExpanded = hasGroups && groupedBuckets.every((b) => expandedGroupIds.has(b.groupKey));
	const toggleExpandAll = () => setExpandedGroupIds(allExpanded ? new Set() : new Set(groupedBuckets.map((b) => b.groupKey)));
	const toggleGroup = (groupKey: string) =>
		setExpandedGroupIds((prev) => {
			const next = new Set(prev);
			if (next.has(groupKey)) next.delete(groupKey);
			else next.add(groupKey);
			return next;
		});

	const renderSortableHeader = (field: typeof SORT_TOTAL_USAGE | typeof SORT_TOTAL_COST, headerLabel: string) => {
		const isActive = sortField === field;
		return (
			<button
				type='button'
				className='group -ms-1 inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-start text-content transition-colors'
				onClick={() => {
					if (sortField !== field) {
						setSortField(field);
						setSortDirection('desc');
					} else {
						setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
					}
				}}>
				<span className='leading-none'>{headerLabel}</span>
				{sortDirection === 'asc' && isActive ? (
					<ChevronUp className='h-3.5 w-3.5 shrink-0 text-content' />
				) : isActive ? (
					<ChevronDown className='h-3.5 w-3.5 shrink-0 text-content' />
				) : (
					<ChevronsUpDown className='h-3.5 w-3.5 shrink-0 text-content-secondary' />
				)}
			</button>
		);
	};

	if (!isLoading && rows.length === 0) return null;

	if (isLoading) {
		return (
			<Card noPadding className={cn('flexprice-ui', 'rounded-xl overflow-hidden bg-surface', className)}>
				<div className='p-6 border-b border-line'>
					<div className='h-5 w-40 bg-surface-muted animate-pulse rounded' />
				</div>
				<div className='p-6 space-y-3'>
					{[1, 2, 3].map((i) => (
						<div key={i} className='h-8 bg-surface-muted animate-pulse rounded' />
					))}
				</div>
			</Card>
		);
	}

	return (
		<Card noPadding className={cn('flexprice-ui', 'rounded-xl overflow-hidden bg-surface', className)}>
			<div className='p-6'>
				<div className='flex items-center justify-between'>
					<h3 className='text-base font-semibold text-content'>{label || t('usageWidgets.breakdownTitle')}</h3>
					{hasGroups && (
						<button
							type='button'
							onClick={toggleExpandAll}
							className='inline-flex items-center justify-center text-content-secondary hover:text-content'
							aria-label={allExpanded ? t('usageWidgets.collapseAllAria') : t('usageWidgets.expandAllAria')}>
							{allExpanded ? <ChevronUp className='h-4 w-4' /> : <ChevronsUpDown className='h-4 w-4' />}
						</button>
					)}
				</div>
			</div>

			<div className='px-6 pb-6'>
				<div className='rounded-lg overflow-hidden border border-line'>
					<Table>
						<TableHeader className='h-10 border-b border-line'>
							<TableRow className='border-b border-line'>
								<TableHead className='ps-3 font-semibold text-[13px] w-[35%] text-content'>{t('usageWidgets.feature')}</TableHead>
								<TableHead className='font-semibold text-[13px] text-content'>
									{renderSortableHeader(SORT_TOTAL_USAGE, t('usageWidgets.totalUsage'))}
								</TableHead>
								<TableHead className='font-semibold text-[13px] text-content'>
									{renderSortableHeader(SORT_TOTAL_COST, t('usageWidgets.totalCost'))}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{groupedBuckets.map((bucket) => {
								const isExpanded = expandedGroupIds.has(bucket.groupKey);
								const aggregateCost = bucket.items.reduce((s, i) => s + i.totalCost, 0);
								const currencies = new Set(bucket.items.map((i) => i.currency).filter(Boolean));
								// A mixed-currency bucket has no single valid symbol for the summed total.
								const firstCurrency = currencies.size === 1 ? bucket.items.find((i) => i.currency)?.currency : undefined;
								return (
									<React.Fragment key={bucket.groupKey}>
										<TableRow
											role='button'
											tabIndex={0}
											aria-expanded={bucket.items.length > 0 ? isExpanded : undefined}
											onClick={() => bucket.items.length > 0 && toggleGroup(bucket.groupKey)}
											onKeyDown={(e) => {
												if ((e.key === 'Enter' || e.key === ' ') && bucket.items.length > 0) {
													e.preventDefault();
													toggleGroup(bucket.groupKey);
												}
											}}
											className={cn(
												'h-10 align-middle border-b border-line cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
												bucket.items.length === 0 && 'border-b-0 cursor-default',
											)}>
											<TableCell className='ps-3 py-2.5 align-middle'>
												<div className='inline-flex items-center gap-2 text-start'>
													<span className='font-semibold text-[13px] text-content'>{bucket.groupName}</span>
													{bucket.items.length > 0 &&
														(isExpanded ? (
															<ChevronUp className='h-4 w-4 shrink-0 text-content-secondary' aria-hidden />
														) : (
															<ChevronDown className='h-4 w-4 shrink-0 text-content-secondary' aria-hidden />
														))}
												</div>
											</TableCell>
											<TableCell className='py-2.5 font-normal text-[13px] text-content-secondary'>
												{t('usageWidgets.cellEmDash')}
											</TableCell>
											<TableCell className='py-2.5 font-normal text-[13px] text-content-secondary'>
												{firstCurrency ? (
													<>
														{getCurrencySymbol(firstCurrency)}
														{formatNumber(aggregateCost, 2)}
													</>
												) : (
													t('usageWidgets.cellEmDash')
												)}
											</TableCell>
										</TableRow>
										{isExpanded &&
											bucket.items.map((row, childIndex) => (
												<TableRow key={`${bucket.groupKey}:${row.id}:${childIndex}`} className='h-10 align-middle border-b border-line'>
													<TableCell className='py-2.5 ps-3 font-normal text-[13px] align-middle text-content'>
														{row.name || t('usageWidgets.unknownRow')}
													</TableCell>
													<TableCell className='py-2.5 font-normal text-[13px] text-content-secondary'>{renderUsageCell(row)}</TableCell>
													<TableCell className='py-2.5 font-normal text-[13px] text-content-secondary'>{renderCostCell(row)}</TableCell>
												</TableRow>
											))}
									</React.Fragment>
								);
							})}
							{ungroupedItems.map((row, index) => (
								<TableRow key={`ungrouped:${row.id}:${index}`} className='h-10 align-middle border-b border-line'>
									<TableCell className='ps-3 py-2.5 font-normal text-[13px] text-content'>
										{row.name || t('usageWidgets.unknownRow')}
									</TableCell>
									<TableCell className='py-2.5 font-normal text-[13px] text-content-secondary'>{renderUsageCell(row)}</TableCell>
									<TableCell className='py-2.5 font-normal text-[13px] text-content-secondary'>{renderCostCell(row)}</TableCell>
								</TableRow>
							))}
							{rows.length === 0 && (
								<TableRow>
									<TableCell colSpan={3} className='ps-3 py-4 font-normal text-[13px] text-content-secondary'>
										{t('usageWidgets.cellEmpty')}
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

export default UsageBreakdown;
