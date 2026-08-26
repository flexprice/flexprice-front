import { Button, Input, Sheet, Spacer, Textarea } from '@/components/atoms';
import Addon from '@/models/Addon';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import AddonApi from '@/api/AddonApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import { useTranslation } from 'react-i18next';
import type { CreateAddonRequest, UpdateAddonRequest } from '@/types/dto/Addon';

interface Props {
	data?: Addon | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const AddonDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const isEdit = !!data;
	const navigate = useNavigate();

	const [formData, setFormData] = useState<Partial<Addon>>(
		data || {
			name: '',
			description: '',
			lookup_key: '',
		},
	);
	const [errors, setErrors] = useState<Partial<Record<keyof Addon, string>>>({});

	const { mutate: updateAddon, isPending } = useMutation({
		mutationFn: (payload: Partial<Addon>) => {
			if (isEdit && payload.id) {
				return AddonApi.Update(payload.id, payload as UpdateAddonRequest);
			}
			return AddonApi.Create(payload as CreateAddonRequest);
		},
		onSuccess: (data: Addon) => {
			toast.success(isEdit ? t('addons.drawer.toast.updated') : t('addons.drawer.toast.created'));
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
			navigate(`${RouteNames.addonDetails}/${data.id}`);
		},
		onError: (error: Error) => {
			toast.error(error.message || (isEdit ? t('addons.drawer.toast.failedUpdate') : t('addons.drawer.toast.failedCreate')));
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
		const newErrors: Partial<Record<keyof Addon, string>> = {};

		if (!formData.name?.trim()) {
			newErrors.name = t('addons.drawer.validation.nameRequired');
		}

		if (!formData.lookup_key?.trim()) {
			newErrors.lookup_key = t('addons.drawer.validation.lookupKeyRequired');
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (!validateForm()) {
			return;
		}
		updateAddon(formData);
	};

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={isEdit ? t('addons.drawer.editTitle') : t('addons.drawer.createTitle')}
			description={isEdit ? t('addons.drawer.descriptionEdit') : t('addons.drawer.descriptionCreate')}
			trigger={trigger}>
			<Spacer height={'20px'} />
			<Input
				placeholder={t('addons.drawer.namePlaceholder')}
				description={t('addons.drawer.nameHelp')}
				label={t('addons.drawer.addonName')}
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({
						...formData,
						name: e,
						lookup_key: isEdit ? formData.lookup_key : 'addon-' + e.replace(/\s/g, '-').toLowerCase(),
					});
				}}
			/>

			<Spacer height={'20px'} />
			<Input
				label={t('shared.lookupKey')}
				disabled={isEdit}
				error={errors.lookup_key}
				onChange={(e) => setFormData({ ...formData, lookup_key: e })}
				value={formData.lookup_key}
				placeholder={t('addons.drawer.lookupPlaceholder')}
				description={t('shared.lookupKeyDescription')}
			/>

			<Spacer height={'20px'} />
			<Textarea
				value={formData.description}
				onChange={(e) => {
					setFormData({ ...formData, description: e });
				}}
				className='min-h-[6.25rem]'
				placeholder={t('shared.enterDescription')}
				label={t('shared.description')}
				description={t('addons.drawer.purposeDescription')}
			/>
			<Spacer height={'20px'} />
			<Button isLoading={isPending} disabled={isPending || !formData.name?.trim() || !formData.lookup_key?.trim()} onClick={handleSave}>
				{isEdit ? t('common:actions.save') : t('common:actions.create')}
			</Button>
		</Sheet>
	);
};

export default AddonDrawer;
