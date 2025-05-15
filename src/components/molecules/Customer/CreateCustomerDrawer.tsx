import { Button, Input, Select, SelectOption, Sheet, Spacer } from '@/components/atoms';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CustomerApi from '@/api/CustomerApi';
import Customer from '@/models/Customer';
import { Plus, LinkIcon } from 'lucide-react';
import { Country, State, City, IState } from 'country-state-city';
import { z } from 'zod';
import { invalidateQueries, refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { logger } from '@/utils/common/Logger';
import { useUser } from '@/hooks/UserContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Props {
	data?: Customer;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
}

// Type for stored connections
interface StoredConnection {
	id: string;
	provider: string;
	name: string;
	code: string;
	apiKey: string;
}

// Helper to get storage key
const getStorageKey = (userId: string) => `connections_${userId}`;

// Helper to mask sensitive information
function maskCode(code: string) {
	if (!code) return '********';
	if (code.length <= 8) return '*'.repeat(code.length);
	return code.slice(0, 4) + '*'.repeat(4) + code.slice(-4);
}

const CreateCustomerDrawer: FC<Props> = ({ data, onOpenChange, open, trigger }) => {
	const [formData, setFormData] = useState<Partial<Customer>>(data || {});
	const isEdit = !!data;
	const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({});
	const [internalOpen, setInternalOpen] = useState(false);
	const isControlled = open !== undefined && onOpenChange !== undefined;
	const [showBillingDetails, setShowBillingDetails] = useState(false);

	// Connection linking
	const [linkConnection, setLinkConnection] = useState(false);
	const [selectedConnection, setSelectedConnection] = useState<string>('');
	const [availableConnections, setAvailableConnections] = useState<StoredConnection[]>([]);
	const { user } = useUser();

	// Load available connections from localStorage
	useEffect(() => {
		if (!user?.id) return;
		const key = getStorageKey(user.id);
		const allConnections = JSON.parse(localStorage.getItem(key) || '[]');
		// Filter only Stripe connections
		const stripeConnections = allConnections.filter((c: StoredConnection) => c.provider === 'stripe');
		setAvailableConnections(stripeConnections);
	}, [user]);

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

	// Connection options for the dropdown
	const connectionOptions: SelectOption[] = availableConnections.map((connection) => ({
		label: `${connection.name} (${maskCode(connection.code)})`,
		value: connection.id,
	}));

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

		// Custom validation for connection
		if (linkConnection && !selectedConnection) {
			setErrors((prev) => ({ ...prev, connection: 'Please select a connection' }));
			return false;
		}

		setErrors({});
		return true;
	};

	const { mutate: createCustomer, isPending } = useMutation({
		mutationFn: async () => {
			// Get connection details if linked
			const connectionData = linkConnection && selectedConnection ? availableConnections.find((c) => c.id === selectedConnection) : null;

			// Mock payload structure with connection
			const payload = {
				customer: {
					...(data
						? {
								email: formData.email || undefined,
								name: formData.name || undefined,
								address_city: formData.address_city || '',
								address_country: formData.address_country || '',
								address_line1: formData.address_line1 || undefined,
								address_line2: formData.address_line2 || undefined,
								address_state: activeState?.name || '',
								phone: formData.phone || undefined,
								timezone: formData.timezone || undefined,
							}
						: {
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
							}),
				},
				connection: connectionData
					? {
							provider: 'stripe',
							connection_id: connectionData.id,
							connection_name: connectionData.name,
						}
					: undefined,
			};

			console.log('Customer payload with connection:', payload);

			// Keep the original API calls for now
			if (data) {
				return await CustomerApi.updateCustomer(payload.customer as Customer, data.id);
			} else {
				return await CustomerApi.createCustomer(payload.customer as any);
			}
		},

		onSuccess: async () => {
			if (data) {
				invalidateQueries(['debug-customers', 'debug-subscriptions']);
				await refetchQueries(['fetchCustomerDetails', formData?.id || '']);
			} else {
				await refetchQueries(['fetchCustomers']);
				setFormData({});
			}

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

	const isCtaDisabled = !formData.name || !formData.external_id || (linkConnection && !selectedConnection);

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

					{/* Payment integration section */}
					<div className='relative card !p-4 !mb-6'>
						<span className='absolute -top-4 left-2 text-[#18181B] text-sm bg-white font-medium px-2 py-1'>Payment Integration</span>
						<div className='space-y-4'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center space-x-2'>
									<LinkIcon className='h-4 w-4 text-muted-foreground' />
									<Label htmlFor='link-payment' className='text-sm font-medium'>
										Link Stripe Payment Account
									</Label>
								</div>
								<Switch id='link-payment' checked={linkConnection} onCheckedChange={setLinkConnection} />
							</div>

							{linkConnection && (
								<div className='space-y-2'>
									{availableConnections.length === 0 ? (
										<div className='text-sm text-amber-600 p-2 bg-amber-50 rounded-md'>
											No Stripe connections available. Please add a connection in the Integrations section first.
										</div>
									) : (
										<Select
											label='Select Stripe Connection'
											placeholder='Choose a payment connection'
											options={connectionOptions}
											value={selectedConnection}
											onChange={setSelectedConnection}
											description='This will link the customer to your Stripe account'
										/>
									)}
								</div>
							)}
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
