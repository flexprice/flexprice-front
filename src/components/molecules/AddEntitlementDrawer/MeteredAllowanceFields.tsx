import { FC, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Clock, Info } from 'lucide-react';
import { Checkbox, FieldWithInfo, Input, OptionCards, Select } from '@/components/atoms';
import {
	Entitlement,
	ENTITLEMENT_AGGREGATION_MODE,
	ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR,
	ENTITLEMENT_GRANT_DURATION_UNIT,
	ENTITLEMENT_GRANT_MEASURE,
} from '@/models/Entitlement';
import { isUnlimitedDraft, setPeriod, setUnlimited } from './allowanceMode';

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
	/**
	 * The allowance as it is stored, and the window currently running. Supplied only
	 * when editing something live — an edit the open window cannot be re-cut for
	 * waits until that window ends, and nothing else on the form says so.
	 */
	savedValue?: Partial<Entitlement>;
	liveWindow?: { valid_to: string; usage: string | number };
}

const CADENCE_KEY: Record<ENTITLEMENT_GRANT_DURATION_UNIT, string> = {
	[ENTITLEMENT_GRANT_DURATION_UNIT.HOUR]: 'entitlements.addDrawer.cadenceHourly',
	[ENTITLEMENT_GRANT_DURATION_UNIT.DAY]: 'entitlements.addDrawer.cadenceDaily',
	[ENTITLEMENT_GRANT_DURATION_UNIT.WEEK]: 'entitlements.addDrawer.cadenceWeekly',
	[ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD]: 'entitlements.addDrawer.cadenceBillingPeriod',
};

const UNIT_ORDER = [
	ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD,
	ENTITLEMENT_GRANT_DURATION_UNIT.HOUR,
	ENTITLEMENT_GRANT_DURATION_UNIT.DAY,
	ENTITLEMENT_GRANT_DURATION_UNIT.WEEK,
];

const MeteredAllowanceFields: FC<Props> = ({ value, onChange, errors, unitLabel, quotaSuffix, savedValue, liveWindow }) => {
	const { t } = useTranslation('catalog');

	const unlimited = isUnlimitedDraft(value);
	const measure = value.grant_measure ?? ENTITLEMENT_GRANT_MEASURE.QUANTITY;
	const durationUnit = value.grant_duration_unit ?? ENTITLEMENT_GRANT_DURATION_UNIT.DAY;
	const isCycleWindow = durationUnit === ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD;
	const durationValue = value.grant_duration_value;

	// Ticking "no limit" pins the window to the cycle, so the hour/day/week choice
	// has to be remembered to survive unticking it.
	const lastRecurringUnit = useRef<ENTITLEMENT_GRANT_DURATION_UNIT>(ENTITLEMENT_GRANT_DURATION_UNIT.DAY);
	useEffect(() => {
		if (!isCycleWindow) lastRecurringUnit.current = durationUnit;
	}, [isCycleWindow, durationUnit]);

	const cadenceOptions = useMemo(() => UNIT_ORDER.map((unit) => ({ label: t(CADENCE_KEY[unit]), value: unit })), [t]);

	const measureOptions = useMemo(
		() => [
			{ label: t('entitlements.addDrawer.typeQuantity'), value: ENTITLEMENT_GRANT_MEASURE.QUANTITY },
			{ label: t('entitlements.addDrawer.typeAmount'), value: ENTITLEMENT_GRANT_MEASURE.AMOUNT },
		],
		[t],
	);

	const windowStartOptions = useMemo(
		() => [
			{ label: t('entitlements.addDrawer.windowStartsCardFirstUsage'), value: ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR.FIRST_USAGE },
			{ label: t('entitlements.addDrawer.windowStartsCardUnitStart'), value: ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR.UNIT_START },
		],
		[t],
	);

	const stackingOptions = useMemo(
		() => [
			{ label: t('entitlements.addDrawer.stackingAdditive'), value: ENTITLEMENT_AGGREGATION_MODE.ADDITIVE },
			{ label: t('entitlements.addDrawer.stackingParallel'), value: ENTITLEMENT_AGGREGATION_MODE.PARALLEL },
		],
		[t],
	);

	// Windows never cross the cycle boundary, so a 30-day cycle is the honest
	// yardstick for "how many of these will a customer see".
	const preview = useMemo(() => {
		if (unlimited || isCycleWindow) return null;
		// The input accepts any number while typing; 0 would divide to Infinity.
		if (durationValue == null || durationValue < 1) return null;
		const hours = { hour: 1, day: 24, week: 168 }[durationUnit as 'hour' | 'day' | 'week'] ?? 24;
		const windows = Math.max(1, Math.floor((30 * 24) / (durationValue * hours)));
		const quota = Number(value.grant_quota ?? 0);
		return { windows, total: quota * windows, quota };
	}, [unlimited, isCycleWindow, durationUnit, durationValue, value.grant_quota]);

	const windowStart = value.grant_allocation_behavior ?? ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR.FIRST_USAGE;
	const stacking = value.aggregation_mode ?? ENTITLEMENT_AGGREGATION_MODE.ADDITIVE;

	const valueUnit = measure === ENTITLEMENT_GRANT_MEASURE.AMOUNT ? t('entitlements.addDrawer.measureAmount') : unitLabel;

	// Only the amount can re-cut a running window. A cadence, measure or stacking
	// change reshapes it, and a value below what is already consumed leaves nothing
	// to grant — both wait for the window to end, which is otherwise invisible: you
	// save, nothing moves, and there is no way to tell it worked.
	const deferredNote = useMemo(() => {
		if (!savedValue || !liveWindow?.valid_to) return null;
		const when = new Date(liveWindow.valid_to).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});

		const used = Number(liveWindow.usage ?? 0);
		const quota = Number(value.grant_quota ?? 0);
		if (!unlimited && value.grant_quota != null && value.grant_quota !== '' && quota < used) {
			return t('entitlements.addDrawer.deferredCut', { used: `${used.toLocaleString()} ${valueUnit}`, when });
		}

		const reshaped =
			value.grant_duration_unit !== savedValue.grant_duration_unit ||
			(value.grant_duration_value ?? null) !== (savedValue.grant_duration_value ?? null) ||
			value.grant_measure !== savedValue.grant_measure ||
			value.aggregation_mode !== savedValue.aggregation_mode;

		return reshaped ? t('entitlements.addDrawer.deferredCadence', { when }) : null;
		 
	}, [savedValue, liveWindow, value, unlimited, valueUnit, t]);

	// A caption, not a banner: one line about what this config produces, and only
	// once there is something real to describe — a summary full of zeroes is noise.
	const summary = (() => {
		if (unlimited) return t('entitlements.addDrawer.previewUnlimitedFoot');
		const quota = Number(value.grant_quota ?? 0);
		if (!quota) return null;
		if (isCycleWindow) return t('entitlements.addDrawer.previewPeriodFoot', { quota: `${quota.toLocaleString()} ${valueUnit}` });
		if (!preview) return null;
		return t('entitlements.addDrawer.previewRecurringFoot', {
			windows: preview.windows,
			total: `${preview.total.toLocaleString()} ${valueUnit}`,
			quota: `${quota.toLocaleString()} ${valueUnit}`,
		});
	})();

	return (
		<div className='space-y-5'>
			<OptionCards
				label={t('entitlements.addDrawer.allowanceTypeLabel')}
				info={t('entitlements.addDrawer.typeInfo')}
				infoAriaLabel={t('entitlements.addDrawer.infoAria', { field: t('entitlements.addDrawer.allowanceTypeLabel') })}
				options={measureOptions}
				value={measure}
				onChange={(v) => onChange({ grant_measure: v })}
			/>

			<div className='grid grid-cols-1 items-start gap-4 sm:grid-cols-2'>
				<div>
					<Input
						label={t('entitlements.addDrawer.allowanceValueLabel')}
						error={errors?.grant_quota}
						placeholder={t('entitlements.addDrawer.enterValuePlaceholder')}
						variant='formatted-number'
						disabled={unlimited}
						value={unlimited ? '' : value.grant_quota != null ? String(value.grant_quota) : ''}
						onChange={(v) => onChange({ grant_quota: v === '' ? undefined : String(v) })}
						suffix={quotaSuffix}
					/>
					<div className='mt-2.5'>
						<Checkbox
							id='allowance-no-limit'
							label={t('entitlements.addDrawer.noLimitLabel')}
							checked={unlimited}
							onCheckedChange={(checked) => onChange(setUnlimited(checked, lastRecurringUnit.current))}
						/>
					</div>
				</div>

				<Select
					label={t('entitlements.addDrawer.refreshPeriodLabel')}
					options={cadenceOptions}
					value={durationUnit}
					// An unlimited value has nothing to reset, so a cycle-length window is
					// the only shape the API accepts for it.
					disabled={unlimited}
					onChange={(v) => onChange(setPeriod(value, v as ENTITLEMENT_GRANT_DURATION_UNIT))}
				/>
			</div>

			{/* The app's info shape — ServiceAccountDrawer, SecretKeyDrawer and
			    SubscriptionLineItemQuantityModifyDialog all use it. */}
			<div className='rounded-md border border-info-line bg-info-muted p-3'>
				<div className='flex items-start gap-2'>
					<Info className='mt-0.5 size-4 shrink-0 text-info' aria-hidden />
					<div className='min-w-0 text-sm text-info-deep'>
						{summary && <p className='mb-1 font-medium'>{summary}</p>}
						<p>{t('entitlements.addDrawer.overageHint')}</p>
					</div>
				</div>
			</div>

			{deferredNote && (
				<p className='-mt-2 flex items-start gap-1.5 text-xs text-content-muted'>
					<Clock className='mt-0.5 size-3.5 shrink-0' />
					{deferredNote}
				</p>
			)}

			{!unlimited && (
				<details className='group rounded-lg border border-line'>
					<summary className='flex cursor-pointer list-none items-center gap-2 px-3 py-2.5'>
						<ChevronRight className='size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90' />
						<span className='text-sm font-medium text-content-secondary'>{t('entitlements.addDrawer.advancedLabel')}</span>
					</summary>
					<div className='grid grid-cols-1 gap-4 border-t border-line px-3 py-3.5 sm:grid-cols-2'>
						{!isCycleWindow && (
							<FieldWithInfo
								label={t('entitlements.addDrawer.windowStartsLabel')}
								description={t('entitlements.addDrawer.windowStartsInfo')}
								infoAriaLabel={t('entitlements.addDrawer.infoAria', { field: t('entitlements.addDrawer.windowStartsLabel') })}>
								<Select
									options={windowStartOptions}
									value={windowStart}
									ariaLabel={t('entitlements.addDrawer.windowStartsLabel')}
									onChange={(v) => onChange({ grant_allocation_behavior: v as ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR })}
								/>
							</FieldWithInfo>
						)}
						<FieldWithInfo
							label={t('entitlements.addDrawer.stackingLabel')}
							description={t('entitlements.addDrawer.stackingInfo')}
							infoAriaLabel={t('entitlements.addDrawer.infoAria', { field: t('entitlements.addDrawer.stackingLabel') })}>
							<Select
								options={stackingOptions}
								value={stacking}
								ariaLabel={t('entitlements.addDrawer.stackingLabel')}
								onChange={(v) => onChange({ aggregation_mode: v as ENTITLEMENT_AGGREGATION_MODE })}
							/>
						</FieldWithInfo>
					</div>
				</details>
			)}
		</div>
	);
};

export default MeteredAllowanceFields;
