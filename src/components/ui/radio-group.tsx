import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const RadioGroup = React.forwardRef<
	React.ElementRef<typeof RadioGroupPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
	return <RadioGroupPrimitive.Root ref={ref} className={cn('flex flex-col gap-4', className)} {...props} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
	React.ElementRef<typeof RadioGroupPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => {
	return (
		<div className='flex items-center justify-start'>
			{/* Radio Button */}
			<div className='h-full flex items-center justify-center'>
				<RadioGroupPrimitive.Item
					ref={ref}
					className={cn(
						'flex items-center justify-center w-5 h-5 rounded-full border border-gray-400 bg-white text-gray-600 transition-all',
						'hover:border-black hover:shadow-sm hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black',
						'peer disabled:cursor-not-allowed disabled:opacity-50',
						className,
					)}
					{...props}>
					<RadioGroupPrimitive.Indicator className={cn('flex items-center justify-center w-full h-full bg-white rounded-full')}>
						<Circle className='size-3 text-black fill-current' />
					</RadioGroupPrimitive.Indicator>
				</RadioGroupPrimitive.Item>
			</div>

			<div>{children}</div>
		</div>
	);
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
