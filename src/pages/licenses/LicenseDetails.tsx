import { Page, Spacer, Chip, Card, CardHeader, Loader, Button } from '@/components/atoms';
import { Detail } from '@/components/molecules';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import LicenseApi from '@/api/LicenseApi';
import { LICENSE_STATUS } from '@/models/License';
import formatDate from '@/utils/common/format_date';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import RevokeLicenseDialog from './RevokeLicenseDialog';

const LicenseDetails = () => {
	const { t } = useTranslation(['catalog', 'common']);
	const { jti } = useParams<{ jti: string }>();
	const { can } = useCurrentUserPermissions();
	const canWrite = can('license', 'write');
	const [revokeOpen, setRevokeOpen] = useState(false);

	const {
		data: license,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ['fetchLicenseDetails', jti],
		queryFn: () => LicenseApi.getLicense(jti!),
		enabled: !!jti,
	});

	if (isLoading) {
		return <Loader />;
	}

	if (isError || !license) {
		toast.error('Error loading license details');
		return (
			<Page heading={t('catalog:licenses.details.notFound')}>
				<div className='flex items-center justify-center h-64'>
					<div className='text-muted-foreground'>{t('catalog:licenses.details.loadError')}</div>
				</div>
			</Page>
		);
	}

	const details: Detail[] = [
		{ label: 'JTI', value: <code className='font-mono bg-muted px-1.5 py-0.5 rounded text-sm'>{license.jti}</code> },
		{ label: 'Tier', value: <Chip variant='default' label={license.tier} /> },
		{ label: 'Environment', value: license.env },
		{
			label: 'Status',
			value: <Chip variant={license.status === LICENSE_STATUS.ACTIVE ? 'success' : 'default'} label={license.status} />,
		},
		{ label: 'Customer', value: license.customer || '—' },
		{ label: 'Features', value: license.features?.length ? license.features.join(', ') : '—' },
		{ label: 'Expires', value: formatDate(license.exp) },
		{ label: 'Created At', value: license.created_at ? formatDate(license.created_at) : '—' },
	];

	return (
		<Page
			documentTitle={license.jti}
			heading={license.jti}
			headingCTA={
				license.status === LICENSE_STATUS.ACTIVE && canWrite ? (
					<Button variant='destructive' onClick={() => setRevokeOpen(true)}>
						{t('catalog:licenses.details.revoke')}
					</Button>
				) : undefined
			}>
			<Spacer className='!h-6' />

			<div className='space-y-6'>
				<div className='rounded-md border border-line-strong bg-muted/40 p-3 text-sm text-muted-foreground'>
					{t('catalog:licenses.details.jwtNotice')}
				</div>

				<Card variant='notched'>
					<CardHeader title={t('catalog:licenses.details.title')} />
					<div className='p-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div className='space-y-4'>
								{details.slice(0, Math.ceil(details.length / 2)).map((detail, index) => (
									<div key={index} className='flex flex-col space-y-1'>
										<span className='text-sm font-medium text-muted-foreground'>{detail.label}</span>
										<div className='text-sm'>{detail.value}</div>
									</div>
								))}
							</div>
							<div className='space-y-4'>
								{details.slice(Math.ceil(details.length / 2)).map((detail, index) => (
									<div key={index} className='flex flex-col space-y-1'>
										<span className='text-sm font-medium text-muted-foreground'>{detail.label}</span>
										<div className='text-sm'>{detail.value}</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</Card>
			</div>

			<RevokeLicenseDialog jti={license.jti} open={revokeOpen} onOpenChange={setRevokeOpen} onSuccess={() => refetch()} />
		</Page>
	);
};

export default LicenseDetails;
