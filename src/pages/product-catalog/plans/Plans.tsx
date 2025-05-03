import { AddButton, Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PlanApi } from '@/utils/api_requests/PlanApi';
import { PlansTable, ApiDocsContent, PlanDrawer } from '@/components/molecules';
import { Plan } from '@/models/Plan';
import usePagination from '@/hooks/usePagination';
import { EmptyPage } from '@/components/organisms';
import GUIDES from '@/core/constants/guides';
import { useState } from 'react';
const PricingPlan = () => {
	const { limit, offset, page } = usePagination();
	const [activePlan, setActivePlan] = useState<Plan | null>(null);
	const [planDrawerOpen, setPlanDrawerOpen] = useState(false);

	const fetchPlans = async () => {
		return await PlanApi.getAllPlans({
			limit,
			offset,
		});
	};

	const {
		data: plansData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchPlans', page],
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
				<EmptyPage tutorials={GUIDES.plans.tutorials} heading='Pricing Plan' tags={['Plans']} onAddClick={handleOnAdd} />
			</div>
		);
	}

	return (
		<div>
			<Page heading='Plans' headingCTA={<AddButton onClick={handleOnAdd} />}>
				<PlanDrawer data={activePlan} open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlans']} />
				<ApiDocsContent tags={['Plans']} />
				<div className='space-y-6'>
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
