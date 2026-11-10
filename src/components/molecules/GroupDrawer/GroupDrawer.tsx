import { Button, Input, Sheet, Spacer, Select } from '@/components/atoms';
import { Group } from '@/models/Group';
import { GROUP_ENTITY_TYPE } from '@/models/Group';
import { FC, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { GroupApi } from '@/api/GroupApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/queryClient';
import { CreateGroupRequest, UpdateGroupRequest, GroupResponse } from '@/types/dto';
import { useTranslation } from 'react-i18next';

interface Props {
	data?: Group | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const GroupDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const isEdit = !!data;

	const [formData, setFormData] = useState<CreateGroupRequest & { id?: string }>({
		name: data?.name || '',
		lookup_key: data?.lookup_key || '',
		entity_type: data?.entity_type || GROUP_ENTITY_TYPE.PRICE,
		id: data?.id,
	});

	const [errors, setErrors] = useState<Partial<Record<keyof CreateGroupRequest, string>>>({});

	const { mutate: updateGroup, isPending } = useMutation<GroupResponse, Error, (CreateGroupRequest | UpdateGroupRequest) & { id?: string }>(
		{
			mutationFn: (vars) => {
				const { id, ...rest } = vars;
				if (isEdit && id) {
					return GroupApi.updateGroup(id, rest as UpdateGroupRequest);
				}
				return GroupApi.createGroup(rest as CreateGroupRequest);
			},
			onSuccess: () => {
				toast.success(isEdit ? t('catalog:groups.toast.updated') : t('catalog:groups.toast.created'));
				onOpenChange?.(false);
				refetchQueries(refetchQueryKeys);
			},
			onError: (error: Error) => {
				toast.error(error.message || (isEdit ? t('catalog:groups.toast.failedUpdate') : t('catalog:groups.toast.failedCreate')));
			},
		},
	);

	useEffect(() => {
		if (!open) return;
		if (data) {
			setFormData({
				id: data.id,
				name: data.name || '',
				lookup_key: data.lookup_key || '',
				entity_type: data.entity_type,
			});
		} else {
			setFormData({
				name: '',
				lookup_key: '',
				entity_type: GROUP_ENTITY_TYPE.PRICE,
			});
		}
		setErrors({});
	}, [open, data]);

	const validateForm = () => {
		const newErrors: Partial<Record<keyof CreateGroupRequest, string>> = {};

		if (!formData.name?.trim()) {
			newErrors.name = t('catalog:groups.validation.nameRequired');
		}

		if (!formData.lookup_key?.trim()) {
			newErrors.lookup_key = t('catalog:groups.validation.lookupKeyRequired');
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (!validateForm()) {
			return;
		}

		const payload = isEdit
			? {
					id: formData.id,
					name: formData.name.trim(),
				}
			: {
					name: formData.name.trim(),
					lookup_key: formData.lookup_key,
					entity_type: formData.entity_type,
				};
		updateGroup(payload);
	};

	const entityTypeOptions = useMemo(
		() => [
			{ value: GROUP_ENTITY_TYPE.PRICE, label: t('catalog:groups.drawer.entityPrice') },
			{ value: GROUP_ENTITY_TYPE.FEATURE, label: t('catalog:groups.drawer.entityFeature') },
		],
		[t],
	);

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={isEdit ? t('catalog:groups.drawer.editTitle') : t('catalog:groups.drawer.createTitle')}
			description={isEdit ? t('catalog:groups.drawer.descriptionEdit') : t('catalog:groups.drawer.descriptionCreate')}
			trigger={trigger}>
			<Spacer height={'20px'} />
			<Input
				placeholder={t('catalog:groups.drawer.namePlaceholder')}
				description={t('catalog:groups.drawer.nameHelp')}
				label={t('catalog:groups.drawer.groupName')}
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({
						...formData,
						name: e,
						lookup_key: isEdit ? formData.lookup_key : 'group-' + e.replace(/\s/g, '-').toLowerCase(),
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
				placeholder={t('catalog:groups.drawer.lookupPlaceholder')}
				description={t('catalog:shared.lookupKeyDescription')}
			/>

			<Spacer height={'20px'} />
			<Select
				label={t('catalog:groups.drawer.entityType')}
				value={formData.entity_type}
				onChange={(value) => setFormData({ ...formData, entity_type: value as GROUP_ENTITY_TYPE })}
				options={entityTypeOptions}
				disabled={isEdit}
				placeholder={t('catalog:groups.drawer.selectEntityType')}
				description={t('catalog:groups.drawer.entityTypeHelp')}
			/>

			<Spacer height={'20px'} />
			<Button isLoading={isPending} disabled={isPending || !formData.name?.trim() || !formData.lookup_key?.trim()} onClick={handleSave}>
				{isEdit ? t('common:actions.save') : t('catalog:groups.drawer.createGroup')}
			</Button>
		</Sheet>
	);
};

export default GroupDrawer;
