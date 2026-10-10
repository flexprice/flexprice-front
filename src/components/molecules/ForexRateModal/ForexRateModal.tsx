import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DateTimePicker, Input, Label, Select } from '@/components/atoms';
import Dialog from '@/components/atoms/Dialog';
import { currencyOptions } from '@/constants/constants';
import { formatFxPair, formatFxRate } from '@/utils/fx/formatFxRate';
import { type FxWindow, windowsOverlap } from '@/utils/fx/windowsOverlap';

export interface ForexRateFormValues {
	from_currency: string;
	to_currency: string;
	rate: string;
	start_date?: string;
	end_date?: string;
}

interface ForexRateFieldErrors {
	pair?: string;
	rate?: string;
	window?: string;
}

export interface ForexRateModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	/** Present = edit mode: the pair is read-only. */
	data?: ForexRateFormValues;
	/** Both set = the pair is fixed and read-only, also in create mode. */
	lockedFrom?: string;
	lockedTo?: string;
	/** Adds the Valid from / Valid until pickers. */
	showWindow?: boolean;
	/** Edit mode normally forbids clearing a saved date; true allows it (local rows). */
	allowClearDates?: boolean;
	/** Other rows' windows; an overlapping window is rejected. */
	existingWindows?: FxWindow[];
	isSaving?: boolean;
	onSave: (values: ForexRateFormValues) => void;
}

const RATE_PATTERN = /^\d+(\.\d+)?$/;

const WINDOW_FIELDS = ['start_date', 'end_date'] as const;

const fiatOptions = currencyOptions.map((option) => ({ label: option.label, value: option.value.toLowerCase() }));

/** The form inside the dialog; mounted fresh on every open, so its state starts from the props. */
const ForexRateForm = ({
	onOpenChange,
	data,
	lockedFrom,
	lockedTo,
	showWindow = false,
	allowClearDates = false,
	existingWindows,
	isSaving = false,
	onSave,
}: Omit<ForexRateModalProps, 'isOpen'>) => {
	const { t } = useTranslation('settings');
	const isEdit = !!data;
	const pairLocked = isEdit || (!!lockedFrom && !!lockedTo);
	const canClearDates = !isEdit || allowClearDates;

	const [values, setValues] = useState<ForexRateFormValues>(
		() => data ?? { from_currency: lockedFrom ?? '', to_currency: lockedTo ?? '', rate: '' },
	);
	const [errors, setErrors] = useState<ForexRateFieldErrors>({});

	const toOptions = useMemo(() => fiatOptions.filter((option) => option.value !== values.from_currency), [values.from_currency]);
	const trimmedRate = values.rate.trim();
	const rateIsValid = RATE_PATTERN.test(trimmedRate) && Number(trimmedRate) > 0;

	const validate = (): ForexRateFieldErrors => {
		const next: ForexRateFieldErrors = {};
		if (!values.from_currency || !values.to_currency) next.pair = t('billing.forexRates.modal.errors.pairRequired');
		else if (values.from_currency === values.to_currency) next.pair = t('billing.forexRates.modal.errors.pairSame');
		if (!trimmedRate) next.rate = t('billing.forexRates.modal.errors.rateRequired');
		else if (!rateIsValid) next.rate = t('billing.forexRates.modal.errors.ratePositive');
		if (showWindow) {
			const window: FxWindow = { start_date: values.start_date, end_date: values.end_date };
			if (window.start_date && window.end_date && new Date(window.start_date) >= new Date(window.end_date)) {
				next.window = t('billing.forexRates.modal.errors.windowOrder');
			} else if (existingWindows?.some((existing) => windowsOverlap(existing, window))) {
				next.window = t('billing.forexRates.modal.errors.windowOverlap');
			}
		}
		return next;
	};

	const handleSave = () => {
		const next = validate();
		setErrors(next);
		if (Object.keys(next).length > 0) return;
		const saved: ForexRateFormValues = { from_currency: values.from_currency, to_currency: values.to_currency, rate: trimmedRate };
		if (showWindow && values.start_date) saved.start_date = values.start_date;
		if (showWindow && values.end_date) saved.end_date = values.end_date;
		onSave(saved);
	};

	const setDate = (field: 'start_date' | 'end_date', date: Date | undefined) => {
		if (!date && !canClearDates) return;
		setValues((prev) => ({ ...prev, [field]: date ? date.toISOString() : undefined }));
		setErrors((prev) => ({ ...prev, window: undefined }));
	};

	return (
		<>
			<div className='grid gap-4 mt-3'>
				{pairLocked ? (
					<div className='space-y-2'>
						<Label label={t('billing.forexRates.modal.pair')} />
						<p className='text-sm font-medium text-content'>{formatFxPair(values.from_currency, values.to_currency)}</p>
					</div>
				) : (
					<div className='grid grid-cols-2 gap-4'>
						<Select
							label={t('billing.forexRates.modal.from')}
							placeholder={t('billing.forexRates.modal.selectCurrency')}
							options={fiatOptions}
							value={values.from_currency}
							onChange={(value) => {
								setValues((prev) => ({ ...prev, from_currency: value, to_currency: prev.to_currency === value ? '' : prev.to_currency }));
								setErrors((prev) => ({ ...prev, pair: undefined }));
							}}
						/>
						<Select
							label={t('billing.forexRates.modal.to')}
							placeholder={t('billing.forexRates.modal.selectCurrency')}
							options={toOptions}
							value={values.to_currency}
							onChange={(value) => {
								setValues((prev) => ({ ...prev, to_currency: value }));
								setErrors((prev) => ({ ...prev, pair: undefined }));
							}}
						/>
					</div>
				)}
				{errors.pair ? <p className='text-sm text-destructive'>{errors.pair}</p> : null}

				<Input
					label={t('billing.forexRates.modal.rate')}
					placeholder={t('billing.forexRates.modal.ratePlaceholder')}
					value={values.rate}
					onChange={(value) => {
						setValues((prev) => ({ ...prev, rate: value }));
						setErrors((prev) => ({ ...prev, rate: undefined }));
					}}
					error={errors.rate}
				/>
				{rateIsValid && values.from_currency && values.to_currency ? (
					<p className='text-sm text-content-zinc-subtle'>{formatFxRate(values.from_currency, values.to_currency, trimmedRate)}</p>
				) : null}

				{showWindow ? (
					<div className='space-y-2'>
						<div className='grid grid-cols-2 gap-4'>
							{WINDOW_FIELDS.map((field) => (
								<div key={field} className='space-y-2'>
									<Label label={field === 'start_date' ? t('billing.forexRates.modal.start') : t('billing.forexRates.modal.end')} />
									<DateTimePicker
										date={values[field] ? new Date(values[field] as string) : undefined}
										setDate={(date) => setDate(field, date)}
										placeholder={
											field === 'start_date' ? t('billing.forexRates.modal.startPlaceholder') : t('billing.forexRates.modal.endPlaceholder')
										}
									/>
									{canClearDates && values[field] ? (
										<Button variant='link' size='xs' onClick={() => setDate(field, undefined)}>
											{t('billing.forexRates.modal.clear')}
										</Button>
									) : null}
								</div>
							))}
						</div>
						<p className='text-xs text-content-zinc-subtle'>
							{canClearDates ? t('billing.forexRates.modal.windowHint') : t('billing.forexRates.modal.editWindowHint')}
						</p>
						{errors.window ? <p className='text-sm text-destructive'>{errors.window}</p> : null}
					</div>
				) : null}
			</div>
			<div className='flex justify-end gap-2 mt-6'>
				<Button variant='outline' onClick={() => onOpenChange(false)}>
					{t('billing.forexRates.modal.cancel')}
				</Button>
				<Button onClick={handleSave} isLoading={isSaving}>
					{t('billing.forexRates.modal.save')}
				</Button>
			</div>
		</>
	);
};

const ForexRateModal = ({ isOpen, ...formProps }: ForexRateModalProps) => {
	const { t } = useTranslation('settings');
	return (
		<Dialog
			isOpen={isOpen}
			showCloseButton={false}
			onOpenChange={formProps.onOpenChange}
			title={formProps.data ? t('billing.forexRates.modal.titleEdit') : t('billing.forexRates.modal.titleAdd')}
			className='sm:max-w-[520px]'>
			{isOpen ? <ForexRateForm {...formProps} /> : null}
		</Dialog>
	);
};

export default ForexRateModal;
