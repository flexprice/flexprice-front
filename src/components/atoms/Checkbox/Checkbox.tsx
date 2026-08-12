import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const ShadcnCheckbox = React.forwardRef<
	React.ElementRef<typeof CheckboxPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
	<CheckboxPrimitive.Root
		ref={ref}
		className={cn(
			'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
			className,
		)}
		{...props}>
		<CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
			<Check className='h-4 w-4' />
		</CheckboxPrimitive.Indicator>
	</CheckboxPrimitive.Root>
));
ShadcnCheckbox.displayName = CheckboxPrimitive.Root.displayName;

interface Props {
	id?: string;
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	label?: string;
	description?: string;
	disabled?: boolean;
}

const Checkbox: React.FC<Props> = ({ checked, label, onCheckedChange, description, id, disabled }) => {
	return (
		<div className='items-top flex space-x-2'>
			<ShadcnCheckbox checked={checked} onCheckedChange={onCheckedChange} id={id} disabled={disabled} />
			<div className='grid gap-1.5 leading-none'>
				{label && (
					<label htmlFor={id} className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
						{label}
					</label>
				)}
				{description && <p className='text-sm text-muted-foreground'>{description}</p>}
			</div>
		</div>
	);
};

export default Checkbox;
