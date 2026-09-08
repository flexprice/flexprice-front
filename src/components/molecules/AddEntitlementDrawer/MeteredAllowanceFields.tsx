import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Select, Spacer } from '@/components/atoms';
import {
	Entitlement,
	ENTITLEMENT_AGGREGATION_MODE,
	ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR,
	ENTITLEMENT_GRANT_DURATION_UNIT,
	ENTITLEMENT_GRANT_MEASURE,
} from '@/models/Entitlement';
// AllowanceMode lives in its own module so this file only exports a component.
import { cn } from '@/lib/utils';
import { deriveAllowanceMode, patchForMode } from './allowanceMode';

export interface MeteredAllowanceErrors {
	grant_quota?: string;
	grant_duration_value?: string;
}

interface Props {
	value: Partial<Entitlement>;
	onChange: (patch: Partial<Entitlement>) => void;
	errors?: MeteredAllowanceErrors;
	/** Unit label for the quantity measure, e.g. "calls". */
	unitLabel: string;
	/** Slot for the existing reporting-unit calculator button. */
	quotaSuffix?: React.ReactNode;
}

const RadioRow: FC<{
	selected: boolean;
	disabled?: boolean;
	label: string;
	description: string;
	onSelect: () => void;
}> = ({ selected, disabled, label, description, onSelect }) => (
	<label
		className={cn(
			'flex gap-2.5 items-start px-3 py-2 border-b last:border-b-0 cursor-pointer',
			selected && 'bg-active',
			disabled && 'opacity-50 cursor-not-allowed',
		)}>
		<input type='radio' className='mt-1 accent-current' checked={selected} disabled={disabled} onChange={() => !disabled && onSelect()} />
		<span>
			<span className={cn('block text-sm', selected && 'font-medium')}>{label}</span>
			<span className='block text-xs text-muted-foreground mt-0.5'>{description}</span>
		</span>
	</label>
);

const MeteredAllowanceFields: FC<Props> = ({ value, onChange, errors, unitLabel, quotaSuffix }) => {
	const { t } = useTranslation('catalog');
	const mode = deriveAllowanceMode(value);

	const durationUnit = value.grant_duration_unit ?? ENTITLEMENT_GRANT_DURATION_UNIT.DAY;
	const measure = value.grant_measure ?? ENTITLEMENT_GRANT_MEASURE.QUANTITY;

	const durationOptions = useMemo(
		() => [
			{ label: t('entitlements.addDrawer.durationHour'), value: ENTITLEMENT_GRANT_DURATION_UNIT.HOUR },
			{ label: t('entitlements.addDrawer.durationDay'), value: ENTITLEMENT_GRANT_DURATION_UNIT.DAY },
			{ label: t('entitlements.addDrawer.durationWeek'), value: ENTITLEMENT_GRANT_DURATION_UNIT.WEEK },
		],
		[t],
	);

	const measureOptions = useMemo(
		() => [
			// Show the feature's own unit ("calls") rather than a generic "units":
			// the dropdown is the only place the unit is named now.
			{ label: unitLabel, value: ENTITLEMENT_GRANT_MEASURE.QUANTITY },
			{ label: t('entitlements.addDrawer.measureAmount'), value: ENTITLEMENT_GRANT_MEASURE.AMOUNT },
		],
		[t, unitLabel],
	);

	// Windows never cross the cycle boundary, so a 30-day cycle is the honest
	// yardstick for "how many of these will a customer see".
	const preview = useMemo(() => {
		if (mode !== 'recurring') return null;
		const n = value.grant_duration_value ?? 1;
		const hours = { hour: 1, day: 24, week: 168 }[durationUnit as 'hour' | 'day' | 'week'] ?? 24;
		const windows = Math.max(1, Math.floor((30 * 24) / (n * hours)));
		const quota = Number(value.grant_quota ?? 0);
		return { windows, total: quota * windows, quota };
	}, [mode, value.grant_duration_value, value.grant_quota, durationUnit]);

	return (
		<div className='space-y-3.5'>
			<div>
				<p className='text-[13px] font-medium text-muted-foreground mb-1.5'>{t('entitlements.addDrawer.includedLabel')}</p>
				<div className='rounded-md border overflow-hidden'>
					<RadioRow
						selected={mode === 'recurring'}
						label={t('entitlements.addDrawer.modeRecurringLabel')}
						description={t('entitlements.addDrawer.modeRecurringDescription')}
						onSelect={() => onChange(patchForMode('recurring', value))}
					/>
					<RadioRow
						selected={mode === 'period'}
						label={t('entitlements.addDrawer.modePeriodLabel')}
						description={t('entitlements.addDrawer.modePeriodDescription')}
						onSelect={() => onChange(patchForMode('period', value))}
					/>
					<RadioRow
						selected={mode === 'unlimited'}
						label={t('entitlements.addDrawer.modeUnlimitedLabel')}
						description={t('entitlements.addDrawer.modeUnlimitedDescription')}
						onSelect={() => onChange(patchForMode('unlimited', value))}
					/>
				</div>
			</div>

			{mode !== 'unlimited' && (
				<div>
					<p className='text-[13px] font-medium text-muted-foreground mb-1.5'>{t('entitlements.addDrawer.allowanceLabel')}</p>
					<div className='flex gap-2 items-start'>
						<div className='flex-1 min-w-0'>
							<Input
								error={errors?.grant_quota}
								placeholder={t('entitlements.addDrawer.enterValuePlaceholder')}
								variant='formatted-number'
								value={value.grant_quota != null ? String(value.grant_quota) : ''}
								onChange={(v) => onChange({ grant_quota: v === '' ? undefined : String(v) })}
								suffix={quotaSuffix}
							/>
						</div>
						<div className='w-[112px] shrink-0'>
							<Select
								options={measureOptions}
								value={measure}
								onChange={(v) => onChange({ grant_measure: v as ENTITLEMENT_GRANT_MEASURE })}
							/>
						</div>
					</div>
					<p className='text-xs text-muted-foreground mt-1'>
						{measure === ENTITLEMENT_GRANT_MEASURE.AMOUNT
							? t('entitlements.addDrawer.measureAmountDescription')
							: t('entitlements.addDrawer.measureQuantityDescription')}
					</p>
				</div>
			)}

			{mode === 'recurring' && (
				<>
					<div>
						<p className='text-[13px] font-medium text-muted-foreground mb-1.5'>{t('entitlements.addDrawer.refreshesEveryLabel')}</p>
						<div className='flex gap-2'>
							<div className='w-[84px] shrink-0'>
								<Input
									error={errors?.grant_duration_value}
									variant='formatted-number'
									value={value.grant_duration_value != null ? String(value.grant_duration_value) : ''}
									onChange={(v) => onChange({ grant_duration_value: v === '' ? undefined : Number(v) })}
								/>
							</div>
							<div className='flex-1'>
								<Select
									options={durationOptions}
									value={durationUnit}
									onChange={(v) => onChange({ grant_duration_unit: v as ENTITLEMENT_GRANT_DURATION_UNIT })}
								/>
							</div>
						</div>
					</div>

					<div>
						<p className='text-[13px] font-medium text-muted-foreground mb-1.5'>{t('entitlements.addDrawer.windowStartsLabel')}</p>
						<div className='rounded-md border overflow-hidden'>
							<RadioRow
								selected={
									(value.grant_allocation_behavior ?? ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR.FIRST_USAGE) ===
									ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR.FIRST_USAGE
								}
								label={t('entitlements.addDrawer.windowStartsFirstUsage')}
								description={t('entitlements.addDrawer.windowStartsFirstUsageDescription')}
								onSelect={() => onChange({ grant_allocation_behavior: ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR.FIRST_USAGE })}
							/>
							<RadioRow
								selected={value.grant_allocation_behavior === ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR.UNIT_START}
								label={t('entitlements.addDrawer.windowStartsUnitStart', { unit: durationUnit })}
								description={t('entitlements.addDrawer.windowStartsUnitStartDescription')}
								onSelect={() => onChange({ grant_allocation_behavior: ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR.UNIT_START })}
							/>
						</div>
					</div>
				</>
			)}

			{/* What the config produces — the cheapest guard against configuring an
			    allowance far larger or smaller than intended. */}
			<div className='rounded-md border bg-muted/40 px-3 py-2.5'>
				<div className='flex justify-between items-baseline gap-2 mb-1'>
					<span className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
						{t('entitlements.addDrawer.previewTitle')}
					</span>
					{preview && (
						<span className='text-[11px] text-muted-foreground font-mono'>
							{t('entitlements.addDrawer.previewWindowsPerCycle', { count: preview.windows })}
						</span>
					)}
				</div>
				<p className='text-xs text-muted-foreground leading-relaxed'>
					{mode === 'unlimited'
						? t('entitlements.addDrawer.previewUnlimitedFoot')
						: mode === 'period'
							? t('entitlements.addDrawer.previewPeriodFoot', { quota: `${value.grant_quota ?? 0} ${unitLabel}` })
							: t('entitlements.addDrawer.previewRecurringFoot', {
									total: `${preview?.total.toLocaleString() ?? 0} ${unitLabel}`,
									quota: `${Number(value.grant_quota ?? 0).toLocaleString()} ${unitLabel}`,
								})}
				</p>
			</div>

			{mode !== 'unlimited' && (
				<details className='border-t pt-3'>
					<summary className='cursor-pointer text-xs font-medium text-muted-foreground'>
						{t('entitlements.addDrawer.advancedLabel')}
					</summary>
					<div className='pt-3'>
						<p className='text-[13px] font-medium text-muted-foreground mb-1.5'>{t('entitlements.addDrawer.stackingLabel')}</p>
						<div className='rounded-md border overflow-hidden'>
							<RadioRow
								selected={(value.aggregation_mode ?? ENTITLEMENT_AGGREGATION_MODE.ADDITIVE) === ENTITLEMENT_AGGREGATION_MODE.ADDITIVE}
								label={t('entitlements.addDrawer.stackingAdditive')}
								description={t('entitlements.addDrawer.stackingAdditiveDescription')}
								onSelect={() => onChange({ aggregation_mode: ENTITLEMENT_AGGREGATION_MODE.ADDITIVE })}
							/>
							<RadioRow
								selected={value.aggregation_mode === ENTITLEMENT_AGGREGATION_MODE.PARALLEL}
								label={t('entitlements.addDrawer.stackingParallel')}
								description={t('entitlements.addDrawer.stackingParallelDescription')}
								onSelect={() => onChange({ aggregation_mode: ENTITLEMENT_AGGREGATION_MODE.PARALLEL })}
							/>
						</div>
					</div>
				</details>
			)}

			<Spacer className='!my-2' />
			<p className='text-xs text-muted-foreground bg-muted/40 border-l-2 border-l-primary/40 px-3 py-2 rounded-r'>
				{t('entitlements.addDrawer.overageHint')}
			</p>
		</div>
	);
};

export default MeteredAllowanceFields;
