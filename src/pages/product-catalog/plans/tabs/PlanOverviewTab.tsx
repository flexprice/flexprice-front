import { useEffect } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { PlanPriceTable } from '@/components/organisms';
import { PlanApi } from '@/api';
import { refetchQueries } from '@/core/services/tanstack/queryClient';
import { Loader } from '@/components/atoms';
import toast from 'react-hot-toast';
import { DataType, FilterOperator } from '@/types/common/QueryBuilder';

const PlanOverviewTab = () => {
	const { planId } = useParams<{ planId: string }>();

	const {
		data: planData,
		isLoading: isPlanLoading,
		isError: isPlanError,
	} = useQuery({
		queryKey: ['fetchPlan', planId],
		queryFn: async () => {
			const response = await PlanApi.getPlansByFilter({
				filters: [{ field: 'id', operator: FilterOperator.EQUAL, data_type: DataType.STRING, value: { string: planId } }],
				limit: 1,
				offset: 0,
				sort: [],
			});
			return response.items[0] ?? null;
		},
		enabled: !!planId,
	});

	useEffect(() => {
		if (isPlanError) {
			toast.error('Error loading plan data');
		}
	}, [isPlanError]);

	if (isPlanLoading) {
		return <Loader />;
	}

	if (isPlanError || !planData) {
		return null;
	}

	return (
		<div className='space-y-6'>
			<PlanPriceTable
				plan={planData}
				onPriceUpdate={() => {
					refetchQueries(['fetchPlan', planId!]);
					refetchQueries(['planChargesSearch', planId!]);
				}}
			/>
		</div>
	);
};

export default PlanOverviewTab;
