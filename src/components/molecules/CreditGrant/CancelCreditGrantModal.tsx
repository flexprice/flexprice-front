import { Button, Label, DatePicker } from '@/components/atoms';
import Dialog from '@/components/atoms/Dialog';
import { useState, useCallback, useEffect } from 'react';
import { CreditGrant } from '@/models';
import { useTranslation } from 'react-i18next';

interface Props {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onConfirm: (effectiveDate: string) => void;
	onCancel: () => void;
	creditGrant: CreditGrant | null;
}

const CancelCreditGrantModal: React.FC<Props> = ({ isOpen, onOpenChange, onConfirm, onCancel, creditGrant }) => {
	const { t } = useTranslation('billing');
	const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(undefined);
	const [error, setError] = useState<string>('');

	// Reset to undefined when modal opens (will delete immediately if not set)
	useEffect(() => {
		if (isOpen) {
			setEffectiveDate(undefined);
			setError('');
		}
	}, [isOpen]);

	const handleConfirm = useCallback(() => {
		setError('');
		// Pass the effective date, or current time for immediate deletion
		onConfirm(effectiveDate ? effectiveDate.toISOString() : new Date().toISOString());
		onOpenChange(false);
		setEffectiveDate(undefined);
	}, [effectiveDate, onConfirm, onOpenChange]);

	const handleCancel = useCallback(() => {
		setError('');
		setEffectiveDate(undefined);
		onCancel();
	}, [onCancel]);

	return (
		<Dialog
			isOpen={isOpen}
			showCloseButton={false}
			onOpenChange={onOpenChange}
			title={t('creditGrant.cancelModal.title')}
			className='sm:max-w-[500px]'>
			<div className='space-y-4 mt-3'>
				<p className='text-sm text-gray-600'>{t('creditGrant.cancelModal.body', { name: creditGrant?.name ?? '' })}</p>

				<div className='space-y-2'>
					<Label label={t('creditGrant.cancelModal.effectiveDateLabel')} />
					<DatePicker
						date={effectiveDate}
						setDate={(date) => {
							setEffectiveDate(date);
							if (error) setError('');
						}}
						placeholder={t('creditGrant.cancelModal.datePlaceholder')}
					/>
					{error && <p className='text-sm text-destructive'>{error}</p>}
					<p className='text-xs text-gray-500'>{t('creditGrant.cancelModal.dateHint')}</p>
				</div>

				<div className='bg-amber-50 border border-amber-200 rounded-md p-3 mt-4'>
					<p className='text-sm text-amber-800'>
						<strong>{t('creditGrant.cancelModal.noteBold')}</strong> {t('creditGrant.cancelModal.noteRest')}
					</p>
				</div>
			</div>

			<div className='flex justify-end gap-2 mt-6'>
				<Button variant='outline' onClick={handleCancel}>
					{t('creditGrant.cancelModal.cancel')}
				</Button>
				<Button variant='destructive' onClick={handleConfirm}>
					{t('creditGrant.cancelModal.confirmDelete')}
				</Button>
			</div>
		</Dialog>
	);
};

export default CancelCreditGrantModal;
