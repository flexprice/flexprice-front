import { AddButton, Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PlanApi } from '@/api/PlanApi';
import { PlansTable, ApiDocsContent, EditPlanDrawer } from '@/components/molecules';
import { Plan } from '@/models/Plan';
import usePagination from '@/hooks/usePagination';
import { RouteNames } from '@/core/routes/Routes';
import { EmptyPage } from '@/components/organisms';
import GUIDES from '@/constants/guides';
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
	const navigate = useNavigate();

	const {
		data: plansData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchPlans', page],
		queryFn: fetchPlans,

		// staleTime: 1000 * 60 * 5,
	});

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error fetching meters');
	}

	if ((plansData?.items ?? []).length === 0) {
		return (
			<EmptyPage
				tutorials={GUIDES.plans.tutorials}
				heading='Pricing Plan'
				tags={['Plans']}
				onAddClick={() => navigate(RouteNames.createPlan)}
			/>
		);
	}

	return (
		<Page
			heading='Plans'
			headingCTA={
				<Link to={RouteNames.createPlan}>
					<AddButton />
				</Link>
			}>
			<EditPlanDrawer data={activePlan!} open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlans']} />
			<ApiDocsContent tags={['Plans']} />
			<div>
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
	);
};

export default PricingPlan;
