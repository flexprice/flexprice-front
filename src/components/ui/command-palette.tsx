import * as React from 'react';
import { type DialogProps } from '@radix-ui/react-dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import { Search, CornerDownLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Dialog } from '@/components/ui/dialog';

const Command = React.forwardRef<React.ElementRef<typeof CommandPrimitive>, React.ComponentPropsWithoutRef<typeof CommandPrimitive>>(
	({ className, ...props }, ref) => (
		<CommandPrimitive
			ref={ref}
			className={cn('flex h-full w-full flex-col overflow-hidden rounded-xl bg-transparent text-popover-foreground', className)}
			{...props}
		/>
	),
);
Command.displayName = CommandPrimitive.displayName;

type CommandFilter = (value: string, search: string) => number;

type CommandPaletteDialogProps = DialogProps & {
	value?: string;
	onValueChange?: (value: string) => void;
	filter?: CommandFilter;
};

const CommandPaletteDialog = ({ children, value, onValueChange, filter, open, ...props }: CommandPaletteDialogProps) => {
	const { t } = useTranslation('common');
	return (
		<Dialog open={open} {...props}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay
					className={cn(
						'fixed inset-0 z-50 bg-black/25',
						'data-[state=open]:animate-in data-[state=closed]:animate-out',
						'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
						'duration-200 ease-out',
					)}
				/>
				<DialogPrimitive.Content
					aria-label={t('commandPalette.searchAndRunCommandsAriaLabel')}
					role='dialog'
					aria-modal='true'
					className={cn(
						'fixed left-[50%] top-[18%] z-50 w-full max-w-[720px] translate-x-[-50%]',
						'bg-white dark:bg-background/90 backdrop-blur-xl',
						'shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_6px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.08)]',
						'overflow-hidden p-0 rounded-xl origin-center',
						open && 'animate-command-palette-in',
					)}>
					<Command
						value={value}
						onValueChange={onValueChange}
						filter={filter}
						className={
							'[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:first-child]:pt-2.5 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-[18px] [&_[cmdk-input-wrapper]_svg]:w-[18px] [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:!px-3 [&_[cmdk-item]]:!py-3'
						}>
						{children}
					</Command>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</Dialog>
	);
};

const CommandInput = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Input>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
	<div className='flex items-center border-b border-border/80 !p-2' cmdk-input-wrapper=''>
		<Search className='mx-3 h-5 w-5 shrink-0 text-muted-foreground' />
		<CommandPrimitive.Input
			ref={ref}
			className={cn(
				'flex h-12 w-full rounded-md bg-transparent text-base font-normal outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			{...props}
		/>
	</div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.List ref={ref} className={cn('max-h-[min(400px,60vh)] overflow-y-auto overflow-x-hidden', className)} {...props} />
));
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Empty>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => <CommandPrimitive.Empty ref={ref} className='py-6 text-center text-sm text-muted-foreground/80' {...props} />);
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Group>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Group
		ref={ref}
		className={cn(
			'overflow-hidden px-2 py-0 text-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/80',
			className,
		)}
		{...props}
	/>
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandItem = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, children, ...props }, ref) => (
	<CommandPrimitive.Item
		ref={ref}
		className={cn(
			'group relative flex cursor-default gap-2 select-none items-center rounded-md !px-3 !py-3 text-sm font-normal outline-none transition-colors',
			'data-[disabled=true]:pointer-events-none data-[selected=true]:bg-black/[0.03] dark:data-[selected=true]:bg-white/[0.08] data-[selected=true]:text-foreground data-[disabled=true]:opacity-50',
			'[&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-muted-foreground/80 [&_span:last-child_svg]:!h-4 [&_span:last-child_svg]:!w-4',
			className,
		)}
		{...props}>
		{children}
		<span
			className='ms-auto flex size-6 shrink-0 items-center justify-center rounded bg-white p-1 shadow-sm dark:bg-white/10 text-muted-foreground/90 opacity-0 transition-opacity group-data-[selected=true]:opacity-100'
			aria-hidden>
			<CornerDownLeft className='size-4' />
		</span>
	</CommandPrimitive.Item>
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

export { Command, CommandPaletteDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem };
