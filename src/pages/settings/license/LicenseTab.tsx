import { useState } from 'react';
import { AddButton, Chip, Loader } from '@/components/atoms';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import LicenseApi from '@/api/LicenseApi';
import { License, LICENSE_STATUS } from '@/models/License';
import { useQuery } from '@tanstack/react-query';
import formatDate from '@/utils/common/format_date';
import { useTranslation } from 'react-i18next';
import CreateLicenseDialog from '@/pages/licenses/CreateLicenseDialog';
import RevokeLicenseDialog from '@/pages/licenses/RevokeLicenseDialog';

// Settings tabs aren't routed pages, so license details/revoke render as dialogs
// over the list instead of navigating to a standalone /licenses/:id route.
const LicenseTab = () => {
	const { t } = useTranslation(['catalog', 'common']);
	const { can } = useCurrentUserPermissions();
	const canWrite = can('license', 'write');
	const [createOpen, setCreateOpen] = useState(false);
	const [revokeTarget, setRevokeTarget] = useState<License | null>(null);
	const [detailsTarget, setDetailsTarget] = useState<License | null>(null);

	const {
		data: licenses,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['fetchLicenses'],
		queryFn: () => LicenseApi.listLicenses(),
	});

	const columns: ColumnData<License>[] = [
		{
			title: t('catalog:licenses.table.jti'),
			render: (row) => <code className='font-mono text-xs'>{row.jti}</code>,
		},
		{
			title: t('catalog:licenses.table.tier'),
			render: (row) => <Chip variant='default' label={row.tier} />,
		},
		{
			title: t('catalog:licenses.table.environment'),
			fieldName: 'env',
		},
		{
			title: t('catalog:licenses.table.status'),
			render: (row) => <Chip variant={row.status === LICENSE_STATUS.ACTIVE ? 'success' : 'default'} label={row.status} />,
		},
		{
			title: t('catalog:licenses.table.expires'),
			render: (row) => formatDate(row.exp),
		},
		{
			title: '',
			render: (row) =>
				row.status === LICENSE_STATUS.ACTIVE && canWrite ? (
					<button
						className='text-sm text-destructive hover:underline'
						onClick={(e) => {
							e.stopPropagation();
							setRevokeTarget(row);
						}}>
						{t('catalog:licenses.details.revoke')}
					</button>
				) : null,
		},
	];

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex items-center justify-between'>
				<h3 className='text-lg font-semibold text-content-zinc-bold'>{t('catalog:licenses.listPage.title')}</h3>
				{canWrite && <AddButton onClick={() => setCreateOpen(true)} />}
			</div>

			{isLoading ? (
				<Loader />
			) : (
				<FlexpriceTable columns={columns} data={licenses ?? []} showEmptyRow onRowClick={(row) => setDetailsTarget(row)} />
			)}

			<CreateLicenseDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={() => refetch()} />

			{revokeTarget && (
				<RevokeLicenseDialog
					jti={revokeTarget.jti}
					open={!!revokeTarget}
					onOpenChange={(next) => !next && setRevokeTarget(null)}
					onSuccess={() => {
						refetch();
						setRevokeTarget(null);
					}}
				/>
			)}

			<Dialog open={!!detailsTarget} onOpenChange={(next) => !next && setDetailsTarget(null)}>
				<DialogContent className='w-full max-w-lg bg-surface'>
					<DialogHeader>
						<DialogTitle>{t('catalog:licenses.details.title')}</DialogTitle>
					</DialogHeader>
					{detailsTarget && (
						<div className='space-y-4 py-2'>
							<div className='rounded-md border border-line-strong bg-muted/40 p-3 text-sm text-muted-foreground'>
								{detailsTarget.status === LICENSE_STATUS.REVOKED
									? t('catalog:licenses.details.revokedNotice')
									: t('catalog:licenses.details.jwtNotice')}
							</div>
							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-1 col-span-2'>
									<span className='text-sm font-medium text-muted-foreground'>{t('catalog:licenses.table.jti')}</span>
									<div className='text-sm break-all [overflow-wrap:anywhere]'>
										<code className='font-mono bg-muted px-1.5 py-0.5 rounded text-xs break-all [overflow-wrap:anywhere]'>
											{detailsTarget.jti}
										</code>
									</div>
								</div>
								<div className='space-y-1'>
									<span className='text-sm font-medium text-muted-foreground'>{t('catalog:licenses.table.tier')}</span>
									<div>
										<Chip variant='default' label={detailsTarget.tier} />
									</div>
								</div>
								<div className='space-y-1'>
									<span className='text-sm font-medium text-muted-foreground'>{t('catalog:licenses.table.environment')}</span>
									<div className='text-sm'>{detailsTarget.env}</div>
								</div>
								<div className='space-y-1'>
									<span className='text-sm font-medium text-muted-foreground'>{t('catalog:licenses.table.status')}</span>
									<div>
										<Chip variant={detailsTarget.status === LICENSE_STATUS.ACTIVE ? 'success' : 'default'} label={detailsTarget.status} />
									</div>
								</div>
								<div className='space-y-1 col-span-2'>
									<span className='text-sm font-medium text-muted-foreground'>{t('catalog:licenses.details.customer')}</span>
									<div className='text-sm break-all [overflow-wrap:anywhere]'>{detailsTarget.customer || '—'}</div>
								</div>
								<div className='space-y-1'>
									<span className='text-sm font-medium text-muted-foreground'>{t('catalog:licenses.details.features')}</span>
									<div className='text-sm'>{detailsTarget.features?.length ? detailsTarget.features.join(', ') : '—'}</div>
								</div>
								<div className='space-y-1'>
									<span className='text-sm font-medium text-muted-foreground'>{t('catalog:licenses.table.expires')}</span>
									<div className='text-sm'>{formatDate(detailsTarget.exp)}</div>
								</div>
								<div className='space-y-1'>
									<span className='text-sm font-medium text-muted-foreground'>{t('catalog:licenses.details.createdAt')}</span>
									<div className='text-sm'>{detailsTarget.created_at ? formatDate(detailsTarget.created_at) : '—'}</div>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default LicenseTab;
