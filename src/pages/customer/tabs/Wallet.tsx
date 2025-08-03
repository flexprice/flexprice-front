import { AddButton, Button, Card, CardHeader, Chip, FormHeader, NoDataCard, Select, ShortPagination, Spacer } from '@/components/atoms';
import {
	DropdownMenu,
	DropdownMenuOption,
	TopupCard,
	WalletTransactionsTable,
	ApiDocsContent,
	TerminateWalletModal,
	MetadataModal,
	WalletAlertDialog,
} from '@/components/molecules';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import usePagination from '@/hooks/usePagination';
import { Wallet } from '@/models/Wallet';
import WalletApi from '@/api/WalletApi';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { IoSearch } from 'react-icons/io5';
import { useParams, useOutletContext } from 'react-router-dom';
import CreateWallet from '../customers/CreateWallet';
import { EllipsisVertical, Info, Pencil, SlidersHorizontal, Trash2, Wallet as WalletIcon, Bell } from 'lucide-react';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import useQueryParams from '@/hooks/useQueryParams';
import { DetailsCard } from '@/components/molecules';
import { formatAmount } from '@/components/atoms/Input/Input';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { logger } from '@/utils/common/Logger';

const formatWalletStatus = (status?: string) => {
	const statusMap: Record<string, string> = {
		active: 'Active',
		frozen: 'Frozen',
		closed: 'Closed',
	};
	return status ? statusMap[status.toLowerCase()] || 'Unknown' : 'Unknown';
};

const filterStringMetadata = (meta: Record<string, unknown> | undefined): Record<string, string> => {
	if (!meta) return {};
	return Object.fromEntries(Object.entries(meta).filter(([_, v]) => typeof v === 'string') as [string, string][]);
};

const WalletTab = () => {
	const { id: customerId } = useParams();
	const { limit, offset } = usePagination();
	const {
		queryParams: { activeWalletId },
		setQueryParam,
	} = useQueryParams<{ activeWalletId?: string }>({ activeWalletId: '' });

	const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);
	const [showTopupModal, setShowTopupModal] = useState(false);
	const [showTerminateModal, setShowTerminateModal] = useState(false);
	const [showMetadataModal, setShowMetadataModal] = useState(false);
	const [showAlertDialog, setShowAlertDialog] = useState(false);
	const [activeWallet, setActiveWallet] = useState<Wallet | null>();
	const [metadata, setMetadata] = useState<Record<string, string>>({});

	const { isArchived } = useOutletContext<{ isArchived: boolean }>();

	// Wallet Queries
	const {
		data: wallets,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchWallets', customerId],
		queryFn: () => WalletApi.getCustomerWallets({ id: customerId! }),
		enabled: !!customerId,
	});

	const { data: walletBalance, isLoading: isBalanceLoading } = useQuery({
		queryKey: ['fetchWalletBalances', customerId, activeWallet?.id],
		queryFn: () => WalletApi.getWalletBalance(activeWallet ? activeWallet.id : ''),
		enabled: !!customerId && !!activeWallet,
	});

	const {
		data: transactionsData,
		isLoading: isTransactionLoading,
		isError: isTransactionError,
	} = useQuery({
		queryKey: ['fetchWalletsTransactions', customerId, activeWallet?.id],
		queryFn: () =>
			WalletApi.getWalletTransactions({
				walletId: activeWallet ? activeWallet.id : '',
				limit,
				offset,
			}),
		enabled: !!customerId && !!activeWallet,
	});

	// Memoized and derived data
	const walletOptions = useMemo(
		() =>
			wallets?.map((wallet, index) => ({
				label: wallet.name || `Wallet ${index + 1}`,
				value: wallet.id,
			})) || [],
		[wallets],
	);

	const dropdownOptions: DropdownMenuOption[] = useMemo(
		() => [
			{
				icon: <WalletIcon />,
				label: 'Create Wallet',
				onSelect: () => setShowCreateWalletModal(true),
			},
			...(activeWallet
				? [
						{
							icon: <Pencil />,
							label: 'Edit',
							disabled: true,
						},
						{
							icon: <Bell />,
							label: 'Alert Settings',
							onSelect: () => setShowAlertDialog(true),
						},
						{
							icon: <Trash2 />,
							label: 'Terminate',
							onSelect: () => setShowTerminateModal(true),
						},
					]
				: []),
		],
		[activeWallet],
	);

	// Effect to set initial active wallet
	useEffect(() => {
		if (!wallets?.length) return;

		const selectedWallet = wallets.find((wallet) => wallet.id === activeWalletId) || wallets[0];

		setActiveWallet(selectedWallet);
		setQueryParam('activeWalletId', selectedWallet.id);
	}, [wallets, activeWalletId]);

	// Update metadata state when active wallet changes
	useEffect(() => {
		setMetadata(filterStringMetadata(activeWallet?.metadata));
	}, [activeWallet]);

	// Render loading state
	if (isLoading || isTransactionLoading || isBalanceLoading) {
		return (
			<div className='h-full space-y-5'>
				<Skeleton className='w-full h-16' />
				<Skeleton className='w-full h-32' />
				<Skeleton className='w-full h-32' />
			</div>
		);
	}

	// Handle errors
	if (isError || isTransactionError) {
		toast.error('An error occurred while fetching wallet details');
	}

	// Render wallet details
	return (
		<div className='space-y-6'>
			<ApiDocsContent tags={['Wallets', 'Topup']} />

			{/* Create Wallet Modal */}
			<CreateWallet
				customerId={customerId!}
				open={showCreateWalletModal}
				onOpenChange={setShowCreateWalletModal}
				onSuccess={(walletId) => {
					setShowCreateWalletModal(false);
					setActiveWallet(wallets?.find((wallet) => wallet.id === walletId) || null);
					setQueryParam('activeWalletId', walletId);
				}}
			/>

			{/* Topup Modal */}
			<Dialog open={showTopupModal} onOpenChange={() => setShowTopupModal(false)}>
				<TopupCard
					onSuccess={() => {
						setShowTopupModal(false);
					}}
					walletId={activeWallet?.id}
					conversion_rate={activeWallet?.conversion_rate}
					currency={activeWallet?.currency ?? ''}
				/>
			</Dialog>

			{/* Terminate Wallet Modal */}
			{activeWallet && (
				<TerminateWalletModal isOpen={showTerminateModal} onOpenChange={() => setShowTerminateModal(false)} wallet={activeWallet} />
			)}

			{/* Metadata Modal for Editing */}
			<MetadataModal
				open={showMetadataModal}
				data={metadata}
				onChange={() => {}}
				onSave={async (newMetadata) => {
					if (!activeWallet?.id) return;
					try {
						const updated = await WalletApi.updateWallet(activeWallet.id!, { metadata: newMetadata });
						setMetadata(filterStringMetadata(updated.metadata));
						setShowMetadataModal(false);
						refetchQueries(['fetchWallets', customerId!]);
					} catch (e) {
						logger.error('Failed to update metadata', e);
					}
				}}
				onClose={() => setShowMetadataModal(false)}
			/>

			{/* Wallet Alert Dialog */}
			<WalletAlertDialog
				open={showAlertDialog}
				alertEnabled={activeWallet?.alert_enabled || false}
				alertConfig={activeWallet?.alert_config}
				currency={activeWallet?.currency}
				onSave={async (alertEnabled, alertConfig) => {
					if (!activeWallet?.id) return;
					try {
						await WalletApi.updateWallet(activeWallet.id!, {
							alert_enabled: alertEnabled,
							alert_config: alertConfig,
						});
						setShowAlertDialog(false);
						refetchQueries(['fetchWallets', customerId!]);
						toast.success('Alert settings updated successfully');
					} catch (e) {
						logger.error('Failed to update alert settings', e);
						toast.error('Failed to update alert settings');
					}
				}}
				onClose={() => setShowAlertDialog(false)}
			/>

			{!wallets?.length ? (
				<NoDataCard
					title='Wallets'
					subtitle='No wallets linked to the customer'
					cta={!isArchived && <AddButton label='Add Wallet' onClick={() => setShowCreateWalletModal(true)} />}
				/>
			) : (
				<>
					{/* Wallet Selection and Actions */}
					<div className='w-full flex justify-between items-center mb-3'>
						<div>
							<div className='min-w-[250px]'>
								<Select
									options={walletOptions}
									value={activeWallet?.id}
									onChange={(value) => {
										const selectedWallet = wallets?.find((wallet) => wallet.id === value) || null;
										setActiveWallet(selectedWallet);
										setQueryParam('activeWalletId', value || '');
									}}
								/>
							</div>
						</div>
						<div className='flex items-center space-x-2'>
							{!isArchived && (
								<>
									{activeWallet && (
										<Button onClick={() => setShowTopupModal(true)}>
											<WalletIcon />
											<span>Topup Wallet</span>
										</Button>
									)}
								</>
							)}

							<DropdownMenu
								options={dropdownOptions}
								trigger={<Button variant={'outline'} prefixIcon={<EllipsisVertical />} size={'icon'}></Button>}
							/>
						</div>
					</div>

					{/* Active Wallet Details */}
					{activeWallet && (
						<div>
							<DetailsCard
								variant='stacked'
								title='Wallet Details'
								data={[
									{ label: 'Wallet Name', value: activeWallet?.name || 'Prepaid wallet' },
									{
										label: 'Status',
										value: (
											<Chip
												variant={formatWalletStatus(activeWallet?.wallet_status) === 'Active' ? 'success' : 'default'}
												label={formatWalletStatus(activeWallet?.wallet_status)}
											/>
										),
									},
									{
										label: 'Conversion Rate',
										value: <span>{`1 Credit = ${activeWallet?.conversion_rate}${getCurrencySymbol(activeWallet?.currency ?? '')}`}</span>,
									},
								]}
							/>

							<Spacer className='!h-4' />

							{/* Wallet Balance */}
							{isBalanceLoading ? (
								<Skeleton className='w-full h-[200px]' />
							) : (
								<div className='w-full grid grid-cols-2 gap-4'>
									{['Current', 'Ongoing'].map((type, index) => (
										<Card key={index}>
											<div className='flex justify-between items-center mb-4'>
												<div className='flex items-center space-x-2'>
													<span className='text-gray-600 text-sm font-medium'>{type} Balance</span>
													<TooltipProvider delayDuration={0}>
														<Tooltip>
															<TooltipTrigger>
																<Info className='size-4 text-gray-400 hover:text-gray-600 transition-colors' />
															</TooltipTrigger>
															<TooltipContent>
																<p>{type === 'Current' ? 'Balance as per latest invoice' : 'Includes real-time usage'}</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</div>
												<div className='opacity-50 group-hover:opacity-100 transition-opacity'>
													<WalletIcon className='size-5 text-gray-500' />
												</div>
											</div>

											<div className='flex items-baseline space-x-2'>
												<span className='text-gray-500 text-2xl font-medium'>{getCurrencySymbol(walletBalance?.currency ?? '')}</span>
												<span className='text-4xl font-medium text-gray-900 leading-tight'>
													{type === 'Current'
														? formatAmount(walletBalance?.balance.toString() ?? '0')
														: formatAmount(walletBalance?.real_time_balance.toString() ?? '0')}
												</span>
											</div>

											<div className='flex justify-between items-center'>
												<span className='text-sm text-gray-500'>
													{type === 'Current'
														? formatAmount(walletBalance?.credit_balance.toString() ?? '0')
														: formatAmount(walletBalance?.real_time_credit_balance.toString() ?? '0')}
													{'  credits'}
												</span>
											</div>
										</Card>
									))}
								</div>
							)}

							<Spacer className='!h-4' />

							{/* Transactions */}
							{transactionsData?.items.length === 0 ? (
								<div className='card'>
									<FormHeader title='No transactions found' variant='sub-header' subtitle='No recent transactions' />
								</div>
							) : (
								<div className='card'>
									<div className='w-full flex justify-between items-center'>
										<FormHeader title='Transactions' titleClassName='!font-semibold' variant='form-title' />
										<div className='flex items-center space-x-2'>
											<button className='px-2 py-1'>
												<IoSearch className='size-4 text-[#09090B]' />
											</button>
											<button className='px-2 py-1'>
												<SlidersHorizontal className='size-4 text-[#09090B]' />
											</button>
										</div>
									</div>
									<Spacer className='!h-6' />
									<WalletTransactionsTable data={transactionsData?.items || []} currency={walletBalance?.currency ?? ''} />
									<ShortPagination unit='Transactions' totalItems={transactionsData?.pagination.total ?? 0} />
								</div>
							)}

							<Spacer className='!h-4' />

							<Card>
								<CardHeader
									title='Metadata'
									cta={
										!isArchived && (
											<Button variant='outline' size='icon' onClick={() => setShowMetadataModal(true)}>
												<Pencil className='size-5' />
											</Button>
										)
									}
								/>
								{metadata && Object.keys(metadata).length > 0 ? (
									<DetailsCard
										variant='stacked'
										data={
											metadata && Object.keys(metadata).length > 0
												? Object.entries(metadata).map(([key, value]) => ({ label: key, value }))
												: [{ label: 'No metadata available.', value: '' }]
										}
										cardStyle='borderless'
									/>
								) : (
									<div className='text-center py-8'>
										<h3 className='text-lg font-medium text-gray-900 mb-1'>No metadata</h3>
										<p className='text-sm text-gray-500 mb-4'>Add custom metadata to store additional information about this wallet.</p>
									</div>
								)}
							</Card>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default WalletTab;
