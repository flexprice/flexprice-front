import { FC, useState, useMemo } from 'react';
import { Sheet } from '@/components/atoms';
import StatusChip, { getFeatureTypeTone } from '@/components/atoms/StatusChip';
import { FlexpriceTable, ColumnData } from '@/components/molecules';
import JsonCodeBlock from '@/components/molecules/Events/JsonCodeBlock';
import { FEATURE_TYPE } from '@/models';
import { Pencil, Info, Copy } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { EntitlementOverrideRequest } from '@/types/dto/Subscription';
import { EntitlementResponse } from '@/types/dto/Entitlement';
import { JsonObject } from '@/types/common';
import EditEntitlementDrawer from './EditEntitlementDrawer';
import { useTranslation } from 'react-i18next';
import { copyToClipboard } from '@/utils/common/helper_functions';

/** Plan/addon entitlement row with local override display fields applied. */
export interface EnrichedEntitlementRow extends EntitlementResponse {
	displayUsageLimit: number | null;
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
		const label =
			type === 'metered'
				? t('entitlements.overridesTable.featureTypeMetered')
				: type === 'boolean'
					? t('entitlements.overridesTable.featureTypeBoolean')
					: type === 'static'
						? t('entitlements.overridesTable.featureTypeStatic')
						: type === 'config'
							? tc('labels.config')
							: featureType;
		return <StatusChip tone={getFeatureTypeTone(featureType)} label={label} />;
	};

	const getEntitlementValue = (entitlement: EnrichedEntitlementRow) => {
		const featureType = entitlement.feature_type;
		const hasOverride = entitlement.hasOverride;

		if (featureType === FEATURE_TYPE.METERED) {
			const limit = entitlement.displayUsageLimit;
			const originalLimit = entitlement.usage_limit;
			const resetPeriod = entitlement.usage_reset_period;
			const valueText =
				limit !== null && limit !== undefined
					? `${limit.toLocaleString()}${resetPeriod ? t('entitlements.overridesTable.perPeriodSuffix', { period: resetPeriod.toLowerCase() }) : ''}`
					: t('entitlements.overridesTable.unlimited');

			// Check if there's an override and the value has changed (including null to number or vice versa)
			const hasChangedValue = hasOverride && limit !== originalLimit;

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
											{t('entitlements.overridesTable.tooltipUsageLimit', {
												from: originalLimit === null ? t('entitlements.overridesTable.unlimited') : String(originalLimit?.toLocaleString()),
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
									<BsThreeDotsVertical className='text-base text-muted-foreground hover:text-foreground transition-colors' />
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
