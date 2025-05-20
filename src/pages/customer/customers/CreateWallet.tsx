import { Button, FormHeader, Input, Select, Spacer } from '@/components/atoms';
import { PremiumFeature, PremiumFeatureTag } from '@/components/molecules';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { currencyOptions } from '@/constants/constants';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { cn } from '@/lib/utils';
import { Wallet } from '@/models/Wallet';
import WalletApi from '@/api/WalletApi';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { useMutation } from '@tanstack/react-query';
import { FC, useState } from 'react';
import toast from 'react-hot-toast';
import { CreateWalletPayload } from '@/types/dto';

interface Props {
	customerId: string;
	onSuccess?: (walletId: string) => void;
}

const CreateWallet: FC<Props> = ({ customerId, onSuccess = () => {} }) => {
	const [errors, setErrors] = useState({
		currency: '',
		name: '',
		initial_credits_to_load: '',
		conversion_rate: '',
	});

	const [walletPayload, setwalletPayload] = useState<Partial<CreateWalletPayload>>({
		currency: '',
		initial_credits_to_load: 0,
		conversion_rate: 1,
		name: 'prepaid-wallet',
	});

	const [autoTopup, setautoTopup] = useState(false);

	const { mutateAsync: createWallet, isPending } = useMutation({
		mutationKey: ['createWallet', customerId],
		mutationFn: async () => {
			return await WalletApi.createWallet({
				currency: walletPayload.currency!,
				customerId,
				name: walletPayload.name,
				initial_credits_to_load: walletPayload.initial_credits_to_load,
				conversion_rate: walletPayload.conversion_rate,
			});
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'An error occurred while creating wallet');
		},
		onSuccess: async (data: Wallet) => {
			toast.success('Wallet created successfully');
			onSuccess(data.id);
			await refetchQueries(['fetchWallets']);
			await refetchQueries(['fetchWalletBalances']);
			await refetchQueries(['fetchWalletsTransactions']);
		},
	});

	const handleCreateWallet = async () => {
		if (!walletPayload.name) {
			setErrors((prev) => ({ ...prev, name: 'Wallet name is required' }));
			return;
		}

		if (!walletPayload.currency) {
			setErrors((prev) => ({ ...prev, currency: 'Currency is required' }));
			return;
		}

		const wallet = await createWallet();
		return wallet.id;
	};

	return (
		<div>
			<FormHeader
				title='Create Wallet'
				subtitle={`Manage credits for usage-based billing that can apply to invoices pre-tax.`}
				variant='form-title'
			/>
			<Spacer className='!mt-4' />
			<div className='card space-y-4'>
				<FormHeader title='Wallet setup' subtitle={`Define the wallet details and the currency it will operate in.`} variant='sub-header' />
				<Input
					error={errors.name}
					value={walletPayload.name}
					onChange={(e) => setwalletPayload({ ...walletPayload, name: e })}
					label='Wallet Name'
					placeholder='Enter wallet name'
				/>

				<Select
					value={walletPayload.currency}
					options={currencyOptions}
					label='Select Currency'
					onChange={(e) => setwalletPayload({ ...walletPayload, currency: e })}
					placeholder='Select Currency'
					error={errors.currency}
				/>

				<Input
					label='Free Credits'
					suffix='credits'
					variant='formatted-number'
					placeholder='Enter Free Credits to be added to the wallet'
					value={walletPayload.initial_credits_to_load}
					onChange={(e) => {
						setwalletPayload({ ...walletPayload, initial_credits_to_load: e as unknown as number });
					}}
				/>
				<div>
					<label className={cn('font-inter block text-sm font-medium', 'text-zinc-950')}>Conversion Rate</label>
					<div className='flex items-center gap-2'>
						<div className='w-[200px]'>
							<Input className='' value={'1'} disabled suffix='credit' />
						</div>
						<span>=</span>
						<div className='w-[300px]'>
							<Input
								className='w-full'
								variant='number'
								suffix={getCurrencySymbol(walletPayload.currency || '')}
								value={walletPayload.conversion_rate}
								onChange={(e) => {
									setwalletPayload({ ...walletPayload, conversion_rate: e as unknown as number });
								}}
							/>
						</div>
					</div>
				</div>
			</div>
			<Spacer className='!mt-4' />
			<PremiumFeature isPremiumFeature>
				<div className='card relative'>
					<span className='absolute top-3 right-3'>
						<PremiumFeatureTag />
					</span>
					<FormHeader
						title='Automatic Wallet Top Up'
						subtitle={`Never run out of balance. Set up automatic top-ups to stay worry-free.`}
						variant='sub-header'
					/>
					<div className='flex items-center space-x-4 font-open-sans'>
						<Switch
							id='airplane-mode'
							checked={autoTopup}
							onCheckedChange={(value) => {
								setautoTopup(value);
							}}
						/>
						<Label htmlFor='airplane-mode'>
							<p className='font-medium text-sm text-[#18181B] peer-checked:text-black'>Recharge Wallet Automatically</p>
						</Label>
					</div>
				</div>
			</PremiumFeature>

			{autoTopup && (
				<div className='space-y-4 mt-4'>
					<Input
						variant='number'
						suffix='credits'
						inputPrefix={walletPayload.currency ? getCurrencySymbol(walletPayload.currency) : undefined}
						label='Enter minimum balance amount below which we top up '
						placeholder='Enter Minimum Balance'
					/>
					<Input
						variant='number'
						suffix='credits'
						inputPrefix={walletPayload.currency ? getCurrencySymbol(walletPayload.currency) : undefined}
						label='How much should we add?'
						placeholder='Enter Topup Amount'
						className='w-1/2'
					/>
					<div className='flex items-center space-x-2'>
						{['+100', '+500', '+1000', '+2000'].map((item) => (
							<button className='text-xs font-medium text-zinc-600 rounded-md px-2 py-[2px] bg-zinc-100'>{item}</button>
						))}
					</div>
				</div>
			)}

			{/* save wallet */}
			<Button className='!mt-4' disabled={isPending} onClick={handleCreateWallet}>
				Save Wallet
			</Button>
		</div>
	);
};

export default CreateWallet;
