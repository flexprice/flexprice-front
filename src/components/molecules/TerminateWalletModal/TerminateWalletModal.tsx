import { Button, FormHeader, Modal, Spacer } from '@/components/atoms';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { Wallet } from '@/models/Wallet';
import WalletApi from '@/api/WalletApi';
import { useMutation } from '@tanstack/react-query';
import { FC } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface WalletTerminalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	wallet?: Wallet;
}

const TerminateWalletModal: FC<WalletTerminalProps> = ({ isOpen, onOpenChange, wallet }) => {
	const { t } = useTranslation('billing');
	const { isPending, mutate: terminateWallet } = useMutation({
		mutationFn: async () => {
			return await WalletApi.terminateWallet(wallet?.id as string);
		},
		async onSuccess() {
			toast.success('Wallet terminated successfully');
			await refetchQueries(['fetchWallets']);
			await refetchQueries(['fetchWallet']);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to terminate wallet');
		},
	});

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
			<div className='card bg-white max-w-lg'>
				<FormHeader title={t('wallet.terminate.title')} variant='sub-header' subtitle={t('wallet.terminate.subtitle')} />
				<Spacer className='!my-6' />
				<div className='flex justify-end gap-4'>
					<Button onClick={() => onOpenChange(false)} variant={'outline'} className='btn btn-primary'>
						{t('wallet.terminate.cancel')}
					</Button>
					<Button
						disabled={isPending}
						onClick={() => {
							onOpenChange(false);
							terminateWallet();
						}}
						className='btn btn-primary'>
						{t('wallet.terminate.confirm')}
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default TerminateWalletModal;
