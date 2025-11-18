import { FormHeader, Loader, Page, Button } from '@/components/atoms';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, Trash2, Eye, BarChart3 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ConnectionApi, TaskApi } from '@/api';
import toast from 'react-hot-toast';
import S3ConnectionDrawer from '@/components/molecules/S3ConnectionDrawer/S3ConnectionDrawer';
import { ApiDocsContent } from '@/components/molecules';
import { CONNECTION_PROVIDER_TYPE } from '@/models';

const S3Exports = () => {
	const navigate = useNavigate();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	// Fetch S3 connections
	const {
		data: connectionsResponse,
		refetch: refetchConnections,
		isLoading,
	} = useQuery({
		queryKey: ['connections', 's3'],
		queryFn: () => ConnectionApi.getAllConnections({ provider_type: CONNECTION_PROVIDER_TYPE.S3 }),
	});

	const connections = connectionsResponse?.connections || [];

	// Fetch export counts for each connection
	const { data: exportCounts } = useQuery({
		queryKey: ['export-counts', connections.map((c) => c.id)],
		queryFn: async () => {
			const counts: Record<string, number> = {};
			await Promise.all(
				connections.map(async (connection) => {
					try {
						const response = await TaskApi.getAllScheduledTasks({
							connection_id: connection.id,
						});
						// Filter out deleted tasks
						const activeTasks = response.items.filter((task) => task.status !== 'deleted');
						counts[connection.id] = activeTasks.length;
					} catch (error) {
						counts[connection.id] = 0;
					}
				}),
			);
			return counts;
		},
		enabled: connections.length > 0,
	});

	// Delete connection mutation
	const { mutate: deleteConnection, isPending: isDeletingConnection } = useMutation({
		mutationFn: (id: string) => ConnectionApi.deleteConnection(id),
		onSuccess: () => {
			toast.success('Connection deleted successfully');
			refetchConnections();
		},
		onError: (error: any) => {
			toast.error(error?.message || 'Failed to delete connection');
		},
	});

	const handleSaveConnection = () => {
		refetchConnections();
	};

	const handleDeleteConnection = (id: string, name: string) => {
		if (window.confirm(`Are you sure you want to delete the connection "${name}"?`)) {
			deleteConnection(id);
		}
	};

	const handleViewExports = (connectionId: string) => {
		navigate(`/tools/exports/s3/${connectionId}/export`);
	};

	if (isLoading) {
		return <Loader />;
	}

	return (
		<Page heading='S3 Data Exports'>
			<ApiDocsContent tags={['Exports', 'S3', 'Data Pipelines']} />

			{/* Back button and Add Connection Button */}
			<div className='mb-6 flex items-center justify-between'>
				<Button variant='outline' onClick={() => navigate('/tools/exports')} className='flex items-center gap-2'>
					<ArrowLeft className='w-4 h-4' />
					Back to Exports
				</Button>
				<Button
					onClick={() => {
						setIsDrawerOpen(true);
					}}
					className='flex items-center gap-2'>
					<Plus className='w-4 h-4' />
					Add
				</Button>
			</div>

			{/* Connections List */}
			{connections.length > 0 ? (
				<div className='mb-8'>
					<FormHeader variant='form-component-title' title='Connections' />
					<div className='card'>
						{connections.map((connection, idx) => (
							<div key={idx} className='flex items-center justify-between text-sm p-4 border-b last:border-b-0'>
								<div className='flex-1'>
									<div className='flex items-center gap-3'>
										<div className='w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center'>
											<Settings className='w-5 h-5 text-orange-600' />
										</div>
										<div>
											<p className='text-gray-900 font-medium'>{connection.name}</p>
											<p className='text-xs text-gray-500 capitalize'>{connection.connection_status} • S3</p>
										</div>
									</div>
								</div>
								<div className='flex items-center gap-10'>
									{/* Export Count */}
									<div className='flex items-center gap-2 text-sm text-gray-600'>
										<BarChart3 className='w-4 h-4' />
										<span>
											{exportCounts?.[connection.id] || 0} export{exportCounts?.[connection.id] !== 1 ? 's' : ''}
										</span>
									</div>
									{/* Action Buttons */}
									<div className='flex items-center gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() => handleViewExports(connection.id)}
											className='flex items-center gap-1'>
											<Eye className='w-3 h-3' />
											View Exports
										</Button>
										<Button
											variant='outline'
											size='icon'
											onClick={() => handleDeleteConnection(connection.id, connection.name)}
											disabled={isDeletingConnection}
											isLoading={isDeletingConnection}>
											<Trash2 className='size-4' />
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<div className='card text-center !py-12'>
					<div className='text-gray-500 mb-4'>
						<Settings className='w-12 h-12 mx-auto mb-4 text-gray-300' />
						<h3 className='text-lg font-medium text-gray-900 mb-2'>No S3 Connections</h3>
						<p className='text-gray-500 mb-6'>Create your first S3 connection to start exporting data.</p>
						<Button
							variant='outline'
							onClick={() => {
								setIsDrawerOpen(true);
							}}
							className='flex items-center gap-2 mx-auto'>
							<Plus className='w-4 h-4' />
							Add S3 Connection
						</Button>
					</div>
				</div>
			)}

			{/* Overview Section */}
			<div className='card space-y-6 mt-8'>
				<h3 className='text-xl font-semibold text-gray-900'>S3 Export Features</h3>
				<div className='space-y-4'>
					<div>
						<h4 className='text-sm font-semibold text-gray-900 mb-1'>Data Export</h4>
						<p className='text-xs text-gray-600'>
							Automatically export events, invoices, and other Flexprice data to your S3 bucket on a scheduled basis.
						</p>
					</div>
					<div>
						<h4 className='text-sm font-semibold text-gray-900 mb-1'>Flexible Scheduling</h4>
						<p className='text-xs text-gray-600'>Choose between hourly or daily export schedules to match your data processing needs.</p>
					</div>
					<div>
						<h4 className='text-sm font-semibold text-gray-900 mb-1'>Secure Storage</h4>
						<p className='text-xs text-gray-600'>
							Your data is encrypted and securely stored in your own S3 bucket with configurable encryption options.
						</p>
					</div>
					<div>
						<h4 className='text-sm font-semibold text-gray-900 mb-1'>Data Format Options</h4>
						<p className='text-xs text-gray-600'>
							Export data in various formats with configurable compression and file size limits for optimal storage efficiency.
						</p>
					</div>
				</div>
			</div>

			{/* S3 Connection Drawer */}
			<S3ConnectionDrawer
				isOpen={isDrawerOpen}
				onOpenChange={(open) => {
					setIsDrawerOpen(open);
				}}
				connection={null}
				onSave={handleSaveConnection}
			/>
		</Page>
	);
};

export default S3Exports;
