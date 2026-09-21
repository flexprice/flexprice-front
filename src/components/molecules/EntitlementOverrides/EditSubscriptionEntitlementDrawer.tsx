import { FC, useEffect, useMemo, useState } from 'react';
import { Dialog, Label, Input, Button, Checkbox } from '@/components/atoms';
import { Switch } from '@/components/ui/switch';
import { JsonEditor } from '@/components/molecules/JsonEditor';
import Feature, { FEATURE_TYPE } from '@/models/Feature';
import { JsonObject } from '@/types/common';
import { Entitlement, ENTITLEMENT_ENTITY_TYPE, hasGrantConfig } from '@/models/Entitlement';
import MeteredAllowanceFields, { type MeteredAllowanceErrors } from '@/components/molecules/AddEntitlementDrawer/MeteredAllowanceFields';
import { toAllowanceDraft } from '@/components/molecules/AddEntitlementDrawer/allowanceMode';
import { toGrantOverrideFields } from '@/components/molecules/AddEntitlementDrawer/grantOverridePayload';
import { formatAllowanceValue } from '@/utils/entitlement/allowanceLabel';
import EntitlementApi from '@/api/EntitlementApi';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
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
	const [grantDraft, setGrantDraft] = useState<Partial<Entitlement>>({});
	const [grantErrors, setGrantErrors] = useState<MeteredAllowanceErrors>({});

	// Legacy rows have no allowance to edit. Converting them here would change a
	// live customer's billing model as a side effect of adjusting a number, so they
	// keep the old field until a deliberate backfill moves them across.
	// What is stored, and the window running against it — the form needs both to say
	// when an edit it cannot apply now will actually land.
	const savedGrant = useMemo(
		() => toAllowanceDraft((entitlement?.entitlement ?? entitlement?.originalGrant ?? {}) as unknown as Partial<Entitlement>),
		[entitlement],
	);
	const liveWindow = useMemo(() => {
		const open = (entitlement?.grant_state?.allowances ?? []).find((w) => w.is_active);
		return open ? { valid_to: open.valid_to, usage: open.usage } : undefined;
	}, [entitlement]);

	const isGrantBacked = useMemo(
		() =>
			hasGrantConfig((entitlement?.entitlement ?? {}) as Partial<Entitlement>) ||
			hasGrantConfig((entitlement?.originalGrant ?? {}) as Partial<Entitlement>),
		[entitlement],
	);

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
			// Seed from the row in force, not the plan's: reopening on an existing
			// override must show that override, or saving any other field would
			// silently revert the allowance to the plan's.
			setGrantDraft(toAllowanceDraft((entitlement.entitlement ?? entitlement.originalGrant ?? {}) as unknown as Partial<Entitlement>));
			setGrantErrors({});
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

		if (entitlement.feature_type === FEATURE_TYPE.METERED && isGrantBacked) {
			const grant = toGrantOverrideFields(grantDraft);
			if (grant == null) {
				setGrantErrors({ grant_quota: t('entitlements.validation.allowanceRequired') });
				return;
			}
			Object.assign(values, grant);
		} else if (entitlement.feature_type === FEATURE_TYPE.METERED) {
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
	// What the plan grants, so a customer-specific allowance reads as a change from
	// something rather than a number out of nowhere.
	const planAllowanceLabel = entitlement.originalGrant
		? formatAllowanceValue(entitlement.originalGrant as unknown as Partial<Entitlement>, t)
		: undefined;
	const canReset = entitlement.isOverrideOfParent && !!entitlement.subscriptionEntitlementId && !!onReset;

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			title={t('entitlements.editDrawer.title', { name: featureName })}
			description={t('entitlements.editDrawer.description')}
			scrollBody
			className='w-full max-w-3xl'>
			<div className='space-y-5'>
				<div className='space-y-2'>
					<Label label={t('entitlements.editDrawer.featureType')} />
					<div className='text-sm text-content-tertiary capitalize'>{entitlement.feature_type?.toLowerCase()}</div>
				</div>

				{entitlement.feature_type === FEATURE_TYPE.METERED && isGrantBacked && (
					<div className='space-y-3'>
						{planAllowanceLabel && (
							<p className='text-xs text-muted-foreground'>{t('entitlements.editDrawer.planAllowance', { value: planAllowanceLabel })}</p>
						)}
						<MeteredAllowanceFields
							value={grantDraft}
							onChange={(patch) => {
								setGrantDraft((prev) => ({ ...prev, ...patch }));
								setGrantErrors({});
							}}
							errors={grantErrors}
							savedValue={savedGrant}
							liveWindow={liveWindow}
							unitLabel={
								(entitlement.feature as { unit_plural?: string } | undefined)?.unit_plural?.trim() ||
								t('entitlements.addDrawer.unitsFallback')
							}
						/>
					</div>
				)}

				{entitlement.feature_type === FEATURE_TYPE.METERED && !isGrantBacked && (
					<div className='space-y-4'>
						<Input
							id='subscription-edit-entitlement-usage-limit'
							label={t('entitlements.editDrawer.usageLimit')}
							type={isInfinite ? 'text' : 'number'}
							value={isInfinite ? t('entitlements.addDrawer.unlimitedDisplay') : usageLimit}
							onChange={(value) => setUsageLimit(value)}
							placeholder={t('entitlements.editDrawer.enterUsageLimitPlaceholder')}
							disabled={isInfinite}
							description={
								originalLimit !== undefined || entitlement.isOverrideOfParent
									? `${t('entitlements.editDrawer.originalPrefix')} ${
											originalLimit === null ? t('entitlements.addDrawer.unlimitedDisplay') : (originalLimit ?? '—')
										}${resetPeriod ? t('entitlements.editDrawer.resetsSuffix', { period: resetPeriod.toLowerCase() }) : ''}`
									: undefined
							}
						/>

						<div
							className={cn(
								'flex items-start gap-2 rounded-md border border-line px-3 py-2.5 transition-colors',
								isInfinite && 'border-line-strong bg-surface-subtle',
							)}>
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
							<div className='text-xs text-content-muted'>
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
							<div className='text-xs text-content-muted'>
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
		</Dialog>
	);
};

export default EditSubscriptionEntitlementDrawer;
