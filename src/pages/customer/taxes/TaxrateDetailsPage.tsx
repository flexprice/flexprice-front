import { Button, CardHeader, Chip, Loader, Page, Spacer, Card } from '@/components/atoms';
import { ApiDocsContent, DetailsCard } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { RouteNames } from '@/core/routes/Routes';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import TaxApi from '@/api/TaxApi';
import formatDate from '@/utils/common/format_date';
import { useMutation, useQuery } from '@tanstack/react-query';
import { EyeOff, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';
import { TaxRateResponse } from '@/types/dto/tax';
import { TAX_RATE_TYPE, TAX_RATE_SCOPE, TaxRate } from '@/models/Tax';
import formatChips from '@/utils/common/format_chips';
import TaxDrawer from '@/components/molecules/TaxDrawer/TaxDrawer';
import { ENTITY_STATUS } from '@/models';

type Params = {
	taxrateId: string;
};

const TaxrateDetailsPage = () => {
	const navigate = useNavigate();
	const { t } = useTranslation(['billing', 'common']);
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
			toast.success(t('taxes.toast.archivedSuccess'));
			navigate(RouteNames.taxes);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('taxes.toast.archiveFailed'));
		},
	});

	const naLabel = t('common:labels.na');

	const getTaxTypeLabel = (type: TAX_RATE_TYPE | undefined) => {
		switch (type) {
			case TAX_RATE_TYPE.PERCENTAGE:
				return t('taxes.rateType.percentage');
			case TAX_RATE_TYPE.FIXED:
				return t('taxes.rateType.fixedAmount');
			default:
				return t('taxes.rateType.unknown');
		}
	};

	const getScopeLabel = (scope: TAX_RATE_SCOPE | undefined) => {
		switch (scope) {
			case TAX_RATE_SCOPE.INTERNAL:
				return t('taxes.rateScope.internal');
			case TAX_RATE_SCOPE.EXTERNAL:
				return t('taxes.rateScope.external');
			case TAX_RATE_SCOPE.ONETIME:
				return t('taxes.rateScope.onetime');
			default:
				return t('taxes.rateScope.unknown');
		}
	};

	const formatTaxValue = (tax: TaxRateResponse) => {
		if (tax.tax_rate_type === TAX_RATE_TYPE.PERCENTAGE && tax.percentage_value !== undefined) {
			return `${tax.percentage_value}%`;
		}
		if (tax.tax_rate_type === TAX_RATE_TYPE.FIXED && tax.fixed_value !== undefined) {
			return `${tax.fixed_value}`;
		}
		return naLabel;
	};

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
		toast.error(t('taxes.toast.loadError'));
		return null;
	}

	if (!taxData) {
		toast.error(t('taxes.toast.noData'));
		return null;
	}

	const taxDetails = [
		{ label: t('taxes.detail.taxRateName'), value: taxData?.name },
		{ label: t('taxes.detail.code'), value: taxData?.code },
		{ label: t('taxes.detail.description'), value: taxData?.description || naLabel },
		{ label: t('taxes.detail.type'), value: getTaxTypeLabel(taxData?.tax_rate_type) },
		{ label: t('taxes.detail.value'), value: formatTaxValue(taxData) },
		{ label: t('taxes.detail.scope'), value: getScopeLabel(taxData?.scope) },
		{ label: t('taxes.detail.createdDate'), value: formatDate(taxData?.created_at ?? '') },
		{
			label: t('taxes.detail.status'),
			value: <Chip label={formatChips(taxData?.status)} variant={taxData?.status === ENTITY_STATUS.PUBLISHED ? 'success' : 'default'} />,
		},
	];

	return (
		<Page
			documentTitle={taxData?.name}
			heading={taxData?.name}
			headingCTA={
				<>
					<Button onClick={() => setTaxDrawerOpen(true)} variant={'outline'} className='flex gap-2'>
						<Pencil />
						{t('common:actions.edit')}
					</Button>

					<Button
						onClick={() => archiveTaxRate()}
						disabled={taxData?.status === ENTITY_STATUS.ARCHIVED}
						variant={'outline'}
						className='flex gap-2'>
						<EyeOff />
						{t('common:actions.archive')}
					</Button>
				</>
			}>
			<TaxDrawer data={taxData as TaxRate} open={taxDrawerOpen} onOpenChange={setTaxDrawerOpen} refetchQueryKeys={['fetchTaxRate']} />
			<ApiDocsContent tags={API_DOCS_TAGS.TaxRates} />

			<div className='space-y-6'>
				<DetailsCard variant='stacked' title={t('taxes.taxRateDetails')} data={taxDetails} />

				{/* Metadata Section */}
				{taxData.metadata && Object.keys(taxData.metadata).length > 0 && (
					<Card variant='notched'>
						<CardHeader title={t('taxes.metadata')} />
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
