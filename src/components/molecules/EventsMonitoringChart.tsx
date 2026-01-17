'use client';

import * as React from 'react';
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { GetMonitoringDataResponse, EventCountPoint } from '@/types/dto';
import { getTypographyClass } from '@/lib/typography';

/**
 * Normalizes monitoring data for chart display
 * @param response GetMonitoringDataResponse from API
 * @returns Normalized data ready for chart consumption
 */
const normalizeMonitoringData = (response: GetMonitoringDataResponse) => {
	// Early return if no points
	if (!response.points || response.points.length === 0) {
		return [];
	}

	// Convert points to chart format
	const chartData = response.points
		.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
		.map((point: EventCountPoint) => ({
			timestamp: point.timestamp,
			event_count: point.event_count,
			date: new Date(point.timestamp).toISOString(),
		}));

	return chartData;
};

/**
 * Format large numbers for display
 */
const formatNumber = (value: number): string => {
	if (value >= 1000000) {
		return `${(value / 1000000).toFixed(1)}M`;
	}
	if (value >= 1000) {
		return `${(value / 1000).toFixed(1)}K`;
	}
	return value.toString();
};

interface EventsMonitoringChartProps {
	data: GetMonitoringDataResponse;
	title?: string;
	description?: string;
	className?: string;
}

export const EventsMonitoringChart: React.FC<EventsMonitoringChartProps> = ({
	data,
	title = 'Events Monitoring',
	description = 'Event processing metrics and lag information',
	className,
}) => {
	// Process the data for chart display
	const chartData = normalizeMonitoringData(data);

	// Create empty chart data if no data points exist
	const hasData = chartData.length > 0;
	const displayData = hasData ? chartData : [{ timestamp: new Date().toISOString(), event_count: 0, date: new Date().toISOString() }];

	return (
		<Card className={`shadow-sm ${className || ''}`}>
			<CardHeader className='pb-4'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
					<div>
						<CardTitle className={getTypographyClass('section-title', 'font-medium')}>{title}</CardTitle>
						<CardDescription className={getTypographyClass('helper-text', 'mt-1')}>{description}</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent className='pt-0'>
				{/* Show "No data" message overlay when there's no data */}
				<div className='relative' style={{ width: '100%', height: 300 }}>
					<ResponsiveContainer width='100%' height='100%'>
						<AreaChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
							<defs>
								<linearGradient id='eventCountGradient' x1='0' y1='0' x2='0' y2='1'>
									<stop offset='5%' stopColor='rgba(99, 102, 241, 0.8)' stopOpacity={0.8} />
									<stop offset='95%' stopColor='rgba(99, 102, 241, 0.1)' stopOpacity={0.1} />
								</linearGradient>
							</defs>
							<CartesianGrid vertical={false} stroke='rgba(243, 244, 246, 0.8)' strokeDasharray='3 3' />
							<XAxis
								dataKey='timestamp'
								tickLine={false}
								axisLine={{ stroke: 'rgba(229, 231, 235, 0.8)' }}
								tick={{ fill: '#9ca3af', fontSize: 11 }}
								tickFormatter={(value) => {
									const date = new Date(value);
									return date.toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
										hour: '2-digit',
										minute: '2-digit',
									});
								}}
								interval='preserveStartEnd'
								dy={8}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tick={{ fill: '#9ca3af', fontSize: 11 }}
								width={50}
								tickCount={6}
								dx={-5}
								tickFormatter={formatNumber}
							/>
							<Tooltip
								cursor={hasData ? { stroke: 'rgba(99, 102, 241, 0.4)', strokeWidth: 1, strokeDasharray: '3 3' } : false}
								content={(props) => {
									const { active, payload, label } = props;
									if (!active || !payload || !payload.length || !hasData) return null;

									const data = payload[0]?.payload;
									if (!data) return null;

									return (
										<div
											style={{
												backgroundColor: 'rgba(255, 255, 255, 0.98)',
												border: 'none',
												borderRadius: '8px',
												boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
												padding: '12px 16px',
												fontSize: '12px',
												minWidth: '200px',
											}}>
											<div
												style={{
													borderBottom: '1px solid #f3f4f6',
													paddingBottom: '8px',
													marginBottom: '10px',
												}}>
												<div
													style={{
														fontWeight: 500,
														color: '#374151',
														fontSize: '13px',
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
														color: '#6b7280',
														fontSize: '11px',
														marginTop: '2px',
													}}>
													{new Date(label).toLocaleTimeString('en-US', {
														hour: '2-digit',
														minute: '2-digit',
														second: '2-digit',
													})}
												</div>
											</div>
											<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
												<span
													style={{
														width: '8px',
														height: '8px',
														borderRadius: '50%',
														backgroundColor: 'rgba(99, 102, 241, 0.8)',
														display: 'inline-block',
													}}></span>
												<span style={{ color: '#4b5563', fontSize: '11px' }}>Event Count</span>
												<span style={{ fontWeight: 500, color: '#111827', marginLeft: 'auto' }}>{data.event_count.toLocaleString()}</span>
											</div>
										</div>
									);
								}}
							/>
							<Area
								type='monotone'
								dataKey='event_count'
								stroke={hasData ? 'rgba(99, 102, 241, 0.8)' : 'rgba(156, 163, 175, 0.3)'}
								strokeWidth={2}
								fill={hasData ? 'url(#eventCountGradient)' : 'rgba(243, 244, 246, 0.2)'}
								dot={false}
								activeDot={
									hasData
										? {
												r: 4,
												stroke: '#fff',
												strokeWidth: 2,
												fill: 'rgba(99, 102, 241, 0.8)',
											}
										: false
								}
								isAnimationActive={hasData}
								animationDuration={800}
								animationEasing='ease-out'
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
};

export default EventsMonitoringChart;
