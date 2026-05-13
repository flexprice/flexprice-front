import { FC, useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader, Chip, Dialog, NoDataCard } from '@/components/atoms';
import { FlexpriceTable, ColumnData, AddEntitlementDrawer } from '@/components/molecules';
import SubscriptionApi from '@/api/SubscriptionApi';
import EntitlementApi from '@/api/EntitlementApi';
import { FEATURE_TYPE } from '@/models/Feature';
import { ENTITLEMENT_ENTITY_TYPE } from '@/models/Entitlement';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BsThreeDotsVertical } from 'react-icons/bs';
import toast from 'react-hot-toast';

interface SubscriptionEntitlementsSectionProps {
	subscriptionId: string;
	/** When true, add and delete entitlement actions are disabled. */
	readOnly?: boolean;
}

const SubscriptionEntitlementsSection: FC<SubscriptionEntitlementsSectionProps> = ({ subscriptionId, readOnly = false }) => {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [entitlementToDelete, setEntitlementToDelete] = useState<any | null>(null);
	const queryClient = useQueryClient();

	// Fetch subscription entitlements
	const {
		data: entitlementsData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['subscriptionEntitlements', subscriptionId],
		queryFn: async () => {
			try {
				return await SubscriptionApi.getSubscriptionEntitlements(subscriptionId);
			} catch (error) {
				console.error('Failed to fetch subscription entitlements:', error);
				return { features: [] };
			}
		},
		enabled: !!subscriptionId,
		retry: false,
		refetchOnWindowFocus: false,
	});

	// Delete entitlement mutation
	const { mutate: deleteEntitlement, isPending: isDeletingEntitlement } = useMutation({
		mutationFn: async (entitlementId: string) => {
			return await EntitlementApi.delete(entitlementId);
		},
		onSuccess: () => {
			toast.success('Entitlement deleted successfully');
			queryClient.invalidateQueries({ queryKey: ['subscriptionEntitlements', subscriptionId] });
			setIsDeleteDialogOpen(false);
			setEntitlementToDelete(null);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to delete entitlement');
		},
	});

	// Transform the subscription entitlements response to match the expected format
	const entitlements = useMemo(() => {
		if (!entitlementsData?.features) return [];

		return entitlementsData.features.map((item: any) => {
			return {
				feature: item.feature,
				feature_id: item.feature?.id || '',
				feature_type: item.feature?.type || '',
				entitlement: item.entitlement,
				sources: item.sources || [],
			};
		});
	}, [entitlementsData]);

	const getFeatureTypeChip = (featureType: string) => {
		const type = featureType?.toLowerCase();
		switch (type) {
			case 'metered':
				return <Chip label='Metered' variant='info' />;
			case 'boolean':
				return <Chip label='Boolean' variant='success' />;
			case 'static':
				return <Chip label='Static' variant='warning' />;
			default:
				return <Chip label={featureType} variant='info' />;
		}
	};

	const getEntitlementValue = (entitlement: any) => {
		const featureType = entitlement.feature_type;
		const entitlementData = entitlement.entitlement;

		if (featureType === FEATURE_TYPE.METERED) {
			const limit = entitlementData?.usage_limit;
			const resetPeriod = entitlementData?.usage_reset_period;
			return limit !== null && limit !== undefined
				? `${limit.toLocaleString()}${resetPeriod ? ` / ${resetPeriod.toLowerCase()}` : ''}`
				: 'Unlimited';
		} else if (featureType === FEATURE_TYPE.STATIC) {
			return entitlementData?.static_value || '--';
		} else if (featureType === FEATURE_TYPE.BOOLEAN) {
			return entitlementData?.is_enabled ? 'Enabled' : 'Disabled';
		}
		return '--';
	};

	const handleDelete = (entitlement: any) => {
		setDropdownOpen(null);
		setEntitlementToDelete(entitlement);
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (entitlementToDelete) {
			// Find the subscription source to get the entitlement_id
			const subscriptionSource = entitlementToDelete.sources?.find((source: any) => source.entity_type?.toLowerCase() === 'subscription');
			if (subscriptionSource?.entitlement_id) {
				deleteEntitlement(subscriptionSource.entitlement_id);
			}
		}
	};

	const cancelDelete = () => {
		setIsDeleteDialogOpen(false);
		setEntitlementToDelete(null);
	};

	const columns: ColumnData<any>[] = [
		{
			title: 'Feature Name',
			render: (row: any) => <span>{row.feature?.name || 'Unknown Feature'}</span>,
		},
		{
			title: 'Feature Type',
			render: (row: any) => getFeatureTypeChip(row.feature_type),
		},
		{
			title: 'Value',
			render: (row: any) => <span>{getEntitlementValue(row)}</span>,
		},
		{
			title: '',
			width: '30px',
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row: any) => {
				// Only show actions if there's a subscription source
				const hasSubscriptionSource = row.sources?.some((source: any) => source.entity_type?.toLowerCase() === 'subscription');

				if (!hasSubscriptionSource || readOnly) {
					return null;
				}

				return (
					<div
						data-interactive='true'
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}>
						<DropdownMenu open={dropdownOpen === row.feature_id} onOpenChange={(open) => setDropdownOpen(open ? row.feature_id : null)}>
							<DropdownMenuTrigger asChild>
								<button className='focus:outline-none'>
									<BsThreeDotsVertical className='text-base text-muted-foreground hover:text-foreground transition-colors' />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem
									onSelect={(e) => {
										e.preventDefault();
										handleDelete(row);
									}}
									className='flex gap-2 items-center cursor-pointer text-red-600'>
									<Trash2 className='h-4 w-4' />
									<span>Delete</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];

	const handleDrawerClose = (value: boolean) => {
		setDrawerOpen(value);
		if (!value) {
			// Refetch entitlements when drawer closes
			queryClient.invalidateQueries({ queryKey: ['subscriptionEntitlements', subscriptionId] });
		}
	};

	if (isLoading) {
		return (
			<Card variant='notched'>
				<CardHeader title='Entitlements' />
				<div className='flex justify-center items-center py-8'>
					<span className='text-gray-500'>Loading entitlements...</span>
				</div>
			</Card>
		);
	}

	if (isError) {
		return null;
	}

	return (
		<>
			{entitlements.length > 0 ? (
				<Card variant='notched'>
					<CardHeader
						title='Entitlements'
						cta={
							<Button prefixIcon={<Plus />} onClick={() => setDrawerOpen(true)} disabled={readOnly}>
								Add
							</Button>
						}
					/>
					<FlexpriceTable showEmptyRow data={entitlements} columns={columns} variant='no-bordered' />
				</Card>
			) : (
				<NoDataCard
					title='Entitlements'
					subtitle='No entitlements added to this subscription yet'
					cta={
						<Button prefixIcon={<Plus />} onClick={() => setDrawerOpen(true)} disabled={readOnly}>
							Add
						</Button>
					}
				/>
			)}

			<AddEntitlementDrawer
				isOpen={drawerOpen}
				onOpenChange={handleDrawerClose}
				entityType={ENTITLEMENT_ENTITY_TYPE.SUBSCRIPTION}
				entityId={subscriptionId}
				entitlements={entitlements as any}
			/>

			{/* Delete Confirmation Dialog */}
			<Dialog
				title={`Are you sure you want to delete the entitlement for "${entitlementToDelete?.feature?.name || 'this feature'}"?`}
				description='This action cannot be undone.'
				titleClassName='text-lg font-normal text-gray-800'
				isOpen={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				showCloseButton={false}>
				<div className='flex flex-col gap-4 items-end justify-center'>
					<div className='flex gap-4'>
						<Button variant='outline' onClick={cancelDelete} disabled={isDeletingEntitlement}>
							Cancel
						</Button>
						<Button variant='destructive' onClick={confirmDelete} disabled={isDeletingEntitlement}>
							{isDeletingEntitlement ? 'Deleting...' : 'Delete'}
						</Button>
					</div>
				</div>
			</Dialog>
		</>
	);
};

export default SubscriptionEntitlementsSection;
