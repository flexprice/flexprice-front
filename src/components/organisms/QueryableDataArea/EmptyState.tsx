import { Button } from '@/components/atoms';
import type { EmptyStateConfig } from './QueryableDataArea';
import TutorialCards from './TutorialCards';

interface EmptyStateProps {
	config: EmptyStateConfig;
}

const EmptyState = ({ config }: EmptyStateProps) => {
	// If custom component is provided, use it and still show tutorials if configured
	if (config.customComponent) {
		return (
			<div className='space-y-6'>
				{config.customComponent}
				{config.tutorials && config.tutorials.length > 0 && <TutorialCards tutorials={config.tutorials} />}
			</div>
		);
	}

	// Default empty state
	return (
		<div className='space-y-6'>
			<div className='flex h-[280px] w-full flex-col items-center justify-center rounded-[var(--fp-radius-lg)] border border-line-hairline bg-surface-faint px-6 dark:border-line dark:bg-surface'>
				{config.description && (
					<div className='mb-8 max-w-xl bg-surface-faint-inner text-center text-[16px] font-normal leading-normal text-content-subtle dark:bg-transparent'>
						{config.description}
					</div>
				)}
				{config.buttonAction && config.buttonLabel && (
					<Button variant='outline' onClick={config.buttonAction} className='!p-5 !bg-surface-panel !border-line-muted'>
						{config.buttonLabel}
					</Button>
				)}
			</div>
			{config.tutorials && config.tutorials.length > 0 && <TutorialCards tutorials={config.tutorials} />}
		</div>
	);
};

export default EmptyState;
