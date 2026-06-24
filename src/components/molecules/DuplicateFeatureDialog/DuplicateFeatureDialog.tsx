import { FeatureApi } from '@/api';
import { Button, Dialog, Input, Spacer, Textarea } from '@/components/atoms';
import { RouteNames } from '@/core/routes/Routes';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import Feature from '@/models/Feature';
import { CloneFeatureRequest, FeatureResponse } from '@/types/dto';
import { useMutation } from '@tanstack/react-query';
import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

interface DuplicateFeatureDialogProps {
	featureId: string;
	feature: Feature | FeatureResponse | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	refetchQueryKeys?: string | string[];
}

type FormErrors = Partial<Record<keyof CloneFeatureRequest | 'metadata', string>>;

const DuplicateFeatureDialog: FC<DuplicateFeatureDialogProps> = ({
	featureId,
	feature,
	open,
	onOpenChange,
	refetchQueryKeys = ['fetchFeatures'],
}) => {
	const { t } = useTranslation(['catalog', 'common']);
	const navigate = useNavigate();
	const [name, setName] = useState('');
	const [lookupKey, setLookupKey] = useState('');
	const [description, setDescription] = useState('');
	const [metadataString, setMetadataString] = useState('');
	const [errors, setErrors] = useState<FormErrors>({});

	// Auto-generate lookup key from name (same as Add Feature dialog)
	useEffect(() => {
		if (open) {
			setLookupKey(`feature-${name?.toLowerCase().replace(/\s/g, '-') || ''}`);
		}
	}, [name, open]);

	const validate = (): boolean => {
		const newErrors: FormErrors = {};

		if (!name?.trim()) {
			newErrors.name = 'Name is required';
		} else if (feature && name.trim() === feature.name) {
			newErrors.name = 'Name must be different from the original feature';
		}

		if (!lookupKey?.trim()) {
			newErrors.lookup_key = 'Lookup key is required';
		} else if (feature && lookupKey.trim() === feature.lookup_key) {
			newErrors.lookup_key = 'Lookup key must be different from the original feature';
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

	const { mutate: cloneFeature, isPending } = useMutation({
		mutationFn: (payload: CloneFeatureRequest) => FeatureApi.cloneFeature(featureId, payload),
		onSuccess: (data) => {
			toast.success('Feature duplicated successfully');
			onOpenChange(false);
			refetchQueries(refetchQueryKeys);
			navigate(`${RouteNames.featureDetails}/${data.id}`);
		},
		onError: (error: Error) => {
			const message = error.message || 'Failed to duplicate feature. Please try again.';
			toast.error(message);
			if (message.toLowerCase().includes('name') || message.toLowerCase().includes('lookup')) {
				setErrors((prev) => ({ ...prev, name: message, lookup_key: message }));
			}
		},
	});

	const handleSubmit = () => {
		if (!validate() || !feature) return;

		let metadata: CloneFeatureRequest['metadata'] = {};
		if (metadataString.trim()) {
			try {
				const parsed = JSON.parse(metadataString);
				metadata = { ...parsed };
			} catch {
				return;
			}
		}

		const payload: CloneFeatureRequest = {
			name: name.trim(),
			lookup_key: lookupKey.trim(),
			...(description.trim() && { description: description.trim() }),
			metadata,
		};
		cloneFeature(payload);
	};

	return (
		<Dialog
			isOpen={open}
			onOpenChange={onOpenChange}
			title={t('catalog:features.duplicate.title')}
			description={t('catalog:features.duplicate.description')}
			showCloseButton={true}>
			<Input
				label={t('catalog:features.drawer.name')}
				placeholder={t('catalog:features.drawer.namePlaceholder')}
				description={t('catalog:features.duplicate.nameHelp')}
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
				placeholder={t('catalog:features.drawer.lookupPlaceholder')}
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
				className='min-h-[100px]'
				placeholder={t('catalog:shared.enterDescription')}
				label={t('catalog:features.drawer.descriptionLabel')}
				description={t('catalog:features.duplicate.descriptionHelp')}
			/>
			<Spacer height='20px' />
			<Textarea
				value={metadataString}
				onChange={(e) => {
					setMetadataString(e);
					if (errors.metadata) setErrors((prev) => ({ ...prev, metadata: undefined }));
				}}
				error={errors.metadata}
				className='min-h-[100px]'
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
					{t('catalog:features.duplicate.duplicate')}
				</Button>
			</div>
		</Dialog>
	);
};

export default DuplicateFeatureDialog;
