import { useParams } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, Card, CardHeader, NoDataCard, Loader } from '@/components/atoms';
import { Plus } from 'lucide-react';
import { uniqueId } from 'lodash';
import CreditGrantApi from '@/api/CreditGrantApi';
import { CreditGrantsTable, CreditGrantModal } from '@/components/molecules';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import toast from 'react-hot-toast';
import {
	CREDIT_GRANT_PERIOD_UNIT,
	CREDIT_GRANT_EXPIRATION_TYPE,
	CREDIT_GRANT_CADENCE,
	CREDIT_GRANT_PERIOD,
	CREDIT_GRANT_SCOPE,
} from '@/models';
import { InternalCreditGrantRequest, CreateCreditGrantRequest } from '@/types/dto/CreditGrant';
import { ServerError } from '@/core/axios/types';

const PlanCreditGrantsTab = () => {
	const { planId } = useParams<{ planId: string }>();
	const [creditGrantModalOpen, setCreditGrantModalOpen] = useState(false);

	const {
		data: creditGrantsData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['planCreditGrants', planId],
		queryFn: async () => {
			return await CreditGrantApi.list({
				plan_ids: [planId!],
				scope: CREDIT_GRANT_SCOPE.PLAN,
			});
		},
		enabled: !!planId,
	});

	const { mutate: updatePlanWithCreditGrant, isPending: isCreatingCreditGrant } = useMutation({
		mutationFn: async (data: CreateCreditGrantRequest) => {
			const grantWithPlanId = {
				...data,
				plan_id: planId!,
			};
			return await CreditGrantApi.create(grantWithPlanId);
		},
		onSuccess: () => {
			toast.success('Credit grant added successfully');
			setCreditGrantModalOpen(false);
			refetchQueries(['planCreditGrants', planId!]);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to add credit grant');
		},
	});

	const getEmptyCreditGrant = (): InternalCreditGrantRequest => {
		return {
			id: uniqueId('credit-grant-'),
			credits: 0,
			period: CREDIT_GRANT_PERIOD.MONTHLY,
			name: 'Free Credits',
			scope: CREDIT_GRANT_SCOPE.PLAN,
			cadence: CREDIT_GRANT_CADENCE.ONETIME,
			period_count: 1,
			plan_id: planId!,
			expiration_type: CREDIT_GRANT_EXPIRATION_TYPE.NEVER,
			expiration_duration_unit: CREDIT_GRANT_PERIOD_UNIT.DAYS,
			priority: 0,
			metadata: {},
		};
	};

	const handleSaveCreditGrant = (data: InternalCreditGrantRequest) => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, ...createRequest } = data;
		updatePlanWithCreditGrant(createRequest);
	};

	const handleCancelCreditGrant = () => {
		setCreditGrantModalOpen(false);
	};

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error loading credit grants');
		return null;
	}

	const creditGrants = creditGrantsData?.items || [];

	return (
		<>
			<CreditGrantModal
				data={undefined}
				isOpen={creditGrantModalOpen}
				onOpenChange={setCreditGrantModalOpen}
				onSave={handleSaveCreditGrant}
				onCancel={handleCancelCreditGrant}
				getEmptyCreditGrant={getEmptyCreditGrant}
			/>
			<div className='space-y-6'>
				{creditGrants.length > 0 ? (
					<Card variant='notched'>
						<CardHeader
							title='Credit Grants'
							cta={
								<Button prefixIcon={<Plus />} onClick={() => setCreditGrantModalOpen(true)} disabled={isCreatingCreditGrant}>
									{isCreatingCreditGrant ? 'Adding...' : 'Add'}
								</Button>
							}
						/>
						<CreditGrantsTable
							data={creditGrants}
							onDelete={async () => {
								refetchQueries(['planCreditGrants', planId!]);
							}}
							showEmptyRow
						/>
					</Card>
				) : (
					<NoDataCard
						title='Credit Grants'
						subtitle='No credit grants added to the plan yet'
						cta={
							<Button prefixIcon={<Plus />} onClick={() => setCreditGrantModalOpen(true)} disabled={isCreatingCreditGrant}>
								{isCreatingCreditGrant ? 'Adding...' : 'Add'}
							</Button>
						}
					/>
				)}
			</div>
		</>
	);
};

export default PlanCreditGrantsTab;
