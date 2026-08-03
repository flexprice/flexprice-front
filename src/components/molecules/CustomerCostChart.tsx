'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { GetCostAnalyticsResponse } from '@/types/dto/Cost';
import { useTranslation } from 'react-i18next';

interface CustomerCostChartProps {
	data: GetCostAnalyticsResponse;
	title?: string;
	description?: string;
	className?: string;
}

/**
 * Customer Cost Chart Component
 * Displays cost analytics data in a simplified card format
 */
export const CustomerCostChart: React.FC<CustomerCostChartProps> = ({ data, title, description, className }) => {
	const { t } = useTranslation('common');
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className='text-lg font-medium text-content'>{title || t('customerCharts.costAnalyticsDefaultTitle')}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent>
				<div className='space-y-4'>
					{/* Summary Statistics */}
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div className='p-4 bg-info-muted rounded-lg border border-info-muted-strong'>
							<p className='text-sm text-info font-medium mb-1'>{t('customerCharts.totalCost')}</p>
							<p className='text-2xl font-bold text-info-deepest'>{parseFloat(data.total_cost || '0').toFixed(2)}</p>
							<p className='text-xs text-info-bright mt-1'>{data.currency}</p>
						</div>
						<div className='p-4 bg-success-muted rounded-lg border border-success-line-subtle'>
							<p className='text-sm text-success font-medium mb-1'>{t('customerCharts.totalQuantity')}</p>
							<p className='text-2xl font-bold text-success-deepest'>{parseFloat(data.total_quantity || '0').toLocaleString()}</p>
						</div>
						<div className='p-4 bg-accent-purple-muted rounded-lg border border-accent-purple-line'>
							<p className='text-sm text-accent-purple font-medium mb-1'>{t('customerCharts.totalEvents')}</p>
							<p className='text-2xl font-bold text-accent-purple-deep'>{data.total_events?.toLocaleString() || 0}</p>
						</div>
					</div>

					{/* Time Range */}
					{(data.start_time || data.end_time) && (
						<div className='flex items-center justify-between p-3 bg-surface-subtle rounded-lg border border-line'>
							<div className='flex items-center gap-2'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									width='16'
									height='16'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
									className='text-content-muted'>
									<rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect>
									<line x1='16' y1='2' x2='16' y2='6'></line>
									<line x1='8' y1='2' x2='8' y2='6'></line>
									<line x1='3' y1='10' x2='21' y2='10'></line>
								</svg>
								<span className='text-sm text-content-tertiary'>
									{data.start_time ? new Date(data.start_time).toLocaleDateString() : t('labels.notApplicable')} →{' '}
									{data.end_time ? new Date(data.end_time).toLocaleDateString() : t('labels.notApplicable')}
								</span>
							</div>
						</div>
					)}

					{/* Cost Breakdown Preview */}
					{data.cost_analytics && data.cost_analytics.length > 0 && (
						<div className='mt-4'>
							<p className='text-sm font-medium text-content-secondary mb-2'>{t('customerCharts.topCostItems')}</p>
							<div className='space-y-2'>
								{data.cost_analytics.slice(0, 5).map((item, index) => (
									<div key={index} className='flex items-center justify-between p-2 bg-surface-subtle rounded-lg border border-line'>
										<span className='text-sm text-content-secondary'>{item.meter_name || item.meter?.name || item.meter_id}</span>
										<span className='text-sm font-semibold text-content'>
											{parseFloat(item.total_cost || '0').toFixed(2)} {item.currency}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
};

export default CustomerCostChart;
