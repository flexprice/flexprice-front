import { cn } from '@/lib/utils';
import { FC, ReactNode } from 'react';

type ChipVariant = 'default' | 'success' | 'warning' | 'failed' | 'info';

interface ChipColorScheme {
	textColor: string;
	bgColor: string;
	borderColor: string;
}

interface ChipProps {
	/** The main content of the chip */
	label?: ReactNode;
	/** Visual style variant of the chip */
	variant?: ChipVariant;
	/** Custom text color (overrides variant) */
	textColor?: string;
	/** Custom background color (overrides variant) */
	bgColor?: string;
	/** Click handler for the chip */
	onClick?: () => void;
	/** Icon to display before the label */
	icon?: ReactNode;
	/** Additional content to display after the label */
	childrenAfter?: ReactNode;
	/** Additional CSS classes */
	className?: string;
	/** Whether the chip is disabled */
	disabled?: boolean;
	borderColor?: string;
}

const CHIP_COLORS: Record<ChipVariant, ChipColorScheme> = {
	success: { bgColor: '#ECFBE4', textColor: '#377E6A', borderColor: '#d1e9ca' },
	default: { bgColor: '#F0F2F5', textColor: '#57646E', borderColor: '#F0F2F5' },
	failed: { bgColor: '#FEE2E2', textColor: '#DC2626', borderColor: '#FEE2E2' },
	info: { bgColor: '#EFF8FF', textColor: '#2F6FE2', borderColor: '#EFF8FF' },
	warning: { bgColor: '#FFF7ED', textColor: '#C2410C', borderColor: '#FFF7ED' },
};

const Chip: FC<ChipProps> = ({
	label,
	variant = 'default',
	textColor,
	bgColor,
	onClick,
	icon,
	childrenAfter,
	className,
	disabled = false,
	borderColor,
}) => {
	const { bgColor: defaultBgColor, textColor: defaultTextColor, borderColor: defaultBorderColor } = CHIP_COLORS[variant];

	return (
		<span
			role='button'
			tabIndex={onClick && !disabled ? 0 : undefined}
			onClick={disabled ? undefined : onClick}
			onKeyDown={(e) => {
				if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
					e.preventDefault();
					onClick();
				}
			}}
			className={cn(
				'inline-flex items-center justify-center px-2 py-0.5 rounded-[8px] select-none font-normal transition-all',
				onClick && !disabled && 'cursor-pointer hover:opacity-90 active:scale-95',
				disabled && 'opacity-50 cursor-not-allowed',

				className,
			)}
			style={{
				backgroundColor: bgColor ?? defaultBgColor,
				color: textColor ?? defaultTextColor,
				border: `1px solid ${borderColor ?? defaultBorderColor}`,
			}}
			aria-disabled={disabled}>
			{icon && <span className='flex items-center text-[16px] leading-none'>{icon}</span>}
			{label && <span className={cn('leading-none text-[14px]', icon ? 'ms-1.5' : '', childrenAfter ? 'me-1.5' : '')}>{label}</span>}
			{childrenAfter && <span className='flex items-center text-[16px] leading-none'>{childrenAfter}</span>}
		</span>
	);
};

export default Chip;
