import { FC } from 'react';
import { Button, Dialog } from '@/components/atoms';
import { CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import PaymentApi from '@/api/PaymentApi';
import toast from 'react-hot-toast';

interface MoyasarSaveCardModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	customerId: string;
}

const MoyasarSaveCardModal: FC<MoyasarSaveCardModalProps> = ({ isOpen, onOpenChange, customerId }) => {
	const { t } = useTranslation('customers');

	const { mutate: setupAutopay, isPending } = useMutation({
		mutationFn: () => PaymentApi.getMoyasarSetupIntent(customerId, window.location.href),
		onSuccess: (res) => {
			onOpenChange(false);
			window.open(res.checkout_url, '_blank');
		},
		onError: (err: Error) => {
			toast.error(err.message || t('moyasarAutopay.toastInitFailed'));
		},
	});

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={
				<span className='flex items-center gap-2'>
					<CreditCard className='size-5' />
					{t('moyasarAutopay.title')}
				</span>
			}
			className='sm:max-w-[420px]'>
			<div className='space-y-4 py-2'>
				<p className='text-sm text-gray-600'>{t('moyasarAutopay.intro')}</p>
				<Button className='w-full' onClick={() => setupAutopay()} isLoading={isPending} disabled={isPending}>
					{t('moyasarAutopay.setupCard')}
				</Button>
			</div>
		</Dialog>
	);
};

export default MoyasarSaveCardModal;
