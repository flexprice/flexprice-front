interface EmptyStateProps {
	title: string;
	description?: string;
	icon?: React.ReactNode;
}

const EmptyState = ({ title, description, icon }: EmptyStateProps) => {
	return (
		<div className='flex flex-col items-center justify-center py-16 px-4'>
			{icon && <div className='mb-3 text-zinc-300'>{icon}</div>}
			<p className='text-sm font-medium text-zinc-500 mb-1'>{title}</p>
			{description && <p className='text-xs text-zinc-400 text-center max-w-sm mt-1'>{description}</p>}
		</div>
	);
};

export default EmptyState;
