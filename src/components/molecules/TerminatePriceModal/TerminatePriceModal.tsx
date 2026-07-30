import { FC, useState, useEffect, useMemo } from 'react';
import { Button, DatePicker } from '@/components/atoms';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Price } from '@/models';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import { useTranslation } from 'react-i18next';

interface TerminatePriceModalProps {
	planId: string;
	price?: Price;
	onCancel: () => void;
	onConfirm: (endDate: string | undefined) => void;
	isLoading?: boolean;
}

const TerminatePriceModal: FC<TerminatePriceModalProps> = ({ planId: _planId, price, onCancel, onConfirm, isLoading = false }) => {
	const { t } = useTranslation('billing');
	const [endDate, setEndDate] = useState<Date | undefined>(undefined);

	const terminationMessage = useMemo(() => {
		if (!price) return '';

		const priceName = price.meter?.name || price.description || t('termination.price.fallbackName');
		if (endDate) {
			return t('termination.price.scheduledMessage', {
				name: priceName,
				date: formatDateTimeWithSecondsAndTimezone(endDate),
			});
		}
		return t('termination.price.immediateMessage', { name: priceName });
	}, [price, endDate, t]);

	useEffect(() => {
		setEndDate(undefined);
	}, [price?.id]);

	const handleConfirm = () => {
		const endDateISO = endDate?.toISOString();
		onConfirm(endDateISO);
	};

	const handleCancel = () => {
		setEndDate(undefined);
		onCancel();
	};

	return (
		<DialogContent className='bg-white sm:max-w-[600px]'>
			<DialogHeader>
				<DialogTitle>{t('termination.price.title')}</DialogTitle>
			</DialogHeader>

			<div className='space-y-6 py-4'>
				<div className='space-y-2'>
					<DatePicker
						label={t('termination.price.effectiveDateOptional')}
						placeholder={t('termination.price.selectTerminationDate')}
						date={endDate}
						setDate={setEndDate}
						className='w-full'
					/>
					<p className='text-xs text-gray-500'>{t('termination.price.hint')}</p>
					{terminationMessage && (
						<div className='mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
							<p className='text-sm text-blue-800'>{terminationMessage}</p>
						</div>
					)}
				</div>
			</div>

			<div className='flex justify-end space-x-3 pt-4'>
				<Button variant='outline' onClick={handleCancel} disabled={isLoading}>
					{t('termination.price.cancel')}
				</Button>
				<Button onClick={handleConfirm} isLoading={isLoading}>
					{t('termination.price.terminatePrice')}
				</Button>
			</div>
		</DialogContent>
	);
};

export default TerminatePriceModal;
