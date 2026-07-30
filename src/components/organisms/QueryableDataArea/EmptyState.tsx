import { Button } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import type { EmptyStateConfig } from './QueryableDataArea';
import TutorialCards from './TutorialCards';

interface EmptyStateProps {
	config: EmptyStateConfig;
}

const EmptyState = ({ config }: EmptyStateProps) => {
	// If custom component is provided, use it and still show tutorials/docs if configured
	if (config.customComponent) {
		return (
			<div className='space-y-6'>
				{config.customComponent}
				{config.tags && <ApiDocsContent tags={config.tags} />}
				{config.tutorials && config.tutorials.length > 0 && <TutorialCards tutorials={config.tutorials} />}
			</div>
		);
	}

	// Default empty state
	return (
		<div className='space-y-6'>
			<div className='bg-[#fafafa] border border-[#E9E9E9] rounded-[6px] w-full h-[360px] flex flex-col items-center justify-center mx-auto'>
				{config.heading && <div className='font-medium text-[20px] leading-normal text-gray-700 mb-4 text-center'>{config.heading}</div>}
				{config.description && (
					<div className='font-normal bg-[#F9F9F9] text-[16px] leading-normal text-gray-400 mb-8 text-center max-w-[350px]'>
						{config.description}
					</div>
				)}
				{config.buttonAction && config.buttonLabel && (
					<Button variant='outline' onClick={config.buttonAction} className='!p-5 !bg-[#fbfbfb] !border-[#CFCFCF]'>
						{config.buttonLabel}
					</Button>
				)}
			</div>
			{config.tags && <ApiDocsContent tags={config.tags} />}
			{config.tutorials && config.tutorials.length > 0 && <TutorialCards tutorials={config.tutorials} />}
		</div>
	);
};

export default EmptyState;
