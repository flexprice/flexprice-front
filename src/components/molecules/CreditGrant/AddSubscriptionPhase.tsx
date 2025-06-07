import { SubscriptionPhase, BILLING_CYCLE } from '@/models/Subscription';
import { Button, Input, Label, DatePicker, Modal, FormHeader, Spacer } from '@/components/atoms';
import { useState } from 'react';
import { BILLING_CADENCE } from '@/models/Invoice';
import { CREDIT_GRANT_EXPIRATION_TYPE, CREDIT_GRANT_PERIOD, CREDIT_SCOPE, CreditGrant } from '@/models/CreditGrant';
import { BILLING_PERIOD } from '@/constants/constants';
import { uniqueId } from 'lodash';
import { getCurrencySymbol } from '@/utils/common/helper_functions';

interface Props {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSave: (data: SubscriptionPhase) => void;
	onCancel: () => void;
	data?: SubscriptionPhase;
	currency?: string;
	billingPeriod?: BILLING_PERIOD;
	planId: string;
	subscriptionId: string;
}

interface SubscriptionPhaseFormData {
	start_date: Date;
	end_date?: Date;
	commitment_amount: number | undefined;
	overage_factor: number;
	billing_cycle?: BILLING_CYCLE;
	prorate_charges?: boolean;
	credit_grants?: CreditGrant[];
}

const getDefaultCreditGrant = (currency: string, billingPeriod: BILLING_PERIOD, planId: string, subscriptionId: string): CreditGrant => ({
	id: uniqueId(),
	currency: currency,
	period: billingPeriod as unknown as CREDIT_GRANT_PERIOD,
	name: 'Free Credits',
	scope: CREDIT_SCOPE.SUBSCRIPTION,
	cadence: BILLING_CADENCE.ONETIME,
	period_count: 1,
	plan_id: planId,
	subscription_id: subscriptionId,
	metadata: {},
	credits: 0,
	expiration_duration: 0,
	expiration_type: CREDIT_GRANT_EXPIRATION_TYPE.NEVER,
	priority: 0,
});

const AddSubscriptionPhase = ({
	isOpen,
	onOpenChange,
	onSave,
	onCancel,
	data,
	currency = 'usd',
	billingPeriod = BILLING_PERIOD.MONTHLY,
	planId = '',
	subscriptionId,
}: Props) => {
	const isEdit = !!data;

	const [errors, setErrors] = useState<{
		start_date?: string;
		end_date?: string;
		overage_factor?: string;
	}>({});

	const [formData, setFormData] = useState<SubscriptionPhaseFormData>(
		data
			? {
					start_date: new Date(data.start_date),
					end_date: data.end_date ? new Date(data.end_date) : undefined,
					commitment_amount: data.commitment_amount ?? undefined,
					overage_factor: data.overage_factor || 1,
					billing_cycle: data.billing_cycle,
					prorate_charges: data.prorate_charges,
					credit_grants: data.credit_grants || [getDefaultCreditGrant(currency, billingPeriod, planId, subscriptionId || '')],
				}
			: {
					start_date: new Date(),
					end_date: undefined,
					commitment_amount: undefined,
					overage_factor: 1,
					billing_cycle: BILLING_CYCLE.ANNIVERSARY,
					prorate_charges: false,
					credit_grants: [getDefaultCreditGrant(currency, billingPeriod, planId, subscriptionId || '')],
				},
	);

	const handleSave = () => {
		if (!validateForm()) {
			return;
		}
		let commitment_amount: number | undefined = undefined;
		if (typeof formData.commitment_amount === 'string') {
			commitment_amount = String(formData.commitment_amount).trim() === '' ? undefined : parseFloat(formData.commitment_amount);
		} else {
			commitment_amount = formData.commitment_amount;
		}
		const credit_grants = formData.credit_grants
			?.map((grant) => ({
				...grant,
				credits:
					typeof grant.credits === 'string' ? (String(grant.credits).trim() === '' ? undefined : parseFloat(grant.credits)) : grant.credits,
			}))
			.filter((grant) => grant.credits !== 0 && grant.expiration_duration !== 0 && grant.priority !== 0);
		onSave({
			...formData,
			commitment_amount,
			credit_grants,
			start_date: formData.start_date.toISOString(),
			end_date: formData.end_date?.toISOString(),
		} as SubscriptionPhase);
		onOpenChange(false);
	};

	const validateForm = (): boolean => {
		setErrors({});
		if (!formData.start_date) {
			setErrors({ start_date: 'Start date is required' });
			return false;
		}
		return true;
	};

	const updateCreditGrant = (updates: Partial<CreditGrant>) => {
		setFormData((prev) => ({
			...prev,
			credit_grants: prev.credit_grants?.map((grant) => (grant.id === updates.id ? { ...grant, ...updates } : grant)),
		}));
	};

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-white rounded-lg p-6 w-[600px] max-w-[90vw]'>
			<div className='space-y-4'>
				<FormHeader title={isEdit ? 'Edit Subscription Phase' : 'Add Subscription Phase'} variant='sub-header' />
				<Spacer className='!my-6' />

				<div className='grid gap-6'>
					{/* Dates Section */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label label='Start Date' />
							<DatePicker
								date={formData.start_date}
								setDate={(date) => setFormData((prev) => ({ ...prev, start_date: date || new Date() }))}
								minDate={new Date()}
							/>
							{errors.start_date && <p className='text-sm text-red-500'>{errors.start_date}</p>}
						</div>
						<div className='space-y-2'>
							<Label label='End Date (Optional)' />
							<DatePicker
								date={formData.end_date}
								setDate={(date) => setFormData((prev) => ({ ...prev, end_date: date || undefined }))}
								minDate={formData.start_date}
							/>
						</div>
					</div>

					{/* Commitment and Overage Section */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label label='Commitment Amount' />
							<Input
								inputPrefix={getCurrencySymbol(currency)}
								placeholder='e.g. 1000'
								variant='formatted-number'
								value={formData.commitment_amount?.toString() ?? ''}
								onChange={(value) => setFormData((prev) => ({ ...prev, commitment_amount: value === '' ? undefined : parseFloat(value) }))}
							/>
						</div>
						<div className='space-y-2'>
							<Label label='Overage Factor' />
							<Input
								error={errors.overage_factor}
								placeholder='e.g. 1.5'
								variant='formatted-number'
								value={formData.overage_factor?.toString()}
								onChange={(value) => setFormData((prev) => ({ ...prev, overage_factor: parseFloat(value) || 1 }))}
							/>
						</div>
					</div>

					{/* Credit Grant Section */}
					<div className='space-y-4 border-t pt-4'>
						<Label label='Credit Grant' />
						{formData.credit_grants?.map((grant) => (
							<div key={grant.id} className='grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg'>
								<div className='space-y-2'>
									<Label label='Credit Name' />
									<Input
										placeholder='e.g. Welcome Credit'
										value={grant.name}
										onChange={(value) => updateCreditGrant({ id: grant.id, name: value })}
									/>
								</div>
								<div className='space-y-2'>
									<Label label='Credit Amount' />
									<Input
										inputPrefix={getCurrencySymbol(currency)}
										placeholder='e.g. 500'
										variant='formatted-number'
										value={grant.credits !== undefined && grant.credits !== null ? grant.credits.toString() : ''}
										onChange={(value) => updateCreditGrant({ id: grant.id, credits: value === '' ? undefined : parseFloat(value) })}
									/>
								</div>
								<div className='space-y-2'>
									<Label label='Expiry (days)' />
									<Input
										placeholder='e.g. 30'
										variant='formatted-number'
										suffix='days'
										value={grant.expiration_duration?.toString() ?? ''}
										onChange={(value) =>
											updateCreditGrant({ id: grant.id, expiration_duration: value === '' ? undefined : parseInt(value) })
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label label='Priority' />
									<Input
										placeholder='e.g. 0'
										variant='formatted-number'
										value={grant.priority?.toString() ?? ''}
										onChange={(value) => updateCreditGrant({ id: grant.id, priority: value === '' ? undefined : parseInt(value) })}
									/>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className='flex justify-end gap-3 pt-4'>
					<Button variant='outline' onClick={onCancel}>
						Cancel
					</Button>
					<Button onClick={handleSave}>{isEdit ? 'Save Changes' : 'Add Phase'}</Button>
				</div>
			</div>
		</Modal>
	);
};

export default AddSubscriptionPhase;
