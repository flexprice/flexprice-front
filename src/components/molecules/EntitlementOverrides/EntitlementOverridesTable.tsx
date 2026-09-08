import { FC, useState, useMemo } from 'react';
import { Chip, Sheet } from '@/components/atoms';
import { FlexpriceTable, ColumnData } from '@/components/molecules';
import JsonCodeBlock from '@/components/molecules/Events/JsonCodeBlock';
import { FEATURE_TYPE } from '@/models';
import { Pencil, Info, Copy } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { BsThreeDots } from 'react-icons/bs';
import { EntitlementOverrideRequest } from '@/types/dto/Subscription';
import { EntitlementResponse } from '@/types/dto/Entitlement';
import { JsonObject } from '@/types/common';
import EditEntitlementDrawer from './EditEntitlementDrawer';
import { useTranslation } from 'react-i18next';
import { copyToClipboard } from '@/utils/common/helper_functions';
import { hasGrantConfig, type Entitlement } from '@/models/Entitlement';
import { formatAllowanceValue, formatAllowanceReset } from '@/utils/entitlement/allowanceLabel';

/** Plan/addon entitlement row with local override display fields applied. */
export interface EnrichedEntitlementRow extends EntitlementResponse {
	displayUsageLimit: number | null;
	/** Entitlement merged with its override's grant fields, for display only. */
	displayGrant?: Partial<Entitlement>;
	displayStaticValue: string;
	displayIsEnabled: boolean;
	displayConfigValue: JsonObject | null | undefined;
	hasOverride: boolean;
}

interface EntitlementOverridesTableProps {
	entitlements: EntitlementResponse[];
	overrides: Record<string, EntitlementOverrideRequest>;
	onOverrideChange: (entitlementId: string, override: EntitlementOverrideRequest) => void;
	onOverrideReset?: (entitlementId: string) => void;
}

const EntitlementOverridesTable: FC<EntitlementOverridesTableProps> = ({ entitlements, overrides, onOverrideChange, onOverrideReset }) => {
	const { t } = useTranslation('catalog');
	const { t: tc } = useTranslation('common');
	const [selectedEntitlement, setSelectedEntitlement] = useState<EnrichedEntitlementRow | null>(null);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
	const [configSheet, setConfigSheet] = useState<{ open: boolean; name: string; value: JsonObject | null }>({
		open: false,
		name: '',
		value: null,
	});

	// Merge entitlements with their overrides
	const enrichedEntitlements = useMemo((): EnrichedEntitlementRow[] => {
		return entitlements.map((ent) => {
			const override = overrides[ent.id];
			return {
				...ent,
				// Show override values if they exist, otherwise show original values
				// Use 'usage_limit' in override to check if it exists (including null for unlimited)
				displayUsageLimit: override && 'usage_limit' in override ? (override.usage_limit ?? null) : ent.usage_limit,
				displayStaticValue: override?.static_value ?? ent.static_value,
				displayIsEnabled: override?.is_enabled ?? ent.is_enabled,
				displayConfigValue: override?.config_value ?? ent.config_value,
				// Grant fields merged for display: an override that only changes the
				// quota still shows the plan's cadence, so the row must read from the
				// merge rather than from either side alone.
				displayGrant: {
					...ent,
					grant_measure: override?.grant_measure ?? ent.grant_measure,
					grant_quota: override && 'grant_quota' in override ? (override.grant_quota ?? null) : ent.grant_quota,
					grant_duration_value: override?.grant_duration_value ?? ent.grant_duration_value,
					grant_duration_unit: override?.grant_duration_unit ?? ent.grant_duration_unit,
					grant_allocation_behavior: override?.grant_allocation_behavior ?? ent.grant_allocation_behavior,
					aggregation_mode: override?.aggregation_mode ?? ent.aggregation_mode,
				},
				hasOverride: !!override,
			};
		});
	}, [entitlements, overrides]);

	const handleEdit = (entitlement: EnrichedEntitlementRow) => {
		setDropdownOpen(null); // Close dropdown first
		setSelectedEntitlement(entitlement);
		setDrawerOpen(true);
	};

	const handleSaveOverride = (override: EntitlementOverrideRequest) => {
		onOverrideChange(override.entitlement_id, override);
		setDrawerOpen(false);
		setSelectedEntitlement(null);
	};

	const handleResetOverride = (entitlementId: string) => {
		if (onOverrideReset) {
			onOverrideReset(entitlementId);
		}
		setDrawerOpen(false);
		setSelectedEntitlement(null);
	};

	const handleCloseDrawer = (open: boolean) => {
		setDrawerOpen(open);
		if (!open) {
			setSelectedEntitlement(null);
		}
	};

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

	/** "1,000 calls / hour" — the whole allowance, so a cadence change is visible too. */
	const describeAllowance = (e: Partial<Entitlement>) => {
		const value = formatAllowanceValue(e, t);
		const reset = formatAllowanceReset(e, t);
		return reset && reset !== '--' ? `${value} / ${reset}` : value;
	};

	const getEntitlementValue = (entitlement: EnrichedEntitlementRow) => {
		const featureType = entitlement.feature_type;
		const hasOverride = entitlement.hasOverride;

		if (featureType === FEATURE_TYPE.METERED) {
			const limit = entitlement.displayUsageLimit;
			const originalLimit = entitlement.usage_limit;
			const resetPeriod = entitlement.usage_reset_period;

			// A grant-backed row has no usage_limit, so the legacy branch below would
			// render every allowance as "unlimited". Overrides do not carry grant
			// fields yet, so the plan's allowance is the value either way.
			let valueText: string;
			if (hasGrantConfig(entitlement)) {
				const merged = entitlement.displayGrant ?? entitlement;
				const reset = formatAllowanceReset(merged, t);
				const value = formatAllowanceValue(merged, t);
				valueText = reset && reset !== '--' ? `${value} / ${reset}` : value;
			} else {
				valueText =
					limit !== null && limit !== undefined
						? `${limit.toLocaleString()}${resetPeriod ? t('entitlements.overridesTable.perPeriodSuffix', { period: resetPeriod.toLowerCase() }) : ''}`
						: t('entitlements.overridesTable.unlimited');
			}

			// Check if there's an override and the value has changed (including null to number or vice versa)
			const hasChangedValue = hasGrantConfig(entitlement)
				? // Compare the whole phrase so a cadence-only change counts too.
					hasOverride && describeAllowance(entitlement.displayGrant ?? entitlement) !== describeAllowance(entitlement)
				: hasOverride && limit !== originalLimit;

			return (
				<div className='flex items-center gap-2'>
					<span className='max-w-[240px] truncate' title={valueText}>
						{valueText}
					</span>
					{hasChangedValue && (
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger>
									<Info className='h-4 w-4 shrink-0 text-accent-orange hover:text-accent-orange transition-colors duration-150' />
								</TooltipTrigger>
								<TooltipContent
									sideOffset={5}
									className='bg-surface border border-line shadow-lg text-sm text-content px-4 py-3 rounded-[6px] max-w-[300px]'>
									<div className='space-y-2'>
										<div className='font-medium text-content'>{t('entitlements.overridesTable.overrideAppliedTitle')}</div>
										<div className='text-sm text-content-tertiary'>
											{/* A grant-backed row has no usage_limit on either side, so the legacy
											    line would always read "Unlimited → Unlimited". Describe the
											    allowance that actually changed instead. */}
											{hasGrantConfig(entitlement)
												? t('entitlements.overridesTable.tooltipAllowance', {
														from: describeAllowance(entitlement),
														to: describeAllowance(entitlement.displayGrant ?? entitlement),
													})
												: t('entitlements.overridesTable.tooltipUsageLimit', {
														from:
															originalLimit === null ? t('entitlements.overridesTable.unlimited') : String(originalLimit?.toLocaleString()),
														to: limit === null ? t('entitlements.overridesTable.unlimited') : String(limit?.toLocaleString()),
													})}
										</div>
									</div>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
			);
		} else if (featureType === FEATURE_TYPE.STATIC) {
			const value = entitlement.displayStaticValue || t('entitlements.overridesTable.valuePlaceholder');
			const originalValue = entitlement.static_value || t('entitlements.overridesTable.valuePlaceholder');

			return (
				<div className='flex items-center gap-2'>
					<span className='max-w-[240px] truncate' title={value}>
						{value}
					</span>
					{hasOverride && value !== originalValue && (
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger>
									<Info className='h-4 w-4 shrink-0 text-accent-orange hover:text-accent-orange transition-colors duration-150' />
								</TooltipTrigger>
								<TooltipContent
									sideOffset={5}
									className='bg-surface border border-line shadow-lg text-sm text-content px-4 py-3 rounded-[6px] max-w-[300px]'>
									<div className='space-y-2'>
										<div className='font-medium text-content'>{t('entitlements.overridesTable.overrideAppliedTitle')}</div>
										<div className='text-sm text-content-tertiary'>
											{t('entitlements.overridesTable.tooltipStaticValue', {
												from: String(originalValue),
												to: String(value),
											})}
										</div>
									</div>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
			);
		} else if (featureType === FEATURE_TYPE.BOOLEAN) {
			const value = entitlement.displayIsEnabled ? t('entitlements.overridesTable.enabled') : t('entitlements.overridesTable.disabled');
			const originalValue = entitlement.is_enabled ? t('entitlements.overridesTable.enabled') : t('entitlements.overridesTable.disabled');

			return (
				<div className='flex items-center gap-2'>
					<span>{value}</span>
					{hasOverride && value !== originalValue && (
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger>
									<Info className='h-4 w-4 shrink-0 text-accent-orange hover:text-accent-orange transition-colors duration-150' />
								</TooltipTrigger>
								<TooltipContent
									sideOffset={5}
									className='bg-surface border border-line shadow-lg text-sm text-content px-4 py-3 rounded-[6px] max-w-[300px]'>
									<div className='space-y-2'>
										<div className='font-medium text-content'>{t('entitlements.overridesTable.overrideAppliedTitle')}</div>
										<div className='text-sm text-content-tertiary'>
											{t('entitlements.overridesTable.tooltipStatus', {
												from: originalValue,
												to: value,
											})}
										</div>
									</div>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
			);
		} else if (featureType === FEATURE_TYPE.CONFIG) {
			const cv = entitlement.displayConfigValue;
			const compact = cv && Object.keys(cv).length > 0 ? JSON.stringify(cv) : null;
			if (!compact) return <span className='text-muted-foreground'>{t('entitlements.overridesTable.valuePlaceholder')}</span>;
			return (
				<div className='flex items-center gap-2'>
					<button
						type='button'
						className='font-mono text-xs text-left text-muted-foreground rounded border border-transparent transition-all hover:border-border hover:shadow-sm hover:text-foreground max-w-[240px]'
						style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-all' }}
						onClick={() => setConfigSheet({ open: true, name: entitlement.feature?.name ?? '', value: cv ?? null })}>
						{compact}
					</button>
					{hasOverride && (
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger>
									<Info className='h-4 w-4 shrink-0 text-accent-orange hover:text-accent-orange transition-colors duration-150' />
								</TooltipTrigger>
								<TooltipContent
									sideOffset={5}
									className='bg-surface border border-line shadow-lg text-sm text-content px-4 py-3 rounded-[6px] max-w-[300px]'>
									<div className='space-y-2'>
										<div className='font-medium text-content'>{t('entitlements.overridesTable.overrideAppliedTitle')}</div>
										<div className='text-sm text-content-tertiary'>{t('entitlements.overridesTable.tooltipConfig')}</div>
									</div>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
			);
		}
		return t('entitlements.overridesTable.valuePlaceholder');
	};

	const columns: ColumnData<EnrichedEntitlementRow>[] = [
		{
			title: t('entitlements.overridesTable.columnFeatureName'),
			render: (row) => {
				const name = row.feature?.name || t('entitlements.overridesTable.unknownFeature');
				return (
					<span className='block max-w-[240px] truncate' title={name}>
						{name}
					</span>
				);
			},
		},
		{
			title: t('entitlements.overridesTable.columnEntityType'),
			render: (row) => <span className='capitalize'>{row.entity_type?.toLowerCase()}</span>,
		},
		{
			title: t('entitlements.overridesTable.columnFeatureType'),
			render: (row) => getFeatureTypeChip(row.feature_type),
		},
		{
			title: t('entitlements.overridesTable.columnValue'),
			render: (row) => getEntitlementValue(row),
		},
		{
			title: '',
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row) => {
				// Only show edit button for plan entitlements, not addon entitlements
				if (row.entity_type?.toLowerCase() === 'addon') {
					return null;
				}

				return (
					<div
						data-interactive='true'
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}>
						<DropdownMenu open={dropdownOpen === row.id} onOpenChange={(open) => setDropdownOpen(open ? row.id : null)}>
							<DropdownMenuTrigger asChild>
								<button className='focus:outline-none'>
									<BsThreeDots className='text-base text-muted-foreground hover:text-foreground transition-colors' />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem
									onSelect={(e) => {
										e.preventDefault();
										void copyToClipboard(row.id, tc('copyId.toastWithType', { type: 'Entitlement' }));
									}}
									className='flex gap-2 items-center cursor-pointer'>
									<Copy className='h-4 w-4' />
									<span>{tc('copyId.genericLabel')}</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									onSelect={(e) => {
										e.preventDefault();
										handleEdit(row);
									}}
									className='flex gap-2 items-center cursor-pointer'>
									<Pencil className='h-4 w-4' />
									<span>{t('entitlements.overridesTable.edit')}</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];

	if (entitlements.length === 0) {
		return (
			<div className='text-center py-8 text-content-muted'>
				<p>{t('entitlements.overridesTable.noEntitlements')}</p>
			</div>
		);
	}

	return (
		<>
			<FlexpriceTable showEmptyRow columns={columns} data={enrichedEntitlements} />
			<EditEntitlementDrawer
				isOpen={drawerOpen}
				onOpenChange={handleCloseDrawer}
				entitlement={selectedEntitlement}
				onSave={handleSaveOverride}
				onReset={handleResetOverride}
			/>
			<Sheet isOpen={configSheet.open} onOpenChange={(open) => setConfigSheet((s) => ({ ...s, open }))} title={configSheet.name} size='md'>
				<div className='p-6'>{configSheet.value && <JsonCodeBlock value={configSheet.value} />}</div>
			</Sheet>
		</>
	);
};

export default EntitlementOverridesTable;
