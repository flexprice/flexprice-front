import { useParams } from 'react-router-dom';
import { integrations } from './integrationsData';
import { cn } from '@/lib/utils';
import { Button, FormHeader, Page } from '@/components/atoms';
import { useState, useEffect } from 'react';
import IntegrationDrawer from '@/components/molecules/IntegrationDrawer/IntegrationDrawer';
import { PencilIcon, TrashIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiDocsContent } from '@/components/molecules';
import { generateUniqueId } from '@/utils/common/helper_functions';
import { useUser } from '@/hooks/UserContext';

const getStorageKey = (userId: string) => `connections_${userId}`;

function maskCode(code: string, options = { start: 1, end: 4, maskChar: '*', maskLength: 4, defaultMask: '********' }) {
	if (typeof code !== 'string' || code.length === 0) return options.defaultMask;

	const { start, end, maskChar, maskLength } = options;

	// If code is too short to preserve visible chars
	if (code.length <= start + end) {
		return maskChar.repeat(code.length);
	}

	return code.slice(0, start) + maskChar.repeat(maskLength) + code.slice(code.length - end);
}

const IntegrationDetails = () => {
	const { id: name } = useParams() as { id: string };
	const integration = integrations.find((integration) => integration.name.toLocaleLowerCase() === name.toLocaleLowerCase())!;
	const { user } = useUser();

	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [editingConnection, setEditingConnection] = useState<any | null>(null);
	const [connections, setConnections] = useState<any[]>([]);

	// Load connections from localStorage
	useEffect(() => {
		if (!user?.id) return;
		const key = getStorageKey(user.id);
		const allConnections = JSON.parse(localStorage.getItem(key) || '[]');
		setConnections(allConnections.filter((c: any) => c.provider === name));
	}, [user, name]);

	// Save connections to localStorage
	const saveConnections = (updated: any[]) => {
		if (!user?.id) return;
		const key = getStorageKey(user.id);
		// Get all connections, update only those for this provider
		const allConnections = JSON.parse(localStorage.getItem(key) || '[]');
		const filtered = allConnections.filter((c: any) => c.provider !== name);
		const merged = [...filtered, ...updated];
		localStorage.setItem(key, JSON.stringify(merged));
		setConnections(updated);
	};

	// Add or update connection
	const handleSaveConnection = (connection: any) => {
		let updated;
		if (connection.id) {
			// Edit
			updated = connections.map((c) => (c.id === connection.id ? connection : c));
			toast.success('Connection updated');
		} else {
			// Add
			const newConn = { ...connection, id: generateUniqueId(), provider: name };
			updated = [...connections, newConn];
			toast.success('Connection added');
		}
		saveConnections(updated);
		setIsDrawerOpen(false);
		setEditingConnection(null);
	};

	// Delete connection
	const handleDeleteConnection = (id: string) => {
		const updated = connections.filter((c) => c.id !== id);
		saveConnections(updated);
		toast.success('Connection deleted');
	};

	// Open drawer for add/edit
	const handleAdd = () => {
		setEditingConnection(null);
		setIsDrawerOpen(true);
	};
	const handleEdit = (connection: any) => {
		setEditingConnection(connection);
		setIsDrawerOpen(true);
	};

	return (
		<Page>
			<ApiDocsContent tags={['Integrations', 'secrets']} />
			<div className={cn('border rounded-xl p-4 flex items-center shadow-sm', !integration.premium && 'cursor-pointer')}>
				<div className='size-20 flex items-center justify-center bg-gray-100 rounded-lg'>
					<img src={integration.logo} alt={integration.name} className='size-16 object-contain' />
				</div>
				<div className='ml-4 flex-1'>
					<div className='flex items-center justify-between w-full'>
						<h3 className='font-semibold text-lg'>{integration.name}</h3>
						{integration.premium && (
							<div className='absolute top-2 right-2 bg-[#FEF08A] text-[#D97706] text-xs !font-semibold px-2 py-1 rounded-2xl !opacity-55'>
								Coming Soon
							</div>
						)}
					</div>
					<p className='text-gray-500 text-sm'>{integration.description}</p>
					<div className='mt-2 flex items-center gap-2'>
						{integration.tags.map((tag, idx) => (
							<span key={idx} className='text-xs bg-gray-200 px-2 py-1 rounded-md'>
								{tag}
							</span>
						))}
					</div>
				</div>
				<div className='flex gap-2 items-center'>
					{integration.premium ? (
						<Button disabled variant='outline' className='flex gap-2 items-center'>
							Coming Soon
						</Button>
					) : (
						<Button onClick={handleAdd} className='flex gap-2 items-center'>
							Add a connection
						</Button>
					)}
				</div>
			</div>

			{/* Integration Drawer for Add/Edit */}
			<IntegrationDrawer
				isOpen={isDrawerOpen}
				onOpenChange={(open) => {
					setIsDrawerOpen(open);
					if (!open) setEditingConnection(null);
				}}
				provider={name}
				providerName={integration.name}
				connection={editingConnection}
				onSave={handleSaveConnection}
			/>

			{/* List all connections for this provider */}
			{connections.length > 0 && (
				<div className='mt-6'>
					<FormHeader variant='form-component-title' title='Connected Accounts' />
					<div className='card'>
						{connections.map((item, idx) => {
							const maskedCode = maskCode(item.code);
							return (
								<div key={idx} className='flex items-center justify-between text-sm p-3 border-b last:border-b-0'>
									<div>
										<p className='text-gray-900 font-medium'>{item.name}</p>
										{item.code && <p className='text-xs text-gray-500'>{maskedCode}</p>}
									</div>
									<div className='flex items-center gap-2'>
										<Button className='hidden' variant='outline' size='icon' onClick={() => handleEdit(item)}>
											<PencilIcon className='size-4' />
										</Button>
										<Button variant='outline' size='icon' onClick={() => handleDeleteConnection(item.id)}>
											<TrashIcon className='size-4' />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Details section */}
			<div className='card space-y-6 mt-6'>
				{integration.info?.map((infoItem, idx) => (
					<div key={idx} className='mt-4'>
						<FormHeader variant='form-component-title' title={infoItem.title}></FormHeader>
						{infoItem.description.map((desc, descIdx) => (
							<p key={descIdx} className='text-gray-500 text-sm mt-1'>
								{desc}
							</p>
						))}
					</div>
				))}
			</div>
		</Page>
	);
};

export default IntegrationDetails;
