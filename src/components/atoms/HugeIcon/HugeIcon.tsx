import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from '@hugeicons/react';
import { cn } from '@/lib/utils';

export type HugeIconData = IconSvgElement;

export type HugeIconProps = Omit<HugeiconsIconProps, 'icon'> & {
	icon: HugeIconData;
};

/**
 * Static Hugeicons renderer for chrome (nav, header, palette). Defaults match
 * the previous Lucide stroke: 20px, 1.5 weight, currentColor.
 */
const HugeIcon = ({
	icon,
	size = 20,
	strokeWidth = 1.5,
	color = 'currentColor',
	absoluteStrokeWidth = true,
	className,
	...props
}: HugeIconProps) => (
	<HugeiconsIcon
		icon={icon}
		size={size}
		strokeWidth={strokeWidth}
		color={color}
		absoluteStrokeWidth={absoluteStrokeWidth}
		className={cn('shrink-0', className)}
		{...props}
	/>
);

export default HugeIcon;
