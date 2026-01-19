import { Button, Input, Select, SelectOption, Sheet, Spacer } from '@/components/atoms';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CustomerApi from '@/api/CustomerApi';
import Customer from '@/models/Customer';
import { CreateCustomerRequest, UpdateCustomerRequest } from '@/types/dto/Customer';
import { Plus } from 'lucide-react';
import { Country, State, City, IState } from 'country-state-city';
import { z } from 'zod';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { logger } from '@/utils/common/Logger';
import { CustomerSearchSelect } from '@/components/molecules/Customer';

interface Props {
	data?: Customer;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
}

interface UIState {
	internalOpen: boolean;
	showBillingDetails: boolean;
	parentCustomer: Customer | undefined;
	activeState: IState | undefined;
}

const CreateCustomerDrawer: FC<Props> = ({ data, onOpenChange, open, trigger }) => {
	const isEdit = !!data;
	const isControlled = open !== undefined && onOpenChange !== undefined;

	const [formData, setFormData] = useState<Partial<CreateCustomerRequest>>(data || {});
	const [errors, setErrors] = useState<Partial<Record<keyof CreateCustomerRequest, string>>>({});
	const [uiState, setUiState] = useState<UIState>({
		internalOpen: false,
		showBillingDetails: false,
		parentCustomer: undefined,
		activeState: undefined,
	});

	const handleChange = (name: keyof typeof formData, value: string | undefined) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const updateUIState = (updates: Partial<UIState>) => {
		setUiState((prev) => ({ ...prev, ...updates }));
	};

	useEffect(() => {
		if (!data) {
			setFormData({});
			updateUIState({
				parentCustomer: undefined,
				showBillingDetails: false,
				activeState: undefined,
			});
			return;
		}

		setFormData(data);
		updateUIState({ showBillingDetails: true });

		// Handle state selection
		if (data.address_country && data.address_state) {
			const stateObj = State.getStatesOfCountry(data.address_country).find((state) => state.name === data.address_state);
			if (stateObj) {
				updateUIState({ activeState: stateObj });
				setFormData((prev) => ({ ...prev, address_state: stateObj.isoCode }));
			}
		} else {
			updateUIState({ activeState: undefined });
			setFormData((prev) => ({ ...prev, address_state: undefined, address_city: undefined }));
		}

		// Handle parent customer
		updateUIState({
			parentCustomer: data.parent_customer,
		});
	}, [data]);

	const currentOpen = isControlled ? open : uiState.internalOpen;
	const toggleOpen = (open?: boolean) => {
		if (isControlled) {
			onOpenChange?.(open ?? false);
		} else {
			updateUIState({ internalOpen: !uiState.internalOpen });
		}
	};

	const countriesOptions: SelectOption[] = Country.getAllCountries().map(({ name, isoCode }) => ({ label: name, value: isoCode }));
	const statesOptions: SelectOption[] = formData.address_country
		? State.getStatesOfCountry(formData.address_country).map(({ name, isoCode }) => ({
				label: name,
				value: isoCode,
			}))
		: [];

	const citiesOptions: SelectOption[] =
		formData.address_country && uiState.activeState?.isoCode
			? City.getCitiesOfState(formData.address_country, uiState.activeState.isoCode).map(({ name }) => ({
					label: name,
					value: name,
				}))
			: [];

	useEffect(() => {
		if (!isEdit) {
			setFormData((prev) => ({ ...prev, external_id: `cust-${prev.name?.toLowerCase().replace(/\s/g, '-') || ''}` }));
		}
	}, [formData.name, isEdit]);

	// Updated validation schema to match backend requirements
	const customerSchema = z
		.object({
			external_id: z.string().nonempty('External ID is required'),
			name: z.string().nonempty('Customer Name is required'),
			email: z.string().email('Invalid email address').optional().or(z.literal('')),
			address_line1: z.string().max(255, 'Address Line 1 must be less than 255 characters').optional().or(z.literal('')),
			address_line2: z.string().max(255, 'Address Line 2 must be less than 255 characters').optional().or(z.literal('')),
			address_city: z.string().max(100, 'City name must be less than 100 characters').optional().or(z.literal('')),
			address_state: z.string().max(100, 'State name must be less than 100 characters').optional().or(z.literal('')),
			address_postal_code: z.string().max(20, 'Postal code must be less than 20 characters').optional().or(z.literal('')),
			address_country: z.string().length(2, 'Country code must be exactly 2 characters').optional().or(z.literal('')),
		})
		.refine(
			(data) => {
				// If any address field is filled, require country and state
				const hasAddressFields = data.address_line1 || data.address_line2 || data.address_city || data.address_postal_code;
				if (hasAddressFields) {
					if (!data.address_country) return false;
					if (!data.address_state) return false;
				}
				return true;
			},
			{
				message: 'Country and State are required when address fields are provided',
				path: ['address_country'],
			},
		);

	const validateForm = () => {
		const result = customerSchema.safeParse(formData);
		if (!result.success) {
			const newErrors: Partial<Record<keyof CreateCustomerRequest, string>> = {};
			result.error.errors.forEach((error) => {
				const field = error.path[0] as keyof CreateCustomerRequest;
				newErrors[field] = error.message;
			});
			setErrors(newErrors);
			return false;
		}

		setErrors({});
		return true;
	};

	// Helper to build customer payload
	const buildCustomerPayload = () => {
		const basePayload = {
			external_id: formData.external_id,
			name: formData.name,
			email: formData.email || undefined,
			address_line1: formData.address_line1 || undefined,
			address_line2: formData.address_line2 || undefined,
			address_city: formData.address_city || undefined,
			address_state: uiState.activeState?.name || undefined,
			address_postal_code: formData.address_postal_code || undefined,
			address_country: formData.address_country || undefined,
			parent_customer_id: formData.parent_customer_id,
			parent_customer_external_id: formData.parent_customer_external_id,
		};

		// Remove undefined values
		return Object.fromEntries(Object.entries(basePayload).filter(([_, value]) => value !== undefined));
	};

	const { mutate: createCustomer, isPending } = useMutation({
		mutationFn: async () => {
			const payload = buildCustomerPayload();

			if (isEdit && data?.id) {
				return await CustomerApi.updateCustomer(payload as UpdateCustomerRequest, data.id);
			}

			return await CustomerApi.createCustomer({
				...payload,
				external_id: formData.external_id!,
				name: formData.name!,
				email: formData.email || '',
			} as CreateCustomerRequest);
		},

		onSuccess: async () => {
			if (isEdit && data?.id) {
				await refetchQueries(['fetchCustomerDetails', data.id]);
				toast.success('Customer updated successfully');
			} else {
				await refetchQueries(['fetchCustomers']);
				toast.success('Customer added successfully');
				setFormData({});
			}

			await Promise.all([refetchQueries(['debug-customers']), refetchQueries(['debug-subscriptions'])]);
			toggleOpen();
		},
		onError: (error: ServerError) => {
			logger.error(error);
			toast.error(error.error.message || 'Failed to add customer. Please try again.');
		},
	});

	const handleSubmit = () => {
		if (validateForm()) {
			createCustomer();
		}
	};

	const isCtaDisabled = !formData.name || !formData.external_id;

	return (
		<div>
			<Sheet
				isOpen={currentOpen}
				size='lg'
				onOpenChange={toggleOpen}
				title={data ? 'Edit Customer' : 'Add Customer'}
				description={
					data ? 'Enter customer details to update the account.' : 'Enter customer details to create a new account in the system.'
				}
				trigger={trigger}>
				<div className='space-y-8 mt-4'>
					<div className='relative card !p-4 !mb-6'>
						<span className='absolute -top-4 left-2 text-[#18181B] text-sm bg-white font-medium px-2 py-1'>Customer Details</span>
						<div className='space-y-4'>
							<Input
								label='Name'
								placeholder='Enter Name'
								value={formData.name || ''}
								onChange={(e) => handleChange('name', e)}
								error={errors.name}
							/>
							<Input
								label='External ID'
								placeholder='customer-'
								value={formData.external_id || ''}
								onChange={(e) => handleChange('external_id', e)}
								error={errors.external_id}
								disabled={isEdit}
							/>
							<Input
								label='Email (Optional)'
								placeholder='e.g. example@gmail.com'
								type='email'
								value={formData.email || ''}
								onChange={(e) => handleChange('email', e)}
								error={errors.email}
							/>
						</div>
					</div>

					{!uiState.showBillingDetails && (
						<Button variant='outline' onClick={() => updateUIState({ showBillingDetails: true })}>
							<Plus /> Add Billing Detail
						</Button>
					)}

					{uiState.showBillingDetails && (
						<div className='relative card !p-4'>
							<span className='absolute -top-4 left-2 text-[#18181B] text-sm bg-white font-medium px-2 py-1'>Billing Details</span>
							<div className='space-y-4'>
								<Select
									label='Country'
									placeholder='Select Country'
									options={countriesOptions}
									value={formData.address_country}
									noOptionsText='No countries Available'
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											address_country: e,
											address_city: '',
											address_state: '',
											address_postal_code: '',
										}));
										updateUIState({ activeState: undefined });
									}}
								/>
								<Input
									label='Address Line 1'
									placeholder='Address Line 1'
									value={formData.address_line1 || ''}
									onChange={(e) => handleChange('address_line1', e)}
									error={errors.address_line1}
									maxLength={255}
								/>
								<Input
									label='Address Line 2'
									placeholder='Address Line 2'
									value={formData.address_line2 || ''}
									onChange={(e) => handleChange('address_line2', e)}
									error={errors.address_line2}
									maxLength={255}
								/>

								<div className='grid grid-cols-2 gap-4'>
									<Select
										label='State'
										placeholder='Select State'
										options={statesOptions}
										value={formData.address_state}
										onChange={(e) => {
											setFormData({
												...formData,
												address_city: '',
												address_state: e,
											});
											const selectedState = e ? State.getStateByCodeAndCountry(e, formData.address_country || '') : undefined;
											updateUIState({ activeState: selectedState || undefined });
										}}
										noOptionsText='No states Available'
									/>
									<Select
										label='City'
										options={citiesOptions}
										value={formData.address_city || undefined}
										placeholder='Select City'
										noOptionsText='No cities Available'
										onChange={(e) => handleChange('address_city', e)}
									/>
								</div>

								<Input
									label='Postal Code'
									placeholder='Enter Postal Code'
									value={formData.address_postal_code || ''}
									onChange={(e) => handleChange('address_postal_code', e)}
									error={errors.address_postal_code}
									maxLength={20}
								/>
							</div>
						</div>
					)}

					{isEdit && (
						<div className='relative card !p-4'>
							<span className='absolute -top-4 left-2 text-[#18181B] text-sm bg-white font-medium px-2 py-1'>Invoice Config</span>
							<div className='space-y-4'>
								<CustomerSearchSelect
									value={uiState.parentCustomer}
									excludeId={data?.id}
									onChange={(customer) => {
										// Guard against self-referential parent selection
										const currentCustomerId = data?.id;
										if (customer && customer.id === currentCustomerId) {
											return;
										}
										updateUIState({ parentCustomer: customer || undefined });
										setFormData((prev) => ({
											...prev,
											parent_customer_id: customer?.id,
											parent_customer_external_id: undefined,
										}));
									}}
									display={{
										label: 'Parent Customer',
										placeholder: 'Select parent customer',
									}}
									searchPlaceholder='Search for parent customer...'
								/>
							</div>
						</div>
					)}

					<Spacer className='!h-4' />
					<Button isLoading={isPending} disabled={isPending || isCtaDisabled} onClick={handleSubmit}>
						{isPending ? 'Saving...' : 'Save'}
					</Button>
				</div>
			</Sheet>
		</div>
	);
};

export default CreateCustomerDrawer;
