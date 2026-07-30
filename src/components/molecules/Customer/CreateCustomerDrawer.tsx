import { Button, Input, Select, SelectOption, Sheet, Spacer } from '@/components/atoms';
import { FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

interface Props {
	data?: Customer;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
}

interface UIState {
	internalOpen: boolean;
	showBillingDetails: boolean;
	activeState: IState | undefined;
}

const CreateCustomerDrawer: FC<Props> = ({ data, onOpenChange, open, trigger }) => {
	const { t } = useTranslation('customers');
	const isEdit = !!data;
	const isControlled = open !== undefined && onOpenChange !== undefined;

	const [formData, setFormData] = useState<Partial<CreateCustomerRequest>>(data || {});
	const [errors, setErrors] = useState<Partial<Record<keyof CreateCustomerRequest, string>>>({});
	const [uiState, setUiState] = useState<UIState>({
		internalOpen: false,
		showBillingDetails: false,
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

	const customerSchema = useMemo(
		() =>
			z
				.object({
					external_id: z.string().nonempty(t('form.validation.externalIdRequired')),
					name: z.string().nonempty(t('form.validation.nameRequired')),
					email: z.string().email(t('form.validation.invalidEmail')).optional().or(z.literal('')),
					address_line1: z.string().max(255, t('form.validation.addressLine1Max')).optional().or(z.literal('')),
					address_line2: z.string().max(255, t('form.validation.addressLine2Max')).optional().or(z.literal('')),
					address_city: z.string().max(100, t('form.validation.cityMax')).optional().or(z.literal('')),
					address_state: z.string().max(100, t('form.validation.stateMax')).optional().or(z.literal('')),
					address_postal_code: z.string().max(20, t('form.validation.postalCodeMax')).optional().or(z.literal('')),
					address_country: z.string().length(2, t('form.validation.countryLength')).optional().or(z.literal('')),
				})
				.refine(
					(form) => {
						const hasAddressFields = form.address_line1 || form.address_line2 || form.address_city || form.address_postal_code;
						if (hasAddressFields) {
							if (!form.address_country) return false;
							if (!form.address_state) return false;
						}
						return true;
					},
					{
						message: t('form.validation.addressCountryStateRequired'),
						path: ['address_country'],
					},
				),
		[t],
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
				toast.success(t('form.toast.updated'));
			} else {
				await refetchQueries(['fetchCustomers']);
				toast.success(t('form.toast.created'));
				setFormData({});
			}

			await Promise.all([refetchQueries(['debug-customers']), refetchQueries(['debug-subscriptions'])]);
			toggleOpen();
		},
		onError: (error: Error) => {
			logger.error(error);
			toast.error(error.message || t('form.validation.failedToSave'));
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
				title={data ? t('form.drawer.editCustomer') : t('form.drawer.addCustomer')}
				description={data ? t('form.drawer.editDescription') : t('form.drawer.createDescription')}
				trigger={trigger}>
				<div className='space-y-8 mt-4'>
					<div className='relative card !p-4 !mb-6'>
						<span className='absolute -top-4 left-2 text-[#18181B] text-sm bg-white font-medium px-2 py-1'>
							{t('form.drawer.detailsSectionBadge')}
						</span>
						<div className='space-y-4'>
							<Input
								label={t('form.drawer.nameLabel')}
								placeholder={t('form.drawer.namePlaceholder')}
								value={formData.name || ''}
								onChange={(e) => handleChange('name', e)}
								error={errors.name}
							/>
							<Input
								label={t('form.drawer.externalIdLabel')}
								placeholder={t('form.drawer.externalIdPlaceholder')}
								value={formData.external_id || ''}
								onChange={(e) => handleChange('external_id', e)}
								error={errors.external_id}
								disabled={isEdit}
							/>
							<Input
								label={t('form.drawer.emailOptionalLabel')}
								placeholder={t('form.drawer.emailPlaceholder')}
								type='email'
								value={formData.email || ''}
								onChange={(e) => handleChange('email', e)}
								error={errors.email}
							/>
						</div>
					</div>

					{!uiState.showBillingDetails && (
						<Button variant='outline' onClick={() => updateUIState({ showBillingDetails: true })}>
							<Plus /> {t('form.drawer.addBillingDetail')}
						</Button>
					)}

					{uiState.showBillingDetails && (
						<div className='relative card !p-4'>
							<span className='absolute -top-4 left-2 text-[#18181B] text-sm bg-white font-medium px-2 py-1'>
								{t('form.drawer.billingSectionBadge')}
							</span>
							<div className='space-y-4'>
								<Select
									label={t('form.billingFields.country')}
									placeholder={t('form.billingFields.selectCountry')}
									options={countriesOptions}
									value={formData.address_country}
									noOptionsText={t('form.billingFields.noCountries')}
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
									label={t('form.billingFields.addressLine1')}
									placeholder={t('form.billingFields.addressLine1Placeholder')}
									value={formData.address_line1 || ''}
									onChange={(e) => handleChange('address_line1', e)}
									error={errors.address_line1}
									maxLength={255}
								/>
								<Input
									label={t('form.billingFields.addressLine2')}
									placeholder={t('form.billingFields.addressLine2Placeholder')}
									value={formData.address_line2 || ''}
									onChange={(e) => handleChange('address_line2', e)}
									error={errors.address_line2}
									maxLength={255}
								/>

								<div className='grid grid-cols-2 gap-4'>
									<Select
										label={t('form.billingFields.state')}
										placeholder={t('form.billingFields.selectState')}
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
										noOptionsText={t('form.billingFields.noStates')}
									/>
									<Select
										label={t('form.billingFields.city')}
										options={citiesOptions}
										value={formData.address_city || undefined}
										placeholder={t('form.billingFields.selectCity')}
										noOptionsText={t('form.billingFields.noCities')}
										onChange={(e) => handleChange('address_city', e)}
									/>
								</div>

								<Input
									label={t('form.billingFields.postalCode')}
									placeholder={t('form.billingFields.postalCodePlaceholder')}
									value={formData.address_postal_code || ''}
									onChange={(e) => handleChange('address_postal_code', e)}
									error={errors.address_postal_code}
									maxLength={20}
								/>
							</div>
						</div>
					)}

					<Spacer className='!h-4' />
					<Button isLoading={isPending} disabled={isPending || isCtaDisabled} onClick={handleSubmit}>
						{isPending ? t('form.drawer.saving') : t('form.drawer.save')}
					</Button>
				</div>
			</Sheet>
		</div>
	);
};

export default CreateCustomerDrawer;
