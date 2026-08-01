import { FC, useState } from 'react';
import { useEndpoints, useEndpointStats } from 'svix-react';
import type { EndpointOut } from 'svix';
import { Rss } from 'lucide-react';
import { AddButton, Button, Loader } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { Trans, useTranslation } from 'react-i18next';
import AddEndpointForm from './AddEndpointForm';
import EndpointDetail from './EndpointDetail';

interface Props {
	onViewEventCatalog: () => void;
}

const ErrorRateCell: FC<{ endpointId: string }> = ({ endpointId }) => {
	const { t } = useTranslation('developers');
	const { data, loading } = useEndpointStats(endpointId);
	if (loading || !data) return <span className='text-sm text-content-subtle'>{t('labels.missingValue')}</span>;
	const total = (data.success ?? 0) + (data.fail ?? 0);
	const rate = total > 0 ? (((data.fail ?? 0) / total) * 100).toFixed(1) : '0.0';
	return <span className='text-sm text-content-tertiary'>{rate}%</span>;
};

const EndpointsTable: FC<Props> = ({ onViewEventCatalog }) => {
	const { t } = useTranslation(['developers', 'common']);
	// Explicit page size so the prev/next controls below actually paginate instead of
	// rendering one ever-growing list (svix's default limit is large).
	const endpoints = useEndpoints({ limit: 20 });
	const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
	const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);

	if (view === 'new') {
		return (
			<AddEndpointForm
				onBack={() => setView('list')}
				onCreated={() => {
					endpoints.reload();
					setView('list');
				}}
				onViewEventCatalog={onViewEventCatalog}
			/>
		);
	}

	if (view === 'detail' && selectedEndpointId) {
		return (
			<EndpointDetail
				endpointId={selectedEndpointId}
				onBack={() => setView('list')}
				onDeleted={() => {
					endpoints.reload();
					setView('list');
				}}
			/>
		);
	}

	if (endpoints.loading && !endpoints.data) {
		return (
			<div className='flex h-64 items-center justify-center'>
				<Loader />
			</div>
		);
	}

	if (endpoints.error) {
		return <div className='p-4 text-sm text-danger'>{t('webhooks.endpoints.loadFailed')}</div>;
	}

	const openDetail = (endpointId: string) => {
		setSelectedEndpointId(endpointId);
		setView('detail');
	};

	const columns: ColumnData<EndpointOut>[] = [
		{
			title: t('webhooks.endpoints.columns.endpoint'),
			render: (row) => (
				<div className='min-w-0'>
					<div className='truncate font-medium text-sm'>{row.url}</div>
					{row.description && <div className='truncate text-xs text-content-muted'>{row.description}</div>}
				</div>
			),
		},
		{
			title: t('webhooks.endpoints.columns.errorRate'),
			align: 'right',
			render: (row) => <ErrorRateCell endpointId={row.id} />,
		},
	];

	const hasEndpoints = (endpoints.data?.length ?? 0) > 0;

	return (
		<div className='flex flex-col gap-4'>
			{hasEndpoints && (
				<div className='flex items-center justify-between'>
					<h3 className='text-lg font-medium'>{t('webhooks.endpoints.heading')}</h3>
					<AddButton label={t('webhooks.endpoints.addEndpoint')} onClick={() => setView('new')} />
				</div>
			)}

			{hasEndpoints ? (
				<FlexpriceTable columns={columns} data={endpoints.data!} onRowClick={(row) => openDetail(row.id)} />
			) : (
				<div className='flex flex-col items-center justify-center rounded-md border border-border bg-surface-subtle/50 py-16 px-6 text-center'>
					<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface border border-border'>
						<Rss className='h-5 w-5 text-content-muted' />
					</div>
					<h3 className='text-base font-medium text-content'>{t('webhooks.endpoints.empty.title')}</h3>
					<p className='mt-2 pb-5 max-w-md text-sm text-content-muted'>
						<Trans
							i18nKey='developers:webhooks.endpoints.empty.subtitle'
							components={{
								link: (
									<button
										type='button'
										className='font-medium text-content underline underline-offset-2 hover:text-content-secondary'
										onClick={onViewEventCatalog}
									/>
								),
							}}
						/>
					</p>
					<AddButton className='mt-6' label={t('webhooks.endpoints.addEndpoint')} onClick={() => setView('new')} />
				</div>
			)}

			{(endpoints.hasPrevPage || endpoints.hasNextPage) && (
				<div className='flex justify-end gap-2'>
					<Button variant='outline' disabled={!endpoints.hasPrevPage} onClick={endpoints.prevPage}>
						{t('common:pagination.previous')}
					</Button>
					<Button variant='outline' disabled={!endpoints.hasNextPage} onClick={endpoints.nextPage}>
						{t('common:pagination.next')}
					</Button>
				</div>
			)}
		</div>
	);
};

export default EndpointsTable;
