import { Button, Card, CardHeader, Chip, Loader, Page, Spacer } from '@/components/atoms';
import { ApiDocsContent, ColumnData, DetailsCard, FlexpriceTable, TooltipCell } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import WorkflowApi from '@/api/WorkflowApi';
import { RouteNames } from '@/core/routes/Routes';
import formatDate from '@/utils/common/format_date';
import { WORKFLOW_TYPE_DISPLAY_NAMES } from '@/constants/workflow';
import type { WorkflowDetailsResponse, WorkflowActivityDTO } from '@/types/dto';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const WORKFLOW_STATUS_TO_FILTER_KEY: Record<string, string> = {
	Running: 'running',
	Completed: 'completed',
	Failed: 'failed',
	Canceled: 'canceled',
	Terminated: 'terminated',
	ContinuedAsNew: 'continuedAsNew',
	TimedOut: 'timedOut',
};

function translateWorkflowStatus(status: string, t: TFunction<'developers'>): string {
	const suffix = WORKFLOW_STATUS_TO_FILTER_KEY[status];
	return suffix ? t(`workflows.filters.${suffix}`) : status;
}

const WorkflowDetailsPage = () => {
	const { t } = useTranslation(['developers', 'common']);
	const { workflowId, runId } = useParams<{ workflowId: string; runId: string }>();
	const navigate = useNavigate();

	const { data, isLoading, isError } = useQuery({
		queryKey: ['workflowDetails', workflowId, runId],
		queryFn: () => WorkflowApi.getDetails(workflowId!, runId!),
		enabled: !!workflowId && !!runId,
	});

	const wf = data as WorkflowDetailsResponse | undefined;
	const wfLabel = useMemo(() => translateWorkflowStatus(wf?.status ?? '', t), [wf?.status, t]);

	const summaryData = useMemo(() => {
		if (!wf) return [];
		return [
			{ label: t('labels.workflowId'), value: <TooltipCell tooltipContent={wf.workflow_id} tooltipText={wf.workflow_id} /> },
			{ label: t('labels.runId'), value: <TooltipCell tooltipContent={wf.run_id} tooltipText={wf.run_id} /> },
			{
				label: t('labels.workflowType'),
				value: WORKFLOW_TYPE_DISPLAY_NAMES[wf.workflow_type] ?? wf.workflow_type,
			},
			{ label: t('labels.taskQueue'), value: wf.task_queue },
			{
				label: t('labels.status'),
				value: <Chip variant={wf.status === 'Completed' ? 'success' : wf.status === 'Failed' ? 'failed' : 'default'} label={wfLabel} />,
			},
			{
				label: t('labels.duration'),
				value:
					wf.total_duration ?? (wf.duration_ms != null ? `${wf.duration_ms}${t('workflows.durationUnits.ms')}` : t('labels.missingValue')),
			},
			{
				label: t('labels.startTime'),
				value: <span title={wf.start_time}>{formatDate(wf.start_time)}</span>,
			},
			{
				label: t('labels.closeTime'),
				value: wf.close_time ? <span title={wf.close_time}>{formatDate(wf.close_time)}</span> : t('labels.missingValue'),
			},
		];
	}, [t, wf, wfLabel]);

	const activityColumns: ColumnData<WorkflowActivityDTO>[] = useMemo(
		() => [
			{ fieldName: 'activity_id', title: t('labels.activityId') },
			{ fieldName: 'activity_type', title: t('labels.activityType') },
			{
				title: t('labels.status'),
				render: (row) => (
					<Chip
						variant={row.status === 'COMPLETED' ? 'success' : row.status === 'FAILED' ? 'failed' : 'default'}
						label={t(`workflowDetail.activityStatus.${row.status}`, { defaultValue: row.status })}
					/>
				),
			},
			{
				title: t('labels.start'),
				render: (row) => (row.start_time ? <span title={row.start_time}>{formatDate(row.start_time)}</span> : t('labels.missingValue')),
			},
			{
				title: t('labels.close'),
				render: (row) => (row.close_time ? <span title={row.close_time}>{formatDate(row.close_time)}</span> : t('labels.missingValue')),
			},
			{ fieldName: 'retry_attempt', title: t('workflowDetail.columns.retries') },
			{
				title: t('labels.error'),
				render: (row) => (row.error ? <span className='text-destructive text-sm'>{row.error.message}</span> : t('labels.missingValue')),
			},
		],
		[t],
	);

	if (isLoading) return <Loader />;
	if (isError || !data) {
		return (
			<Page heading={t('workflowDetail.headingShort')}>
				<div className='text-center py-12'>
					<h3 className='text-lg font-medium text-gray-900 mb-2'>{t('workflowDetail.notFoundTitle')}</h3>
					<p className='text-muted-foreground mb-4'>{t('workflowDetail.notFoundDescription')}</p>
					<Button variant='outline' prefixIcon={<ArrowLeft className='h-4 w-4' />} onClick={() => navigate(RouteNames.workflows)}>
						{t('workflowDetail.backToWorkflows')}
					</Button>
				</div>
			</Page>
		);
	}

	const wfResolved = data as WorkflowDetailsResponse;

	return (
		<Page heading={t('workflowDetail.heading')}>
			<div className='mb-6'>
				<Button variant='outline' size='sm' prefixIcon={<ArrowLeft className='h-4 w-4' />} onClick={() => navigate(RouteNames.workflows)}>
					{t('workflowDetail.backToWorkflows')}
				</Button>
			</div>

			<ApiDocsContent tags={API_DOCS_TAGS.Workflows} />

			<div className='space-y-6'>
				<DetailsCard variant='stacked' title={t('workflowDetail.summaryTitle')} data={summaryData} />

				<Card variant='notched'>
					<CardHeader title={t('workflowDetail.activitiesTitle')} />
					{wfResolved.activities?.length ? (
						<FlexpriceTable columns={activityColumns} data={wfResolved.activities} showEmptyRow={false} />
					) : (
						<p className='text-sm text-muted-foreground'>{t('workflowDetail.noActivities')}</p>
					)}
				</Card>

				<Spacer className='!h-20' />
			</div>
		</Page>
	);
};

export default WorkflowDetailsPage;
