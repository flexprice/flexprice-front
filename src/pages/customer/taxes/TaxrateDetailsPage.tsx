import { Button, CardHeader, Chip, Loader, Page, Spacer, Card } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import { DetailsCard } from '@/components/molecules';
import { RouteNames } from '@/core/routes/Routes';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import TaxApi from '@/api/TaxApi';
import formatDate from '@/utils/common/format_date';
import { useMutation, useQuery } from '@tanstack/react-query';
import { EyeOff, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { TaxRateResponse } from '@/types/dto/tax';
import { TAX_RATE_TYPE, TAX_RATE_STATUS, TAX_RATE_SCOPE, TaxRate } from '@/models/Tax';
import TaxDrawer from '@/components/molecules/TaxDrawer/TaxDrawer';

type Params = {
	taxrateId: string;
};
const formatChips = (data: TAX_RATE_STATUS): string => {
	switch (data) {
		case TAX_RATE_STATUS.ACTIVE:
			return 'Active';
		case TAX_RATE_STATUS.INACTIVE:
			return 'Inactive';
		case TAX_RATE_STATUS.DELETED:
			return 'Deleted';
		default:
			return 'Inactive';
	}
};

const getTaxTypeLabel = (type: TAX_RATE_TYPE) => {
	switch (type) {
		case TAX_RATE_TYPE.PERCENTAGE:
			return 'Percentage';
		case TAX_RATE_TYPE.FIXED:
			return 'Fixed Amount';
		default:
			return 'Unknown';
	}
};

const getScopeLabel = (scope: TAX_RATE_SCOPE) => {
	switch (scope) {
		case TAX_RATE_SCOPE.INTERNAL:
			return 'Internal';
		case TAX_RATE_SCOPE.EXTERNAL:
			return 'External';
		case TAX_RATE_SCOPE.ONETIME:
			return 'One-time';
		default:
			return 'Unknown';
	}
};

const formatTaxValue = (tax: TaxRateResponse) => {
	if (tax.tax_rate_type === TAX_RATE_TYPE.PERCENTAGE && tax.percentage_value !== undefined) {
		return `${tax.percentage_value}%`;
	}
	if (tax.tax_rate_type === TAX_RATE_TYPE.FIXED && tax.fixed_value !== undefined) {
		return `${tax.fixed_value}`;
	}
	return '--';
};

const TaxrateDetailsPage = () => {
	const navigate = useNavigate();
	const { taxrateId } = useParams<Params>();
	const [taxDrawerOpen, setTaxDrawerOpen] = useState(false);

	const {
		data: taxData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchTaxRate', taxrateId],
		queryFn: async () => {
			return await TaxApi.getTaxRate(taxrateId!);
		},
		enabled: !!taxrateId,
	});

	const { mutate: archiveTaxRate } = useMutation({
		mutationFn: async () => {
			return await TaxApi.deleteTaxRate(taxrateId!);
		},
		onSuccess: () => {
			toast.success('Tax rate archived successfully');
			navigate(RouteNames.taxes);
		},
		onError: (error: any) => {
			toast.error(error.error?.message || 'Failed to archive tax rate');
		},
	});

	const { updateBreadcrumb } = useBreadcrumbsStore();

	useEffect(() => {
		if (taxData?.name) {
			updateBreadcrumb(2, taxData.name);
		}
	}, [taxData, updateBreadcrumb]);

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error loading tax rate data');
		return null;
	}

	if (!taxData) {
		toast.error('No tax rate data available');
		return null;
	}

	const taxDetails = [
		{ label: 'Tax Rate Name', value: taxData?.name },
		{ label: 'Code', value: taxData?.code },
		{ label: 'Description', value: taxData?.description || '--' },
		{ label: 'Type', value: getTaxTypeLabel(taxData?.tax_rate_type) },
		{ label: 'Value', value: formatTaxValue(taxData) },
		{ label: 'Scope', value: getScopeLabel(taxData?.scope) },
		{ label: 'Created Date', value: formatDate(taxData?.created_at ?? '') },
		{
			label: 'Status',
			value: (
				<Chip
					label={formatChips(taxData?.tax_rate_status)}
					variant={taxData?.tax_rate_status === TAX_RATE_STATUS.ACTIVE ? 'success' : 'default'}
				/>
			),
		},
	];

	return (
		<Page
			heading={taxData?.name}
			headingCTA={
				<>
					<Button onClick={() => setTaxDrawerOpen(true)} variant={'outline'} className='flex gap-2'>
						<Pencil />
						Edit
					</Button>

					<Button
						onClick={() => archiveTaxRate()}
						disabled={taxData?.tax_rate_status === TAX_RATE_STATUS.DELETED}
						variant={'outline'}
						className='flex gap-2'>
						<EyeOff />
						Archive
					</Button>
				</>
			}>
			<TaxDrawer data={taxData as TaxRate} open={taxDrawerOpen} onOpenChange={setTaxDrawerOpen} refetchQueryKeys={['fetchTaxRate']} />
			<ApiDocsContent tags={['Taxes']} />

			<div className='space-y-6'>
				<DetailsCard variant='stacked' title='Tax Rate Details' data={taxDetails} />

				{/* Metadata Section */}
				{taxData.metadata && Object.keys(taxData.metadata).length > 0 && (
					<Card variant='notched'>
						<CardHeader title='Metadata' />
						<div className='p-4'>
							<div className='grid grid-cols-2 gap-4'>
								{Object.entries(taxData.metadata).map(([key, value]) => (
									<div key={key} className='flex flex-col'>
										<span className='text-sm text-gray-500'>{key}</span>
										<span className='text-sm font-medium'>{value}</span>
									</div>
								))}
							</div>
						</div>
					</Card>
				)}

				<Spacer className='!h-20' />
			</div>
		</Page>
	);
};

export default TaxrateDetailsPage;
