import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
	React.ElementRef<typeof SwitchPrimitives.Root>,
	React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
	<SwitchPrimitives.Root
		ref={ref}
		className={cn(
			'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 border-2 border-transparent',
			'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
			'disabled:cursor-not-allowed disabled:opacity-50',
			'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
			className,
		)}
		{...props}>
		<SwitchPrimitives.Thumb
			className={cn(
				'pointer-events-none block size-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200',
				'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-[1px]',
			)}
		/>
	</SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
