import { Button } from '@/components/atoms';
import { useTranslation } from 'react-i18next';

interface SettingsFormActionsProps {
	onReset: () => void;
	onSave: () => void;
	isSaving?: boolean;
	disabled?: boolean;
}

const SettingsFormActions = ({ onReset, onSave, isSaving, disabled }: SettingsFormActionsProps) => {
	const { t } = useTranslation(['settings', 'common']);

	return (
		<div className='mt-8 flex justify-end gap-2'>
			<Button variant='outline' onClick={onReset} disabled={disabled || isSaving}>
				{t('billing.actions.resetToDefaults')}
			</Button>
			<Button onClick={onSave} isLoading={isSaving} disabled={disabled}>
				{t('common:actions.save')}
			</Button>
		</div>
	);
};

export default SettingsFormActions;
