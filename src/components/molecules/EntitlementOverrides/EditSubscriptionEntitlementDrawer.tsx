import { FC, useEffect, useMemo, useState } from 'react';
import { Sheet, Label, Input, Button, Checkbox } from '@/components/atoms';
import { Switch } from '@/components/ui/switch';
import { JsonEditor } from '@/components/molecules/JsonEditor';
import Feature, { FEATURE_TYPE } from '@/models/Feature';
import { JsonObject } from '@/types/common';
import { ENTITLEMENT_ENTITY_TYPE } from '@/models/Entitlement';
import EntitlementApi from '@/api/EntitlementApi';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
	EnrichedSubscriptionEntitlement,
	SubscriptionEntitlementOverrideValues,
	getEffectiveStaticValue,
	getEffectiveConfigValue,
} from '@/utils/subscription/subscriptionEntitlementHelpers';

interface EditSubscriptionEntitlementDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	subscriptionId: string;
	entitlement: EnrichedSubscriptionEntitlement | null;
	onSuccess: () => void;
	onReset?: (entitlement: EnrichedSubscriptionEntitlement) => void;
}

const EditSubscriptionEntitlementDrawer: FC<EditSubscriptionEntitlementDrawerProps> = ({
	isOpen,
	onOpenChange,
	subscriptionId,
	entitlement,
	onSuccess,
	onReset,
}) => {
	const { t } = useTranslation('catalog');
	const [usageLimit, setUsageLimit] = useState<string>('');
	const [isInfinite, setIsInfinite] = useState<boolean>(false);
	const [staticValue, setStaticValue] = useState<string>('');
	const [isEnabled, setIsEnabled] = useState<boolean>(true);
	const [configValue, setConfigValue] = useState<JsonObject | null>(null);
	const [configInvalid, setConfigInvalid] = useState<boolean>(false);

	const initialConfigValue = useMemo((): JsonObject | null => {
		const raw = getEffectiveConfigValue(entitlement?.sources ?? []);
		if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) return raw as JsonObject;
		return null;
	}, [entitlement]);

	useEffect(() => {
		if (entitlement) {
			const currentLimit = entitlement.entitlement?.usage_limit;
			const isCurrentlyInfinite = currentLimit === null;

			setIsInfinite(isCurrentlyInfinite);
			setUsageLimit(isCurrentlyInfinite ? '' : currentLimit?.toString() || '');
			setStaticValue(getEffectiveStaticValue(entitlement.entitlement) || '');
			setIsEnabled(entitlement.entitlement?.is_enabled ?? true);
			setConfigValue(null);
			setConfigInvalid(false);
		}
	}, [entitlement]);

	const { mutate: saveOverride, isPending: isSaving } = useMutation({
		mutationFn: async (values: SubscriptionEntitlementOverrideValues) => {
			if (!entitlement) {
				throw new Error(t('entitlements.errors.entityIdRequired'));
			}

			if (entitlement.subscriptionEntitlementId) {
				return await EntitlementApi.update(entitlement.subscriptionEntitlementId, values);
			}

			const parentEntitlementId = entitlement.parentEntitlementIdForOverride;
			if (!parentEntitlementId) {
				throw new Error(t('entitlements.subscriptionEdit.createRequiresParent'));
			}

			return await EntitlementApi.create({
				entity_type: ENTITLEMENT_ENTITY_TYPE.SUBSCRIPTION,
				entity_id: subscriptionId,
				feature_id: entitlement.feature_id,
				feature_type: entitlement.feature_type as Feature['type'],
				parent_entitlement_id: parentEntitlementId,
				usage_reset_period: entitlement.usage_reset_period as never,
				...values,
			});
		},
		onSuccess: () => {
			toast.success(t('entitlements.subscriptionEdit.saveSuccess'));
			onSuccess();
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('entitlements.subscriptionEdit.saveFailed'));
		},
	});

	const handleSave = () => {
		if (!entitlement) return;

		const values: SubscriptionEntitlementOverrideValues = {};

		if (entitlement.feature_type === FEATURE_TYPE.METERED) {
			if (isInfinite) {
				// Backend maps usage_limit=0 to unlimited on PUT; POST accepts null
				values.usage_limit = entitlement.subscriptionEntitlementId ? 0 : null;
			} else {
				const parsedLimit = parseInt(usageLimit, 10);
				if (isNaN(parsedLimit)) {
					toast.error(t('entitlements.validation.usageLimitRequired'));
					return;
				}
				values.usage_limit = parsedLimit;
			}
		} else if (entitlement.feature_type === FEATURE_TYPE.STATIC) {
			if (!staticValue.trim()) {
				toast.error(t('entitlements.validation.staticValueRequired'));
				return;
			}
			values.static_value = staticValue;
		} else if (entitlement.feature_type === FEATURE_TYPE.BOOLEAN) {
			values.is_enabled = isEnabled;
		} else if (entitlement.feature_type === FEATURE_TYPE.CONFIG) {
			if (configInvalid) {
				toast.error(t('jsonEditor.errorInvalidJson'));
				return;
			}
			const effectiveConfigValue = configValue ?? initialConfigValue;
			if (!effectiveConfigValue) {
				toast.error(t('entitlements.addDrawer.configValueRequired'));
				return;
			}
			values.config_value = effectiveConfigValue;
		}

		saveOverride(values);
	};

	const handleCancel = () => {
		onOpenChange(false);
	};

	const handleReset = () => {
		if (!entitlement || !onReset) return;
		onReset(entitlement);
		onOpenChange(false);
	};

	const handleOpenChange = (open: boolean) => {
		onOpenChange(open);
		if (!open && entitlement) {
			const currentLimit = entitlement.entitlement?.usage_limit;
			const isCurrentlyInfinite = currentLimit === null;

			setIsInfinite(isCurrentlyInfinite);
			setUsageLimit(isCurrentlyInfinite ? '' : currentLimit?.toString() || '');
			setStaticValue(getEffectiveStaticValue(entitlement.entitlement) || '');
			setIsEnabled(entitlement.entitlement?.is_enabled ?? true);
		}
	};

	if (!entitlement) return null;

	const featureName = entitlement.feature?.name || t('entitlements.editDrawer.unknownFeature');
	const originalLimit = entitlement.originalUsageLimit;
	const originalStatic = entitlement.originalStaticValue;
	const originalEnabled = entitlement.originalIsEnabled;
	const resetPeriod = entitlement.usage_reset_period;
	const canReset = entitlement.isOverrideOfParent && !!entitlement.subscriptionEntitlementId && !!onReset;

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			title={t('entitlements.editDrawer.title', { name: featureName })}
			description={t('entitlements.editDrawer.description')}
			size='md'>
			<div className='space-y-5 p-6'>
				<div className='space-y-2'>
					<Label label={t('entitlements.editDrawer.featureType')} />
					<div className='text-sm text-gray-600 capitalize'>{entitlement.feature_type?.toLowerCase()}</div>
				</div>

				{entitlement.feature_type === FEATURE_TYPE.METERED && (
					<div className='space-y-4'>
						<div className='space-y-3'>
							<Label label={t('entitlements.editDrawer.usageLimit')} />
							<Input
								type='number'
								value={isInfinite ? t('entitlements.addDrawer.unlimitedDisplay') : usageLimit}
								onChange={(value) => setUsageLimit(value)}
								placeholder={t('entitlements.editDrawer.enterUsageLimitPlaceholder')}
								disabled={isInfinite}
							/>
							{(originalLimit !== undefined || entitlement.isOverrideOfParent) && (
								<div className='text-xs text-gray-500'>
									{t('entitlements.editDrawer.originalPrefix')}{' '}
									{originalLimit === null ? t('entitlements.addDrawer.unlimitedDisplay') : (originalLimit ?? '—')}
									{resetPeriod && t('entitlements.editDrawer.resetsSuffix', { period: resetPeriod.toLowerCase() })}
								</div>
							)}
						</div>

						<Checkbox
							id='subscription-set-infinite'
							label={t('entitlements.editDrawer.setInfiniteLabel')}
							checked={isInfinite}
							onCheckedChange={(checked) => {
								setIsInfinite(checked);
								if (checked) {
									setUsageLimit('');
								}
							}}
						/>
					</div>
				)}

				{entitlement.feature_type === FEATURE_TYPE.STATIC && (
					<div className='space-y-2'>
						<Label label={t('entitlements.editDrawer.staticValue')} />
						<Input
							value={staticValue}
							onChange={(value) => setStaticValue(value)}
							placeholder={t('entitlements.editDrawer.enterStaticPlaceholder')}
						/>
						{originalStatic !== undefined && (
							<div className='text-xs text-gray-500'>
								{t('entitlements.editDrawer.originalPrefix')} {originalStatic || t('entitlements.editDrawer.notSet')}
							</div>
						)}
					</div>
				)}

				{entitlement.feature_type === FEATURE_TYPE.BOOLEAN && (
					<div className='space-y-2'>
						<Label label={t('entitlements.editDrawer.enabledLabel')} />
						<div className='flex items-center gap-2'>
							<Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
							<span className='text-sm'>{isEnabled ? t('entitlements.editDrawer.enabled') : t('entitlements.editDrawer.disabled')}</span>
						</div>
						{originalEnabled !== undefined && (
							<div className='text-xs text-gray-500'>
								{t('entitlements.editDrawer.originalBooleanPrefix')}{' '}
								{originalEnabled ? t('entitlements.editDrawer.enabled') : t('entitlements.editDrawer.disabled')}
							</div>
						)}
					</div>
				)}

				{entitlement.feature_type === FEATURE_TYPE.CONFIG && (
					<div className='space-y-2'>
						<Label label={t('catalog:jsonEditor.title')} />
						<JsonEditor
							key={entitlement.entitlement?.id ?? entitlement.feature_id}
							value={initialConfigValue}
							onChange={(val, raw) => {
								setConfigValue(val);
								setConfigInvalid(raw.trim() !== '' && raw.trim() !== '{}' && val === null);
							}}
						/>
					</div>
				)}

				<div className='flex justify-end gap-3 mt-4'>
					<Button variant='outline' onClick={handleCancel} disabled={isSaving}>
						{t('entitlements.editDrawer.cancel')}
					</Button>
					{canReset && (
						<Button variant='outline' onClick={handleReset} disabled={isSaving}>
							{t('entitlements.editDrawer.resetToDefault')}
						</Button>
					)}
					<Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
						{t('entitlements.editDrawer.saveOverride')}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default EditSubscriptionEntitlementDrawer;
