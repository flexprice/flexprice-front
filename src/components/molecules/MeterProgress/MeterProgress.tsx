import { cn } from '@/lib/utils';

interface MeterProgressProps {
	label: string;
	used: number;
	total: number;
	unit?: string;
	showPercentage?: boolean;
}

function getVariantColor(percent: number): string {
	if (percent > 90) return 'bg-red-500';
	if (percent > 70) return 'bg-amber-500';
	return 'bg-[#3293D9]';
}

/**
 * Progress bar for displaying usage against a total quota (e.g., API calls, credits, seats).
 * Auto-colors: <70% → brand blue, 70–90% → amber, >90% → red.
 */
const MeterProgress: React.FC<MeterProgressProps> = ({ label, used, total, unit, showPercentage = true }) => {
	const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
	const barColor = getVariantColor(percent);

	return (
		<div className='space-y-1.5'>
			<div className='flex items-center justify-between text-sm'>
				<span className='font-medium text-gray-700'>{label}</span>
				<span className='text-gray-500'>
					{used.toLocaleString()}
					{unit && ` ${unit}`} / {total.toLocaleString()}
					{unit && ` ${unit}`}
					{showPercentage && ` (${percent.toFixed(1)}%)`}
				</span>
			</div>
			<div className='w-full h-2 bg-gray-100 rounded-full overflow-hidden'>
				<div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${percent}%` }} />
			</div>
		</div>
	);
};

export default MeterProgress;
