import { Button, InfoIcon, Input, Select } from '@/components/atoms';
import type { WalletAlertThreshold } from '@/models/Wallet';
import { cn } from '@/lib/utils';

export interface WalletAlertThresholdCardLabels {
	title: string;
	description: string;
	add: string;
	remove: string;
	thresholdValue: string;
	condition: string;
	conditionBelow: string;
	conditionAbove: string;
	amountPlaceholder: string;
}

export interface WalletAlertThresholdCardProps {
	threshold: WalletAlertThreshold | null | undefined;
	labels: WalletAlertThresholdCardLabels;
	conditionDisabled?: boolean;
	disabled?: boolean;
	onAdd: () => void;
	onRemove: () => void;
	onThresholdChange: (value: string) => void;
	onConditionChange: (value: 'above' | 'below') => void;
}

const WalletAlertThresholdCard = ({
	threshold,
	labels,
	conditionDisabled,
	disabled,
	onAdd,
	onRemove,
	onThresholdChange,
	onConditionChange,
}: WalletAlertThresholdCardProps) => {
	const conditionOptions = [
		{ label: labels.conditionBelow, value: 'below' },
		{ label: labels.conditionAbove, value: 'above' },
	];

	return (
		<div className={cn('space-y-3 rounded-lg border bg-surface-subtle p-4', disabled && 'opacity-50')}>
			<div className='flex items-center justify-between gap-4'>
				<div className='flex min-w-0 items-center gap-1.5'>
					<label className='text-sm font-medium text-content'>{labels.title}</label>
					<InfoIcon description={labels.description} ariaLabel={labels.title} disabled={disabled} />
				</div>
				{threshold ? (
					<Button variant='ghost' size='sm' onClick={onRemove} disabled={disabled}>
						{labels.remove}
					</Button>
				) : (
					<Button variant='outline' size='sm' onClick={onAdd} disabled={disabled}>
						{labels.add}
					</Button>
				)}
			</div>

			{threshold && (
				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
					<div className='space-y-1'>
						<label className='text-xs font-medium text-content-secondary'>{labels.thresholdValue}</label>
						<Input
							placeholder={labels.amountPlaceholder}
							value={threshold.threshold}
							onChange={onThresholdChange}
							type='number'
							step='0.01'
							disabled={disabled}
						/>
					</div>
					<div className='space-y-1'>
						<label className='text-xs font-medium text-content-secondary'>{labels.condition}</label>
						<Select
							options={conditionOptions}
							value={threshold.condition}
							onChange={(value) => onConditionChange(value as 'above' | 'below')}
							disabled={disabled || conditionDisabled}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default WalletAlertThresholdCard;
