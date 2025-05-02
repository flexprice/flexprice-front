import { Button, Input, Select, SelectOption, Sheet, Spacer } from '@/components/atoms';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Country, State, City, IState } from 'country-state-city';
import { z } from 'zod';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { logger } from '@/utils/common/Logger';
import { User } from '@/models/User';
import { UserApi } from '@/api/UserApi';

interface UpdateTenantPayload {
	billing_details: {
		address: {
			address_line1: string;
			address_line2: string;
			address_city: string;
			address_state: string;
			address_postal_code: string;
			address_country: string;
		};
		email?: string;
		help_email?: string;
		phone?: string;
	};
}

interface Props {
	data?: User;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
}

const UpdateTenantDrawer: FC<Props> = ({ data, onOpenChange, open, trigger }) => {
	const [formData, setFormData] = useState<UpdateTenantPayload>({
		billing_details: {
			address: {
				address_line1: '',
				address_line2: '',
				address_city: '',
				address_state: '',
				address_postal_code: '',
				address_country: '',
			},
		},
	});
	const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
	const [internalOpen, setInternalOpen] = useState(false);
	const isControlled = open !== undefined && onOpenChange !== undefined;
	const [activeState, setActiveState] = useState<IState>();

	useEffect(() => {
		if (data?.tenant?.billing_details) {
			setFormData({
				billing_details: {
					...data.tenant.billing_details,
					address: {
						...data.tenant.billing_details.address,
					},
				},
			});
			if (data.tenant.billing_details.address.address_country && data.tenant.billing_details.address.address_state) {
				const stateObj = State.getStatesOfCountry(data.tenant.billing_details.address.address_country).find(
					(state) => state.name === data.tenant.billing_details.address.address_state,
				);
				if (stateObj) {
					setActiveState(stateObj);
				}
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
	const statesOptions: SelectOption[] = formData.billing_details.address.address_country
		? State.getStatesOfCountry(formData.billing_details.address.address_country).map(({ name, isoCode }) => ({
				label: name,
				value: isoCode,
			}))
		: [];

	const citiesOptions: SelectOption[] =
		formData.billing_details.address.address_country && activeState?.isoCode
			? City.getCitiesOfState(formData.billing_details.address.address_country, activeState.isoCode).map(({ name }) => ({
					label: name,
					value: name,
				}))
			: [];

	const tenantSchema = z.object({
		billing_details: z.object({
			address: z.object({
				address_line1: z.string().min(1, 'Address Line 1 is required'),
				address_line2: z.string().min(1, 'Address Line 2 is required'),
				address_city: z.string().min(1, 'City is required'),
				address_state: z.string().min(1, 'State is required'),
				address_postal_code: z.string().min(1, 'Postal Code is required'),
				address_country: z.string().min(1, 'Country is required'),
			}),
		}),
	});

	const validateForm = () => {
		const result = tenantSchema.safeParse(formData);
		if (!result.success) {
			const newErrors: Partial<Record<string, string>> = {};
			result.error.errors.forEach((error) => {
				const path = error.path.join('.');
				newErrors[path] = error.message;
			});
			setErrors(newErrors);
			return false;
		}
		setErrors({});
		return true;
	};

	const { mutate: updateTenant, isPending } = useMutation({
		mutationFn: async () => {
			if (!data?.tenant?.id) throw new Error('Tenant ID is required');
			return await UserApi.updateUser(formData);
		},
		onSuccess: async () => {
			await refetchQueries(['user']);
			toast.success('Tenant details updated successfully');
			toggleOpen();
		},
		onError: (error: ServerError) => {
			logger.error(error);
			toast.error(error.error.message || 'Failed to update tenant details. Please try again.');
		},
	});

	const handleSubmit = () => {
		if (validateForm()) {
			updateTenant();
		}
	};

	const handleChange = (path: string, value: string) => {
		setFormData((prev) => {
			const newData = { ...prev };
			const keys = path.split('.');
			let current: any = newData;
			for (let i = 0; i < keys.length - 1; i++) {
				if (!current[keys[i]]) {
					current[keys[i]] = {};
				}
				current = current[keys[i]];
			}
			current[keys[keys.length - 1]] = value;
			return newData;
		});
	};

	const isCtaDisabled = !formData.billing_details.address.address_line1;

	return (
		<div>
			<Sheet
				isOpen={currentOpen}
				onOpenChange={toggleOpen}
				title='Update Tenant Details'
				description='Update your billing address details.'
				trigger={trigger}>
				<div className='space-y-4'>
					<Spacer className='!h-4' />
					<div className='relative card !p-4'>
						<span className='absolute -top-4 left-2 text-[#18181B] text-sm bg-white font-medium px-2 py-1'>Billing Details</span>
						<div className='space-y-4'>
							<Select
								label='Country'
								placeholder='Select Country'
								options={countriesOptions}
								value={formData.billing_details.address.address_country}
								noOptionsText='No countries Available'
								onChange={(e) => {
									handleChange('billing_details.address.address_country', e);
									handleChange('billing_details.address.address_state', '');
									handleChange('billing_details.address.address_city', '');
									setActiveState(undefined);
								}}
								error={errors['billing_details.address.address_country']}
							/>
							<Input
								label='Address Line 1'
								placeholder='Street address, P.O. box, company name, c/o'
								value={formData.billing_details.address.address_line1}
								onChange={(e) => handleChange('billing_details.address.address_line1', e)}
								error={errors['billing_details.address.address_line1']}
							/>
							<Input
								label='Address Line 2'
								placeholder='Apartment, suite, unit, building, floor, etc.'
								value={formData.billing_details.address.address_line2}
								onChange={(e) => handleChange('billing_details.address.address_line2', e)}
								error={errors['billing_details.address.address_line2']}
							/>

							<div className='grid grid-cols-2 gap-4'>
								<Select
									label='State'
									placeholder='Select State'
									options={statesOptions}
									value={formData.billing_details.address.address_state}
									onChange={(e) => {
										handleChange('billing_details.address.address_state', e);
										handleChange('billing_details.address.address_city', '');
										const selectedState = e
											? State.getStateByCodeAndCountry(e, formData.billing_details.address.address_country)
											: undefined;
										setActiveState(selectedState || undefined);
									}}
									noOptionsText='No states Available'
									error={errors['billing_details.address.address_state']}
								/>
								<Select
									label='City'
									options={citiesOptions}
									value={formData.billing_details.address.address_city}
									placeholder='Select City'
									noOptionsText='No cities Available'
									onChange={(e) => handleChange('billing_details.address.address_city', e)}
									error={errors['billing_details.address.address_city']}
								/>
							</div>

							<Input
								label='Postal Code'
								placeholder='Enter Postal Code'
								value={formData.billing_details.address.address_postal_code}
								onChange={(e) => handleChange('billing_details.address.address_postal_code', e)}
								error={errors['billing_details.address.address_postal_code']}
							/>
						</div>
					</div>

					<Spacer className='!h-4' />
					<Button isLoading={isPending} disabled={isPending || isCtaDisabled} onClick={handleSubmit}>
						{isPending ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</Sheet>
		</div>
	);
};

export default UpdateTenantDrawer;
