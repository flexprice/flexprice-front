import { FC, useState, useCallback } from 'react';
import { Button } from '@/components/atoms';
import { DateTimePicker } from '@/components/atoms';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import CustomerMultiSearchSelect from '@/components/molecules/Customer/CustomerMultiSearchSelect';
import { Customer } from '@/models';
import { useSheetOutsideDismissGuards } from '@/lib/modal-scroll-lock';
import { useTranslation } from 'react-i18next';

interface ForceRunDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (startTime?: string, endTime?: string, customerExternalIds?: string[]) => void;
	isLoading?: boolean;
	/** Shows the customer picker; only the wallet ledger export filters by customer. */
	showCustomerFilter?: boolean;
}

/** Matches the backend limit on customer_external_ids. */
const MAX_CUSTOMERS = 100;

enum RunType {
	CURRENT = 'current',
	CUSTOM = 'custom',
}

type RunTypeValue = RunType;

interface ValidationErrors {
	startTime?: string;
	endTime?: string;
	customers?: string;
}

const ForceRunDrawer: FC<ForceRunDrawerProps> = ({ isOpen, onOpenChange, onConfirm, isLoading, showCustomerFilter = false }) => {
	const { t } = useTranslation('common');
	const [runType, setRunType] = useState<RunTypeValue>(RunType.CURRENT);
	const [startTime, setStartTime] = useState<Date | undefined>(undefined);
	const [endTime, setEndTime] = useState<Date | undefined>(undefined);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [errors, setErrors] = useState<ValidationErrors>({});
	const outsideDismissGuards = useSheetOutsideDismissGuards(isOpen);

	const validate = useCallback((): ValidationErrors => {
		const newErrors: ValidationErrors = {};
		if (customers.length > MAX_CUSTOMERS) newErrors.customers = t('forceRun.customersTooMany', { max: MAX_CUSTOMERS });
		if (runType === RunType.CURRENT) return newErrors;
		if (!startTime) newErrors.startTime = t('forceRun.startTimeRequired');
		if (!endTime) newErrors.endTime = t('forceRun.endTimeRequired');
		if (startTime && endTime && startTime >= endTime) {
			newErrors.endTime = t('forceRun.endAfterStart');
		}
		return newErrors;
	}, [runType, startTime, endTime, customers.length, t]);

	const handleClose = useCallback(() => {
		setRunType(RunType.CURRENT);
		setStartTime(undefined);
		setEndTime(undefined);
		setCustomers([]);
		setErrors({});
		onOpenChange(false);
	}, [onOpenChange]);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open) handleClose();
		},
		[handleClose],
	);

	const handleConfirm = useCallback(() => {
		const validationErrors = validate();
		setErrors(validationErrors);
		if (Object.keys(validationErrors).length > 0) return;

		const customerExternalIds = showCustomerFilter && customers.length > 0 ? customers.map((c) => c.external_id) : undefined;
		if (runType === RunType.CURRENT) {
			onConfirm(undefined, undefined, customerExternalIds);
			handleClose();
			return;
		}

		if (!startTime || !endTime) return;
		onConfirm(startTime.toISOString(), endTime.toISOString(), customerExternalIds);
		handleClose();
	}, [runType, startTime, endTime, customers, showCustomerFilter, validate, onConfirm, handleClose]);

	const handleCustomersChange = useCallback((selected: Customer[]) => {
		setCustomers(selected);
		setErrors((prev) => ({ ...prev, customers: undefined }));
	}, []);

	const handleStartTimeChange = useCallback((date: Date | undefined) => {
		setStartTime(date);
		setErrors((prev) => ({ ...prev, startTime: undefined }));
	}, []);

	const handleEndTimeChange = useCallback((date: Date | undefined) => {
		setEndTime(date);
		setErrors((prev) => ({ ...prev, endTime: undefined }));
	}, []);

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange} modal={false}>
			<DialogContent className='w-full max-w-md bg-surface' {...outsideDismissGuards}>
				<DialogHeader>
					<DialogTitle>{t('forceRun.title')}</DialogTitle>
					<DialogDescription>{t('forceRun.description')}</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-4'>
					<RadioGroup value={runType} onValueChange={(value) => setRunType(value as RunTypeValue)}>
						<div className='flex items-center space-x-2'>
							<RadioGroupItem value={RunType.CURRENT} id='current' />
							<Label htmlFor='current' className='font-normal cursor-pointer'>
								{t('forceRun.runCurrentInterval')}
							</Label>
						</div>
						<div className='flex items-center space-x-2'>
							<RadioGroupItem value={RunType.CUSTOM} id='custom' />
							<Label htmlFor='custom' className='font-normal cursor-pointer'>
								{t('forceRun.customDateRange')}
							</Label>
						</div>
					</RadioGroup>

					{runType === RunType.CUSTOM && (
						<div className='space-y-5 pt-3 ps-6 border-s-2 border-line'>
							<div className='space-y-1'>
								<DateTimePicker
									title={t('forceRun.startTimeLabel')}
									date={startTime}
									setDate={handleStartTimeChange}
									placeholder={t('forceRun.startTimePlaceholder')}
								/>
								{errors.startTime && <p className='text-sm text-destructive'>{errors.startTime}</p>}
							</div>

							<div className='space-y-1'>
								<DateTimePicker
									title={t('forceRun.endTimeLabel')}
									date={endTime}
									setDate={handleEndTimeChange}
									placeholder={t('forceRun.endTimePlaceholder')}
								/>
								{errors.endTime && <p className='text-sm text-destructive'>{errors.endTime}</p>}
							</div>
						</div>
					)}

					{showCustomerFilter && (
						<div className='space-y-1 pt-2'>
							<CustomerMultiSearchSelect
								value={customers}
								onChange={handleCustomersChange}
								display={{
									label: t('forceRun.customersLabel'),
									placeholder: t('forceRun.customersPlaceholder'),
									error: errors.customers,
									className: 'min-w-0',
									triggerClassName: 'min-h-11',
								}}
								options={{ modalPopover: true }}
								disabled={isLoading}
							/>
							<p className='text-xs text-content-muted'>{t('forceRun.customersHint', { max: MAX_CUSTOMERS })}</p>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={handleClose} disabled={isLoading} className='flex-1'>
						{t('actions.cancel')}
					</Button>
					<Button onClick={handleConfirm} isLoading={isLoading} className='flex-1'>
						{t('forceRun.runExport')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ForceRunDrawer;
