import { FC, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CommitmentType } from '@/types/dto/LineItemCommitmentConfig';
import { useTranslation } from 'react-i18next';

export type CommitmentTypeSelectSize = 'default' | 'compact';

interface Props {
	value: CommitmentType;
	onChange: (value: CommitmentType) => void;
	disabled?: boolean;
	size?: CommitmentTypeSelectSize;
	label?: string;
	showLabel?: boolean;
	className?: string;
}

const CommitmentTypeSelect: FC<Props> = ({ value, onChange, disabled, size = 'default', label, showLabel = true, className }) => {
	const { t } = useTranslation('billing');
	const isCompact = size === 'compact';

	const options = useMemo(
		() => [
			{
				label: t('commitmentConfig.typeAmount'),
				value: CommitmentType.AMOUNT,
				description: t('commitmentConfig.typeAmountDescription'),
			},
			{
				label: t('commitmentConfig.typeQuantity'),
				value: CommitmentType.QUANTITY,
				description: t('commitmentConfig.typeQuantityDescription'),
			},
		],
		[t],
	);

	return (
		<div className={cn('space-y-1.5', className)}>
			{showLabel && (
				<label className={cn('font-medium text-gray-600', isCompact ? 'text-xs' : 'text-sm text-gray-700')}>
					{label ?? t('commitmentConfig.commitmentType')}
				</label>
			)}
			<div className='flex gap-2'>
				{options.map((option) => (
					<button
						key={option.value}
						type='button'
						onClick={() => onChange(option.value)}
						disabled={disabled}
						className={cn(
							'flex-1 rounded-lg border-2 text-left transition-all disabled:opacity-50',
							isCompact ? 'px-3 py-2' : 'px-4 py-3',
							value === option.value
								? 'border-primary bg-primary/5 text-primary'
								: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
							!isCompact && value === option.value && 'font-medium',
						)}>
						<div className={cn('font-medium', isCompact ? 'text-xs' : 'text-sm')}>{option.label}</div>
						<div className={cn('text-gray-500', isCompact ? 'mt-0.5 text-[11px]' : 'mt-0.5 text-xs')}>{option.description}</div>
					</button>
				))}
			</div>
		</div>
	);
};

export default CommitmentTypeSelect;
