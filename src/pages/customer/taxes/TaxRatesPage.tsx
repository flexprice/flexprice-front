import { useState, useMemo } from 'react';
import { Page, Spacer, Loader, ShortPagination, AddButton } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import usePagination from '@/hooks/usePagination';
import TaxApi from '@/api/TaxApi';
import { EmptyPage } from '@/components/organisms';
import { buildGuides } from '@/constants/guides';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import TaxTable from '@/components/molecules/TaxTable/TaxTable';
import TaxDrawer from '@/components/molecules/TaxDrawer/TaxDrawer';
import { TaxRateResponse } from '@/types/dto/tax';
import { TaxRate } from '@/models/Tax';
import { useTranslation } from 'react-i18next';

const TaxPage = () => {
	const { t } = useTranslation('billing');
	const { t: tGuide } = useTranslation('guides');
	const guides = useMemo(() => buildGuides(tGuide), [tGuide]);
	const { limit, offset, page } = usePagination();
	const [taxDrawerOpen, setTaxDrawerOpen] = useState(false);
	const [activeTax, setActiveTax] = useState<TaxRateResponse | null>(null);

	const fetchTaxRates = async () => {
		return await TaxApi.listTaxRates({
			limit,
			offset,
		});
	};

	const {
		data: taxData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchTaxRates', page],
		queryFn: fetchTaxRates,
	});

	const handleEdit = (tax: TaxRateResponse) => {
		setActiveTax(tax);
		setTaxDrawerOpen(true);
	};

	const handleCreateNew = () => {
		setActiveTax(null);
		setTaxDrawerOpen(true);
	};

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error(t('taxes.toast.fetchListError'));
	}

	if ((taxData?.items ?? []).length === 0) {
		return (
			<EmptyPage
				heading={t('taxes.list.pageHeading')}
				tags={API_DOCS_TAGS.TaxRates}
				emptyStateCard={{
					description: t('taxes.list.emptyDescription'),
					buttonLabel: t('taxes.list.createTaxRate'),
					buttonAction: handleCreateNew,
				}}
				tutorials={guides.taxes.tutorials}
				onAddClick={handleCreateNew}>
				<TaxDrawer
					data={activeTax as TaxRate | null}
					open={taxDrawerOpen}
					onOpenChange={setTaxDrawerOpen}
					refetchQueryKeys={['fetchTaxRates']}
				/>
			</EmptyPage>
		);
	}

	return (
		<Page heading={t('taxes.list.pageHeading')} headingCTA={<AddButton onClick={handleCreateNew} />}>
			<ApiDocsContent tags={API_DOCS_TAGS.TaxRates} />
			<div className='px-0'>
				<TaxTable data={taxData?.items || []} onEdit={handleEdit} />
				<Spacer className='!h-4' />
				<ShortPagination unit={t('taxes.list.paginationUnit')} totalItems={taxData?.pagination.total ?? 0} />
			</div>
			<TaxDrawer
				data={activeTax as TaxRate | null}
				open={taxDrawerOpen}
				onOpenChange={setTaxDrawerOpen}
				refetchQueryKeys={['fetchTaxRates']}
			/>
		</Page>
	);
};

export default TaxPage;
