import { FC, useState, useEffect } from 'react';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import IntegrationsApi from '@/api/IntegrationsApi';
import { LoaderCircleIcon } from 'lucide-react';
import { logger } from '@/utils/common/Logger';

interface IntegrationDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	provider: string;
	providerName: string;
	onSuccess?: () => void;
	trigger?: React.ReactNode;
}

const IntegrationDrawer: FC<IntegrationDrawerProps> = ({ isOpen, onOpenChange, provider, providerName, onSuccess, trigger }) => {
	const [formData, setFormData] = useState({
		name: '',
		apiKey: '',
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Reset form on open
	useEffect(() => {
		if (isOpen) {
			setFormData({
				name: '',
				apiKey: '',
			});
			setErrors({});
		}
	}, [isOpen]);

	// Query to check if integration exists
	const { data: existingIntegration, isLoading: isCheckingIntegration } = useQuery({
		queryKey: ['integration', provider],
		queryFn: async () => {
			try {
				const response = await IntegrationsApi.getIntegration(provider);
				return response;
			} catch (e) {
				logger.error(e);
				return null;
			}
		},
		enabled: isOpen,
	});

	// Mutation for installing integration
	const { mutate: installIntegration, isPending: isInstalling } = useMutation({
		mutationFn: async () => {
			// Combine API key and connection code in the key field if needed

			return await IntegrationsApi.installIntegration({
				provider,
				credentials: {
					key: formData.apiKey,
				},
				name: formData.name,
			});
		},
		onSuccess: () => {
			toast.success(`${providerName} integration installed successfully`);
			// Call the onSuccess callback if provided
			if (onSuccess) {
				onSuccess();
			}
			onOpenChange(false);
		},
		onError: (error: ServerError) => {
			console.error(error);
			toast.error(error.error.message || `Failed to install ${providerName} integration. Please try again.`);
		},
	});

	const handleChange = (field: keyof typeof formData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: '' }));
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = 'Connection name is required';
		}

		if (!formData.apiKey.trim()) {
			newErrors.apiKey = 'API secret key is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleInstall = () => {
		if (validateForm()) {
			installIntegration();
		}
	};

	const hasIntegration = (existingIntegration?.items?.length || 0) > 0;

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={`Connect to ${providerName}`}
			description="Make changes to your profile here. Click save when you're done."
			trigger={trigger}
			size='lg'>
			<div className='space-y-4 mt-4'>
				{isCheckingIntegration ? (
					<div className='flex justify-center py-4'>
						<LoaderCircleIcon className='animate-spin h-6 w-6' />
					</div>
				) : hasIntegration ? (
					<div className='space-y-4'>
						<div className='card p-4'>
							<h3 className='font-medium mb-2'>Integration Details</h3>
							<div className='space-y-2'>
								<div className='flex justify-between'>
									<span className='text-sm text-muted-foreground'>Name</span>
									<span className='text-sm'>{existingIntegration?.items[0].name}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-sm text-muted-foreground'>Status</span>
									<span className='text-sm'>{existingIntegration?.items[0].status}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-sm text-muted-foreground'>Created</span>
									<span className='text-sm'>
										{existingIntegration?.items[0].created_at && new Date(existingIntegration.items[0].created_at).toLocaleDateString()}
									</span>
								</div>
							</div>
						</div>
						<Button variant='outline' onClick={() => onOpenChange(false)} className='!mt-4'>
							Close
						</Button>
					</div>
				) : (
					<>
						<Input
							label='Connection Name'
							placeholder='Enter Name'
							value={formData.name}
							onChange={(value) => handleChange('name', value)}
							error={errors.name}
							disabled={isInstalling}
							description='A dummy name for this integration'
						/>

						<Input
							label='API Secret Key'
							placeholder='Enter API Secret Key'
							type='password'
							value={formData.apiKey}
							onChange={(value) => handleChange('apiKey', value)}
							error={errors.apiKey}
							disabled={isInstalling}
						/>
						<p className='text-sm text-muted-foreground -mt-2'>Your API secret key from the provider</p>

						<Spacer className='!h-4' />

						<div className='flex gap-2'>
							<Button variant='outline' onClick={() => onOpenChange(false)} disabled={isInstalling} className='flex-1'>
								Cancel
							</Button>
							<Button isLoading={isInstalling} disabled={isInstalling} onClick={handleInstall} className='flex-1'>
								Install
							</Button>
						</div>
					</>
				)}
			</div>
		</Sheet>
	);
};

export default IntegrationDrawer;
