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
	const arrowColor = isNegative ? 'text-[#DC2626]' : 'text-[#16A34A]';

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
		<div className='bg-white border border-[#E5E7EB] p-[25px] flex flex-col gap-3 rounded-md'>
			<p className='text-[14px] leading-[21px] text-[#4B5563] font-normal'>{title}</p>
			<p className='text-[24px] leading-[28px] font-medium text-[#111827] flex items-center'>
				{renderValue()}
				{showChangeIndicator && (
					<span className={`inline-block ${arrowColor} ms-3`}>{isNegative ? <TrendingDown size={18} /> : <TrendingUp size={18} />}</span>
				)}
			</p>
		</div>
	);
};

export default MetricCard;
