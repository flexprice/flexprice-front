import { AddButton, Page, Chip, Loader } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import LicenseApi from '@/api/LicenseApi';
import { License, LICENSE_STATUS } from '@/models/License';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import formatDate from '@/utils/common/format_date';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CreateLicenseDialog from './CreateLicenseDialog';

const LicensesPage = () => {
	const { t } = useTranslation('catalog');
	const navigate = useNavigate();
	const { can } = useCurrentUserPermissions();
	const canWrite = can('license', 'write');
	const [createOpen, setCreateOpen] = useState(false);

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
			title: 'JTI',
			render: (row) => <code className='font-mono text-xs'>{row.jti}</code>,
		},
		{
			title: 'Tier',
			render: (row) => <Chip variant='default' label={row.tier} />,
		},
		{
			title: 'Environment',
			fieldName: 'env',
		},
		{
			title: 'Status',
			render: (row) => <Chip variant={row.status === LICENSE_STATUS.ACTIVE ? 'success' : 'default'} label={row.status} />,
		},
		{
			title: 'Expires',
			render: (row) => formatDate(row.exp),
		},
	];

	return (
		<Page heading={t('licenses.listPage.title')} headingCTA={canWrite ? <AddButton onClick={() => setCreateOpen(true)} /> : undefined}>
			{isLoading ? (
				<Loader />
			) : (
				<FlexpriceTable
					columns={columns}
					data={licenses ?? []}
					showEmptyRow
					onRowClick={(row) => navigate(`${RouteNames.licenseDetails}/${row.jti}`)}
				/>
			)}
			<CreateLicenseDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={() => refetch()} />
		</Page>
	);
};

export default LicensesPage;
