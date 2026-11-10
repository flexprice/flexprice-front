import { FC, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import { Connection } from '@/models';

// A generic provider connection: any saved connection fields plus the API key this drawer collects.
interface IntegrationDrawerConnection extends Partial<Connection> {
	apiKey?: string;
	code?: string;
	provider?: string;
}

interface IntegrationDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	provider: string;
	providerName: string;
	connection?: IntegrationDrawerConnection | null; // for editing
	onSave: (connection: IntegrationDrawerConnection) => void;
	trigger?: React.ReactNode;
}

const IntegrationDrawer: FC<IntegrationDrawerProps> = ({ isOpen, onOpenChange, provider, providerName, connection, onSave, trigger }) => {
	const { t } = useTranslation(['settings', 'common']);
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
			newErrors.name = t('integrationDrawer.validation.nameRequired');
		}
		if (!formData.apiKey.trim()) {
			newErrors.apiKey = t('integrationDrawer.validation.apiSecretRequired');
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
			title={connection ? t('integrationDrawer.title.edit', { providerName }) : t('integrationDrawer.title.connect', { providerName })}
			description={t('integrationDrawer.description')}
			trigger={trigger}
			size='lg'>
			<div className='space-y-4 mt-9'>
				<Input
					label={t('integrationDrawer.connectionName')}
					placeholder={t('integrationDrawer.connectionNamePlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('integrationDrawer.connectionNameHint')}
				/>
				<Input
					label={t('integrationDrawer.apiSecretKey')}
					placeholder={t('integrationDrawer.apiSecretPlaceholder')}
					type='password'
					value={formData.apiKey}
					onChange={(value) => handleChange('apiKey', value)}
					error={errors.apiKey}
				/>
				<p className='text-sm text-muted-foreground -mt-2'>{t('integrationDrawer.apiSecretHint')}</p>
				<Spacer className='!h-1' />
				<div className='flex gap-2'>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1'>
						{t('common:actions.cancel')}
					</Button>
					<Button onClick={handleSave} className='flex-1'>
						{connection ? t('common:actions.update') : t('common:actions.save')}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default IntegrationDrawer;
