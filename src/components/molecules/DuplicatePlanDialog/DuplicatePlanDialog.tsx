import { Button, Dialog, Input, Spacer, Textarea } from '@/components/atoms';
import { PlanApi } from '@/api/PlanApi';
import { RouteNames } from '@/core/routes/Routes';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { ClonePlanRequest, PlanResponse } from '@/types/dto';
import { Plan } from '@/models/Plan';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface DuplicatePlanDialogProps {
	planId: string;
	plan: Plan | PlanResponse | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	refetchQueryKeys?: string | string[];
}

type FormErrors = Partial<Record<keyof ClonePlanRequest | 'metadata', string>>;

const DuplicatePlanDialog: FC<DuplicatePlanDialogProps> = ({
	planId,
	plan,
	open,
	onOpenChange,
	refetchQueryKeys = ['fetchPlan', 'planEntitlements'],
}) => {
	const { t } = useTranslation(['catalog', 'common']);
	const navigate = useNavigate();
	const [name, setName] = useState('');
	const [lookupKey, setLookupKey] = useState('');
	const [description, setDescription] = useState('');
	const [metadataString, setMetadataString] = useState('');
	const [errors, setErrors] = useState<FormErrors>({});

	// Auto-generate lookup key from name (same as Add Plan dialog)
	useEffect(() => {
		if (open) {
			setLookupKey(`plan-${name?.toLowerCase().replace(/\s/g, '-') || ''}`);
		}
	}, [name, open]);

	const validate = (): boolean => {
		const newErrors: FormErrors = {};

		if (!name?.trim()) {
			newErrors.name = 'Name is required';
		} else if (plan && name.trim() === plan.name) {
			newErrors.name = 'Name must be different from the original plan';
		}

		if (!lookupKey?.trim()) {
			newErrors.lookup_key = 'Lookup key is required';
		} else if (plan && lookupKey.trim() === plan.lookup_key) {
			newErrors.lookup_key = 'Lookup key must be different from the original plan';
		}

		if (metadataString.trim()) {
			try {
				const parsed = JSON.parse(metadataString);
				if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
					newErrors.metadata = 'Metadata must be a JSON object';
				} else {
					const allStrings = Object.values(parsed).every((val) => typeof val === 'string');
					if (!allStrings) {
						newErrors.metadata = 'All metadata values must be strings';
					}
				}
			} catch {
				newErrors.metadata = 'Invalid Metadata format';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: clonePlan, isPending } = useMutation({
		mutationFn: (payload: ClonePlanRequest) => PlanApi.clonePlan(planId, payload),
		onSuccess: (data) => {
			toast.success('Plan duplicated successfully');
			onOpenChange(false);
			refetchQueries(refetchQueryKeys);
			navigate(`${RouteNames.plan}/${data.id}`);
		},
		onError: (error: Error) => {
			const message = error.message || 'Failed to duplicate plan. Please try again.';
			toast.error(message);
			if (message.toLowerCase().includes('name') || message.toLowerCase().includes('lookup')) {
				setErrors((prev) => ({ ...prev, name: message, lookup_key: message }));
			}
		},
	});

	const handleSubmit = () => {
		if (!validate() || !plan) return;

		let metadata: ClonePlanRequest['metadata'] = {};
		if (metadataString.trim()) {
			try {
				const parsed = JSON.parse(metadataString);
				metadata = { ...parsed };
			} catch {
				return;
			}
		}

		const payload: ClonePlanRequest = {
			name: name.trim(),
			lookup_key: lookupKey.trim(),
			...(description.trim() && { description: description.trim() }),
			metadata,
		};
		clonePlan(payload);
	};

	return (
		<Dialog
			isOpen={open}
			onOpenChange={onOpenChange}
			title={t('catalog:plans.duplicate.title')}
			description={t('catalog:plans.duplicate.description')}
			showCloseButton={true}>
			<Input
				label={t('catalog:plans.drawer.planName')}
				placeholder={t('catalog:plans.drawer.namePlaceholder')}
				description={t('catalog:plans.drawer.nameHelp')}
				value={name}
				error={errors.name}
				onChange={(e) => {
					setName(e);
					if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
				}}
			/>
			<Spacer height='20px' />
			<Input
				label={t('catalog:shared.lookupKey')}
				placeholder={t('catalog:plans.drawer.lookupPlaceholder')}
				description={t('catalog:shared.lookupKeyDescription')}
				value={lookupKey}
				error={errors.lookup_key}
				onChange={(e) => {
					setLookupKey(e);
					if (errors.lookup_key) setErrors((prev) => ({ ...prev, lookup_key: undefined }));
				}}
			/>
			<Spacer height='20px' />
			<Textarea
				value={description}
				onChange={(e) => setDescription(e)}
				className='min-h-[6.25rem]'
				placeholder={t('catalog:shared.enterDescription')}
				label={t('catalog:features.drawer.descriptionLabel')}
				description={t('catalog:plans.drawer.purposeDescription')}
			/>
			<Spacer height='20px' />
			<Textarea
				value={metadataString}
				onChange={(e) => {
					setMetadataString(e);
					if (errors.metadata) setErrors((prev) => ({ ...prev, metadata: undefined }));
				}}
				error={errors.metadata}
				className='min-h-[6.25rem]'
				placeholder={t('catalog:shared.metadataPlaceholder')}
				label={t('catalog:shared.metadataOptional')}
				description={t('catalog:shared.metadataJsonStringsOnly')}
			/>
			<Spacer height='24px' />
			<div className='flex justify-end gap-2'>
				<Button variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
					{t('common:actions.cancel')}
				</Button>
				<Button onClick={handleSubmit} disabled={isPending || !name?.trim() || !lookupKey?.trim()} isLoading={isPending}>
					{t('catalog:plans.duplicate.duplicate')}
				</Button>
			</div>
		</Dialog>
	);
};

export default DuplicatePlanDialog;
