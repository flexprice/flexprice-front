import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog } from '@/components/atoms';
import { ExternalLink, Copy, CheckCircle } from 'lucide-react';

interface PaymentUrlSuccessDialogProps {
	isOpen: boolean;
	paymentUrl: string;
	isCopied: boolean;
	onClose: () => void;
	onCopyUrl: () => void;
	onGoToLink: () => void;
}

const PaymentUrlSuccessDialog: FC<PaymentUrlSuccessDialogProps> = ({
	isOpen,
	paymentUrl: _paymentUrl,
	isCopied,
	onClose,
	onCopyUrl,
	onGoToLink,
}) => {
	const { t } = useTranslation('common');
	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onClose}
			title={t('paymentLink.dialogTitle')}
			titleClassName='text-lg font-semibold text-content-zinc-bold'
			className='sm:max-w-[500px]'
			showCloseButton={false}>
			<div className='space-y-4'>
				<div className='p-4 bg-success-muted border border-success-line rounded-lg'>
					<div className='text-sm text-success-deep mb-2'>{t('paymentLink.successBanner')}</div>
				</div>

				<div className='flex gap-3'>
					<Button onClick={onGoToLink} className='flex-1' prefixIcon={<ExternalLink className='w-4 h-4' />}>
						{t('paymentLink.goToLink')}
					</Button>
					<Button
						variant='outline'
						onClick={onCopyUrl}
						className='flex-1'
						prefixIcon={isCopied ? <CheckCircle className='w-4 h-4' /> : <Copy className='w-4 h-4' />}>
						{isCopied ? t('actions.copied') : t('paymentLink.getLink')}
					</Button>
				</div>

				<div className='pt-2 flex justify-end'>
					<Button variant='outline' onClick={onClose}>
						{t('actions.close')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default PaymentUrlSuccessDialog;
