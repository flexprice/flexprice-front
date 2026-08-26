import { formatNumber } from '@/utils/common';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
	title: string;
	value: number;
	currency?: string;
	isPercent?: boolean;
	showChangeIndicator?: boolean;
	isNegative?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
	title,
	value,
	currency,
	isPercent = false,
	showChangeIndicator = false,
	isNegative = false,
}) => {
	const arrowColor = isNegative ? 'text-danger' : 'text-success';

	const renderValue = () => {
		if (isPercent) {
			return `${formatNumber(value, 2)}%`;
		}
		if (currency) {
			return `${getCurrencySymbol(currency)} ${formatNumber(value, 2)}`;
		}
		return formatNumber(value, 2);
	};

	return (
		<div className='flex flex-col gap-3 rounded-[var(--fp-radius-lg)] border border-line bg-surface p-[1.5625rem]'>
			<p className='text-[0.875rem] leading-[1.3125rem] text-content-tertiary font-normal'>{title}</p>
			<p className='text-[1.5rem] leading-[1.75rem] font-medium text-content flex items-center'>
				{renderValue()}
				{showChangeIndicator && (
					<span className={`inline-block ${arrowColor} ms-3`}>{isNegative ? <TrendingDown size={18} /> : <TrendingUp size={18} />}</span>
				)}
			</p>
		</div>
	);
};

export default MetricCard;
