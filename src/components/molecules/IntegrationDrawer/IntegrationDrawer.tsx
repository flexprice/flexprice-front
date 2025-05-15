import { FC, useState, useEffect } from 'react';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';

interface IntegrationDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	provider: string;
	providerName: string;
	connection?: any; // for editing
	onSave: (connection: any) => void;
	trigger?: React.ReactNode;
}

const IntegrationDrawer: FC<IntegrationDrawerProps> = ({ isOpen, onOpenChange, provider, providerName, connection, onSave, trigger }) => {
	const [formData, setFormData] = useState({
		name: '',
		apiKey: '',
		code: '',
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Reset form on open or when editing connection changes
	useEffect(() => {
		if (isOpen) {
			if (connection) {
				setFormData({
					name: connection.name || '',
					apiKey: connection.apiKey || connection.code || '',
					code: connection.code || '',
				});
			} else {
				setFormData({ name: '', apiKey: '', code: '' });
			}
			setErrors({});
		}
	}, [isOpen, connection]);

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

	const handleSave = () => {
		if (validateForm()) {
			onSave({
				...connection,
				name: formData.name,
				code: formData.apiKey,
				apiKey: formData.apiKey,
				provider,
			});
		}
	};

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={connection ? `Edit ${providerName} Connection` : `Connect to ${providerName}`}
			description="Enter connection details. Click save when you're done."
			trigger={trigger}
			size='lg'>
			<div className='space-y-4 mt-4'>
				<Input
					label='Connection Name'
					placeholder='Enter Name'
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description='A dummy name for this integration'
				/>
				<Input
					label='API Secret Key'
					placeholder='Enter API Secret Key'
					type='password'
					value={formData.apiKey}
					onChange={(value) => handleChange('apiKey', value)}
					error={errors.apiKey}
				/>
				<p className='text-sm text-muted-foreground -mt-2'>Your API secret key from the provider</p>
				<Spacer className='!h-4' />
				<div className='flex gap-2'>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1'>
						Cancel
					</Button>
					<Button onClick={handleSave} className='flex-1'>
						{connection ? 'Update' : 'Save'}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default IntegrationDrawer;
