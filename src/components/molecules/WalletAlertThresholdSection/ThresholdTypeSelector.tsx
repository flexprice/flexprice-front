import { InfoIcon, SegmentedControl } from '@/components/atoms';
import type { WalletAlertThresholdType } from '@/models/Wallet';

export interface ThresholdTypeSelectorLabels {
	thresholdType: string;
	thresholdTypeTooltip: React.ReactNode;
	absolute: string;
	percentage: string;
}

export interface ThresholdTypeSelectorProps {
	value: WalletAlertThresholdType;
	labels: ThresholdTypeSelectorLabels;
	disabled?: boolean;
	onChange: (value: WalletAlertThresholdType) => void;
}

/**
 * Picks whether the sibling threshold rows are read as absolute amounts or percentages.
 * Label left, control right on a single line, so it reads as one more settings row rather
 * than a titled subsection. A segmented control rather than a Select: it is a persistent
 * two-state mode, and both options should stay visible so the switch is one click.
 */
const ThresholdTypeSelector = ({ value, labels, disabled, onChange }: ThresholdTypeSelectorProps) => (
	<div className='flex items-center justify-between gap-4 py-2.5'>
		<div className='flex min-w-0 items-center gap-1.5'>
			<span className='text-sm font-medium text-content'>{labels.thresholdType}</span>
			{/* Never dimmed: the tooltip explains what the muted controls below will do once enabled. */}
			<InfoIcon description={labels.thresholdTypeTooltip} ariaLabel={labels.thresholdType} />
		</div>
		<SegmentedControl
			aria-label={labels.thresholdType}
			className='shrink-0'
			options={[
				{ label: labels.absolute, value: 'absolute' as WalletAlertThresholdType },
				{ label: labels.percentage, value: 'percentage' as WalletAlertThresholdType },
			]}
			value={value}
			onChange={onChange}
			disabled={disabled}
		/>
	</div>
);

export default ThresholdTypeSelector;
