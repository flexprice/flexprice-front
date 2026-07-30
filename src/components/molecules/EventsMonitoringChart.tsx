'use client';

import * as React from 'react';
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { formatCompactNumber } from '@/utils';
import { GetMonitoringDataResponse, EventCountPoint } from '@/types/dto';
import { getTypographyClass } from '@/lib/typography';
import { useTranslation } from 'react-i18next';

const normalizeMonitoringData = (response: GetMonitoringDataResponse) => {
	if (!response.points || response.points.length === 0) {
		return [];
	}

	const chartData = response.points
		.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
		.map((point: EventCountPoint) => ({
			timestamp: point.timestamp,
			event_count: point.event_count,
			date: new Date(point.timestamp).toISOString(),
		}));

	return chartData;
};

interface EventsMonitoringChartProps {
	data: GetMonitoringDataResponse;
	title?: string;
	description?: string;
	className?: string;
	onViewLatestData?: () => void;
}

const CHART_MARGIN = { top: 20, right: 30, left: 20, bottom: 20 };
const CHART_HEIGHT = 300;

export const EventsMonitoringChart: React.FC<EventsMonitoringChartProps> = ({ data, title, description, className, onViewLatestData }) => {
	const { t, i18n } = useTranslation(['developers', 'common']);
	const dateLocale = i18n.resolvedLanguage ?? i18n.language ?? 'en';
	const displayTitle = title ?? t('events.monitoring.title');
	const displayDescription = description ?? t('events.monitoring.description');
	const eventCountLabel = t('events.monitoring.eventCount');

	const chartData = normalizeMonitoringData(data);

	const hasData = chartData.length > 0;
	const displayData = hasData ? chartData : [{ timestamp: new Date().toISOString(), event_count: 0, date: new Date().toISOString() }];

	const renderChart = (dataToShow: typeof displayData, options: { showTooltip?: boolean }) => {
		const { showTooltip = true } = options;
		return (
			<AreaChart data={dataToShow} margin={CHART_MARGIN}>
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
						return date.toLocaleDateString(dateLocale, {
							month: 'short',
							day: 'numeric',
							...(dataToShow.length > 6 ? {} : { hour: '2-digit', minute: '2-digit' }),
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
					tickFormatter={formatCompactNumber}
				/>
				{showTooltip && (
					<Tooltip
						cursor={hasData ? { stroke: 'rgba(99, 102, 241, 0.4)', strokeWidth: 1, strokeDasharray: '3 3' } : false}
						content={(props) => {
							const { active, payload, label } = props;
							if (!active || !payload || !payload.length || !hasData) return null;

							const pointData = payload[0]?.payload;
							if (!pointData) return null;

							return (
								<div
									style={{
										backgroundColor: 'rgba(255, 255, 255, 0.98)',
										border: 'none',
										borderRadius: '6px',
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
												fontWeight: 600,
												color: '#374151',
												fontSize: '13px',
												letterSpacing: '0.025em',
											}}>
											{new Date(label as string).toLocaleDateString(dateLocale, {
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
											{new Date(label as string).toLocaleTimeString(dateLocale, {
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
										<span style={{ color: '#4b5563', fontSize: '11px' }}>{eventCountLabel}</span>
										<span style={{ fontWeight: 600, color: '#111827', marginLeft: 'auto' }}>
											{formatCompactNumber(pointData.event_count)}
										</span>
									</div>
								</div>
							);
						}}
					/>
				)}
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
		);
	};

	return (
		<Card className={`shadow-sm ${className || ''}`}>
			<CardHeader className='pb-4'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
					<div>
						<CardTitle className={getTypographyClass('section-title', 'font-medium')}>{displayTitle}</CardTitle>
						<CardDescription className={getTypographyClass('helper-text', 'mt-1')}>{displayDescription}</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent className='pt-0'>
				<div className='relative' style={{ width: '100%', height: CHART_HEIGHT }}>
					{hasData ? (
						<ResponsiveContainer width='100%' height='100%'>
							{renderChart(displayData, { showTooltip: true })}
						</ResponsiveContainer>
					) : (
						<>
							<div className='absolute inset-0 select-none pointer-events-none' style={{ filter: 'blur(2px)', opacity: 0.8 }}>
								<ResponsiveContainer width='100%' height='100%'>
									{renderChart(displayData, { showTooltip: false })}
								</ResponsiveContainer>
							</div>
							<div className='absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30'>
								<div className='text-center max-w-sm px-4'>
									<h3 className={getTypographyClass('section-title', 'font-semibold text-zinc-900')}>
										{t('events.monitoring.emptyRangeTitle')}
									</h3>
									<p className={getTypographyClass('body-default', 'text-zinc-600 mt-2')}>{t('events.monitoring.emptyRangeDescription')}</p>
									{onViewLatestData && (
										<Button onClick={onViewLatestData} className='mt-4'>
											{t('events.monitoring.viewLatestData')}
										</Button>
									)}
								</div>
							</div>
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
};

export default EventsMonitoringChart;
