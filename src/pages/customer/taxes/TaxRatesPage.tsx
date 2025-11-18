import { useState } from 'react';
import { Page, Spacer, Loader, ShortPagination, AddButton } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import usePagination from '@/hooks/usePagination';
import TaxApi from '@/api/TaxApi';
import { EmptyPage } from '@/components/organisms';
import GUIDES from '@/constants/guides';
import TaxTable from '@/components/molecules/TaxTable/TaxTable';
import TaxDrawer from '@/components/molecules/TaxDrawer/TaxDrawer';
import { TaxRateResponse } from '@/types/dto/tax';
import { TaxRate } from '@/models/Tax';

const TaxPage = () => {
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
		toast.error('Error fetching tax rates');
	}

	if ((taxData?.items ?? []).length === 0) {
		return (
			<EmptyPage
				heading='Tax Rates'
				tags={['Taxes']}
				emptyStateCard={{
					heading: 'Create your first tax rate',
					description: 'Set up tax rates to automatically calculate taxes on invoices and ensure compliance with local regulations.',
					buttonLabel: 'Create Tax Rate',
					buttonAction: handleCreateNew,
				}}
				tutorials={GUIDES.taxes.tutorials}
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
		<Page heading='Tax Rates' headingCTA={<AddButton onClick={handleCreateNew} />}>
			<ApiDocsContent tags={['Taxes']} />
			<div className='px-0'>
				<TaxTable data={taxData?.items || []} onEdit={handleEdit} />
				<Spacer className='!h-4' />
				<ShortPagination unit='Tax Rates' totalItems={taxData?.pagination.total ?? 0} />
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
