import React, { useState, useEffect } from 'react';
import { Dialog, Button, Input, Toggle, Select } from '@/components/atoms';
import { toast } from 'react-hot-toast';

interface WalletAlertConfig {
	threshold: {
		type: 'amount' | 'percentage';
		value: string;
	};
}

interface WalletAlertDialogProps {
	open: boolean;
	alertEnabled: boolean;
	alertConfig: WalletAlertConfig | undefined;
	onSave: (alertEnabled: boolean, alertConfig: WalletAlertConfig | undefined) => void;
	onClose: () => void;
	currency?: string;
}

const WalletAlertDialog: React.FC<WalletAlertDialogProps> = ({ open, alertEnabled, alertConfig, onSave, onClose, currency = 'USD' }) => {
	const [localAlertEnabled, setLocalAlertEnabled] = useState(alertEnabled);
	const [localAlertConfig, setLocalAlertConfig] = useState<WalletAlertConfig>(
		alertConfig || {
			threshold: {
				type: 'amount',
				value: '50.00',
			},
		},
	);

	// Sync local state with props
	useEffect(() => {
		setLocalAlertEnabled(alertEnabled);
		setLocalAlertConfig(
			alertConfig || {
				threshold: {
					type: 'amount',
					value: '50.00',
				},
			},
		);
	}, [alertEnabled, alertConfig, open]);

	const handleSave = () => {
		if (localAlertEnabled && (!localAlertConfig.threshold.value || parseFloat(localAlertConfig.threshold.value) <= 0)) {
			toast.error('Please enter a valid threshold value');
			return;
		}

		onSave(localAlertEnabled, localAlertEnabled ? localAlertConfig : undefined);
	};

	const handleClose = () => {
		// Reset to original values
		setLocalAlertEnabled(alertEnabled);
		setLocalAlertConfig(
			alertConfig || {
				threshold: {
					type: 'amount',
					value: '50.00',
				},
			},
		);
		onClose();
	};

	return (
		<Dialog
			className='min-w-max'
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleClose();
			}}
			title='Wallet Alert Settings'
			showCloseButton>
			<div className='flex flex-col gap-6 min-w-[500px]'>
				{/* Alert Toggle */}
				<Toggle
					title='Enable Alerts'
					label='Receive notifications when wallet balance is low'
					description='Get notified when your wallet balance falls below the specified threshold'
					checked={localAlertEnabled}
					onChange={setLocalAlertEnabled}
				/>

				{/* Alert Configuration */}
				{localAlertEnabled && (
					<div className='space-y-4'>
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-700'>Threshold Type</label>
							<Select
								options={[
									{ label: 'Amount', value: 'amount' },
									{ label: 'Percentage', value: 'percentage' },
								]}
								value={localAlertConfig.threshold.type}
								onChange={(value) =>
									setLocalAlertConfig({
										...localAlertConfig,
										threshold: {
											...localAlertConfig.threshold,
											type: value as 'amount' | 'percentage',
										},
									})
								}
							/>
						</div>

						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-700'>
								Threshold Value {localAlertConfig.threshold.type === 'amount' ? `(${currency})` : '(%)'}
							</label>
							<Input
								placeholder={localAlertConfig.threshold.type === 'amount' ? '0.00' : '10'}
								value={localAlertConfig.threshold.value}
								onChange={(value) =>
									setLocalAlertConfig({
										...localAlertConfig,
										threshold: {
											...localAlertConfig.threshold,
											value,
										},
									})
								}
								type='number'
								step={localAlertConfig.threshold.type === 'amount' ? '0.01' : '1'}
								min='0'
							/>
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className='flex justify-end gap-2 mt-6'>
					<Button variant='outline' onClick={handleClose}>
						Cancel
					</Button>
					<Button onClick={handleSave}>Save Changes</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default WalletAlertDialog;
