import { Button, Input, Label, Select, SelectOption } from '@/components/atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CREDIT_GRANT_EXPIRATION_TYPE, CREDIT_GRANT_PERIOD, CreditGrant } from '@/models/CreditGrant';
import { useCallback, useMemo, useState } from 'react';
import RectangleRadiogroup, { RectangleRadiogroupOption } from '../RectangleRadiogroup';
import { BILLING_CADENCE } from '@/models/Invoice';
import { creditGrantPeriodOptions } from '@/constants/constants';

interface Props {
	data?: CreditGrant;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSave: (data: CreditGrant) => void;
	onCancel: () => void;
	getEmptyCreditGrant: () => Partial<CreditGrant>;
}

interface FormErrors {
	name?: string;
	credits?: string;
	expiration_duration?: string;
	priority?: string;
	expiration_type?: string;
	period?: string;
}

const expirationTypeOptions: SelectOption[] = [
	{
		label: 'Expires in some days',
		value: CREDIT_GRANT_EXPIRATION_TYPE.DURATION,
		description: 'Any unused credits disappear after some days.',
	},
	{
		label: 'Expires with subscription period',
		value: CREDIT_GRANT_EXPIRATION_TYPE.BILLING_CYCLE,
		description: 'Unused credits reset at the end of each subscription period (matches the billing schedule).',
	},
	{
		label: 'No Expiry',
		value: CREDIT_GRANT_EXPIRATION_TYPE.NEVER,
		description: 'Credits stay available until they are completely used - no time limit.',
	},
];

const CreditGrantModal: React.FC<Props> = ({ data, isOpen, onOpenChange, onSave, onCancel, getEmptyCreditGrant }) => {
	const isEdit = !!data;

	const [errors, setErrors] = useState<FormErrors>({});
	const [formData, setFormData] = useState<Partial<CreditGrant>>(data || getEmptyCreditGrant());

	// Sanitize and validate data before saving
	const sanitizeData = useCallback((data: Partial<CreditGrant>): CreditGrant => {
		let sanitized = {
			...data,
			// Trim and sanitize string fields
			name: data.name?.trim() || '',
			// Ensure credits is a positive number
			credits: Math.max(0, Number(data.credits) || 0),
			// Ensure priority is a non-negative integer
			priority: Math.max(0, Math.floor(Number(data.priority) || 0)),
			// Sanitize expiration_duration if present
			expiration_duration: data.expiration_duration ? Math.max(1, Math.floor(Number(data.expiration_duration))) : undefined,
		} as CreditGrant;

		// Remove expiration_duration if not needed
		if (sanitized.expiration_type !== CREDIT_GRANT_EXPIRATION_TYPE.DURATION) {
			const { expiration_duration, ...rest } = sanitized;
			sanitized = rest as CreditGrant;
		}

		// Remove period if not recurring
		if (sanitized.cadence !== BILLING_CADENCE.RECURRING) {
			const { period, ...rest } = sanitized;
			sanitized = rest as CreditGrant;
		}

		return sanitized;
	}, []);

	const validateForm = useCallback((): { isValid: boolean; errors: FormErrors } => {
		const newErrors: FormErrors = {};

		// Validate name
		if (!formData.name?.trim()) {
			newErrors.name = 'Name is required';
		}

		// Validate credits
		const credits = Number(formData.credits);
		if (!formData.credits || isNaN(credits) || credits <= 0) {
			newErrors.credits = 'Credits must be a positive number';
		}

		// Validate expiration type
		if (!formData.expiration_type) {
			newErrors.expiration_type = 'Expiration type is required';
		}

		// Validate expiration duration (only when expiration type is DURATION)
		if (formData.expiration_type === CREDIT_GRANT_EXPIRATION_TYPE.DURATION) {
			const duration = Number(formData.expiration_duration);
			if (!formData.expiration_duration || isNaN(duration) || duration <= 0) {
				newErrors.expiration_duration = 'Expiration duration must be a positive number';
			}
		}

		// Validate period (only for recurring credits)
		if (formData.cadence === BILLING_CADENCE.RECURRING && !formData.period) {
			newErrors.period = 'Grant period is required for recurring credits';
		}

		// Validate priority
		const priority = Number(formData.priority);
		if (formData.priority !== undefined && formData.priority !== null && (isNaN(priority) || priority < 0)) {
			newErrors.priority = 'Priority must be a non-negative number';
		}

		return {
			isValid: Object.keys(newErrors).length === 0,
			errors: newErrors,
		};
	}, [formData]);

	const handleSave = useCallback(() => {
		const validation = validateForm();

		if (!validation.isValid) {
			setErrors(validation.errors);
			return;
		}

		// Clear errors and sanitize data before saving
		setErrors({});
		const sanitizedData = sanitizeData(formData);

		onSave(sanitizedData);
		setFormData(getEmptyCreditGrant());
		onOpenChange(false);
	}, [formData, validateForm, sanitizeData, onSave, getEmptyCreditGrant, onOpenChange]);

	const handleCancel = useCallback(() => {
		setFormData(data || getEmptyCreditGrant());
		setErrors({});
		onCancel();
	}, [data, getEmptyCreditGrant, onCancel]);

	const handleFieldChange = useCallback(
		(field: keyof CreditGrant, value: any) => {
			setFormData((prev) => ({ ...prev, [field]: value }));
			// Clear error for this field when user starts typing
			if (errors[field as keyof FormErrors]) {
				setErrors((prev) => ({ ...prev, [field]: undefined }));
			}
		},
		[errors],
	);

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

	const selectedCadenceDescription = useMemo(() => {
		return billingCadenceOptions.find((option) => option.value === formData.cadence)?.description;
	}, [billingCadenceOptions, formData.cadence]);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className='bg-white sm:max-w-[600px]'>
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
							onChange={(value) => handleFieldChange('cadence', value as BILLING_CADENCE)}
						/>
						{selectedCadenceDescription && <p className='text-sm text-gray-500'>{selectedCadenceDescription}</p>}
					</div>

					<div className='space-y-2'>
						<Label label='Credit Name' />
						<Input
							placeholder='e.g. Welcome Credits'
							value={formData.name || ''}
							onChange={(value) => handleFieldChange('name', value)}
							error={errors.name}
						/>
					</div>

					<div className='space-y-2'>
						<Label label='Credits' />
						<Input
							error={errors.credits}
							placeholder='e.g. 1000'
							variant='formatted-number'
							formatOptions={{
								allowDecimals: true,
								allowNegative: false,
								decimalSeparator: '.',
								thousandSeparator: ',',
							}}
							value={formData.credits?.toString() || ''}
							onChange={(value) => handleFieldChange('credits', value)}
						/>
					</div>

					{formData.cadence === BILLING_CADENCE.RECURRING && (
						<div className='space-y-2'>
							<Label label='Grant Period' />
							<Select
								error={errors.period}
								options={creditGrantPeriodOptions}
								value={formData.period}
								onChange={(value) => handleFieldChange('period', value as CREDIT_GRANT_PERIOD)}
							/>
						</div>
					)}

					<div className='space-y-2'>
						<Label label='Expiry Type' />
						<Select
							error={errors.expiration_type}
							options={expirationTypeOptions}
							value={formData.expiration_type}
							onChange={(value) => handleFieldChange('expiration_type', value as CREDIT_GRANT_EXPIRATION_TYPE)}
						/>
					</div>

					{formData.expiration_type === CREDIT_GRANT_EXPIRATION_TYPE.DURATION && (
						<div className='space-y-2'>
							<Label label='Expiry (days)' />
							<Input
								error={errors.expiration_duration}
								placeholder='e.g. 30'
								variant='formatted-number'
								formatOptions={{
									allowDecimals: false,
									allowNegative: false,
									decimalSeparator: '.',
									thousandSeparator: ',',
								}}
								suffix='days'
								value={formData.expiration_duration?.toString() || ''}
								onChange={(value) => handleFieldChange('expiration_duration', parseInt(value) || undefined)}
							/>
						</div>
					)}

					<div className='space-y-2'>
						<Label label='Priority' />
						<Input
							error={errors.priority}
							placeholder='e.g. 0'
							variant='formatted-number'
							formatOptions={{
								allowDecimals: false,
								allowNegative: false,
								decimalSeparator: '.',
								thousandSeparator: ',',
							}}
							value={formData.priority?.toString() || ''}
							onChange={(value) => handleFieldChange('priority', parseInt(value) || 0)}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={handleCancel}>
						Cancel
					</Button>
					<Button onClick={handleSave}>{isEdit ? 'Save Changes' : 'Add Credit'}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CreditGrantModal;
