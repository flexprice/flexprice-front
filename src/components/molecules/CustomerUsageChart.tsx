import * as React from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceArea, Brush } from 'recharts';
import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { formatCompactNumber } from '@/utils';
import { GetUsageAnalyticsResponse } from '@/types/dto';
import { UsageAnalyticItem } from '@/models/Analytics';
import { useCustomerUsageChartT } from './CustomerUsageChart.i18n';
import type { ReactNode } from 'react';

// Configuration constants - adjust these values as needed
const MAX_LEGEND_ITEMS = 5;
const TOOLTIP_MAX_HEIGHT = 200; // pixels

/**
 * Normalizes usage analytics data for chart display
 * @param items Array of UsageAnalyticItem from API response
 * @returns Normalized data ready for chart consumption
 */
const normalizeUsageData = (items: UsageAnalyticItem[], getSeriesFallbackName: (seriesIndex: number) => string) => {
	// Early return if no items
	if (!items || items.length === 0) {
		return {
			chartData: [],
			seriesConfig: {},
			seriesIds: [],
			seriesIdsWithPoints: new Set<string>(),
		};
	}

	// Create a map to store all timestamps and corresponding data points
	const timestampMap: Record<string, Record<string, number>> = {};
	const seriesConfig: Record<string, { label: string; color?: string }> = {};
	const seriesIds: string[] = [];
	// chartData zero-fills every series on every row, which is right for drawing a
	// continuous line but makes a series that reported nothing indistinguishable
	// from one that reported zero. Tracked here so markers can tell them apart.
	const seriesIdsWithPoints = new Set<string>();

	// Process each item (data series)
	items.forEach((item, index) => {
		const seriesId = item.source || item.feature_id || `series-${index}`;
		const seriesName = item.name || item.event_name || getSeriesFallbackName(index);

		// Add to series config
		seriesIds.push(seriesId);
		seriesConfig[seriesId] = {
			label: seriesName,
			color: `var(--chart-${(index % 10) + 1})`, // Use predefined chart colors with modulo for cycling
		};

		// Process each data point
		item.points?.forEach((point) => {
			const timestamp = point.timestamp;

			// Create timestamp entry if it doesn't exist
			if (!timestampMap[timestamp]) {
				timestampMap[timestamp] = {};
			}

			// Add usage value to the map - ensure it's a valid number
			const usageValue = parseFloat(point.usage.toString());
			// Ensure the usage value is a number and not too small (to avoid floating point issues)
			const normalizedValue = isNaN(usageValue) ? 0 : Math.round(usageValue * 100) / 100;
			timestampMap[timestamp][seriesId] = normalizedValue;
			seriesIdsWithPoints.add(seriesId);
		});
	});

	// Convert the map to array format for the chart
	const chartData = Object.keys(timestampMap)
		.sort() // Sort timestamps chronologically
		.map((timestamp) => {
			const dataPoint: Record<string, string | number> = { date: timestamp };

			// Add all series values for this timestamp
			seriesIds.forEach((seriesId) => {
				dataPoint[seriesId] = timestampMap[timestamp][seriesId] || 0;
			});

			return dataPoint;
		});

	return {
		chartData,
		seriesConfig,
		seriesIds,
		seriesIdsWithPoints,
	};
};

interface CustomerUsageChartProps {
	data: GetUsageAnalyticsResponse;
	/** A node, not just a string, so a caller can badge it with a section icon. */
	title?: ReactNode;
	description?: string;
	className?: string;
	/** Portal primary color — defaults to indigo if not provided */
	primaryColor?: string;
	/**
	 * Plot height in px. Defaults to the dashboard's 400. Customer-facing surfaces pass a
	 * shorter value so a sparse series does not leave a wall of empty space.
	 */
	height?: number;
}

export const CustomerUsageChart: React.FC<CustomerUsageChartProps> = ({
	data,
	title,
	description,
	className,
	primaryColor,
	height = 400,
}) => {
	const t = useCustomerUsageChartT();
	// Process the data for chart display
	const { chartData, seriesConfig, seriesIds, seriesIdsWithPoints } = normalizeUsageData(data.items, (seriesIndex) =>
		t('customerCharts.seriesFallback', { index: seriesIndex + 1 }),
	);

	// State for zoom functionality
	const [zoomState, setZoomState] = useState({
		left: 'dataMin',
		right: 'dataMax',
		refAreaLeft: '',
		refAreaRight: '',
		animation: true,
		brushStartIndex: 0,
		brushEndIndex: 0, // Will be updated in useEffect
	});

	// Update brush end index when chart data changes
	React.useEffect(() => {
		if (chartData.length > 0) {
			setZoomState((prev) => ({
				...prev,
				brushEndIndex: chartData.length - 1,
			}));
		}
	}, [chartData.length]);

	/*
	 * Categorical series palette — deliberately literal, unlike the chart chrome.
	 *
	 * These are data colours: saturated mid-tones chosen to stay distinguishable from each other
	 * on either canvas, and to keep the series-to-legend mapping stable. Inverting them per theme
	 * would change which colour means which series. The chrome around them — axes, grid, ticks,
	 * tooltip surface and text — IS tokenized and follows the theme.
	 */
	const getSeriesColor = (index: number) => {
		if (index === 0 && primaryColor) return primaryColor;
		const colors = [
			'rgba(99, 102, 241, 0.9)', // Indigo
			'rgba(14, 165, 233, 0.9)', // Sky blue
			'rgba(79, 70, 229, 0.9)', // Violet
			'rgba(56, 189, 248, 0.9)', // Light blue
			'rgba(124, 58, 237, 0.9)', // Purple
			'rgba(6, 182, 212, 0.9)', // Cyan
			'rgba(168, 85, 247, 0.9)', // Fuchsia
			'rgba(45, 212, 191, 0.9)', // Teal
		];
		return colors[index % colors.length];
	};

	// Handle zoom start
	const handleZoomStart = (event: { activeLabel?: string }) => {
		if (!event || !event.activeLabel) return;
		setZoomState({
			...zoomState,
			refAreaLeft: event.activeLabel,
		});
	};

	// Handle zoom move
	const handleZoomMove = (event: { activeLabel?: string }) => {
		if (!event || !event.activeLabel || !zoomState.refAreaLeft) return;
		setZoomState({
			...zoomState,
			refAreaRight: event.activeLabel,
		});
	};

	// Handle zoom end
	const handleZoomEnd = () => {
		if (!zoomState.refAreaLeft || !zoomState.refAreaRight) return;

		// Ensure left is less than right
		const leftIndex = Math.min(
			chartData.findIndex((item) => item.date === zoomState.refAreaLeft),
			chartData.findIndex((item) => item.date === zoomState.refAreaRight),
		);

		const rightIndex = Math.max(
			chartData.findIndex((item) => item.date === zoomState.refAreaLeft),
			chartData.findIndex((item) => item.date === zoomState.refAreaRight),
		);

		// Make sure we have valid indices
		const validLeftIndex = leftIndex >= 0 ? leftIndex : 0;
		const validRightIndex = rightIndex >= 0 ? rightIndex : chartData.length - 1;

		// Update zoom state
		setZoomState({
			...zoomState,
			left: validLeftIndex.toString(),
			right: validRightIndex.toString(),
			refAreaLeft: '',
			refAreaRight: '',
			brushStartIndex: validLeftIndex,
			brushEndIndex: validRightIndex,
		});
	};

	// Reset zoom
	const handleZoomReset = () => {
		setZoomState({
			...zoomState,
			left: 'dataMin',
			right: 'dataMax',
			refAreaLeft: '',
			refAreaRight: '',
			brushStartIndex: 0,
			brushEndIndex: chartData.length - 1,
		});
	};

	// No longer tracking active chart series or totals as we're showing all lines

	// If no data, show empty state
	if (chartData.length === 0) {
		return (
			<Card className={`py-4 sm:py-0 ${className || ''}`}>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{t('customerCharts.usageNoDataDescription')}</CardDescription>
				</CardHeader>
				<CardContent className='flex items-center justify-center h-[250px]'>
					<p className='text-muted-foreground'>{t('customerCharts.usageNoDataBody')}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<style>{`
				.custom-tooltip-scroll::-webkit-scrollbar {
					width: 4px;
				}
				.custom-tooltip-scroll::-webkit-scrollbar-track {
					background: transparent;
				}
				.custom-tooltip-scroll::-webkit-scrollbar-thumb {
					background: rgb(var(--fp-content-subtle) / 0.3);
					border-radius: 6px;
				}
				.custom-tooltip-scroll::-webkit-scrollbar-thumb:hover {
					background: rgb(var(--fp-content-subtle) / 0.5);
				}
				.custom-tooltip-scroll {
					scrollbar-width: thin;
					scrollbar-color: rgb(var(--fp-content-subtle) / 0.3) transparent;
				}
			`}</style>
			<Card className={`py-2 sm:py-0 shadow-none ${className || ''}`}>
				<CardHeader className='px-6 py-4'>
					{title && <CardTitle className='text-base font-medium'>{title}</CardTitle>}
					{description && <CardDescription className='text-xs text-content-muted'>{description}</CardDescription>}
				</CardHeader>
				<CardContent className='px-2 sm:px-6 pt-0 pb-4'>
					<div className='flex justify-end mb-3'>
						<button
							onClick={handleZoomReset}
							className='text-xs px-2.5 py-1 rounded-md transition-colors'
							style={{
								display: zoomState.left !== 'dataMin' || zoomState.right !== 'dataMax' ? 'flex' : 'none',
								alignItems: 'center',
								gap: '4px',
								backgroundColor: primaryColor ? `${primaryColor}1a` : 'rgb(var(--fp-accent-indigo-muted))',
								border: `1px solid ${primaryColor ? `${primaryColor}33` : '#c7d2fe'}`,
								color: primaryColor ?? '#6366f1',
							}}>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								width='12'
								height='12'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'>
								<path d='M2 12A10 10 0 1 0 12 2v10z'></path>
							</svg>
							{t('customerCharts.resetZoom')}
						</button>
					</div>
					<div className='relative' style={{ width: '100%', height }}>
						{zoomState.refAreaLeft && zoomState.refAreaRight && (
							<div className='absolute top-0 right-0 bg-accent-indigo-muted text-xs text-accent-indigo py-1 px-2 rounded-md z-10 border border-accent-indigo-line'>
								{t('customerCharts.selectingArea')}
							</div>
						)}
						<ResponsiveContainer width='100%' height='100%'>
							<LineChart
								data={chartData}
								margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
								onMouseDown={handleZoomStart}
								onMouseMove={handleZoomMove}
								onMouseUp={handleZoomEnd}>
								<CartesianGrid vertical={false} stroke='rgb(var(--fp-surface-shell) / 0.8)' />
								<XAxis
									dataKey='date'
									tickLine={false}
									axisLine={{ stroke: 'rgb(var(--fp-line) / 0.8)' }}
									tick={{ fill: 'rgb(var(--fp-content-subtle))', fontSize: 11 }}
									domain={[zoomState.left, zoomState.right]}
									tickFormatter={(value) => {
										const date = new Date(value);
										return date.toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
										});
									}}
									padding={{ left: 0, right: 0 }}
									dy={8}
								/>
								<YAxis
									tickLine={false}
									axisLine={false}
									tick={{ fill: 'rgb(var(--fp-content-subtle))', fontSize: 11 }}
									width={48}
									tickCount={5}
									dx={-5}
									tickFormatter={(value) => formatCompactNumber(value)}
								/>
								<Tooltip
									cursor={{ stroke: primaryColor ? `${primaryColor}66` : 'rgba(99,102,241,0.4)', strokeWidth: 1, strokeDasharray: '3 3' }}
									content={(props) => {
										const { active, payload, label } = props;
										if (!active || !payload || !payload.length) return null;

										return (
											<div
												style={{
													backgroundColor: 'rgb(var(--fp-surface) / 0.98)',
													border: 'none',
													borderRadius: '6px',
													boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
													fontSize: '12px',
													minWidth: '180px',
													zIndex: 9999,
													position: 'relative',
													pointerEvents: 'auto',
												}}
												onMouseDown={(e) => e.stopPropagation()}
												onMouseMove={(e) => e.stopPropagation()}
												onWheel={(e) => e.stopPropagation()}>
												<div
													style={{
														borderBottom: '1px solid #f3f4f6',
														paddingBottom: '6px',
														marginBottom: '8px',
														padding: '10px 14px 10px 14px',
													}}>
													<div
														style={{
															fontWeight: 600,
															color: 'rgb(var(--fp-content-secondary))',
															fontSize: '12px',
															letterSpacing: '0.025em',
														}}>
														{new Date(label).toLocaleDateString('en-US', {
															month: 'short',
															day: 'numeric',
															year: 'numeric',
														})}
													</div>
													<div
														style={{
															color: 'rgb(var(--fp-content-muted))',
															fontSize: '11px',
															marginTop: '2px',
														}}>
														{new Date(label).toLocaleTimeString('en-US', {
															hour: '2-digit',
															minute: '2-digit',
														})}
													</div>
												</div>
												<div
													className='custom-tooltip-scroll'
													style={{
														display: 'flex',
														flexDirection: 'column',
														gap: '8px',
														padding: '0 14px 10px 14px',
														maxHeight: `${TOOLTIP_MAX_HEIGHT}px`,
														overflowY: 'auto',
														overflowX: 'hidden',
													}}>
													{payload.map((entry, index: number) => (
														<div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
															<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
																<span
																	style={{
																		width: '8px',
																		height: '8px',
																		borderRadius: '50%',
																		backgroundColor: entry.color,
																		display: 'inline-block',
																	}}></span>
																<span style={{ color: 'rgb(var(--fp-content-tertiary))', fontSize: '11px' }}>
																	{(typeof entry.dataKey === 'string' && seriesConfig[entry.dataKey]?.label) || entry.name || entry.dataKey}
																</span>
															</div>
															<span style={{ fontWeight: 500, color: 'rgb(var(--fp-content))' }}>
																{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
															</span>
														</div>
													))}
												</div>
											</div>
										);
									}}
								/>
								{seriesIds.length <= MAX_LEGEND_ITEMS && (
									<Legend
										iconType='circle'
										iconSize={6}
										wrapperStyle={{
											fontSize: '11px',
											paddingTop: '15px',
											paddingBottom: '5px',
											color: 'rgb(var(--fp-content-muted))',
										}}
										onClick={(data) => {
											// Could implement toggle visibility here
											console.log('Legend clicked:', data);
										}}
									/>
								)}
								<Brush
									dataKey='date'
									height={20}
									stroke={primaryColor ? `${primaryColor}99` : 'rgba(99, 102, 241, 0.6)'}
									fill={primaryColor ? `${primaryColor}22` : 'rgb(var(--fp-surface-shell) / 0.2)'}
									travellerWidth={8}
									// Derived from the plot height rather than fixed at 330: the height is
									// configurable, and a shorter chart left the brush rendering outside it.
									y={Math.max(0, height - 70)}
									tickFormatter={(value) => {
										const date = new Date(value);
										return date.toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
										});
									}}
									startIndex={zoomState.brushStartIndex}
									endIndex={zoomState.brushEndIndex}
									onChange={(brushRange) => {
										if (!brushRange) return;

										const startIdx = typeof brushRange.startIndex === 'number' ? brushRange.startIndex : 0;
										const endIdx = typeof brushRange.endIndex === 'number' ? brushRange.endIndex : chartData.length - 1;

										// Only update if the indices are valid
										if (startIdx >= 0 && endIdx >= 0 && startIdx <= endIdx) {
											setZoomState((prev) => ({
												...prev,
												left: startIdx.toString(),
												right: endIdx.toString(),
												refAreaLeft: '',
												refAreaRight: '',
												brushStartIndex: startIdx,
												brushEndIndex: endIdx,
											}));
										}
									}}
								/>
								{zoomState.refAreaLeft && zoomState.refAreaRight && (
									<ReferenceArea
										x1={zoomState.refAreaLeft}
										x2={zoomState.refAreaRight}
										stroke={primaryColor ? `${primaryColor}cc` : 'rgb(var(--fp-accent-indigo-bright) / 0.8)'}
										strokeWidth={1}
										strokeDasharray='3 3'
										fill={primaryColor ? `${primaryColor}26` : 'rgba(99, 102, 241, 0.15)'}
										fillOpacity={0.8}
									/>
								)}
								{seriesIds.map((seriesId, index) => (
									<Line
										key={seriesId}
										name={seriesConfig[seriesId]?.label || seriesId}
										dataKey={seriesId}
										type='monotone'
										stroke={getSeriesColor(index)}
										strokeWidth={1.5}
										// A line needs two points to draw anything, so a chart with a single
										// row renders an empty plot unless the point is marked.
										//
										// The chart's row count, not a per-series one: chartData zero-fills
										// every series on every row (see `|| 0` above), so a series with one
										// real reading still draws a line through zeros and stays visible.
										// Only a single-row chart has nothing to draw. Gated on the series
										// having a real reading, or a series that reported nothing would be
										// marked at zero as if it had.
										dot={
											chartData.length < 2 && seriesIdsWithPoints.has(seriesId)
												? { r: 3.5, stroke: 'rgb(var(--fp-surface))', strokeWidth: 1, fill: getSeriesColor(index) }
												: false
										}
										activeDot={{
											r: 3.5,
											stroke: 'rgb(var(--fp-surface))',
											strokeWidth: 1,
											fill: getSeriesColor(index),
										}}
										isAnimationActive={zoomState.animation}
										animationDuration={600}
										animationEasing='ease-out'
									/>
								))}
							</LineChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>
		</>
	);
};

export default CustomerUsageChart;
