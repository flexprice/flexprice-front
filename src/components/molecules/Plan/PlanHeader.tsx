import { PlanApi } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { CopyIdButton } from '@/components/atoms';

const fetchPlan = async (planId: string) => {
	return await PlanApi.getPlanById(planId);
};

interface PlanHeaderProps {
	planId: string;
}

const PlanHeader: React.FC<PlanHeaderProps> = ({ planId }) => {
	const { data: plan, isLoading } = useQuery({
		queryKey: ['fetchPlan', planId],
		queryFn: () => fetchPlan(planId!),

		// staleTime: 1000 * 60 * 5,
	});

	if (isLoading) {
		return (
			<div className='items-center justify-center'>
				<div className='py-6 px-4 rounded-xl border border-line-strong'>
					<div className='h-6 w-32 bg-surface-strong rounded animate-pulse mb-2'></div>
					<div className='flex place-items-start space-x-3'>
						<div className='w-10 h-10 bg-surface-strong rounded-full animate-pulse'></div>
						<div className='flex flex-col space-y-2 flex-1'>
							<div className='h-5 w-32 bg-surface-strong rounded animate-pulse'></div>
							<div className='h-4 w-48 bg-surface-strong rounded animate-pulse'></div>
							<div className='h-4 w-24 bg-surface-strong rounded animate-pulse'></div>
						</div>
					</div>
				</div>
			</div>
		);
	}
	return (
		<div className='items-center justify-center'>
			<div className='flex place-items-center space-x-3'>
				{/* <span className='size-9 bg-contain rounded-md bg-surface-heavy flex items-center justify-center text-content-inverse text-lg'>
					{plan?.name
						?.split(' ')
						.map((n) => n[0]?.toUpperCase())
						.join('')
						.slice(0, 2)}
				</span> */}
				<div className='flex flex-col'>
					<div className='flex items-center gap-2'>
						<div className='text-xl font-normal text-content-heading'>{plan?.name}</div>
						{plan?.id && <CopyIdButton id={plan.id} entityType='Plan' />}
					</div>
				</div>
			</div>
		</div>
	);
};

export default PlanHeader;
