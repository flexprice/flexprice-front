import { Button, Input, Sheet, Spacer, Textarea } from '@/components/atoms';
import type { CostSheet } from '@/models/CostSheet';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import CostSheetApi from '@/api/CostSheetApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { CreateCostSheetRequest, UpdateCostSheetRequest } from '@/types/dto/CostSheet';
import { useTranslation } from 'react-i18next';

interface Props {
	data?: CostSheet | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const CostSheetDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const isEdit = !!data;

	const [formData, setFormData] = useState<Partial<CostSheet>>(
		data || {
			name: '',
			description: '',
			lookup_key: '',
		},
	);
	const [errors, setErrors] = useState<Partial<Record<keyof CostSheet, string>>>({});

	const { mutate: updateCostSheet, isPending } = useMutation({
		mutationFn: (formData: Partial<CostSheet>) => {
			if (isEdit && data?.id) {
				const updateRequest: UpdateCostSheetRequest = {
					name: formData.name,
					description: formData.description,
					metadata: formData.metadata,
				};
				return CostSheetApi.UpdateCostSheet(data.id, updateRequest);
			} else {
				const createRequest: CreateCostSheetRequest = {
					name: formData.name!,
					lookup_key: formData.lookup_key!,
					description: formData.description,
					metadata: formData.metadata,
				};
				return CostSheetApi.CreateCostSheet(createRequest);
			}
		},
		onSuccess: (_: CostSheet) => {
			toast.success(isEdit ? t('catalog:costSheets.toast.updated') : t('catalog:costSheets.toast.created'));
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
		},
		onError: (error: Error) => {
			const message = error.message || (isEdit ? t('catalog:costSheets.toast.failedUpdate') : t('catalog:costSheets.toast.failedCreate'));
			toast.error(message);
		},
	});

	useEffect(() => {
		if (data) {
			setFormData(data);
		} else {
			setFormData({
				name: '',
				description: '',
				lookup_key: '',
			});
		}
	}, [data]);

	const validateForm = () => {
		const newErrors: Partial<Record<keyof CostSheet, string>> = {};

		if (!formData.name?.trim()) {
			newErrors.name = t('catalog:costSheets.validation.nameRequired');
		}

		if (!formData.lookup_key?.trim()) {
			newErrors.lookup_key = t('catalog:costSheets.validation.lookupKeyRequired');
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (!validateForm()) {
			return;
		}
		updateCostSheet(formData);
	};

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={isEdit ? t('catalog:costSheets.drawer.editTitle') : t('catalog:costSheets.drawer.createTitle')}
			description={isEdit ? t('catalog:costSheets.drawer.descriptionEdit') : t('catalog:costSheets.drawer.descriptionCreate')}
			trigger={trigger}>
			<Spacer height={'20px'} />
			<Input
				placeholder={t('catalog:costSheets.drawer.namePlaceholder')}
				description={t('catalog:costSheets.drawer.nameHelp')}
				label={t('catalog:costSheets.drawer.costSheetName')}
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({
						...formData,
						name: e,
						lookup_key: isEdit ? formData.lookup_key : 'cost-sheet-' + (e || '').replace(/\s/g, '-').toLowerCase(),
					});
				}}
			/>

			<Spacer height={'20px'} />
			<Input
				label={t('catalog:shared.lookupKey')}
				disabled={isEdit}
				error={errors.lookup_key}
				onChange={(e) => setFormData({ ...formData, lookup_key: e })}
				value={formData.lookup_key}
				placeholder={t('catalog:costSheets.drawer.lookupPlaceholder')}
				description={t('catalog:shared.lookupKeyDescription')}
			/>

			<Spacer height={'20px'} />
			<Textarea
				value={formData.description}
				onChange={(e) => {
					setFormData({ ...formData, description: e });
				}}
				className='min-h-[6.25rem]'
				placeholder={t('catalog:shared.enterDescription')}
				label={t('catalog:shared.description')}
				description={t('catalog:costSheets.drawer.purposeDescription')}
			/>
			<Spacer height={'20px'} />
			<Button isLoading={isPending} disabled={isPending || !formData.name?.trim() || !formData.lookup_key?.trim()} onClick={handleSave}>
				{isEdit ? t('common:actions.save') : t('common:actions.create')}
			</Button>
		</Sheet>
	);
};

export default CostSheetDrawer;
