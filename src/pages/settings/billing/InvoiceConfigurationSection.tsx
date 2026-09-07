import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, FieldWithInfo, Input, Loader, Select } from '@/components/atoms';
import type { FinalizationDelayUnit, InvoiceConfig, InvoiceNumberFormat } from '@/types/dto/BillingSettings';
import {
	FALLBACK_INVOICE_CONFIG,
	FINALIZATION_DELAY_UNIT_SECONDS,
	getInvoiceConfigValidationErrorKey,
	normalizeInvoiceConfig,
	parseSequenceDigitsInput,
	toFinalizationDelayDisplay,
} from '@/types/dto/BillingSettings';
import { useInvoiceConfiguration } from './useInvoiceConfiguration';
import { buildInvoiceNumberPreview } from './invoicePreview';
import SettingsFormActions from '../SettingsFormActions';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';

const DATE_FORMAT_OPTIONS: InvoiceNumberFormat[] = ['YYYYMM', 'YYYY', 'YYYYMMDD', 'YYMMDD', 'YY'];
const DELAY_UNIT_OPTIONS: FinalizationDelayUnit[] = ['seconds', 'minutes', 'hours', 'days'];

const configuredDelaySeconds = (config: InvoiceConfig): number =>
	config.finalization_delay_seconds ?? FALLBACK_INVOICE_CONFIG.finalization_delay_seconds ?? 0;

const InvoiceConfigurationSection = () => {
	const { t } = useTranslation(['settings', 'common']);
	const { configuration, isLoading, updateConfiguration, resetToDefaults } = useInvoiceConfiguration();
	const { can, isSuperAdmin } = useCurrentUserPermissions();
	// Backed by SettingsApi (a generic settings key), whose PUT/DELETE the backend restricts
	// to Super Admin regardless of setting:write — see SamlSsoTab's own settings-gating note.
	const canWriteSetting = can('setting', 'write') && isSuperAdmin;
	const [draft, setDraft] = useState<InvoiceConfig>(configuration);
	const [suffixLengthInput, setSuffixLengthInput] = useState(String(configuration.suffix_length));
	// The delay is stored in seconds; the UI edits it as value + unit (7200 → "2 hours").
	const [delayValueInput, setDelayValueInput] = useState(String(toFinalizationDelayDisplay(configuredDelaySeconds(configuration)).value));
	const [delayUnit, setDelayUnit] = useState<FinalizationDelayUnit>(toFinalizationDelayDisplay(configuredDelaySeconds(configuration)).unit);

	useEffect(() => {
		setDraft(configuration);
		setSuffixLengthInput(String(configuration.suffix_length));
		const delayDisplay = toFinalizationDelayDisplay(configuredDelaySeconds(configuration));
		setDelayValueInput(String(delayDisplay.value));
		setDelayUnit(delayDisplay.unit);
	}, [configuration]);

	const preview = useMemo(() => {
		const parsedSuffixLength = parseSequenceDigitsInput(suffixLengthInput);
		return buildInvoiceNumberPreview({
			...draft,
			suffix_length: parsedSuffixLength ?? draft.suffix_length,
		});
	}, [draft, suffixLengthInput]);

	const updateDraft = <K extends keyof InvoiceConfig>(key: K, value: InvoiceConfig[K]) => {
		setDraft((prev) => ({ ...prev, [key]: value }));
	};

	const handleReset = () => {
		resetToDefaults.mutate(undefined, {
			onSuccess: () => toast.success(t('billing.invoiceConfiguration.resetSuccess')),
			onError: () => toast.error(t('billing.invoiceConfiguration.resetError')),
		});
	};

	/** Current delay in seconds; an empty/invalid value input falls back to the draft's stored delay. */
	const delaySecondsFromInputs = (): number => {
		const parsed = parseSequenceDigitsInput(delayValueInput);
		if (parsed === null || parsed < 0) return configuredDelaySeconds(draft);
		return parsed * FINALIZATION_DELAY_UNIT_SECONDS[delayUnit];
	};

	const buildConfigForSave = (): InvoiceConfig => {
		const parsedSuffixLength = parseSequenceDigitsInput(suffixLengthInput);
		return {
			...draft,
			finalization_delay_seconds: delaySecondsFromInputs(),
			...(parsedSuffixLength !== null ? { suffix_length: parsedSuffixLength } : {}),
		};
	};

	const normalizeSuffixLengthInput = () => {
		const parsed = parseSequenceDigitsInput(suffixLengthInput);
		const normalized = Math.min(10, Math.max(1, parsed ?? draft.suffix_length));
		setSuffixLengthInput(String(normalized));
		updateDraft('suffix_length', normalized);
	};

	const handleSave = () => {
		const configForSave = buildConfigForSave();
		const validationErrorKey = getInvoiceConfigValidationErrorKey(configForSave);

		if (validationErrorKey) {
			toast.error(t(`billing.invoiceConfiguration.validation.${validationErrorKey}`));
			return;
		}

		const normalized = normalizeInvoiceConfig(configForSave);
		setDraft(normalized);
		setSuffixLengthInput(String(normalized.suffix_length));
		const delayDisplay = toFinalizationDelayDisplay(configuredDelaySeconds(normalized));
		setDelayValueInput(String(delayDisplay.value));
		setDelayUnit(delayDisplay.unit);

		updateConfiguration.mutate(normalized, {
			onSuccess: () => toast.success(t('billing.invoiceConfiguration.saveSuccess')),
			onError: () => toast.error(t('billing.invoiceConfiguration.saveError')),
		});
	};

	const dateFormatOptions = DATE_FORMAT_OPTIONS.map((format) => ({
		value: format,
		label: t(`billing.invoiceConfiguration.dateFormats.${format}`),
	}));

	const fieldLabels = {
		prefix: t('billing.invoiceConfiguration.fields.prefix'),
		separator: t('billing.invoiceConfiguration.fields.separator'),
		dateFormat: t('billing.invoiceConfiguration.fields.dateFormat'),
		timezone: t('billing.invoiceConfiguration.fields.timezone'),
		startSequence: t('billing.invoiceConfiguration.fields.startSequence'),
		sequenceDigits: t('billing.invoiceConfiguration.fields.sequenceDigits'),
		paymentDueDays: t('billing.invoiceConfiguration.fields.paymentDueDays'),
		finalizationDelay: t('billing.invoiceConfiguration.fields.finalizationDelay'),
	};

	const delayUnitOptions = DELAY_UNIT_OPTIONS.map((unit) => ({
		value: unit,
		label: t(`billing.invoiceConfiguration.delayUnits.${unit}`),
	}));

	return (
		<Card variant='default' className='rounded-xl border border-line bg-surface shadow-sm'>
			<CardHeader title={t('billing.invoiceConfiguration.title')} titleClassName='text-lg font-medium text-content-zinc-strong' />
			{isLoading ? (
				<div className='flex min-h-[200px] items-center justify-center'>
					<Loader />
				</div>
			) : (
				<>
					<div className='mb-6 rounded-lg border border-line bg-surface-subtle p-4'>
						<p className='text-xs font-medium uppercase tracking-wide text-content-zinc-subtle'>
							{t('billing.invoiceConfiguration.previewLabel')}
						</p>
						<div className='mt-3 flex items-center justify-between gap-1'>
							<span className='font-mono text-xl font-medium text-content-heading'>{preview}</span>
							<span className='text-sm font-medium text-content-zinc-tertiary'>{t('billing.invoiceConfiguration.nextInvoiceNumber')}</span>
						</div>
					</div>

					<div className='grid grid-cols-1 items-start gap-x-6 gap-y-5 md:grid-cols-2'>
						<FieldWithInfo
							label={fieldLabels.prefix}
							description={t('billing.invoiceConfiguration.hints.prefix')}
							infoAriaLabel={t('info.ariaLabel', { field: fieldLabels.prefix })}
							disabled={updateConfiguration.isPending}>
							<Input value={draft.prefix} onChange={(value) => updateDraft('prefix', value)} disabled={updateConfiguration.isPending} />
						</FieldWithInfo>
						<FieldWithInfo
							label={fieldLabels.separator}
							description={t('billing.invoiceConfiguration.hints.separator')}
							infoAriaLabel={t('info.ariaLabel', { field: fieldLabels.separator })}
							disabled={updateConfiguration.isPending}>
							<Input
								value={draft.separator}
								onChange={(value) => updateDraft('separator', value)}
								disabled={updateConfiguration.isPending}
							/>
						</FieldWithInfo>
						<FieldWithInfo
							label={fieldLabels.dateFormat}
							description={t('billing.invoiceConfiguration.hints.dateFormat')}
							infoAriaLabel={t('info.ariaLabel', { field: fieldLabels.dateFormat })}
							disabled={updateConfiguration.isPending}>
							<Select
								value={draft.format}
								options={dateFormatOptions}
								onChange={(value) => updateDraft('format', value as InvoiceNumberFormat)}
								disabled={updateConfiguration.isPending}
							/>
						</FieldWithInfo>
						<FieldWithInfo
							label={fieldLabels.timezone}
							description={t('billing.invoiceConfiguration.hints.timezone')}
							infoAriaLabel={t('info.ariaLabel', { field: fieldLabels.timezone })}
							disabled={updateConfiguration.isPending}>
							<Input value={draft.timezone} onChange={(value) => updateDraft('timezone', value)} disabled={updateConfiguration.isPending} />
						</FieldWithInfo>
						<FieldWithInfo
							label={fieldLabels.startSequence}
							description={t('billing.invoiceConfiguration.hints.startSequence')}
							infoAriaLabel={t('info.ariaLabel', { field: fieldLabels.startSequence })}
							disabled={updateConfiguration.isPending}>
							<Input
								type='number'
								value={String(draft.start_sequence)}
								variant='number'
								onChange={(value) => updateDraft('start_sequence', Number(value || 0))}
								disabled={updateConfiguration.isPending}
							/>
						</FieldWithInfo>
						<FieldWithInfo
							label={fieldLabels.sequenceDigits}
							description={t('billing.invoiceConfiguration.hints.sequenceDigits')}
							infoAriaLabel={t('info.ariaLabel', { field: fieldLabels.sequenceDigits })}
							disabled={updateConfiguration.isPending}>
							<Input
								min={1}
								max={10}
								inputMode='numeric'
								value={suffixLengthInput}
								variant='integer'
								onChange={setSuffixLengthInput}
								onBlur={normalizeSuffixLengthInput}
								disabled={updateConfiguration.isPending}
							/>
						</FieldWithInfo>
						<FieldWithInfo
							label={fieldLabels.paymentDueDays}
							description={t('billing.invoiceConfiguration.hints.paymentDueDays')}
							infoAriaLabel={t('info.ariaLabel', { field: fieldLabels.paymentDueDays })}
							disabled={updateConfiguration.isPending}>
							<Input
								type='number'
								value={String(draft.due_date_days)}
								variant='number'
								onChange={(value) => updateDraft('due_date_days', Number(value || 0))}
								disabled={updateConfiguration.isPending}
							/>
						</FieldWithInfo>
						<FieldWithInfo
							label={fieldLabels.finalizationDelay}
							description={t('billing.invoiceConfiguration.hints.finalizationDelay')}
							infoAriaLabel={t('info.ariaLabel', { field: fieldLabels.finalizationDelay })}
							disabled={updateConfiguration.isPending}>
							<div className='flex gap-2'>
								<div className='flex-1 min-w-0'>
									<Input
										inputMode='numeric'
										variant='integer'
										value={delayValueInput}
										onChange={setDelayValueInput}
										disabled={updateConfiguration.isPending}
									/>
								</div>
								<div className='w-32 shrink-0'>
									<Select
										value={delayUnit}
										options={delayUnitOptions}
										onChange={(value) => setDelayUnit(value as FinalizationDelayUnit)}
										disabled={updateConfiguration.isPending}
									/>
								</div>
							</div>
						</FieldWithInfo>
					</div>

					<SettingsFormActions
						onReset={handleReset}
						onSave={handleSave}
						isSaving={updateConfiguration.isPending || resetToDefaults.isPending}
						disabled={isLoading || !canWriteSetting}
						disabledReason={canWriteSetting ? undefined : t('superAdmin.writeDeniedTooltip')}
					/>
				</>
			)}
		</Card>
	);
};

export default InvoiceConfigurationSection;
