import { Button, Input, Select, SelectOption, Sheet, Spacer } from '@/components/atoms';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CustomerApi from '@/utils/api_requests/CustomerApi';
import Customer from '@/models/Customer';
import { Plus } from 'lucide-react';
import { Country, State, City, IState } from 'country-state-city';
import { z } from 'zod';
import { refetchQueries } from '@/core/tanstack/ReactQueryProvider';
import { logger } from '@/utils/common/Logger';

interface Props {
	data?: Customer;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
}

const CreateCustomerDrawer: FC<Props> = ({ data, onOpenChange, open, trigger }) => {
	const [formData, setFormData] = useState<Partial<Customer>>(data || {});
	const isEdit = !!data;
	const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({});
	const [internalOpen, setInternalOpen] = useState(false);
	const isControlled = open !== undefined && onOpenChange !== undefined;
	const [showBillingDetails, setShowBillingDetails] = useState(false);

	const handleChange = (name: keyof typeof formData, value: string | undefined) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const [activeState, setactiveState] = useState<IState>();

	useEffect(() => {
		setFormData(data || {});
		if (data) {
			setShowBillingDetails(true);
			if (data.address_country && data.address_state) {
				const stateObj = State.getStatesOfCountry(data.address_country).find((state) => state.name === data.address_state);
				if (stateObj) {
					setactiveState(stateObj);
					setFormData((prev) => ({ ...prev, address_state: stateObj.isoCode }));
				}
			} else {
				setactiveState(undefined);
				setFormData((prev) => ({ ...prev, address_state: undefined, address_city: undefined }));
			}
		}
	}, [data]);

	const currentOpen = isControlled ? open : internalOpen;
	const toggleOpen = (open?: boolean) => {
		if (isControlled) {
			onOpenChange?.(open ?? false);
		} else {
			setInternalOpen((prev) => !prev);
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
		formData.address_country && activeState?.isoCode
			? City.getCitiesOfState(formData.address_country, activeState.isoCode).map(({ name }) => ({
					label: name,
					value: name,
				}))
			: [];

	// const timezoneOptions: SelectOption[] = formData.address_country
	// 	? Country.getCountryByCode(formData.address_country)?.timezones?.map(({ zoneName, abbreviation }) => ({
	// 		label: zoneName,
	// 		value: abbreviation,
	// 	})) || []
	// 	: [];

	// const phoneCode = formData.address_country ? Country.getCountryByCode(formData.address_country)?.phonecode : '+91';

	useEffect(() => {
		if (!isEdit) {
			setFormData((prev) => ({ ...prev, external_id: `cust-${prev.name?.toLowerCase().replace(/\s/g, '-') || ''}` }));
		}
	}, [formData.name, isEdit]);

	const customerSchema = z
		.object({
			external_id: z.string().nonempty('Customer Slug is required'),
			email: z.union([z.string().email('Invalid email address'), z.string().length(0)]).optional(),
			name: z.string().nonempty('Customer Name is required'),
			address_country: z.union([z.string().min(1, 'Country cannot be empty if provided'), z.string().length(0)]).optional(),
			address_state: z.union([z.string().min(1, 'State cannot be empty if provided'), z.string().length(0)]).optional(),
			address_city: z.union([z.string().min(1, 'City cannot be empty if provided'), z.string().length(0)]).optional(),
			address_line1: z.union([z.string().min(1, 'Address Line 1 cannot be empty if provided'), z.string().length(0)]).optional(),
			address_line2: z.union([z.string().min(1, 'Address Line 2 cannot be empty if provided'), z.string().length(0)]).optional(),
			phone: z.union([z.string().min(1, 'Phone cannot be empty if provided'), z.string().length(0)]).optional(),
			timezone: z.union([z.string().min(1, 'Timezone cannot be empty if provided'), z.string().length(0)]).optional(),
		})
		.refine(
			(data) => {
				// If any address field is filled, require country and state
				const hasAddressFields = data.address_line1 || data.address_line2 || data.address_city;
				if (hasAddressFields) {
					if (!data.address_country) return false;
					if (!data.address_state) return false;
				}
				return true;
			},
			{
				message: 'Country and State are required when address fields are provided',
				path: ['address_country'], // This will show the error under the country field
			},
		);

	const validateForm = () => {
		const result = customerSchema.safeParse(formData);
		if (!result.success) {
			const newErrors: Partial<Record<keyof Customer, string>> = {};
			result.error.errors.forEach((error) => {
				const field = error.path[0] as keyof Customer;
				newErrors[field] = error.message;
			});
			setErrors(newErrors);
			return false;
		}
		setErrors({});
		return true;
	};

	const { mutate: createCustomer, isPending } = useMutation({
		mutationFn: async () => {
			if (data) {
				const updatedData = {
					email: formData.email || undefined,
					name: formData.name || undefined,
					address_city: formData.address_city || '',
					address_country: formData.address_country || '',
					address_line1: formData.address_line1 || undefined,
					address_line2: formData.address_line2 || undefined,
					address_state: activeState?.name || '',
					phone: formData.phone || undefined,
					timezone: formData.timezone || undefined,
				};

				return await CustomerApi.updateCustomer(updatedData as Customer, data.id);
			} else {
				return await CustomerApi.createCustomer({
					email: formData.email!,
					name: formData.name,
					external_id: formData.external_id!,
					address_city: formData.address_city,
					address_country: formData.address_country || undefined,
					address_state: activeState?.name || undefined,
					address_line1: formData.address_line1 || undefined,
					address_line2: formData.address_line2 || undefined,
					phone: formData.phone || undefined,
					timezone: formData.timezone || undefined,
				});
			}
		},

		onSuccess: async () => {
			if (data) {
				await refetchQueries(['fetchCustomerDetails', formData?.id || '']);
			} else {
				await refetchQueries(['fetchCustomers']);
				setFormData({});
			}

			// if (!details) {
			// 	toast.error('Error adding customer');
			// } else
			if (data) {
				toast.success('Customer updated successfully');
			} else {
				toast.success('Customer added successfully');
			}

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
				onOpenChange={toggleOpen}
				title={data ? 'Edit Customer' : 'Add Customer'}
				description={
					data ? 'Enter customer details to update the account.' : 'Enter customer details to create a new account in the system.'
				}
				trigger={trigger}>
				<div className='space-y-4'>
					<Spacer className='!h-4' />
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
								label='Lookup Key'
								placeholder='customer-'
								value={formData.external_id || ''}
								onChange={(e) => handleChange('external_id', e)}
								error={errors.external_id}
								disabled={isEdit}
							/>
							<Input
								label='Email (Optional)'
								placeholder='e.g. kaavya@gmail.com'
								type='email'
								value={formData.email || ''}
								onChange={(e) => handleChange('email', e)}
								error={errors.email}
							/>
						</div>
					</div>

					{!showBillingDetails && (
						<Button variant='outline' onClick={() => setShowBillingDetails(true)}>
							<Plus /> Add Billing Detail
						</Button>
					)}

					{showBillingDetails && (
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
											timezone: undefined,
											address_city: '',
											address_state: '',
										}));
										setactiveState(undefined);
									}}
								/>
								<Input
									label='Address Line 1'
									placeholder='Address Line 1'
									value={formData.address_line1 || ''}
									onChange={(e) => handleChange('address_line1', e)}
									error={errors.address_line1}
								/>
								<Input
									label='Address Line 2'
									placeholder='Address Line 2'
									value={formData.address_line2 || ''}
									onChange={(e) => handleChange('address_line2', e)}
									error={errors.address_line2}
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
												timezone: undefined,
												address_city: '',
												address_state: e,
											});
											const selectedState = e ? State.getStateByCodeAndCountry(e, formData.address_country || '') : undefined;
											setactiveState(selectedState || undefined);
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

								{/* <Input
									label='Phone'
									type='number'
									placeholder='Enter Phone Number'
									value={formData.phone || ''}
									inputPrefix={phoneCode || '+91-'}
									onChange={(e) => handleChange('phone', e)}
									error={errors.phone}
								/>
								<Select
									label='Timezone'
									placeholder='Select Timezone'
									options={timezoneOptions}
									value={formData.timezone}
									noOptionsText='No timezones Available'
									onChange={(e) => handleChange('timezone', e)}
								/> */}
							</div>
						</div>
					)}

					<Spacer className='!h-4' />
					<Button isLoading={isPending} disabled={isPending || isCtaDisabled} onClick={handleSubmit}>
						{isPending ? 'Saving...' : 'Save Customer'}
					</Button>
				</div>
			</Sheet>
		</div>
	);
};

export default CreateCustomerDrawer;
