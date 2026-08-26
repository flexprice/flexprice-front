import { Button, Input, Select, Sheet, Spacer, Textarea } from '@/components/atoms';
import { PriceUnit } from '@/models/PriceUnit';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PriceUnitApi } from '@/api/PriceUnitApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { CreatePriceUnitRequest, UpdatePriceUnitRequest, PriceUnitResponse, CreatePriceUnitResponse } from '@/types/dto';
import { currencyOptions } from '@/constants/constants';
import { useTranslation } from 'react-i18next';

interface Props {
	data?: PriceUnit | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const PriceUnitDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const isEdit = !!data;

	const [formData, setFormData] = useState<CreatePriceUnitRequest & { id?: string }>({
		name: data?.name || '',
		code: data?.code || '',
		symbol: data?.symbol || '',
		base_currency: data?.base_currency || '',
		conversion_rate: data?.conversion_rate || '',
		metadata: data?.metadata || undefined,
		id: data?.id,
	});
	const [metadataString, setMetadataString] = useState<string>(data?.metadata ? JSON.stringify(data.metadata, null, 2) : '');
	const [errors, setErrors] = useState<Partial<Record<keyof CreatePriceUnitRequest, string>>>({});

	const { mutate: updatePriceUnit, isPending } = useMutation<
		PriceUnitResponse | CreatePriceUnitResponse,
		Error,
		CreatePriceUnitRequest | (UpdatePriceUnitRequest & { id: string })
	>({
		mutationFn: (vars) => {
			if (isEdit) {
				const { id, ...rest } = vars as UpdatePriceUnitRequest & { id: string };
				return PriceUnitApi.UpdatePriceUnit(id, rest);
			}
			return PriceUnitApi.CreatePriceUnit(vars as CreatePriceUnitRequest);
		},
		onSuccess: () => {
			toast.success(isEdit ? t('catalog:priceUnits.toast.updated') : t('catalog:priceUnits.toast.created'));
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
		},
		onError: (error: Error) => {
			toast.error(error.message || (isEdit ? t('catalog:priceUnits.toast.failedUpdate') : t('catalog:priceUnits.toast.failedCreate')));
		},
	});

	useEffect(() => {
		if (data) {
			setFormData({
				id: data.id,
				name: data.name || '',
				code: data.code || '',
				symbol: data.symbol || '',
				base_currency: data.base_currency || '',
				conversion_rate: data.conversion_rate || '',
				metadata: data.metadata || undefined,
			});
			setMetadataString(data.metadata ? JSON.stringify(data.metadata, null, 2) : '');
		} else {
			setFormData({
				name: '',
				code: '',
				symbol: '',
				base_currency: '',
				conversion_rate: '',
			});
			setMetadataString('');
		}
		setErrors({});
	}, [data, open]);

	const validateForm = () => {
		const newErrors: Partial<Record<keyof CreatePriceUnitRequest, string>> = {};

		if (!formData.name?.trim()) {
			newErrors.name = t('catalog:priceUnits.validation.nameRequired');
		}

		if (!formData.code?.trim()) {
			newErrors.code = t('catalog:priceUnits.validation.codeRequired');
		}

		if (formData.code?.trim().length !== 3) {
			newErrors.code = t('catalog:priceUnits.validation.codeLength');
		}

		if (!formData.symbol?.trim()) {
			newErrors.symbol = t('catalog:priceUnits.validation.symbolRequired');
		}

		if (!formData.base_currency?.trim()) {
			newErrors.base_currency = t('catalog:priceUnits.validation.baseCurrencyRequired');
		} else if (formData.base_currency.length !== 3) {
			newErrors.base_currency = t('catalog:priceUnits.validation.baseCurrencyLength');
		}

		if (!formData.conversion_rate?.trim()) {
			newErrors.conversion_rate = t('catalog:priceUnits.validation.conversionRateRequired');
		} else {
			const rate = parseFloat(formData.conversion_rate);
			if (isNaN(rate)) {
				newErrors.conversion_rate = t('catalog:priceUnits.validation.conversionRateNumber');
			} else if (rate <= 0) {
				newErrors.conversion_rate = t('catalog:priceUnits.validation.conversionRatePositive');
			}
		}

		if (isEdit && metadataString.trim()) {
			try {
				const parsed = JSON.parse(metadataString);
				if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
					newErrors.metadata = t('catalog:shared.metadataMustBeObject');
				} else {
					const allStrings = Object.values(parsed).every((val) => typeof val === 'string');
					if (!allStrings) {
						newErrors.metadata = t('catalog:shared.metadataAllValuesStrings');
					}
				}
			} catch {
				newErrors.metadata = t('catalog:shared.metadataInvalidFormat');
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (!validateForm()) {
			return;
		}

		let metadata = undefined;
		if (metadataString.trim()) {
			try {
				metadata = JSON.parse(metadataString);
			} catch {
				return;
			}
		}

		if (isEdit) {
			const updateDto: UpdatePriceUnitRequest & { id: string } = {
				id: formData.id!,
				name: formData.name.trim(),
				metadata,
			};
			updatePriceUnit(updateDto);
		} else {
			const createDto: CreatePriceUnitRequest = {
				name: formData.name.trim(),
				code: formData.code.trim(),
				symbol: formData.symbol.trim(),
				base_currency: formData.base_currency.trim(),
				conversion_rate: formData.conversion_rate.trim(),
			};
			updatePriceUnit(createDto);
		}
	};

	const isFormValid =
		formData.name?.trim() &&
		formData.code?.trim() &&
		formData.symbol?.trim() &&
		formData.base_currency?.trim() &&
		formData.conversion_rate?.trim();

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={isEdit ? t('catalog:priceUnits.drawer.editTitle') : t('catalog:priceUnits.drawer.createTitle')}
			description={isEdit ? t('catalog:priceUnits.drawer.descriptionEdit') : t('catalog:priceUnits.drawer.descriptionCreate')}
			trigger={trigger}>
			<Input
				placeholder={t('catalog:priceUnits.drawer.namePlaceholder')}
				description={t('catalog:priceUnits.drawer.nameHelp')}
				label={t('catalog:priceUnits.drawer.name')}
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({ ...formData, name: e });
				}}
			/>

			<Spacer height={'20px'} />
			<Input
				label={t('catalog:priceUnits.drawer.code')}
				error={errors.code}
				onChange={(e) => {
					setFormData({ ...formData, code: e });
				}}
				value={formData.code}
				placeholder={t('catalog:priceUnits.drawer.codePlaceholder')}
				disabled={isEdit}
			/>

			<Spacer height={'20px'} />
			<Input
				label={t('catalog:priceUnits.drawer.symbol')}
				error={errors.symbol}
				onChange={(e) => {
					setFormData({ ...formData, symbol: e });
				}}
				value={formData.symbol}
				placeholder={t('catalog:priceUnits.drawer.symbolPlaceholder')}
				description={t('catalog:priceUnits.drawer.symbolHelp')}
			/>

			<Spacer height={'20px'} />
			<Select
				label={t('catalog:priceUnits.drawer.baseCurrency')}
				error={errors.base_currency}
				onChange={(value) => {
					setFormData({ ...formData, base_currency: value });
				}}
				value={formData.base_currency}
				options={currencyOptions}
				placeholder={t('catalog:priceUnits.drawer.selectBaseCurrency')}
				description={t('catalog:priceUnits.drawer.baseCurrencyHelp')}
			/>

			<Spacer height={'20px'} />
			<Input
				label={t('catalog:priceUnits.drawer.conversionRate')}
				error={errors.conversion_rate}
				onChange={(e) => {
					setFormData({ ...formData, conversion_rate: e });
				}}
				value={formData.conversion_rate}
				placeholder={t('catalog:priceUnits.drawer.conversionPlaceholder')}
				description={t('catalog:priceUnits.drawer.conversionHelp')}
				type='number'
				step='any'
			/>

			{isEdit && (
				<>
					<Spacer height={'20px'} />
					<Textarea
						value={metadataString}
						onChange={(e) => {
							setMetadataString(e);
							if (errors.metadata) {
								setErrors({ ...errors, metadata: undefined });
							}
						}}
						error={errors.metadata}
						className='min-h-[6.25rem]'
						placeholder={t('catalog:shared.metadataPlaceholder')}
						label={t('catalog:shared.metadataOptional')}
						description={t('catalog:shared.metadataJsonStringsOnly')}
					/>
				</>
			)}

			<Spacer height={'20px'} />
			<Button isLoading={isPending} disabled={isPending || !isFormValid} onClick={handleSave}>
				{isEdit ? t('common:actions.save') : t('common:actions.create')}
			</Button>
		</Sheet>
	);
};

export default PriceUnitDrawer;
