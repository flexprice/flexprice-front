import React, { ReactNode } from 'react';
import { Tooltip as TooltipRoot, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TooltipProps {
	/** The element that triggers the tooltip */
	children: ReactNode;
	/** The content to display in the tooltip */
	content: ReactNode;
	/** Delay before showing tooltip in ms */
	delayDuration?: number;
	/** Side of the trigger to show tooltip */
	side?: 'top' | 'right' | 'bottom' | 'left';
	/** Alignment of the tooltip */
	align?: 'start' | 'center' | 'end';
	/** Offset from the trigger */
	sideOffset?: number;
	/** Custom className for the tooltip content */
	className?: string;
	/** When false, tooltip stays on the specified side even if it goes off-screen */
	avoidCollisions?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
	children,
	content,
	delayDuration,
	side = 'top',
	align = 'center',
	sideOffset = 4,
	className,
	avoidCollisions = true,
}) => {
	return (
		<TooltipProvider delayDuration={delayDuration}>
			<TooltipRoot>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent side={side} align={align} sideOffset={sideOffset} className={cn(className)} avoidCollisions={avoidCollisions}>
					{content}
				</TooltipContent>
			</TooltipRoot>
		</TooltipProvider>
	);
};

export default Tooltip;
