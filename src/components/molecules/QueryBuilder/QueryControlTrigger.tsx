import { Button, HugeIcon } from '@/components/atoms';
import type { HugeIconData } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
	icon: HugeIconData;
	label: string;
	count: number;
}

/** Compact filter/sort trigger: 38px icon button with a count coin when active. */
const QueryControlTrigger = forwardRef<HTMLButtonElement, Props>(
	({ icon, label, count, className, disabled, type = 'button', ...props }, ref) => {
		const { t } = useTranslation('common');

		return (
			<Button
				ref={ref}
				type={type}
				variant='outline'
				size='icon'
				disabled={disabled}
				className={cn(
					'relative size-[var(--fp-control-height)] overflow-visible border-line bg-surface p-0 shadow-none hover:bg-surface-subtle',
					'data-[state=open]:border-line-muted data-[state=open]:bg-surface-subtle',
					className,
				)}
				{...props}
				aria-label={label}>
				<HugeIcon icon={icon} size={16} />
				{count > 0 && (
					<span className='pointer-events-none absolute -right-1 -top-1.5 z-10 flex size-4 items-center justify-center rounded-full bg-info text-[0.625rem] leading-3 text-white dark:text-surface-canvas'>
						{count > 99 ? t('queryBuilder.filterCountMax') : count}
					</span>
				)}
			</Button>
		);
	},
);

QueryControlTrigger.displayName = 'QueryControlTrigger';

export default QueryControlTrigger;
