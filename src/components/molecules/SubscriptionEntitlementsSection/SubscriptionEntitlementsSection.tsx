import { FC, useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Button, Card, CardHeader, Chip, NoDataCard, Dialog, Input, Select, FormHeader, Toggle } from '@/components/atoms';
import { FlexpriceTable, ColumnData, AddEntitlementDrawer } from '@/components/molecules';
import SubscriptionApi from '@/api/SubscriptionApi';
import EntitlementApi from '@/api/EntitlementApi';
import { FEATURE_TYPE } from '@/models/Feature';
import { ENTITLEMENT_ENTITY_TYPE, ENTITLEMENT_USAGE_RESET_PERIOD } from '@/models/Entitlement';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BsThreeDotsVertical } from 'react-icons/bs';
import toast from 'react-hot-toast';
import { Sheet, Spacer } from '@/components/atoms';

interface SubscriptionEntitlementsSectionProps {
	subscriptionId: string;
}

const SubscriptionEntitlementsSection: FC<SubscriptionEntitlementsSectionProps> = ({ subscriptionId }) => {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [entitlementToDelete, setEntitlementToDelete] = useState<any | null>(null);
	const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
	const [editingEntitlement, setEditingEntitlement] = useState<any | null>(null);
	const [editFormData, setEditFormData] = useState<any>({});
	const queryClient = useQueryClient();

	// Constants for usage reset period options
	const USAGE_RESET_PERIOD_OPTIONS = [
		{ label: 'Daily', value: ENTITLEMENT_USAGE_RESET_PERIOD.DAILY },
		{ label: 'Weekly', value: ENTITLEMENT_USAGE_RESET_PERIOD.WEEKLY },
		{ label: 'Monthly', value: ENTITLEMENT_USAGE_RESET_PERIOD.MONTHLY },
		{ label: 'Quarterly', value: ENTITLEMENT_USAGE_RESET_PERIOD.QUARTERLY },
		{ label: 'Half-Yearly', value: ENTITLEMENT_USAGE_RESET_PERIOD.HALF_YEARLY },
		{ label: 'Yearly', value: ENTITLEMENT_USAGE_RESET_PERIOD.ANNUAL },
		{ label: 'Never', value: ENTITLEMENT_USAGE_RESET_PERIOD.NEVER },
	];

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
			return await EntitlementApi.deleteEntitlementById(entitlementId);
		},
		onSuccess: () => {
			toast.success('Entitlement deleted successfully');
			queryClient.invalidateQueries({ queryKey: ['subscriptionEntitlements', subscriptionId] });
			setIsDeleteDialogOpen(false);
			setEntitlementToDelete(null);
		},
		onError: (error: any) => {
			toast.error(error?.error?.message || 'Failed to delete entitlement');
		},
	});

	// Update entitlement mutation
	const { mutate: updateEntitlement, isPending: isUpdatingEntitlement } = useMutation({
		mutationFn: async ({ entitlementId, data }: { entitlementId: string; data: any }) => {
			return await EntitlementApi.updateEntitlement(entitlementId, data);
		},
		onSuccess: () => {
			toast.success('Entitlement updated successfully');
			queryClient.invalidateQueries({ queryKey: ['subscriptionEntitlements', subscriptionId] });
			setIsEditDrawerOpen(false);
			setEditingEntitlement(null);
			setEditFormData({});
		},
		onError: (error: any) => {
			toast.error(error?.error?.message || 'Failed to update entitlement');
		},
	});

	// Transform the subscription entitlements response to match the expected format
	const entitlements = useMemo(() => {
		if (!entitlementsData?.features) return [];

		return entitlementsData.features.map((item: any) => ({
			feature: item.feature,
			feature_id: item.feature?.id || '',
			feature_type: item.feature?.type || '',
			entitlement: item.entitlement,
			sources: item.sources || [],
		}));
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

	const handleEdit = (entitlement: any) => {
		setDropdownOpen(null);
		setEditingEntitlement(entitlement);

		// Pre-fill form data with current entitlement values
		const entitlementData = entitlement.entitlement;
		setEditFormData({
			is_enabled: entitlementData?.is_enabled ?? false,
			usage_limit: entitlementData?.usage_limit ?? null,
			usage_reset_period: entitlementData?.usage_reset_period ?? ENTITLEMENT_USAGE_RESET_PERIOD.NEVER,
			is_soft_limit: entitlementData?.is_soft_limit ?? false,
			static_value: entitlementData?.static_value ?? '',
		});
		setIsEditDrawerOpen(true);
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

	const handleSaveEdit = () => {
		if (!editingEntitlement) return;

		// Find the subscription source to get the entitlement_id
		const subscriptionSource = editingEntitlement.sources?.find((source: any) => source.entity_type?.toLowerCase() === 'subscription');
		if (subscriptionSource?.entitlement_id) {
			updateEntitlement({
				entitlementId: subscriptionSource.entitlement_id,
				data: editFormData,
			});
		} else {
			toast.error('Unable to find entitlement to update');
		}
	};

	const handleEditFormChange = (field: string, value: any) => {
		setEditFormData((prev: any) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleCloseEditDrawer = () => {
		setIsEditDrawerOpen(false);
		setEditingEntitlement(null);
		setEditFormData({});
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
			width: '40px',
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row: any) => {
				const hasSubscriptionSource = row.sources?.some((source: any) => source.entity_type?.toLowerCase() === 'subscription');
				if (!hasSubscriptionSource) return null;

				return (
					<div
						data-interactive='true'
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}>
						<DropdownMenu open={dropdownOpen === row.feature_id} onOpenChange={(open) => setDropdownOpen(open ? row.feature_id : null)}>
							<DropdownMenuTrigger asChild>
								<button className='focus:outline-none' aria-label='Open actions'>
									<BsThreeDotsVertical className='text-base text-muted-foreground hover:text-foreground transition-colors' />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem
									onSelect={(e) => {
										e.preventDefault();
										handleEdit(row);
									}}
									className='flex gap-2 items-center cursor-pointer'>
									<Pencil className='h-4 w-4' />
									<span>Edit</span>
								</DropdownMenuItem>
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
							<Button prefixIcon={<Plus />} onClick={() => setDrawerOpen(true)}>
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
						<Button prefixIcon={<Plus />} onClick={() => setDrawerOpen(true)}>
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

			{/* Edit Entitlement Drawer */}
			<Sheet isOpen={isEditDrawerOpen} onOpenChange={handleCloseEditDrawer}>
				<div className='space-y-6 p-6'>
					<FormHeader
						title='Edit Entitlement'
						subtitle={`Edit entitlement for ${editingEntitlement?.feature?.name || 'feature'}`}
						variant='sub-header'
					/>

					{/* Boolean Feature Type */}
					{editingEntitlement?.feature_type === FEATURE_TYPE.BOOLEAN && (
						<Toggle
							label='Enable Feature'
							checked={editFormData.is_enabled}
							onChange={(checked) => handleEditFormChange('is_enabled', checked)}
						/>
					)}

					{/* Static Feature Type */}
					{editingEntitlement?.feature_type === FEATURE_TYPE.STATIC && (
						<Input
							label='Static Value'
							value={editFormData.static_value || ''}
							onChange={(value) => handleEditFormChange('static_value', value)}
							placeholder='Enter static value'
						/>
					)}

					{/* Metered Feature Type */}
					{editingEntitlement?.feature_type === FEATURE_TYPE.METERED && (
						<div className='space-y-4'>
							<Input
								label='Usage Limit'
								value={
									editFormData.usage_limit !== null && editFormData.usage_limit !== undefined ? editFormData.usage_limit.toString() : ''
								}
								onChange={(value) => {
									const numValue = value === '' ? null : parseFloat(value);
									handleEditFormChange('usage_limit', numValue === null ? null : isNaN(numValue) ? null : numValue);
								}}
								placeholder='Enter usage limit (leave empty for unlimited)'
							/>

							<Select
								label='Usage Reset Period'
								value={editFormData.usage_reset_period || ENTITLEMENT_USAGE_RESET_PERIOD.NEVER}
								onChange={(value) => handleEditFormChange('usage_reset_period', value)}
								options={USAGE_RESET_PERIOD_OPTIONS}
							/>

							{editFormData.usage_limit !== null && editFormData.usage_limit !== undefined && (
								<Toggle
									label='Soft Limit'
									checked={editFormData.is_soft_limit}
									onChange={(checked) => handleEditFormChange('is_soft_limit', checked)}
								/>
							)}
						</div>
					)}

					<Spacer className='!h-4' />

					<div className='flex gap-4 justify-end'>
						<Button variant='outline' onClick={handleCloseEditDrawer} disabled={isUpdatingEntitlement}>
							Cancel
						</Button>
						<Button onClick={handleSaveEdit} disabled={isUpdatingEntitlement}>
							{isUpdatingEntitlement ? 'Saving...' : 'Save Changes'}
						</Button>
					</div>
				</div>
			</Sheet>
		</>
	);
};

export default SubscriptionEntitlementsSection;
