import { AddButton, Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PlanApi } from '@/api/PlanApi';
import { PlansTable, ApiDocsContent, PlanDrawer, QueryBuilder } from '@/components/molecules';
import { Plan } from '@/models/Plan';
import usePagination from '@/hooks/usePagination';
import { EmptyPage } from '@/components/organisms';
import GUIDES from '@/constants/guides';
import { useState, useEffect } from 'react';
import useFilterSorting from '@/hooks/useFilterSorting';
import { planFilterOptions, planSortOptions, planInitialFilters, planInitialSorts } from '@/configs/entityFilterConfigs';
const PricingPlan = () => {
	const { limit, offset, page, reset } = usePagination();

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: planInitialFilters,
		initialSorts: planInitialSorts,
		debounceTime: 500,
	});
	const [activePlan, setActivePlan] = useState<Plan | null>(null);
	const [planDrawerOpen, setPlanDrawerOpen] = useState(false);

	const fetchPlans = async () => {
		return await PlanApi.listPlansByFilter({
			limit,
			offset,
			filters: sanitizedFilters,
			sort: sanitizedSorts,
		});
	};

	useEffect(() => {
		reset();
	}, [sanitizedFilters, sanitizedSorts, reset]);

	const {
		data: plansData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchPlans', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
		queryFn: fetchPlans,
		// staleTime: 1000 * 60 * 5,
	});

	const handleOnAdd = () => {
		setActivePlan(null);
		setPlanDrawerOpen(true);
	};

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error fetching meters');
	}

	if ((plansData?.items ?? []).length === 0) {
		return (
			<div className='space-y-6'>
				<PlanDrawer data={activePlan} open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlans']} />
				<EmptyPage
					onAddClick={handleOnAdd}
					emptyStateCard={{
						heading: 'Set Up Your First Plan',
						description: 'Create a plan to display pricing and start billing customers.',
						buttonLabel: 'Create Plan',
						buttonAction: handleOnAdd,
					}}
					tutorials={GUIDES.plans.tutorials}
					heading='Pricing Plan'
					tags={['Plans']}
				/>
			</div>
		);
	}

	return (
		<div>
			<Page heading='Plans' headingCTA={<AddButton label='Add Plan' onClick={handleOnAdd} />}>
				<PlanDrawer data={activePlan} open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlans']} />
				<ApiDocsContent tags={['Plans']} />
				<div className='space-y-6'>
					<QueryBuilder
						filterOptions={planFilterOptions}
						filters={filters}
						onFilterChange={setFilters}
						sortOptions={planSortOptions}
						onSortChange={setSorts}
						selectedSorts={sorts}
					/>
					<PlansTable
						data={(plansData?.items || []) as Plan[]}
						onEdit={(plan) => {
							setActivePlan(plan);
							setPlanDrawerOpen(true);
						}}
					/>
					<Spacer className='!h-4' />
					<ShortPagination unit='Pricing Plans' totalItems={plansData?.pagination.total ?? 0} />
				</div>
			</Page>
		</div>
	);
};

export default PricingPlan;
