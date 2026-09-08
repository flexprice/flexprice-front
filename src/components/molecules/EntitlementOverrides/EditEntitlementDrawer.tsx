import { FC, useEffect, useMemo, useState } from 'react';
import { Sheet, Label, Input, Button, Checkbox, Chip } from '@/components/atoms';
import { Switch } from '@/components/ui/switch';
import { FEATURE_TYPE } from '@/models';
import { EntitlementOverrideRequest } from '@/types/dto/Subscription';
import { JsonEditor } from '@/components/molecules/JsonEditor';
import { JsonObject } from '@/types/common';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { EnrichedEntitlementRow } from './EntitlementOverridesTable';
import MeteredAllowanceFields, { type MeteredAllowanceErrors } from '@/components/molecules/AddEntitlementDrawer/MeteredAllowanceFields';
import { deriveAllowanceMode, toAllowanceDraft } from '@/components/molecules/AddEntitlementDrawer/allowanceMode';
import { Entitlement, hasGrantConfig } from '@/models/Entitlement';
import { formatAllowanceValue, formatAllowanceReset } from '@/utils/entitlement/allowanceLabel';

interface EditEntitlementDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	entitlement: EnrichedEntitlementRow | null;
	onSave: (override: EntitlementOverrideRequest) => void;
	onReset?: (entitlementId: string) => void;
}

const EditEntitlementDrawer: FC<EditEntitlementDrawerProps> = ({ isOpen, onOpenChange, entitlement, onSave, onReset }) => {
	const { t } = useTranslation('catalog');
	const { t: tc } = useTranslation();
	const [usageLimit, setUsageLimit] = useState<string>('');
	const [isInfinite, setIsInfinite] = useState<boolean>(false);
	const [staticValue, setStaticValue] = useState<string>('');
	const [isEnabled, setIsEnabled] = useState<boolean>(true);
	const [configValue, setConfigValue] = useState<JsonObject | null>(null);
	const [configInvalid, setConfigInvalid] = useState<boolean>(false);
	// Grant-backed entitlements are edited as an allowance, not a usage limit.
	const [grantDraft, setGrantDraft] = useState<Partial<Entitlement>>({});
	const [grantErrors, setGrantErrors] = useState<MeteredAllowanceErrors>({});
	const isGrantBacked = hasGrantConfig(entitlement ?? undefined);

	// Derived synchronously so JsonEditor always mounts with the correct value on first open
	const initialConfigValue = useMemo((): JsonObject | null => {
		const raw = entitlement?.displayConfigValue ?? entitlement?.config_value;
		if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) return raw as JsonObject;
		return null;
	}, [entitlement]);

	useEffect(() => {
		if (entitlement) {
			const currentLimit = entitlement.displayUsageLimit;
			const isCurrentlyInfinite = currentLimit === null;

			setIsInfinite(isCurrentlyInfinite);
			setUsageLimit(isCurrentlyInfinite ? '' : currentLimit?.toString() || '');
			setStaticValue(entitlement.displayStaticValue || entitlement.static_value || '');
			setIsEnabled(entitlement.displayIsEnabled ?? entitlement.is_enabled ?? true);
			setConfigValue(null);
			setConfigInvalid(false);
			// Seed from the merged view, not the plan's raw config: reopening a drawer
			// on an existing override must show that override, or saving any other
			// field silently reverts the quota to the plan's.
			setGrantDraft(toAllowanceDraft(entitlement.displayGrant ?? entitlement));
			setGrantErrors({});
		}
	}, [entitlement]);

	const handleSave = () => {
		if (!entitlement) return;

		const override: EntitlementOverrideRequest = {
			entitlement_id: entitlement.id,
		};

		if (entitlement.feature_type === FEATURE_TYPE.METERED && isGrantBacked) {
			const mode = deriveAllowanceMode(grantDraft);
			if (mode !== 'unlimited' && (grantDraft.grant_quota == null || grantDraft.grant_quota === '')) {
				setGrantErrors({ grant_quota: t('entitlements.validation.allowanceRequired') });
				return;
			}
			override.grant_measure = grantDraft.grant_measure ?? undefined;
			// null (unlimited) must reach the API as an absent field, not a value.
			override.grant_quota = grantDraft.grant_quota ?? undefined;
			override.grant_duration_value = grantDraft.grant_duration_value ?? undefined;
			override.grant_duration_unit = grantDraft.grant_duration_unit;
			override.grant_allocation_behavior = grantDraft.grant_allocation_behavior;
			override.aggregation_mode = grantDraft.aggregation_mode;
		} else if (entitlement.feature_type === FEATURE_TYPE.METERED) {
			if (isInfinite) {
				override.usage_limit = null;
			} else {
				const parsedLimit = parseInt(usageLimit, 10);
				if (!isNaN(parsedLimit)) {
					override.usage_limit = parsedLimit;
				}
			}
		} else if (entitlement.feature_type === FEATURE_TYPE.STATIC) {
			override.static_value = staticValue;
		} else if (entitlement.feature_type === FEATURE_TYPE.BOOLEAN) {
			override.is_enabled = isEnabled;
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
			override.config_value = effectiveConfigValue;
		}

		onSave(override);
	};

	const handleCancel = () => {
		onOpenChange(false);
	};

	const handleReset = () => {
		if (!entitlement || !onReset) return;

		const originalLimit = entitlement.usage_limit;
		const isOriginallyInfinite = originalLimit === null;

		setIsInfinite(isOriginallyInfinite);
		setUsageLimit(isOriginallyInfinite ? '' : originalLimit?.toString() || '');
		setStaticValue(entitlement.static_value || '');
		setIsEnabled(entitlement.is_enabled ?? true);

		onReset(entitlement.id);
		onOpenChange(false);
	};

	const handleOpenChange = (open: boolean) => {
		onOpenChange(open);
		if (!open) {
			const currentLimit = entitlement?.displayUsageLimit;
			const isCurrentlyInfinite = currentLimit === null;

			setIsInfinite(isCurrentlyInfinite);
			setUsageLimit(isCurrentlyInfinite ? '' : currentLimit?.toString() || '');
			setStaticValue(entitlement?.displayStaticValue || entitlement?.static_value || '');
			setIsEnabled(entitlement?.displayIsEnabled ?? entitlement?.is_enabled ?? true);
		}
	};

	if (!entitlement) return null;

	const featureName = entitlement.feature?.name || t('entitlements.editDrawer.unknownFeature');

	const getFeatureTypeChip = (featureType: string) => {
		const type = featureType?.toLowerCase();
		switch (type) {
			case 'metered':
				return <Chip label={t('entitlements.overridesTable.featureTypeMetered')} variant='info' />;
			case 'boolean':
				return <Chip label={t('entitlements.overridesTable.featureTypeBoolean')} variant='success' />;
			case 'static':
				return <Chip label={t('entitlements.overridesTable.featureTypeStatic')} variant='warning' />;
			case 'config':
				return <Chip label={tc('labels.config')} variant='default' />;
			default:
				return <Chip label={featureType} variant='info' />;
		}
	};

	const planAllowanceLabel = isGrantBacked
		? `${formatAllowanceValue(entitlement, t)}${
				formatAllowanceReset(entitlement, t) !== '--' ? ` / ${formatAllowanceReset(entitlement, t)}` : ''
			}`
		: '';

	const originalUsageLabel =
		entitlement.usage_limit === null
			? t('entitlements.addDrawer.unlimitedDisplay')
			: String(entitlement.usage_limit) +
				(entitlement.usage_reset_period
					? t('entitlements.editDrawer.resetsSuffix', { period: entitlement.usage_reset_period.toLowerCase() })
					: '');

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			title={t('entitlements.editDrawer.title', { name: featureName })}
			description={t('entitlements.editDrawer.description')}
			size='md'>
			<div className='flex flex-col gap-6 p-6'>
				<div className='space-y-2'>
					<Label label={t('entitlements.editDrawer.featureType')} />
					<div>{getFeatureTypeChip(entitlement.feature_type)}</div>
				</div>

				{entitlement.feature_type === FEATURE_TYPE.METERED && isGrantBacked && (
					<div className='space-y-3'>
						<p className='text-xs text-muted-foreground'>{t('entitlements.editDrawer.planAllowance', { value: planAllowanceLabel })}</p>
						<MeteredAllowanceFields
							value={grantDraft}
							onChange={(patch) => {
								setGrantDraft((prev) => ({ ...prev, ...patch }));
								setGrantErrors({});
							}}
							errors={grantErrors}
							unitLabel={entitlement.feature?.unit_plural?.trim() || t('entitlements.addDrawer.unitsFallback')}
						/>
						<p className='text-xs text-muted-foreground'>{t('entitlements.editDrawer.allowanceHelp')}</p>
					</div>
				)}

				{entitlement.feature_type === FEATURE_TYPE.METERED && !isGrantBacked && (
					<div className='space-y-4'>
						<Input
							id='edit-entitlement-usage-limit'
							label={t('entitlements.editDrawer.usageLimit')}
							type={isInfinite ? 'text' : 'number'}
							value={isInfinite ? t('entitlements.addDrawer.unlimitedDisplay') : usageLimit}
							onChange={(value) => setUsageLimit(value)}
							placeholder={t('entitlements.editDrawer.enterUsageLimitPlaceholder')}
							disabled={isInfinite}
							description={`${t('entitlements.editDrawer.originalPrefix')} ${originalUsageLabel}`}
						/>

						<div
							className={cn(
								'flex items-start gap-2 rounded-md border border-line px-3 py-2.5 transition-colors',
								isInfinite && 'border-line-strong bg-surface-subtle',
							)}>
							<Checkbox
								id='set-infinite'
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
					<Input
						id='edit-entitlement-static-value'
						label={t('entitlements.editDrawer.staticValue')}
						value={staticValue}
						onChange={(value) => setStaticValue(value)}
						placeholder={t('entitlements.editDrawer.enterStaticPlaceholder')}
						description={`${t('entitlements.editDrawer.originalPrefix')} ${entitlement.static_value || t('entitlements.editDrawer.notSet')}`}
					/>
				)}

				{entitlement.feature_type === FEATURE_TYPE.BOOLEAN && (
					<div className='space-y-2'>
						<Label label={t('entitlements.editDrawer.enabledLabel')} />
						<div className='flex items-center gap-3 rounded-md border border-line px-3 py-2.5'>
							<Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
							<span className='text-sm text-content'>
								{isEnabled ? t('entitlements.editDrawer.enabled') : t('entitlements.editDrawer.disabled')}
							</span>
						</div>
						<p className='text-sm text-muted-foreground'>
							{t('entitlements.editDrawer.originalBooleanPrefix')}{' '}
							{entitlement.is_enabled ? t('entitlements.editDrawer.enabled') : t('entitlements.editDrawer.disabled')}
						</p>
					</div>
				)}

				{entitlement.feature_type === FEATURE_TYPE.CONFIG && (
					<div className='space-y-2'>
						<Label label={t('catalog:jsonEditor.title')} />
						<JsonEditor
							key={entitlement.id ?? entitlement.feature_id}
							value={initialConfigValue}
							onChange={(val, raw) => {
								setConfigValue(val);
								setConfigInvalid(raw.trim() !== '' && raw.trim() !== '{}' && val === null);
							}}
						/>
					</div>
				)}

				<div className='flex justify-end gap-2 border-t border-line pt-4'>
					<Button variant='outline' onClick={handleCancel}>
						{t('entitlements.editDrawer.cancel')}
					</Button>
					{entitlement.hasOverride && onReset && (
						<Button variant='outline' onClick={handleReset}>
							{t('entitlements.editDrawer.resetToDefault')}
						</Button>
					)}
					<Button onClick={handleSave}>{t('entitlements.editDrawer.saveOverride')}</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default EditEntitlementDrawer;
