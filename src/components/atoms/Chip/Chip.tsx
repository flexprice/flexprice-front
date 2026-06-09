import { cn } from '@/lib/utils';
import { FC, ReactNode } from 'react';

type ChipVariant = 'default' | 'success' | 'warning' | 'failed' | 'info';

interface ChipProps {
	label?: ReactNode;
	variant?: ChipVariant;
	textColor?: string;
	bgColor?: string;
	onClick?: () => void;
	icon?: ReactNode;
	childrenAfter?: ReactNode;
	className?: string;
	disabled?: boolean;
	borderColor?: string;
}

const CHIP_VARIANT_CLASSES: Record<ChipVariant, string> = {
	success: 'bg-success-muted text-success-muted-foreground border-success-muted-foreground/20',
	default: 'bg-muted text-muted-foreground border-border',
	failed: 'bg-destructive/10 text-destructive border-destructive/20',
	info: 'bg-info-muted text-info-muted-foreground border-info-muted-foreground/20',
	warning: 'bg-warning-muted text-warning-muted-foreground border-warning-muted-foreground/20',
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
	const hasCustomColors = Boolean(textColor || bgColor || borderColor);

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
				'inline-flex items-center justify-center px-2 py-0.5 rounded-[8px] select-none font-normal transition-all border',
				!hasCustomColors && CHIP_VARIANT_CLASSES[variant],
				onClick && !disabled && 'cursor-pointer hover:opacity-90 active:scale-95',
				disabled && 'opacity-50 cursor-not-allowed',
				className,
			)}
			style={
				hasCustomColors
					? {
							backgroundColor: bgColor,
							color: textColor,
							borderColor: borderColor ?? bgColor,
						}
					: undefined
			}
			aria-disabled={disabled}>
			{icon && <span className='flex items-center text-[16px] leading-none'>{icon}</span>}
			{label && <span className={cn('leading-none text-[14px]', icon ? 'ms-1.5' : '', childrenAfter ? 'me-1.5' : '')}>{label}</span>}
			{childrenAfter && <span className='flex items-center text-[16px] leading-none'>{childrenAfter}</span>}
		</span>
	);
};

export default Chip;
