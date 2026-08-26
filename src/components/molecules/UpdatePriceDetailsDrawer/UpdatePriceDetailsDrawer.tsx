import { Button, Input, Sheet, Spacer, Textarea } from '@/components/atoms';
import SelectGroup from '@/components/organisms/PlanForm/SelectGroup';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PriceApi } from '@/api/PriceApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { UpdatePriceRequest } from '@/types/dto/Price';
import { Price } from '@/models/Price';
import { GROUP_ENTITY_TYPE } from '@/models/Group';
import { useTranslation } from 'react-i18next';

interface UpdatePriceDetailsDrawerProps {
	price: Price;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const UpdatePriceDetailsDrawer: FC<UpdatePriceDetailsDrawerProps> = ({ price, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const { t } = useTranslation(['catalog', 'common']);

	const [formData, setFormData] = useState<{
		display_name: string;
		description: string;
		lookup_key: string;
		metadata: string;
		group_id: string;
	}>({
		display_name: price?.display_name || '',
		description: price?.description || '',
		lookup_key: price?.lookup_key || '',
		metadata: price?.metadata ? JSON.stringify(price.metadata, null, 2) : '',
		group_id: price?.group_id || '',
	});
	const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

	const { mutate: updatePrice, isPending } = useMutation({
		mutationFn: (updateData: UpdatePriceRequest) => {
			return PriceApi.UpdatePrice(price.id, updateData);
		},
		onSuccess: () => {
			toast.success(t('catalog:prices.updateDrawer.toastSuccess'));
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('catalog:prices.updateDrawer.toastFailed'));
		},
	});

	useEffect(() => {
		if (price) {
			setFormData({
				display_name: price.display_name || '',
				description: price.description || '',
				lookup_key: price.lookup_key || '',
				metadata: price.metadata ? JSON.stringify(price.metadata, null, 2) : '',
				group_id: price.group_id || '',
			});
		}
		setErrors({});
	}, [price, open]);

	const validateForm = () => {
		const newErrors: Partial<Record<string, string>> = {};

		if (formData.metadata.trim()) {
			try {
				const parsed = JSON.parse(formData.metadata);
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
		if (formData.metadata.trim()) {
			try {
				metadata = JSON.parse(formData.metadata);
			} catch {
				return;
			}
		}

		const updateDto: UpdatePriceRequest = {
			display_name: formData.display_name?.trim() || undefined,
			description: formData.description?.trim() || undefined,
			lookup_key: formData.lookup_key?.trim() || undefined,
			metadata: metadata,
			group_id: formData.group_id?.trim() === '' ? '' : formData.group_id?.trim() || undefined,
		};

		updatePrice(updateDto);
	};

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={t('catalog:prices.updateDrawer.title')}
			description={t('catalog:prices.updateDrawer.description')}
			trigger={trigger}>
			<div className='space-y-8 mt-4'>
				<Input
					label={t('catalog:prices.updateDrawer.displayName')}
					placeholder={t('catalog:prices.updateDrawer.displayNamePlaceholder')}
					value={formData.display_name || ''}
					onChange={(e) => {
						setFormData({ ...formData, display_name: e });
					}}
				/>

				<Textarea
					label={t('catalog:prices.updateDrawer.descriptionLabel')}
					placeholder={t('catalog:shared.enterDescription')}
					value={formData.description || ''}
					onChange={(e) => {
						setFormData({ ...formData, description: e });
					}}
					className='min-h-[6.25rem]'
				/>

				<Input
					label={t('catalog:prices.updateDrawer.lookupKey')}
					placeholder={t('catalog:prices.updateDrawer.lookupKeyPlaceholder')}
					value={formData.lookup_key || ''}
					onChange={(e) => {
						setFormData({ ...formData, lookup_key: e });
					}}
				/>

				<Textarea
					value={formData.metadata}
					onChange={(e) => {
						setFormData({ ...formData, metadata: e });
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

				<SelectGroup
					label={t('catalog:prices.updateDrawer.group')}
					placeholder={t('catalog:prices.updateDrawer.groupPlaceholder')}
					value={formData.group_id}
					onChange={(group) => setFormData({ ...formData, group_id: group?.id ?? '' })}
					entityType={GROUP_ENTITY_TYPE.PRICE}
					showLookupKey={false}
				/>

				<Spacer className='!h-4' />
				<Button isLoading={isPending} disabled={isPending} onClick={handleSave}>
					{t('catalog:prices.updateDrawer.saveDetails')}
				</Button>
			</div>
		</Sheet>
	);
};

export default UpdatePriceDetailsDrawer;
