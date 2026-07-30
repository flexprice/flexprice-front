import { FC, useState, useCallback } from 'react';
import { Button } from '@/components/atoms';
import { DateTimePicker } from '@/components/atoms';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

interface ForceRunDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (startTime?: string, endTime?: string) => void;
	isLoading?: boolean;
}

enum RunType {
	CURRENT = 'current',
	CUSTOM = 'custom',
}

type RunTypeValue = RunType;

interface ValidationErrors {
	startTime?: string;
	endTime?: string;
}

const ForceRunDrawer: FC<ForceRunDrawerProps> = ({ isOpen, onOpenChange, onConfirm, isLoading }) => {
	const { t } = useTranslation('common');
	const [runType, setRunType] = useState<RunTypeValue>(RunType.CURRENT);
	const [startTime, setStartTime] = useState<Date | undefined>(undefined);
	const [endTime, setEndTime] = useState<Date | undefined>(undefined);
	const [errors, setErrors] = useState<ValidationErrors>({});

	const validate = useCallback((): ValidationErrors => {
		const newErrors: ValidationErrors = {};
		if (!startTime) newErrors.startTime = t('forceRun.startTimeRequired');
		if (!endTime) newErrors.endTime = t('forceRun.endTimeRequired');
		if (startTime && endTime && startTime >= endTime) {
			newErrors.endTime = t('forceRun.endAfterStart');
		}
		return newErrors;
	}, [startTime, endTime, t]);

	const handleClose = useCallback(() => {
		setRunType(RunType.CURRENT);
		setStartTime(undefined);
		setEndTime(undefined);
		setErrors({});
		onOpenChange(false);
	}, [onOpenChange]);

	const handleConfirm = useCallback(() => {
		if (runType === RunType.CURRENT) {
			onConfirm();
			handleClose();
			return;
		}

		const validationErrors = validate();
		setErrors(validationErrors);

		if (Object.keys(validationErrors).length === 0) {
			if (!startTime || !endTime) return;
			onConfirm(startTime.toISOString(), endTime.toISOString());
			handleClose();
		}
	}, [runType, startTime, endTime, validate, onConfirm, handleClose]);

	const handleStartTimeChange = useCallback((date: Date | undefined) => {
		setStartTime(date);
		setErrors((prev) => ({ ...prev, startTime: undefined }));
	}, []);

	const handleEndTimeChange = useCallback((date: Date | undefined) => {
		setEndTime(date);
		setErrors((prev) => ({ ...prev, endTime: undefined }));
	}, []);

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className='w-full max-w-md bg-white'>
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
						<div className='space-y-5 pt-3 ps-6 border-s-2 border-gray-200'>
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
