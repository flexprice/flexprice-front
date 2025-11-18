import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { LoaderCircleIcon } from 'lucide-react';
import { ReactNode } from 'react';

const buttonVariants = cva(
	'inline-flex !py-0 !my-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default: 'bg-[#3D87D2]  text-white shadow hover:bg-[#3D87D2]/80 border-[#448ED8]',
				black: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
				destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
				outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
				secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-8 p-[10px] !py-[15px] !px-[10px] border  rounded-[10px]',
				sm: 'h-8 rounded-[10px] px-2 text-xs',
				lg: 'h-10 rounded-[10px] px-6',
				icon: 'h-9 w-9',
				xs: 'h-6 rounded-[10px] px-2 text-xs',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	isLoading?: boolean;
	suffixIcon?: ReactNode;
	prefixIcon?: ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, isLoading = false, children, suffixIcon, prefixIcon, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button';
		return (
			<Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={isLoading || props.disabled} {...props}>
				{isLoading ? (
					<LoaderCircleIcon className='size-4 animate-spin ' />
				) : (
					<div className='flex items-center gap-[5px]'>
						{prefixIcon}
						{children}
						{suffixIcon}
					</div>
				)}
			</Comp>
		);
	},
);
Button.displayName = 'Button';

export default Button;
