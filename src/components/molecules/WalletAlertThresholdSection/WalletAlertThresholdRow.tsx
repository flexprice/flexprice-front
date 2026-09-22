import { Input } from '@/components/atoms';

/**
 * Negatives are accepted rather than blocked: post-paid wallets legitimately sit below zero, and
 * an out-of-range percentage is reported by save-time validation instead of being silently clamped.
 */
const THRESHOLD_FORMAT_OPTIONS = { allowNegative: true, allowDecimals: true, thousandSeparator: ',', decimalSeparator: '.' } as const;

export interface WalletAlertThresholdRowProps {
	/** Severity name, e.g. "Critical". */
	title: string;
	/** Fixed condition copy, e.g. "Balance below". */
	description: string;
	/** Empty string means this severity has no threshold configured. */
	value: string;
	placeholder: string;
	/** Currency symbol shown before the value; omitted in percentage mode and where no currency applies. */
	symbol?: string;
	/** Unit shown after the value, e.g. '%'. Purely visual — never part of the stored value. */
	unit?: string;
	disabled?: boolean;
	onChange: (value: string) => void;
}

/**
 * One severity as a single horizontal row: fixed-width severity column, condition copy, then the
 * value input. The severity and input columns are fixed so the three rows line up as one block.
 * There is no condition picker — wallet balance alerts always fire on a falling balance.
 */
const WalletAlertThresholdRow = ({
	title,
	description,
	value,
	placeholder,
	symbol,
	unit,
	disabled,
	onChange,
}: WalletAlertThresholdRowProps) => (
	<div className='flex items-center gap-4 py-2'>
		<span className='w-24 shrink-0 text-sm font-medium text-content'>{title}</span>
		<span className='min-w-0 flex-1 truncate text-sm text-content-secondary'>{description}</span>
		<div className='w-[132px] shrink-0'>
			<Input
				aria-label={`${title} — ${description}`}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				variant='number'
				formatOptions={THRESHOLD_FORMAT_OPTIONS}
				inputMode='decimal'
				disabled={disabled}
				inputPrefix={symbol ? <span className='text-sm text-content-secondary'>{symbol}</span> : undefined}
				suffix={unit}
			/>
		</div>
	</div>
);

export default WalletAlertThresholdRow;
