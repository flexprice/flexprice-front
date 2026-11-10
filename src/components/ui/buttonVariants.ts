import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[7px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default: 'bg-brand-fill text-content-on-brand shadow hover:opacity-90',
				destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
				outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
				secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary dark:text-info underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-9 px-4 py-2',
				sm: 'h-8 rounded-[7px] px-3 text-xs',
				lg: 'h-10 rounded-[7px] px-8',
				icon: 'h-9 w-9',
				xs: 'h-8 rounded-[7px] px-3 text-xs',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);
