import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { LoaderCircleIcon } from 'lucide-react';
import { ReactNode } from 'react';

const buttonVariants = cva(
	'inline-flex !py-0 !my-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default: 'bg-[#3293D9] text-white shadow hover:bg-[#3293D9]/90',
				black: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
				destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
				outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
				secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-8 px-4 py-1',
				sm: 'h-8 rounded-md px-2 text-xs',
				lg: 'h-10 rounded-md px-6',
				icon: 'h-9 w-9',
				xs: 'h-6 rounded-md px-2 text-xs',
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
					<LoaderCircleIcon className='size-4 animate-spin' />
				) : (
					<>
						{prefixIcon}
						{children}
						{suffixIcon}
					</>
				)}
			</Comp>
		);
	},
);
Button.displayName = 'Button';

export default Button;
