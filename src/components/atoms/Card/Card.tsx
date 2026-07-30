import { getTypographyClass } from '@/lib/typography';
import { cn } from '@/lib/utils';
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'notched' | 'bordered' | 'elevated' | 'warning';
	notchColor?: string;
	notchPosition?: 'left' | 'right';
	notchSize?: 'sm' | 'md' | 'lg';
	noPadding?: boolean;
	children?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
	(
		{
			className,
			variant = 'default',
			notchColor = 'zinc',
			notchPosition = 'left',
			notchSize = 'md',
			noPadding = false,
			children,
			...props
		},
		ref,
	) => {
		const notchSizes = {
			sm: 'before:w-0.5',
			md: 'before:w-[3px]',
			lg: 'before:w-1',
		};

		const getNotchColor = (color: string) => {
			const colors: Record<string, string> = {
				zinc: 'before:bg-zinc-300',
				primary: 'before:bg-primary',
				// warning: 'before:bg-red-500',
				// Add more color options as needed
			};
			return colors[color] || `before:bg-[${color}]`;
		};

		const variants = {
			default: 'border border-gray-300',
			notched: cn(
				'relative',
				'border border-gray-200 shadow-sm',
				notchPosition === 'left' ? 'ps-8' : 'pe-8',
				'before:absolute',
				notchPosition === 'left' ? 'before:left-0' : 'before:right-0',
				'before:top-6',
				'before:h-8',
				notchSizes[notchSize],
				notchPosition === 'left' ? 'before:rounded-r' : 'before:rounded-l',
				getNotchColor(notchColor),
			),
			bordered: 'border-2 border-gray-300',
			elevated: 'border border-gray-200 shadow-lg',
			warning: ' border border-red-200 text-red-600',
		};

		return (
			<div ref={ref} className={cn('rounded-[6px]', !noPadding && 'p-6', variants[variant], className)} {...props}>
				{children}
			</div>
		);
	},
);

Card.displayName = 'Card';

interface HeaderProps {
	title: string;
	subtitle?: string;
	cta?: React.ReactNode;
	className?: string;
	titleClassName?: string;
}
export const CardHeader = ({ title, subtitle, cta, className, titleClassName }: HeaderProps) => {
	return (
		<div>
			<div className={cn('flex items-center justify-between mb-4', className)}>
				<div>
					<h3 className={cn(getTypographyClass('card-header'), titleClassName)}>{title}</h3>
				</div>
				{cta && cta}
			</div>
			{subtitle && <p className={getTypographyClass('card-subtitle')}>{subtitle}</p>}
		</div>
	);
};

export default Card;
