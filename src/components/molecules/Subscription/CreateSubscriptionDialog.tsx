import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button, Sheet, Spacer } from '@/components/atoms';
import { CustomerSearchSelect } from '@/components/molecules/Customer';
import { Customer } from '@/models';
import { RouteNames } from '@/core/routes/Routes';

interface CreateSubscriptionDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

const CreateSubscriptionDialog: React.FC<CreateSubscriptionDialogProps> = ({ isOpen, onOpenChange }) => {
	const { t } = useTranslation(['billing', 'common']);
	const navigate = useNavigate();
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();

	const handleCreateSubscription = () => {
		if (selectedCustomer?.id) {
			navigate(`${RouteNames.customers}/${selectedCustomer.id}/add-subscription`);
			onOpenChange(false);
		}
	};

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			setSelectedCustomer(undefined);
		}
		onOpenChange(open);
	};

	return (
		<Sheet isOpen={isOpen} onOpenChange={handleOpenChange} title={t('subscriptions.createDialog.title')}>
			<div className='space-y-6 p-6'>
				<div className='space-y-2'>
					<label className='text-sm font-medium'>{t('subscriptions.createDialog.selectCustomer')}</label>
					<CustomerSearchSelect value={selectedCustomer} onChange={(customer) => setSelectedCustomer(customer)} includeNoneOption={false} />
				</div>

				<Spacer />

				<div className='flex justify-end gap-3'>
					<Button variant='outline' onClick={() => handleOpenChange(false)}>
						{t('common:actions.cancel')}
					</Button>
					<Button onClick={handleCreateSubscription} disabled={!selectedCustomer}>
						{t('common:actions.continue')}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default CreateSubscriptionDialog;
