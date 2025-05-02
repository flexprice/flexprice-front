import { Button, FormHeader, Modal, Spacer } from '@/components/atoms';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { Wallet } from '@/models/Wallet';
import WalletApi from '@/api/WalletApi';
import { useMutation } from '@tanstack/react-query';
import { FC } from 'react';
import toast from 'react-hot-toast';

interface WalletTerminalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	wallet?: Wallet;
}

const TerminateWalletModal: FC<WalletTerminalProps> = ({ isOpen, onOpenChange, wallet }) => {
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
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to terminate wallet');
		},
	});

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
			<div className='card bg-white max-w-lg'>
				<FormHeader
					title='Terminate Wallet'
					variant='sub-header'
					subtitle='Are you sure you want to terminate this wallet? This action cannot be undone.'
				/>
				<Spacer className='!my-6' />
				<div className='flex justify-end gap-4'>
					<Button onClick={() => onOpenChange(false)} variant={'outline'} className='btn btn-primary'>
						Cancel
					</Button>
					<Button
						disabled={isPending}
						onClick={() => {
							onOpenChange(false);
							terminateWallet();
						}}
						className='btn btn-primary'>
						Terminate
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default TerminateWalletModal;
