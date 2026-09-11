import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AddButton, Button, Chip, Loader, CopyIdButton } from '@/components/atoms';
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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function expiryFlag(license: License): 'expired' | 'expiringSoon' | null {
	const expMs = new Date(license.exp).getTime();
	if (Number.isNaN(expMs)) return null;
	const msLeft = expMs - Date.now();
	if (msLeft <= 0) return 'expired';
	if (license.status === LICENSE_STATUS.ACTIVE && msLeft < THIRTY_DAYS_MS) return 'expiringSoon';
	return null;
}

interface DetailField {
	label: string;
	value: ReactNode;
	fullWidth?: boolean;
}

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
			width: '28%',
			render: (row) => (
				<div className='flex items-center gap-1 min-w-0'>
					<code className='font-mono text-xs truncate' title={row.jti}>
						{row.jti}
					</code>
					<span className='shrink-0' onClick={(e) => e.stopPropagation()}>
						<CopyIdButton id={row.jti} toastMessage={t('catalog:licenses.createDialog.copyToastMessage')} />
					</span>
				</div>
			),
		},
		{
			title: t('catalog:licenses.table.tier'),
			width: '12%',
			render: (row) => <Chip variant='default' label={row.tier} />,
		},
		{
			title: t('catalog:licenses.table.environment'),
			width: '14%',
			fieldName: 'env',
		},
		{
			title: t('catalog:licenses.table.status'),
			width: '12%',
			render: (row) => <Chip variant={row.status === LICENSE_STATUS.ACTIVE ? 'success' : 'default'} label={row.status} />,
		},
		{
			title: t('catalog:licenses.table.expires'),
			width: '22%',
			render: (row) => {
				const flag = expiryFlag(row);
				return (
					<div className='flex items-center gap-1.5 flex-wrap'>
						<span className={cn('whitespace-nowrap', flag && 'text-amber-600')}>{formatDate(row.exp)}</span>
						{flag && (
							<Chip
								className='shrink-0'
								variant='warning'
								label={flag === 'expired' ? t('catalog:licenses.table.expired') : t('catalog:licenses.table.expiringSoon')}
							/>
						)}
					</div>
				);
			},
		},
		{
			title: '',
			width: '12%',
			render: (row) =>
				row.status === LICENSE_STATUS.ACTIVE && canWrite ? (
					<button
						className='text-sm text-destructive hover:underline whitespace-nowrap'
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
			) : licenses && licenses.length === 0 ? (
				// LicenseTab renders a plain table, not QueryableDataArea — mirror its default
				// empty-state styling (see QueryableDataArea/EmptyState.tsx) manually.
				<div className='bg-surface-faint border border-line-hairline dark:bg-surface dark:border-line rounded-[6px] w-full h-[360px] flex flex-col items-center justify-center mx-auto'>
					<div className='font-medium text-[20px] leading-normal text-content-secondary mb-4 text-center'>
						{t('catalog:licenses.emptyState.heading')}
					</div>
					<div className='font-normal text-[16px] leading-normal text-content-subtle mb-8 text-center max-w-[350px]'>
						{t('catalog:licenses.emptyState.description')}
					</div>
					{canWrite && (
						<Button variant='outline' onClick={() => setCreateOpen(true)} className='!p-5 !bg-surface-panel !border-line-muted'>
							{t('catalog:licenses.listPage.createButton')}
						</Button>
					)}
				</div>
			) : (
				<FlexpriceTable
					columns={columns}
					data={licenses ?? []}
					showEmptyRow
					onRowClick={(row) => setDetailsTarget(row)}
					tableClassName='table-fixed w-full'
				/>
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
					{detailsTarget &&
						(() => {
							const fields: DetailField[] = [
								{
									label: t('catalog:licenses.table.jti'),
									fullWidth: true,
									value: (
										<div className='flex items-center gap-1'>
											<code className='font-mono bg-muted px-1.5 py-0.5 rounded text-xs break-all [overflow-wrap:anywhere]'>
												{detailsTarget.jti}
											</code>
											<CopyIdButton id={detailsTarget.jti} toastMessage={t('catalog:licenses.createDialog.copyToastMessage')} />
										</div>
									),
								},
								{ label: t('catalog:licenses.table.tier'), value: <Chip variant='default' label={detailsTarget.tier} /> },
								{ label: t('catalog:licenses.table.environment'), value: detailsTarget.env },
								{
									label: t('catalog:licenses.table.status'),
									value: (
										<Chip variant={detailsTarget.status === LICENSE_STATUS.ACTIVE ? 'success' : 'default'} label={detailsTarget.status} />
									),
								},
								{
									label: t('catalog:licenses.details.customer'),
									value: <span className='break-all [overflow-wrap:anywhere]'>{detailsTarget.customer || '—'}</span>,
								},
								{
									label: t('catalog:licenses.details.features'),
									value: detailsTarget.features?.length ? detailsTarget.features.join(', ') : '—',
								},
								{ label: t('catalog:licenses.table.expires'), value: formatDate(detailsTarget.exp) },
								{
									label: t('catalog:licenses.details.createdAt'),
									value: detailsTarget.created_at ? formatDate(detailsTarget.created_at) : '—',
								},
								...(detailsTarget.status === LICENSE_STATUS.REVOKED && detailsTarget.revoked_at
									? [{ label: t('catalog:licenses.details.revokedAt'), value: formatDate(detailsTarget.revoked_at) }]
									: []),
							];

							return (
								<div className='space-y-4 py-2'>
									<div className='rounded-md border border-line-strong bg-muted/40 p-3 text-sm text-muted-foreground'>
										{detailsTarget.status === LICENSE_STATUS.REVOKED
											? t('catalog:licenses.details.revokedNotice')
											: t('catalog:licenses.details.jwtNotice')}
									</div>
									<div className='grid grid-cols-2 gap-4'>
										{fields.map((field) => (
											<div key={field.label} className={field.fullWidth ? 'space-y-1 col-span-2' : 'space-y-1'}>
												<span className='text-sm font-medium text-muted-foreground'>{field.label}</span>
												<div className='text-sm'>{field.value}</div>
											</div>
										))}
									</div>
								</div>
							);
						})()}
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default LicenseTab;
