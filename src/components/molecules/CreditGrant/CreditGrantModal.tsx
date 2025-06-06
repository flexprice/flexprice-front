import { Button, Input, Label } from '@/components/atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditGrant } from '@/models/Subscription';
import { useMemo, useState } from 'react';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import RectangleRadiogroup, { RectangleRadiogroupOption } from '../RectangleRadiogroup';
import { BILLING_CADENCE } from '@/models/Invoice';
interface Props {
	data?: CreditGrant;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSave: (data: CreditGrant) => void;
	onCancel: () => void;
	getEmptyCreditGrant: () => Partial<CreditGrant>;
}

const CreditGrantModal: React.FC<Props> = ({ data, isOpen, onOpenChange, onSave, onCancel, getEmptyCreditGrant }) => {
	const isEdit = !!data;

	const [errors, setErrors] = useState<{
		name?: string;
		amount?: string;
		expire_in_days?: string;
		priority?: string;
	}>({});

	const [formData, setFormData] = useState<Partial<CreditGrant>>(data || getEmptyCreditGrant());

	const handleSave = () => {
		const newCredit: CreditGrant = formData as CreditGrant;
		if (!validateForm()) {
			return;
		}
		onSave(newCredit);
		setFormData(getEmptyCreditGrant());
		onOpenChange(false);
	};

	const validateForm = (): boolean => {
		setErrors({});
		if (!formData.name) {
			setErrors({ ...errors, name: 'Name is required' });
			return false;
		}
		if (!formData.amount) {
			setErrors({ ...errors, amount: 'Amount is required' });
			return false;
		}

		// if (!formData.priority) {
		//     setErrors({ ...errors, priority: 'Priority is required' });
		//     return false;
		// }
		return true;
	};

	const billingCadenceOptions: RectangleRadiogroupOption[] = useMemo(() => {
		return [
			{
				label: 'One-time',
				value: BILLING_CADENCE.ONETIME,
				description: 'This credit will be applied to the subscription once.',
			},
			{
				label: 'Recurring',
				value: BILLING_CADENCE.RECURRING,
				description: 'This credit will be applied to the subscription every billing period.',
			},
		];
	}, []);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className='bg-white sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Edit Credit Grant' : 'Add Credit Grant'}</DialogTitle>
				</DialogHeader>
				<div className='grid gap-4 py-4'>
					<div className='space-y-2'>
						<Label label='Credit Type' />
						<RectangleRadiogroup
							options={billingCadenceOptions.map((option) => ({
								...option,
								description: undefined,
							}))}
							value={formData.cadence}
							onChange={(value) => {
								setFormData((prev) => ({ ...prev, cadence: value as BILLING_CADENCE }));
							}}
						/>
						<p className='text-sm text-gray-500'>
							{billingCadenceOptions.find((option) => option.value === formData.cadence)?.description}
						</p>
					</div>
					<div className='space-y-2'>
						<Label label='Credit Name' />
						<Input
							placeholder='e.g. Welcome Credits'
							value={formData.name}
							onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
							error={errors.name}
						/>
					</div>
					<div className='space-y-2'>
						<Label label='Amount' />
						<Input
							error={errors.amount}
							inputPrefix={getCurrencySymbol(formData.currency || '')}
							placeholder='e.g. 1000 '
							variant='formatted-number'
							value={formData.amount?.toString()}
							onChange={(value) => {
								setFormData((prev) => ({ ...prev, amount: value as any }));
							}}
						/>
					</div>
					<div className='space-y-2'>
						<Label label='Expiry (days)' />
						<Input
							error={errors.expire_in_days}
							placeholder='e.g. 30'
							variant='formatted-number'
							formatOptions={{
								allowDecimals: false,
								allowNegative: false,
								decimalSeparator: ',',
								thousandSeparator: ',',
							}}
							suffix='days'
							value={formData.expire_in_days?.toString()}
							onChange={(value) => setFormData((prev) => ({ ...prev, expire_in_days: parseInt(value) || undefined }))}
						/>
					</div>
					<div className='space-y-2'>
						<Label label='Priority' />
						<Input
							error={errors.priority}
							placeholder='e.g. 0'
							variant='formatted-number'
							value={formData.priority?.toString()}
							onChange={(value) => setFormData((prev) => ({ ...prev, priority: parseInt(value) || 0 }))}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant='outline' onClick={onCancel}>
						Cancel
					</Button>
					<Button onClick={handleSave}>{isEdit ? 'Save Changes' : 'Add Credit'}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CreditGrantModal;
